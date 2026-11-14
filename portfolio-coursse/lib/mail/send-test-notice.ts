import nodemailer from "nodemailer";
import { readMailConfig, type MailConfig } from "./config";
import { buildTeacherNoticeEmail } from "./notice-template";

export interface MailTransportLike {
	verify: () => Promise<unknown>;
	sendMail: (options: {
		from: string;
		to: string;
		subject: string;
		text: string;
		html: string;
	}) => Promise<{ messageId?: string }>;
}

export type TransportFactory = (config: MailConfig) => MailTransportLike;

export type TestNoticeResult =
	| {
			ok: true;
			messageId: string | null;
			recipient: string;
			link: string;
	  }
	| {
			ok: false;
			errorCode:
				| "MAIL_CONFIG_INCOMPLETE"
				| "MAIL_RECIPIENT_MISSING"
				| "MAIL_SEND_FAILED";
			errorMessage: string;
			missing?: string[];
			invalid?: string[];
	  };

function defaultTransportFactory(config: MailConfig): MailTransportLike {
	return nodemailer.createTransport({
		host: config.host,
		port: config.port,
		secure: config.secure,
		auth: {
			user: config.user,
			pass: config.pass,
		},
	});
}

function safeErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}

	return "Error desconocido al enviar el aviso por correo.";
}

/**
 * Verifies SMTP connectivity without throwing or exposing credentials.
 */
export async function verifyMailTransport(
	config: MailConfig,
	createTransport: TransportFactory = defaultTransportFactory,
): Promise<{ ok: true } | { ok: false; errorMessage: string }> {
	try {
		const transport = createTransport(config);
		await transport.verify();
		return { ok: true };
	} catch (error) {
		return { ok: false, errorMessage: safeErrorMessage(error) };
	}
}

/**
 * Sends an isolated test notice (BASE-08) to an authorized test recipient.
 * Never throws on SMTP errors so callers can record the failure safely.
 */
export async function sendTestNotice(options?: {
	to?: string;
	targetPath?: string;
	env?: Record<string, string | undefined>;
	createTransport?: TransportFactory;
}): Promise<TestNoticeResult> {
	const configResult = readMailConfig(options?.env);
	if (!configResult.ok) {
		return {
			ok: false,
			errorCode: "MAIL_CONFIG_INCOMPLETE",
			errorMessage: "Falta configuración SMTP para enviar el aviso de prueba.",
			missing: configResult.missing,
			invalid: configResult.invalid,
		};
	}

	const recipient = options?.to?.trim() || configResult.config.testRecipient;
	if (!recipient) {
		return {
			ok: false,
			errorCode: "MAIL_RECIPIENT_MISSING",
			errorMessage: "Falta definir MAIL_TEST_TO o un destinatario autorizado.",
		};
	}

	const notice = buildTeacherNoticeEmail({
		appUrl: configResult.config.appUrl,
		targetPath: options?.targetPath,
	});

	try {
		const createTransport = options?.createTransport ?? defaultTransportFactory;
		const transport = createTransport(configResult.config);
		const info = await transport.sendMail({
			from: configResult.config.from,
			to: recipient,
			subject: notice.subject,
			text: notice.text,
			html: notice.html,
		});

		return {
			ok: true,
			messageId: info.messageId ?? null,
			recipient,
			link: notice.link,
		};
	} catch (error) {
		return {
			ok: false,
			errorCode: "MAIL_SEND_FAILED",
			errorMessage: safeErrorMessage(error),
		};
	}
}

