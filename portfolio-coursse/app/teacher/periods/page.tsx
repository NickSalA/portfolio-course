import { PeriodCalendar } from "@/components/academic/period-calendar";
import { ModuleHeader } from "@/components/teacher/module-header";
import { nextAcademicPeriod, suggestedAcademicPeriods } from "@/lib/academic/calendar";
import { getTeacherContext } from "@/lib/teacher/get-context";

const errors: Record<string, string> = {
  "period-data": "No se pudo identificar el periodo a preparar.",
  "period-duplicate": "Ese periodo ya está preparado.",
  "period-create": "No se pudo preparar el periodo. Inténtalo de nuevo.",
  "period-not-available": "Solo puedes preparar el periodo actual o el siguiente.",
  "period-status": "No se pudo actualizar el estado del periodo.",
};

export default async function TeacherPeriodsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error: errorCode } = await searchParams;
  const { periods } = await getTeacherContext();
  const current = periods.find((period) => period.status === "current");
  const availableKeys = current
    ? [
        { academicYear: current.academic_year, semester: current.semester as 0 | 1 | 2 },
        nextAcademicPeriod({ academicYear: current.academic_year, semester: current.semester as 0 | 1 | 2 }),
      ]
    : suggestedAcademicPeriods(new Date());

  return (
    <main className="px-5 py-8 sm:px-8 sm:py-10"><div className="mx-auto max-w-6xl"><ModuleHeader eyebrow="Periodos" title="Calendario académico" description="Prepara el siguiente ciclo y decide cuál es el periodo actual. Las fechas se ajustan cuando el calendario institucional esté confirmado." />{errorCode && errors[errorCode] && <p role="alert" className="mt-6 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">{errors[errorCode]}</p>}<div className="mt-8"><PeriodCalendar periods={periods} availableKeys={availableKeys} /></div>{periods.some((period) => period.status === "closed") && <details className="glass mt-6 rounded-2xl border border-white/25 px-5 py-4 text-sm text-muted"><summary className="cursor-pointer font-medium text-foreground">Ver historial de periodos</summary><div className="mt-3 flex flex-wrap gap-2">{periods.filter((period) => period.status === "closed").map((period) => <span key={period.id} className="rounded-full bg-surface-muted px-3 py-1.5">{period.code} · Cerrado</span>)}</div></details>}</div></main>
  );
}
