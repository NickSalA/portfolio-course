import type { SupabaseClient } from "@supabase/supabase-js";

type Relationship<T> = T | T[] | null;

type RawTransaction = {
	id: number;
	points: number;
	reason: string | null;
	created_at: string;
	is_voided: boolean;
};

type RawGroupGrade = {
	evaluation_public_id: string;
	evaluation_name: string;
	group_public_id: string;
	group_name: string;
	performed_at: string;
	grade: number | string | null;
};

type RawEnrollment = {
	id: number;
	course_id: number;
	group_id: number | null;
	groups: Relationship<{ name: string | null }>;
	courses: Relationship<{
		name: string | null;
		group_selection_opens_at: string | null;
		group_selection_closes_at: string | null;
		academic_periods: Relationship<{ code: string | null }>;
	}>;
	authorized_students: Relationship<{
		point_transactions: Relationship<RawTransaction>;
	}>;
};

export type StudentPointTransaction = Omit<RawTransaction, "is_voided">;

export type StudentGroupGrade = {
	evaluationPublicId: string;
	evaluationName: string;
	groupPublicId: string;
	groupName: string;
	performedAt: string;
	grade: number | null;
};

export type StudentEnrollmentSummary = {
	id: number;
	courseId: number;
	groupId: number | null;
	groupName: string | null;
	courseName: string | null;
	periodCode: string | null;
	groupSelectionOpensAt: string | null;
	groupSelectionClosesAt: string | null;
	transactions: StudentPointTransaction[];
	balance: number;
	grades: StudentGroupGrade[];
	gradesError: boolean;
};

function parseGradeValue(
	rawGrade: number | string | null | undefined,
): number | null {
	if (rawGrade === null || rawGrade === undefined) {
		return null;
	}
	if (typeof rawGrade === "string" && rawGrade.trim() === "") {
		return null;
	}
	const numeric = Number(rawGrade);
	return Number.isFinite(numeric) ? numeric : null;
}

function one<T>(relationship: Relationship<T>) {
	return Array.isArray(relationship)
		? (relationship[0] ?? null)
		: relationship;
}

function many<T>(relationship: Relationship<T> | undefined): T[] {
	if (!relationship) return [];
	return (Array.isArray(relationship) ? relationship : [relationship]).filter(
		(item): item is T => item !== undefined,
	);
}

export type StudentDashboardResult = {
	enrollments: StudentEnrollmentSummary[];
	error: "query-failed" | null;
};

export async function getStudentDashboard(
	supabase: SupabaseClient,
	studentId: string,
): Promise<StudentDashboardResult> {
	const { data: enrollmentSynced, error: enrollmentSyncError } =
		await supabase.rpc("sync_authorized_student");
	if (enrollmentSyncError) {
		console.error("Student enrollment sync failed", {
			studentId,
			error: enrollmentSyncError,
		});
		return { enrollments: [], error: "query-failed" };
	}
	if (!enrollmentSynced) {
		// Authenticated account without active authorizations; continue to query
		// so previously linked enrollments remain inspectable if applicable.
	}

	const { data, error } = await supabase
		.from("course_students")
		.select(
			"id, course_id, group_id, groups(name), courses(name, group_selection_opens_at, group_selection_closes_at, academic_periods(code)), authorized_students(point_transactions(id, points, reason, created_at, is_voided))",
		)
		.eq("student_id", studentId)
		.eq("status", "active");
	if (error) {
		console.error("Student enrollment query failed", { studentId, error });
		return { enrollments: [], error: "query-failed" };
	}

	const rawEnrollments = (data ?? []) as unknown as RawEnrollment[];
	const enrollments = await Promise.all(
		rawEnrollments.map(async (enrollment) => {
			const course = one(enrollment.courses);
			const authorizedStudent = one(enrollment.authorized_students);
			const transactions = many(authorizedStudent?.point_transactions)
				.filter((transaction) => !transaction.is_voided)
				.map((transaction) => ({
					id: transaction.id,
					points: transaction.points,
					reason: transaction.reason,
					created_at: transaction.created_at,
				}));

			const { data: rawGrades, error: gradesRpcError } =
				await supabase.rpc("list_student_group_grades", {
					target_course_id: enrollment.course_id,
				});

			if (gradesRpcError) {
				console.error("Student group grades query failed", {
					studentId,
					courseId: enrollment.course_id,
					error: gradesRpcError,
				});
			}

			const grades: StudentGroupGrade[] = gradesRpcError
				? []
				: ((Array.isArray(rawGrades) ? rawGrades : []) as RawGroupGrade[]).map(
						(row) => ({
							evaluationPublicId: row.evaluation_public_id,
							evaluationName: row.evaluation_name,
							groupPublicId: row.group_public_id,
							groupName: row.group_name,
							performedAt: row.performed_at,
							grade: parseGradeValue(row.grade),
						}),
					);

			return {
				id: enrollment.id,
				courseId: enrollment.course_id,
				groupId: enrollment.group_id,
				groupName: one(enrollment.groups)?.name ?? null,
				courseName: course?.name ?? null,
				periodCode: one(course?.academic_periods ?? null)?.code ?? null,
				groupSelectionOpensAt: course?.group_selection_opens_at ?? null,
				groupSelectionClosesAt:
					course?.group_selection_closes_at ?? null,
				transactions,
				balance: transactions.reduce(
					(total, transaction) => total + transaction.points,
					0,
				),
				grades,
				gradesError: Boolean(gradesRpcError),
			};
		}),
	);

	return { enrollments, error: null };
}
