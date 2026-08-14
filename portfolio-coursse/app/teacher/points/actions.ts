"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function registerPointTransaction(formData: FormData) {
	const course = String(formData.get("course") ?? "").trim();
	const authorizationId = Number(formData.get("authorized_student_id"));
	const points = Number(formData.get("points"));
	const reason = String(formData.get("reason") ?? "").trim();
	const path = `/teacher/points${course ? `?course=${encodeURIComponent(course)}` : ""}`;

	if (!course || !Number.isInteger(authorizationId) || !Number.isInteger(points) || points === 0) {
		redirect(`${path}${course ? "&" : "?"}error=transaction`);
	}

	const supabase = await createClient();
	const { data: userData } = await supabase.auth.getUser();
	if (!userData.user) redirect("/login");

	const { error } = await supabase.from("point_transactions").insert({
		authorized_student_id: authorizationId,
		points,
		reason: reason || null,
		created_by: userData.user.id,
	});
	if (error) redirect(`${path}${course ? "&" : "?"}error=transaction`);

	revalidatePath("/teacher/points");
	redirect(path);
}
