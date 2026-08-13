import Link from "next/link";

import { ModuleHeader } from "@/components/teacher/module-header";
import { getTeacherContext } from "@/lib/teacher/get-context";

type GroupsPageProps = {
	searchParams: Promise<{ period?: string }>;
};

export default async function GroupsPage({ searchParams }: GroupsPageProps) {
	const { period: requestedPeriod } = await searchParams;
	const { supabase, user, selectedPeriod } = await getTeacherContext({
		requestedPeriodPublicId: requestedPeriod,
	});

	const { data: courses } = selectedPeriod
		? await supabase
				.from("courses")
				.select(
					"id, public_id, name, group_capacity, authorized_students(count), groups(id, course_students(count))",
				)
				.eq("teacher_id", user.id)
				.eq("period_id", selectedPeriod.id)
				.order("name")
		: { data: [] };

	return (
		<main className="px-5 py-8 sm:px-8 sm:py-10">
			<div className="mx-auto max-w-6xl">
				<ModuleHeader
					eyebrow="Grupos"
					title="Panorama de distribución"
					description="Revisa la distribución de cada curso. La capacidad y la ventana de selección se configuran dentro del curso."
					aside={
						selectedPeriod && (
							<span className="rounded-full bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent">
								{selectedPeriod.code}
							</span>
						)
					}
				/>

				{!selectedPeriod && (
					<p className="glass mt-8 rounded-3xl border border-white/25 p-6 text-sm text-muted">
						Abre un periodo actual o próximo antes de consultar los
						grupos.
					</p>
				)}

				{selectedPeriod && (
					<div className="mt-8 grid gap-3">
						{courses?.map((course) => {
							const authorized = Array.isArray(
								course.authorized_students,
							)
								? (course.authorized_students[0]?.count ?? 0)
								: 0;
							const groups = Array.isArray(course.groups)
								? course.groups
								: [];
							const assigned = groups.reduce(
								(total, group) =>
									total +
									(Array.isArray(group.course_students)
										? (group.course_students[0]?.count ?? 0)
										: 0),
								0,
							);
							const capacity = course.group_capacity;
							const href = `/teacher/courses/${course.public_id}?period=${encodeURIComponent(selectedPeriod.public_id)}`;

							return (
								<Link
									key={course.id}
									href={href}
									className="glass group flex min-w-0 flex-col gap-5 rounded-3xl border border-white/25 p-5 shadow-[0_16px_40px_rgb(15_23_42/6%)] transition-[transform,border-color] hover:-translate-y-0.5 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-row sm:items-center sm:justify-between sm:p-6"
								>
									<div className="min-w-0">
										<h2 className="truncate text-lg font-semibold">
											{course.name}
										</h2>
										<p className="mt-1 text-sm text-muted">
											{authorized} alumnos autorizados
										</p>
									</div>
									<div className="grid grid-cols-3 gap-5 text-sm sm:text-right">
										<div>
											<p className="text-xs text-muted">
												Capacidad
											</p>
											<p className="mt-1 font-semibold">
												{capacity ?? "—"}
											</p>
										</div>
										<div>
											<p className="text-xs text-muted">
												Grupos
											</p>
											<p className="mt-1 font-semibold">
												{groups.length}
											</p>
										</div>
										<div>
											<p className="text-xs text-muted">
												Asignados
											</p>
											<p className="mt-1 font-semibold">
												{assigned}
											</p>
										</div>
									</div>
									<span
										aria-hidden="true"
										className="text-xl text-muted transition group-hover:translate-x-1 group-hover:text-accent"
									>
										→
									</span>
								</Link>
							);
						})}
						{!courses?.length && (
							<p className="glass rounded-3xl border border-white/25 p-6 text-sm text-muted">
								Aún no hay cursos en {selectedPeriod.code}. Crea
								un curso antes de configurar grupos.
							</p>
						)}
					</div>
				)}
			</div>
		</main>
	);
}
