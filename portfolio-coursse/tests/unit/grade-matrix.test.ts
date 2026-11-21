import { describe, expect, it } from "vitest";
import {
	classifyGradeCellState,
	formatActivityDateLima,
	formatExportCellValue,
	formatGradeForDisplay,
	GRADE_INVALID_VALUE_MESSAGE,
	resolveEvaluationGroupSnapshot,
	summarizeGradeProgress,
	validateGradeInput,
	type EvaluationParticipantsState,
	type GradeRecord,
} from "../../lib/teacher/grade-matrix";

describe("grade matrix helpers", () => {
	it("validates 0-20 grades with up to 2 decimals and rejects empty or out-of-range inputs", () => {
		expect(validateGradeInput("0")).toEqual({ ok: true, value: 0 });
		expect(validateGradeInput("0.00")).toEqual({ ok: true, value: 0 });
		expect(validateGradeInput(" 15.75 ")).toEqual({
			ok: true,
			value: 15.75,
		});
		expect(validateGradeInput("15.500")).toEqual({ ok: true, value: 15.5 });
		expect(validateGradeInput("20")).toEqual({ ok: true, value: 20 });
		expect(validateGradeInput("20.00")).toEqual({ ok: true, value: 20 });

		for (const invalid of [
			"",
			"   ",
			"-0.01",
			"-1",
			"20.01",
			"12.345",
			"12,5",
			"12.",
			".5",
			"abc",
		]) {
			expect(validateGradeInput(invalid)).toEqual({
				ok: false,
				message: GRADE_INVALID_VALUE_MESSAGE,
			});
		}
	});

	it("formats evaluation timestamps in America/Lima and returns null on missing or invalid dates", () => {
		expect(formatActivityDateLima("2026-11-21T04:59:00.000Z")).toBe(
			"20/11/2026, 23:59 (Lima)",
		);
		expect(formatActivityDateLima(null)).toBeNull();
		expect(formatActivityDateLima("not-a-date")).toBeNull();
	});

	it("resolves historical group recipients while ignoring inactive/ungrouped students and flagging unknown history", () => {
		const studentNames: Record<number, string> = {
			10: "Alumno Uno",
			11: "Alumno Dos",
			12: "Alumno Inactivo",
			13: "Alumno Sin Grupo",
			14: "Alumno Grupo Dos",
		};
		const state: EvaluationParticipantsState = {
			error: false,
			rows: [
				{
					enrollment_id: 101,
					authorization_id: 10,
					student_id: "s1",
					membership_state: "grouped",
					group_id: 1,
				},
				{
					enrollment_id: 101,
					authorization_id: 10,
					student_id: "s1",
					membership_state: "grouped",
					group_id: 1,
				},
				{
					enrollment_id: 102,
					authorization_id: 11,
					student_id: "s2",
					membership_state: "grouped",
					group_id: 1,
				},
				{
					enrollment_id: 103,
					authorization_id: 12,
					student_id: "s3",
					membership_state: "inactive",
					group_id: 1,
				},
				{
					enrollment_id: 104,
					authorization_id: 13,
					student_id: "s4",
					membership_state: "ungrouped",
					group_id: null,
				},
				{
					enrollment_id: 105,
					authorization_id: 14,
					student_id: "s5",
					membership_state: "grouped",
					group_id: 2,
				},
				{
					enrollment_id: null,
					authorization_id: 15,
					student_id: null,
					membership_state: "unknown",
					group_id: null,
				},
			],
		};

		expect(resolveEvaluationGroupSnapshot(state, 1, studentNames)).toEqual({
			names: ["Alumno Uno", "Alumno Dos"],
			hasCourseUnknown: true,
			error: false,
		});
		expect(
			resolveEvaluationGroupSnapshot(undefined, 1, studentNames),
		).toEqual({
			names: [],
			hasCourseUnknown: false,
			error: false,
		});
		expect(
			resolveEvaluationGroupSnapshot(
				{ rows: [], error: true },
				1,
				studentNames,
			),
		).toEqual({
			names: [],
			hasCourseUnknown: false,
			error: true,
		});
	});

	it("classifies cell states distinguishing explicit zero, pending, corrected, legacy, undated, and unknown history", () => {
		const datedEv = { performed_at: "2026-11-18T15:00:00.000Z" };
		const undatedEv = { performed_at: null };

		expect(
			classifyGradeCellState({
				evaluation: datedEv,
				gradeRecord: { evaluation_id: 1, grade: 0, revision: 1 },
			}),
		).toMatchObject({ kind: "saved", label: "Calificada" });

		expect(
			classifyGradeCellState({
				evaluation: datedEv,
				gradeRecord: undefined,
			}),
		).toMatchObject({ kind: "pending", label: "Pendiente" });

		expect(
			classifyGradeCellState({
				evaluation: datedEv,
				gradeRecord: { evaluation_id: 1, grade: 18.5, revision: 3 },
			}),
		).toMatchObject({ kind: "corrected", label: "Corregida · rev. 3" });

		expect(
			classifyGradeCellState({
				evaluation: datedEv,
				gradeRecord: { evaluation_id: 1, grade: 14, revision: 0 },
			}),
		).toMatchObject({
			kind: "legacy",
			label: "Bloqueada · sin verificar",
		});

		expect(
			classifyGradeCellState({
				evaluation: undatedEv,
				gradeRecord: undefined,
			}),
		).toMatchObject({ kind: "undated", label: "Sin fecha" });

		expect(
			classifyGradeCellState({
				evaluation: datedEv,
				gradeRecord: undefined,
				snapshot: { hasCourseUnknown: true },
			}),
		).toMatchObject({
			kind: "unknown-history",
			label: "Padrón por verificar",
		});
	});

	it("summarizes grading progress and formats values for display and Excel export without '-' placeholders", () => {
		const groups = [
			{
				id: 1,
				grades: {
					10: { evaluation_id: 10, grade: 0, revision: 1 },
					11: { evaluation_id: 11, grade: null, revision: 0 },
				} as Record<number, GradeRecord>,
			},
			{
				id: 2,
				grades: {
					10: { evaluation_id: 10, grade: 14, revision: 0 },
				} as Record<number, GradeRecord>,
			},
		];
		const evaluations = [
			{ id: 10, performed_at: "2026-11-18T15:00:00.000Z" },
			{ id: 11, performed_at: null },
		];

		expect(
			summarizeGradeProgress(
				groups,
				evaluations,
				(group, evId) => group.grades[evId],
			),
		).toEqual({
			totalCells: 4,
			gradedCells: 2,
			pendingCells: 2,
			legacyCells: 1,
			undatedCells: 2,
			byEvaluation: {
				10: { total: 2, graded: 2, pending: 0 },
				11: { total: 2, graded: 0, pending: 2 },
			},
		});

		expect(formatGradeForDisplay(0)).toBe("0");
		expect(formatGradeForDisplay(null)).toBe("");
		expect(formatExportCellValue(0)).toBe(0);
		expect(formatExportCellValue(15.75)).toBe(15.75);
		expect(formatExportCellValue(null)).toBe("");
		expect(formatExportCellValue(undefined)).toBe("");
	});
});
