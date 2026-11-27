// Tests for EXP-02 (#39), reviewed by EXP-04 (#41). Run: node --test lib/export/adjusted-average.test.mjs
// Expected values match the acceptance examples in specs/001-export-decisions/spec.md.
// Points rule is a team assumption, not the professor's.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
	calculateActivePointsBalance,
	calculateAdjustedAverage,
} from "./adjusted-average.ts";

test("grades 10 and 18 with balance 15", () => {
	assert.deepEqual(calculateAdjustedAverage([10, 18], 15), {
		margin: 12,
		applied: 12,
		surplus: 3,
		baseAverage: 14,
		adjustedAverage: 20,
	});
});

test("grades 10, 10, 11 with balance 1 round only the final value", () => {
	const result = calculateAdjustedAverage([10, 10, 11], 1);
	assert.equal(result.applied, 1);
	assert.equal(result.adjustedAverage, 10.67);
});

test("a missing grade keeps the adjusted average pending, not zero", () => {
	assert.deepEqual(calculateAdjustedAverage([10, null], 5), {
		margin: null,
		applied: null,
		surplus: null,
		baseAverage: null,
		adjustedAverage: null,
	});
});

test("an explicit zero counts as a grade", () => {
	const result = calculateAdjustedAverage([0, 20], 0);
	assert.equal(result.baseAverage, 10);
	assert.equal(result.adjustedAverage, 10);
});

test("no works means pending, without dividing by zero", () => {
	assert.equal(calculateAdjustedAverage([], 5).adjustedAverage, null);
});

test("exhausted margin moves every point to surplus", () => {
	const result = calculateAdjustedAverage([20, 20], 4);
	assert.equal(result.applied, 0);
	assert.equal(result.surplus, 4);
	assert.equal(result.adjustedAverage, 20);
});

test("zero balance leaves the base average", () => {
	assert.equal(calculateAdjustedAverage([12, 13], 0).adjustedAverage, 12.5);
});

test("is pure: same input, same output, input untouched", () => {
	const grades = [10, 18];
	const first = calculateAdjustedAverage(grades, 15);
	assert.deepEqual(calculateAdjustedAverage(grades, 15), first);
	assert.deepEqual(grades, [10, 18]);
});

test("negative balance: grades 0 and 1 with balance -3 apply -1 and leave -2 surplus", () => {
	assert.deepEqual(calculateAdjustedAverage([0, 1], -3), {
		margin: 1,
		applied: -1,
		surplus: -2,
		baseAverage: 0.5,
		adjustedAverage: 0,
	});
});

test("SC-003 fractional margins: [19.5] with +1 and [0.25] with -1", () => {
	assert.deepEqual(calculateAdjustedAverage([19.5], 1), {
		margin: 0.5,
		applied: 0.5,
		surplus: 0.5,
		baseAverage: 19.5,
		adjustedAverage: 20,
	});

	assert.deepEqual(calculateAdjustedAverage([0.25], -1), {
		margin: 0.25,
		applied: -0.25,
		surplus: -0.75,
		baseAverage: 0.25,
		adjustedAverage: 0,
	});
});

test("negative balance with zero margin normalizes -0 to 0", () => {
	const result = calculateAdjustedAverage([0, 0], -2);
	assert.equal(Object.is(result.applied, 0), true);
	assert.equal(Object.is(result.adjustedAverage, 0), true);
	assert.equal(result.surplus, -2);
});

test("rounds final adjusted average half-up on exact .xx5 ties (13.505 -> 13.51)", () => {
	const exactTie = calculateAdjustedAverage([13.5, 13.51], 0);
	assert.equal(exactTie.baseAverage, 13.505);
	assert.equal(exactTie.adjustedAverage, 13.51);

	const ieeeTie = calculateAdjustedAverage([10, 10.01], 0);
	assert.equal(ieeeTie.adjustedAverage, 10.01);
});

test("voided movements are excluded from active points balance without mutating inputs", () => {
	const movements = [
		{ points: 4, isVoided: false },
		{ points: 10, isVoided: true },
		{ points: -1, isVoided: false },
		{ points: -5, isVoided: true },
	];

	const balance = calculateActivePointsBalance(movements);
	assert.equal(balance, 3);
	assert.deepEqual(calculateAdjustedAverage([15, 17], balance), {
		margin: 8,
		applied: 3,
		surplus: 0,
		baseAverage: 16,
		adjustedAverage: 17.5,
	});
});

test("validates grades, balance, and point movements", () => {
	assert.throws(() => calculateAdjustedAverage([-0.01], 0), RangeError);
	assert.throws(() => calculateAdjustedAverage([20.01], 0), RangeError);
	assert.throws(() => calculateAdjustedAverage([Number.NaN, null], 0), RangeError);
	assert.throws(() => calculateAdjustedAverage([10.123], 0), RangeError);
	assert.throws(() => calculateAdjustedAverage([10, 12], 1.5), RangeError);
	assert.throws(
		() => calculateActivePointsBalance([{ points: null }]),
		RangeError,
	);
	assert.throws(
		() => calculateActivePointsBalance([{ points: 1.5, isVoided: false }]),
		RangeError,
	);
});
