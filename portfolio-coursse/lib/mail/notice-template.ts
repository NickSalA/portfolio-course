export interface TeacherNoticeTemplateInput {
	appUrl: string;
	targetPath?: string;
}

export interface TeacherNoticeEmail {
	subject: string;
	text: string;
	html: string;
	link: string;
}

const DEFAULT_TARGET_PATH = "/teacher";

function buildSafeLink(appUrl: string, targetPath: string): string {
	if (!targetPath.startsWith("/") || targetPath.startsWith("//")) {
		throw new Error("targetPath must be a relative application path starting with '/'");
	}

	const baseUrl = new URL(appUrl);
	return new URL(targetPath, baseUrl).toString();
}

/**
 * Builds the brief teacher notification email without academic data, student
 * identities, grades, or claim text (BASE-08 privacy rule).
 */
export function buildTeacherNoticeEmail({
	appUrl,
	targetPath = DEFAULT_TARGET_PATH,
}: TeacherNoticeTemplateInput): TeacherNoticeEmail {
	const link = buildSafeLink(appUrl, targetPath);
	const subject = "Aviso del sistema de evaluación grupal";
	const text = [
		"Tienes un nuevo aviso pendiente de revisión en el sistema de evaluación grupal.",
		"",
		`Ingresa aquí para revisarlo: ${link}`,
		"",
		"Por privacidad, este correo no incluye datos académicos ni detalles del reclamo.",
	].join("\n");

	const html = [
		"<p>Tienes un nuevo aviso pendiente de revisión en el sistema de evaluación grupal.</p>",
		`<p><a href="${link}">Abrir panel docente</a></p>`,
		"<p><small>Por privacidad, este correo no incluye datos académicos ni detalles del reclamo.</small></p>",
	].join("");

	return { subject, text, html, link };
}

