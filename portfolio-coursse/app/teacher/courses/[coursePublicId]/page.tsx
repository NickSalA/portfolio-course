import Link from "next/link";
import { notFound } from "next/navigation";

import { GroupCapacityForm } from "@/components/teacher/group-capacity-form";
import { GroupMembersDialog } from "@/components/teacher/group-members-dialog";
import { GroupSelectionWindowDialog } from "@/components/teacher/group-selection-window-dialog";
import { ModuleHeader } from "@/components/teacher/module-header";
import { createClient } from "@/lib/supabase/server";

const errors: Record<string, string> = {
	capacity: "Indica una capacidad válida.",
	"capacity-members":
		"La nueva capacidad no puede ser menor que los alumnos ya asignados a un grupo.",
	groups: "No se pudo generar la distribución de grupos.",
	window: "Revisa las fechas y horas de la ventana de selección.",
};

type CoursePageProps = {
	params: Promise<{ coursePublicId: string }>;
	searchParams: Promise<{ error?: string; period?: string }>;
};

function dateTimeForLima(value: string | null) {
	if (!value) return { date: "", time: "" };

	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: "America/Lima",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
	}).formatToParts(new Date(value));
	const part = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((item) => item.type === type)?.value ?? "";

	return {
		date: `${part("year")}-${part("month")}-${part("day")}`,
		time: `${part("hour")}:${part("minute")}`,
	};
}

export default async function CoursePage({
	params,
	searchParams,
}: CoursePageProps) {
	const { coursePublicId } = await params;
	const { error: errorCode, period: selectedPeriod } = await searchParams;
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
	const period = Array.isArray(course.academic_periods)
		? course.academic_periods[0]
		: course.academic_periods;
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
	const emptyGroups = (groups ?? []).filter(
		(group) =>
			!Array.isArray(group.course_students) ||
			group.course_students.length === 0,
	).length;
	const error = errorCode ? errors[errorCode] : null;
	const selectionOpens = dateTimeForLima(course.group_selection_opens_at);
	const selectionCloses = dateTimeForLima(course.group_selection_closes_at);
	const returnTo = `/teacher/courses/${course.public_id}${selectedPeriod ? `?period=${encodeURIComponent(selectedPeriod)}` : ""}`;
	const coursesHref = `/teacher/courses${selectedPeriod ? `?period=${encodeURIComponent(selectedPeriod)}` : ""}`;

	return (
		<main className="px-5 py-8 sm:px-8 sm:py-10">
			<div className="mx-auto max-w-6xl">
				<Link
					href={coursesHref}
					className="text-sm font-medium text-accent transition hover:text-accent-strong"
				>
					← Volver a cursos
				</Link>
				<div className="mt-6">
					<ModuleHeader
						eyebrow={period?.code ?? "Curso"}
						title={course.name}
						description={
							course.description ??
							"Configura los grupos y la ventana de selección de este curso."
						}
						aside={
							<span className="rounded-full bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent">
								{groups?.length ?? 0} grupos
							</span>
						}
					/>
				</div>
				{error && (
					<p
						role="alert"
						className="mt-6 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
					>
						{error}
					</p>
				)}

				<div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_42rem] lg:items-stretch">
					<section className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-surface-muted/55">
						<div className="row-span-2 flex flex-col justify-center p-5 sm:p-6">
							<p className="text-xs text-muted">Autorizados</p>
							<p className="mt-2 text-3xl font-semibold tabular-nums">
								{authorized}
							</p>
						</div>
						<div className="border-b border-l border-border p-4 sm:p-5">
							<p className="text-xs text-muted">En grupos</p>
							<p className="mt-1 text-2xl font-semibold tabular-nums">
								{assigned}
							</p>
						</div>
						<div className="border-l border-border p-4 sm:p-5">
							<p className="text-xs text-muted">Sin grupo</p>
							<p className="mt-1 text-2xl font-semibold tabular-nums">
								{Math.max(authorized - assigned, 0)}
							</p>
						</div>
					</section>

					<GroupCapacityForm
						coursePublicId={course.public_id}
						period={selectedPeriod ?? ""}
						returnTo={returnTo}
						authorized={authorized}
						initialCapacity={course.group_capacity}
						existingGroups={groups?.length ?? 0}
						emptyGroups={emptyGroups}
						className="h-full max-w-none"
					/>
				</div>

				{groups?.length ? (
					<section className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-sm font-medium">
								Ventana de selección
							</p>
							<p className="mt-1 text-sm text-muted">
								Disponible ahora que los grupos ya existen.
							</p>
						</div>
						<GroupSelectionWindowDialog
							coursePublicId={course.public_id}
							period={selectedPeriod ?? ""}
							returnTo={returnTo}
							opensDate={selectionOpens.date}
							opensTime={selectionOpens.time}
							closesDate={selectionCloses.date}
							closesTime={selectionCloses.time}
						/>
					</section>
				) : null}

				<section className="mt-8">
					<div className="flex items-end justify-between gap-4">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
								Grupos
							</p>
							<h2 className="mt-2 text-xl font-semibold">
								Distribución actual
							</h2>
						</div>
						<p className="text-sm text-muted">
							{groups?.length ?? 0} grupos
						</p>
					</div>
					<div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
						{groups?.map((group) => {
							const enrollments = Array.isArray(
								group.course_students,
							)
								? group.course_students
								: [];
							const members = enrollments.flatMap(
								(enrollment) => {
									const authorization = Array.isArray(
										enrollment.authorized_students,
									)
										? enrollment.authorized_students[0]
										: enrollment.authorized_students;
									return authorization ? [authorization] : [];
								},
							);
							return (
								<GroupMembersDialog
									key={group.id}
									groupName={`Grupo ${group.position}`}
									capacity={group.capacity}
									members={members}
								/>
							);
						})}
						{!groups?.length && (
							<p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted">
								Define la capacidad para generar la
								distribución.
							</p>
						)}
					</div>
				</section>
			</div>
		</main>
	);
}
