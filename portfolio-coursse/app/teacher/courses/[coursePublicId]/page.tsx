import Link from "next/link";
import { notFound } from "next/navigation";
import {
	saveSelectionWindow,
	synchronizeGroups,
} from "@/app/teacher/groups/actions";
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
		.select("id, position, capacity, course_students(count)")
		.eq("course_id", course.id)
		.order("position");

	const period = Array.isArray(course.academic_periods)
		? course.academic_periods[0]
		: course.academic_periods;
	const authorized = Array.isArray(course.authorized_students)
		? (course.authorized_students[0]?.count ?? 0)
		: 0;
	const required = course.group_capacity
		? Math.ceil(authorized / course.group_capacity)
		: null;
	const error = errorCode ? errors[errorCode] : null;
	const returnTo = `/teacher/courses/${course.public_id}${selectedPeriod ? `?period=${encodeURIComponent(selectedPeriod)}` : ""}`;

	return (
		<main className="px-5 py-8 sm:px-8 sm:py-10">
			<div className="mx-auto max-w-5xl">
				<Link
					href={`/teacher/courses${selectedPeriod ? `?period=${encodeURIComponent(selectedPeriod)}` : ""}`}
					className="text-sm font-medium text-accent transition hover:text-accent-strong"
				>
					← Volver a cursos
				</Link>
				<header className="mt-7 border-b border-border pb-7">
					<p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
						{period?.code}
					</p>
					<h1 className="mt-3 text-3xl font-semibold tracking-tight">
						{course.name}
					</h1>
					{course.description && (
						<p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
							{course.description}
						</p>
					)}
				</header>
				{error && (
					<p
						role="alert"
						className="mt-6 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
					>
						{error}
					</p>
				)}

				<div className="mt-8 grid gap-6 lg:grid-cols-2">
					<section className="glass rounded-3xl border border-white/25 p-6 shadow-[0_20px_55px_rgb(15_23_42/8%)]">
						<p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
							Distribución
						</p>
						<h2 className="mt-3 text-xl font-semibold">
							Grupos automáticos
						</h2>
						<p className="mt-2 text-sm leading-6 text-muted">
							Aula genera los grupos a partir de los alumnos
							autorizados y la capacidad que definas.
						</p>
						<div className="mt-6 grid grid-cols-2 gap-3">
							<div className="rounded-xl bg-surface-muted/70 p-4">
								<p className="text-xs text-muted">
									Alumnos autorizados
								</p>
								<p className="mt-1 text-2xl font-semibold">
									{authorized}
								</p>
							</div>
							<div className="rounded-xl bg-surface-muted/70 p-4">
								<p className="text-xs text-muted">
									Grupos necesarios
								</p>
								<p className="mt-1 text-2xl font-semibold">
									{required ?? "—"}
								</p>
							</div>
						</div>
						<form action={synchronizeGroups} className="mt-6">
							<input
								type="hidden"
								name="course_public_id"
								value={course.public_id}
							/>
							<input
								type="hidden"
								name="period"
								value={selectedPeriod ?? ""}
							/>
							<input
								type="hidden"
								name="return_to"
								value={returnTo}
							/>
							<label className="block text-sm font-medium">
								Alumnos por grupo
								<input
									name="capacity"
									type="number"
									min="1"
									defaultValue={course.group_capacity ?? ""}
									required
									placeholder="Ej. 5"
									className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-4 py-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
								/>
							</label>
							<button className="mt-5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
								Generar distribución
							</button>
						</form>
					</section>

					<section className="glass rounded-3xl border border-white/25 p-6 shadow-[0_20px_55px_rgb(15_23_42/8%)]">
						<p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
							Selección
						</p>
						<h2 className="mt-3 text-xl font-semibold">
							Ventana para alumnos
						</h2>
						<p className="mt-2 text-sm leading-6 text-muted">
							Los alumnos pueden elegir o cambiar de grupo solo
							dentro de este horario.
						</p>
						<form action={saveSelectionWindow} className="mt-6">
							<input
								type="hidden"
								name="course_public_id"
								value={course.public_id}
							/>
							<input
								type="hidden"
								name="period"
								value={selectedPeriod ?? ""}
							/>
							<input
								type="hidden"
								name="return_to"
								value={returnTo}
							/>
							<p className="mb-4 text-xs text-muted">
								Hora institucional · Lima, Perú
							</p>
							<div className="grid grid-cols-2 gap-3">
								<label className="text-sm text-muted">
									Inicio
									<input
										name="opens_on"
										type="date"
										required
										className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-foreground"
									/>
								</label>
								<label className="text-sm text-muted">
									Hora
									<input
										name="opens_at"
										type="time"
										required
										className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-foreground"
									/>
								</label>
								<label className="text-sm text-muted">
									Cierre
									<input
										name="closes_on"
										type="date"
										required
										className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-foreground"
									/>
								</label>
								<label className="text-sm text-muted">
									Hora
									<input
										name="closes_at"
										type="time"
										required
										className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-foreground"
									/>
								</label>
							</div>
							<button className="mt-5 rounded-xl border border-border bg-surface-muted px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
								Guardar ventana
							</button>
						</form>
					</section>
				</div>

				<section className="glass mt-6 rounded-3xl border border-white/25 p-6 shadow-[0_20px_55px_rgb(15_23_42/8%)]">
					<div className="flex items-center justify-between gap-3">
						<h2 className="text-xl font-semibold">
							Grupos generados
						</h2>
						<p className="text-sm text-muted">
							{groups?.length ?? 0} grupos
						</p>
					</div>
					<div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{groups?.map((group) => {
							const members = Array.isArray(group.course_students)
								? (group.course_students[0]?.count ?? 0)
								: 0;
							return (
								<article
									key={group.id}
									className="rounded-2xl border border-border bg-surface-muted/70 p-4"
								>
									<h3 className="font-medium">
										Grupo {group.position}
									</h3>
									<p className="mt-2 text-sm text-muted">
										{members} / {group.capacity} alumnos
									</p>
								</article>
							);
						})}
						{!groups?.length && (
							<p className="rounded-xl bg-surface-muted p-5 text-sm text-muted">
								Configura la capacidad para generar los grupos
								necesarios.
							</p>
						)}
					</div>
				</section>
			</div>
		</main>
	);
}
