import type { AcademicPeriodKey } from "@/lib/academic/calendar";
import { preparePeriod, setPeriodCurrent } from "@/app/teacher/periods/actions";
import { GlassPanel } from "@/components/ui/glass-panel";
import {
	periodName,
	type WorkspacePeriod,
} from "@/lib/academic/workspace-types";

type PeriodCalendarProps = {
	periods: WorkspacePeriod[];
	availableKeys: AcademicPeriodKey[];
};

function codeFor(key: AcademicPeriodKey) {
	return `${key.academicYear}-${key.semester === 0 ? "0" : key.semester === 1 ? "I" : "II"}`;
}

export function PeriodCalendar({
	periods,
	availableKeys,
}: PeriodCalendarProps) {
	return (
		<GlassPanel className="overflow-hidden p-0">
			<div className="border-b border-border px-6 py-5 sm:px-8">
				<p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
					Calendario académico
				</p>
				<div className="mt-2 flex flex-wrap items-end justify-between gap-3">
					<h2 className="text-2xl font-semibold tracking-tight">
						Ahora y lo que sigue
					</h2>
					<p className="text-sm text-muted">
						El verano es opcional; el periodo se promueve
						manualmente.
					</p>
				</div>
			</div>
			<div className="grid divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-3">
				{availableKeys.map((key, index) => {
					const code = codeFor(key);
					const period = periods.find(
						(item) =>
							item.academic_year === key.academicYear &&
							item.semester === key.semester,
					);
					const label =
						index === 0
							? "Periodo actual"
							: index === 1
								? "Siguiente periodo"
								: "Alternativa sin verano";
					if (!period)
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
								<form action={preparePeriod} className="mt-6">
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
					return (
						<article key={period.id} className="p-6 sm:p-8">
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
							{period.status === "upcoming" && (
								<form
									action={setPeriodCurrent}
									className="mt-6"
								>
									<input
										type="hidden"
										name="period_id"
										value={period.id}
									/>
									<button className="text-sm font-semibold text-accent transition hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
										Marcar como periodo actual →
									</button>
								</form>
							)}
						</article>
					);
				})}
			</div>
		</GlassPanel>
	);
}
