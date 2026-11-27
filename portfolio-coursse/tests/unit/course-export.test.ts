import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
	buildCourseExportColumns,
	buildCourseExportFilename,
	buildCourseExportRows,
	buildCourseExportWorkbook,
	COURSE_EXPORT_SHEET_NAME,
	renderCourseExportXlsxBuffer,
	type CourseExportEvaluation,
	type CourseExportGradeAttribution,
	type CourseExportStudent,
} from "../../lib/export/course-export";
import { loadCourseExportForTeacher } from "../../lib/export/get-course-export";

const VALID_COURSE_UUID = "11111111-1111-4111-8111-111111111111";
const TEACHER_UUID = "22222222-2222-4222-8222-222222222222";

function readSheetRows(buffer: Buffer): (string | number | null)[][] {
	const workbook = XLSX.read(buffer, { type: "buffer" });
	expect(workbook.SheetNames).toEqual([COURSE_EXPORT_SHEET_NAME]);
	const sheet = workbook.Sheets[COURSE_EXPORT_SHEET_NAME];
	return XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
		header: 1,
		defval: null,
	});
}

describe("course-export pure builders (EXP-03)", () => {
	it("builds EXP-01 agreed columns in evaluation order and disambiguates reserved collisions", () => {
		const columns = buildCourseExportColumns([
			{ id: 20, name: "T2", position: 2, performedAt: "2026-11-10T15:00:00Z" },
			{ id: 10, name: "T1", position: 1, performedAt: "2026-11-01T15:00:00Z" },
			{ id: 30, name: "Saldo", position: 3, performedAt: "2026-11-15T15:00:00Z" },
		]);

		expect(columns.headers).toEqual([
			"Nombre",
			"Correo",
			"T1",
			"T2",
			"Saldo (2)",
			"Promedio base",
			"Saldo",
			"Puntos aplicados",
			"Excedente",
			"Promedio ajustado",
		]);
	});

	it("preserves historical attribution across transfers, excludes unverified legacy grades, distinguishes explicit zero from pending, and computes EXP-01 examples", () => {
		const evaluations: CourseExportEvaluation[] = [
			{ id: 1, name: "T1", position: 1, performedAt: "2026-11-01T15:00:00Z" },
			{ id: 2, name: "T2", position: 2, performedAt: "2026-11-10T15:00:00Z" },
		];

		const students: CourseExportStudent[] = [
			{
				authorizedStudentId: 101,
				fullName: "Ana Transferida",
				email: "ana@example.test",
				status: "active",
				movements: [
					{ points: 18, isVoided: false },
					{ points: -3, isVoided: false },
					{ points: 100, isVoided: true },
				],
			},
			{
				authorizedStudentId: 102,
				fullName: "Bruno Cero y Negativo",
				email: "bruno@example.test",
				status: "active",
				movements: [{ points: -3, isVoided: false }],
			},
			{
				authorizedStudentId: 103,
				fullName: "Carla Pendiente",
				email: "carla@example.test",
				status: "active",
				movements: [
					{ points: 3, isVoided: false },
					{ points: -1, isVoided: true },
				],
			},
			{
				authorizedStudentId: 104,
				fullName: "Diego Inactivo Con Historia",
				email: "diego@example.test",
				status: "inactive",
				movements: [{ points: 0, isVoided: true }],
			},
			{
				authorizedStudentId: 105,
				fullName: "Elena Inactiva Sin Historia",
				email: "elena@example.test",
				status: "inactive",
				movements: [{ points: 5, isVoided: false }],
			},
		];

		const attributions: CourseExportGradeAttribution[] = [
			// Ana did T1 in Group A (10) and later moved to Group B for T2 (18).
			{ authorizedStudentId: 101, evaluationId: 1, groupId: 10, grade: 10, revision: 1 },
			{ authorizedStudentId: 101, evaluationId: 2, groupId: 20, grade: 18, revision: 2 },
			// Bruno has explicit 0 on T1 and 1 on T2, with balance -3.
			{ authorizedStudentId: 102, evaluationId: 1, groupId: 10, grade: 0, revision: 1 },
			{ authorizedStudentId: 102, evaluationId: 2, groupId: 10, grade: 1, revision: 1 },
			// Carla has T1 = 10 and T2 is unverified legacy (revision = 0) -> must stay pending (null)!
			{ authorizedStudentId: 103, evaluationId: 1, groupId: 10, grade: 10, revision: 1 },
			{ authorizedStudentId: 103, evaluationId: 2, groupId: 10, grade: 19, revision: 0 },
			// Diego is inactive now, but had historical grades on T1 and T2 (13.50 and 13.51 -> tie 13.505 -> 13.51).
			{ authorizedStudentId: 104, evaluationId: 1, groupId: 10, grade: 13.5, revision: 1 },
			{ authorizedStudentId: 104, evaluationId: 2, groupId: 10, grade: 13.51, revision: 1 },
		];

		const rows = buildCourseExportRows({ students, evaluations, attributions });
		expect(rows.map((row) => row.email)).toEqual([
			"ana@example.test",
			"bruno@example.test",
			"carla@example.test",
			"diego@example.test",
		]);

		const workbook = buildCourseExportWorkbook({ evaluations, rows });
		const sheet = workbook.Sheets[COURSE_EXPORT_SHEET_NAME];

		// Verify explicit 0 cell is numeric (t === "n", v === 0) and pending cell is truly empty (undefined).
		// Row 2 (index 2 in 0-based) = Bruno, col 2 = T1 (0)
		expect(sheet["C3"]).toMatchObject({ t: "n", v: 0 });
		// Row 3 (index 3 in 0-based) = Carla, col 3 = T2 (pending), col 4 = Promedio base (pending), col 5 = Saldo (3)
		expect(sheet["D4"]).toBeUndefined();
		expect(sheet["E4"]).toBeUndefined();
		expect(sheet["F4"]).toMatchObject({ t: "n", v: 3, z: "0" });
		expect(sheet["G4"]).toBeUndefined();
		expect(sheet["H4"]).toBeUndefined();
		expect(sheet["I4"]).toBeUndefined();

		// Verify number formats on averages
		expect(sheet["E2"]).toMatchObject({ t: "n", v: 14, z: "0.00" });
		expect(sheet["I2"]).toMatchObject({ t: "n", v: 20, z: "0.00" });
		expect(sheet["E5"]).toMatchObject({ t: "n", v: 13.505, z: "0.00" });
		expect(sheet["I5"]).toMatchObject({ t: "n", v: 13.51, z: "0.00" });

		const buffer1 = renderCourseExportXlsxBuffer({ evaluations, rows });
		const buffer2 = renderCourseExportXlsxBuffer({ evaluations, rows });
		const parsed1 = readSheetRows(buffer1);
		const parsed2 = readSheetRows(buffer2);

		expect(parsed1).toEqual(parsed2);
		expect(parsed1).toEqual([
			[
				"Nombre",
				"Correo",
				"T1",
				"T2",
				"Promedio base",
				"Saldo",
				"Puntos aplicados",
				"Excedente",
				"Promedio ajustado",
			],
			["Ana Transferida", "ana@example.test", 10, 18, 14, 15, 12, 3, 20],
			["Bruno Cero y Negativo", "bruno@example.test", 0, 1, 0.5, -3, -1, -2, 0],
			["Carla Pendiente", "carla@example.test", 10, null, null, 3, null, null, null],
			[
				"Diego Inactivo Con Historia",
				"diego@example.test",
				13.5,
				13.51,
				13.505,
				0,
				0,
				0,
				13.51,
			],
		]);
	});

	it("keeps balance visible and leaves averages, applied, and surplus empty when there are zero evaluations", () => {
		const students: CourseExportStudent[] = [
			{
				authorizedStudentId: 201,
				fullName: "Sin Trabajos",
				email: "sin@example.test",
				status: "active",
				movements: [{ points: 4, isVoided: false }],
			},
		];

		const rows = buildCourseExportRows({
			students,
			evaluations: [],
			attributions: [],
		});
		const buffer = renderCourseExportXlsxBuffer({ evaluations: [], rows });
		expect(readSheetRows(buffer)).toEqual([
			[
				"Nombre",
				"Correo",
				"Promedio base",
				"Saldo",
				"Puntos aplicados",
				"Excedente",
				"Promedio ajustado",
			],
			["Sin Trabajos", "sin@example.test", null, 4, null, null, null],
		]);
	});

	it("preserves full unrounded baseAverage for 10, 10, 11 with +1 and rounds adjustedAverage to 10.67", () => {
		const evaluations: CourseExportEvaluation[] = [
			{ id: 1, name: "T1", position: 1, performedAt: "2026-11-01T15:00:00Z" },
			{ id: 2, name: "T2", position: 2, performedAt: "2026-11-02T15:00:00Z" },
			{ id: 3, name: "T3", position: 3, performedAt: "2026-11-03T15:00:00Z" },
		];
		const students: CourseExportStudent[] = [
			{
				authorizedStudentId: 301,
				fullName: "Precision",
				email: "precision@example.test",
				status: "active",
				movements: [{ points: 1, isVoided: false }],
			},
		];
		const attributions: CourseExportGradeAttribution[] = [
			{ authorizedStudentId: 301, evaluationId: 1, groupId: 1, grade: 10, revision: 1 },
			{ authorizedStudentId: 301, evaluationId: 2, groupId: 1, grade: 10, revision: 1 },
			{ authorizedStudentId: 301, evaluationId: 3, groupId: 1, grade: 11, revision: 1 },
		];

		const rows = buildCourseExportRows({ students, evaluations, attributions });
		expect(rows[0].baseAverage).toBeCloseTo(31 / 3, 10);
		expect(rows[0].applied).toBe(1);
		expect(rows[0].surplus).toBe(0);
		expect(rows[0].adjustedAverage).toBe(10.67);
	});

	it("sanitizes filenames cleanly", () => {
		expect(
			buildCourseExportFilename(
				"Ingeniería de Software II",
				new Date("2026-11-23T12:00:00Z"),
			),
		).toBe("Resultados_Ingenieria_de_Software_II_2026-11-23.xlsx");
		expect(
			buildCourseExportFilename("   ", new Date("2026-11-23T12:00:00Z")),
		).toBe("Resultados_Curso_2026-11-23.xlsx");
	});
});

