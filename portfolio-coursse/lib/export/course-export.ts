import * as XLSX from "xlsx";
import {
	calculateActivePointsBalance,
	calculateAdjustedAverage,
	type PointsMovement,
} from "./adjusted-average";

export type CourseExportEvaluation = {
	id: number;
	name: string;
	position: number;
	performedAt: string | null;
};

export type CourseExportStudent = {
	authorizedStudentId: number;
	fullName: string | null;
	email: string;
	status: "active" | "inactive";
	movements: ReadonlyArray<PointsMovement>;
};

export type CourseExportGradeAttribution = {
	authorizedStudentId: number;
	evaluationId: number;
	groupId: number;
	grade: number;
	revision: number;
};

export type CourseExportRow = {
	authorizedStudentId: number;
	fullName: string;
	email: string;
	gradesByEvaluation: Record<number, number | null>;
	baseAverage: number | null;
	balance: number;
	applied: number | null;
	surplus: number | null;
	adjustedAverage: number | null;
};

export type CourseExportColumnSpec = {
	headers: string[];
	evaluationColumns: { evaluationId: number; header: string }[];
	baseAverageColIndex: number;
	balanceColIndex: number;
	appliedColIndex: number;
	surplusColIndex: number;
	adjustedAverageColIndex: number;
};

const RESERVED_EXPORT_HEADERS = new Set([
	"nombre",
	"correo",
	"promedio base",
	"saldo",
	"puntos aplicados",
	"excedente",
	"promedio ajustado",
]);

export const COURSE_EXPORT_SHEET_NAME = "Resultados Curso";

function sortEvaluations(
	evaluations: ReadonlyArray<CourseExportEvaluation>,
): CourseExportEvaluation[] {
	return [...evaluations].sort(
		(a, b) => a.position - b.position || a.id - b.id,
	);
}

/**
 * Builds deterministic, collision-safe XLSX headers matching the EXP-01 contract:
 * Nombre | Correo | <Actividades...> | Promedio base | Saldo | Puntos aplicados | Excedente | Promedio ajustado
 */
export function buildCourseExportColumns(
	evaluations: ReadonlyArray<CourseExportEvaluation>,
): CourseExportColumnSpec {
	const ordered = sortEvaluations(evaluations);
	const usedLower = new Set<string>(RESERVED_EXPORT_HEADERS);
	const evaluationColumns: { evaluationId: number; header: string }[] = [];

	for (const evaluation of ordered) {
		const rawName = evaluation.name.trim() || `Evaluación ${evaluation.position}`;
		let candidate = rawName;
		let suffix = 2;
		while (usedLower.has(candidate.toLowerCase())) {
			candidate = `${rawName} (${suffix})`;
			suffix += 1;
		}
		usedLower.add(candidate.toLowerCase());
		evaluationColumns.push({
			evaluationId: evaluation.id,
			header: candidate,
		});
	}

	const headers = [
		"Nombre",
		"Correo",
		...evaluationColumns.map((column) => column.header),
		"Promedio base",
		"Saldo",
		"Puntos aplicados",
		"Excedente",
		"Promedio ajustado",
	];

	const fixedStart = 2 + evaluationColumns.length;

	return {
		headers,
		evaluationColumns,
		baseAverageColIndex: fixedStart,
		balanceColIndex: fixedStart + 1,
		appliedColIndex: fixedStart + 2,
		surplusColIndex: fixedStart + 3,
		adjustedAverageColIndex: fixedStart + 4,
	};
}

/**
 * Pure transformation combining historical confirmed grade attributions and
 * active points movements into per-student export rows without mutating inputs.
 *
 * Rules (EXP-01 / EXP-02 / EXP-03):
 * - Only confirmed attributions (`revision > 0`) are assigned; missing or
 *   unestablished attributions stay `null` (pending) and are never inferred
 *   from current group membership.
 * - Explicit `0` is preserved as numeric `0`, distinct from `null`.
 * - Active students are always included; inactive students are included only
 *   when they have at least one confirmed historical grade attribution in the
 *   course so historical results are not silently dropped.
 * - Balance is derived strictly from active (non-voided) movements and remains
 *   visible even when grades are pending or there are no evaluations.
 */
