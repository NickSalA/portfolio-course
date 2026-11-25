import { GroupSelection } from "@/components/student-portal/group-selection";
import type { StudentEnrollmentSummary } from "@/lib/student/get-dashboard";

function formatLimaDateTime(value: string) {
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return value;
	}
	return new Intl.DateTimeFormat("es-PE", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: "America/Lima",
	}).format(parsed);
}

function formatGroupGrade(grade: number | null) {
	return grade === null ? "Pendiente" : String(grade);
}

export function StudentCourseCard({
	enrollment,
}: {
	enrollment: StudentEnrollmentSummary;
}) {
	const gradesHeadingId = `course-grades-${enrollment.id}`;
	const pointsHeadingId = `course-points-${enrollment.id}`;

	return (
		<article className="glass rounded-3xl border border-white/25 p-6 shadow-[0_20px_55px_rgb(15_23_42/8%)]">
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0">
					<p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
						{enrollment.periodCode}
					</p>
					<h2 className="mt-2 truncate text-xl font-semibold">
						{enrollment.courseName ?? "Curso"}
					</h2>
				</div>
				<p className="shrink-0 text-right">
					<span className="block text-xs text-muted">Saldo</span>
					<span className="text-2xl font-semibold tabular-nums">
						{enrollment.balance > 0
							? `+${enrollment.balance}`
							: enrollment.balance}
					</span>
				</p>
			</div>
			<div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4">
				<div>
					<p className="text-xs text-muted">Grupo actual</p>
					<div className="mt-1 flex flex-wrap items-center gap-2">
						<p className="text-sm font-medium">
							{enrollment.groupName ?? "Aún no asignado"}
						</p>
						<span
							className={
								enrollment.groupName
									? "inline-block rounded-full border border-accent/30 bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-strong"
									: "inline-block rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-medium text-muted"
							}
						>
							{enrollment.groupName ? "Confirmado" : "Sin asignar"}
						</span>
					</div>
				</div>
				<div>
					<p className="text-xs text-muted">Movimientos</p>
					<p className="mt-1 text-sm font-medium tabular-nums">
						{enrollment.transactions.length}
					</p>
				</div>
			</div>
			<GroupSelection
				enrollmentId={enrollment.id}
				courseName={enrollment.courseName ?? "Curso"}
				currentGroupId={enrollment.groupId}
				opensAt={enrollment.groupSelectionOpensAt}
				closesAt={enrollment.groupSelectionClosesAt}
			/>
			<section
				aria-labelledby={gradesHeadingId}
				className="mt-5 border-t border-border pt-4"
			>
				<h3 id={gradesHeadingId} className="text-sm font-semibold">
					Notas grupales
				</h3>
				<p className="mt-1 text-xs text-muted">
					Resultados registrados por actividad según el grupo con el que
					participaste.
				</p>
				{enrollment.gradesError ? (
					<p
						role="alert"
						className="mt-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
					>
						No pudimos cargar tus notas grupales en este momento.
					</p>
				) : enrollment.grades.length ? (
					<ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-muted/45">
						{enrollment.grades.map((item) => {
							const isPending = item.grade === null;
							const hasDifferentHistoricalGroup =
								enrollment.groupName !== null &&
								item.groupName !== enrollment.groupName;

							return (
								<li
									key={item.evaluationPublicId}
									className="flex items-start justify-between gap-4 px-4 py-3"
								>
									<div className="min-w-0">
										<p className="text-sm font-medium">
											{item.evaluationName}
										</p>
										<p className="mt-1 text-xs text-muted">
											Realizada:{" "}
											{formatLimaDateTime(item.performedAt)}
										</p>
										<p className="mt-1 text-xs text-muted">
											Grupo de la actividad:{" "}
											<span className="font-medium text-foreground">
												{item.groupName}
											</span>
											{hasDifferentHistoricalGroup && (
												<span className="ml-2 inline-block rounded-full border border-accent/30 bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
													Grupo histórico (actual:{" "}
													{enrollment.groupName})
												</span>
											)}
										</p>
									</div>
									<div className="shrink-0 text-right">
										{isPending ? (
											<span className="inline-block rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted">
												Pendiente
											</span>
										) : (
											<p className="text-base font-semibold tabular-nums">
												{formatGroupGrade(item.grade)}
											</p>
										)}
									</div>
								</li>
							);
						})}
					</ul>
				) : (
					<p className="mt-3 rounded-xl border border-border bg-surface-muted/45 px-4 py-4 text-sm text-muted">
						Aún no hay evaluaciones con resultados disponibles.
					</p>
				)}
			</section>
			<section
				aria-labelledby={pointsHeadingId}
				className="mt-5 border-t border-border pt-4"
			>
				<h3 id={pointsHeadingId} className="text-sm font-semibold">
					Puntos
				</h3>
				<details className="mt-2">
					<summary className="cursor-pointer text-sm font-medium text-accent">
						Ver historial de puntos ({enrollment.transactions.length})
					</summary>
					<div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-muted/45">
						{enrollment.transactions.map((transaction, index) => (
							<div
								key={`${transaction.created_at}-${index}`}
								className="flex items-start justify-between gap-4 px-4 py-3"
							>
								<div>
									<p className="text-sm">
										{transaction.reason || "Sin motivo"}
									</p>
									<p className="mt-1 text-xs text-muted">
										{formatLimaDateTime(
											transaction.created_at,
										)}
									</p>
								</div>
								<p
									className={
										transaction.points > 0
											? "font-semibold tabular-nums text-accent"
											: "font-semibold tabular-nums text-danger"
									}
								>
									{transaction.points > 0
										? `+${transaction.points}`
										: transaction.points}
								</p>
							</div>
						))}
						{!enrollment.transactions.length && (
							<p className="px-4 py-5 text-sm text-muted">
								Aún no hay movimientos registrados.
							</p>
						)}
					</div>
				</details>
			</section>
		</article>
	);
}
