import Link from "next/link";
import { notFound } from "next/navigation";
import { archiveCourse } from "@/app/teacher/courses/actions";
import { EditCourseNameDialog } from "@/components/teacher/edit-course-name-dialog";
import { CourseStudentImportForm } from "@/components/students/course-student-import-form";
import { GroupCapacityForm } from "@/components/teacher/group-capacity-form";
import { GroupMembersDialog } from "@/components/teacher/group-members-dialog";
import { GroupSelectionWindowDialog } from "@/components/teacher/group-selection-window-dialog";
import { ModuleHeader } from "@/components/teacher/module-header";
import { createClient } from "@/lib/supabase/server";

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
	const emptyGroups = (groups ?? []).filter(
		(group) =>
			!Array.isArray(group.course_students) ||
			!group.course_students.length,
	).length;
	const returnTo = `/teacher/courses/${course.public_id}${selectedPeriod ? `?period=${encodeURIComponent(selectedPeriod)}` : ""}`;
	const opens = dateTimeForLima(course.group_selection_opens_at);
	const closes = dateTimeForLima(course.group_selection_closes_at);
	return (
		<main className="px-5 py-8 sm:px-8 sm:py-10">
			<div className="mx-auto max-w-6xl">
				<Link
					href={`/teacher${selectedPeriod ? `?period=${encodeURIComponent(selectedPeriod)}` : ""}`}
					className="text-sm font-medium text-accent"
				>
					← Volver al inicio
				</Link>
				<div className="mt-6">
					<ModuleHeader
						eyebrow="Curso"
						title={course.name}
						description={
							course.description ??
							"Configura los grupos y la ventana de selección de este curso."
						}
						aside={
							<div className="flex gap-5 text-right text-sm">
								<p>
									<span className="block text-xs text-muted">
										Grupos
									</span>
									<span className="font-semibold tabular-nums">
										{groups?.length ?? 0}
									</span>
								</p>
								<p>
									<span className="block text-xs text-muted">
										Autorizados
									</span>
									<span className="font-semibold tabular-nums">
										{authorized}
									</span>
								</p>
								<p>
									<span className="block text-xs text-muted">
										Asignados
									</span>
									<span className="font-semibold tabular-nums">
										{assigned}
									</span>
								</p>
							</div>
						}
					/>
				</div>
				<div className="mt-4 flex justify-end gap-3">
					<EditCourseNameDialog
						coursePublicId={course.public_id}
						periodPublicId={selectedPeriod ?? ""}
						initialName={course.name}
					/>
					{selectedPeriod && (
						<CourseStudentImportForm
							periodPublicId={selectedPeriod}
							courseName={course.name}
						/>
					)}
					<form action={archiveCourse}>
						<input
							type="hidden"
							name="course_public_id"
							value={course.public_id}
						/>
						<input
							type="hidden"
							name="period_public_id"
							value={selectedPeriod ?? ""}
						/>
						<button className="rounded-xl border border-danger/40 px-3 py-2 text-sm font-semibold text-danger transition hover:bg-danger-soft">
							Ocultar curso
						</button>
					</form>
				</div>
				<div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.72fr)] lg:items-stretch">
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
					{groups?.length ? (
						<section className="flex flex-col justify-between rounded-3xl border border-border bg-surface-muted/55 p-5 sm:p-6">
							<div>
								<h2 className="text-lg font-semibold">
									Ventana de selección
								</h2>
								<p className="mt-2 text-sm leading-6 text-muted">
									Define cuándo los alumnos pueden elegir o
									cambiar su grupo.
								</p>
							</div>
							<div className="mt-5">
								<GroupSelectionWindowDialog
									coursePublicId={course.public_id}
									period={selectedPeriod ?? ""}
									returnTo={returnTo}
									opensDate={opens.date}
									opensTime={opens.time}
									closesDate={closes.date}
									closesTime={closes.time}
								/>
							</div>
						</section>
					) : null}
				</div>
				<section className="mt-8">
					<h2 className="text-xl font-semibold">Grupos</h2>
					<div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
						{groups?.map((group) => {
							const enrollments = Array.isArray(
								group.course_students,
							)
								? group.course_students
								: [];
							const members = enrollments.flatMap(
								(enrollment) => {
									const student = Array.isArray(
										enrollment.authorized_students,
									)
										? enrollment.authorized_students[0]
										: enrollment.authorized_students;
									return student ? [student] : [];
								},
							);
							return (
								<GroupMembersDialog
									key={group.id}
									groupName={`Grupo ${group.position}`}
									capacity={group.capacity ?? 1}
									members={members}
								/>
							);
						})}
						{!groups?.length && (
							<p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted">
								Define la capacidad para generar los grupos.
							</p>
						)}
					</div>
				</section>
			</div>
		</main>
	);
}
