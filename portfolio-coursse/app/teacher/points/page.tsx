import { PointTransactionDialog } from "@/components/teacher/point-transaction-dialog";
import { CourseContextSwitcher } from "@/components/teacher/course-context-switcher";
import { ModuleHeader } from "@/components/teacher/module-header";
import { getTeacherContext } from "@/lib/teacher/get-context";

const errors: Record<string, string> = {
	transaction:
		"No se pudo registrar el movimiento. Revisa el alumno y el valor indicado.",
};

export default async function PointsPage({
	searchParams,
}: {
	searchParams: Promise<{ period?: string; course?: string; error?: string }>;
}) {
	const {
		period: requestedPeriod,
		course: requestedCourse,
		error: errorCode,
	} = await searchParams;
	const { supabase, user, selectedPeriod } = await getTeacherContext({
		requestedPeriodPublicId: requestedPeriod,
	});
	const { data: courses } = selectedPeriod
		? await supabase
				.from("courses")
				.select("id, public_id, name")
				.eq("teacher_id", user.id)
				.eq("period_id", selectedPeriod.id)
				.order("name")
		: { data: [] };
	const selectedCourse =
		(courses ?? []).find(
			(course) => course.public_id === requestedCourse,
		) ?? null;
	const { data: students } = selectedCourse
		? await supabase
				.from("authorized_students")
				.select(
					"id, full_name, email, point_transactions(points, reason, created_at)",
				)
				.eq("course_id", selectedCourse.id)
				.eq("status", "active")
				.order("full_name")
		: { data: [] };
	const error = errorCode ? errors[errorCode] : null;

	return (
		<main className="px-5 py-8 sm:px-8 sm:py-10">
			<div className="mx-auto max-w-6xl">
				<ModuleHeader
					eyebrow="Puntos"
					title={
						selectedCourse
							? selectedCourse.name
							: "Movimientos de puntos"
					}
					description={
						selectedCourse
							? "Registra ajustes y consulta el saldo derivado de cada alumno autorizado."
							: "Selecciona un curso para registrar y consultar movimientos de puntos."
					}
					aside={
						selectedPeriod && (
							<span className="rounded-full bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent">
								{selectedPeriod.code}
							</span>
						)
					}
				/>
				{error && (
					<p
						role="alert"
						className="mt-5 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
					>
						{error}
					</p>
				)}
				{selectedPeriod && (
					<div className="mt-6">
						<CourseContextSwitcher
							courses={(courses ?? []).map((course) => ({
								publicId: course.public_id,
								name: course.name,
							}))}
						/>
					</div>
				)}
				{selectedCourse && (
					<section className="glass mt-6 overflow-hidden rounded-3xl border border-white/25 shadow-[0_20px_55px_rgb(15_23_42/8%)]">
						<div className="grid grid-cols-[minmax(0,1.2fr)_7rem_13rem] gap-4 border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted sm:px-6">
							<span>Alumno</span>
							<span className="text-right">Saldo</span>
							<span className="text-right">Movimientos</span>
						</div>
						<div className="divide-y divide-border">
							{students?.map((student) => {
								const transactions = Array.isArray(
									student.point_transactions,
								)
									? student.point_transactions
									: [];
								const balance = transactions.reduce(
									(total, transaction) =>
										total + transaction.points,
									0,
								);
								return (
									<article
										key={student.id}
										className="grid grid-cols-[minmax(0,1.2fr)_7rem_13rem] items-center gap-4 px-5 py-4 sm:px-6"
									>
										<div className="min-w-0">
											<p className="truncate font-medium">
												{student.full_name ||
													"Sin nombre"}
											</p>
											<p className="mt-1 truncate text-sm text-muted">
												{student.email}
											</p>
										</div>
										<p className="text-right text-lg font-semibold tabular-nums">
											{balance > 0
												? `+${balance}`
												: balance}
										</p>
										<div className="flex justify-end">
											<PointTransactionDialog
												course={
													selectedCourse.public_id
												}
												student={{
													id: student.id,
													name:
														student.full_name ||
														"Sin nombre",
													email: student.email,
													balance,
													transactions,
												}}
											/>
										</div>
									</article>
								);
							})}
							{!students?.length && (
								<p className="px-5 py-8 text-sm text-muted sm:px-6">
									Aún no hay alumnos autorizados en este
									curso.
								</p>
							)}
						</div>
					</section>
				)}
			</div>
		</main>
	);
}
