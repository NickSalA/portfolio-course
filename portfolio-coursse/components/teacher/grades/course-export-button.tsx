"use client";

import { useState } from "react";
import { buildCourseExportFilename } from "@/lib/export/course-export";

function extractFilename(
	contentDisposition: string | null,
	fallback: string,
): string {
	if (!contentDisposition) return fallback;
	const match = /filename="?([^";\r\n]+)"?/i.exec(contentDisposition);
	return match?.[1]?.trim() || fallback;
}

export function CourseExportButton({
	coursePublicId,
	courseName,
}: {
	coursePublicId: string;
	courseName: string;
}) {
	const [isDownloading, setIsDownloading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [statusMessage, setStatusMessage] = useState<string | null>(null);

	async function handleDownload() {
		if (isDownloading) return;
		setIsDownloading(true);
		setError(null);
		setStatusMessage(null);

		try {
			const response = await fetch(
				`/api/teacher/courses/${encodeURIComponent(coursePublicId)}/export`,
				{
					method: "GET",
					cache: "no-store",
				},
			);

			if (!response.ok) {
				let message =
					"No se pudo descargar el archivo XLSX del curso. Inténtalo nuevamente.";
				try {
					const payload = (await response.json()) as { error?: string };
					if (payload?.error) {
						message = payload.error;
					}
				} catch {
					// Keep default localized error message when body is not JSON.
				}
				setError(message);
				return;
			}

			const blob = await response.blob();
			const fallbackName = buildCourseExportFilename(courseName);
			const filename = extractFilename(
				response.headers.get("Content-Disposition"),
				fallbackName,
			);

			const objectUrl = URL.createObjectURL(blob);
			try {
				const link = document.createElement("a");
				link.href = objectUrl;
				link.download = filename;
				document.body.appendChild(link);
				link.click();
				link.remove();
			} finally {
				URL.revokeObjectURL(objectUrl);
			}

			setStatusMessage(
				`Exportación descargada (${filename}). Incluye notas históricas confirmadas y saldo activo sin modificar registros.`,
			);
		} catch {
			setError(
				"No se pudo conectar con el servidor para generar la exportación. Comprueba tu conexión e inténtalo de nuevo.",
			);
		} finally {
			setIsDownloading(false);
		}
	}

	return (
		<div className="flex flex-col items-end gap-2">
			<button
				type="button"
				onClick={handleDownload}
				disabled={isDownloading}
				aria-busy={isDownloading}
				title="Descarga un archivo Excel (.xlsx) por alumno con atribución histórica confirmada y cálculo individual de puntos"
				className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
			>
				<svg
					aria-hidden="true"
					className="h-4 w-4 shrink-0"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
				<span>
					{isDownloading
						? "Generando exportación (.xlsx)…"
						: "Exportar resultados del curso (.xlsx)"}
				</span>
			</button>

			{error && (
				<p
					role="alert"
					className="max-w-md rounded-xl border border-danger/30 bg-danger-soft/70 px-3 py-2 text-right text-xs font-medium text-danger"
				>
					{error}
				</p>
			)}

			{statusMessage && (
				<p
					role="status"
					aria-live="polite"
					className="max-w-md rounded-xl border border-accent/30 bg-accent-soft px-3 py-2 text-right text-xs font-medium text-accent"
				>
					{statusMessage}
				</p>
			)}
		</div>
	);
}

