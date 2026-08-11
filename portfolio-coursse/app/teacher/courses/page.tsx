import Link from "next/link";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { createClient } from "@/lib/supabase/server";
import { createCourse, createPeriod } from "./actions";

const errors: Record<string, string> = {
	"period-data": "Indica un año válido y selecciona 0, I o II.",
	"period-dates":
		"La fecha final del periodo no puede ser anterior a la inicial.",
	"period-duplicate": "Ese periodo ya existe.",
	"period-create": "No se pudo crear el periodo.",
	"course-data": "Completa el nombre y selecciona un periodo.",
	"group-window":
		"Un curso con grupos necesita una ventana válida de selección.",
	"course-duplicate": "Ya existe un curso con ese nombre en el periodo.",
	"course-create": "No se pudo crear el curso.",
};

type SearchParams = Promise<{ error?: string }>;

export default async function TeacherCoursesPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect("/login");

	const { data: profile } = await supabase
		.from("profiles")
		.select("role, full_name")
		.eq("id", user.id)
		.maybeSingle();

	if (profile?.role !== "teacher") redirect("/dashboard?error=forbidden");

	const [{ data: periods }, { data: courses }] = await Promise.all([
		supabase
			.from("academic_periods")
			.select(
				"id, code, academic_year, semester, starts_at, ends_at, active",
			)
			.order("academic_year", { ascending: false })
			.order("semester", { ascending: false }),
		supabase
			.from("courses")
			.select(
				"id, public_id, name, description, active, group_selection_opens_at, group_selection_closes_at, academic_periods(code)",
			)
			.eq("teacher_id", user.id)
			.order("created_at", { ascending: false }),
	]);

	const params = await searchParams;
	const error = params.error ? errors[params.error] : null;

	return (
		<main className="min-h-screen bg-background px-6 py-10 text-foreground">
			<div className="mx-auto max-w-6xl">
				<header className="flex items-start justify-between gap-6">
					<div>
						<p className="text-sm uppercase tracking-[0.2em] text-accent">
							Docente
						</p>
						<h1 className="mt-3 text-4xl font-semibold">
							Periodos y cursos
						</h1>
						<p className="mt-3 text-muted">
							Crea primero el periodo académico y después organiza
							sus cursos.
						</p>
					</div>
					<ThemeToggle />
				</header>

				{error && (
					<p className="mt-6 rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
						{error}
					</p>
				)}

				<div className="mt-10 grid gap-6 lg:grid-cols-2">
					<section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
						<h2 className="text-xl font-semibold">Nuevo periodo</h2>
						<p className="mt-2 text-sm text-muted">
							El código se genera automáticamente como `año-0`,
							`año-I` o `año-II`.
						</p>
						<form action={createPeriod} className="mt-5 space-y-4">
							<div className="grid gap-4 sm:grid-cols-2">
								<label className="block text-sm text-muted">
									Año
									<input
										name="academic_year"
										type="number"
										min="2000"
										required
										placeholder="2025"
										className="mt-2 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-foreground outline-none focus:border-accent"
									/>
								</label>
								<label className="block text-sm text-muted">
									Periodo
									<select
										name="semester"
										required
										defaultValue=""
										className="mt-2 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-foreground outline-none focus:border-accent"
									>
										<option value="" disabled>
											Selecciona
										</option>
										<option value="0">0 — Verano</option>
										<option value="1">I</option>
										<option value="2">II</option>
									</select>
								</label>
							</div>
							<div className="grid gap-4 sm:grid-cols-2">
								<label className="block text-sm text-muted">
									Inicio
									<input
										name="starts_at"
										type="date"
										className="mt-2 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-foreground"
									/>
								</label>
								<label className="block text-sm text-muted">
									Fin
									<input
										name="ends_at"
										type="date"
										className="mt-2 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-foreground"
									/>
								</label>
							</div>
							<button className="rounded-lg bg-cyan-300 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-200">
								Crear periodo
							</button>
						</form>
					</section>

					<section className="rounded-2xl border border-white/10 bg-white/5 p-6">
						<h2 className="text-xl font-semibold">Nuevo curso</h2>
						{periods?.length ? (
							<form
								action={createCourse}
								className="mt-5 space-y-4"
							>
								<label className="block text-sm text-slate-300">
									Periodo
									<select
										name="period_id"
										required
										className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white"
									>
										<option value="">
											Selecciona un periodo
										</option>
										{periods.map((period) => (
											<option
												key={period.id}
												value={period.id}
											>
												{period.code}
											</option>
										))}
									</select>
								</label>
								<label className="block text-sm text-slate-300">
									Nombre del curso
									<input
										name="name"
										required
										placeholder="Programación Web"
										className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white"
									/>
								</label>
								<label className="block text-sm text-slate-300">
									Descripción opcional
									<textarea
										name="description"
										rows={2}
										className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white"
									/>
								</label>
								<p className="text-xs leading-5 text-slate-400">
									Después podrás configurar grupos y abrir una
									ventana para que los alumnos elijan.
								</p>
								<button className="rounded-lg bg-cyan-300 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-200">
									Crear curso
								</button>
							</form>
						) : (
							<p className="mt-5 text-sm text-slate-400">
								Crea un periodo antes de crear un curso.
							</p>
						)}
					</section>
				</div>

				<section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
					<h2 className="text-xl font-semibold">Mis cursos</h2>
					<div className="mt-5 grid gap-3 md:grid-cols-2">
						{courses?.map((course) => {
							const period = Array.isArray(
								course.academic_periods,
							)
								? course.academic_periods[0]
								: course.academic_periods;
							return (
								<Link
									key={course.id}
									href={`/teacher/courses/${course.public_id}`}
									className="rounded-xl border border-white/10 bg-slate-900/70 p-4 transition hover:border-cyan-300/50 hover:bg-slate-900"
								>
									<p className="text-xs uppercase tracking-widest text-cyan-300">
										{period?.code}
									</p>
									<h3 className="mt-2 font-medium">
										{course.name}
									</h3>
									<p className="mt-1 text-sm text-slate-400">
										{course.description ??
											"Sin descripción"}
									</p>
								</Link>
							);
						})}
						{!courses?.length && (
							<p className="text-sm text-slate-400">
								Todavía no tienes cursos.
							</p>
						)}
					</div>
				</section>
			</div>
		</main>
	);
}
