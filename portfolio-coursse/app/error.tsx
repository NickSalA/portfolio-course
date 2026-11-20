"use client";

import { useEffect } from "react";
import { StatusState } from "@/components/ui/status-state";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Unhandled route error", { digest: error.digest });
	}, [error]);

	return (
		<StatusState
			eyebrow="Error inesperado"
			title="No pudimos cargar esta página"
			description="Ocurrió un problema temporal al consultar la información. Puedes reintentar o volver al inicio."
			isAlert
			onRetry={reset}
			primaryHref="/"
			primaryLabel="Ir al inicio"
		/>
	);
}
