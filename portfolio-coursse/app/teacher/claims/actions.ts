"use server";

import { revalidatePath } from "next/cache";
import {
	respondToClaim,
	startClaimReview,
	type RespondClaimResult,
	type StartReviewResult,
} from "@/lib/claims/teacher-claims";
import { createClient } from "@/lib/supabase/server";

export async function startClaimReviewAction(
	formData: FormData,
): Promise<StartReviewResult> {
	const supabase = await createClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return {
			ok: false,
			code: "unauthorized",
			error: "Debes iniciar sesión como docente para revisar reclamos.",
		};
	}

	const claimPublicId = String(formData.get("claim_public_id") ?? "");
	const result = await startClaimReview({ supabase, claimPublicId });

	if (result.ok) {
		revalidatePath("/teacher/claims");
		revalidatePath("/student");
	}

	return result;
}

export async function respondToClaimAction(
	formData: FormData,
): Promise<RespondClaimResult> {
	const supabase = await createClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return {
			ok: false,
			code: "unauthorized",
			error: "Debes iniciar sesión como docente para responder reclamos.",
		};
	}

	const claimPublicId = String(formData.get("claim_public_id") ?? "");
	const response = String(formData.get("teacher_response") ?? "");
	const result = await respondToClaim({ supabase, claimPublicId, response });

	if (result.ok) {
		revalidatePath("/teacher/claims");
		revalidatePath("/student");
	}

	return result;
}

