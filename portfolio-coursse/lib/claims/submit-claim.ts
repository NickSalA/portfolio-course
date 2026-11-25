import type { SupabaseClient } from "@supabase/supabase-js";
import {
	mapClaimSubmissionError,
	validateGroupGradeClaimInput,
	validatePointTransactionClaimInput,
	type ClaimStatus,
	type ClaimSubmissionErrorCode,
	type ClaimType,
} from "./validation";

export type SubmittedClaimSummary = {
	claimPublicId: string;
	claimType: ClaimType;
	status: ClaimStatus;
	created: boolean;
	createdAt: string;
};

export type SubmitClaimResult =
	| {
			ok: true;
			claim: SubmittedClaimSummary;
			created: boolean;
	  }
	| {
			ok: false;
			code: ClaimSubmissionErrorCode;
			error: string;
	  };

export type StudentClaimRecord = {
	claimPublicId: string;
	courseId: number;
	claimType: ClaimType;
	status: ClaimStatus;
	groupPublicId: string | null;
	groupName: string | null;
	evaluationPublicId: string | null;
	evaluationName: string | null;
	pointTransactionId: number | null;
	submittedByName: string;
	isSubmittedByMe: boolean;
	reason: string;
	teacherResponse: string | null;
	createdAt: string;
	inReviewAt: string | null;
	respondedAt: string | null;
};

type RawSubmittedClaimRow = {
	claim_public_id: string;
	claim_type: ClaimType;
	status: ClaimStatus;
	created: boolean;
	created_at: string;
};

type RawStudentClaimRow = {
	claim_public_id: string;
	course_id: number;
	claim_type: ClaimType;
	status: ClaimStatus;
	group_public_id: string | null;
	group_name: string | null;
	evaluation_public_id: string | null;
	evaluation_name: string | null;
	point_transaction_id: number | null;
	submitted_by_name: string;
	is_submitted_by_me: boolean;
	reason: string;
	teacher_response: string | null;
	created_at: string;
	in_review_at: string | null;
	responded_at: string | null;
};

function extractSingleRow(
	data: unknown,
): RawSubmittedClaimRow | null {
	if (Array.isArray(data)) {
		return (data[0] as RawSubmittedClaimRow | undefined) ?? null;
	}
	if (data && typeof data === "object") {
		return data as RawSubmittedClaimRow;
	}
	return null;
}

/**
 * Submits a group grade claim on behalf of historical participants of the
 * activity. Persists strictly in `pending` state without mutating grades or
 * depending on email delivery (REC-06).
 */
export async function submitGroupGradeClaim({
	supabase,
	groupPublicId,
	evaluationPublicId,
	reason,
}: {
	supabase: SupabaseClient;
	groupPublicId: string;
	evaluationPublicId: string;
	reason: string;
}): Promise<SubmitClaimResult> {
	const validated = validateGroupGradeClaimInput({
		groupPublicId,
		evaluationPublicId,
		reason,
	});
	if (!validated.ok) {
		return validated;
	}

	const { data, error } = await supabase.rpc("submit_group_grade_claim", {
		target_group_public_id: validated.value.groupPublicId,
		target_evaluation_public_id: validated.value.evaluationPublicId,
		claim_reason: validated.value.reason,
	});

	if (error) {
		const mapped = mapClaimSubmissionError(error.message, error.code);
		return { ok: false, ...mapped };
	}

	const row = extractSingleRow(data);
	if (!row?.claim_public_id) {
		return {
			ok: false,
			code: "server_error",
			error: "No se pudo confirmar el registro del reclamo grupal. Inténtalo nuevamente.",
		};
	}

	const claim: SubmittedClaimSummary = {
		claimPublicId: row.claim_public_id,
		claimType: row.claim_type,
		status: row.status,
		created: Boolean(row.created),
		createdAt: row.created_at,
	};

	return {
		ok: true,
		claim,
		created: claim.created,
	};
}

/**
 * Submits an individual point transaction claim for the owning student.
 * Persists strictly in `pending` state without mutating point balances or
 * depending on email delivery (REC-06).
 */
export async function submitPointTransactionClaim({
	supabase,
	pointTransactionId,
	reason,
}: {
	supabase: SupabaseClient;
	pointTransactionId: number;
	reason: string;
}): Promise<SubmitClaimResult> {
	const validated = validatePointTransactionClaimInput({
		pointTransactionId,
		reason,
	});
	if (!validated.ok) {
		return validated;
	}

	const { data, error } = await supabase.rpc("submit_point_transaction_claim", {
		target_point_transaction_id: validated.value.pointTransactionId,
		claim_reason: validated.value.reason,
	});

	if (error) {
		const mapped = mapClaimSubmissionError(error.message, error.code);
		return { ok: false, ...mapped };
	}

	const row = extractSingleRow(data);
	if (!row?.claim_public_id) {
		return {
			ok: false,
			code: "server_error",
			error: "No se pudo confirmar el registro del reclamo de puntos. Inténtalo nuevamente.",
		};
	}

	const claim: SubmittedClaimSummary = {
		claimPublicId: row.claim_public_id,
		claimType: row.claim_type,
		status: row.status,
		created: Boolean(row.created),
		createdAt: row.created_at,
	};

	return {
		ok: true,
		claim,
		created: claim.created,
	};
}

/**
 * Lists claims visible to the authenticated student (historical group claims
 * and own point claims), preserving submitter identity and public target IDs.
 */
export async function listStudentClaims({
	supabase,
	courseId = null,
}: {
	supabase: SupabaseClient;
	courseId?: number | null;
}): Promise<
	| { ok: true; claims: StudentClaimRecord[] }
	| { ok: false; error: string }
> {
	const { data, error } = await supabase.rpc("list_student_claims", {
		target_course_id: courseId,
	});

	if (error) {
		return {
			ok: false,
			error: "No se pudieron cargar los reclamos registrados.",
		};
	}

	const rows = Array.isArray(data) ? (data as RawStudentClaimRow[]) : [];

	return {
		ok: true,
		claims: rows.map((row) => ({
			claimPublicId: row.claim_public_id,
			courseId: Number(row.course_id),
			claimType: row.claim_type,
			status: row.status,
			groupPublicId: row.group_public_id,
			groupName: row.group_name,
			evaluationPublicId: row.evaluation_public_id,
			evaluationName: row.evaluation_name,
			pointTransactionId:
				row.point_transaction_id === null
					? null
					: Number(row.point_transaction_id),
			submittedByName: row.submitted_by_name,
			isSubmittedByMe: Boolean(row.is_submitted_by_me),
			reason: row.reason,
			teacherResponse: row.teacher_response,
			createdAt: row.created_at,
			inReviewAt: row.in_review_at,
			respondedAt: row.responded_at,
		})),
	};
}

