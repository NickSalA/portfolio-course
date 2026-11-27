export type SelectionWindowStatus =
	| "unconfigured"
	| "scheduled"
	| "open"
	| "closed";

export type LimaDateTimeParts = {
	date: string;
	time: string;
};

export type WindowValidationResult =
	| { ok: true; closesInPast: boolean }
	| { ok: false; code: "window-required" | "window-range" };

export type GroupSyncPreview = {
	valid: boolean;
	totalSeats: number | null;
	seatsShortfall: number;
	groupsDelta: number | null;
	capacityBelowMembers: boolean;
};

const LIMA_TIMEZONE = "America/Lima";
const LIMA_OFFSET = "-05:00";

/**
 * Returns the suggested group count from active authorized students and
 * per-group capacity. When no students are authorized yet, defaults to 1 so
 * teachers can still prepare initial groups.
 */
export function calculateSuggestedGroupCount(
	authorizedActive: number,
	capacity: number,
): number | null {
	if (!Number.isInteger(capacity) || capacity < 1) return null;
	if (!Number.isFinite(authorizedActive) || authorizedActive < 0) return null;
	if (authorizedActive === 0) return 1;
	return Math.ceil(authorizedActive / capacity);
}

/**
 * Formats an ISO timestamp or Date into `YYYY-MM-DD` and `HH:mm` parts in
 * America/Lima institutional time.
 */
export function toLimaDateTimeParts(
	value: string | Date | null,
): LimaDateTimeParts {
	if (!value) return { date: "", time: "" };
	const parsed = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(parsed.getTime())) return { date: "", time: "" };

	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: LIMA_TIMEZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
	}).formatToParts(parsed);

	const part = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((item) => item.type === type)?.value ?? "";

	return {
		date: `${part("year")}-${part("month")}-${part("day")}`,
		time: `${part("hour")}:${part("minute")}`,
	};
}

/**
 * Formats a timestamp for display in America/Lima (`dd/mm/yyyy, HH:mm`).
 */
export function formatLimaDateTime(value: string | null): string | null {
	if (!value) return null;
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return null;

	return new Intl.DateTimeFormat("es-PE", {
		timeZone: LIMA_TIMEZONE,
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
	}).format(parsed);
}

/**
 * Matches PostgreSQL boundary (`now >= opens && now < closes`).
 */
export function getSelectionWindowStatus(
	opensAt: string | null,
	closesAt: string | null,
	now = new Date(),
): SelectionWindowStatus {
	if (!opensAt || !closesAt) return "unconfigured";
	const opens = new Date(opensAt);
	const closes = new Date(closesAt);
	if (Number.isNaN(opens.getTime()) || Number.isNaN(closes.getTime())) {
		return "unconfigured";
	}
	if (closes.getTime() <= opens.getTime()) return "unconfigured";

	const nowMs = now.getTime();
	if (nowMs < opens.getTime()) return "scheduled";
	if (nowMs < closes.getTime()) return "open";
	return "closed";
}

/**
 * Parses `YYYY-MM-DD` and `HH:mm` (or `HH:mm:ss`) in fixed UTC-5 (America/Lima)
 * while rejecting impossible calendar dates like `2026-02-30`.
 */
export function parseLimaDateTime(date: string, time: string): Date | null {
	const dateMatch = date.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
	const timeMatch = time.trim().match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
	if (!dateMatch || !timeMatch) return null;

	const year = Number(dateMatch[1]);
	const month = Number(dateMatch[2]);
	const day = Number(dateMatch[3]);
	const hour = Number(timeMatch[1]);
	const minute = Number(timeMatch[2]);
	const second = timeMatch[3] ? Number(timeMatch[3]) : 0;

	if (
		month < 1 ||
		month > 12 ||
		day < 1 ||
		day > 31 ||
		hour > 23 ||
		minute > 59 ||
		second > 59
	) {
		return null;
	}

	const iso = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T${timeMatch[1]}:${timeMatch[2]}:${String(second).padStart(2, "0")}${LIMA_OFFSET}`;
	const parsed = new Date(iso);
	if (Number.isNaN(parsed.getTime())) return null;

	// Verify Lima date/time did not roll over (e.g. Feb 30 -> Mar 02).
	const check = toLimaDateTimeParts(parsed);
	if (
		check.date !== `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` ||
		check.time !== `${timeMatch[1]}:${timeMatch[2]}`
	) {
		return null;
	}

	// Ensure year matched strictly as well.
	if (Number(check.date.slice(0, 4)) !== year) return null;

	return parsed;
}

/**
 * Validates selection window inputs on both client and server actions.
 */
export function validateSelectionWindowInput({
	opensOn,
	opensAt,
	closesOn,
	closesAt,
	now = new Date(),
}: {
	opensOn: string;
	opensAt: string;
	closesOn: string;
	closesAt: string;
	now?: Date;
}): WindowValidationResult {
	if (
		!opensOn.trim() ||
		!opensAt.trim() ||
		!closesOn.trim() ||
		!closesAt.trim()
	) {
		return { ok: false, code: "window-required" };
	}

	const opens = parseLimaDateTime(opensOn, opensAt);
	const closes = parseLimaDateTime(closesOn, closesAt);
	if (!opens || !closes || closes.getTime() <= opens.getTime()) {
		return { ok: false, code: "window-range" };
	}

	return {
		ok: true,
		closesInPast: closes.getTime() <= now.getTime(),
	};
}

/**
 * Computes default form parts in America/Lima for reopening the selection window
 * across the entire course starting immediately.
 */
export function buildReopenWindowDefaults(
	now = new Date(),
	durationHours = 48,
): {
	opensDate: string;
	opensTime: string;
	closesDate: string;
	closesTime: string;
} {
	const opens = toLimaDateTimeParts(now);
	const closes = toLimaDateTimeParts(
		new Date(now.getTime() + durationHours * 3_600_000),
	);
	return {
		opensDate: opens.date,
		opensTime: opens.time,
		closesDate: closes.date,
		closesTime: closes.time,
	};
}

/**
 * Computes live preview metrics for capacity and group count changes.
 */
export function computeGroupSyncPreview({
	authorizedActive,
	capacity,
	groupCount,
	existingGroups,
	maxGroupMembers,
}: {
	authorizedActive: number;
	capacity: number;
	groupCount: number;
	existingGroups: number;
	maxGroupMembers: number;
}): GroupSyncPreview {
	const validCapacity = Number.isInteger(capacity) && capacity >= 1;
	const validCount = Number.isInteger(groupCount) && groupCount >= 1;

	if (!validCapacity || !validCount) {
		return {
			valid: false,
			totalSeats: null,
			seatsShortfall: 0,
			groupsDelta: null,
			capacityBelowMembers:
				validCapacity && maxGroupMembers > 0
					? capacity < maxGroupMembers
					: false,
		};
	}

	const totalSeats = capacity * groupCount;
	const seatsShortfall =
		authorizedActive > 0 ? Math.max(0, authorizedActive - totalSeats) : 0;

	return {
		valid: true,
		totalSeats,
		seatsShortfall,
		groupsDelta: groupCount - existingGroups,
		capacityBelowMembers: capacity < maxGroupMembers,
	};
}
