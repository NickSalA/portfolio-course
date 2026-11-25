"use server";

import { revalidatePath } from "next/cache";
import {
	respondToClaim,
	startClaimReview,
	type RespondClaimResult,
	type StartReviewResult,
} from "@/lib/claims/teacher-claims";
import { validateClaimPublicId } from "@/lib/claims/validation";
import { dispatchClaimTeacherNotice } from "@/lib/mail/claim-notice";
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

export type RetryClaimNoticeActionResult =
	| { ok: true; message: string; sent: boolean; skipped: boolean }
	| { ok: false; error: string };

export async function retryClaimNoticeAction(
	formData: FormData,
): Promise<RetryClaimNoticeActionResult> {
	const supabase = await createClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return {
			ok: false,
			error: "Debes iniciar sesión como docente para reintentar el aviso.",
		};
	}

	const validatedId = validateClaimPublicId(
		String(formData.get("claim_public_id") ?? ""),
	);
	if (!validatedId.ok) {
		return { ok: false, error: validatedId.error };
	}

	const outcome = await dispatchClaimTeacherNotice({
		supabase,
		claimPublicId: validatedId.value,
	});

	revalidatePath("/teacher/claims");

	if (outcome.sent) {
		return {
			ok: true,
			sent: true,
			skipped: outcome.skipped,
			message: outcome.skipped
				? "El aviso por correo ya figura como enviado al servidor SMTP."
				: "Aviso reenviado al servidor SMTP. El envío técnico no certifica entrega ni lectura.",
		};
	}

	const errorMessages: Record<string, string> = {
		MAIL_CONFIG_INCOMPLETE:
			"Falta configurar las variables SMTP del servidor. El reclamo sigue disponible en esta bandeja.",
		MAIL_RECIPIENT_MISSING:
			"No se encontró un correo docente configurado. El reclamo sigue disponible en esta bandeja.",
		MAIL_SEND_FAILED:
			"El servidor SMTP rechazó o falló el envío. El reclamo no se perdió; puedes volver a intentarlo más tarde.",
	};

	return {
		ok: false,
		error:
			(outcome.errorCode && errorMessages[outcome.errorCode]) ||
			"No se pudo reintentar el aviso por correo. El reclamo permanece registrado en la plataforma.",
	};
}

