import type { TeacherClaimItem } from "./teacher-claims";
import type { ClaimStatus, ClaimType } from "./validation";

export type ClaimStatusFilter = "all" | ClaimStatus;
export type ClaimTypeFilter = "all" | ClaimType;

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
	pending: "Pendiente",
	in_review: "En revisión",
	responded: "Respondido",
};

export const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
	group_grade: "Nota grupal",
	point_transaction: "Puntos",
};

export const NOTIFICATION_STATUS_LABELS: Record<
	"pending" | "sent" | "failed",
	string
> = {
	pending: "Aviso pendiente",
	sent: "Enviado al servidor SMTP",
	failed: "Error de envío SMTP",
};

export type TeacherClaimsSummary = {
	total: number;
	pending: number;
	inReview: number;
	responded: number;
	groupCount: number;
	pointCount: number;
};

export function summarizeTeacherClaims(
	claims: ReadonlyArray<TeacherClaimItem>,
): TeacherClaimsSummary {
	let pending = 0;
	let inReview = 0;
	let responded = 0;
	let groupCount = 0;
	let pointCount = 0;

	for (const claim of claims) {
		if (claim.status === "pending") pending += 1;
		else if (claim.status === "in_review") inReview += 1;
		else if (claim.status === "responded") responded += 1;

		if (claim.claimType === "group_grade") groupCount += 1;
		else pointCount += 1;
	}

	return {
		total: claims.length,
		pending,
		inReview,
		responded,
		groupCount,
		pointCount,
	};
}

export function filterTeacherClaims(
	claims: ReadonlyArray<TeacherClaimItem>,
	{
		statusFilter,
		typeFilter,
	}: {
		statusFilter: ClaimStatusFilter;
		typeFilter: ClaimTypeFilter;
	},
): TeacherClaimItem[] {
	return claims.filter((claim) => {
		if (statusFilter !== "all" && claim.status !== statusFilter) {
			return false;
		}
		if (typeFilter !== "all" && claim.claimType !== typeFilter) {
			return false;
		}
		return true;
	});
}

export function resolveSelectedClaim(
	claims: ReadonlyArray<TeacherClaimItem>,
	requestedPublicId: string | null | undefined,
): TeacherClaimItem | null {
	if (claims.length === 0) return null;
	if (requestedPublicId) {
		const found = claims.find(
			(claim) => claim.claimPublicId === requestedPublicId,
		);
		if (found) return found;
	}
	return claims[0] ?? null;
}

/**
 * Builds the link to the separate academic correction module (Grades or Points)
 * so teachers know responding to a claim never mutates grades or points automatically.
 */
export function buildAcademicCorrectionHref(
	claim: Pick<TeacherClaimItem, "claimType" | "coursePublicId">,
	periodPublicId: string | null,
): string {
	const base =
		claim.claimType === "group_grade" ? "/teacher/grades" : "/teacher/points";
	const params = new URLSearchParams();
	if (periodPublicId) {
		params.set("period", periodPublicId);
	}
	params.set("course", claim.coursePublicId);
	return `${base}?${params.toString()}`;
}

