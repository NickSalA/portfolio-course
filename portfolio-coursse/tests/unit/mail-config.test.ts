import { describe, expect, it, vi } from "vitest";
import { readMailConfig } from "../../lib/mail/config";
import { buildTeacherNoticeEmail } from "../../lib/mail/notice-template";
import { sendTestNotice, verifyMailTransport } from "../../lib/mail/send-test-notice";

describe("mail configuration and test notice (BASE-08)", () => {
	it("reports missing required SMTP variables without throwing", () => {
		const result = readMailConfig({});
		expect(result).toEqual({
			ok: false,
			missing: ["SMTP_USER", "SMTP_PASS", "MAIL_FROM"],
			invalid: [],
		});
	});

	it("applies Gmail SMTP defaults when user and pass are present", () => {
		const result = readMailConfig({
			SMTP_USER: "docente.prueba@gmail.com",
			SMTP_PASS: "app-password-placeholder",
			MAIL_TEST_TO: "destino.prueba@gmail.com",
		});

		expect(result).toEqual({
			ok: true,
			config: {
				host: "smtp.gmail.com",
				port: 465,
				secure: true,
				user: "docente.prueba@gmail.com",
				pass: "app-password-placeholder",
				from: "docente.prueba@gmail.com",
				testRecipient: "destino.prueba@gmail.com",
				appUrl: "http://127.0.0.1:3000",
			},
		});
	});

	it("builds a brief notice without academic content or external links", () => {
		const notice = buildTeacherNoticeEmail({
			appUrl: "http://127.0.0.1:3000",
			targetPath: "/teacher",
		});

		expect(notice.link).toBe("http://127.0.0.1:3000/teacher");
		expect(notice.text).toContain("http://127.0.0.1:3000/teacher");
		expect(notice.text).toContain("no incluye datos académicos ni detalles del reclamo");
		expect(() =>
			buildTeacherNoticeEmail({
				appUrl: "http://127.0.0.1:3000",
				targetPath: "https://evil.example.test",
			}),
		).toThrow("targetPath must be a relative application path");
	});

	it("sends a test notice through the transport and returns messageId", async () => {
		const sendMail = vi.fn().mockResolvedValue({ messageId: "<test-123@gmail.com>" });
		const verify = vi.fn().mockResolvedValue(true);

		const result = await sendTestNotice({
			env: {
				SMTP_USER: "docente.prueba@gmail.com",
				SMTP_PASS: "app-password-placeholder",
				MAIL_TEST_TO: "destino.prueba@gmail.com",
			},
			createTransport: () => ({ verify, sendMail }),
		});

		expect(result).toEqual({
			ok: true,
			messageId: "<test-123@gmail.com>",
			recipient: "destino.prueba@gmail.com",
			link: "http://127.0.0.1:3000/teacher",
		});
		expect(sendMail).toHaveBeenCalledTimes(1);
		expect(sendMail.mock.calls[0]?.[0].to).toBe("destino.prueba@gmail.com");
	});

	it("returns a structured error when transport fails without leaking credentials", async () => {
		const result = await sendTestNotice({
			env: {
				SMTP_USER: "docente.prueba@gmail.com",
				SMTP_PASS: "super-secret-app-pass",
				MAIL_TEST_TO: "destino.prueba@gmail.com",
			},
			createTransport: () => ({
				verify: vi.fn(),
				sendMail: vi.fn().mockRejectedValue(new Error("EAUTH invalid credentials")),
			}),
		});

		expect(result).toEqual({
			ok: false,
			errorCode: "MAIL_SEND_FAILED",
			errorMessage: "EAUTH invalid credentials",
		});
		expect(JSON.stringify(result)).not.toContain("super-secret-app-pass");
	});

	it("verifies transport connectivity safely", async () => {
		const ok = await verifyMailTransport(
			{
				host: "smtp.gmail.com",
				port: 465,
				secure: true,
				user: "docente.prueba@gmail.com",
				pass: "secret",
				from: "docente.prueba@gmail.com",
				testRecipient: null,
				appUrl: "http://127.0.0.1:3000",
			},
			() => ({
				verify: vi.fn().mockResolvedValue(true),
				sendMail: vi.fn(),
			}),
		);

		expect(ok).toEqual({ ok: true });
	});
});

