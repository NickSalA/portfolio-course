"use client";

import { useRef } from "react";
import { renameCourse } from "@/app/teacher/courses/actions";

export function EditCourseNameDialog({
	coursePublicId,
	periodPublicId,
	initialName,
}: {
	coursePublicId: string;
	periodPublicId: string;
	initialName: string;
}) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	return (
		<>
			<button
				type="button"
				onClick={() => dialogRef.current?.showModal()}
				className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground transition hover:border-accent"
			>
				Editar nombre
			</button>
			<dialog
				ref={dialogRef}
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
							<h2 className="mt-2 text-xl font-semibold">
								Editar nombre
							</h2>
						</div>
						<button
							type="button"
							onClick={() => dialogRef.current?.close()}
							aria-label="Cerrar"
							className="grid size-9 place-items-center rounded-lg border border-border text-lg text-muted"
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
							className="rounded-xl border border-border px-4 py-2 text-sm font-medium"
						>
							Cancelar
						</button>
						<button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">
							Guardar nombre
						</button>
					</div>
				</form>
			</dialog>
		</>
	);
}
