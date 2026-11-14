export interface MailConfig {
	host: string;
	port: number;
	secure: boolean;
	user: string;
	pass: string;
	from: string;
	testRecipient: string | null;
	appUrl: string;
}

export type MailConfigResult =
	| { ok: true; config: MailConfig }
	| { ok: false; missing: string[]; invalid: string[] };

const DEFAULT_SMTP_HOST = "smtp.gmail.com";
const DEFAULT_SMTP_PORT = 465;
const DEFAULT_APP_URL = "http://127.0.0.1:3000";

function normalizeOptional(value: string | undefined): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

function parsePort(value: string | undefined): number | null {
	if (!value?.trim()) {
		return DEFAULT_SMTP_PORT;
	}

	const parsed = Number.parseInt(value.trim(), 10);
	if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
		return null;
	}

	return parsed;
}

function parseSecure(value: string | undefined, port: number): boolean {
	if (!value?.trim()) {
		return port === 465;
	}

	return value.trim().toLowerCase() === "true";
}

/**
 * Reads SMTP/Nodemailer configuration from environment variables without throwing
 * at module import time or exposing secret values in error details.
 */
export function readMailConfig(
	source: Record<string, string | undefined> = process.env,
): MailConfigResult {
	const missing: string[] = [];
	const invalid: string[] = [];

	const host = normalizeOptional(source.SMTP_HOST) ?? DEFAULT_SMTP_HOST;
	const port = parsePort(source.SMTP_PORT);
	if (port === null) {
		invalid.push("SMTP_PORT");
	}

	const user = normalizeOptional(source.SMTP_USER);
	if (!user) {
		missing.push("SMTP_USER");
	}

	const pass = normalizeOptional(source.SMTP_PASS);
	if (!pass) {
		missing.push("SMTP_PASS");
	}

	const from = normalizeOptional(source.MAIL_FROM) ?? user;
	if (!from) {
		missing.push("MAIL_FROM");
	}

	const appUrl = normalizeOptional(source.NEXT_PUBLIC_APP_URL) ?? DEFAULT_APP_URL;

	if (missing.length > 0 || invalid.length > 0 || port === null || !user || !pass || !from) {
		return { ok: false, missing, invalid };
	}

	return {
		ok: true,
		config: {
			host,
			port,
			secure: parseSecure(source.SMTP_SECURE, port),
			user,
			pass,
			from,
			testRecipient: normalizeOptional(source.MAIL_TEST_TO),
			appUrl,
		},
	};
}

