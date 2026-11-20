"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { saveGroupGradeAction } from "@/app/teacher/grades/actions";

type Evaluation = {
	id: number;
	public_id: string;
	name: string;
	position: number;
};

type GroupMember = {
	full_name: string | null;
	email: string;
};

type GradeRecord = {
	evaluation_id: number;
	grade: number | null;
	revision: number;
	participants?: string[] | null;
};

type GroupRow = {
	id: number;
	name: string;
	position: number;
	members: GroupMember[];
	grades: Record<number, GradeRecord>;
};

function latestGrade(server?: GradeRecord, local?: GradeRecord) {
	return local && local.revision > (server?.revision ?? 0) ? local : server;
}

export function GroupGradesTable({
	courseId,
	courseName,
	groups,
	evaluations,
}: {
	courseId: number;
	courseName: string;
	groups: GroupRow[];
	evaluations: Evaluation[];
}) {
	const [edits, setEdits] = useState<Record<string, string>>({});
	const [savedGrades, setSavedGrades] = useState<Record<string, GradeRecord>>({});
	const [status, setStatus] = useState<Record<string, "saving" | "saved">>({});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [correction, setCorrection] = useState<{
		key: string;
		group: GroupRow;
		evaluation: Evaluation;
		previous: GradeRecord;
		value: string;
	} | null>(null);
	const dialogRef = useRef<HTMLDialogElement>(null);
	const router = useRouter();
	const [, startTransition] = useTransition();

	function clearEdit(key: string) {
		setEdits((previous) => {
			const next = { ...previous };
			delete next[key];
			return next;
		});
	}

	function discardEdit(key: string) {
		clearEdit(key);
		setErrors((previous) => ({ ...previous, [key]: "" }));
	}

	function save(group: GroupRow, evaluation: Evaluation, value: string, revision: number, reason = "") {
		const key = `${group.id}-${evaluation.id}`;
		const form = new FormData();
		form.set("course_id", String(courseId));
		form.set("group_id", String(group.id));
		form.set("evaluation_id", String(evaluation.id));
		form.set("grade", value);
		form.set("revision", String(revision));
		form.set("reason", reason);

		setErrors((previous) => ({ ...previous, [key]: "" }));
		setStatus((previous) => ({ ...previous, [key]: "saving" }));
		startTransition(async () => {
			try {
				const result = await saveGroupGradeAction(form);
				if (result.grade === undefined || result.revision === undefined) {
					if (result.conflict) router.refresh();
					throw new Error(result.error ?? "No se pudo confirmar el guardado.");
				}
				const record = { evaluation_id: evaluation.id, grade: result.grade, revision: result.revision };
				setSavedGrades((previous) => ({ ...previous, [key]: record }));
				setStatus((previous) => ({ ...previous, [key]: "saved" }));
				clearEdit(key);
			} catch (error) {
				const message = error instanceof Error ? error.message : "No se pudo guardar la nota.";
				setErrors((previous) => ({ ...previous, [key]: message }));
				setStatus((previous) => {
					const next = { ...previous };
					delete next[key];
					return next;
				});
			}
		});
	}

	function closeCorrection() {
		dialogRef.current?.close();
		setCorrection(null);
	}

	function cancelCorrection() {
		if (correction) discardEdit(correction.key);
		closeCorrection();
	}

	function handleBlur(group: GroupRow, evaluation: Evaluation, current?: GradeRecord) {
		const key = `${group.id}-${evaluation.id}`;
		const value = edits[key]?.trim();
		if (value === undefined) return;
		if (!value || Number(value) === current?.grade) {
			discardEdit(key);
			return;
		}
		if (!/^\d+(?:\.\d{1,2}0*)?$/.test(value) || Number(value) > 20) {
			setErrors((previous) => ({ ...previous, [key]: "Ingresa una nota de 0 a 20 con hasta dos decimales." }));
			return;
		}
		if (current && current.grade !== null) {
			setCorrection({ key, group, evaluation, value, previous: current });
			dialogRef.current?.showModal();
			return;
		}
		save(group, evaluation, value, current?.revision ?? 0);
	}

	function exportToExcel() {
		const data = groups.map((g) => {
			const row: Record<string, string | number> = {
				Grupo: g.name,
				Integrantes: g.members.map((m) => m.full_name || m.email).join(", "),
			};
			for (const ev of evaluations) {
				const key = `${g.id}-${ev.id}`;
				const grade = latestGrade(g.grades[ev.id], savedGrades[key]);
				row[ev.name] = grade?.grade ?? "-";
			}
			return row;
		});

		const wb = XLSX.utils.book_new();
		const ws = XLSX.utils.json_to_sheet(data);
		XLSX.utils.book_append_sheet(wb, ws, "Notas Grupos");

		const safeCourseName = courseName.replace(/[^a-zA-Z0-9-_]/g, "_");
		XLSX.writeFile(wb, `Notas_${safeCourseName}_${new Date().toISOString().split("T")[0]}.xlsx`);
	}

	if (groups.length === 0) {
		return (
			<div className="glass mt-6 rounded-3xl border border-white/20 p-8 text-center text-muted">
				No hay grupos configurados para este curso. Crea grupos desde el módulo de Cursos.
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<dialog
				ref={dialogRef}
				aria-labelledby="grade-correction-title"
				className="m-auto w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-foreground backdrop:bg-black/50"
				onCancel={(event) => {
					event.preventDefault();
					cancelCorrection();
				}}
			>
				{correction && (
					<form
						className="space-y-4"
						onSubmit={(event) => {
							event.preventDefault();
							const reason = String(new FormData(event.currentTarget).get("reason") ?? "").trim();
							if (!reason) return;
							save(correction.group, correction.evaluation, correction.value, correction.previous.revision, reason);
							closeCorrection();
						}}
					>
						<h2 id="grade-correction-title" className="text-lg font-semibold">Confirmar corrección</h2>
						<p>{correction.group.name} · {correction.evaluation.name}</p>
						<p>Nota anterior {correction.previous.grade} · Nueva nota {correction.value}</p>
						<label className="block space-y-1">
							<span>Motivo de la corrección</span>
							<textarea name="reason" required maxLength={1000} rows={3} className="w-full rounded-xl border border-border bg-surface-muted p-2" />
						</label>
						<div className="flex justify-end gap-3">
							<button type="button" className="rounded-xl border border-border px-3 py-2" onClick={cancelCorrection}>Cancelar</button>
							<button type="submit" className="rounded-xl bg-accent px-3 py-2 text-white">Confirmar</button>
						</div>
					</form>
				)}
			</dialog>
			<div className="flex justify-end">
				<button
					type="button"
					onClick={exportToExcel}
					className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium transition hover:border-accent hover:text-accent"
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
							d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					Exportar Notas (.xlsx)
				</button>
			</div>

			<div className="glass overflow-x-auto rounded-3xl border border-white/25 shadow-[0_20px_55px_rgb(15_23_42/8%)]">
				<table className="w-full text-left text-sm">
					<thead>
						<tr className="border-b border-border bg-surface-muted/40 text-xs font-semibold uppercase tracking-wider text-muted">
							<th className="min-w-48 px-6 py-4">Grupo / Integrantes actuales</th>
							{evaluations.map((ev) => (
								<th key={ev.id} className="w-28 px-4 py-4 text-center">
									{ev.name}
								</th>
							))}
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{groups.map((group) => (
							<tr key={group.id} className="transition hover:bg-surface/50">
								<td className="px-6 py-4">
									<div className="font-semibold text-foreground">
										{group.name}
									</div>
									<div className="mt-1 max-w-sm truncate text-xs text-muted">
										{group.members.length > 0
											? group.members.map((m) => m.full_name || m.email).join(", ")
											: "Sin integrantes"}
									</div>
								</td>
								{evaluations.map((ev) => {
									const key = `${group.id}-${ev.id}`;
									const serverGrade = group.grades[ev.id];
									const current = latestGrade(serverGrade, savedGrades[key]);
									const legacy = current?.revision === 0 && current.grade !== null;
									const message = legacy ? "Destinatarios sin verificar" : errors[key];
									return (
										<td key={ev.id} className="px-4 py-4 text-center">
											<div className="relative inline-block w-20">
												<input
													type="number"
													step="0.01"
													min="0"
													max="20"
													aria-label={`${group.name}, ${ev.name}`}
													aria-describedby={message ? `grade-status-${key}` : undefined}
													aria-invalid={Boolean(errors[key])}
													readOnly={legacy || status[key] === "saving"}
													value={edits[key] ?? current?.grade ?? ""}
													onChange={(event) => {
														const value = event.target.value;
														setEdits((previous) => ({ ...previous, [key]: value }));
													}}
													onBlur={() => handleBlur(group, ev, current)}
													placeholder="-"
													className={`w-full rounded-xl border px-2 py-1.5 text-center font-medium outline-none transition focus:ring-2 focus:ring-accent ${
														errors[key]
															? "border-red-500 bg-red-500/10 text-red-400"
															: status[key] === "saved"
																? "border-emerald-500 bg-emerald-500/10"
																: "border-border bg-surface-muted text-foreground"
													}`}
												/>
												{status[key] === "saving" && (
													<span className="absolute -top-1 -right-1 block size-2 animate-ping rounded-full bg-accent" />
												)}
											</div>
											{message && (
												<p id={`grade-status-${key}`} role={legacy ? undefined : "status"} className="mt-1 text-xs text-muted">
													{message}
													{errors[key] && edits[key] !== undefined && current?.grade != null && (
														<> Nota confirmada {current.grade}.</>
													)}
												</p>
											)}
											{current && current.revision > 0 && (
												<details className="mt-1 text-xs text-muted">
													<summary className="cursor-pointer">Destinatarios históricos</summary>
													{serverGrade?.participants?.join(", ") || "Lista no disponible en esta vista."}
												</details>
											)}
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
