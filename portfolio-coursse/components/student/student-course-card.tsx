import { GroupSelection } from "@/components/student/group-selection";
import type { StudentEnrollmentSummary } from "@/lib/student/get-dashboard";

function movementDate(value: string) {
	return new Intl.DateTimeFormat("es-PE", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: "America/Lima",
	}).format(new Date(value));
}

export function StudentCourseCard({
	enrollment,
}: {
	enrollment: StudentEnrollmentSummary;
}) {
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
					<p className="text-xs text-muted">Grupo</p>
					<p className="mt-1 text-sm font-medium">
						{enrollment.groupName ?? "Aún no asignado"}
					</p>
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
				currentGroupId={enrollment.groupId}
				opensAt={enrollment.groupSelectionOpensAt}
				closesAt={enrollment.groupSelectionClosesAt}
			/>
			<details className="mt-5 border-t border-border pt-4">
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
									{movementDate(transaction.created_at)}
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
		</article>
	);
}
