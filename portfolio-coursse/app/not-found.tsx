import { StatusState } from "@/components/ui/status-state";

export default function GlobalNotFound() {
	return (
		<StatusState
			eyebrow="No disponible"
			title="Este recurso no está disponible"
			description="Es posible que el enlace haya cambiado, que la ruta no exista o que no tengas acceso con tu cuenta actual."
			primaryHref="/"
			primaryLabel="Ir al inicio"
			secondaryHref="/login"
			secondaryLabel="Iniciar sesión"
		/>
	);
}
