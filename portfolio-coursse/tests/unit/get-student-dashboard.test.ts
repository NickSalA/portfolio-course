import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { getStudentDashboard } from "../../lib/student/get-dashboard";

type RpcResult = { data: unknown; error: unknown };

function createDashboardClient({
	syncResult = { data: true as boolean | null, error: null as unknown },
	queryResult = { data: [] as unknown[] | null, error: null as unknown },
	gradesByCourse = {} as Record<number, RpcResult>,
	claimsByCourse = {} as Record<number, RpcResult>,
} = {}) {
	const eqStatus = vi.fn(async () => queryResult);
	const eqStudent = vi.fn(() => ({ eq: eqStatus }));
	const select = vi.fn(() => ({ eq: eqStudent }));
	const rpc = vi.fn(
		async (fnName: string, args?: { target_course_id?: number }) => {
			if (fnName === "sync_authorized_student") {
				return syncResult;
			}
			if (fnName === "list_student_group_grades") {
				const courseId = args?.target_course_id;
				if (courseId !== undefined && courseId in gradesByCourse) {
					return gradesByCourse[courseId];
				}
				return { data: [], error: null };
			}
			if (fnName === "list_student_claims") {
				const courseId = args?.target_course_id;
				if (courseId !== undefined && courseId in claimsByCourse) {
					return claimsByCourse[courseId];
				}
				return { data: [], error: null };
			}
			return { data: null, error: new Error(`Unexpected RPC: ${fnName}`) };
		},
	);

	return {
		client: {
			rpc,
			from: vi.fn(() => ({ select })),
		} as unknown as SupabaseClient,
		rpc,
		select,
	};
}

