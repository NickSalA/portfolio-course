import { describe, expect, it } from "vitest";
import {
	describeClaimTarget,
	filterStudentClaims,
	findGroupGradeClaim,
	findPointTransactionClaim,
	formatClaimAuthorLabel,
	formatClaimDateTimeLima,
	formatClaimScopeLabel,
	getClaimStatusLabel,
	getClaimTypeLabel,
	groupClaimsByCourse,
	summarizeStudentClaims,
} from "../../lib/claims/student-claims";
import type { StudentClaimRecord } from "../../lib/claims/submit-claim";

const sampleClaims: StudentClaimRecord[] = [
	{
		claimPublicId: "claim-1",
		courseId: 101,
		claimType: "group_grade",
		status: "pending",
		groupPublicId: "grp-1",
		groupName: "Grupo 1",
		evaluationPublicId: "ev-1",
		evaluationName: "T1",
		pointTransactionId: null,
		submittedByName: "Alumno Dos",
		isSubmittedByMe: false,
		reason: "Revisar criterio 2",
		teacherResponse: null,
		createdAt: "2026-11-24T15:00:00Z",
		inReviewAt: null,
		respondedAt: null,
	},
	{
		claimPublicId: "claim-2",
		courseId: 101,
		claimType: "point_transaction",
		status: "responded",
		groupPublicId: null,
		groupName: null,
		evaluationPublicId: null,
		evaluationName: null,
		pointTransactionId: 44,
		submittedByName: "Alumno Uno",
		isSubmittedByMe: true,
		reason: "Bono de exposición",
		teacherResponse: "Se mantiene el registro inicial.",
		createdAt: "2026-11-24T16:00:00Z",
		inReviewAt: "2026-11-24T17:00:00Z",
		respondedAt: "2026-11-24T18:00:00Z",
	},
	{
		claimPublicId: "claim-3",
		courseId: 202,
		claimType: "group_grade",
		status: "in_review",
		groupPublicId: "grp-9",
		groupName: "Grupo 2",
		evaluationPublicId: "ev-9",
		evaluationName: "T2",
		pointTransactionId: null,
		submittedByName: "Alumno Uno",
		isSubmittedByMe: true,
		reason: "Consulta pendiente",
		teacherResponse: null,
		createdAt: "2026-11-24T19:00:00Z",
		inReviewAt: "2026-11-24T19:30:00Z",
		respondedAt: null,
	},
];

describe("student claims UI helpers", () => {
	it("groups and matches existing group-grade and point-transaction claims", () => {
		const grouped = groupClaimsByCourse(sampleClaims);
		expect(grouped[101]).toHaveLength(2);
		expect(grouped[202]).toHaveLength(1);

		expect(
			findGroupGradeClaim(grouped[101] ?? [], {
				groupPublicId: "grp-1",
				evaluationPublicId: "ev-1",
			})?.claimPublicId,
		).toBe("claim-1");

		expect(
			findPointTransactionClaim(grouped[101] ?? [], 44)?.claimPublicId,
		).toBe("claim-2");
		expect(
			findPointTransactionClaim(grouped[101] ?? [], 999),
		).toBeUndefined();
	});

	it("summarizes, filters, and formats author, scope, status, and Lima dates", () => {
		expect(summarizeStudentClaims(sampleClaims)).toEqual({
			total: 3,
			pending: 1,
			inReview: 1,
			responded: 1,
		});

		expect(filterStudentClaims(sampleClaims, "all")).toHaveLength(3);
		expect(
			filterStudentClaims(sampleClaims, "responded").map(
				(c) => c.claimPublicId,
			),
		).toEqual(["claim-2"]);

		expect(formatClaimAuthorLabel(sampleClaims[0])).toBe("Alumno Dos");
		expect(formatClaimAuthorLabel(sampleClaims[1])).toBe("Tú");
		expect(formatClaimScopeLabel("group_grade")).toContain("grupo histórico");
		expect(formatClaimScopeLabel("point_transaction")).toContain("Privado");
		expect(getClaimStatusLabel("in_review")).toBe("En revisión");
		expect(getClaimTypeLabel("group_grade")).toBe("Nota grupal");
		expect(formatClaimDateTimeLima("2026-11-24T15:00:00Z")).toContain(
			"10:00 (Lima)",
		);
		expect(formatClaimDateTimeLima(null)).toBeNull();
	});

	it("describes group targets distinguishing explicit 0 from pending and point movements", () => {
		const zeroTarget = describeClaimTarget({
			claimType: "group_grade",
			courseName: "Automatización",
			groupPublicId: "grp-1",
			groupName: "Grupo 1",
			evaluationPublicId: "ev-1",
			evaluationName: "T2",
			performedAt: "2026-11-24T15:00:00Z",
			grade: 0,
		});
		expect(zeroTarget.subtitle).toContain("Nota: 0");
		expect(zeroTarget.subtitle).toContain("10:00 (Lima)");

		const pendingTarget = describeClaimTarget({
			claimType: "group_grade",
			courseName: "Automatización",
			groupPublicId: "grp-1",
			groupName: "Grupo 1",
			evaluationPublicId: "ev-2",
			evaluationName: "T3",
			performedAt: "2026-11-24T15:00:00Z",
			grade: null,
		});
		expect(pendingTarget.subtitle).toContain("Nota: Pendiente");

		const pointTarget = describeClaimTarget({
			claimType: "point_transaction",
			courseName: "Automatización",
			pointTransactionId: 7,
			points: 3,
			reason: "Participación",
			createdAt: "2026-11-24T15:00:00Z",
		});
		expect(pointTarget.title).toContain("+3");
		expect(pointTarget.scopeNotice).toContain("privado");
	});
});
