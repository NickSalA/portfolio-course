"use client";

import { useEffect } from "react";
import { StatusState } from "@/components/ui/status-state";

export default function TeacherError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Teacher route error", { digest: error.digest });
	}, [error]);

	return (
		<StatusState
			eyebrow="Error de carga"
			title="No pudimos cargar el panel docente"
			description="Ocurrió un problema al obtener tus datos académicos. Intenta nuevamente o regresa al inicio del panel."
			isAlert
			onRetry={reset}
			primaryHref="/teacher"
			primaryLabel="Volver al inicio docente"
		/>
	);
}
