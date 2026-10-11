"use client";

import { useState, useTransition } from "react";
import { addEvaluationAction, deleteEvaluationAction } from "@/app/teacher/grades/actions";

type Evaluation = {
	id: number;
	public_id: string;
	name: string;
	position: number;
};

export function EvaluationManagerDialog({
	coursePublicId,
	evaluations,
}: {
	coursePublicId: string;
	evaluations: Evaluation[];
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [name, setName] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	function handleAdd(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim()) return;
		setError(null);

		const formData = new FormData();
		formData.set("course_public_id", coursePublicId);
		formData.set("name", name.trim());

		startTransition(async () => {
			const res = await addEvaluationAction(formData);
			if (res.error) {
				setError(res.error);
			} else {
				setName("");
			}
		});
	}

	function handleDelete(evaluationPublicId: string) {
		if (!confirm("¿Seguro que deseas eliminar esta evaluación? Las notas asociadas se perderán.")) {
			return;
		}
		setError(null);

		const formData = new FormData();
		formData.set("evaluation_public_id", evaluationPublicId);

		startTransition(async () => {
			const res = await deleteEvaluationAction(formData);
			if (res.error) {
				setError(res.error);
			}
		});
	}

	return (
		<>
			<button
				type="button"
				onClick={() => setIsOpen(true)}
				className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
			>
				<svg
					className="h-4 w-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
					/>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					/>
				</svg>
				Gestionar Evaluaciones
			</button>

			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
					<div className="glass w-full max-w-md rounded-3xl border border-white/20 bg-background p-6 shadow-2xl">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold">
								Evaluaciones del curso
							</h3>
							<button
								type="button"
								onClick={() => setIsOpen(false)}
								className="rounded-lg p-1.5 text-muted hover:bg-surface-muted hover:text-foreground"
							>
								✕
							</button>
						</div>

						<p className="mt-2 text-sm text-muted">
							Agrega o elimina las evaluaciones del curso (ej. T1, T2, Parcial, etc.).
						</p>

						{error && (
							<div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
								{error}
							</div>
						)}

						<form onSubmit={handleAdd} className="mt-4 flex gap-2">
							<input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Ej. T4, Examen Final..."
								disabled={isPending}
								className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
							/>
							<button
								type="submit"
								disabled={isPending || !name.trim()}
								className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
							>
								{isPending ? "..." : "Añadir"}
							</button>
						</form>

						<div className="mt-5 max-h-60 divide-y divide-border overflow-y-auto rounded-2xl border border-border">
							{evaluations.length === 0 ? (
								<p className="p-4 text-center text-sm text-muted">
									No hay evaluaciones definidas.
								</p>
							) : (
								evaluations.map((ev) => (
									<div
										key={ev.id}
										className="flex items-center justify-between px-4 py-3 text-sm"
									>
										<span className="font-medium">{ev.name}</span>
										<button
											type="button"
											onClick={() => handleDelete(ev.public_id)}
											disabled={isPending}
											className="rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50"
										>
											Eliminar
										</button>
									</div>
								))
							)}
						</div>

						<div className="mt-6 flex justify-end">
							<button
								type="button"
								onClick={() => setIsOpen(false)}
								className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
							>
								Cerrar
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
