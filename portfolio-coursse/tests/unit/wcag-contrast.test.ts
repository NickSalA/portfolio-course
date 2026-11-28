import { describe, expect, it } from "vitest";
import {
	THEME_COLOR_TOKENS,
	contrastRatio,
	meetsWcagAA,
	parseHexColor,
	relativeLuminance,
} from "../../lib/quality/wcag-contrast";

describe("wcag-contrast helpers", () => {
	it("parses 6-digit and 3-digit hex colors and rejects invalid inputs", () => {
		expect(parseHexColor("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
		expect(parseHexColor(" #0f172a ")).toEqual({ r: 15, g: 23, b: 42 });
		expect(parseHexColor("#abc")).toEqual({ r: 170, g: 187, b: 204 });

		expect(() => parseHexColor("ffffff")).toThrow();
		expect(() => parseHexColor("#12345")).toThrow();
		expect(() => parseHexColor("#gggggg")).toThrow();
	});

	it("computes relative luminance and contrast ratio accurately", () => {
		expect(relativeLuminance("#000000")).toBe(0);
		expect(relativeLuminance("#ffffff")).toBe(1);
		expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
		expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
		expect(contrastRatio("#2f56a6", "#2f56a6")).toBeCloseTo(1, 5);
	});

	it("evaluates WCAG AA thresholds for normal and large text", () => {
		expect(meetsWcagAA(4.5)).toBe(true);
		expect(meetsWcagAA(4.49)).toBe(false);
		expect(meetsWcagAA(3, true)).toBe(true);
		expect(meetsWcagAA(2.99, true)).toBe(false);
		expect(meetsWcagAA(Number.NaN)).toBe(false);
		expect(meetsWcagAA(Number.POSITIVE_INFINITY)).toBe(false);
	});
});

describe("THEME_COLOR_TOKENS WCAG 2.2 AA compliance", () => {
	it("meets >= 4.5:1 contrast for all light theme text/background combinations", () => {
		const t = THEME_COLOR_TOKENS.light;
		const pairs: Array<[string, string, string]> = [
			["foreground/background", t.foreground, t.background],
			["foreground/surface", t.foreground, t.surface],
			["muted/surface", t.muted, t.surface],
			["muted/surfaceMuted", t.muted, t.surfaceMuted],
			["muted/background", t.muted, t.background],
			["accent/surface", t.accent, t.surface],
			["accent/accentSoft", t.accent, t.accentSoft],
			["onAccent/accent", t.onAccent, t.accent],
			["onAccent/accentStrong", t.onAccent, t.accentStrong],
			["danger/surface", t.danger, t.surface],
			["danger/dangerSoft", t.danger, t.dangerSoft],
		];

		for (const [label, fg, bg] of pairs) {
			const ratio = contrastRatio(fg, bg);
			expect(
				meetsWcagAA(ratio),
				`light ${label} (${fg} on ${bg}) ratio=${ratio.toFixed(2)}`,
			).toBe(true);
		}
	});

	it("meets >= 4.5:1 contrast for all dark theme text/background combinations", () => {
		const t = THEME_COLOR_TOKENS.dark;
		const pairs: Array<[string, string, string]> = [
			["foreground/background", t.foreground, t.background],
			["foreground/surface", t.foreground, t.surface],
			["muted/surface", t.muted, t.surface],
			["muted/surfaceMuted", t.muted, t.surfaceMuted],
			["muted/background", t.muted, t.background],
			["accent/surface", t.accent, t.surface],
			["onAccent/accent", t.onAccent, t.accent],
			["onAccent/accentStrong", t.onAccent, t.accentStrong],
			["danger/surface", t.danger, t.surface],
			["danger/dangerSoft", t.danger, t.dangerSoft],
		];

		for (const [label, fg, bg] of pairs) {
			const ratio = contrastRatio(fg, bg);
			expect(
				meetsWcagAA(ratio),
				`dark ${label} (${fg} on ${bg}) ratio=${ratio.toFixed(2)}`,
			).toBe(true);
		}
	});
});
