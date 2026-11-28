/**
 * Pure WCAG 2.2 color contrast utilities and canonical theme color tokens.
 */

export type RgbColor = {
	r: number;
	g: number;
	b: number;
};

export const THEME_COLOR_TOKENS = {
	light: {
		background: "#edf2f7",
		foreground: "#1a2638",
		surface: "#ffffff",
		surfaceMuted: "#e8eef5",
		muted: "#47586e",
		accent: "#2f56a6",
		accentStrong: "#234385",
		accentSoft: "#dce8fb",
		onAccent: "#ffffff",
		danger: "#b42318",
		dangerSoft: "#fef3f2",
	},
	dark: {
		background: "#17212d",
		foreground: "#f1f5f9",
		surface: "#223044",
		surfaceMuted: "#2a3a50",
		muted: "#b6c4d4",
		accent: "#9ab6f0",
		accentStrong: "#c4d7ff",
		onAccent: "#0f172a",
		danger: "#fda29b",
		dangerSoft: "#4c1d1d",
	},
} as const;

/**
 * Parses a #RGB or #RRGGBB hex string into 8-bit RGB channels.
 */
export function parseHexColor(hex: string): RgbColor {
	const trimmed = hex.trim();
	const match = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(trimmed);
	if (!match) {
		throw new Error(`Invalid hex color: "${hex}"`);
	}

	const raw = match[1];
	const normalized =
		raw.length === 3
			? raw
					.split("")
					.map((ch) => ch + ch)
					.join("")
			: raw;

	return {
		r: Number.parseInt(normalized.slice(0, 2), 16),
		g: Number.parseInt(normalized.slice(2, 4), 16),
		b: Number.parseInt(normalized.slice(4, 6), 16),
	};
}

function linearizeChannel(channel8Bit: number): number {
	const srgb = channel8Bit / 255;
	return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

/**
 * Computes WCAG relative luminance in [0, 1] from an RGB color or hex string.
 */
export function relativeLuminance(color: RgbColor | string): number {
	const rgb = typeof color === "string" ? parseHexColor(color) : color;
	const r = linearizeChannel(rgb.r);
	const g = linearizeChannel(rgb.g);
	const b = linearizeChannel(rgb.b);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Computes the WCAG contrast ratio in [1, 21] between two hex colors.
 */
export function contrastRatio(fgHex: string, bgHex: string): number {
	const fgLum = relativeLuminance(fgHex);
	const bgLum = relativeLuminance(bgHex);
	const lighter = Math.max(fgLum, bgLum);
	const darker = Math.min(fgLum, bgLum);
	return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks whether a contrast ratio meets WCAG 2.2 AA (4.5:1 normal, 3:1 large text).
 */
export function meetsWcagAA(ratio: number, isLargeText = false): boolean {
	if (!Number.isFinite(ratio)) {
		return false;
	}
	return ratio >= (isLargeText ? 3 : 4.5);
}
