import { notFound } from "next/navigation";
import { CourseDetailActions } from "@/components/teacher/courses/course-detail-actions";
import { EditCourseNameDialog } from "@/components/teacher/courses/edit-course-name-dialog";
import { GroupCapacityForm } from "@/components/teacher/groups/group-capacity-form";
import { GroupMembersDialog } from "@/components/teacher/groups/group-members-dialog";
import { GroupSelectionWindowDialog } from "@/components/teacher/groups/group-selection-window-dialog";
import { ModuleHeader } from "@/components/teacher/shared/module-header";
import { createClient } from "@/lib/supabase/server";
import {
	formatLimaDateTime,
	getSelectionWindowStatus,
	toLimaDateTimeParts,
	type SelectionWindowStatus,
} from "@/lib/teacher/group-config";

const COURSE_ERRORS: Record<string, string> = {
	"course-duplicate": "Ya existe un curso con ese nombre en el periodo.",
	"course-name":
		"No se pudo cambiar el nombre del curso. Comprueba el periodo y vuelve a intentarlo.",
	capacity: "Ingresa una capacidad válida (entero mayor o igual a 1).",
	"group-count":
		"Ingresa un número de grupos válido (entero mayor o igual a 1).",
	"capacity-members":
		"No se puede reducir la capacidad por debajo de los alumnos ya asignados en un grupo.",
	"course-inactive":
		"Este curso está archivado. Restáuralo desde Ajustes antes de modificar grupos o ventana.",
	"course-not-found": "No se pudo verificar el curso solicitado.",
	groups: "No se pudo guardar la configuración de grupos. Inténtalo de nuevo.",
	"window-required":
		"Completa la fecha y hora de apertura y cierre de la ventana.",
	"window-range":
		"La fecha y hora de cierre deben ser posteriores a las de apertura.",
	window: "No se pudo guardar la ventana de selección. Revisa las fechas e inténtalo de nuevo.",
};

const WINDOW_STATUS_META: Record<
	SelectionWindowStatus,
	{ label: string; badgeClass: string; summary: string }
> = {
	unconfigured: {
		label: "Sin configurar",
		badgeClass: "border-border bg-surface text-muted",
		summary:
			"Define cuándo todos los alumnos autorizados del curso podrán elegir o cambiar de grupo.",
	},
	scheduled: {
		label: "Programada",
		badgeClass: "border-accent/30 bg-accent-soft text-accent",
		summary:
			"La selección se abrirá automáticamente para todo el curso en el horario programado.",
	},
	open: {
		label: "Abierta",
		badgeClass: "border-accent/40 bg-accent-soft text-accent",
		summary:
			"Todos los alumnos autorizados del curso pueden elegir o cambiar de grupo ahora.",
	},
	closed: {
		label: "Cerrada",
		badgeClass: "border-border bg-surface text-foreground",
		summary:
			"El plazo venció. Puedes reabrir la ventana para todo el curso cuando lo necesites.",
	},
};

