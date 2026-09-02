"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function registerPointTransaction(formData: FormData) {
	const course = String(formData.get("course") ?? "").trim();
	const period = String(formData.get("period") ?? "").trim();
	const authorizationId = Number(formData.get("authorized_student_id"));
	const points = Number(formData.get("points"));
	const reason = String(formData.get("reason") ?? "").trim();

	const params = new URLSearchParams();
	if (period) params.set("period", period);
	if (course) params.set("course", course);
	const path = `/teacher/points${params.size ? `?${params.toString()}` : ""}`;

	if (
		!course ||
		!Number.isInteger(authorizationId) ||
		!Number.isInteger(points) ||
		points === 0
	) {
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
	if (error) redirect(`${path}${params.size ? "&" : "?"}error=transaction`);

	revalidatePath("/teacher/points");
	redirect(`${path}${params.size ? "&" : "?"}refresh=1`);
}
