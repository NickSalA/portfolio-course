"use client";

import { useId, useRef } from "react";
import { renameCourse } from "@/app/teacher/courses/actions";

export function EditCourseNameDialog({
	coursePublicId,
	periodPublicId,
	initialName,
	compact = false,
}: {
	coursePublicId: string;
	periodPublicId: string;
	initialName: string;
	compact?: boolean;
}) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const titleId = useId();
	return (
		<>
			<button
				type="button"
				onClick={() => dialogRef.current?.showModal()}
				aria-label="Editar nombre del curso"
				title="Editar nombre"
				className={
					compact
						? "ml-2 inline-grid size-8 place-items-center rounded-lg border border-border text-sm text-muted transition hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
						: "min-h-9 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
				}
			>
				{compact ? (
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="size-4"
						aria-hidden="true"
					>
						<path d="M12 20h9" />
						<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
					</svg>
				) : (
					"Editar nombre"
				)}
			</button>
			<dialog
				ref={dialogRef}
				aria-labelledby={titleId}
				className="m-auto w-[min(100%-2rem,30rem)] rounded-3xl border border-white/25 bg-transparent p-0 text-foreground shadow-2xl backdrop:bg-slate-950/55 backdrop:backdrop-blur-sm"
			>
				<form
					action={renameCourse}
					className="glass-strong rounded-3xl p-6"
				>
					<div className="flex items-start justify-between gap-4">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
								Curso
							</p>
							<h2 id={titleId} className="mt-2 text-xl font-semibold">
								Editar nombre
							</h2>
						</div>
						<button
							type="button"
							onClick={() => dialogRef.current?.close()}
							aria-label="Cerrar"
							className="grid size-9 place-items-center rounded-lg border border-border text-lg text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
						>
							×
						</button>
					</div>
					<input
						type="hidden"
						name="course_public_id"
						value={coursePublicId}
					/>
					<input
						type="hidden"
						name="period_public_id"
						value={periodPublicId}
					/>
					<label className="mt-6 block text-sm text-muted">
						Nombre del curso
						<input
							name="name"
							required
							defaultValue={initialName}
							autoFocus
							className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
						/>
					</label>
					<div className="mt-6 flex justify-end gap-3">
						<button
							type="button"
							onClick={() => dialogRef.current?.close()}
							className="min-h-9 rounded-xl border border-border px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
						>
							Cancelar
						</button>
						<button
							type="submit"
							className="min-h-9 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
						>
							Guardar nombre
						</button>
					</div>
				</form>
			</dialog>
		</>
	);
}
