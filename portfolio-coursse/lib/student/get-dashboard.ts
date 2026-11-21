import type { SupabaseClient } from "@supabase/supabase-js";

type Relationship<T> = T | T[] | null;

type RawTransaction = {
	id: number;
	points: number;
	reason: string | null;
	created_at: string;
	is_voided: boolean;
};

type RawEnrollment = {
	id: number;
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

export type StudentEnrollmentSummary = {
	id: number;
	groupId: number | null;
	groupName: string | null;
	courseName: string | null;
	periodCode: string | null;
	groupSelectionOpensAt: string | null;
	groupSelectionClosesAt: string | null;
	transactions: StudentPointTransaction[];
	balance: number;
};

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
			"id, group_id, groups(name), courses(name, group_selection_opens_at, group_selection_closes_at, academic_periods(code)), authorized_students(point_transactions(id, points, reason, created_at, is_voided))",
		)
		.eq("student_id", studentId)
		.eq("status", "active");
	if (error) {
		console.error("Student enrollment query failed", { studentId, error });
		return { enrollments: [], error: "query-failed" };
	}

	const enrollments = ((data ?? []) as unknown as RawEnrollment[]).map(
		(enrollment) => {
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

			return {
				id: enrollment.id,
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
			};
		},
	);

	return { enrollments, error: null };
}
