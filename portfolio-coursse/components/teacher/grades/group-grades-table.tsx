"use client";

import { useState, useTransition } from "react";
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
	feedback: string | null;
};

type GroupRow = {
	id: number;
	name: string;
	position: number;
	members: GroupMember[];
	grades: Record<number, GradeRecord>;
};

export function GroupGradesTable({
	courseName,
	groups,
	evaluations,
}: {
	courseName: string;
	groups: GroupRow[];
	evaluations: Evaluation[];
}) {
	// Local state of input values: key is `${groupId}-${evaluationId}`
	const [localGrades, setLocalGrades] = useState<Record<string, string>>(() => {
		const initial: Record<string, string> = {};
		for (const group of groups) {
			for (const ev of evaluations) {
				const g = group.grades[ev.id]?.grade;
				initial[`${group.id}-${ev.id}`] = g !== null && g !== undefined ? String(g) : "";
			}
		}
		return initial;
	});

	const [statusMap, setStatusMap] = useState<Record<string, "saved" | "saving" | "error">>({});
	const [, startTransition] = useTransition();

	function handleGradeChange(groupId: number, evalId: number, val: string) {
		const key = `${groupId}-${evalId}`;
		setLocalGrades((prev) => ({ ...prev, [key]: val }));
	}

	function handleBlur(groupId: number, evalId: number) {
		const key = `${groupId}-${evalId}`;
		const val = localGrades[key]?.trim() ?? "";

		// Validation
		if (val !== "") {
			const num = Number(val);
			if (isNaN(num) || num < 0 || num > 20) {
				setStatusMap((prev) => ({ ...prev, [key]: "error" }));
				return;
			}
		}

		setStatusMap((prev) => ({ ...prev, [key]: "saving" }));

		const formData = new FormData();
		formData.set("group_id", String(groupId));
		formData.set("evaluation_id", String(evalId));
		formData.set("grade", val);

		startTransition(async () => {
			const res = await saveGroupGradeAction(formData);
			if (res.error) {
				setStatusMap((prev) => ({ ...prev, [key]: "error" }));
			} else {
				setStatusMap((prev) => ({ ...prev, [key]: "saved" }));
				setTimeout(() => {
					setStatusMap((prev) => {
						const next = { ...prev };
						delete next[key];
						return next;
					});
				}, 2000);
			}
		});
	}

	function exportToExcel() {
		const data = groups.map((g) => {
			const row: Record<string, string | number> = {
				Grupo: g.name,
				Integrantes: g.members.map((m) => m.full_name || m.email).join(", "),
			};
			for (const ev of evaluations) {
				const key = `${g.id}-${ev.id}`;
				const gradeVal = localGrades[key];
				row[ev.name] = gradeVal !== "" && gradeVal !== undefined ? Number(gradeVal) : "-";
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
							<th className="min-w-48 px-6 py-4">Grupo / Integrantes</th>
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
									const status = statusMap[key];
									return (
										<td key={ev.id} className="px-4 py-4 text-center">
											<div className="relative inline-block w-20">
												<input
													type="number"
													step="0.1"
													min="0"
													max="20"
													value={localGrades[key] ?? ""}
													onChange={(e) =>
														handleGradeChange(
															group.id,
															ev.id,
															e.target.value,
														)
													}
													onBlur={() =>
														handleBlur(group.id, ev.id)
													}
													placeholder="-"
													className={`w-full rounded-xl border px-2 py-1.5 text-center font-medium outline-none transition focus:ring-2 focus:ring-accent ${
														status === "error"
															? "border-red-500 bg-red-500/10 text-red-400"
															: status === "saved"
																? "border-emerald-500 bg-emerald-500/10"
																: "border-border bg-surface-muted text-foreground"
													}`}
												/>
												{status === "saving" && (
													<span className="absolute -top-1 -right-1 block size-2 animate-ping rounded-full bg-accent" />
												)}
											</div>
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
