import { describe, expect, it } from "vitest";
import { requireLocalSupabase } from "../e2e/support/environment";
import { operationId, syntheticStudent } from "../support/academic-builders";

describe("academic test harness", () => {
	it("builds deterministic synthetic data", () => {
		expect(syntheticStudent()).toEqual({
			course_name: "Synthetic Course",
			full_name: "Synthetic Student",
			email: "synthetic-student@example.test",
			student_number: "SYN-001",
		});
		expect(operationId(7)).toBe("00000000-0000-4000-8000-000000000007");
	});

	it("accepts only loopback Supabase URLs", () => {
		expect(requireLocalSupabase("http://127.0.0.1:54321")).toBe(
			"http://127.0.0.1:54321/",
		);
		expect(() => requireLocalSupabase("https://project.supabase.co")).toThrow(
			"Refusing browser tests against non-local Supabase host",
		);
	});
});
