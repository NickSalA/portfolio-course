import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { configureGroupSelection, createGroup } from "./actions";

const errors: Record<string, string> = {
	"group-data": "Indica un nombre y una capacidad válida.",
	"group-duplicate": "Ya existe un grupo con ese nombre en este curso.",
	"group-create": "No se pudo crear el grupo.",
	"selection-window": "Selecciona una ventana válida de apertura y cierre.",
	"selection-save": "No se pudo guardar la ventana de selección.",
};

type CoursePageProps = {
	params: Promise<{ coursePublicId: string }>;
	searchParams: Promise<{ error?: string }>;
};

export default async function CoursePage({
	params,
	searchParams,
}: CoursePageProps) {
	const { coursePublicId } = await params;
	const { error: errorCode } = await searchParams;
	const supabase = await createClient();

	const { data: course } = await supabase
		.from("courses")
		.select(
			"id, public_id, name, description, group_selection_opens_at, group_selection_closes_at, academic_periods(code)",
		)
		.eq("public_id", coursePublicId)
		.maybeSingle();

	if (!course) notFound();

	const { data: groups } = await supabase
		.from("groups")
		.select("id, public_id, name, capacity, active, course_students(count)")
		.eq("course_id", course.id)
		.order("name");

	const period = Array.isArray(course.academic_periods)
		? course.academic_periods[0]
		: course.academic_periods;
	const error = errorCode ? errors[errorCode] : null;

	return (
		<main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
			<div className="mx-auto max-w-6xl">
				<Link
					href="/teacher/courses"
					className="text-sm text-cyan-300 hover:text-cyan-200"
				>
					← Periodos y cursos
				</Link>
				<header className="mt-7">
					<p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
						{period?.code}
					</p>
					<h1 className="mt-2 text-4xl font-semibold">
						{course.name}
					</h1>
					{course.description && (
						<p className="mt-3 text-slate-300">
							{course.description}
						</p>
					)}
				</header>

				{error && (
					<p
						role="alert"
						className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100"
					>
						{error}
					</p>
				)}

				<div className="mt-10 grid gap-6 lg:grid-cols-2">
					<section className="rounded-2xl border border-white/10 bg-white/5 p-6">
						<h2 className="text-xl font-semibold">Crear grupo</h2>
						<p className="mt-2 text-sm text-slate-400">
							Los alumnos podrán elegir entre los grupos activos
							durante la ventana que configures.
						</p>
						<form action={createGroup} className="mt-5 space-y-4">
							<input
								type="hidden"
								name="course_public_id"
								value={course.public_id}
							/>
							<label className="block text-sm text-slate-300">
								Nombre
								<input
									name="name"
									required
									placeholder="Grupo A"
									className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white"
								/>
							</label>
							<label className="block text-sm text-slate-300">
								Capacidad
								<input
									name="capacity"
									type="number"
									min="1"
									required
									placeholder="5"
									className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white"
								/>
							</label>
							<button className="rounded-lg bg-cyan-300 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-200">
								Crear grupo
							</button>
						</form>
					</section>

					<section className="rounded-2xl border border-white/10 bg-white/5 p-6">
						<h2 className="text-xl font-semibold">
							Ventana de selección
						</h2>
						<p className="mt-2 text-sm text-slate-400">
							Durante este plazo, los alumnos podrán elegir o
							cambiar su grupo.
						</p>
						<form
							action={configureGroupSelection}
							className="mt-5 space-y-4"
						>
							<input
								type="hidden"
								name="course_public_id"
								value={course.public_id}
							/>
							<label className="block text-sm text-slate-300">
								Apertura
								<input
									name="opens_at"
									type="datetime-local"
									required
									className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white"
								/>
							</label>
							<label className="block text-sm text-slate-300">
								Cierre
								<input
									name="closes_at"
									type="datetime-local"
									required
									className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white"
								/>
							</label>
							<button className="rounded-lg bg-cyan-300 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-200">
								Guardar ventana
							</button>
						</form>
					</section>
				</div>

				<section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
					<div className="flex items-center justify-between gap-4">
						<h2 className="text-xl font-semibold">Grupos</h2>
						<p className="text-sm text-slate-400">
							{course.group_selection_opens_at
								? "Ventana configurada"
								: "Selección todavía cerrada"}
						</p>
					</div>
					<div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
						{groups?.map((group) => {
							const enrollmentCount = Array.isArray(
								group.course_students,
							)
								? (group.course_students[0]?.count ?? 0)
								: 0;
							return (
								<article
									key={group.id}
									className="rounded-xl border border-white/10 bg-slate-900/70 p-4"
								>
									<h3 className="font-medium">
										{group.name}
									</h3>
									<p className="mt-2 text-sm text-slate-400">
										{enrollmentCount} / {group.capacity}{" "}
										alumnos
									</p>
								</article>
							);
						})}
						{!groups?.length && (
							<p className="text-sm text-slate-400">
								Todavía no hay grupos creados.
							</p>
						)}
					</div>
				</section>
			</div>
		</main>
	);
}