function createMockSupabase({
	hasIdentity = true,
	profileRole = "teacher" as string | null,
	course = { id: 77, public_id: VALID_COURSE_UUID, name: "Algoritmos" } as {
		id: number;
		public_id: string;
		name: string;
	} | null,
	evaluations = [
		{ id: 1, name: "T1", position: 1, performed_at: "2026-11-01T15:00:00Z" },
		{ id: 2, name: "T2", position: 2, performed_at: "2026-11-10T15:00:00Z" },
	],
	students = [
		{
			id: 501,
			full_name: "Alumna Uno",
			email: "uno@example.test",
			status: "active",
			point_transactions: [
				{ points: 2, is_voided: false },
				{ points: 5, is_voided: true },
			],
		},
	],
	attributions = [
		{
			authorized_student_id: 501,
			evaluation_id: 1,
			group_id: 9,
			grade: "19.50",
			revision: 1,
		},
		{
			authorized_student_id: 501,
			evaluation_id: 2,
			group_id: 10,
			grade: "20.00",
			revision: 2,
		},
	],
	attributionError = null as { message: string } | null,
}: {
	hasIdentity?: boolean;
	profileRole?: string | null;
	course?: { id: number; public_id: string; name: string } | null;
	evaluations?: {
		id: number;
		name: string;
		position: number;
		performed_at: string | null;
	}[];
	students?: {
		id: number;
		full_name: string | null;
		email: string;
		status: string;
		point_transactions: { points: number; is_voided: boolean }[];
	}[];
	attributions?: {
		authorized_student_id: number;
		evaluation_id: number;
		group_id: number;
		grade: string | number;
		revision: number;
	}[];
	attributionError?: { message: string } | null;
} = {}) {
	const rpcCalls: string[] = [];

	const client = {
		rpc(name: string) {
			rpcCalls.push(name);
			if (name === "has_academic_identity") {
				return Promise.resolve({ data: hasIdentity, error: null });
			}
			if (name === "list_course_export_grade_attributions") {
				return Promise.resolve({
					data: attributionError ? null : attributions,
					error: attributionError,
				});
			}
			throw new Error(`Unexpected RPC call: ${name}`);
		},
		from(table: string) {
			if (table === "profiles") {
				return {
					select: () => ({
						eq: () => ({
							maybeSingle: () =>
								Promise.resolve({
									data: profileRole ? { role: profileRole } : null,
									error: null,
								}),
						}),
					}),
				};
			}
			if (table === "courses") {
				return {
					select: () => ({
						eq: () => ({
							eq: () => ({
								maybeSingle: () =>
									Promise.resolve({ data: course, error: null }),
							}),
						}),
					}),
				};
			}
			if (table === "course_evaluations") {
				return {
					select: () => ({
						eq: () => ({
							order: () => ({
								order: () =>
									Promise.resolve({ data: evaluations, error: null }),
							}),
						}),
					}),
				};
			}
			if (table === "authorized_students") {
				return {
					select: () => ({
						eq: () => Promise.resolve({ data: students, error: null }),
					}),
				};
			}
			throw new Error(`Unexpected table query: ${table}`);
		},
	};

	return {
		supabase: client as unknown as SupabaseClient,
		rpcCalls,
	};
}

