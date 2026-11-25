import {
	formatLimaDateTime,
	getSelectionWindowStatus,
	type SelectionWindowStatus,
} from "../teacher/group-config";

export type StudentGroupMember = {
	full_name: string;
};

export type StudentGroupOption = {
	id: number;
	group_position: number;
	capacity: number;
	active_members: number;
	members: StudentGroupMember[];
};

export type StudentWindowState = {
	status: SelectionWindowStatus;
	badgeLabel: string;
	heading: string;
	description: string;
	formattedOpensAt: string | null;
	formattedClosesAt: string | null;
};

export type GroupOptionViewModel = {
	id: number;
	name: string;
	isCurrent: boolean;
	isFull: boolean;
	availableSeats: number;
	occupancyLabel: string;
	availabilityLabel: string;
	canSelect: boolean;
	actionLabel: string;
	ariaActionLabel: string;
};

export type GroupSelectionErrorCode =
	| "group-full"
	| "group-closed"
	| "group-unavailable"
	| "enrollment-not-found"
	| "not-authenticated"
	| "group";

export type GroupSelectionErrorInfo = {
	code: GroupSelectionErrorCode;
	message: string;
};

export const STUDENT_GROUP_ERROR_MESSAGES: Record<
	GroupSelectionErrorCode,
	string
> = {
	"group-full": "Ese grupo acaba de llenarse. Elige otro con cupo disponible.",
	"group-closed": "La ventana de selección de grupos está cerrada.",
	"group-unavailable": "Ese grupo no está disponible para este curso.",
	"enrollment-not-found":
		"No encontramos tu matrícula activa en este curso. Recarga la página para verificar tu acceso.",
	"not-authenticated":
		"Tu sesión expiró. Vuelve a iniciar sesión para elegir un grupo.",
	group: "No se pudo seleccionar ese grupo. Inténtalo nuevamente.",
};

/**
 * Maps `select_course_group` PostgreSQL error messages to user-facing Spanish messages.
 */
export function mapGroupSelectionRpcError(
	message?: string | null,
): GroupSelectionErrorInfo {
	const raw = message ?? "";
	if (raw.includes("group_full")) {
		return {
			code: "group-full",
			message: STUDENT_GROUP_ERROR_MESSAGES["group-full"],
		};
	}
	if (raw.includes("group_selection_closed")) {
		return {
			code: "group-closed",
			message: STUDENT_GROUP_ERROR_MESSAGES["group-closed"],
		};
	}
	if (raw.includes("group_not_available")) {
		return {
			code: "group-unavailable",
			message: STUDENT_GROUP_ERROR_MESSAGES["group-unavailable"],
		};
	}
	if (raw.includes("enrollment_not_found")) {
		return {
			code: "enrollment-not-found",
			message: STUDENT_GROUP_ERROR_MESSAGES["enrollment-not-found"],
		};
	}
	if (raw.includes("not_authenticated")) {
		return {
			code: "not-authenticated",
			message: STUDENT_GROUP_ERROR_MESSAGES["not-authenticated"],
		};
	}
	return {
		code: "group",
		message: STUDENT_GROUP_ERROR_MESSAGES.group,
	};
}

/**
 * Derives the student-facing window state badge, heading, and America/Lima schedule text.
 */
