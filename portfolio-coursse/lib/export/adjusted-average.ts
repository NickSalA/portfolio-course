/**
 * Individual points movement used to compute an active points balance.
 */
export type PointsMovement = {
	points: number;
	isVoided?: boolean;
};

/**
 * Result of the pure adjusted average calculation.
 *
 * When `grades` is empty or contains any pending (`null`) grade, all fields are `null`.
 * Otherwise:
 * - `margin`: available headroom in the direction of `balance` (`>= 0`):
 *   - when `balance >= 0`, the sum of `(20 - grade)` across all works;
 *   - when `balance < 0`, the sum of `grade` across all works (downward margin toward `0`).
 * - `applied`: signed points actually applied within `margin` (can be fractional when `margin` is fractional).
 * - `surplus`: signed unapplied points remaining (`balance - applied`).
 * - `baseAverage`: unrounded base average (`sum(grades) / n`), preserving full precision without intermediate rounding.
 * - `adjustedAverage`: final adjusted average `(sum(grades) + applied) / n` rounded half-up to 2 decimals.
 */
export type AdjustedAverageResult = {
	margin: number | null;
	applied: number | null;
	surplus: number | null;
	baseAverage: number | null;
	adjustedAverage: number | null;
};

const MAX_GRADE_CENTS = 2000;
const DECIMAL_SCALE = 100;
const DECIMAL_TOLERANCE = 1e-7;

function normalizeZero(value: number): number {
	return value === 0 ? 0 : value;
}

function validateGradeToCents(grade: number): number {
	if (typeof grade !== "number" || !Number.isFinite(grade)) {
		throw new RangeError("Each grade must be a finite number between 0 and 20.");
	}
	if (grade < 0 || grade > 20) {
		throw new RangeError("Each grade must be between 0 and 20.");
	}

	const scaled = grade * DECIMAL_SCALE;
	const cents = Math.round(scaled);
	if (Math.abs(scaled - cents) > DECIMAL_TOLERANCE) {
		throw new RangeError("Each grade may have at most 2 decimal places.");
	}

	return cents === 0 ? 0 : cents;
}

function roundHalfUpCentsDivision(totalCents: number, divisor: number): number {
	const quotient = Math.floor(totalCents / divisor);
	const remainder = totalCents % divisor;
	const roundedCents = remainder * 2 >= divisor ? quotient + 1 : quotient;
	return normalizeZero(roundedCents / DECIMAL_SCALE);
}

/**
 * Computes the active points balance from non-voided integer movements without mutating the input array.
 */
export function calculateActivePointsBalance(
	movements: ReadonlyArray<PointsMovement>,
): number {
	if (!Array.isArray(movements)) {
		throw new TypeError("Movements must be an array.");
	}

	let total = 0;
	for (const movement of movements) {
		if (
			movement === null ||
			typeof movement !== "object" ||
			typeof movement.points !== "number" ||
			!Number.isInteger(movement.points)
		) {
			throw new RangeError(
				"Each point movement must have a non-null finite integer amount.",
			);
		}
		if (
			movement.isVoided !== undefined &&
			typeof movement.isVoided !== "boolean"
		) {
			throw new TypeError("Movement isVoided flag must be a boolean.");
		}
		if (!movement.isVoided) {
			total += movement.points;
		}
	}

	return normalizeZero(total);
}

/**
 * Pure calculation of base average, available margin, applied points, surplus, and adjusted average.
 * Never mutates `grades` and applies rounding only to the final `adjustedAverage` (half-up to 2 decimals).
 */
export function calculateAdjustedAverage(
	grades: ReadonlyArray<number | null>,
	balance: number,
): AdjustedAverageResult {
	if (!Array.isArray(grades)) {
		throw new TypeError("Grades must be an array.");
	}
	if (typeof balance !== "number" || !Number.isInteger(balance)) {
		throw new RangeError("Points balance must be a finite integer.");
	}

	let hasPendingGrade = false;
	let totalGradeCents = 0;

	for (const grade of grades) {
		if (grade === null) {
			hasPendingGrade = true;
			continue;
		}
		totalGradeCents += validateGradeToCents(grade);
	}

	const count = grades.length;
	if (count === 0 || hasPendingGrade) {
		return {
			margin: null,
			applied: null,
			surplus: null,
			baseAverage: null,
			adjustedAverage: null,
		};
	}

	const balanceCents = balance * DECIMAL_SCALE;
	const marginCents =
		balance >= 0 ? count * MAX_GRADE_CENTS - totalGradeCents : totalGradeCents;
	const appliedCents =
		balance >= 0
			? Math.min(balanceCents, marginCents)
			: Math.max(balanceCents, -totalGradeCents);
	const surplusCents = balanceCents - appliedCents;
	const adjustedTotalCents = totalGradeCents + appliedCents;

	return {
		margin: normalizeZero(marginCents / DECIMAL_SCALE),
		applied: normalizeZero(appliedCents / DECIMAL_SCALE),
		surplus: normalizeZero(surplusCents / DECIMAL_SCALE),
		baseAverage: normalizeZero(totalGradeCents / (count * DECIMAL_SCALE)),
		adjustedAverage: roundHalfUpCentsDivision(adjustedTotalCents, count),
	};
}