describe("loadCourseExportForTeacher authorization & read-only guarantees (EXP-03)", () => {
	it("rejects invalid course UUID with 400", async () => {
		const { supabase } = createMockSupabase();
		const res = await loadCourseExportForTeacher({
			supabase,
			userId: TEACHER_UUID,
			coursePublicId: "not-a-uuid",
		});
		expect(res).toMatchObject({ ok: false, status: 400 });
	});

	it("denies users without verified academic identity or non-teacher role with 403", async () => {
		const unverified = createMockSupabase({ hasIdentity: false });
		expect(
			await loadCourseExportForTeacher({
				supabase: unverified.supabase,
				userId: TEACHER_UUID,
				coursePublicId: VALID_COURSE_UUID,
			}),
		).toMatchObject({ ok: false, status: 403 });

		const student = createMockSupabase({ profileRole: "student" });
		expect(
			await loadCourseExportForTeacher({
				supabase: student.supabase,
				userId: TEACHER_UUID,
				coursePublicId: VALID_COURSE_UUID,
			}),
		).toMatchObject({ ok: false, status: 403 });
	});

	it("returns 404 when the course is missing or belongs to another teacher", async () => {
		const { supabase } = createMockSupabase({ course: null });
		const res = await loadCourseExportForTeacher({
			supabase,
			userId: TEACHER_UUID,
			coursePublicId: VALID_COURSE_UUID,
		});
		expect(res).toMatchObject({ ok: false, status: 404 });
	});

	it("returns 500 if confirmed historical attributions fail to load", async () => {
		const { supabase } = createMockSupabase({
			attributionError: { message: "course_export_access_denied" },
		});
		const res = await loadCourseExportForTeacher({
			supabase,
			userId: TEACHER_UUID,
			coursePublicId: VALID_COURSE_UUID,
		});
		expect(res).toMatchObject({ ok: false, status: 500 });
	});

	it("generates a readable XLSX for the authorized teacher strictly read-only", async () => {
		const { supabase, rpcCalls } = createMockSupabase();
		const res = await loadCourseExportForTeacher({
			supabase,
			userId: TEACHER_UUID,
			coursePublicId: VALID_COURSE_UUID,
			now: new Date("2026-11-23T12:00:00Z"),
		});

		expect(res.ok).toBe(true);
		if (!res.ok) return;

		expect(res.filename).toBe("Resultados_Algoritmos_2026-11-23.xlsx");
		expect(res.rowCount).toBe(1);
		expect(res.evaluationCount).toBe(2);
		expect(rpcCalls).toEqual([
			"has_academic_identity",
			"list_course_export_grade_attributions",
		]);

		expect(readSheetRows(res.buffer)).toEqual([
			[
				"Nombre",
				"Correo",
				"T1",
				"T2",
				"Promedio base",
				"Saldo",
				"Puntos aplicados",
				"Excedente",
				"Promedio ajustado",
			],
			["Alumna Uno", "uno@example.test", 19.5, 20, 19.75, 2, 0.5, 1.5, 20],
		]);
	});
});

