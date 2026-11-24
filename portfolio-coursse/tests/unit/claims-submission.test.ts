import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import {
	listStudentClaims,
	submitGroupGradeClaim,
	submitPointTransactionClaim,
} from "../../lib/claims/submit-claim";
import {
	CLAIM_REASON_MAX_LENGTH,
	mapClaimSubmissionError,
	validateGroupGradeClaimInput,
	validatePointTransactionClaimInput,
} from "../../lib/claims/validation";

const GROUP_UUID = "11111111-1111-4111-8111-111111111111";
const EVAL_UUID = "22222222-2222-4222-8222-222222222222";
const CLAIM_UUID = "33333333-3333-4333-8333-333333333333";

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

describe("claims validation & error mapping (REC-02)", () => {
	it("validates group claim UUIDs and trimmed reason bounds", () => {
		expect(
			validateGroupGradeClaimInput({
				groupPublicId: ` ${GROUP_UUID} `,
				evaluationPublicId: EVAL_UUID,
				reason: "  Faltó revisar el anexo 2  ",
			}),
		).toEqual({
			ok: true,
			value: {
				groupPublicId: GROUP_UUID,
				evaluationPublicId: EVAL_UUID,
				reason: "Faltó revisar el anexo 2",
			},
		});

		expect(
			validateGroupGradeClaimInput({
				groupPublicId: "bad-uuid",
				evaluationPublicId: EVAL_UUID,
				reason: "Motivo válido",
			}),
		).toMatchObject({ ok: false, code: "invalid_input" });

		expect(
			validateGroupGradeClaimInput({
				groupPublicId: GROUP_UUID,
				evaluationPublicId: EVAL_UUID,
				reason: "   ",
			}),
		).toMatchObject({ ok: false, code: "invalid_input" });

		expect(
			validateGroupGradeClaimInput({
				groupPublicId: GROUP_UUID,
				evaluationPublicId: EVAL_UUID,
				reason: "a".repeat(CLAIM_REASON_MAX_LENGTH + 1),
			}),
		).toMatchObject({ ok: false, code: "invalid_input" });
	});

	it("validates point transaction positive integer id and reason", () => {
		expect(
			validatePointTransactionClaimInput({
				pointTransactionId: 42,
				reason: "El descuento fue duplicado",
			}),
		).toEqual({
			ok: true,
			value: {
				pointTransactionId: 42,
				reason: "El descuento fue duplicado",
			},
		});

		for (const badId of [0, -5, 1.5, Number.NaN]) {
			expect(
				validatePointTransactionClaimInput({
					pointTransactionId: badId,
					reason: "Motivo válido",
				}),
			).toMatchObject({ ok: false, code: "invalid_input" });
		}
	});

	it("maps PostgreSQL constraint and permission errors to clear user messages", () => {
		expect(mapClaimSubmissionError("claim_already_exists", "23505")).toMatchObject({
			code: "conflict",
		});
		expect(mapClaimSubmissionError("claim_group_access_denied", "42501")).toMatchObject({
			code: "forbidden",
		});
		expect(mapClaimSubmissionError("claim_point_access_denied", "42501")).toMatchObject({
			code: "forbidden",
		});
		expect(mapClaimSubmissionError("course_not_active", "23514")).toMatchObject({
			code: "course_inactive",
		});
		expect(mapClaimSubmissionError("claim_target_not_found", "P0002")).toMatchObject({
			code: "not_found",
		});
	});
});

