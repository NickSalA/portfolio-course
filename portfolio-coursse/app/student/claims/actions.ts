"use server";

import { revalidatePath } from "next/cache";
import {
	submitGroupGradeClaim,
	submitPointTransactionClaim,
	type SubmitClaimResult,
} from "@/lib/claims/submit-claim";
import { createClient } from "@/lib/supabase/server";

export async function submitGroupGradeClaimAction(
	formData: FormData,
): Promise<SubmitClaimResult> {
	const supabase = await createClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return {
			ok: false,
			code: "unauthorized",
			error: "Debes iniciar sesión para presentar un reclamo.",
		};
	}

	const groupPublicId = String(formData.get("group_public_id") ?? "");
	const evaluationPublicId = String(formData.get("evaluation_public_id") ?? "");
	const reason = String(formData.get("reason") ?? "");

	const result = await submitGroupGradeClaim({
		supabase,
		groupPublicId,
		evaluationPublicId,
		reason,
	});

	if (result.ok) {
		revalidatePath("/student");
	}

	return result;
}

export async function submitPointTransactionClaimAction(
	formData: FormData,
): Promise<SubmitClaimResult> {
	const supabase = await createClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return {
			ok: false,
			code: "unauthorized",
			error: "Debes iniciar sesión para presentar un reclamo.",
		};
	}

	const rawTransactionId = String(
		formData.get("point_transaction_id") ?? "",
	).trim();
	const pointTransactionId = /^\d+$/.test(rawTransactionId)
		? Number(rawTransactionId)
		: Number.NaN;
	const reason = String(formData.get("reason") ?? "");

	const result = await submitPointTransactionClaim({
		supabase,
		pointTransactionId,
		reason,
	});

	if (result.ok) {
		revalidatePath("/student");
	}

	return result;
}

