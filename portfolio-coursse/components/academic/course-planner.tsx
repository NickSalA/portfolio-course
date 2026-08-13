import Link from "next/link";
import { createCourse } from "@/app/teacher/courses/actions";
import { GlassPanel } from "@/components/ui/glass-panel";
import {
	periodForCourse,
	type WorkspaceCourse,
	type WorkspacePeriod,
} from "@/lib/academic/workspace-types";

type CoursePlannerProps = {
	period: WorkspacePeriod | null;
	courses: WorkspaceCourse[];
};

export function CoursePlanner({ period, courses }: CoursePlannerProps) {
	if (!period) {
		return (
			<GlassPanel>
				<p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
					Cursos
				</p>
				<h2 className="mt-2 text-2xl font-semibold tracking-tight">
					Prepara un periodo para comenzar
				</h2>
				<p className="mt-2 text-sm text-muted">
					Cuando abras el periodo actual o el siguiente, podrás añadir
					cursos aquí.
				</p>
			</GlassPanel>
		);
	}

	const periodCourses = courses.filter(
		(course) => periodForCourse(course)?.code === period.code,
	);

	return (
		<GlassPanel>
			<div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
				<div>
					<h2 className="text-2xl font-semibold tracking-tight">
						Cursos del periodo
					</h2>
					<p className="mt-2 text-sm text-muted">
						Añade cursos ahora. Los grupos y alumnos se configuran
						dentro de cada curso.
					</p>
				</div>
				<span className="text-sm text-muted">
					{periodCourses.length}{" "}
					{periodCourses.length === 1 ? "curso" : "cursos"}
				</span>
			</div>
			<form
				action={createCourse}
				className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]"
			>
				<input type="hidden" name="period_id" value={period.id} />
				<input
					type="hidden"
					name="period_public_id"
					value={period.public_id}
				/>
				<label className="sr-only" htmlFor="course-name">
					Nombre del curso
				</label>
				<input
					id="course-name"
					name="name"
					required
					placeholder="Nombre del curso…"
					className="min-w-0 rounded-xl border border-border bg-surface-muted px-4 py-3 text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-accent"
				/>
				<button className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
					Añadir curso
				</button>
				<label className="md:col-span-2 text-sm text-muted">
					Descripción <span className="text-xs">opcional</span>
					<textarea
						name="description"
						rows={2}
						className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-4 py-3 text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-accent"
					/>
				</label>
			</form>
			<div className="mt-8 grid gap-2 border-t border-border pt-6">
				{periodCourses.map((course) => (
					<Link
						key={course.id}
						href={`/teacher/courses/${course.public_id}?period=${encodeURIComponent(period.public_id)}`}
						className="group flex min-w-0 items-center justify-between gap-4 rounded-xl px-4 py-4 transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
					>
						<div className="min-w-0">
							<p className="truncate font-medium">
								{course.name}
							</p>
							{course.description && (
								<p className="mt-1 line-clamp-1 text-sm text-muted">
									{course.description}
								</p>
							)}
						</div>
						<span
							aria-hidden="true"
							className="text-lg text-muted transition group-hover:translate-x-0.5 group-hover:text-accent"
						>
							→
						</span>
					</Link>
				))}
				{!periodCourses.length && (
					<p className="rounded-xl bg-surface-muted px-4 py-5 text-sm text-muted">
						Aún no hay cursos en {period.code}. Añade el primero
						arriba.
					</p>
				)}
			</div>
		</GlassPanel>
	);
}
