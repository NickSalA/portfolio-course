import { describe, expect, it } from "vitest";
import {
	calculateActivePointsBalance,
	calculateAdjustedAverage,
} from "../../lib/export/adjusted-average";

describe("calculateAdjustedAverage (EXP-02)", () => {
	it("computes SC-002 example: grades 10 and 18 with balance 15", () => {
		expect(calculateAdjustedAverage([10, 18], 15)).toEqual({
			margin: 12,
			applied: 12,
			surplus: 3,
			baseAverage: 14,
			adjustedAverage: 20,
		});
	});

	it("rounds only the final adjusted average without intermediate rounding (10, 10, 11 with +1)", () => {
		const result = calculateAdjustedAverage([10, 10, 11], 1);
		expect(result.applied).toBe(1);
		expect(result.adjustedAverage).toBe(10.67);
	});

	it("returns pending nulls when any grade is null or there are no works", () => {
		expect(calculateAdjustedAverage([10, null], 5)).toEqual({
			margin: null,
			applied: null,
			surplus: null,
			baseAverage: null,
			adjustedAverage: null,
		});
		expect(calculateAdjustedAverage([], 5)).toEqual({
			margin: null,
			applied: null,
			surplus: null,
			baseAverage: null,
			adjustedAverage: null,
		});
	});

	it("counts explicit zero as a valid grade", () => {
		const result = calculateAdjustedAverage([0, 20], 0);
		expect(result.baseAverage).toBe(10);
		expect(result.adjustedAverage).toBe(10);
	});

	it("moves excess positive points to surplus when margin is exhausted", () => {
		const result = calculateAdjustedAverage([20, 20], 4);
		expect(result.applied).toBe(0);
		expect(result.surplus).toBe(4);
		expect(result.adjustedAverage).toBe(20);
	});

	it("handles SC-003 negative balance and fractional margin examples", () => {
		expect(calculateAdjustedAverage([0, 1], -3)).toEqual({
			margin: 1,
			applied: -1,
			surplus: -2,
			baseAverage: 0.5,
			adjustedAverage: 0,
		});
		expect(calculateAdjustedAverage([19.5], 1)).toEqual({
			margin: 0.5,
			applied: 0.5,
			surplus: 0.5,
			baseAverage: 19.5,
			adjustedAverage: 20,
		});
		expect(calculateAdjustedAverage([0.25], -1)).toEqual({
			margin: 0.25,
			applied: -0.25,
			surplus: -0.75,
			baseAverage: 0.25,
			adjustedAverage: 0,
		});
	});

	it("normalizes -0 to 0 when negative balance meets zero margin", () => {
		const result = calculateAdjustedAverage([0, 0], -2);
		expect(Object.is(result.applied, 0)).toBe(true);
		expect(Object.is(result.adjustedAverage, 0)).toBe(true);
		expect(result.surplus).toBe(-2);
	});

	it("rounds half-up on exact .xx5 ties such as 13.505 -> 13.51 and 10.005 -> 10.01", () => {
		const exactTie = calculateAdjustedAverage([13.5, 13.51], 0);
		expect(exactTie.baseAverage).toBe(13.505);
		expect(exactTie.adjustedAverage).toBe(13.51);

		expect(calculateAdjustedAverage([10, 10.01], 0).adjustedAverage).toBe(
			10.01,
		);
	});

	it("is pure and does not mutate input grades", () => {
		const grades = [10, 18];
		const first = calculateAdjustedAverage(grades, 15);
		expect(calculateAdjustedAverage(grades, 15)).toEqual(first);
		expect(grades).toEqual([10, 18]);
	});

	it("validates grade bounds, decimal precision, and integer balance", () => {
		expect(() => calculateAdjustedAverage([-0.01], 0)).toThrow(RangeError);
		expect(() => calculateAdjustedAverage([20.01], 0)).toThrow(RangeError);
		expect(() => calculateAdjustedAverage([Number.NaN, null], 0)).toThrow(
			RangeError,
		);
		expect(() => calculateAdjustedAverage([10.123], 0)).toThrow(RangeError);
		expect(() => calculateAdjustedAverage([10, 12], 1.5)).toThrow(RangeError);
	});
});

describe("calculateActivePointsBalance (EXP-02)", () => {
	it("excludes voided movements and sums positive and negative integer amounts", () => {
		const movements = [
			{ points: 4, isVoided: false },
			{ points: 10, isVoided: true },
			{ points: -1 },
			{ points: -5, isVoided: true },
		];
		expect(calculateActivePointsBalance(movements)).toBe(3);
		expect(movements).toHaveLength(4);
	});

	it("returns 0 when empty or all movements are voided", () => {
		expect(calculateActivePointsBalance([])).toBe(0);
		expect(
			calculateActivePointsBalance([{ points: 5, isVoided: true }]),
		).toBe(0);
	});

	it("rejects null, NaN, or fractional movement points", () => {
		expect(() =>
			calculateActivePointsBalance([
				{ points: null as unknown as number, isVoided: false },
			]),
		).toThrow(RangeError);
		expect(() =>
			calculateActivePointsBalance([{ points: 1.5, isVoided: false }]),
		).toThrow(RangeError);
		expect(() =>
			calculateActivePointsBalance([
				{ points: Number.NaN, isVoided: false },
			]),
		).toThrow(RangeError);
	});
});
