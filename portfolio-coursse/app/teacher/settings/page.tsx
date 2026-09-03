import { restoreCourse } from "@/app/teacher/courses/actions";
import { reactivateStudentAuthorization } from "@/app/teacher/students/actions";
import { ModuleHeader } from "@/components/teacher/shared/module-header";
import { getTeacherContext } from "@/lib/teacher/get-context";

export default async function SettingsPage({
	searchParams,
}: {
	searchParams: Promise<{ period?: string }>;
}) {
	const { period: requestedPeriod } = await searchParams;
	const { supabase, user, selectedPeriod } = await getTeacherContext({
		requestedPeriodPublicId: requestedPeriod,
	});
	const { data: allCourses } = selectedPeriod
		? await supabase
				.from("courses")
				.select("id, public_id, name, active")
				.eq("teacher_id", user.id)
				.eq("period_id", selectedPeriod.id)
				.order("name")
		: { data: [] };
	const archivedCourses = (allCourses ?? []).filter(
		(course) => !course.active,
	);
	const courseNames = new Map(
		(allCourses ?? []).map((course) => [course.id, course.name]),
	);
	const courseIds = (allCourses ?? []).map((course) => course.id);
	const { data: inactiveStudents } = courseIds.length
		? await supabase
				.from("authorized_students")
				.select("id, course_id, full_name, email")
				.in("course_id", courseIds)
				.eq("status", "inactive")
				.order("full_name")
		: { data: [] };
	return (
		<main className="px-5 py-8 sm:px-8 sm:py-10">
			<div className="mx-auto max-w-6xl">
				<ModuleHeader
					eyebrow="Ajustes"
					title="Elementos desactivados"
					description="Restaura cursos o alumnos sin perder su historial académico."
					aside={
						selectedPeriod && (
							<span className="rounded-full bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent">
								{selectedPeriod.code}
							</span>
						)
					}
				/>
				{!selectedPeriod ? (
					<p className="mt-8 rounded-2xl border border-dashed border-border p-5 text-sm text-muted">
						Selecciona un periodo para consultar elementos
						desactivados.
					</p>
				) : (
					<div className="mt-8 grid gap-8 lg:grid-cols-2">
						<section>
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold">
									Cursos ocultos
								</h2>
								<span className="text-sm text-muted">
									{archivedCourses.length}
								</span>
							</div>
							<div className="mt-3 space-y-2">
								{archivedCourses.map((course) => (
									<article
										key={course.id}
										className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface-muted/45 p-4"
									>
										<p className="min-w-0 truncate font-medium">
											{course.name}
										</p>
										<form action={restoreCourse}>
											<input
												type="hidden"
												name="course_public_id"
												value={course.public_id}
											/>
											<input
												type="hidden"
												name="period_public_id"
												value={selectedPeriod.public_id}
											/>
											<button className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold hover:border-accent hover:text-accent">
												Restaurar
											</button>
										</form>
									</article>
								))}
								{!archivedCourses.length && (
									<p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">
										No hay cursos ocultos en este periodo.
									</p>
								)}
							</div>
						</section>
						<section>
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold">
									Alumnos desactivados
								</h2>
								<span className="text-sm text-muted">
									{inactiveStudents?.length ?? 0}
								</span>
							</div>
							<div className="mt-3 space-y-2">
								{(inactiveStudents ?? []).map((student) => (
									<article
										key={student.id}
										className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface-muted/45 p-4"
									>
										<div className="min-w-0">
											<p className="truncate font-medium">
												{student.full_name ||
													"Sin nombre"}
											</p>
											<p className="mt-1 truncate text-sm text-muted">
												{student.email} ·{" "}
												{courseNames.get(
													student.course_id,
												) || "Curso"}
											</p>
										</div>
										<form
											action={
												reactivateStudentAuthorization
											}
										>
											<input
												type="hidden"
												name="authorization_id"
												value={student.id}
											/>
											<input
												type="hidden"
												name="period"
												value={selectedPeriod.public_id}
											/>
											<button className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold hover:border-accent hover:text-accent">
												Reactivar
											</button>
										</form>
									</article>
								))}
								{!(inactiveStudents ?? []).length && (
									<p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">
										No hay alumnos desactivados en este
										periodo.
									</p>
								)}
							</div>
						</section>
					</div>
				)}
			</div>
		</main>
	);
}
