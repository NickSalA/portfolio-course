import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { GroupSelection } from "@/components/student/group-selection";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { createClient } from "@/lib/supabase/server";

const groupMessages: Record<string, string> = {
	group: "No se pudo seleccionar ese grupo. Inténtalo nuevamente.",
	"group-full": "Ese grupo acaba de llenarse. Elige otro disponible.",
	"group-closed": "La ventana de selección de grupos está cerrada.",
};

function movementDate(value: string) {
	return new Intl.DateTimeFormat("es-PE", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: "America/Lima",
	}).format(new Date(value));
}

export default async function DashboardPage({
	searchParams,
}: {
	searchParams: Promise<{ error?: string; "selected-group"?: string }>;
}) {
	const { error: errorCode, "selected-group": selectedGroup } =
		await searchParams;
	const groupMessage = errorCode ? groupMessages[errorCode] : null;
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

	const { data: enrollmentSynced, error: enrollmentSyncError } =
		await supabase.rpc("sync_authorized_student");
	if (enrollmentSyncError || !enrollmentSynced) {
		console.error("Student enrollment sync failed", {
			email: user.email,
			synced: enrollmentSynced,
			error: enrollmentSyncError,
		});
	}

	const { data: enrollments, error: enrollmentsError } = await supabase
		.from("course_students")
		.select(
			"id, status, group_id, groups(name, position), courses(name, description, group_selection_opens_at, group_selection_closes_at, academic_periods(code)), authorized_students(point_transactions(id, points, reason, created_at, is_voided))",
		)
		.eq("student_id", user.id)
		.eq("status", "active");
	if (enrollmentsError) {
		console.error("Student enrollment query failed", {
			email: user.email,
			error: enrollmentsError,
		});
	}

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
					{groupMessage && (
						<p
							role="alert"
							className="mt-4 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
						>
							{groupMessage}
						</p>
					)}
					{selectedGroup && (
						<p
							role="status"
							className="mt-4 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent"
						>
							Tu grupo fue actualizado.
						</p>
					)}
					{enrollments?.length ? (
						<section className="mt-8 grid gap-4 md:grid-cols-2">
							{enrollments.map((enrollment) => {
								const course = Array.isArray(enrollment.courses)
									? enrollment.courses[0]
									: enrollment.courses;
								const group = Array.isArray(enrollment.groups)
									? enrollment.groups[0]
									: enrollment.groups;
								const courseWithWindow = course as {
									group_selection_opens_at?: string | null;
									group_selection_closes_at?: string | null;
								} | null;
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
								const authorizedStudent = Array.isArray(
									enrollment.authorized_students,
								)
									? enrollment.authorized_students[0]
									: enrollment.authorized_students;
								const transactions = Array.isArray(
									authorizedStudent?.point_transactions,
								)
									? authorizedStudent.point_transactions.filter(
											(transaction) =>
												!transaction.is_voided,
										)
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
										<GroupSelection
											enrollmentId={enrollment.id}
											currentGroupId={enrollment.group_id}
											opensAt={
												courseWithWindow?.group_selection_opens_at ??
												null
											}
											closesAt={
												courseWithWindow?.group_selection_closes_at ??
												null
											}
										/>
										<details className="mt-5 border-t border-border pt-4">
											<summary className="cursor-pointer text-sm font-medium text-accent">
												Ver historial de puntos (
												{transactions.length})
											</summary>
											<div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-muted/45">
												{transactions.map(
													(transaction, index) => (
														<div
															key={`${transaction.created_at}-${index}`}
															className="flex items-start justify-between gap-4 px-4 py-3"
														>
															<div>
																<p className="text-sm">
																	{transaction.reason ||
																		"Sin motivo"}
																</p>
																<p className="mt-1 text-xs text-muted">
																	{movementDate(
																		transaction.created_at,
																	)}
																</p>
															</div>
															<p
																className={
																	transaction.points >
																	0
																		? "font-semibold tabular-nums text-accent"
																		: "font-semibold tabular-nums text-danger"
																}
															>
																{transaction.points >
																0
																	? `+${transaction.points}`
																	: transaction.points}
															</p>
														</div>
													),
												)}
												{!transactions.length && (
													<p className="px-4 py-5 text-sm text-muted">
														Aún no hay movimientos
														registrados.
													</p>
												)}
											</div>
										</details>
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
