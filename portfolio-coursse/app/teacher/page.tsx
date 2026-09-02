import Link from "next/link";
import { ModuleHeader } from "@/components/teacher/module-header";
import { getTeacherContext } from "@/lib/teacher/get-context";

export default async function TeacherPage({
	searchParams,
}: {
	searchParams: Promise<{ period?: string }>;
}) {
	const { period: requestedPeriod } = await searchParams;
	const { supabase, user, teacher, selectedPeriod } = await getTeacherContext(
		{
			requestedPeriodPublicId: requestedPeriod,
		},
	);
	const { data: courses } = selectedPeriod
		? await supabase
				.from("courses")
				.select(
					"id, public_id, name, authorized_students(count), groups(id, course_students(count))",
				)
				.eq("teacher_id", user.id)
				.eq("period_id", selectedPeriod.id)
				.order("name")
		: { data: [] };
	const summaries = (courses ?? []).map((course) => {
		const authorized = Array.isArray(course.authorized_students)
			? (course.authorized_students[0]?.count ?? 0)
			: 0;
		const groups = Array.isArray(course.groups) ? course.groups : [];
		const assigned = groups.reduce(
			(total, group) =>
				total +
				(Array.isArray(group.course_students)
					? (group.course_students[0]?.count ?? 0)
					: 0),
			0,
		);
		return { ...course, authorized, groups: groups.length, assigned };
	});
	const totals = summaries.reduce(
		(total, course) => ({
			authorized: total.authorized + course.authorized,
			assigned: total.assigned + course.assigned,
			groups: total.groups + course.groups,
		}),
		{ authorized: 0, assigned: 0, groups: 0 },
	);

	return (
		<main className="px-5 py-8 sm:px-8 sm:py-10">
			<div className="mx-auto max-w-6xl">
				<ModuleHeader
					eyebrow="Inicio"
					title={`Hola, ${teacher.full_name?.split(" ")[0] ?? "docente"}.`}
					description={
						selectedPeriod
							? `Este es el panorama de ${selectedPeriod.code}.`
							: "Prepara un periodo para comenzar a organizar tu actividad académica."
					}
				/>
				{selectedPeriod ? (
					<>
						<section className="mt-8 grid grid-cols-3 divide-x divide-border overflow-hidden rounded-2xl border border-border bg-surface-muted/55">
							<div className="p-4 sm:p-5">
								<p className="text-xs text-muted">Cursos</p>
								<p className="mt-1 text-2xl font-semibold tabular-nums">
									{summaries.length}
								</p>
							</div>
							<div className="p-4 sm:p-5">
								<p className="text-xs text-muted">
									Autorizados
								</p>
								<p className="mt-1 text-2xl font-semibold tabular-nums">
									{totals.authorized}
								</p>
							</div>
							<div className="p-4 sm:p-5">
								<p className="text-xs text-muted">En grupos</p>
								<p className="mt-1 text-2xl font-semibold tabular-nums">
									{totals.assigned}
								</p>
							</div>
						</section>
						<section className="mt-8">
							<div className="flex items-end justify-between gap-4">
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
										Actividad
									</p>
									<h2 className="mt-2 text-xl font-semibold">
										Tus cursos
									</h2>
								</div>
								<Link
									href={`/teacher/courses?period=${selectedPeriod.public_id}`}
									className="text-sm font-semibold text-accent hover:text-accent-strong"
								>
									Ver cursos →
								</Link>
							</div>
							<div className="mt-4 grid gap-3 md:grid-cols-2">
								{summaries.map((course) => (
									<Link
										key={course.id}
										href={`/teacher/courses/${course.public_id}?period=${selectedPeriod.public_id}`}
										className="glass flex items-center justify-between gap-4 rounded-2xl border border-white/25 p-5 transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
									>
										<div className="min-w-0">
											<h3 className="truncate font-semibold">
												{course.name}
											</h3>
											<p className="mt-1 text-sm text-muted">
												{course.authorized} autorizados
												· {course.groups} grupos
											</p>
										</div>
										<span
											aria-hidden="true"
											className="text-xl text-muted"
										>
											→
										</span>
									</Link>
								))}
								{!summaries.length && (
									<p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted">
										Aún no hay cursos en este periodo.
									</p>
								)}
							</div>
						</section>
					</>
				) : (
					<div className="glass mt-8 rounded-3xl border border-white/25 p-6">
						<h2 className="text-xl font-semibold">
							Prepara un periodo
						</h2>
						<p className="mt-2 text-sm text-muted">
							Abre Periodos para preparar el ciclo en el que
							trabajarás.
						</p>
					</div>
				)}
			</div>
		</main>
	);
}
