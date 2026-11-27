import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { StudentCourseCard } from "@/components/student-portal/student-course-card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { StudentEnrollmentSummary } from "@/lib/student/get-dashboard";

type StudentDashboardProps = {
	displayName: string;
	greetingName: string;
	statusMessage: string | null;
	groupUpdated: boolean;
	dashboardError: "query-failed" | null;
	enrollments: StudentEnrollmentSummary[];
};

export function StudentDashboard({
	displayName,
	greetingName,
	statusMessage,
	groupUpdated,
	dashboardError,
	enrollments,
}: StudentDashboardProps) {
	return (
		<div className="min-h-dvh bg-background text-foreground">
			<a
				href="#student-content"
				className="sr-only z-50 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
			>
				Saltar al contenido
			</a>
			<header className="glass sticky top-0 z-20 border-b border-white/20">
				<div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold">
							{displayName}
						</p>
						<p className="text-xs text-muted">
							Mi espacio académico
						</p>
					</div>
					<div className="flex items-center gap-3">
						<ThemeToggle />
						<SignOutButton />
					</div>
				</div>
			</header>
			<main
				id="student-content"
				tabIndex={-1}
				className="px-5 py-8 outline-none sm:px-8 sm:py-12"
			>
				<div className="mx-auto max-w-6xl">
					<p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
						Resumen académico
					</p>
					<h1 className="mt-3 text-3xl font-semibold tracking-tight">
						Hola, {greetingName}.
					</h1>
					<p className="mt-2 text-sm text-muted">
						Consulta tus cursos, grupos, notas grupales y
						movimientos de puntos cuando lo necesites.
					</p>
					{statusMessage && (
						<p
							role="alert"
							className="mt-4 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
						>
							{statusMessage}
						</p>
					)}
					{groupUpdated && (
						<p
							role="status"
							className="mt-4 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent"
						>
							Tu grupo fue actualizado.
						</p>
					)}
					{dashboardError ? (
						<section
							role="alert"
							className="glass mt-8 rounded-3xl border border-danger/30 p-6"
						>
							<h2 className="text-xl font-semibold text-danger">
								No pudimos cargar tus cursos
							</h2>
							<p className="mt-2 text-sm text-muted">
								Ocurrió un problema al consultar tu información
								académica. Vuelve a intentarlo en unos segundos.
							</p>
							<Link
								href="/student"
								className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
							>
								Reintentar
							</Link>
						</section>
					) : enrollments.length ? (
						<section className="mt-8 grid gap-4 md:grid-cols-2">
							{enrollments.map((enrollment) => (
								<StudentCourseCard
									key={enrollment.id}
									enrollment={enrollment}
								/>
							))}
						</section>
					) : (
						<section className="glass mt-8 rounded-3xl border border-white/25 p-6">
							<h2 className="text-xl font-semibold">
								Aún no tienes cursos disponibles
							</h2>
							<p className="mt-2 text-sm text-muted">
								Cuando tu correo institucional sea autorizado en
								un curso, aparecerá aquí.
							</p>
						</section>
					)}
				</div>
			</main>
		</div>
	);
}
