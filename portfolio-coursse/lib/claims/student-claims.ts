import { formatLimaDateTime } from "../teacher/group-config";
import { CLAIM_STATUS_LABELS, CLAIM_TYPE_LABELS } from "./inbox-helpers";
import type { StudentClaimRecord } from "./submit-claim";
import type { ClaimStatus, ClaimType } from "./validation";

export type StudentClaimStatusFilter = "all" | ClaimStatus;

export type StudentClaimTarget =
	| {
			claimType: "group_grade";
			courseName: string;
			groupPublicId: string;
			groupName: string;
			evaluationPublicId: string;
			evaluationName: string;
			performedAt: string;
			grade: number | null;
	  }
	| {
			claimType: "point_transaction";
			courseName: string;
			pointTransactionId: number;
			points: number;
			reason: string | null;
			createdAt: string;
	  };

export type StudentClaimsSummary = {
	total: number;
	pending: number;
	inReview: number;
	responded: number;
};

/**
 * Formats an ISO timestamp in `America/Lima` (`dd/mm/yyyy, HH:mm (Lima)`).
 */
export function formatClaimDateTimeLima(value: string | null): string | null {
	const formatted = formatLimaDateTime(value);
	return formatted ? `${formatted} (Lima)` : null;
}

/**
 * Groups student-visible claims by numeric `courseId`.
 */
export function groupClaimsByCourse(
	claims: ReadonlyArray<StudentClaimRecord>,
): Record<number, StudentClaimRecord[]> {
	const grouped: Record<number, StudentClaimRecord[]> = {};
	for (const claim of claims) {
		if (!grouped[claim.courseId]) {
			grouped[claim.courseId] = [];
		}
		grouped[claim.courseId].push(claim);
	}
	return grouped;
}

/**
 * Finds the unique group-grade claim matching a historical group and evaluation.
 */
export function findGroupGradeClaim(
	claims: ReadonlyArray<StudentClaimRecord>,
	target: { groupPublicId: string; evaluationPublicId: string },
): StudentClaimRecord | undefined {
	return claims.find(
		(claim) =>
			claim.claimType === "group_grade" &&
			claim.groupPublicId === target.groupPublicId &&
			claim.evaluationPublicId === target.evaluationPublicId,
	);
}

/**
 * Finds the unique point-transaction claim matching a transaction ID.
 */
export function findPointTransactionClaim(
	claims: ReadonlyArray<StudentClaimRecord>,
	pointTransactionId: number,
): StudentClaimRecord | undefined {
	return claims.find(
		(claim) =>
			claim.claimType === "point_transaction" &&
			claim.pointTransactionId === pointTransactionId,
	);
}

/**
 * Computes status counts for a course's claims.
 */
export function summarizeStudentClaims(
	claims: ReadonlyArray<StudentClaimRecord>,
): StudentClaimsSummary {
	let pending = 0;
	let inReview = 0;
	let responded = 0;

	for (const claim of claims) {
		if (claim.status === "pending") pending += 1;
		else if (claim.status === "in_review") inReview += 1;
		else if (claim.status === "responded") responded += 1;
	}

	return {
		total: claims.length,
		pending,
		inReview,
		responded,
	};
}

/**
 * Filters a course's claims by lifecycle status.
 */
export function filterStudentClaims(
	claims: ReadonlyArray<StudentClaimRecord>,
	statusFilter: StudentClaimStatusFilter,
): StudentClaimRecord[] {
	if (statusFilter === "all") return [...claims];
	return claims.filter((claim) => claim.status === statusFilter);
}

/**
 * Returns the student-facing author label without altering stored identity.
 */
export function formatClaimAuthorLabel(
	claim: Pick<StudentClaimRecord, "isSubmittedByMe" | "submittedByName">,
): string {
	if (claim.isSubmittedByMe) return "Tú";
	const name = claim.submittedByName.trim();
	return name || "Participante del grupo";
}

/**
 * Explains visibility boundaries per claim type.
 */
export function formatClaimScopeLabel(claimType: ClaimType): string {
	return claimType === "group_grade"
		? "Visible para tu grupo histórico"
		: "Privado entre tú y el docente";
}

export function getClaimStatusLabel(status: ClaimStatus): string {
	return CLAIM_STATUS_LABELS[status];
}

export function getClaimTypeLabel(claimType: ClaimType): string {
	return CLAIM_TYPE_LABELS[claimType];
}

/**
 * Formats an unambiguous summary for the claim submission dialog, preserving
 * the distinction between explicit `0` and pending (`null`).
 */
export function describeClaimTarget(target: StudentClaimTarget): {
	title: string;
	subtitle: string;
	scopeNotice: string;
} {
	if (target.claimType === "group_grade") {
		const gradeText =
			target.grade === null ? "Pendiente" : String(target.grade);
		const performedText =
			formatClaimDateTimeLima(target.performedAt) ?? target.performedAt;

		return {
			title: `${target.courseName} · ${target.evaluationName}`,
			subtitle: `Grupo histórico: ${target.groupName} · Nota: ${gradeText} · Realizada: ${performedText}`,
			scopeNotice:
				"Este reclamo representa a tu grupo histórico de la actividad, quedará visible para quienes participaron contigo en esa fecha y no modifica tu nota hasta que el docente realice una corrección expresa.",
		};
	}

	const pointsText =
		target.points > 0 ? `+${target.points}` : String(target.points);
	const reasonText = target.reason?.trim() || "Sin motivo registrado";
	const createdText =
		formatClaimDateTimeLima(target.createdAt) ?? target.createdAt;

	return {
		title: `${target.courseName} · Movimiento de puntos (${pointsText})`,
		subtitle: `Motivo: ${reasonText} · Registrado: ${createdText}`,
		scopeNotice:
			"Este reclamo es privado entre tú y el docente responsable, y no modifica tu saldo ni tus notas hasta que el docente registre un ajuste expreso.",
	};
}