export function buildCourseExportRows({
	students,
	evaluations,
	attributions,
}: {
	students: ReadonlyArray<CourseExportStudent>;
	evaluations: ReadonlyArray<CourseExportEvaluation>;
	attributions: ReadonlyArray<CourseExportGradeAttribution>;
}): CourseExportRow[] {
	const orderedEvaluations = sortEvaluations(evaluations);
	const validEvaluationIds = new Set(
		orderedEvaluations.map((evaluation) => evaluation.id),
	);

	const attributionMap = new Map<string, number>();
	const studentsWithHistoricalGrades = new Set<number>();

	for (const attribution of attributions) {
		if (
			attribution.revision <= 0 ||
			!validEvaluationIds.has(attribution.evaluationId) ||
			typeof attribution.grade !== "number" ||
			!Number.isFinite(attribution.grade)
		) {
			continue;
		}
		const key = `${attribution.authorizedStudentId}:${attribution.evaluationId}`;
		attributionMap.set(key, attribution.grade);
		studentsWithHistoricalGrades.add(attribution.authorizedStudentId);
	}

	const eligibleStudents = students
		.filter(
			(student) =>
				student.status === "active" ||
				studentsWithHistoricalGrades.has(student.authorizedStudentId),
		)
		.sort((a, b) => {
			const nameA = (a.fullName?.trim() || a.email).toLocaleLowerCase("es");
			const nameB = (b.fullName?.trim() || b.email).toLocaleLowerCase("es");
			return (
				nameA.localeCompare(nameB, "es") ||
				a.email.toLowerCase().localeCompare(b.email.toLowerCase(), "es") ||
				a.authorizedStudentId - b.authorizedStudentId
			);
		});

	return eligibleStudents.map((student) => {
		const gradesByEvaluation: Record<number, number | null> = {};
		const orderedGrades: (number | null)[] = [];

		for (const evaluation of orderedEvaluations) {
			const key = `${student.authorizedStudentId}:${evaluation.id}`;
			const grade = attributionMap.has(key)
				? (attributionMap.get(key) ?? null)
				: null;
			gradesByEvaluation[evaluation.id] = grade;
			orderedGrades.push(grade);
		}

		const balance = calculateActivePointsBalance(student.movements);
		const calculation = calculateAdjustedAverage(orderedGrades, balance);

		return {
			authorizedStudentId: student.authorizedStudentId,
			fullName: student.fullName?.trim() ?? "",
			email: student.email,
			gradesByEvaluation,
			baseAverage: calculation.baseAverage,
			balance,
			applied: calculation.applied,
			surplus: calculation.surplus,
			adjustedAverage: calculation.adjustedAverage,
		};
	});
}

function applyNumberFormat(
	sheet: XLSX.WorkSheet,
	rowIndex: number,
	colIndex: number,
	format: string,
) {
	const address = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
	const cell = sheet[address];
	if (cell && cell.t === "n") {
		cell.z = format;
	}
}

/**
 * Builds an XLSX workbook with one row per student, preserving empty cells for
 * pending grades/averages, numeric `0` for explicit zero, full precision for
 * base average displayed with 2 decimals, and half-up 2-decimal adjusted average.
 */
export function buildCourseExportWorkbook({
	evaluations,
	rows,
}: {
	evaluations: ReadonlyArray<CourseExportEvaluation>;
	rows: ReadonlyArray<CourseExportRow>;
}): XLSX.WorkBook {
	const columnSpec = buildCourseExportColumns(evaluations);

	const aoa: (string | number | null)[][] = [
		columnSpec.headers,
		...rows.map((row) => [
			row.fullName,
			row.email,
			...columnSpec.evaluationColumns.map(
				(column) => row.gradesByEvaluation[column.evaluationId] ?? null,
			),
			row.baseAverage,
			row.balance,
			row.applied,
			row.surplus,
			row.adjustedAverage,
		]),
	];

	const worksheet = XLSX.utils.aoa_to_sheet(aoa);

	for (let r = 1; r <= rows.length; r += 1) {
		applyNumberFormat(worksheet, r, columnSpec.baseAverageColIndex, "0.00");
		applyNumberFormat(worksheet, r, columnSpec.balanceColIndex, "0");
		applyNumberFormat(
			worksheet,
			r,
			columnSpec.adjustedAverageColIndex,
			"0.00",
		);
	}

	worksheet["!cols"] = [
		{ wch: 28 },
		{ wch: 30 },
		...columnSpec.evaluationColumns.map((column) => ({
			wch: Math.max(12, Math.min(28, column.header.length + 4)),
		})),
		{ wch: 15 },
		{ wch: 10 },
		{ wch: 18 },
		{ wch: 12 },
		{ wch: 18 },
	];

	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, COURSE_EXPORT_SHEET_NAME);
	return workbook;
}

/**
 * Renders the course export XLSX workbook as a Node Buffer ready for HTTP download.
 */
export function renderCourseExportXlsxBuffer(input: {
	evaluations: ReadonlyArray<CourseExportEvaluation>;
	rows: ReadonlyArray<CourseExportRow>;
}): Buffer {
	const workbook = buildCourseExportWorkbook(input);
	return XLSX.write(workbook, {
		type: "buffer",
		bookType: "xlsx",
	}) as Buffer;
}

/**
 * Generates an ASCII-safe downloadable `.xlsx` filename for a course.
 */
export function buildCourseExportFilename(
	courseName: string,
	date: Date = new Date(),
): string {
	const normalized = courseName
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.trim()
		.replace(/[^a-zA-Z0-9-_]+/g, "_")
		.replace(/^_+|_+$/g, "");
	const safeName = normalized || "Curso";
	const stamp = date.toISOString().split("T")[0];
	return `Resultados_${safeName}_${stamp}.xlsx`;
}

