import { StatusState } from "@/components/ui/status-state";

export default function TeacherNotFound() {
	return (
		<StatusState
			eyebrow="No disponible"
			title="Este recurso no está disponible"
			description="El curso o módulo solicitado no existe o no forma parte de tu espacio docente."
			primaryHref="/teacher"
			primaryLabel="Volver al panel docente"
		/>
	);
}
