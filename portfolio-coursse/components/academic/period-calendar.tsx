import type { AcademicPeriodKey } from "@/lib/academic/calendar";

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
                        Consulta el estado y las fechas de los periodos.
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
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${period.status === "current" ? "bg-accent text-on-accent" : "border border-border bg-surface text-muted"}`}
                                >
                                    {period.status === "current"
                                        ? "En curso"
                                        : "Próximo"}
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-muted">
                                {periodName(period.semester)} ·{" "}
                                {period.starts_at && period.ends_at
                                    ? `${period.starts_at} — ${period.ends_at}`
                                    : "Fechas por definir"}
                            </p>
                        </article>
                    );
                })}
            </div>
        </GlassPanel>
    );
}