export function getStudentWindowState(
	opensAt: string | null,
	closesAt: string | null,
	now: Date = new Date(),
): StudentWindowState {
	const status = getSelectionWindowStatus(opensAt, closesAt, now);
	const rawOpens = formatLimaDateTime(opensAt);
	const rawCloses = formatLimaDateTime(closesAt);
	const formattedOpensAt = rawOpens ? `${rawOpens} (Lima)` : null;
	const formattedClosesAt = rawCloses ? `${rawCloses} (Lima)` : null;

	if (status === "unconfigured") {
		return {
			status,
			badgeLabel: "Sin configurar",
			heading: "Selección de grupo",
			description:
				"La selección de grupo aún no está configurada por el docente.",
			formattedOpensAt: null,
			formattedClosesAt: null,
		};
	}

	if (status === "scheduled") {
		return {
			status,
			badgeLabel: "Programada",
			heading: "Selección de grupo",
			description: `Se habilitará del ${formattedOpensAt ?? ""} al ${formattedClosesAt ?? ""}. Los integrantes solo se muestran mientras la ventana esté abierta.`,
			formattedOpensAt,
			formattedClosesAt,
		};
	}

	if (status === "open") {
		return {
			status,
			badgeLabel: "Abierta",
			heading: "Elige o cambia tu grupo",
			description: `Disponible del ${formattedOpensAt ?? ""} al ${formattedClosesAt ?? ""}.`,
			formattedOpensAt,
			formattedClosesAt,
		};
	}

	return {
		status,
		badgeLabel: "Cerrada",
		heading: "Selección de grupo",
		description: `La ventana cerró el ${formattedClosesAt ?? ""}. Ya no puedes cambiar de grupo salvo que el docente reabra la selección para todo el curso.`,
		formattedOpensAt,
		formattedClosesAt,
	};
}

/**
 * Builds accessible labels, seat counts, and selectability for a group option card.
 */
export function getGroupOptionViewModel({
	group,
	currentGroupId,
	windowStatus,
	courseName,
}: {
	group: Pick<
		StudentGroupOption,
		"id" | "group_position" | "capacity" | "active_members"
	>;
	currentGroupId: number | null;
	windowStatus: SelectionWindowStatus;
	courseName: string;
}): GroupOptionViewModel {
	const name = `Grupo ${group.group_position}`;
	const isCurrent = currentGroupId !== null && group.id === currentGroupId;
	const isFull = group.active_members >= group.capacity;
	const availableSeats = Math.max(0, group.capacity - group.active_members);
	const occupancyLabel = `${group.active_members}/${group.capacity} integrantes`;

	const availabilityLabel = isCurrent
		? "Tu grupo actual"
		: isFull
			? "Sin cupo"
			: availableSeats === 1
				? "1 cupo disponible"
				: `${availableSeats} cupos disponibles`;

	const canSelect = windowStatus === "open" && !isCurrent && !isFull;

	let actionLabel: string;
	if (isCurrent) {
		actionLabel = "Seleccionado";
	} else if (windowStatus !== "open") {
		actionLabel =
			windowStatus === "scheduled" ? "Aún no abre" : "Ventana cerrada";
	} else if (isFull) {
		actionLabel = "Lleno";
	} else {
		actionLabel =
			currentGroupId !== null ? "Cambiar a este grupo" : "Elegir grupo";
	}

	const ariaActionLabel = isCurrent
		? `${name} ya es tu grupo actual en ${courseName}`
		: `${actionLabel}: ${name} en ${courseName}`;

	return {
		id: group.id,
		name,
		isCurrent,
		isFull,
		availableSeats,
		occupancyLabel,
		availabilityLabel,
		canSelect,
		actionLabel,
		ariaActionLabel,
	};
}

/**
 * Normalizes `available_course_group_details` RPC rows and strips unexpected member fields.
 */
export function normalizeGroupOptions(raw: unknown): StudentGroupOption[] {
	if (!Array.isArray(raw)) return [];

	const result: StudentGroupOption[] = [];
	for (const item of raw) {
		if (!item || typeof item !== "object") continue;
		const row = item as Record<string, unknown>;
		const id = Number(row.id);
		const groupPosition = Number(row.group_position);
		const capacity = Number(row.capacity);
		const activeMembers = Number(row.active_members);
		if (
			!Number.isSafeInteger(id) ||
			!Number.isSafeInteger(groupPosition) ||
			!Number.isFinite(capacity) ||
			!Number.isFinite(activeMembers)
		) {
			continue;
		}

		const members: StudentGroupMember[] = [];
		if (Array.isArray(row.members)) {
			for (const member of row.members) {
				if (!member || typeof member !== "object") continue;
				const fullName = (member as Record<string, unknown>).full_name;
				if (typeof fullName === "string" && fullName.trim().length > 0) {
					members.push({ full_name: fullName.trim() });
				}
			}
		}

		result.push({
			id,
			group_position: groupPosition,
			capacity,
			active_members: activeMembers,
			members,
		});
	}

	return result;
}
