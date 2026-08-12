import { AcademicWorkspace } from "@/components/academic/academic-workspace";
import {
	nextAcademicPeriod,
	suggestedAcademicPeriods,
} from "@/lib/academic/calendar";

import { ModuleHeader } from "@/components/teacher/module-header";
import { getTeacherContext } from "@/lib/teacher/get-context";

const errors: Record<string, string> = {
	"period-data": "Indica un año válido y elige uno de los 3 periodos.",
	"period-dates":
		"Revisa las fechas estimadas: el cierre no puede ser anterior al inicio.",
	"period-duplicate":
		"Ese periodo ya está abierto. Elige otro periodo o continúa trabajando en el existente.",
	"period-create": "No se pudo abrir el periodo. Inténtalo de nuevo.",
	"period-not-available":
		"Ese periodo no está disponible. Solo puedes abrir el periodo actual o el siguiente.",
	"period-status": "No se pudo actualizar el estado del periodo.",
	"course-data": "Escribe el nombre del curso y elige un periodo disponible.",
	"course-duplicate": "Ya existe un curso con ese nombre en este periodo.",
	"course-create": "No se pudo añadir el curso. Inténtalo de nuevo.",
};

type SearchParams = Promise<{ error?: string }>;

export default async function TeacherCoursesPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const { supabase, user, periods } = await getTeacherContext();
	const { data: courses } = await supabase
		.from("courses")
		.select("id, public_id, name, description, academic_periods(code)")
		.eq("teacher_id", user.id)
		.order("created_at", { ascending: false });

	const { error: errorCode } = await searchParams;
	const current = periods?.find((period) => period.status === "current");
	const availablePeriodKeys = current
		? [
				{
					academicYear: current.academic_year,
					semester: current.semester as 0 | 1 | 2,
				},
				nextAcademicPeriod({
					academicYear: current.academic_year,
					semester: current.semester as 0 | 1 | 2,
				}),
			]
		: suggestedAcademicPeriods(new Date());

	return (
		<main className="px-5 py-8 sm:px-8 sm:py-10">
			<div className="mx-auto max-w-6xl">
				<ModuleHeader
					eyebrow="Cursos"
					title="Gestión académica"
					description="Prepara los periodos y organiza los cursos que impartes."
				/>
				<div className="mt-8">
					<AcademicWorkspace
						periods={periods ?? []}
						courses={courses ?? []}
						initialError={errorCode ? errors[errorCode] : undefined}
						availablePeriodKeys={availablePeriodKeys}
					/>
				</div>
			</div>
		</main>
	);
}