describe("getStudentDashboard", () => {
	it("returns mapped enrollments, historical group grades (explicit 0, decimal, pending null), and separated points", async () => {
		const { client, rpc, select } = createDashboardClient({
			queryResult: {
				data: [
					{
						id: 10,
						course_id: 101,
						group_id: 2,
						groups: { name: "Grupo 2" },
						courses: {
							name: "Automatización",
							group_selection_opens_at: null,
							group_selection_closes_at: null,
							academic_periods: { code: "2026-II" },
						},
						authorized_students: {
							point_transactions: [
								{
									id: 1,
									points: 3,
									reason: "Participación",
									created_at: "2026-10-01T10:00:00Z",
									is_voided: false,
								},
								{
									id: 2,
									points: 2,
									reason: "Anulado",
									created_at: "2026-10-02T10:00:00Z",
									is_voided: true,
								},
							],
						},
					},
				],
				error: null,
			},
			gradesByCourse: {
				101: {
					data: [
						{
							evaluation_public_id: "ev-1",
							evaluation_name: "Trabajo 1",
							group_public_id: "grp-1",
							group_name: "Grupo 1",
							performed_at: "2026-09-20T15:00:00Z",
							grade: 0,
						},
						{
							evaluation_public_id: "ev-2",
							evaluation_name: "Trabajo 2",
							group_public_id: "grp-2",
							group_name: "Grupo 2",
							performed_at: "2026-10-10T15:00:00Z",
							grade: 17.25,
						},
						{
							evaluation_public_id: "ev-3",
							evaluation_name: "Trabajo 3",
							group_public_id: "grp-2",
							group_name: "Grupo 2",
							performed_at: "2026-10-20T15:00:00Z",
							grade: null,
						},
					],
					error: null,
				},
			},
		});

		const result = await getStudentDashboard(client, "student-1");
		expect(result.error).toBeNull();
		expect(select).toHaveBeenCalledWith(
			expect.stringContaining("course_id"),
		);
		expect(rpc).toHaveBeenCalledWith("list_student_group_grades", {
			target_course_id: 101,
		});
		expect(result.enrollments).toHaveLength(1);
		expect(result.enrollments[0]).toMatchObject({
			courseId: 101,
			courseName: "Automatización",
			periodCode: "2026-II",
			groupName: "Grupo 2",
			balance: 3,
			gradesError: false,
		});
		expect(result.enrollments[0]?.transactions).toHaveLength(1);
		expect(result.enrollments[0]?.grades).toEqual([
			{
				evaluationPublicId: "ev-1",
				evaluationName: "Trabajo 1",
				groupPublicId: "grp-1",
				groupName: "Grupo 1",
				performedAt: "2026-09-20T15:00:00Z",
				grade: 0,
			},
			{
				evaluationPublicId: "ev-2",
				evaluationName: "Trabajo 2",
				groupPublicId: "grp-2",
				groupName: "Grupo 2",
				performedAt: "2026-10-10T15:00:00Z",
				grade: 17.25,
			},
			{
				evaluationPublicId: "ev-3",
				evaluationName: "Trabajo 3",
				groupPublicId: "grp-2",
				groupName: "Grupo 2",
				performedAt: "2026-10-20T15:00:00Z",
				grade: null,
			},
		]);
		expect(result.enrollments[0]?.grades[0]?.grade).toBe(0);
		expect(result.enrollments[0]?.grades[2]?.grade).toBeNull();
	});

	it("marks gradesError on a failing course without losing points, enrollment, or other courses", async () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		const { client } = createDashboardClient({
			queryResult: {
				data: [
					{
						id: 10,
						course_id: 101,
						group_id: 1,
						groups: { name: "Grupo 1" },
						courses: {
							name: "Curso Con Fallo de Notas",
							group_selection_opens_at: null,
							group_selection_closes_at: null,
							academic_periods: { code: "2026-II" },
						},
						authorized_students: {
							point_transactions: [
								{
									id: 1,
									points: 4,
									reason: "Bono",
									created_at: "2026-10-01T10:00:00Z",
									is_voided: false,
								},
							],
						},
					},
					{
						id: 11,
						course_id: 102,
						group_id: 3,
						groups: { name: "Grupo 3" },
						courses: {
							name: "Curso Sano",
							group_selection_opens_at: null,
							group_selection_closes_at: null,
							academic_periods: { code: "2026-II" },
						},
						authorized_students: {
							point_transactions: [],
						},
					},
				],
				error: null,
			},
			gradesByCourse: {
				101: { data: null, error: new Error("grades rpc failed") },
				102: {
					data: [
						{
							evaluation_public_id: "ev-10",
							evaluation_name: "Entrega Final",
							group_public_id: "grp-3",
							group_name: "Grupo 3",
							performed_at: "2026-11-01T15:00:00Z",
							grade: 16,
						},
					],
					error: null,
				},
			},
		});

		const result = await getStudentDashboard(client, "student-1");
		expect(result.error).toBeNull();
		expect(result.enrollments).toHaveLength(2);
		expect(result.enrollments[0]).toMatchObject({
			courseId: 101,
			courseName: "Curso Con Fallo de Notas",
			balance: 4,
			grades: [],
			gradesError: true,
		});
		expect(result.enrollments[0]?.transactions).toHaveLength(1);
		expect(result.enrollments[1]).toMatchObject({
			courseId: 102,
			courseName: "Curso Sano",
			gradesError: false,
		});
		expect(result.enrollments[1]?.grades).toHaveLength(1);
		expect(spy).toHaveBeenCalledWith(
			"Student group grades query failed",
			expect.objectContaining({
				studentId: "student-1",
				courseId: 101,
			}),
		);
		spy.mockRestore();
	});

	it("returns empty enrollments without error when student has no authorizations", async () => {
		const { client } = createDashboardClient({
			syncResult: { data: false, error: null },
			queryResult: { data: [], error: null },
		});

		const result = await getStudentDashboard(client, "student-empty");
		expect(result).toEqual({ enrollments: [], error: null });
	});

	it("returns query-failed when sync RPC fails", async () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		const { client } = createDashboardClient({
			syncResult: { data: null, error: new Error("rpc down") },
		});

		const result = await getStudentDashboard(client, "student-1");
		expect(result).toEqual({ enrollments: [], error: "query-failed" });
		spy.mockRestore();
	});

	it("returns query-failed when enrollment query fails", async () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		const { client } = createDashboardClient({
			queryResult: { data: null, error: new Error("db error") },
		});

		const result = await getStudentDashboard(client, "student-1");
		expect(result).toEqual({ enrollments: [], error: "query-failed" });
		spy.mockRestore();
	});

	it("maps course claims including teammate historical group claims and isolates claimsError per course", async () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		const { client } = createDashboardClient({
			queryResult: {
				data: [
					{
						id: 20,
						course_id: 201,
						group_id: 2,
						groups: { name: "Grupo 2" },
						courses: {
							name: "Curso Con Reclamos",
							group_selection_opens_at: null,
							group_selection_closes_at: null,
							academic_periods: { code: "2026-II" },
						},
						authorized_students: {
							point_transactions: [
								{
									id: 55,
									points: 2,
									reason: "Participación",
									created_at: "2026-10-05T10:00:00Z",
									is_voided: false,
								},
							],
						},
					},
					{
						id: 21,
						course_id: 202,
						group_id: 3,
						groups: { name: "Grupo 3" },
						courses: {
							name: "Curso Error Reclamos",
							group_selection_opens_at: null,
							group_selection_closes_at: null,
							academic_periods: { code: "2026-II" },
						},
						authorized_students: { point_transactions: [] },
					},
				],
				error: null,
			},
			claimsByCourse: {
				201: {
					data: [
						{
							claim_public_id: "c-group-1",
							course_id: 201,
							claim_type: "group_grade",
							status: "responded",
							group_public_id: "grp-1",
							group_name: "Grupo 1",
							evaluation_public_id: "ev-1",
							evaluation_name: "T1",
							point_transaction_id: null,
							submitted_by_name: "Alumno Dos",
							is_submitted_by_me: false,
							reason: "Revisión grupal",
							teacher_response: "Se revisó el caso.",
							created_at: "2026-11-24T14:00:00Z",
							in_review_at: "2026-11-24T15:00:00Z",
							responded_at: "2026-11-24T16:00:00Z",
						},
						{
							claim_public_id: "c-point-1",
							course_id: 201,
							claim_type: "point_transaction",
							status: "pending",
							group_public_id: null,
							group_name: null,
							evaluation_public_id: null,
							evaluation_name: null,
							point_transaction_id: 55,
							submitted_by_name: "Alumno Uno",
							is_submitted_by_me: true,
							reason: "Revisión de puntos",
							teacher_response: null,
							created_at: "2026-11-24T17:00:00Z",
							in_review_at: null,
							responded_at: null,
						},
					],
					error: null,
				},
				202: {
					data: null,
					error: new Error("claims rpc down"),
				},
			},
		});

		const result = await getStudentDashboard(client, "student-1");
		expect(result.error).toBeNull();
		expect(result.enrollments[0]).toMatchObject({
			courseId: 201,
			claimsError: false,
			balance: 2,
		});
		expect(result.enrollments[0]?.claims).toHaveLength(2);
		expect(result.enrollments[0]?.claims[0]).toMatchObject({
			claimPublicId: "c-group-1",
			isSubmittedByMe: false,
			submittedByName: "Alumno Dos",
			teacherResponse: "Se revisó el caso.",
		});
		expect(result.enrollments[1]).toMatchObject({
			courseId: 202,
			claims: [],
			claimsError: true,
		});
		expect(spy).toHaveBeenCalledWith(
			"Student claims query failed",
			expect.objectContaining({
				studentId: "student-1",
				courseId: 202,
			}),
		);
		spy.mockRestore();
	});
});
