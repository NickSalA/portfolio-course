"use client";

import { useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { synchronizeGroups } from "@/app/teacher/courses/group-actions";
import { GlassPanel } from "@/components/ui/glass-panel";
import {
	calculateSuggestedGroupCount,
	computeGroupSyncPreview,
} from "@/lib/teacher/group-config";

type GroupCapacityFormProps = {
	coursePublicId: string;
	period: string;
	returnTo: string;
	authorized: number;
	initialCapacity: number | null;
	existingGroups: number;
	maxGroupMembers: number;
	disabled?: boolean;
	className?: string;
};

function SubmitButton({
	existingGroups,
	disabled,
}: {
	existingGroups: number;
	disabled: boolean;
}) {
	const { pending } = useFormStatus();
	const idleLabel =
		existingGroups > 0 ? "Actualizar grupos" : "Crear grupos";

	return (
		<button
			type="submit"
			disabled={disabled || pending}
			className="min-h-10 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto"
		>
			{pending ? "Guardando grupos…" : idleLabel}
		</button>
	);
}

export function GroupCapacityForm({
	coursePublicId,
	period,
	returnTo,
	authorized,
	initialCapacity,
	existingGroups,
	maxGroupMembers,
	disabled = false,
	className = "mt-6 max-w-2xl",
}: GroupCapacityFormProps) {
	const previewId = useId();
	const initialCapStr = initialCapacity ? String(initialCapacity) : "";
	const initialSuggested = initialCapacity
		? calculateSuggestedGroupCount(authorized, initialCapacity)
		: null;

	const [capacity, setCapacity] = useState(initialCapStr);
	const [groupCount, setGroupCount] = useState(
		existingGroups > 0
			? String(existingGroups)
			: initialSuggested
				? String(initialSuggested)
				: "",
	);
	const [countEditedManually, setCountEditedManually] = useState(
		existingGroups > 0,
	);

	const capacityValue = Number(capacity);
	const groupCountValue = Number(groupCount);
	const suggestedCount = calculateSuggestedGroupCount(
		authorized,
		capacityValue,
	);

	function handleCapacityChange(nextValue: string) {
		setCapacity(nextValue);
		if (!countEditedManually) {
			const nextSuggested = calculateSuggestedGroupCount(
				authorized,
				Number(nextValue),
			);
			setGroupCount(nextSuggested ? String(nextSuggested) : "");
		}
	}

	const preview = computeGroupSyncPreview({
		authorizedActive: authorized,
		capacity: capacityValue,
		groupCount: groupCountValue,
		existingGroups,
		maxGroupMembers,
	});

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

				<h2 className="text-xl font-semibold">Configurar grupos</h2>
				<p className="mt-1 text-sm text-muted">
					Define la capacidad por grupo y el número de grupos del
					curso.
				</p>

				<div className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
					<label className="flex flex-col gap-2 text-sm font-medium">
						<span>Alumnos por grupo</span>
						<input
							name="capacity"
							type="number"
							min="1"
							step="1"
							value={capacity}
							onChange={(event) =>
								handleCapacityChange(event.target.value)
							}
							required
							disabled={disabled}
							autoComplete="off"
							placeholder="Ej. 5"
							aria-describedby={previewId}
							className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
						/>
					</label>
					<div className="flex flex-col gap-2">
						<label className="flex flex-col gap-2 text-sm font-medium">
							<span>Número de grupos</span>
							<input
								name="group_count"
								type="number"
								min="1"
								step="1"
								value={groupCount}
								onChange={(event) => {
									setCountEditedManually(true);
									setGroupCount(event.target.value);
								}}
								required
								disabled={disabled}
								autoComplete="off"
								placeholder="Ej. 4"
								aria-describedby={previewId}
								className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
							/>
						</label>
						{suggestedCount !== null &&
							String(suggestedCount) !== groupCount && (
								<button
									type="button"
									disabled={disabled}
									onClick={() => {
										setCountEditedManually(false);
										setGroupCount(String(suggestedCount));
									}}
									className="inline-flex min-h-9 items-center self-start rounded-lg px-2 py-1 text-xs font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
								>
									Usar sugerido ({suggestedCount})
								</button>
							)}
					</div>
				</div>

				<div
					id={previewId}
					aria-live="polite"
					className="mt-4 space-y-2 text-sm text-muted"
				>
					{preview.capacityBelowMembers && (
						<p
							role="alert"
							className="rounded-xl border border-danger/30 bg-danger-soft px-3 py-2 text-danger"
						>
							La capacidad no puede ser menor que los{" "}
							<span className="font-semibold tabular-nums">
								{maxGroupMembers}
							</span>{" "}
							alumnos del grupo más ocupado.
						</p>
					)}
					{preview.valid && preview.totalSeats !== null && (
						<p>
							Cupos totales:{" "}
							<span className="font-semibold text-foreground tabular-nums">
								{preview.totalSeats}
							</span>{" "}
							para{" "}
							<span className="font-semibold text-foreground tabular-nums">
								{authorized}
							</span>{" "}
							alumno(s) autorizado(s) activo(s).
						</p>
					)}
					{preview.valid && preview.seatsShortfall > 0 && (
						<p className="rounded-xl border border-border bg-surface-muted/70 px-3 py-2 text-xs text-foreground">
							Advertencia: faltarán{" "}
							<span className="font-semibold tabular-nums">
								{preview.seatsShortfall}
							</span>{" "}
							cupo(s) para cubrir el padrón activo actual.
						</p>
					)}
					{preview.valid &&
						preview.groupsDelta !== null &&
						preview.groupsDelta > 0 && (
							<p>
								Se crearán{" "}
								<span className="font-semibold text-foreground tabular-nums">
									{preview.groupsDelta} grupo(s) nuevo(s)
								</span>{" "}
								para llegar a {groupCountValue}.
							</p>
						)}
					{preview.valid &&
						preview.groupsDelta !== null &&
						preview.groupsDelta < 0 && (
							<p>
								Se intentará reducir a{" "}
								<span className="font-semibold text-foreground tabular-nums">
									{groupCountValue} grupo(s)
								</span>
								: solo se retirarán grupos excedentes sin
								alumnos, notas ni historial académico; los demás
								se conservarán.
							</p>
						)}
					{preview.valid &&
						preview.groupsDelta === 0 &&
						existingGroups > 0 && (
							<p>
								Se mantendrán los{" "}
								<span className="font-semibold text-foreground tabular-nums">
									{existingGroups} grupos
								</span>{" "}
								con la nueva capacidad.
							</p>
						)}
				</div>

				<div className="mt-5 flex items-center justify-end border-t border-border pt-4">
					<SubmitButton
						existingGroups={existingGroups}
						disabled={disabled || preview.capacityBelowMembers}
					/>
				</div>
			</form>
		</GlassPanel>
	);
}
