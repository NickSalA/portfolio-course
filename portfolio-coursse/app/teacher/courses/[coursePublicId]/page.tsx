import Link from "next/link";
import { notFound } from "next/navigation";
import { GroupCapacityForm } from "@/components/teacher/group-capacity-form";
import { GroupMembersDialog } from "@/components/teacher/group-members-dialog";
import { GroupSelectionWindowDialog } from "@/components/teacher/group-selection-window-dialog";
import { ModuleHeader } from "@/components/teacher/module-header";
import { createClient } from "@/lib/supabase/server";

export default async function CoursePage({
	params,
	searchParams,
}: {
	params: Promise<{ coursePublicId: string }>;
	searchParams: Promise<{ period?: string }>;
}) {
	const { coursePublicId } = await params;
	const { period: selectedPeriod } = await searchParams;
	const supabase = await createClient();
	const { data: course } = await supabase
		.from("courses")
		.select(
			"id, public_id, name, description, group_capacity, group_selection_opens_at, group_selection_closes_at, academic_periods(code), authorized_students(count)",
		)
		.eq("public_id", coursePublicId)
		.maybeSingle();
	if (!course) notFound();
	const { data: groups } = await supabase
		.from("groups")
		.select(
			"id, position, capacity, course_students(status, authorized_students(full_name, email))",
		)
		.eq("course_id", course.id)
		.order("position");
	const authorized = Array.isArray(course.authorized_students)
		? (course.authorized_students[0]?.count ?? 0)
		: 0;
	const assigned = (groups ?? []).reduce(
		(total, group) =>
			total +
			(Array.isArray(group.course_students)
				? group.course_students.length
				: 0),
		0,
	);
	const returnTo = `/teacher/courses/${course.public_id}${selectedPeriod ? `?period=${encodeURIComponent(selectedPeriod)}` : ""}`;
	return (
		<main className="px-5 py-8 sm:px-8 sm:py-10">
			<div className="mx-auto max-w-6xl">
				<Link
					href={`/teacher/courses${selectedPeriod ? `?period=${selectedPeriod}` : ""}`}
					className="text-sm font-medium text-accent"
				>
					← Volver a cursos
				</Link>
				<div className="mt-6">
					<ModuleHeader
						eyebrow="Curso"
						title={course.name}
						description={
							course.description ??
							"Configura los grupos y la ventana de selección de este curso."
						}
					/>
				</div>
				<div className="mt-8 grid gap-6 lg:grid-cols-2">
					<section className="rounded-2xl border border-border bg-surface-muted/55 p-5">
						<p className="text-xs text-muted">Autorizados</p>
						<p className="mt-2 text-3xl font-semibold">
							{authorized}
						</p>
						<p className="mt-4 text-sm text-muted">
							{assigned} en grupos
						</p>
					</section>
					<GroupCapacityForm
						coursePublicId={course.public_id}
						period={selectedPeriod ?? ""}
						returnTo={returnTo}
						authorized={authorized}
						initialCapacity={course.group_capacity}
						existingGroups={groups?.length ?? 0}
						emptyGroups={
							(groups ?? []).filter(
								(group) =>
									!Array.isArray(group.course_students) ||
									!group.course_students.length,
							).length
						}
					/>
				</div>
				{groups?.length ? (
					<div className="mt-5 flex justify-end">
						<GroupSelectionWindowDialog
							coursePublicId={course.public_id}
							period={selectedPeriod ?? ""}
							returnTo={returnTo}
							opensDate=""
							opensTime=""
							closesDate=""
							closesTime=""
						/>
					</div>
				) : null}
				<section className="mt-8">
					<h2 className="text-xl font-semibold">Grupos</h2>
					<div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
						{groups?.map((group) => (
							<GroupMembersDialog
								key={group.id}
								groupName={`Grupo ${group.position}`}
								capacity={group.capacity ?? 1}
								members={[]}
							/>
						))}
					</div>
				</section>
			</div>
		</main>
	);
}
