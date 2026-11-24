import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import {
	listTeacherClaims,
	respondToClaim,
	startClaimReview,
} from "../../lib/claims/teacher-claims";
import {
	CLAIM_RESPONSE_MAX_LENGTH,
	mapClaimTransitionError,
	validateClaimPublicId,
	validateTeacherResponse,
} from "../../lib/claims/validation";

const CLAIM_UUID = "44444444-4444-4444-8444-444444444444";
const COURSE_UUID = "55555555-5555-4555-8555-555555555555";
const GROUP_UUID = "66666666-6666-4666-8666-666666666666";
const EVAL_UUID = "77777777-7777-4777-8777-777777777777";

function createRpcMock(
	handler: (
		name: string,
		args: Record<string, unknown>,
	) => Promise<{ data: unknown; error: { message: string; code?: string } | null }>,
) {
	const calls: { name: string; args: Record<string, unknown> }[] = [];
	const client = {
		rpc(name: string, args: Record<string, unknown>) {
			calls.push({ name, args });
			return handler(name, args);
		},
	};
	return { supabase: client as unknown as SupabaseClient, calls };
}

describe("teacher claim transition validation & error mapping (REC-03)", () => {
	it("validates claim UUID and motivated response bounds", () => {
		expect(validateClaimPublicId(` ${CLAIM_UUID} `)).toEqual({
			ok: true,
			value: CLAIM_UUID,
		});
		expect(validateClaimPublicId("invalid-id")).toMatchObject({
			ok: false,
			code: "invalid_input",
		});

		expect(validateTeacherResponse("  Se revisó la evidencia.  ")).toEqual({
			ok: true,
			value: "Se revisó la evidencia.",
		});
		expect(validateTeacherResponse("   ")).toMatchObject({
			ok: false,
			code: "invalid_input",
		});
		expect(
			validateTeacherResponse("x".repeat(CLAIM_RESPONSE_MAX_LENGTH + 1)),
		).toMatchObject({
			ok: false,
			code: "invalid_input",
		});
	});

	it("maps ordered transition, finality, and permission errors clearly", () => {
		expect(mapClaimTransitionError("claim_must_be_in_review", "23514")).toMatchObject({
			code: "invalid_state",
		});
		expect(mapClaimTransitionError("claim_response_is_final", "23514")).toMatchObject({
			code: "already_final",
		});
		expect(mapClaimTransitionError("claim_teacher_access_denied", "42501")).toMatchObject({
			code: "forbidden",
		});
		expect(mapClaimTransitionError("claim_not_found", "P0002")).toMatchObject({
			code: "not_found",
		});
	});
});

describe("startClaimReview, respondToClaim & listTeacherClaims (REC-03)", () => {
	it("transitions pending -> in_review and handles idempotent repeated review start", async () => {
		let count = 0;
		const { supabase } = createRpcMock(async (name, args) => {
			expect(name).toBe("start_claim_review");
			expect(args).toEqual({ target_claim_public_id: CLAIM_UUID });
			count += 1;
			return {
				data: [
					{
						claim_public_id: CLAIM_UUID,
						status: "in_review",
						transitioned: count === 1,
						in_review_at: "2026-11-23T21:00:00Z",
					},
				],
				error: null,
			};
		});

		const first = await startClaimReview({ supabase, claimPublicId: CLAIM_UUID });
		const second = await startClaimReview({ supabase, claimPublicId: CLAIM_UUID });

		expect(first).toEqual({
			ok: true,
			claimPublicId: CLAIM_UUID,
			status: "in_review",
			transitioned: true,
			inReviewAt: "2026-11-23T21:00:00Z",
		});
		expect(second).toMatchObject({
			ok: true,
			status: "in_review",
			transitioned: false,
		});
	});

	it("enforces in_review before responded and rejects reopening responded claims", async () => {
		const skipMock = createRpcMock(async () => ({
			data: null,
			error: { message: "claim_must_be_in_review", code: "23514" },
		}));
		expect(
			await respondToClaim({
				supabase: skipMock.supabase,
				claimPublicId: CLAIM_UUID,
				response: "Respuesta saltando revisión",
			}),
		).toMatchObject({ ok: false, code: "invalid_state" });

		const finalMock = createRpcMock(async () => ({
			data: null,
			error: { message: "claim_response_is_final", code: "23514" },
		}));
		expect(
			await respondToClaim({
				supabase: finalMock.supabase,
				claimPublicId: CLAIM_UUID,
				response: "Intento de nueva respuesta",
			}),
		).toMatchObject({ ok: false, code: "already_final" });
	});

	it("emits a final motivated response without altering academic records", async () => {
		const { supabase, calls } = createRpcMock(async (name, args) => {
			expect(name).toBe("respond_to_claim");
			expect(args).toEqual({
				target_claim_public_id: CLAIM_UUID,
				response_text: "Corresponde revisión; se actualizará en Notas por separado.",
			});
			return {
				data: [
					{
						claim_public_id: CLAIM_UUID,
						status: "responded",
						teacher_response:
							"Corresponde revisión; se actualizará en Notas por separado.",
						responded_at: "2026-11-23T21:10:00Z",
					},
				],
				error: null,
			};
		});

		const result = await respondToClaim({
			supabase,
			claimPublicId: CLAIM_UUID,
			response: "  Corresponde revisión; se actualizará en Notas por separado.  ",
		});

		expect(result).toEqual({
			ok: true,
			claimPublicId: CLAIM_UUID,
			status: "responded",
			teacherResponse:
				"Corresponde revisión; se actualizará en Notas por separado.",
			respondedAt: "2026-11-23T21:10:00Z",
		});
		expect(calls).toHaveLength(1);
	});

	it("normalizes teacher inbox rows via listTeacherClaims", async () => {
		const { supabase } = createRpcMock(async (name, args) => {
			expect(name).toBe("list_teacher_claims");
			expect(args).toEqual({ target_course_id: 7 });
			return {
				data: [
					{
						claim_public_id: CLAIM_UUID,
						course_id: 7,
						course_public_id: COURSE_UUID,
						course_name: "Algoritmos",
						period_code: "2026-II",
						claim_type: "group_grade",
						status: "in_review",
						group_public_id: GROUP_UUID,
						group_name: "Grupo 1",
						evaluation_public_id: EVAL_UUID,
						evaluation_name: "T1",
						evaluation_performed_at: "2026-11-10T15:00:00Z",
						group_grade: "14.00",
						point_transaction_id: null,
						point_amount: null,
						point_reason: null,
						point_is_voided: null,
						point_created_at: null,
						submitted_by_name: "Ana Pérez",
						submitted_by_email: "ana@example.test",
						reason: "Revisar criterio 2",
						teacher_response: null,
						reviewed_by_name: "Docente Uno",
						created_at: "2026-11-23T20:00:00Z",
						in_review_at: "2026-11-23T20:30:00Z",
						responded_at: null,
					},
				],
				error: null,
			};
		});

		const result = await listTeacherClaims({ supabase, courseId: 7 });
		expect(result).toMatchObject({
			ok: true,
			claims: [
				{
					claimPublicId: CLAIM_UUID,
					courseId: 7,
					courseName: "Algoritmos",
					claimType: "group_grade",
					status: "in_review",
					groupGrade: 14,
					submittedByName: "Ana Pérez",
				},
			],
		});
	});
});

