"use client";

import { useState } from "react";
import type { AcademicPeriodKey } from "@/lib/academic/calendar";
import { CoursePlanner } from "@/components/academic/course-planner";
import { PeriodCalendar } from "@/components/academic/period-calendar";
import type {
	WorkspaceCourse,
	WorkspacePeriod,
} from "@/lib/academic/workspace-types";

type AcademicWorkspaceProps = {
	periods: WorkspacePeriod[];
	courses: WorkspaceCourse[];
	initialError?: string;
	availablePeriodKeys: AcademicPeriodKey[];
};

export function AcademicWorkspace({
	periods,
	courses,
	initialError,
	availablePeriodKeys,
}: AcademicWorkspaceProps) {
	const availablePeriods = periods.filter(
		(period) => period.status === "current" || period.status === "upcoming",
	);
	const preferredPeriod =
		availablePeriods.find((period) => period.status === "current") ??
		availablePeriods[0];
	const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(
		preferredPeriod?.id ?? null,
	);
	const selectedPeriod =
		periods.find((period) => period.id === selectedPeriodId) ?? null;

	return (
		<div className="space-y-8">
			{initialError && (
				<p
					role="alert"
					className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
				>
					{initialError}
				</p>
			)}
			<PeriodCalendar
				periods={periods}
				availableKeys={availablePeriodKeys}
				selectedPeriodId={selectedPeriodId}
				onSelect={setSelectedPeriodId}
			/>
			<CoursePlanner period={selectedPeriod} courses={courses} />
			{periods.some((period) => period.status === "closed") && (
				<details className="glass rounded-2xl border border-white/25 px-5 py-4 text-sm text-muted">
					<summary className="cursor-pointer font-medium text-foreground">
						Ver historial de periodos
					</summary>
					<div className="mt-3 flex flex-wrap gap-2">
						{periods
							.filter((period) => period.status === "closed")
							.map((period) => (
								<span
									key={period.id}
									className="rounded-full bg-surface-muted px-3 py-1.5"
								>
									{period.code} · Cerrado
								</span>
							))}
					</div>
				</details>
			)}
		</div>
	);
}
