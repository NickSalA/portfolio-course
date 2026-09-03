"use client";

import { useState } from "react";
import { synchronizeGroups } from "@/app/teacher/courses/group-actions";
import { GlassPanel } from "@/components/ui/glass-panel";

type GroupCapacityFormProps = {
	coursePublicId: string;
	period: string;
	returnTo: string;
	authorized: number;
	initialCapacity: number | null;
	existingGroups: number;
	emptyGroups: number;
	className?: string;
};

export function GroupCapacityForm({
	coursePublicId,
	period,
	returnTo,
	authorized,
	initialCapacity,
	existingGroups,
	emptyGroups,
	className = "mt-6 max-w-2xl",
}: GroupCapacityFormProps) {
	const [capacity, setCapacity] = useState(
		initialCapacity ? String(initialCapacity) : "",
	);
	const capacityValue = Number(capacity);
	const requiredGroups =
		Number.isInteger(capacityValue) && capacityValue > 0
			? Math.ceil(authorized / capacityValue)
			: null;
	const groupDifference =
		requiredGroups === null ? null : requiredGroups - existingGroups;

	return (
		<GlassPanel size="compact" className={className}>
			<form action={synchronizeGroups}>
				<input
					type="hidden"
					name="course_public_id"
					value={coursePublicId}
				/>
				<input type="hidden" name="period" value={period} />
				<input type="hidden" name="return_to" value={returnTo} />

				<h2 className="text-xl font-semibold">Crear grupos</h2>
				<p className="mt-1 text-sm text-muted">
					Define cuántos alumnos caben en cada grupo.
				</p>

				<div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
					<label className="flex items-center gap-3 text-sm font-medium">
						<span className="whitespace-nowrap">
							Alumnos por grupo
						</span>
						<input
							name="capacity"
							type="number"
							min="1"
							value={capacity}
							onChange={(event) =>
								setCapacity(event.target.value)
							}
							required
							autoComplete="off"
							placeholder="Ej. 5"
							className="w-28 rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
						/>
					</label>
					<button className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:ml-auto">
						Crear grupos
					</button>
				</div>
				{authorized > 0 && requiredGroups !== null && (
					<p className="mt-4 text-sm text-muted">
						{groupDifference && groupDifference > 0 ? (
							<>
								Se crearán{" "}
								<span className="font-semibold text-foreground tabular-nums">
									{groupDifference} grupos más
								</span>{" "}
								para completar los {requiredGroups} necesarios.
							</>
						) : groupDifference && groupDifference < 0 ? (
							<>
								Se eliminarán hasta{" "}
								<span className="font-semibold text-foreground tabular-nums">
									{Math.min(
										Math.abs(groupDifference),
										emptyGroups,
									)}{" "}
									grupos vacíos
								</span>
								; se necesitan {requiredGroups} grupos.
							</>
						) : (
							<>
								Ya hay{" "}
								<span className="font-semibold text-foreground tabular-nums">
									{existingGroups} grupos
								</span>{" "}
								para esta capacidad.
							</>
						)}
					</p>
				)}
			</form>
		</GlassPanel>
	);
}
