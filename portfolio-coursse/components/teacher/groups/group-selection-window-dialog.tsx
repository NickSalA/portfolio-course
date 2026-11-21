"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { saveSelectionWindow } from "@/app/teacher/courses/group-actions";
import {
	buildReopenWindowDefaults,
	validateSelectionWindowInput,
	type SelectionWindowStatus,
} from "@/lib/teacher/group-config";

type GroupSelectionWindowDialogProps = {
	coursePublicId: string;
	period: string;
	returnTo: string;
	status: SelectionWindowStatus;
	disabled?: boolean;
	opensDate: string;
	opensTime: string;
	closesDate: string;
	closesTime: string;
};

function WindowSubmitButton({
	status,
	invalid,
}: {
	status: SelectionWindowStatus;
	invalid: boolean;
}) {
	const { pending } = useFormStatus();
	const idleLabel =
		status === "closed"
			? "Reabrir para todo el curso"
			: "Guardar ventana";

	return (
		<button
			type="submit"
			disabled={pending || invalid}
			className="min-h-10 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
		>
			{pending ? "Guardando ventana…" : idleLabel}
		</button>
	);
}

export function GroupSelectionWindowDialog({
	coursePublicId,
	period,
	returnTo,
	status,
	disabled = false,
	opensDate: initialOpensDate,
	opensTime: initialOpensTime,
	closesDate: initialClosesDate,
	closesTime: initialClosesTime,
}: GroupSelectionWindowDialogProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const titleId = useId();
	const [opensDate, setOpensDate] = useState(initialOpensDate);
	const [opensTime, setOpensTime] = useState(initialOpensTime);
	const [closesDate, setClosesDate] = useState(initialClosesDate);
	const [closesTime, setClosesTime] = useState(initialClosesTime);
	const [submitAttempted, setSubmitAttempted] = useState(false);

	const triggerLabel =
		status === "closed"
			? "Reabrir para todo el curso"
			: status === "unconfigured"
				? "Configurar ventana"
				: "Ampliar o editar ventana";

	const dialogTitle =
		status === "closed"
			? "Reabrir ventana para todo el curso"
			: status === "unconfigured"
				? "Define la ventana"
				: "Amplía o edita la ventana";

	const intent =
		status === "closed"
			? "reopen"
			: status === "unconfigured"
				? "configure"
				: "extend";

	const validation = validateSelectionWindowInput({
		opensOn: opensDate,
		opensAt: opensTime,
		closesOn: closesDate,
		closesAt: closesTime,
	});
	const hasAnyValue = Boolean(
		opensDate || opensTime || closesDate || closesTime,
	);
	const showRangeError =
		!validation.ok &&
		(submitAttempted ||
			(validation.code === "window-range" &&
				Boolean(opensDate && opensTime && closesDate && closesTime)));

	function openDialog() {
		setOpensDate(initialOpensDate);
		setOpensTime(initialOpensTime);
		setClosesDate(initialClosesDate);
		setClosesTime(initialClosesTime);
		setSubmitAttempted(false);
		dialogRef.current?.showModal();
	}

	function applyReopenDefaults() {
		const defaults = buildReopenWindowDefaults(new Date(), 48);
		setOpensDate(defaults.opensDate);
		setOpensTime(defaults.opensTime);
		setClosesDate(defaults.closesDate);
		setClosesTime(defaults.closesTime);
		setSubmitAttempted(false);
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		if (!validation.ok) {
			event.preventDefault();
			setSubmitAttempted(true);
		}
	}

	return (
		<>
			<button
				type="button"
				disabled={disabled}
				onClick={openDialog}
				className="min-h-10 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition-[background-color,border-color,color,transform] hover:-translate-y-0.5 hover:border-accent hover:bg-accent-soft hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
			>
				{triggerLabel}
			</button>
			<dialog
				ref={dialogRef}
				aria-labelledby={titleId}
				className="m-auto w-[min(100%-2rem,42rem)] overscroll-contain rounded-3xl border border-white/25 bg-transparent p-0 text-foreground shadow-2xl backdrop:bg-slate-950/55 backdrop:backdrop-blur-sm"
			>
				<form
					action={saveSelectionWindow}
					onSubmit={handleSubmit}
					className="glass-strong rounded-3xl p-6 sm:p-8"
				>
					<input
						type="hidden"
						name="course_public_id"
						value={coursePublicId}
					/>
					<input type="hidden" name="period" value={period} />
					<input type="hidden" name="return_to" value={returnTo} />
					<input type="hidden" name="intent" value={intent} />
					<div className="flex items-start justify-between gap-5">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
								Selección de grupos · Todo el curso
							</p>
							<h2
								id={titleId}
								className="mt-2 text-2xl font-semibold tracking-tight"
							>
								{dialogTitle}
							</h2>
							<p className="mt-2 text-sm leading-6 text-muted">
								Habilita a todos los alumnos autorizados de este
								curso; no existen permisos individuales ni
								afecta a otros cursos.
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
					{status === "closed" && (
						<div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface-muted/60 px-4 py-3">
							<p className="text-xs text-muted">
								Atajo de reapertura editable:
							</p>
							<button
								type="button"
								onClick={applyReopenDefaults}
								className="rounded-lg border border-accent/40 bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
							>
								Prellenar desde ahora (+48 h)
							</button>
						</div>
					)}
					<div className="mt-6 grid gap-6 sm:grid-cols-2">
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
										value={opensDate}
										onChange={(event) =>
											setOpensDate(event.target.value)
										}
										className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
									/>
								</label>
								<label className="text-sm text-muted">
									Hora
									<input
										name="opens_at"
										type="time"
										autoComplete="off"
										step="60"
										required
										value={opensTime}
										onChange={(event) =>
											setOpensTime(event.target.value)
										}
										className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
										value={closesDate}
										onChange={(event) =>
											setClosesDate(event.target.value)
										}
										className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
									/>
								</label>
								<label className="text-sm text-muted">
									Hora
									<input
										name="closes_at"
										type="time"
										autoComplete="off"
										step="60"
										required
										value={closesTime}
										onChange={(event) =>
											setClosesTime(event.target.value)
										}
										className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
									/>
								</label>
							</div>
						</div>
					</div>
					{showRangeError && (
						<p
							role="alert"
							className="mt-4 rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger"
						>
							{!validation.ok &&
							validation.code === "window-required"
								? "Completa la fecha y hora de apertura y cierre."
								: "La fecha y hora de cierre deben ser posteriores a las de apertura."}
						</p>
					)}
					{validation.ok &&
						validation.closesInPast &&
						hasAnyValue && (
							<p
								role="status"
								className="mt-4 rounded-xl border border-border bg-surface-muted/70 px-3.5 py-2.5 text-xs text-foreground"
							>
								Nota: el cierre elegido ya pasó; si guardas así,
								la ventana quedará cerrada para los alumnos.
							</p>
						)}
					<div className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-5">
						<p className="text-xs text-muted">
							Hora institucional · Lima, Perú
						</p>
						<WindowSubmitButton
							status={status}
							invalid={
								!validation.ok &&
								Boolean(
									opensDate &&
										opensTime &&
										closesDate &&
										closesTime,
								)
							}
						/>
					</div>
				</form>
			</dialog>
		</>
	);
}
