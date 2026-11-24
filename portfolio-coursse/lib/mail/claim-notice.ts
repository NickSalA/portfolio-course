import type { SupabaseClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { readMailConfig, type MailConfig } from "./config";
import { buildTeacherNoticeEmail } from "./notice-template";
import type { MailTransportLike, TransportFactory } from "./send-test-notice";

export type ClaimNotificationErrorCode =
	| "MAIL_CONFIG_INCOMPLETE"
	| "MAIL_RECIPIENT_MISSING"
	| "MAIL_SEND_FAILED"
	| "MAIL_DISPATCH_ERROR";

export type ClaimNotificationStatus = "pending" | "sent" | "failed";

export type ClaimNoticeDispatchResult = {
	attempted: boolean;
	sent: boolean;
	skipped: boolean;
	status: ClaimNotificationStatus;
	errorCode: ClaimNotificationErrorCode | null;
};

type RawPrepareRow = {
	should_send: boolean;
	teacher_email: string | null;
	claim_public_id: string;
	status: ClaimNotificationStatus;
	attempt_count: number;
};

function defaultTransportFactory(config: MailConfig): MailTransportLike {
	return nodemailer.createTransport({
		host: config.host,
		port: config.port,
		secure: config.secure,
		auth: {
			user: config.user,
			pass: config.pass,
		},
	});
}

function firstRow<T>(data: unknown): T | null {
	if (Array.isArray(data)) {
		return (data[0] as T | undefined) ?? null;
	}
	if (data && typeof data === "object") {
		return data as T;
	}
	return null;
}

/**
 * Builds the authenticated teacher deep-link for a claim without exposing any
 * student name, grade, points, or claim text.
 */
export function buildClaimTeacherTargetPath(claimPublicId: string): string {
	return `/teacher/claims?claim=${encodeURIComponent(claimPublicId.trim())}`;
}

/**
 * Dispatches (or retries) the brief teacher email notice for a claim.
 *
 * Guarantees (REC-06):
 * - Never throws: a mail failure never loses or blocks the persisted claim.
 * - Never sends a second logical notice once marked `sent`.
 * - Email contains only generic text + authenticated teacher link (no grades,
 *   points, student identities, or claim body).
 * - Logs only non-sensitive technical metadata (`claimPublicId`, outcome, code).
 */
export async function dispatchClaimTeacherNotice({
	supabase,
	claimPublicId,
	env = process.env,
	createTransport = defaultTransportFactory,
}: {
	supabase: SupabaseClient;
	claimPublicId: string;
	env?: Record<string, string | undefined>;
	createTransport?: TransportFactory;
}): Promise<ClaimNoticeDispatchResult> {
	try {
		const { data: prepData, error: prepError } = await supabase.rpc(
			"prepare_claim_email_dispatch",
			{ target_claim_public_id: claimPublicId },
		);

		if (prepError) {
			console.warn("claim_email_notice", {
				claimPublicId,
				outcome: "prepare_failed",
				errorCode: "MAIL_DISPATCH_ERROR",
			});
			return {
				attempted: false,
				sent: false,
				skipped: false,
				status: "failed",
				errorCode: "MAIL_DISPATCH_ERROR",
			};
		}

		const prep = firstRow<RawPrepareRow>(prepData);
		if (!prep || !prep.should_send) {
			return {
				attempted: false,
				sent: prep?.status === "sent",
				skipped: true,
				status: prep?.status ?? "pending",
				errorCode: null,
			};
		}

		const configResult = readMailConfig(env);
		if (!configResult.ok) {
			await supabase.rpc("record_claim_email_outcome", {
				target_claim_public_id: claimPublicId,
				did_send: false,
				error_code: "MAIL_CONFIG_INCOMPLETE",
				smtp_message_id: null,
			});
			console.warn("claim_email_notice", {
				claimPublicId,
				outcome: "failed",
				errorCode: "MAIL_CONFIG_INCOMPLETE",
			});
			return {
				attempted: true,
				sent: false,
				skipped: false,
				status: "failed",
				errorCode: "MAIL_CONFIG_INCOMPLETE",
			};
		}

		const recipient = prep.teacher_email?.trim() || "";
		if (!recipient) {
			await supabase.rpc("record_claim_email_outcome", {
				target_claim_public_id: claimPublicId,
				did_send: false,
				error_code: "MAIL_RECIPIENT_MISSING",
				smtp_message_id: null,
			});
			console.warn("claim_email_notice", {
				claimPublicId,
				outcome: "failed",
				errorCode: "MAIL_RECIPIENT_MISSING",
			});
			return {
				attempted: true,
				sent: false,
				skipped: false,
				status: "failed",
				errorCode: "MAIL_RECIPIENT_MISSING",
			};
		}

		const notice = buildTeacherNoticeEmail({
			appUrl: configResult.config.appUrl,
			targetPath: buildClaimTeacherTargetPath(claimPublicId),
		});

		try {
			const transport = createTransport(configResult.config);
			const info = await transport.sendMail({
				from: configResult.config.from,
				to: recipient,
				subject: notice.subject,
				text: notice.text,
				html: notice.html,
			});

			await supabase.rpc("record_claim_email_outcome", {
				target_claim_public_id: claimPublicId,
				did_send: true,
				error_code: null,
				smtp_message_id: info.messageId ?? null,
			});

			console.info("claim_email_notice", {
				claimPublicId,
				outcome: "sent_to_smtp",
				errorCode: null,
			});

			return {
				attempted: true,
				sent: true,
				skipped: false,
				status: "sent",
				errorCode: null,
			};
		} catch {
			await supabase.rpc("record_claim_email_outcome", {
				target_claim_public_id: claimPublicId,
				did_send: false,
				error_code: "MAIL_SEND_FAILED",
				smtp_message_id: null,
			});
			console.warn("claim_email_notice", {
				claimPublicId,
				outcome: "failed",
				errorCode: "MAIL_SEND_FAILED",
			});
			return {
				attempted: true,
				sent: false,
				skipped: false,
				status: "failed",
				errorCode: "MAIL_SEND_FAILED",
			};
		}
	} catch {
		console.warn("claim_email_notice", {
			claimPublicId,
			outcome: "failed",
			errorCode: "MAIL_DISPATCH_ERROR",
		});
		return {
			attempted: false,
			sent: false,
			skipped: false,
			status: "failed",
			errorCode: "MAIL_DISPATCH_ERROR",
		};
	}
}

