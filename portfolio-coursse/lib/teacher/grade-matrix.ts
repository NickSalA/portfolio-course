export type GradeRecord = {
	evaluation_id: number;
	grade: number | null;
	revision: number;
	participants?: string[] | null;
};

export type ActivityParticipantRow = {
	enrollment_id: number | null;
	authorization_id: number;
	student_id: string | null;
	membership_state: "grouped" | "ungrouped" | "inactive" | "unknown";
	group_id: number | null;
};

export type EvaluationParticipantsState = {
	rows: ActivityParticipantRow[];
	error: boolean;
};

export type EvaluationItem = {
	id: number;
	public_id: string;
	name: string;
	position: number;
	performed_at: string | null;
};

export type GradeValidationResult =
	| { ok: true; value: number }
	| { ok: false; message: string };

export type GradeCellStatusKind =
	| "pending"
	| "saved"
	| "corrected"
	| "legacy"
	| "undated"
	| "unknown-history";

export type GradeCellClassification = {
	kind: GradeCellStatusKind;
	label: string;
	detail: string;
};

export type EvaluationGroupSnapshot = {
	names: string[];
	hasCourseUnknown: boolean;
	error: boolean;
};

export type GradeProgressSummary = {
	totalCells: number;
	gradedCells: number;
	pendingCells: number;
	legacyCells: number;
	undatedCells: number;
	byEvaluation: Record<
		number,
		{ total: number; graded: number; pending: number }
	>;
};

export const GRADE_INVALID_VALUE_MESSAGE =
	"Ingresa una nota de 0 a 20 con hasta dos decimales.";

const LIMA_TIMEZONE = "America/Lima";

/**
 * Validates a teacher-entered grade string on the 0-20 scale with at most two decimal places.
 * Distinguishes empty input (pending) from explicit `"0"`.
 */
export function validateGradeInput(raw: string): GradeValidationResult {
	const trimmed = raw.trim();
	if (!trimmed || !/^\d+(?:\.\d{1,2}0*)?$/.test(trimmed)) {
		return { ok: false, message: GRADE_INVALID_VALUE_MESSAGE };
	}

	const value = Number(trimmed);
	if (!Number.isFinite(value) || value < 0 || value > 20) {
		return { ok: false, message: GRADE_INVALID_VALUE_MESSAGE };
	}

	return { ok: true, value };
}

/**
 * Formats an activity ISO timestamp in `America/Lima` (`dd/mm/yyyy, HH:mm (Lima)`).
 */
export function formatActivityDateLima(iso: string | null): string | null {
	if (!iso) return null;
	const parsed = new Date(iso);
	if (Number.isNaN(parsed.getTime())) return null;

	const formatted = new Intl.DateTimeFormat("es-PE", {
		timeZone: LIMA_TIMEZONE,
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
	}).format(parsed);

	return `${formatted} (Lima)`;
}

/**
 * Extracts historical group recipients and unknown-membership warnings for an evaluation/group pair.
 */
export function resolveEvaluationGroupSnapshot(
	participantsState: EvaluationParticipantsState | undefined,
	groupId: number,
	studentNames: Record<number, string>,
): EvaluationGroupSnapshot {
	if (!participantsState) {
		return { names: [], hasCourseUnknown: false, error: false };
	}
	if (participantsState.error) {
		return { names: [], hasCourseUnknown: false, error: true };
	}

	const hasCourseUnknown = participantsState.rows.some(
		(row) => row.membership_state === "unknown",
	);

	const seenAuthorizations = new Set<number>();
	const names: string[] = [];

	for (const row of participantsState.rows) {
		if (
			row.membership_state !== "grouped" ||
			row.group_id !== groupId ||
			seenAuthorizations.has(row.authorization_id)
		) {
			continue;
		}
		seenAuthorizations.add(row.authorization_id);
		names.push(
			studentNames[row.authorization_id] ||
				`Autorización ${row.authorization_id}`,
		);
	}

	return { names, hasCourseUnknown, error: false };
}

/**
 * Classifies a matrix cell state in neutral text without confusing `0` with pending.
 */
export function classifyGradeCellState({
	evaluation,
	gradeRecord,
	snapshot,
}: {
	evaluation: Pick<EvaluationItem, "performed_at">;
	gradeRecord?: GradeRecord;
	snapshot?: Pick<EvaluationGroupSnapshot, "hasCourseUnknown">;
}): GradeCellClassification {
	const hasGrade = gradeRecord != null && gradeRecord.grade !== null;

	if (hasGrade && gradeRecord.revision === 0) {
		return {
			kind: "legacy",
			label: "Bloqueada · sin verificar",
			detail: "Nota previa con destinatarios históricos sin verificar.",
		};
	}

	if (hasGrade && gradeRecord.revision > 1) {
		return {
			kind: "corrected",
			label: `Corregida · rev. ${gradeRecord.revision}`,
			detail: "Nota confirmada y visible para sus participantes históricos.",
		};
	}

	if (hasGrade && gradeRecord.revision === 1) {
		return {
			kind: "saved",
			label: "Calificada",
			detail: "Nota confirmada y visible para sus participantes históricos.",
		};
	}

	if (!evaluation.performed_at) {
		return {
			kind: "undated",
			label: "Sin fecha",
			detail: "Registra la fecha de la actividad antes de calificar.",
		};
	}

	if (snapshot?.hasCourseUnknown) {
		return {
			kind: "unknown-history",
			label: "Padrón por verificar",
			detail: "Hay pertenencias históricas desconocidas en esta actividad.",
		};
	}

	return {
		kind: "pending",
		label: "Pendiente",
		detail: "Sin calificación registrada.",
	};
}

/**
 * Summarizes course and per-evaluation grading progress without conflating pending with `0`.
 */
export function summarizeGradeProgress<TGroup extends { id: number }>(
	groups: TGroup[],
	evaluations: Pick<EvaluationItem, "id" | "performed_at">[],
	getLatestGrade: (
		group: TGroup,
		evaluationId: number,
	) => GradeRecord | undefined,
): GradeProgressSummary {
	let totalCells = 0;
	let gradedCells = 0;
	let pendingCells = 0;
	let legacyCells = 0;
	let undatedCells = 0;
	const byEvaluation: GradeProgressSummary["byEvaluation"] = {};

	for (const ev of evaluations) {
		let evTotal = 0;
		let evGraded = 0;
		let evPending = 0;

		for (const group of groups) {
			totalCells += 1;
			evTotal += 1;

			const record = getLatestGrade(group, ev.id);
			if (record && record.grade !== null) {
				gradedCells += 1;
				evGraded += 1;
				if (record.revision === 0) {
					legacyCells += 1;
				}
			} else {
				pendingCells += 1;
				evPending += 1;
				if (!ev.performed_at) {
					undatedCells += 1;
				}
			}
		}

		byEvaluation[ev.id] = {
			total: evTotal,
			graded: evGraded,
			pending: evPending,
		};
	}

	return {
		totalCells,
		gradedCells,
		pendingCells,
		legacyCells,
		undatedCells,
		byEvaluation,
	};
}

/**
 * Formats a confirmed numeric grade for controlled text input display.
 */
export function formatGradeForDisplay(
	grade: number | null | undefined,
): string {
	return grade == null ? "" : String(grade);
}

/**
 * Formats an exported worksheet cell using empty string `""` for pending grades.
 */
export function formatExportCellValue(
	grade: number | null | undefined,
): string | number {
	return grade == null ? "" : grade;
}
