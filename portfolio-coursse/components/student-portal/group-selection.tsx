import { GroupSelectionList } from "@/components/student-portal/group-selection-list";
import {
	getStudentWindowState,
	normalizeGroupOptions,
} from "@/lib/student/group-selection";
import { createClient } from "@/lib/supabase/server";

type Props = {
	enrollmentId: number;
	courseName: string;
	currentGroupId: number | null;
	opensAt: string | null;
	closesAt: string | null;
};

export async function GroupSelection({
	enrollmentId,
	courseName,
	currentGroupId,
	opensAt,
	closesAt,
}: Props) {
	const windowState = getStudentWindowState(opensAt, closesAt);
	const supabase = await createClient();
	const { data, error } =
		opensAt && closesAt
			? await supabase.rpc("available_course_group_details", {
					enrollment_id: enrollmentId,
				})
			: { data: [], error: null };

	if (error) {
		console.error("Student group options query failed", {
			enrollmentId,
			error,
		});
	}

	return (
		<GroupSelectionList
			enrollmentId={enrollmentId}
			courseName={courseName}
			currentGroupId={currentGroupId}
			windowState={windowState}
			groups={error ? [] : normalizeGroupOptions(data)}
			loadError={Boolean(error)}
		/>
	);
}
