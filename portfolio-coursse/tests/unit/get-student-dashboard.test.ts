import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { getStudentDashboard } from "../../lib/student/get-dashboard";

function createDashboardClient({
	syncResult = { data: true as boolean | null, error: null as unknown },
	queryResult = { data: [] as unknown[] | null, error: null as unknown },
} = {}) {
	const eqStatus = vi.fn(async () => queryResult);
	const eqStudent = vi.fn(() => ({ eq: eqStatus }));
	const select = vi.fn(() => ({ eq: eqStudent }));

	return {
		rpc: vi.fn(async () => syncResult),
		from: vi.fn(() => ({ select })),
	} as unknown as SupabaseClient;
}

describe("getStudentDashboard", () => {
	it("returns mapped enrollments and balance on success", async () => {
		const client = createDashboardClient({
			queryResult: {
				data: [
					{
						id: 10,
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
		});

		const result = await getStudentDashboard(client, "student-1");
		expect(result.error).toBeNull();
		expect(result.enrollments).toHaveLength(1);
		expect(result.enrollments[0]).toMatchObject({
			courseName: "Automatización",
			periodCode: "2026-II",
			groupName: "Grupo 2",
			balance: 3,
		});
		expect(result.enrollments[0]?.transactions).toHaveLength(1);
	});

	it("returns empty enrollments without error when student has no authorizations", async () => {
		const client = createDashboardClient({
			syncResult: { data: false, error: null },
			queryResult: { data: [], error: null },
		});

		const result = await getStudentDashboard(client, "student-empty");
		expect(result).toEqual({ enrollments: [], error: null });
	});

	it("returns query-failed when sync RPC fails", async () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		const client = createDashboardClient({
			syncResult: { data: null, error: new Error("rpc down") },
		});

		const result = await getStudentDashboard(client, "student-1");
		expect(result).toEqual({ enrollments: [], error: "query-failed" });
		spy.mockRestore();
	});

	it("returns query-failed when enrollment query fails", async () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		const client = createDashboardClient({
			queryResult: { data: null, error: new Error("db error") },
		});

		const result = await getStudentDashboard(client, "student-1");
		expect(result).toEqual({ enrollments: [], error: "query-failed" });
		spy.mockRestore();
	});
});
