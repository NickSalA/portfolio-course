import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect("/login");

	const { data: profile } = await supabase
		.from("profiles")
		.select("full_name, role")
		.eq("id", user.id)
		.maybeSingle();
	if (profile?.role === "teacher") redirect("/teacher");

	const { data: enrollments } = await supabase
		.from("course_students")
		.select(
			"id, status, groups(name, position), courses(name, description, academic_periods(code)), point_transactions(points, reason, created_at)",
		)
		.eq("student_id", user.id)
		.eq("status", "active");

	return (
		<div className="min-h-dvh bg-background text-foreground">
			<header className="glass sticky top-0 z-20 border-b border-white/20">
				<div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold">
							{profile?.full_name ?? user.email}
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
						Hola,{" "}
						{profile?.full_name?.split(" ")[0] ?? "estudiante"}.
					</h1>
					<p className="mt-2 text-sm text-muted">
						Consulta tus cursos, grupos y movimientos de puntos
						cuando lo necesites.
					</p>
					{enrollments?.length ? (
						<section className="mt-8 grid gap-4 md:grid-cols-2">
							{enrollments.map((enrollment) => {
								const course = Array.isArray(enrollment.courses)
									? enrollment.courses[0]
									: enrollment.courses;
								const group = Array.isArray(enrollment.groups)
									? enrollment.groups[0]
									: enrollment.groups;
								const periodData = (
									course as {
										academic_periods?:
											| { code: string }
											| { code: string }[]
											| null;
									} | null
								)?.academic_periods;
								const periodCode = Array.isArray(periodData)
									? periodData[0]?.code
									: periodData?.code;
								const transactions = Array.isArray(
									enrollment.point_transactions,
								)
									? enrollment.point_transactions
									: [];
								const balance = transactions.reduce(
									(total, transaction) =>
										total + transaction.points,
									0,
								);
								return (
									<article
										key={enrollment.id}
										className="glass rounded-3xl border border-white/25 p-6 shadow-[0_20px_55px_rgb(15_23_42/8%)]"
									>
										<div className="flex items-start justify-between gap-4">
											<div className="min-w-0">
												<p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
													{periodCode}
												</p>
												<h2 className="mt-2 truncate text-xl font-semibold">
													{course?.name ?? "Curso"}
												</h2>
											</div>
											<p className="shrink-0 text-right">
												<span className="block text-xs text-muted">
													Saldo
												</span>
												<span className="text-2xl font-semibold tabular-nums">
													{balance > 0
														? `+${balance}`
														: balance}
												</span>
											</p>
										</div>
										<div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4">
											<div>
												<p className="text-xs text-muted">
													Grupo
												</p>
												<p className="mt-1 text-sm font-medium">
													{group?.name ??
														"Aún no asignado"}
												</p>
											</div>
											<div>
												<p className="text-xs text-muted">
													Movimientos
												</p>
												<p className="mt-1 text-sm font-medium tabular-nums">
													{transactions.length}
												</p>
											</div>
										</div>
									</article>
								);
							})}
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
