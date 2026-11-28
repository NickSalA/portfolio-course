import { GroupSelection } from "@/components/student-portal/group-selection";
import { StudentCourseAcademicRecords } from "@/components/student-portal/student-claims-panel";
import type { StudentEnrollmentSummary } from "@/lib/student/get-dashboard";

export function StudentCourseCard({
	enrollment,
}: {
	enrollment: StudentEnrollmentSummary;
}) {
	const courseHeadingId = `course-card-${enrollment.id}`;

	return (
		<article
			aria-labelledby={courseHeadingId}
			className="glass rounded-3xl border border-white/25 p-6 shadow-[0_20px_55px_rgb(15_23_42/8%)]"
		>
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0">
					<p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
						{enrollment.periodCode}
					</p>
					<h2
						id={courseHeadingId}
						className="mt-2 truncate text-xl font-semibold"
					>
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
			<StudentCourseAcademicRecords enrollment={enrollment} />
		</article>
	);
}