describe("submitGroupGradeClaim & submitPointTransactionClaim (REC-02)", () => {
	it("submits a pending group grade claim and handles idempotent retry without duplication", async () => {
		let attempts = 0;
		const { supabase, calls } = createRpcMock(async (name) => {
			expect(name).toBe("submit_group_grade_claim");
			attempts += 1;
			return {
				data: [
					{
						claim_public_id: CLAIM_UUID,
						claim_type: "group_grade",
						status: "pending",
						created: attempts === 1,
						created_at: "2026-11-23T20:00:00Z",
					},
				],
				error: null,
			};
		});

		const first = await submitGroupGradeClaim({
			supabase,
			groupPublicId: GROUP_UUID,
			evaluationPublicId: EVAL_UUID,
			reason: "Revisar rúbrica de T1",
		});
		const retry = await submitGroupGradeClaim({
			supabase,
			groupPublicId: GROUP_UUID,
			evaluationPublicId: EVAL_UUID,
			reason: "  Revisar rúbrica de T1  ",
		});

		expect(first).toEqual({
			ok: true,
			created: true,
			claim: {
				claimPublicId: CLAIM_UUID,
				claimType: "group_grade",
				status: "pending",
				created: true,
				createdAt: "2026-11-23T20:00:00Z",
			},
		});
		expect(retry).toEqual({
			ok: true,
			created: false,
			claim: {
				claimPublicId: CLAIM_UUID,
				claimType: "group_grade",
				status: "pending",
				created: false,
				createdAt: "2026-11-23T20:00:00Z",
			},
		});
		expect(calls).toHaveLength(2);
		expect(calls[0].args).toEqual({
			target_group_public_id: GROUP_UUID,
			target_evaluation_public_id: EVAL_UUID,
			claim_reason: "Revisar rúbrica de T1",
		});
	});

	it("rejects duplicate group claim from another participant with conflict", async () => {
		const { supabase } = createRpcMock(async () => ({
			data: null,
			error: { message: "claim_already_exists", code: "23505" },
		}));

		const result = await submitGroupGradeClaim({
			supabase,
			groupPublicId: GROUP_UUID,
			evaluationPublicId: EVAL_UUID,
			reason: "Otro motivo",
		});
		expect(result).toMatchObject({ ok: false, code: "conflict" });
	});

	it("submits a pending point transaction claim and maps unauthorized access cleanly", async () => {
		const okMock = createRpcMock(async (name, args) => {
			expect(name).toBe("submit_point_transaction_claim");
			expect(args).toEqual({
				target_point_transaction_id: 99,
				claim_reason: "Puntos de participación faltantes",
			});
			return {
				data: [
					{
						claim_public_id: CLAIM_UUID,
						claim_type: "point_transaction",
						status: "pending",
						created: true,
						created_at: "2026-11-23T20:05:00Z",
					},
				],
				error: null,
			};
		});

		const created = await submitPointTransactionClaim({
			supabase: okMock.supabase,
			pointTransactionId: 99,
			reason: "Puntos de participación faltantes",
		});
		expect(created).toMatchObject({
			ok: true,
			created: true,
			claim: { claimType: "point_transaction", status: "pending" },
		});

		const deniedMock = createRpcMock(async () => ({
			data: null,
			error: { message: "claim_point_access_denied", code: "42501" },
		}));
		const denied = await submitPointTransactionClaim({
			supabase: deniedMock.supabase,
			pointTransactionId: 99,
			reason: "Movimiento de otro alumno",
		});
		expect(denied).toMatchObject({ ok: false, code: "forbidden" });
	});

	it("lists visible historical group and own point claims via listStudentClaims", async () => {
		const { supabase } = createRpcMock(async (name, args) => {
			expect(name).toBe("list_student_claims");
			expect(args).toEqual({ target_course_id: 12 });
			return {
				data: [
					{
						claim_public_id: CLAIM_UUID,
						course_id: 12,
						claim_type: "group_grade",
						status: "pending",
						group_public_id: GROUP_UUID,
						group_name: "Grupo 1",
						evaluation_public_id: EVAL_UUID,
						evaluation_name: "T1",
						point_transaction_id: null,
						submitted_by_name: "QA Student 1",
						is_submitted_by_me: false,
						reason: "Revisar criterio 3",
						teacher_response: null,
						created_at: "2026-11-23T20:00:00Z",
						in_review_at: null,
						responded_at: null,
					},
				],
				error: null,
			};
		});

		const result = await listStudentClaims({ supabase, courseId: 12 });
		expect(result).toEqual({
			ok: true,
			claims: [
				{
					claimPublicId: CLAIM_UUID,
					courseId: 12,
					claimType: "group_grade",
					status: "pending",
					groupPublicId: GROUP_UUID,
					groupName: "Grupo 1",
					evaluationPublicId: EVAL_UUID,
					evaluationName: "T1",
					pointTransactionId: null,
					submittedByName: "QA Student 1",
					isSubmittedByMe: false,
					reason: "Revisar criterio 3",
					teacherResponse: null,
					createdAt: "2026-11-23T20:00:00Z",
					inReviewAt: null,
					respondedAt: null,
				},
			],
		});
	});
});

