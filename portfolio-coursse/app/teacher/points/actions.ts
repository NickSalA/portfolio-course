"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function voidPointTransaction(formData: FormData) {
	const transactionId = Number(formData.get("transaction_id"));
	const course = String(formData.get("course") ?? "").trim();
	const period = String(formData.get("period") ?? "").trim();
	const reason = String(formData.get("void_reason") ?? "").trim();
	const params = new URLSearchParams();
	if (period) params.set("period", period);
	if (course) params.set("course", course);
	const path = `/teacher/points${params.size ? `?${params.toString()}` : ""}`;
	if (
		!Number.isSafeInteger(transactionId) ||
		transactionId <= 0 ||
		!course ||
		!period ||
		!reason
	)
		redirect(`${path}${params.size ? "&" : "?"}error=transaction`);
	const supabase = await createClient();
	const { data: voided, error } = await supabase.rpc(
		"void_point_transaction_in_context",
		{
			target_transaction_id: transactionId,
			target_course: course,
			target_period: period,
			void_reason_input: reason,
		},
	);
	if (error || !voided) {
		console.error("Point void failed", { error, transactionId, voided });
		redirect(`${path}${params.size ? "&" : "?"}error=transaction`);
	}
	revalidatePath("/teacher/points");
	revalidatePath("/student");
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
		!period ||
		!Number.isSafeInteger(authorizationId) ||
		authorizationId <= 0 ||
		!Number.isInteger(points) ||
		points === 0 ||
		!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
			transactionPublicId,
		)
	) {
		redirect(`${path}${params.size ? "&" : "?"}error=transaction`);
	}

	const supabase = await createClient();
	const { data: userData } = await supabase.auth.getUser();
	if (!userData.user) redirect("/login");

	const { data: registered, error } = await supabase.rpc(
		"register_point_transaction_in_context",
		{
			target_authorization_id: authorizationId,
			target_course: course,
			target_period: period,
			transaction_public_id: transactionPublicId,
			transaction_points: points,
			transaction_reason: reason || null,
		},
	);
	if (error || !registered) {
		console.error("Point registration failed", {
			error,
			authorizationId,
			registered,
		});
		redirect(`${path}${params.size ? "&" : "?"}error=transaction`);
	}

	revalidatePath("/teacher/points");
	revalidatePath("/student");
	redirect(`${path}${params.size ? "&" : "?"}refresh=1`);
}
