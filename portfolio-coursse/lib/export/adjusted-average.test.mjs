// TDD (red) for EXP-02 (#39), reviewed by EXP-04 (#41). Run: node --test lib/export/
// Expected values are the acceptance examples of #39. Points rule is a team assumption, not the professor's.
// Contract proposed by QA; the owner may rename it, keeping these cases.
import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateAdjustedAverage } from "./adjusted-average.ts";

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
	assert.equal(calculateAdjustedAverage([10, null], 5).adjustedAverage, null);
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

test.todo("negative balance: blocked until EXP-01 (#38) decides the rule");
test.todo("voided movements: blocked until EXP-01 (#38) decides the rule");
