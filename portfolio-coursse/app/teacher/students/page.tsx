import { StudentImportForm } from "@/components/students/student-import-form";
import { CourseContextSwitcher } from "@/components/teacher/course-context-switcher";
import { ModuleHeader } from "@/components/teacher/module-header";
import { getTeacherContext } from "@/lib/teacher/get-context";

const errors: Record<string, string> = {
	payload: "Selecciona un archivo válido antes de importar.",
	import: "No se pudo importar la lista. Revisa los datos e inténtalo de nuevo.",
};

type StudentsPageProps = {
	searchParams: Promise<{
		period?: string;
		course?: string;
		error?: string;
		imported?: string;
		courses?: string;
	}>;
};

export default async function StudentsPage({
	searchParams,
}: StudentsPageProps) {
	const {
		period: requestedPeriod,
		course: requestedCourse,
		error: errorCode,
		imported,
		courses: createdCourses,
	} = await searchParams;
	const { supabase, user, selectedPeriod } = await getTeacherContext({
		requestedPeriodPublicId: requestedPeriod,
	});
	const { data: courses } = selectedPeriod
		? await supabase
				.from("courses")
				.select(
					"id, public_id, name, authorized_students(count), course_students(count)",
				)
				.eq("teacher_id", user.id)
				.eq("period_id", selectedPeriod.id)
				.order("name")
		: { data: [] };

	const summaries = (courses ?? []).map((course) => ({
		...course,
		authorized: Array.isArray(course.authorized_students)
			? (course.authorized_students[0]?.count ?? 0)
			: 0,
		enrolled: Array.isArray(course.course_students)
			? (course.course_students[0]?.count ?? 0)
			: 0,
	}));
	const selectedCourse = requestedCourse
		? summaries.find((course) => course.public_id === requestedCourse)
		: null;
	const { data: students } = selectedCourse
		? await supabase
				.from("authorized_students")
				.select(
					"id, full_name, email, student_number, status, course_students(status, groups(name, position))",
				)
				.eq("course_id", selectedCourse.id)
				.order("full_name")
		: { data: [] };

	const totalAuthorized = summaries.reduce(
		(total, course) => total + course.authorized,
		0,
	);
	const totalEnrolled = summaries.reduce(
		(total, course) => total + course.enrolled,
		0,
	);
	const error = errorCode ? errors[errorCode] : null;

	return (
		<main className="px-5 py-8 sm:px-8 sm:py-10">
			<div className="mx-auto max-w-6xl">
				<ModuleHeader
					eyebrow="Alumnos"
					title={
						selectedCourse
							? selectedCourse.name
							: selectedPeriod
								? `Alumnos de ${selectedPeriod.code}`
								: "Alumnos"
					}
					description={
						selectedCourse
							? "Consulta las autorizaciones, el acceso y el grupo de cada alumno."
							: selectedPeriod
								? "Autoriza alumnos mediante una sola importación por periodo."
								: "Selecciona un periodo para gestionar alumnos."
					}
					aside={
						selectedPeriod && (
							<span className="rounded-full bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent">
								{selectedPeriod.code}
							</span>
						)
					}
				/>
				{error && (
					<p
						role="alert"
						className="mt-5 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
					>
						{error}
					</p>
				)}
				{imported && (
					<p
						role="status"
						className="mt-5 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent"
					>
						Se importaron o actualizaron {imported} alumnos
						{createdCourses && Number(createdCourses) > 0
							? ` y se crearon ${createdCourses} cursos`
							: ""}
						.
					</p>
				)}
				{selectedPeriod && (
					<>
						<div className="mt-6 flex flex-wrap items-center justify-between gap-4">
							<CourseContextSwitcher
								courses={summaries.map((course) => ({
									publicId: course.public_id,
									name: course.name,
								}))}
							/>
							<div className="flex items-center gap-3">
								<p className="text-sm text-muted">
									{selectedCourse
										? `${selectedCourse.authorized} autorizados`
										: `${totalAuthorized} autorizados · ${totalEnrolled} ingresaron`}
								</p>
								{!selectedCourse && (
									<StudentImportForm
										periodPublicId={
											selectedPeriod.public_id
										}
									/>
								)}
							</div>
						</div>
						<section className="mt-6 grid grid-cols-3 divide-x divide-border overflow-hidden rounded-2xl border border-border bg-surface-muted/55">
							<div className="p-4 sm:p-5">
								<p className="text-xs text-muted">
									Autorizados
								</p>
								<p className="mt-1 text-2xl font-semibold tabular-nums">
									{selectedCourse
										? selectedCourse.authorized
										: totalAuthorized}
								</p>
							</div>
							<div className="p-4 sm:p-5">
								<p className="text-xs text-muted">Ingresaron</p>
								<p className="mt-1 text-2xl font-semibold tabular-nums">
									{selectedCourse
										? selectedCourse.enrolled
										: totalEnrolled}
								</p>
							</div>
							<div className="p-4 sm:p-5">
								<p className="text-xs text-muted">
									Aún no ingresaron
								</p>
								<p className="mt-1 text-2xl font-semibold tabular-nums">
									{selectedCourse
										? selectedCourse.authorized -
											selectedCourse.enrolled
										: totalAuthorized - totalEnrolled}
								</p>
							</div>
						</section>
						{selectedCourse ? (
							<section className="glass mt-5 overflow-hidden rounded-3xl border border-white/25 shadow-[0_20px_55px_rgb(15_23_42/8%)]">
								<div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_8rem] gap-4 border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted sm:px-6">
									<span>Alumno</span>
									<span>Acceso y grupo</span>
									<span className="text-right">
										Matrícula
									</span>
								</div>
								<div className="divide-y divide-border">
									{students?.map((student) => {
										const enrollment = Array.isArray(
											student.course_students,
										)
											? student.course_students[0]
											: student.course_students;
										const groupValue = enrollment?.groups;
										const group = Array.isArray(groupValue)
											? groupValue[0]
											: (groupValue ?? null);
										const status =
											enrollment?.status === "active"
												? "Ingresó"
												: "Aún no ingresó";
										return (
											<article
												key={student.id}
												className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_8rem] gap-4 px-5 py-4 sm:px-6"
											>
												<div className="min-w-0">
													<p className="truncate font-medium">
														{student.full_name ||
															"Sin nombre"}
													</p>
													<p className="mt-1 truncate text-sm text-muted">
														{student.email}
													</p>
												</div>
												<div>
													<p
														className={
															enrollment?.status ===
															"active"
																? "text-sm font-medium text-accent"
																: "text-sm text-muted"
														}
													>
														{status}
													</p>
													<p className="mt-1 text-sm text-muted">
														{group
															? `Grupo ${group.position}`
															: enrollment?.status ===
																  "active"
																? "Sin grupo"
																: "Aún no inicia sesión"}
													</p>
												</div>
												<p className="self-center text-right text-sm text-muted">
													{student.student_number ||
														"—"}
												</p>
											</article>
										);
									})}
									{!students?.length && (
										<p className="px-5 py-8 text-sm text-muted sm:px-6">
											Aún no hay alumnos autorizados para
											este curso.
										</p>
									)}
								</div>
							</section>
						) : (
							<>
								<section className="mt-6">
									<div className="flex items-end justify-between gap-4">
										<div>
											<p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
												Cursos
											</p>
											<h2 className="mt-2 text-xl font-semibold">
												Cobertura de alumnos
											</h2>
										</div>
										<p className="text-sm text-muted">
											{summaries.length}{" "}
											{summaries.length === 1
												? "curso"
												: "cursos"}
										</p>
									</div>
									<div className="mt-4 grid gap-2 md:grid-cols-2">
										{summaries.map((course) => (
											<a
												key={course.id}
												href={`/teacher/students?period=${encodeURIComponent(selectedPeriod.public_id)}&course=${encodeURIComponent(course.public_id)}`}
												className="glass rounded-2xl border border-white/25 p-4 transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
											>
												<div className="flex items-start justify-between gap-4">
													<h3 className="min-w-0 truncate font-medium">
														{course.name}
													</h3>
													<span className="shrink-0 text-sm text-muted tabular-nums">
														{course.enrolled}/
														{course.authorized}
													</span>
												</div>
												<div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted">
													<div
														className="h-full rounded-full bg-accent"
														style={{
															width: `${course.authorized ? Math.min((course.enrolled / course.authorized) * 100, 100) : 0}%`,
														}}
													/>
												</div>
												<p className="mt-2 text-xs text-muted">
													{course.authorized -
														course.enrolled}{" "}
													pendientes de iniciar sesión
												</p>
											</a>
										))}
										{!summaries.length && (
											<p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted">
												Aún no hay cursos ni alumnos
												autorizados en este periodo.
												Importa una lista para empezar.
											</p>
										)}
									</div>
								</section>
							</>
						)}
					</>
				)}
			</div>
		</main>
	);
}
