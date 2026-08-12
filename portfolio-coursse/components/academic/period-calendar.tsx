import type { AcademicPeriodKey } from "@/lib/academic/calendar";
import { createPeriod } from "@/app/teacher/courses/actions";
import {
	periodName,
	type WorkspacePeriod,
} from "@/lib/academic/workspace-types";

type PeriodCalendarProps = {
	periods: WorkspacePeriod[];
	availableKeys: AcademicPeriodKey[];
	selectedPeriodId: number | null;
	onSelect: (periodId: number) => void;
};

function codeFor(key: AcademicPeriodKey) {
	return `${key.academicYear}-${key.semester === 0 ? "0" : key.semester === 1 ? "I" : "II"}`;
}

export function PeriodCalendar({
	periods,
	availableKeys,
	selectedPeriodId,
	onSelect,
}: PeriodCalendarProps) {
	return (
		<section className="glass overflow-hidden rounded-3xl border border-white/25 shadow-[0_20px_55px_rgb(15_23_42/8%)]">
			<div className="border-b border-border px-6 py-5 sm:px-8">
				<p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
					Calendario académico
				</p>
				<div className="mt-2 flex flex-wrap items-end justify-between gap-3">
					<h2 className="text-2xl font-semibold tracking-tight">
						Ahora y lo que sigue
					</h2>
					<p className="text-sm text-muted">
						El sistema solo habilita el periodo actual y el
						siguiente.
					</p>
				</div>
			</div>
			<div className="grid divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
				{availableKeys.map((key, index) => {
					const code = codeFor(key);
					const period = periods.find(
						(item) =>
							item.academic_year === key.academicYear &&
							item.semester === key.semester,
					);
					const label =
						index === 0 ? "Periodo actual" : "Siguiente periodo";

					if (!period) {
						return (
							<div key={code} className="p-6 sm:p-8">
								<p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">
									{label}
								</p>
								<p className="mt-4 text-4xl font-semibold tracking-tight">
									{code}
								</p>
								<p className="mt-2 text-sm text-muted">
									{periodName(key.semester)} · Aún no
									preparado
								</p>
								<form action={createPeriod} className="mt-6">
									<input
										type="hidden"
										name="academic_year"
										value={key.academicYear}
									/>
									<input
										type="hidden"
										name="semester"
										value={key.semester}
									/>
									<button className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
										Preparar {code}
									</button>
								</form>
							</div>
						);
					}

					const selected = period.id === selectedPeriodId;
					return (
						<button
							key={period.id}
							type="button"
							onClick={() => onSelect(period.id)}
							className={`group min-w-0 p-6 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:p-8 ${selected ? "bg-accent-soft" : "hover:bg-surface-muted"}`}
						>
							<p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">
								{label}
							</p>
							<div className="mt-4 flex items-start justify-between gap-3">
								<p className="text-4xl font-semibold tracking-tight">
									{period.code}
								</p>
								<span
									className={`rounded-full px-2.5 py-1 text-xs font-medium ${period.status === "current" ? "bg-accent text-white" : "border border-border bg-surface text-muted"}`}
								>
									{period.status === "current"
										? "En curso"
										: "Próximo"}
								</span>
							</div>
							<p className="mt-2 text-sm text-muted">
								{periodName(period.semester)}
							</p>
							<p className="mt-6 text-sm font-medium text-accent opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
								Gestionar cursos →
							</p>
						</button>
					);
				})}
			</div>
		</section>
	);
}
