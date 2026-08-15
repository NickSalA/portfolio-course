"use client";

import { useRef } from "react";
import { updatePeriodDates } from "@/app/teacher/periods/actions";

export function PeriodDatesDialog({
	period,
}: {
	period: {
		id: number;
		code: string;
		starts_at: string | null;
		ends_at: string | null;
	};
}) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	return (
		<>
			<button
				type="button"
				onClick={() => dialogRef.current?.showModal()}
				className="mt-5 text-sm font-semibold text-accent transition hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
			>
				Editar fechas
			</button>
			<dialog
				ref={dialogRef}
				className="m-auto w-[min(100%-2rem,28rem)] overscroll-contain rounded-3xl border border-white/25 bg-transparent p-0 text-foreground shadow-2xl backdrop:bg-slate-950/55 backdrop:backdrop-blur-sm"
			>
				<form
					action={updatePeriodDates}
					className="glass-strong rounded-3xl p-6"
				>
					<input type="hidden" name="period_id" value={period.id} />
					<div className="flex items-start justify-between gap-4">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[.18em] text-accent">
								{period.code}
							</p>
							<h2 className="mt-2 text-xl font-semibold">
								Fechas del periodo
							</h2>
							<p className="mt-1 text-sm text-muted">
								Son informativas; no cambian el estado del
								ciclo.
							</p>
						</div>
						<button
							type="button"
							onClick={() => dialogRef.current?.close()}
							aria-label="Cerrar edición de fechas"
							className="grid size-9 place-items-center rounded-lg border border-border bg-surface-muted text-lg text-muted"
						>
							×
						</button>
					</div>
					<div className="mt-6 grid gap-4 sm:grid-cols-2">
						<label className="text-sm text-muted">
							Inicio
							<input
								name="starts_at"
								type="date"
								autoComplete="off"
								defaultValue={period.starts_at ?? ""}
								className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-foreground"
							/>
						</label>
						<label className="text-sm text-muted">
							Cierre
							<input
								name="ends_at"
								type="date"
								autoComplete="off"
								defaultValue={period.ends_at ?? ""}
								className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-foreground"
							/>
						</label>
					</div>
					<div className="mt-6 flex justify-end border-t border-border pt-5">
						<button className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white">
							Guardar fechas
						</button>
					</div>
				</form>
			</dialog>
		</>
	);
}
