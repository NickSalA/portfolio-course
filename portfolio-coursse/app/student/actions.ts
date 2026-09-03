"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function selectStudentGroup(formData: FormData) {
	const enrollmentId = Number(formData.get("enrollment_id"));
	const groupId = Number(formData.get("group_id"));
	if (!Number.isInteger(enrollmentId) || !Number.isInteger(groupId))
		redirect("/student?error=group");
	const supabase = await createClient();
	const { error } = await supabase.rpc("select_course_group", {
		enrollment_id: enrollmentId,
		selected_group_id: groupId,
	});
	if (error) {
		const code = error.message.includes("group_full")
			? "group-full"
			: error.message.includes("group_selection_closed")
				? "group-closed"
				: "group";
		redirect(`/student?error=${code}`);
	}
	redirect("/student?selected-group=1");
}
