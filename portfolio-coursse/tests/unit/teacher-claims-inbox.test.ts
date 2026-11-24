import { describe, expect, it } from "vitest";
import {
	buildAcademicCorrectionHref,
	filterTeacherClaims,
	resolveSelectedClaim,
	summarizeTeacherClaims,
} from "../../lib/claims/inbox-helpers";
import type { TeacherClaimItem } from "../../lib/claims/teacher-claims";

const SAMPLE_CLAIMS: TeacherClaimItem[] = [
	{
		claimPublicId: "11111111-1111-4111-8111-111111111111",
		courseId: 1,
		coursePublicId: "aaaa1111-1111-4111-8111-111111111111",
		courseName: "Algoritmos",
		periodCode: "2026-II",
		claimType: "group_grade",
		status: "pending",
		groupPublicId: "bbbb1111-1111-4111-8111-111111111111",
		groupName: "Grupo 1",
		evaluationPublicId: "cccc1111-1111-4111-8111-111111111111",
		evaluationName: "T1",
		evaluationPerformedAt: "2026-11-10T15:00:00Z",
		groupGrade: 14,
		pointTransactionId: null,
		pointAmount: null,
		pointReason: null,
		pointIsVoided: null,
		pointCreatedAt: null,
		submittedByName: "Ana Uno",
		submittedByEmail: "ana@example.test",
		reason: "Revisar sección 2",
		teacherResponse: null,
		reviewedByName: null,
		createdAt: "2026-11-23T18:00:00Z",
		inReviewAt: null,
		respondedAt: null,
	},
	{
		claimPublicId: "22222222-2222-4222-8222-222222222222",
		courseId: 1,
		coursePublicId: "aaaa1111-1111-4111-8111-111111111111",
		courseName: "Algoritmos",
		periodCode: "2026-II",
		claimType: "point_transaction",
		status: "in_review",
		groupPublicId: null,
		groupName: null,
		evaluationPublicId: null,
		evaluationName: null,
		evaluationPerformedAt: null,
		groupGrade: null,
		pointTransactionId: 90,
		pointAmount: -1,
		pointReason: "Tardanza",
		pointIsVoided: false,
		pointCreatedAt: "2026-11-11T15:00:00Z",
		submittedByName: "Bruno Dos",
		submittedByEmail: "bruno@example.test",
		reason: "No correspondía el descuento",
		teacherResponse: null,
		reviewedByName: "Docente A",
		createdAt: "2026-11-23T19:00:00Z",
		inReviewAt: "2026-11-23T19:30:00Z",
		respondedAt: null,
	},
	{
		claimPublicId: "33333333-3333-4333-8333-333333333333",
		courseId: 1,
		coursePublicId: "aaaa1111-1111-4111-8111-111111111111",
		courseName: "Algoritmos",
		periodCode: "2026-II",
		claimType: "group_grade",
		status: "responded",
		groupPublicId: "bbbb2222-2222-4222-8222-222222222222",
		groupName: "Grupo 2",
		evaluationPublicId: "cccc1111-1111-4111-8111-111111111111",
		evaluationName: "T1",
		evaluationPerformedAt: "2026-11-10T15:00:00Z",
		groupGrade: 17,
		pointTransactionId: null,
		pointAmount: null,
		pointReason: null,
		pointIsVoided: null,
		pointCreatedAt: null,
		submittedByName: "Carla Tres",
		submittedByEmail: "carla@example.test",
		reason: "Consulta de rúbrica",
		teacherResponse: "Confirmado conforme a rúbrica.",
		reviewedByName: "Docente A",
		createdAt: "2026-11-23T17:00:00Z",
		inReviewAt: "2026-11-23T17:30:00Z",
		respondedAt: "2026-11-23T17:45:00Z",
	},
];

describe("teacher claims inbox helpers (REC-05)", () => {
	it("summarizes counts by status and claim type", () => {
		expect(summarizeTeacherClaims(SAMPLE_CLAIMS)).toEqual({
			total: 3,
			pending: 1,
			inReview: 1,
			responded: 1,
			groupCount: 2,
			pointCount: 1,
		});
	});

	it("filters by status and type independently and combined", () => {
		expect(
			filterTeacherClaims(SAMPLE_CLAIMS, {
				statusFilter: "all",
				typeFilter: "point_transaction",
			}).map((c) => c.claimPublicId),
		).toEqual(["22222222-2222-4222-8222-222222222222"]);

		expect(
			filterTeacherClaims(SAMPLE_CLAIMS, {
				statusFilter: "responded",
				typeFilter: "group_grade",
			}).map((c) => c.claimPublicId),
		).toEqual(["33333333-3333-4333-8333-333333333333"]);
	});

	it("resolves deep-linked claim from email link or falls back to first visible claim", () => {
		expect(
			resolveSelectedClaim(
				SAMPLE_CLAIMS,
				"22222222-2222-4222-8222-222222222222",
			)?.claimPublicId,
		).toBe("22222222-2222-4222-8222-222222222222");

		expect(
			resolveSelectedClaim(SAMPLE_CLAIMS, "non-existent")?.claimPublicId,
		).toBe("11111111-1111-4111-8111-111111111111");

		expect(resolveSelectedClaim([], null)).toBeNull();
	});

	it("builds separate academic correction links for group grades and point movements", () => {
		expect(buildAcademicCorrectionHref(SAMPLE_CLAIMS[0], "per-1")).toBe(
			"/teacher/grades?period=per-1&course=aaaa1111-1111-4111-8111-111111111111",
		);
		expect(buildAcademicCorrectionHref(SAMPLE_CLAIMS[1], null)).toBe(
			"/teacher/points?course=aaaa1111-1111-4111-8111-111111111111",
		);
	});
});

