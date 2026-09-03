"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function voidPointTransaction(formData: FormData) {
	const transactionId = Number(formData.get("transaction_id"));
	const course = String(formData.get("course") ?? "").trim();
	const period = String(formData.get("period") ?? "").trim();
	const params = new URLSearchParams();
	if (period) params.set("period", period);
	if (course) params.set("course", course);
	const path = `/teacher/points${params.size ? `?${params.toString()}` : ""}`;
	if (!Number.isInteger(transactionId)) redirect(path);
	const supabase = await createClient();
	const { data: voided, error } = await supabase.rpc(
		"void_point_transaction",
		{
			target_transaction_id: transactionId,
		},
	);
	if (error || !voided) {
		console.error("Point void failed", { error, transactionId, voided });
		redirect(`${path}${params.size ? "&" : "?"}error=transaction`);
	}
	revalidatePath("/teacher/points");
	revalidatePath("/dashboard");
	redirect(`${path}${params.size ? "&" : "?"}refresh=1`);
}

export async function registerPointTransaction(formData: FormData) {
	const course = String(formData.get("course") ?? "").trim();
	const period = String(formData.get("period") ?? "").trim();
	const authorizationId = Number(formData.get("authorized_student_id"));
	const points = Number(formData.get("points"));
	const reason = String(formData.get("reason") ?? "").trim();
	const transactionPublicId = String(
		formData.get("transaction_public_id") ?? "",
	).trim();

	const params = new URLSearchParams();
	if (period) params.set("period", period);
	if (course) params.set("course", course);
	const path = `/teacher/points${params.size ? `?${params.toString()}` : ""}`;

	if (
		!course ||
		!Number.isInteger(authorizationId) ||
		!Number.isInteger(points) ||
		points === 0 ||
		!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
			transactionPublicId,
		)
	) {
		redirect(`${path}${course ? "&" : "?"}error=transaction`);
	}

	const supabase = await createClient();
	const { data: userData } = await supabase.auth.getUser();
	if (!userData.user) redirect("/login");

	const { error } = await supabase.from("point_transactions").insert({
		public_id: transactionPublicId,
		authorized_student_id: authorizationId,
		points,
		reason: reason || null,
		created_by: userData.user.id,
	});
	if (error && error.code !== "23505")
		redirect(`${path}${params.size ? "&" : "?"}error=transaction`);

	revalidatePath("/teacher/points");
	redirect(`${path}${params.size ? "&" : "?"}refresh=1`);
}
