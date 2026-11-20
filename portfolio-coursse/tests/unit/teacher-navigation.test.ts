import { describe, expect, it } from "vitest";
import {
	buildTeacherNavHref,
	resolveTeacherNavContext,
} from "../../lib/teacher/navigation";

describe("teacher navigation helpers", () => {
	it("extracts period and course from query parameters", () => {
		const params = new URLSearchParams("period=per-1&course=cur-2");
		expect(resolveTeacherNavContext("/teacher/students", params)).toEqual({
			period: "per-1",
			course: "cur-2",
		});
	});

	it("extracts course public id from course detail pathname", () => {
		const params = new URLSearchParams("period=per-1");
		expect(
			resolveTeacherNavContext("/teacher/courses/abc-123", params),
		).toEqual({
			period: "per-1",
			course: "abc-123",
		});
	});

	it("builds hrefs preserving period always and course only when enabled", () => {
		const context = { period: "per-1", course: "cur-2" };

		expect(buildTeacherNavHref("/teacher/points", context, true)).toBe(
			"/teacher/points?period=per-1&course=cur-2",
		);
		expect(buildTeacherNavHref("/teacher/settings", context, false)).toBe(
			"/teacher/settings?period=per-1",
		);
		expect(
			buildTeacherNavHref("/teacher", { period: null, course: null }),
		).toBe("/teacher");
	});
});
