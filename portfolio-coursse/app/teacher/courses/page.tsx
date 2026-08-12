import { CoursePlanner } from "@/components/academic/course-planner";
import { ModuleHeader } from "@/components/teacher/module-header";
import { getTeacherContext } from "@/lib/teacher/get-context";

const errors: Record<string, string> = {
	"course-data":
		"Escribe el nombre del curso y selecciona un periodo disponible.",
	"course-duplicate": "Ya existe un curso con ese nombre en este periodo.",
	"course-create": "No se pudo añadir el curso. Inténtalo de nuevo.",
};

export default async function TeacherCoursesPage({
	searchParams,
}: {
	searchParams: Promise<{ period?: string; error?: string }>;
}) {
	const { period: requestedPeriod, error: errorCode } = await searchParams;
	const { supabase, user, selectedPeriod } =
		await getTeacherContext(requestedPeriod);
	const { data: courses } = selectedPeriod
		? await supabase
				.from("courses")
				.select(
					"id, public_id, name, description, academic_periods(code)",
				)
				.eq("teacher_id", user.id)
				.eq("period_id", selectedPeriod.id)
				.order("created_at", { ascending: false })
		: { data: [] };
	const error = errorCode ? errors[errorCode] : null;

	return (
		<main className="px-5 py-8 sm:px-8 sm:py-10">
			<div className="mx-auto max-w-6xl">
				<ModuleHeader
					eyebrow="Cursos"
					title={
						selectedPeriod
							? `Cursos de ${selectedPeriod.code}`
							: "Cursos"
					}
					description={
						selectedPeriod
							? "Crea y organiza los cursos de este periodo. Configura grupos y alumnos dentro de cada curso."
							: "Selecciona o prepara un periodo para empezar a añadir cursos."
					}
					aside={
						selectedPeriod && (
							<span className="rounded-full bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent">
								{selectedPeriod.status === "current"
									? "En curso"
									: "Próximo"}
							</span>
						)
					}
				/>
				{error && (
					<p
						role="alert"
						className="mt-6 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
					>
						{error}
					</p>
				)}
				<div className="mt-8">
					<CoursePlanner
						period={selectedPeriod}
						courses={courses ?? []}
					/>
				</div>
			</div>
		</main>
	);
}