export default async function CoursePage({
	params,
	searchParams,
}: {
	params: Promise<{ coursePublicId: string }>;
	searchParams: Promise<{
		period?: string;
		error?: string;
		saved?: string;
		retained?: string;
	}>;
}) {
	const { coursePublicId } = await params;
	const {
		period: selectedPeriod,
		error,
		saved,
		retained: retainedParam,
	} = await searchParams;
	const supabase = await createClient();
	const { data: course } = await supabase
		.from("courses")
		.select(
			"id, public_id, name, description, active, group_capacity, group_selection_opens_at, group_selection_closes_at, academic_periods(public_id, code)",
		)
		.eq("public_id", coursePublicId)
		.maybeSingle();
	if (!course) notFound();

	const coursePeriod = Array.isArray(course.academic_periods)
		? (course.academic_periods[0] ?? null)
		: course.academic_periods;
	const effectivePeriodPublicId =
		coursePeriod?.public_id ?? selectedPeriod ?? "";

	const [{ count: activeAuthorizedCount }, { data: groups }] =
		await Promise.all([
			supabase
				.from("authorized_students")
				.select("id", { count: "exact", head: true })
				.eq("course_id", course.id)
				.eq("status", "active"),
			supabase
				.from("groups")
				.select(
					"id, position, capacity, course_students(status, authorized_students(full_name, email))",
				)
				.eq("course_id", course.id)
				.order("position"),
		]);

	const groupEntries = (groups ?? []).map((group) => {
		const rawEnrollments = Array.isArray(group.course_students)
			? group.course_students
			: [];
		const activeMembers = rawEnrollments
			.filter((enrollment) => enrollment.status === "active")
			.flatMap((enrollment) => {
				const student = Array.isArray(enrollment.authorized_students)
					? enrollment.authorized_students[0]
					: enrollment.authorized_students;
				return student ? [student] : [];
			});
		return { ...group, activeMembers };
	});

	const authorized = activeAuthorizedCount ?? 0;
	const assigned = groupEntries.reduce(
		(total, group) => total + group.activeMembers.length,
		0,
	);
	const maxGroupMembers = groupEntries.reduce(
		(max, group) => Math.max(max, group.activeMembers.length),
		0,
	);

	const returnTo = `/teacher/courses/${course.public_id}${effectivePeriodPublicId ? `?period=${encodeURIComponent(effectivePeriodPublicId)}` : ""}`;
	const opens = toLimaDateTimeParts(course.group_selection_opens_at);
	const closes = toLimaDateTimeParts(course.group_selection_closes_at);
	const windowStatus = getSelectionWindowStatus(
		course.group_selection_opens_at,
		course.group_selection_closes_at,
	);
	const windowMeta = WINDOW_STATUS_META[windowStatus];
	const opensFormatted = formatLimaDateTime(course.group_selection_opens_at);
	const closesFormatted = formatLimaDateTime(course.group_selection_closes_at);

	const errorMessage = error ? COURSE_ERRORS[error] ?? null : null;
	const retainedCount = retainedParam ? Number(retainedParam) : 0;
	const savedMessage =
		saved === "groups"
			? retainedCount > 0
				? `Configuración de grupos actualizada. Se conservaron ${retainedCount} grupo(s) adicional(es) porque tienen integrantes, notas o historial académico.`
				: "Configuración de grupos actualizada."
			: saved === "window"
				? "Ventana de selección guardada para todo el curso."
				: saved === "window-reopened"
					? "Ventana de selección reabierta para todos los alumnos de este curso."
					: null;

	return (
		<main className="px-5 py-8 sm:px-8 sm:py-10">
			<div className="mx-auto max-w-6xl">
				{errorMessage && (
					<p
						role="alert"
						className="mb-6 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
					>
						{errorMessage}
					</p>
				)}
				{savedMessage && (
					<p
						role="status"
						className="mb-6 rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent"
					>
						{savedMessage}
					</p>
				)}
				{!course.active && (
					<p
						role="status"
						className="mb-6 rounded-2xl border border-border bg-surface-muted/70 px-4 py-3 text-sm text-foreground"
					>
						Este curso está archivado. Restáuralo desde Ajustes si
						necesitas cambiar sus grupos o ventana de selección.
					</p>
				)}
				<div>
					<ModuleHeader
						eyebrow={
							coursePeriod?.code
								? `Curso · ${coursePeriod.code}`
								: "Curso"
						}
						title={
							<span className="inline-flex items-center">
								{course.name}
								<EditCourseNameDialog
									coursePublicId={course.public_id}
									periodPublicId={effectivePeriodPublicId}
									initialName={course.name}
									compact
								/>
							</span>
						}
						description={
							course.description ??
							"Configura el número de grupos, su capacidad y la ventana de selección de este curso."
						}
						aside={
							<div className="flex gap-5 text-right text-sm">
								<p>
									<span className="block text-xs text-muted">
										Grupos
									</span>
									<span className="font-semibold tabular-nums">
										{groupEntries.length}
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
				<div className="mt-5 flex justify-end">
					<CourseDetailActions
						coursePublicId={course.public_id}
						courseName={course.name}
						periodPublicId={effectivePeriodPublicId}
					/>
				</div>
				<div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,.78fr)] lg:items-stretch">
					<GroupCapacityForm
						coursePublicId={course.public_id}
						period={effectivePeriodPublicId}
						returnTo={returnTo}
						authorized={authorized}
						initialCapacity={course.group_capacity}
						existingGroups={groupEntries.length}
						maxGroupMembers={maxGroupMembers}
						disabled={!course.active}
						className="h-full max-w-none"
					/>
					<section className="flex flex-col justify-between rounded-3xl border border-border bg-surface-muted/55 p-5 sm:p-6">
						<div>
							<div className="flex flex-wrap items-center justify-between gap-2">
								<h2 className="text-lg font-semibold">
									Ventana de selección
								</h2>
								<span
									className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${windowMeta.badgeClass}`}
								>
									{windowMeta.label}
								</span>
							</div>
							<p className="mt-2 text-sm leading-6 text-muted">
								{windowMeta.summary}
							</p>
							{opensFormatted && closesFormatted && (
								<dl className="mt-4 space-y-1.5 rounded-2xl border border-border bg-surface/65 p-3.5 text-xs">
									<div className="flex justify-between gap-3">
										<dt className="text-muted">Abre</dt>
										<dd className="font-medium tabular-nums">
											{opensFormatted}
										</dd>
									</div>
									<div className="flex justify-between gap-3">
										<dt className="text-muted">Cierra</dt>
										<dd className="font-medium tabular-nums">
											{closesFormatted}
										</dd>
									</div>
									<p className="pt-1 text-[11px] text-muted">
										Hora institucional · Lima, Perú
									</p>
								</dl>
							)}
							<p className="mt-3 text-xs leading-5 text-muted">
								Aplica a todos los alumnos autorizados de este
								curso (sin permisos individuales).
							</p>
							{!groupEntries.length && (
								<p className="mt-2 text-xs leading-5 text-muted">
									Crea los grupos primero para que haya
									opciones disponibles al abrir la ventana.
								</p>
							)}
						</div>
						<div className="mt-5">
							<GroupSelectionWindowDialog
								coursePublicId={course.public_id}
								period={effectivePeriodPublicId}
								returnTo={returnTo}
								status={windowStatus}
								disabled={!course.active}
								opensDate={opens.date}
								opensTime={opens.time}
								closesDate={closes.date}
								closesTime={closes.time}
							/>
						</div>
					</section>
				</div>
				<section className="mt-8">
					<h2 className="text-xl font-semibold">Grupos</h2>
					<div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
						{groupEntries.map((group) => (
							<GroupMembersDialog
								key={group.id}
								groupName={`Grupo ${group.position}`}
								capacity={group.capacity ?? 1}
								members={group.activeMembers}
							/>
						))}
						{!groupEntries.length && (
							<p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted">
								Define la capacidad y el número de grupos para
								generarlos.
							</p>
						)}
					</div>
				</section>
			</div>
		</main>
	);
}
