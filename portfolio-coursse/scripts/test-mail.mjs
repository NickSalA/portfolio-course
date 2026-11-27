import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";

function loadEnvLocal(projectRoot) {
	const envPath = path.join(projectRoot, ".env.local");
	if (!fs.existsSync(envPath)) {
		return;
	}

	const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) {
			continue;
		}
		const eqIndex = line.indexOf("=");
		if (eqIndex <= 0) {
			continue;
		}
		const key = line.slice(0, eqIndex).trim();
		let value = line.slice(eqIndex + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		if (!(key in process.env)) {
			process.env[key] = value;
		}
	}
}

async function main() {
	const projectRoot = path.resolve(import.meta.dirname, "..");
	loadEnvLocal(projectRoot);

	const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
	const port = Number.parseInt(process.env.SMTP_PORT?.trim() || "465", 10);
	const secure = process.env.SMTP_SECURE
		? process.env.SMTP_SECURE.trim().toLowerCase() === "true"
		: port === 465;
	const user = process.env.SMTP_USER?.trim();
	const pass = process.env.SMTP_PASS?.trim();
	const from = process.env.MAIL_FROM?.trim() || user;
	const to = process.env.MAIL_TEST_TO?.trim();
	const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://127.0.0.1:3000";

	const missing = [];
	if (!user) missing.push("SMTP_USER");
	if (!pass) missing.push("SMTP_PASS");
	if (!to) missing.push("MAIL_TEST_TO");

	if (missing.length > 0) {
		console.error(
			`[BASE-08] Faltan variables en .env.local o en el entorno: ${missing.join(", ")}`,
		);
		process.exitCode = 1;
		return;
	}

	const link = new URL("/teacher", appUrl).toString();
	const transporter = nodemailer.createTransport({
		host,
		port,
		secure,
		auth: { user, pass },
	});

	try {
		await transporter.verify();
		const info = await transporter.sendMail({
			from,
			to,
			subject: "Aviso de prueba del sistema de evaluación grupal (BASE-08)",
			text: [
				"Tienes un nuevo aviso pendiente de revisión en el sistema de evaluación grupal.",
				"",
				`Ingresa aquí para revisarlo: ${link}`,
				"",
				"Por privacidad, este correo no incluye datos académicos ni detalles del reclamo.",
			].join("\n"),
		});
		console.log(`[BASE-08] Aviso de prueba enviado a ${to}. messageId=${info.messageId}`);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`[BASE-08] Error al enviar aviso de prueba: ${message}`);
		process.exitCode = 1;
	}
}

main();

