import type { SupabaseClient } from "@supabase/supabase-js";
import {
	mapClaimTransitionError,
	validateClaimPublicId,
	validateTeacherResponse,
	type ClaimStatus,
	type ClaimTransitionErrorCode,
	type ClaimType,
} from "./validation";

export type StartReviewResult =
	| {
			ok: true;
			claimPublicId: string;
			status: ClaimStatus;
			transitioned: boolean;
			inReviewAt: string;
	  }
	| {
			ok: false;
			code: ClaimTransitionErrorCode;
			error: string;
	  };

export type RespondClaimResult =
	| {
			ok: true;
			claimPublicId: string;
			status: ClaimStatus;
			teacherResponse: string;
			respondedAt: string;
	  }
	| {
			ok: false;
			code: ClaimTransitionErrorCode;
			error: string;
	  };

export type TeacherClaimItem = {
	claimPublicId: string;
	courseId: number;
	coursePublicId: string;
	courseName: string;
	periodCode: string | null;
	claimType: ClaimType;
	status: ClaimStatus;
	groupPublicId: string | null;
	groupName: string | null;
	evaluationPublicId: string | null;
	evaluationName: string | null;
	evaluationPerformedAt: string | null;
	groupGrade: number | null;
	pointTransactionId: number | null;
	pointAmount: number | null;
	pointReason: string | null;
	pointIsVoided: boolean | null;
	pointCreatedAt: string | null;
	submittedByName: string;
	submittedByEmail: string;
	reason: string;
	teacherResponse: string | null;
	reviewedByName: string | null;
	createdAt: string;
	inReviewAt: string | null;
	respondedAt: string | null;
};

type RawStartReviewRow = {
	claim_public_id: string;
	status: ClaimStatus;
	transitioned: boolean;
	in_review_at: string;
};

type RawRespondRow = {
	claim_public_id: string;
	status: ClaimStatus;
	teacher_response: string;
	responded_at: string;
};

type RawTeacherClaimRow = {
	claim_public_id: string;
	course_id: number;
	course_public_id: string;
	course_name: string;
	period_code: string | null;
	claim_type: ClaimType;
	status: ClaimStatus;
	group_public_id: string | null;
	group_name: string | null;
	evaluation_public_id: string | null;
	evaluation_name: string | null;
	evaluation_performed_at: string | null;
	group_grade: number | string | null;
	point_transaction_id: number | null;
	point_amount: number | null;
	point_reason: string | null;
	point_is_voided: boolean | null;
	point_created_at: string | null;
	submitted_by_name: string;
	submitted_by_email: string;
	reason: string;
	teacher_response: string | null;
	reviewed_by_name: string | null;
	created_at: string;
	in_review_at: string | null;
	responded_at: string | null;
};

function firstRow<T>(data: unknown): T | null {
	if (Array.isArray(data)) {
		return (data[0] as T | undefined) ?? null;
	}
	if (data && typeof data === "object") {
		return data as T;
	}
	return null;
}

function parseOptionalNumber(
	raw: number | string | null | undefined,
): number | null {
	if (raw === null || raw === undefined) return null;
	if (typeof raw === "string" && raw.trim() === "") return null;
	const value = Number(raw);
	return Number.isFinite(value) ? value : null;
}

/**
 * Transitions a teacher-owned claim from `pending` to `in_review` (idempotent
 * if already `in_review`; rejects `responded`).
 */
export async function startClaimReview({
	supabase,
	claimPublicId,
}: {
	supabase: SupabaseClient;
	claimPublicId: string;
}): Promise<StartReviewResult> {
	const validatedId = validateClaimPublicId(claimPublicId);
	if (!validatedId.ok) {
		return validatedId;
	}

	const { data, error } = await supabase.rpc("start_claim_review", {
		target_claim_public_id: validatedId.value,
	});

	if (error) {
		const mapped = mapClaimTransitionError(error.message, error.code);
		return { ok: false, ...mapped };
	}

	const row = firstRow<RawStartReviewRow>(data);
	if (!row?.claim_public_id) {
		return {
			ok: false,
			code: "server_error",
			error: "No se pudo confirmar el paso a «En revisión». Inténtalo nuevamente.",
		};
	}

	return {
		ok: true,
		claimPublicId: row.claim_public_id,
		status: row.status,
		transitioned: Boolean(row.transitioned),
		inReviewAt: row.in_review_at,
	};
}

/**
 * Emits a final motivated teacher response (`in_review -> responded`).
 * Never mutates group grades or point transactions automatically.
 */
export async function respondToClaim({
	supabase,
	claimPublicId,
	response,
}: {
	supabase: SupabaseClient;
	claimPublicId: string;
	response: string;
}): Promise<RespondClaimResult> {
	const validatedId = validateClaimPublicId(claimPublicId);
	if (!validatedId.ok) {
		return validatedId;
	}

	const validatedResponse = validateTeacherResponse(response);
	if (!validatedResponse.ok) {
		return validatedResponse;
	}

	const { data, error } = await supabase.rpc("respond_to_claim", {
		target_claim_public_id: validatedId.value,
		response_text: validatedResponse.value,
	});

	if (error) {
		const mapped = mapClaimTransitionError(error.message, error.code);
		return { ok: false, ...mapped };
	}

	const row = firstRow<RawRespondRow>(data);
	if (!row?.claim_public_id) {
		return {
			ok: false,
			code: "server_error",
			error: "No se pudo confirmar el registro de la respuesta final. Inténtalo nuevamente.",
		};
	}

	return {
		ok: true,
		claimPublicId: row.claim_public_id,
		status: row.status,
		teacherResponse: row.teacher_response,
		respondedAt: row.responded_at,
	};
}

/**
 * Lists claims across courses owned by the authenticated teacher with full
 * historical grade/point context for inbox and detail views (REC-03/REC-05).
 */
export async function listTeacherClaims({
	supabase,
	courseId = null,
}: {
	supabase: SupabaseClient;
	courseId?: number | null;
}): Promise<
	{ ok: true; claims: TeacherClaimItem[] } | { ok: false; error: string }
> {
	const { data, error } = await supabase.rpc("list_teacher_claims", {
		target_course_id: courseId,
	});

	if (error) {
		return {
			ok: false,
			error: "No se pudieron cargar los reclamos de tus cursos.",
		};
	}

	const rows = Array.isArray(data) ? (data as RawTeacherClaimRow[]) : [];

	return {
		ok: true,
		claims: rows.map((row) => ({
			claimPublicId: row.claim_public_id,
			courseId: Number(row.course_id),
			coursePublicId: row.course_public_id,
			courseName: row.course_name,
			periodCode: row.period_code,
			claimType: row.claim_type,
			status: row.status,
			groupPublicId: row.group_public_id,
			groupName: row.group_name,
			evaluationPublicId: row.evaluation_public_id,
			evaluationName: row.evaluation_name,
			evaluationPerformedAt: row.evaluation_performed_at,
			groupGrade: parseOptionalNumber(row.group_grade),
			pointTransactionId: parseOptionalNumber(row.point_transaction_id),
			pointAmount: parseOptionalNumber(row.point_amount),
			pointReason: row.point_reason,
			pointIsVoided: row.point_is_voided,
			pointCreatedAt: row.point_created_at,
			submittedByName: row.submitted_by_name,
			submittedByEmail: row.submitted_by_email,
			reason: row.reason,
			teacherResponse: row.teacher_response,
			reviewedByName: row.reviewed_by_name,
			createdAt: row.created_at,
			inReviewAt: row.in_review_at,
			respondedAt: row.responded_at,
		})),
	};
}

