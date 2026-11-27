export const CLAIM_REASON_MAX_LENGTH = 2000;
export const CLAIM_RESPONSE_MAX_LENGTH = 2000;

const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ClaimType = "group_grade" | "point_transaction";
export type ClaimStatus = "pending" | "in_review" | "responded";

export type ClaimSubmissionErrorCode =
	| "invalid_input"
	| "unauthorized"
	| "forbidden"
	| "not_found"
	| "conflict"
	| "course_inactive"
	| "server_error";

export type ClaimTransitionErrorCode =
	| "invalid_input"
	| "unauthorized"
	| "forbidden"
	| "not_found"
	| "invalid_state"
	| "already_final"
	| "server_error";

export type ClaimValidationResult<T> =
	| { ok: true; value: T }
	| { ok: false; code: "invalid_input"; error: string };

export function validateClaimReason(
	rawReason: string,
): ClaimValidationResult<string> {
	const trimmed = rawReason.trim();
	if (!trimmed) {
		return {
			ok: false,
			code: "invalid_input",
			error: "Describe el motivo de tu reclamo antes de enviarlo.",
		};
	}
	if (trimmed.length > CLAIM_REASON_MAX_LENGTH) {
		return {
			ok: false,
			code: "invalid_input",
			error: `El motivo del reclamo no puede superar los ${CLAIM_REASON_MAX_LENGTH} caracteres.`,
		};
	}
	return { ok: true, value: trimmed };
}

export function validateGroupGradeClaimInput(input: {
	groupPublicId: string;
	evaluationPublicId: string;
	reason: string;
}): ClaimValidationResult<{
	groupPublicId: string;
	evaluationPublicId: string;
	reason: string;
}> {
	const groupPublicId = input.groupPublicId.trim();
	const evaluationPublicId = input.evaluationPublicId.trim();

	if (!UUID_PATTERN.test(groupPublicId) || !UUID_PATTERN.test(evaluationPublicId)) {
		return {
			ok: false,
			code: "invalid_input",
			error: "El grupo o la evaluación seleccionados no son válidos.",
		};
	}

	const reasonValidation = validateClaimReason(input.reason);
	if (!reasonValidation.ok) {
		return reasonValidation;
	}

	return {
		ok: true,
		value: {
			groupPublicId,
			evaluationPublicId,
			reason: reasonValidation.value,
		},
	};
}

export function validatePointTransactionClaimInput(input: {
	pointTransactionId: number;
	reason: string;
}): ClaimValidationResult<{
	pointTransactionId: number;
	reason: string;
}> {
	if (
		typeof input.pointTransactionId !== "number" ||
		!Number.isSafeInteger(input.pointTransactionId) ||
		input.pointTransactionId <= 0
	) {
		return {
			ok: false,
			code: "invalid_input",
			error: "El movimiento de puntos seleccionado no es válido.",
		};
	}

	const reasonValidation = validateClaimReason(input.reason);
	if (!reasonValidation.ok) {
		return reasonValidation;
	}

	return {
		ok: true,
		value: {
			pointTransactionId: input.pointTransactionId,
			reason: reasonValidation.value,
		},
	};
}

export function mapClaimSubmissionError(
	message: string | null | undefined,
	pgCode?: string | null,
): { code: ClaimSubmissionErrorCode; error: string } {
	const raw = (message ?? "").toLowerCase();

	if (raw.includes("claim_already_exists") || pgCode === "23505") {
		return {
			code: "conflict",
			error: "Ya existe un reclamo registrado sobre este resultado. Puedes consultarlo en tu panel.",
		};
	}
	if (raw.includes("claim_auth_required")) {
		return {
			code: "unauthorized",
			error: "Tu sesión académica no está verificada. Vuelve a iniciar sesión e inténtalo nuevamente.",
		};
	}
	if (raw.includes("claim_group_access_denied")) {
		return {
			code: "forbidden",
			error: "Solo los participantes históricos de esta actividad pueden presentar un reclamo grupal.",
		};
	}
	if (raw.includes("claim_point_access_denied")) {
		return {
			code: "forbidden",
			error: "Solo el alumno titular de este movimiento de puntos puede presentar un reclamo.",
		};
	}
	if (raw.includes("course_not_active")) {
		return {
			code: "course_inactive",
			error: "Este curso no está activo para registrar nuevos reclamos.",
		};
	}
	if (raw.includes("claim_target_not_found") || pgCode === "P0002") {
		return {
			code: "not_found",
			error: "No se encontró el registro académico seleccionado. Recarga la página e inténtalo de nuevo.",
		};
	}
	if (raw.includes("claim_reason_invalid")) {
		return {
			code: "invalid_input",
			error: `Ingresa un motivo válido de hasta ${CLAIM_REASON_MAX_LENGTH} caracteres.`,
		};
	}

	return {
		code: "server_error",
		error: "No se pudo registrar el reclamo. Tus notas y puntos no fueron modificados; inténtalo nuevamente.",
	};
}

export function validateClaimPublicId(
	rawPublicId: string,
): ClaimValidationResult<string> {
	const trimmed = rawPublicId.trim();
	if (!UUID_PATTERN.test(trimmed)) {
		return {
			ok: false,
			code: "invalid_input",
			error: "El identificador del reclamo no es válido.",
		};
	}
	return { ok: true, value: trimmed };
}

export function validateTeacherResponse(
	rawResponse: string,
): ClaimValidationResult<string> {
	const trimmed = rawResponse.trim();
	if (!trimmed) {
		return {
			ok: false,
			code: "invalid_input",
			error: "Ingresa una respuesta motivada antes de cerrar el reclamo.",
		};
	}
	if (trimmed.length > CLAIM_RESPONSE_MAX_LENGTH) {
		return {
			ok: false,
			code: "invalid_input",
			error: `La respuesta no puede superar los ${CLAIM_RESPONSE_MAX_LENGTH} caracteres.`,
		};
	}
	return { ok: true, value: trimmed };
}

export function mapClaimTransitionError(
	message: string | null | undefined,
	pgCode?: string | null,
): { code: ClaimTransitionErrorCode; error: string } {
	const raw = (message ?? "").toLowerCase();

	if (raw.includes("claim_response_is_final")) {
		return {
			code: "already_final",
			error: "Este reclamo ya fue respondido de forma definitiva y no admite reapertura ni cambios.",
		};
	}
	if (raw.includes("claim_must_be_in_review")) {
		return {
			code: "invalid_state",
			error: "Debes pasar el reclamo a «En revisión» antes de emitir una respuesta final.",
		};
	}
	if (raw.includes("claim_teacher_access_denied")) {
		return {
			code: "forbidden",
			error: "Solo el docente responsable del curso puede gestionar este reclamo.",
		};
	}
	if (raw.includes("claim_auth_required")) {
		return {
			code: "unauthorized",
			error: "Tu sesión académica no está verificada. Vuelve a iniciar sesión e inténtalo nuevamente.",
		};
	}
	if (raw.includes("claim_not_found") || pgCode === "P0002") {
		return {
			code: "not_found",
			error: "No se encontró el reclamo solicitado. Recarga la bandeja e inténtalo de nuevo.",
		};
	}
	if (raw.includes("claim_response_invalid")) {
		return {
			code: "invalid_input",
			error: `Ingresa una respuesta motivada de hasta ${CLAIM_RESPONSE_MAX_LENGTH} caracteres.`,
		};
	}

	return {
		code: "server_error",
		error: "No se pudo actualizar el estado del reclamo. Inténtalo nuevamente.",
	};
}

