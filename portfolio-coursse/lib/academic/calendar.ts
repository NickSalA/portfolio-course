export type AcademicPeriodKey = {
	academicYear: number;
	semester: 0 | 1 | 2;
};

export function nextAcademicPeriod({
	academicYear,
	semester,
}: AcademicPeriodKey): AcademicPeriodKey {
	if (semester === 0) return { academicYear, semester: 1 };
	if (semester === 1) return { academicYear, semester: 2 };
	return { academicYear: academicYear + 1, semester: 0 };
}

export function periodCode({
	academicYear,
	semester,
}: AcademicPeriodKey): string {
	return `${academicYear}-${semester === 0 ? "0" : semester === 1 ? "I" : "II"}`;
}

// Dates can shift slightly between cycles. This is only the initial suggestion
// when no period has been marked as current; lifecycle status takes precedence.
export function suggestedAcademicPeriods(
	today: Date,
): [AcademicPeriodKey, AcademicPeriodKey] {
	const academicYear = today.getFullYear();
	const month = today.getMonth() + 1;
	const current: AcademicPeriodKey =
		month <= 2
			? { academicYear, semester: 0 }
			: month <= 7
				? { academicYear, semester: 1 }
				: { academicYear, semester: 2 };

	return [current, nextAcademicPeriod(current)];
}
