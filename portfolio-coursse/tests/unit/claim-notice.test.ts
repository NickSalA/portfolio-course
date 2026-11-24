import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import {
	buildClaimTeacherTargetPath,
	dispatchClaimTeacherNotice,
} from "../../lib/mail/claim-notice";

const CLAIM_UUID = "88888888-8888-4888-8888-888888888888";

const VALID_ENV: Record<string, string> = {
	SMTP_HOST: "smtp.example.test",
	SMTP_PORT: "465",
	SMTP_SECURE: "true",
	SMTP_USER: "notifier@example.test",
	SMTP_PASS: "super-secret-app-password",
	NEXT_PUBLIC_APP_URL: "https://academic.example.test",
};

function createSupabaseMock({
	prepareData,
	prepareError = null,
}: {
	prepareData: unknown;
	prepareError?: { message: string } | null;
}) {
	const rpcCalls: { name: string; args: Record<string, unknown> }[] = [];
	const client = {
		rpc(name: string, args: Record<string, unknown>) {
			rpcCalls.push({ name, args });
			if (name === "prepare_claim_email_dispatch") {
				return Promise.resolve({
					data: prepareError ? null : prepareData,
					error: prepareError,
				});
			}
			if (name === "record_claim_email_outcome") {
				return Promise.resolve({
					data: [
						{
							claim_public_id: CLAIM_UUID,
							status: args.did_send ? "sent" : "failed",
							attempt_count: 1,
							last_error_code: args.error_code ?? null,
							sent_at: args.did_send ? "2026-11-23T21:15:00Z" : null,
						},
					],
					error: null,
				});
			}
			throw new Error(`Unexpected RPC: ${name}`);
		},
	};

	return { supabase: client as unknown as SupabaseClient, rpcCalls };
}

describe("dispatchClaimTeacherNotice (REC-06)", () => {
	it("builds an authenticated relative teacher link without academic details", () => {
		expect(buildClaimTeacherTargetPath(CLAIM_UUID)).toBe(
			`/teacher/claims?claim=${CLAIM_UUID}`,
		);
	});

	it("sends a brief privacy-preserving email to the responsible teacher and records sent status", async () => {
		const { supabase, rpcCalls } = createSupabaseMock({
			prepareData: [
				{
					should_send: true,
					teacher_email: "docente@example.test",
					claim_public_id: CLAIM_UUID,
					status: "pending",
					attempt_count: 1,
				},
			],
		});

		const sentPayloads: {
			from: string;
			to: string;
			subject: string;
			text: string;
			html: string;
		}[] = [];

		const result = await dispatchClaimTeacherNotice({
			supabase,
			claimPublicId: CLAIM_UUID,
			env: VALID_ENV,
			createTransport: () => ({
				verify: async () => true,
				sendMail: async (payload) => {
					sentPayloads.push(payload);
					return { messageId: "<smtp-msg-1@example.test>" };
				},
			}),
		});

		expect(result).toEqual({
			attempted: true,
			sent: true,
			skipped: false,
			status: "sent",
			errorCode: null,
		});

		expect(sentPayloads).toHaveLength(1);
		expect(sentPayloads[0].to).toBe("docente@example.test");
		expect(sentPayloads[0].text).toContain(
			`https://academic.example.test/teacher/claims?claim=${CLAIM_UUID}`,
		);
		// Must not include secrets or academic data placeholders
		expect(sentPayloads[0].text).not.toContain("super-secret-app-password");
		expect(sentPayloads[0].html).not.toContain("super-secret-app-password");

		expect(rpcCalls[1]).toEqual({
			name: "record_claim_email_outcome",
			args: {
				target_claim_public_id: CLAIM_UUID,
				did_send: true,
				error_code: null,
				smtp_message_id: "<smtp-msg-1@example.test>",
			},
		});
	});

	it("skips duplicate dispatch without calling SMTP when already sent", async () => {
		const { supabase, rpcCalls } = createSupabaseMock({
			prepareData: [
				{
					should_send: false,
					teacher_email: null,
					claim_public_id: CLAIM_UUID,
					status: "sent",
					attempt_count: 1,
				},
			],
		});

		const sendMail = vi.fn();
		const result = await dispatchClaimTeacherNotice({
			supabase,
			claimPublicId: CLAIM_UUID,
			env: VALID_ENV,
			createTransport: () => ({
				verify: async () => true,
				sendMail,
			}),
		});

		expect(result).toEqual({
			attempted: false,
			sent: true,
			skipped: true,
			status: "sent",
			errorCode: null,
		});
		expect(sendMail).not.toHaveBeenCalled();
		expect(rpcCalls).toHaveLength(1);
	});

	it("records MAIL_CONFIG_INCOMPLETE without throwing when SMTP env is missing", async () => {
		const { supabase, rpcCalls } = createSupabaseMock({
			prepareData: [
				{
					should_send: true,
					teacher_email: "docente@example.test",
					claim_public_id: CLAIM_UUID,
					status: "pending",
					attempt_count: 1,
				},
			],
		});

		const result = await dispatchClaimTeacherNotice({
			supabase,
			claimPublicId: CLAIM_UUID,
			env: {},
		});

		expect(result).toEqual({
			attempted: true,
			sent: false,
			skipped: false,
			status: "failed",
			errorCode: "MAIL_CONFIG_INCOMPLETE",
		});
		expect(rpcCalls[1].args).toMatchObject({
			did_send: false,
			error_code: "MAIL_CONFIG_INCOMPLETE",
		});
	});

	it("records MAIL_SEND_FAILED without throwing or leaking credentials when SMTP fails", async () => {
		const { supabase, rpcCalls } = createSupabaseMock({
			prepareData: [
				{
					should_send: true,
					teacher_email: "docente@example.test",
					claim_public_id: CLAIM_UUID,
					status: "pending",
					attempt_count: 1,
				},
			],
		});

		const result = await dispatchClaimTeacherNotice({
			supabase,
			claimPublicId: CLAIM_UUID,
			env: VALID_ENV,
			createTransport: () => ({
				verify: async () => true,
				sendMail: async () => {
					throw new Error("535 Authentication failed for super-secret-app-password");
				},
			}),
		});

		expect(result).toEqual({
			attempted: true,
			sent: false,
			skipped: false,
			status: "failed",
			errorCode: "MAIL_SEND_FAILED",
		});
		expect(rpcCalls[1].args).toEqual({
			target_claim_public_id: CLAIM_UUID,
			did_send: false,
			error_code: "MAIL_SEND_FAILED",
			smtp_message_id: null,
		});
	});
});

