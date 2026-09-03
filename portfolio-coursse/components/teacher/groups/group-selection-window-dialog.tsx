"use client";

import { useRef } from "react";
import { saveSelectionWindow } from "@/app/teacher/courses/[coursePublicId]/group-actions";

type GroupSelectionWindowDialogProps = {
	coursePublicId: string;
	period: string;
	returnTo: string;
	opensDate: string;
	opensTime: string;
	closesDate: string;
	closesTime: string;
};

export function GroupSelectionWindowDialog({
	coursePublicId,
	period,
	returnTo,
	opensDate,
	opensTime,
	closesDate,
	closesTime,
}: GroupSelectionWindowDialogProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	return (
		<>
			<button
				type="button"
				onClick={() => dialogRef.current?.showModal()}
				className="rounded-xl border border-border bg-surface-muted px-4 py-2.5 text-sm font-semibold text-foreground transition-[background-color,border-color,color,transform] hover:-translate-y-0.5 hover:border-accent hover:bg-accent-soft hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
			>
				Configurar ventana de selección
			</button>
			<dialog
				ref={dialogRef}
				className="m-auto w-[min(100%-2rem,42rem)] overscroll-contain rounded-3xl border border-white/25 bg-transparent p-0 text-foreground shadow-2xl backdrop:bg-slate-950/55 backdrop:backdrop-blur-sm"
			>
				<form
					action={saveSelectionWindow}
					className="glass-strong rounded-3xl p-6 sm:p-8"
				>
					<input
						type="hidden"
						name="course_public_id"
						value={coursePublicId}
					/>
					<input type="hidden" name="period" value={period} />
					<input type="hidden" name="return_to" value={returnTo} />
					<div className="flex items-start justify-between gap-5">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
								Selección de grupos
							</p>
							<h2 className="mt-2 text-2xl font-semibold tracking-tight">
								Define la ventana
							</h2>
							<p className="mt-2 text-sm leading-6 text-muted">
								Los alumnos podrán elegir o cambiar su grupo
								solo durante este horario.
							</p>
						</div>
						<button
							type="button"
							onClick={() => dialogRef.current?.close()}
							aria-label="Cerrar ventana de selección"
							className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface-muted text-lg text-muted transition hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
						>
							×
						</button>
					</div>
					<div className="mt-7 grid gap-6 sm:grid-cols-2">
						<div className="border-l-2 border-accent pl-4">
							<p className="font-semibold">Abre la selección</p>
							<div className="mt-4 grid gap-3">
								<label className="text-sm text-muted">
									Fecha
									<input
										name="opens_on"
										type="date"
										autoComplete="off"
										required
										defaultValue={opensDate}
										className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-foreground"
									/>
								</label>
								<label className="text-sm text-muted">
									Hora
									<input
										name="opens_at"
										type="time"
										autoComplete="off"
										step="900"
										required
										defaultValue={opensTime}
										className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-foreground"
									/>
								</label>
							</div>
						</div>
						<div className="border-l-2 border-border pl-4">
							<p className="font-semibold">Cierra la selección</p>
							<div className="mt-4 grid gap-3">
								<label className="text-sm text-muted">
									Fecha
									<input
										name="closes_on"
										type="date"
										autoComplete="off"
										required
										defaultValue={closesDate}
										className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-foreground"
									/>
								</label>
								<label className="text-sm text-muted">
									Hora
									<input
										name="closes_at"
										type="time"
										autoComplete="off"
										step="900"
										required
										defaultValue={closesTime}
										className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-foreground"
									/>
								</label>
							</div>
						</div>
					</div>
					<div className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-5">
						<p className="text-xs text-muted">
							Hora institucional · Lima, Perú
						</p>
						<button className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
							Guardar ventana
						</button>
					</div>
				</form>
			</dialog>
		</>
	);
}
