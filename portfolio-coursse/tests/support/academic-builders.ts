export type SyntheticStudent = {
	course_name: string;
	full_name: string;
	email: string;
	student_number: string;
};

export function syntheticStudent(
	overrides: Partial<SyntheticStudent> = {},
): SyntheticStudent {
	return {
		course_name: "Synthetic Course",
		full_name: "Synthetic Student",
		email: "synthetic-student@example.test",
		student_number: "SYN-001",
		...overrides,
	};
}

export function operationId(sequence = 1): string {
	return `00000000-0000-4000-8000-${sequence.toString().padStart(12, "0")}`;
}
