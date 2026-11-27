import { describe, expect, it } from "vitest";
import {
	buildReopenWindowDefaults,
	calculateSuggestedGroupCount,
	computeGroupSyncPreview,
	formatLimaDateTime,
	getSelectionWindowStatus,
	parseLimaDateTime,
	toLimaDateTimeParts,
	validateSelectionWindowInput,
} from "../../lib/teacher/group-config";

describe("group configuration helpers", () => {
	it("calculates suggested group counts including empty courses", () => {
		expect(calculateSuggestedGroupCount(0, 4)).toBe(1);
		expect(calculateSuggestedGroupCount(12, 4)).toBe(3);
		expect(calculateSuggestedGroupCount(13, 4)).toBe(4);
		expect(calculateSuggestedGroupCount(10, 0)).toBeNull();
		expect(calculateSuggestedGroupCount(10, 2.5)).toBeNull();
	});

	it("formats and parses America/Lima dates without timezone drift", () => {
		const parsed = parseLimaDateTime("2026-11-20", "23:59");
		expect(parsed?.toISOString()).toBe("2026-11-21T04:59:00.000Z");
		expect(toLimaDateTimeParts(parsed!)).toEqual({
			date: "2026-11-20",
			time: "23:59",
		});
		expect(formatLimaDateTime("2026-11-21T04:59:00.000Z")).toContain(
			"23:59",
		);
		expect(parseLimaDateTime("2026-02-30", "10:00")).toBeNull();
	});

	it("computes selection window statuses using [opens, closes) boundaries", () => {
		const opens = "2026-11-20T15:00:00.000Z";
		const closes = "2026-11-20T17:00:00.000Z";

		expect(getSelectionWindowStatus(null, closes)).toBe("unconfigured");
		expect(getSelectionWindowStatus(opens, null)).toBe("unconfigured");
		expect(
			getSelectionWindowStatus(
				opens,
				closes,
				new Date("2026-11-20T14:59:59.000Z"),
			),
		).toBe("scheduled");
		expect(
			getSelectionWindowStatus(
				opens,
				closes,
				new Date("2026-11-20T15:00:00.000Z"),
			),
		).toBe("open");
		expect(
			getSelectionWindowStatus(
				opens,
				closes,
				new Date("2026-11-20T17:00:00.000Z"),
			),
		).toBe("closed");
	});

	it("validates window inputs, detects invalid ranges and past closes", () => {
		const now = new Date("2026-11-20T18:00:00.000Z");

		expect(
			validateSelectionWindowInput({
				opensOn: "",
				opensAt: "08:00",
				closesOn: "2026-11-21",
				closesAt: "23:59",
				now,
			}),
		).toEqual({ ok: false, code: "window-required" });

		expect(
			validateSelectionWindowInput({
				opensOn: "2026-11-21",
				opensAt: "10:00",
				closesOn: "2026-11-21",
				closesAt: "10:00",
				now,
			}),
		).toEqual({ ok: false, code: "window-range" });

		expect(
			validateSelectionWindowInput({
				opensOn: "2026-11-18",
				opensAt: "08:00",
				closesOn: "2026-11-19",
				closesAt: "23:59",
				now,
			}),
		).toEqual({ ok: true, closesInPast: true });

		expect(
			validateSelectionWindowInput({
				opensOn: "2026-11-20",
				opensAt: "12:00",
				closesOn: "2026-11-22",
				closesAt: "23:59",
				now,
			}),
		).toEqual({ ok: true, closesInPast: false });
	});

	it("builds 48h reopen defaults in America/Lima", () => {
		const defaults = buildReopenWindowDefaults(
			new Date("2026-11-20T20:15:00.000Z"),
			48,
		);
		expect(defaults).toEqual({
			opensDate: "2026-11-20",
			opensTime: "15:15",
			closesDate: "2026-11-22",
			closesTime: "15:15",
		});
	});

	it("computes live preview warnings for seat shortfall and member capacity", () => {
		expect(
			computeGroupSyncPreview({
				authorizedActive: 18,
				capacity: 4,
				groupCount: 4,
				existingGroups: 2,
				maxGroupMembers: 3,
			}),
		).toEqual({
			valid: true,
			totalSeats: 16,
			seatsShortfall: 2,
			groupsDelta: 2,
			capacityBelowMembers: false,
		});

		expect(
			computeGroupSyncPreview({
				authorizedActive: 10,
				capacity: 2,
				groupCount: 5,
				existingGroups: 5,
				maxGroupMembers: 4,
			}),
		).toEqual({
			valid: true,
			totalSeats: 10,
			seatsShortfall: 0,
			groupsDelta: 0,
			capacityBelowMembers: true,
		});
	});
});
