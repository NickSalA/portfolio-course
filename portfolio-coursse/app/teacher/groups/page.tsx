import Link from "next/link";
import { ModuleHeader } from "@/components/teacher/module-header";
import { getTeacherContext } from "@/lib/teacher/get-context";

export default async function GroupsPage({
	searchParams,
}: {
	searchParams: Promise<{ period?: string }>;
}) {
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
				{selectedPeriod && (
					<div className="mt-8 grid gap-3">
						{(courses ?? []).map((course) => {
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
							return (
								<Link
									key={course.id}
									href={`/teacher/courses/${course.public_id}?period=${selectedPeriod.public_id}`}
									className="glass flex items-center justify-between rounded-3xl border border-white/25 p-5"
								>
									<div>
										<h2 className="text-lg font-semibold">
											{course.name}
										</h2>
										<p className="mt-1 text-sm text-muted">
											{authorized} alumnos autorizados
										</p>
									</div>
									<div className="grid grid-cols-3 gap-5 text-sm text-right">
										<p>
											Capacidad
											<br />
											<b>
												{course.group_capacity ?? "—"}
											</b>
										</p>
										<p>
											Grupos
											<br />
											<b>{groups.length}</b>
										</p>
										<p>
											Asignados
											<br />
											<b>{assigned}</b>
										</p>
									</div>
								</Link>
							);
						})}
					</div>
				)}
			</div>
		</main>
	);
}
