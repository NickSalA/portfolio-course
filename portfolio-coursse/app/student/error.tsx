"use client";

import { useEffect } from "react";
import { StatusState } from "@/components/ui/status-state";

export default function StudentError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Student route error", { digest: error.digest });
	}, [error]);

	return (
		<StatusState
			eyebrow="Error de carga"
			title="No pudimos cargar tu espacio académico"
			description="Ocurrió un problema temporal al consultar tus cursos. Intenta nuevamente o vuelve a iniciar sesión."
			isAlert
			onRetry={reset}
			primaryHref="/student"
			primaryLabel="Recargar panel"
			secondaryHref="/login"
			secondaryLabel="Ir al ingreso"
		/>
	);
}
