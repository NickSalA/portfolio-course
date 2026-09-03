import { SignOutButton } from "@/components/auth/sign-out-button";
import { StudentCourseCard } from "@/components/student/student-course-card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { StudentEnrollmentSummary } from "@/lib/student/get-dashboard";

type StudentDashboardProps = {
	displayName: string;
	greetingName: string;
	groupMessage: string | null;
	groupUpdated: boolean;
	enrollments: StudentEnrollmentSummary[];
};

export function StudentDashboard({
	displayName,
	greetingName,
	groupMessage,
	groupUpdated,
	enrollments,
}: StudentDashboardProps) {
	return (
		<div className="min-h-dvh bg-background text-foreground">
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
			<main className="px-5 py-8 sm:px-8 sm:py-12">
				<div className="mx-auto max-w-6xl">
					<p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
						Resumen académico
					</p>
					<h1 className="mt-3 text-3xl font-semibold tracking-tight">
						Hola, {greetingName}.
					</h1>
					<p className="mt-2 text-sm text-muted">
						Consulta tus cursos, grupos y movimientos de puntos
						cuando lo necesites.
					</p>
					{groupMessage && (
						<p
							role="alert"
							className="mt-4 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
						>
							{groupMessage}
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
					{enrollments.length ? (
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
