"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
	mapGroupSelectionRpcError,
	STUDENT_GROUP_ERROR_MESSAGES,
	type GroupSelectionErrorCode,
} from "@/lib/student/group-selection";
import { createClient } from "@/lib/supabase/server";

export type SelectStudentGroupActionResult =
	| { ok: true; groupId: number }
	| { ok: false; code: GroupSelectionErrorCode; error: string };

/**
 * Selects or switches a student's group via `select_course_group` and returns structured feedback.
 */
export async function selectStudentGroupAction(
	enrollmentId: number,
	groupId: number,
): Promise<SelectStudentGroupActionResult> {
	if (
		!Number.isSafeInteger(enrollmentId) ||
		enrollmentId <= 0 ||
		!Number.isSafeInteger(groupId) ||
		groupId <= 0
	) {
		return {
			ok: false,
			code: "group",
			error: STUDENT_GROUP_ERROR_MESSAGES.group,
		};
	}

	const supabase = await createClient();
	const { error } = await supabase.rpc("select_course_group", {
		enrollment_id: enrollmentId,
		selected_group_id: groupId,
	});

	if (error) {
		const mapped = mapGroupSelectionRpcError(error.message);
		return { ok: false, code: mapped.code, error: mapped.message };
	}

	revalidatePath("/student");
	return { ok: true, groupId };
}

export async function selectStudentGroup(formData: FormData) {
	const enrollmentId = Number(formData.get("enrollment_id"));
	const groupId = Number(formData.get("group_id"));
	const result = await selectStudentGroupAction(enrollmentId, groupId);
	if (!result.ok) {
		redirect(`/student?error=${result.code}`);
	}
	redirect("/student?selected-group=1");
}
