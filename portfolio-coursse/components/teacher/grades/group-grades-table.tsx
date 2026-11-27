"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { saveGroupGradeAction } from "@/app/teacher/grades/actions";
import {
	classifyGradeCellState,
	formatActivityDateLima,
	formatExportCellValue,
	formatGradeForDisplay,
	resolveEvaluationGroupSnapshot,
	summarizeGradeProgress,
	validateGradeInput,
	type EvaluationItem,
	type EvaluationParticipantsState,
	type GradeRecord,
} from "@/lib/teacher/grade-matrix";

type GroupMember = {
	full_name: string | null;
	email: string;
};

type GroupRow = {
	id: number;
	name: string;
	position: number;
	members: GroupMember[];
	grades: Record<number, GradeRecord>;
};

type SaveOutcome =
	| { ok: true; grade: number; revision: number }
	| { ok: false; error: string; conflict?: boolean };

function latestGrade(server?: GradeRecord, local?: GradeRecord) {
	return local && local.revision > (server?.revision ?? 0) ? local : server;
}

export function GroupGradesTable({
	courseId,
	courseName,
	groups,
	evaluations,
	participantsByEvaluation = {},
	studentNames = {},
}: {
	courseId: number;
	courseName: string;
	groups: GroupRow[];
	evaluations: EvaluationItem[];
	participantsByEvaluation?: Record<number, EvaluationParticipantsState>;
	studentNames?: Record<number, string>;
}) {
	const [edits, setEdits] = useState<Record<string, string>>({});
	const [savedGrades, setSavedGrades] = useState<Record<string, GradeRecord>>(
		{},
	);
	const [status, setStatus] = useState<Record<string, "saving" | "saved">>(
		{},
	);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [notices, setNotices] = useState<Record<string, string>>({});
	const [announcement, setAnnouncement] = useState<string>("");
	const [selectedEvaluationId, setSelectedEvaluationId] = useState<
		number | null
	>(null);
	const [correction, setCorrection] = useState<{
		key: string;
		group: GroupRow;
		evaluation: EvaluationItem;
		previous: GradeRecord;
		value: string;
	} | null>(null);
	const [correctionReason, setCorrectionReason] = useState("");
	const [correctionError, setCorrectionError] = useState<string | null>(null);
	const [correctionSaving, setCorrectionSaving] = useState(false);

	const dialogRef = useRef<HTMLDialogElement>(null);
	const reasonRef = useRef<HTMLTextAreaElement>(null);
	const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
	const inFlightRef = useRef<Set<string>>(new Set());
	const correctionKeyRef = useRef<string | null>(null);
	const router = useRouter();
	const [, startTransition] = useTransition();

	useEffect(() => {
		if (correction && dialogRef.current && !dialogRef.current.open) {
			dialogRef.current.showModal();
			reasonRef.current?.focus();
		}
	}, [correction]);

	function clearEdit(key: string) {
		setEdits((previous) => {
			if (!(key in previous)) return previous;
			const next = { ...previous };
			delete next[key];
			return next;
		});
	}

	function discardEdit(key: string) {
		clearEdit(key);
		setErrors((previous) => {
			if (!previous[key]) return previous;
			const next = { ...previous };
			delete next[key];
			return next;
		});
		setNotices((previous) => {
			if (!previous[key]) return previous;
			const next = { ...previous };
			delete next[key];
			return next;
		});
	}

	async function saveGrade({
		group,
		evaluation,
		value,
		revision,
		reason = "",
		fallbackParticipants,
	}: {
		group: GroupRow;
		evaluation: EvaluationItem;
		value: string;
		revision: number;
		reason?: string;
		fallbackParticipants: string[];
	}): Promise<SaveOutcome> {
		const key = `${group.id}-${evaluation.id}`;
		if (inFlightRef.current.has(key)) {
			return { ok: false, error: "Ya hay un guardado en curso." };
		}

		inFlightRef.current.add(key);
		setErrors((previous) => {
			const next = { ...previous };
			delete next[key];
			return next;
		});
		setNotices((previous) => {
			const next = { ...previous };
			delete next[key];
			return next;
		});
		setStatus((previous) => ({ ...previous, [key]: "saving" }));

		const form = new FormData();
		form.set("course_id", String(courseId));
		form.set("group_id", String(group.id));
		form.set("evaluation_id", String(evaluation.id));
		form.set("grade", value);
		form.set("revision", String(revision));
		form.set("reason", reason);

		try {
			const result = await saveGroupGradeAction(form);
			if (
				result.grade === undefined ||
				result.revision === undefined
			) {
				if (result.conflict) {
					startTransition(() => {
						router.refresh();
					});
				}
				const errorMessage =
					result.error ?? "No se pudo confirmar el guardado.";
				setErrors((previous) => ({ ...previous, [key]: errorMessage }));
				setStatus((previous) => {
					const next = { ...previous };
					delete next[key];
					return next;
				});
				return {
					ok: false,
					error: errorMessage,
					conflict: result.conflict,
				};
			}

			const record: GradeRecord = {
				evaluation_id: evaluation.id,
				grade: result.grade,
				revision: result.revision,
				participants: fallbackParticipants,
			};
			setSavedGrades((previous) => ({ ...previous, [key]: record }));
			setStatus((previous) => ({ ...previous, [key]: "saved" }));
			clearEdit(key);
			setAnnouncement(
				result.revision > 1
					? `Corrección confirmada (${result.grade}) para ${group.name} en ${evaluation.name}. Ya es visible para sus participantes históricos.`
					: `Nota ${result.grade} confirmada para ${group.name} en ${evaluation.name}. Ya es visible para sus participantes históricos.`,
			);
			startTransition(() => {
				router.refresh();
			});
			return {
				ok: true,
				grade: result.grade,
				revision: result.revision,
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error && error.message.trim()
					? "No se pudo conectar con el servidor para confirmar el guardado. Tu borrador se conserva."
					: "No se pudo guardar la nota. Tu borrador se conserva.";
			setErrors((previous) => ({ ...previous, [key]: errorMessage }));
			setStatus((previous) => {
				const next = { ...previous };
				delete next[key];
				return next;
			});
			return { ok: false, error: errorMessage };
		} finally {
			inFlightRef.current.delete(key);
		}
	}

	function closeCorrection(restoreKey?: string) {
		correctionKeyRef.current = null;
		dialogRef.current?.close();
		setCorrection(null);
		setCorrectionReason("");
		setCorrectionError(null);
		setCorrectionSaving(false);
		if (restoreKey) {
			inputRefs.current[restoreKey]?.focus();
		}
	}

	function cancelCorrection() {
		const targetKey = correction?.key;
		if (targetKey) discardEdit(targetKey);
		closeCorrection(targetKey);
	}

	function openCorrectionDialog({
		key,
		group,
		evaluation,
		previous,
		value,
	}: {
		key: string;
		group: GroupRow;
		evaluation: EvaluationItem;
		previous: GradeRecord;
		value: string;
	}) {
		correctionKeyRef.current = key;
		setCorrection({ key, group, evaluation, previous, value });
		setCorrectionReason("");
		setCorrectionError(null);
		setCorrectionSaving(false);
	}

	async function submitCell(
		group: GroupRow,
		evaluation: EvaluationItem,
		current: GradeRecord | undefined,
		snapshotNames: string[],
	) {
		const key = `${group.id}-${evaluation.id}`;
		const legacy = current?.revision === 0 && current.grade !== null;
		if (legacy || inFlightRef.current.has(key)) return;

		const raw = edits[key];
		if (raw === undefined) return;
		const trimmed = raw.trim();

		if (trimmed === "") {
			discardEdit(key);
			if (current && current.grade !== null) {
				setNotices((previous) => ({
					...previous,
					[key]: "Una nota confirmada no se puede vaciar; ingresa una nueva nota para corregirla.",
				}));
			}
			return;
		}

		const validation = validateGradeInput(trimmed);
		if (!validation.ok) {
			setErrors((previous) => ({ ...previous, [key]: validation.message }));
			return;
		}

		if (current && current.grade !== null) {
			if (validation.value === current.grade) {
				discardEdit(key);
				return;
			}
			openCorrectionDialog({
				key,
				group,
				evaluation,
				previous: current,
				value: trimmed,
			});
			return;
		}

		await saveGrade({
			group,
			evaluation,
			value: trimmed,
			revision: current?.revision ?? 0,
			fallbackParticipants: snapshotNames,
		});
	}

	function handleBlur(
		group: GroupRow,
		evaluation: EvaluationItem,
		current: GradeRecord | undefined,
		snapshotNames: string[],
	) {
		const key = `${group.id}-${evaluation.id}`;
		if (
			inFlightRef.current.has(key) ||
			correctionKeyRef.current === key ||
			errors[key]
		) {
			return;
		}
		void submitCell(group, evaluation, current, snapshotNames);
	}

	function exportToExcel() {
		const data = groups.map((g) => {
			const row: Record<string, string | number> = {
				Grupo: g.name,
				Integrantes: g.members
					.map((m) => m.full_name || m.email)
					.join(", "),
			};
			for (const ev of evaluations) {
				const key = `${g.id}-${ev.id}`;
				const grade = latestGrade(g.grades[ev.id], savedGrades[key]);
				row[ev.name] = formatExportCellValue(grade?.grade);
			}
			return row;
		});

		const wb = XLSX.utils.book_new();
		const ws = XLSX.utils.json_to_sheet(data);
		XLSX.utils.book_append_sheet(wb, ws, "Notas Grupos");

		const safeCourseName = courseName.replace(/[^a-zA-Z0-9-_]/g, "_");
		XLSX.writeFile(
			wb,
			`Notas_${safeCourseName}_${new Date().toISOString().split("T")[0]}.xlsx`,
		);
	}

	if (groups.length === 0) {
		return (
			<div className="glass mt-6 rounded-3xl border border-white/20 p-8 text-center text-muted">
				No hay grupos configurados para este curso. Crea grupos desde el
				módulo de Cursos.
			</div>
		);
	}

	const selectedEvaluation =
		selectedEvaluationId !== null
			? evaluations.find((ev) => ev.id === selectedEvaluationId) ?? null
			: null;
	const visibleEvaluations = selectedEvaluation
		? [selectedEvaluation]
		: evaluations;

	const progress = summarizeGradeProgress(
		groups,
		visibleEvaluations,
		(group, evaluationId) =>
			latestGrade(
				group.grades[evaluationId],
				savedGrades[`${group.id}-${evaluationId}`],
			),
	);

	const liveCorrectionGroup = correction
		? groups.find((g) => g.id === correction.group.id) ?? correction.group
		: null;
	const liveCorrectionServerGrade =
		correction && liveCorrectionGroup
			? liveCorrectionGroup.grades[correction.evaluation.id]
			: undefined;
	const liveCorrectionPrevious = correction
		? latestGrade(liveCorrectionServerGrade, savedGrades[correction.key]) ??
			correction.previous
		: null;

	return (
		<div className="space-y-4">
			<dialog
				ref={dialogRef}
				aria-labelledby="grade-correction-title"
				aria-describedby="grade-correction-summary"
				className="m-auto w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-foreground shadow-2xl backdrop:bg-black/50"
				onCancel={(event) => {
					event.preventDefault();
					if (!correctionSaving) {
						cancelCorrection();
					}
				}}
			>
				{correction && liveCorrectionPrevious && (
					<form
						className="space-y-4"
						noValidate
						onSubmit={async (event) => {
							event.preventDefault();
							if (correctionSaving) return;

							const trimmedReason = correctionReason.trim();
							if (!trimmedReason) {
								setCorrectionError(
									"Indica un motivo de corrección de hasta 1000 caracteres.",
								);
								reasonRef.current?.focus();
								return;
							}

							const snapshot = resolveEvaluationGroupSnapshot(
								participantsByEvaluation[
									correction.evaluation.id
								],
								correction.group.id,
								studentNames,
							);
							const fallbackParticipants =
								liveCorrectionServerGrade?.participants ??
								liveCorrectionPrevious.participants ??
								snapshot.names;

							setCorrectionError(null);
							setCorrectionSaving(true);
							const outcome = await saveGrade({
								group: correction.group,
								evaluation: correction.evaluation,
								value: correction.value,
								revision: liveCorrectionPrevious.revision,
								reason: trimmedReason,
								fallbackParticipants,
							});
							setCorrectionSaving(false);

							if (outcome.ok) {
								closeCorrection(correction.key);
							} else {
								setCorrectionError(outcome.error);
							}
						}}
					>
						<h2
							id="grade-correction-title"
							className="text-lg font-semibold"
						>
							Confirmar corrección
						</h2>
						<div
							id="grade-correction-summary"
							className="space-y-1 rounded-xl border border-border bg-surface-muted/50 p-3 text-sm"
						>
							<p className="font-medium text-foreground">
								{correction.group.name} ·{" "}
								{correction.evaluation.name}
							</p>
							<p className="text-muted">
								Nota vigente:{" "}
								<strong className="text-foreground">
									{liveCorrectionPrevious.grade}
								</strong>{" "}
								· Nueva nota:{" "}
								<strong className="text-foreground">
									{correction.value}
								</strong>
							</p>
						</div>

						{correctionError && (
							<p
								role="alert"
								className="rounded-xl border border-danger/30 bg-danger-soft/70 p-3 text-xs font-medium text-danger"
							>
								{correctionError}
							</p>
						)}

						<label className="block space-y-1 text-sm">
							<span className="font-medium text-foreground">
								Motivo de la corrección
							</span>
							<textarea
								ref={reasonRef}
								name="reason"
								required
								maxLength={1000}
								rows={3}
								value={correctionReason}
								disabled={correctionSaving}
								onChange={(event) => {
									setCorrectionReason(event.target.value);
									if (correctionError) {
										setCorrectionError(null);
									}
								}}
								placeholder="Describe brevemente el motivo del cambio (máx. 1000 caracteres)"
								className="w-full rounded-xl border border-border bg-surface p-2.5 text-sm text-foreground outline-none transition focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
							/>
							<span className="block text-right text-xs text-muted">
								{correctionReason.trim().length}/1000
							</span>
						</label>

						<div className="flex flex-wrap justify-end gap-2">
							<button
								type="button"
								disabled={correctionSaving}
								onClick={cancelCorrection}
								className="min-h-10 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
							>
								Cancelar
							</button>
							{correctionError && !correctionSaving && (
								<button
									type="button"
									onClick={() =>
										closeCorrection(correction.key)
									}
									className="min-h-10 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-muted transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
								>
									Volver a la celda
								</button>
							)}
							<button
								type="submit"
								disabled={correctionSaving}
								className="min-h-10 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
							>
								{correctionSaving
									? "Guardando corrección…"
									: "Confirmar corrección"}
							</button>
						</div>
					</form>
				)}
			</dialog>

			<section
				aria-label="Resumen y filtros de calificaciones"
				className="glass flex flex-col gap-4 rounded-3xl border border-white/25 p-4 sm:p-5"
			>
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="space-y-1">
						<p className="text-sm font-semibold text-foreground">
							{selectedEvaluation
								? `Progreso en ${selectedEvaluation.name}: `
								: "Progreso del curso: "}
							<span>
								{progress.gradedCells} calificados ·{" "}
								{progress.pendingCells} pendientes
							</span>
							{progress.undatedCells > 0 && (
								<span className="text-muted">
									{" "}
									({progress.undatedCells} sin fecha)
								</span>
							)}
							{progress.legacyCells > 0 && (
								<span className="text-muted">
									{" "}
									({progress.legacyCells} bloqueadas)
								</span>
							)}
						</p>
						<p className="text-xs text-muted">
							Las notas confirmadas quedan visibles de inmediato
							para sus participantes históricos. Celda vacía indica
							pendiente (≠ 0).
						</p>
					</div>

					<button
						type="button"
						onClick={exportToExcel}
						title="Exporta la matriz actual de notas por grupo en formato Excel (.xlsx)"
						className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
					>
						<svg
							aria-hidden="true"
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
						Exportar matriz por grupo (.xlsx)
					</button>
				</div>

				{evaluations.length > 0 && (
					<div
						className="flex flex-wrap items-center gap-2"
						role="group"
						aria-label="Filtrar por evaluación"
					>
						<button
							type="button"
							aria-pressed={selectedEvaluation === null}
							onClick={() => setSelectedEvaluationId(null)}
							className={`min-h-9 rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
								selectedEvaluation === null
									? "border-accent bg-accent-soft text-accent-strong"
									: "border-border bg-surface text-muted hover:text-foreground"
							}`}
						>
							Todas ({evaluations.length})
						</button>
						{evaluations.map((ev) => {
							const active = selectedEvaluation?.id === ev.id;
							return (
								<button
									key={ev.id}
									type="button"
									aria-pressed={active}
									onClick={() =>
										setSelectedEvaluationId(
											active ? null : ev.id,
										)
									}
									className={`min-h-9 rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
										active
											? "border-accent bg-accent-soft text-accent-strong"
											: "border-border bg-surface text-muted hover:text-foreground"
									}`}
								>
									{ev.name}
								</button>
							);
						})}
					</div>
				)}

				{announcement && (
					<p
						role="status"
						aria-live="polite"
						className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground"
					>
						{announcement}
					</p>
				)}
			</section>

			<div className="glass overflow-x-auto rounded-3xl border border-white/25 shadow-[0_20px_55px_rgb(15_23_42/8%)]">
				<table className="w-full text-left text-sm">
					<thead>
						<tr className="border-b border-border bg-surface-muted/40 text-xs text-muted">
							<th
								scope="col"
								className="min-w-52 px-6 py-4 align-top font-semibold uppercase tracking-wider"
							>
								Grupo / Integrantes actuales
							</th>
							{visibleEvaluations.map((ev) => {
								const formattedDate = formatActivityDateLima(
									ev.performed_at,
								);
								const evProg = progress.byEvaluation[ev.id];
								const evHasUnknown = Boolean(
									participantsByEvaluation[ev.id]?.rows.some(
										(row) =>
											row.membership_state === "unknown",
									),
								);
								return (
									<th
										key={ev.id}
										scope="col"
										className="min-w-56 px-4 py-4 text-left align-top"
									>
										<div className="flex items-center justify-between gap-2">
											<span className="font-semibold uppercase tracking-wider text-foreground">
												{ev.name}
											</span>
											{evProg && (
												<span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-medium text-muted">
													{evProg.graded}/
													{evProg.total}
												</span>
											)}
										</div>
										<div className="mt-1.5 text-[11px] font-normal">
											{formattedDate &&
											ev.performed_at ? (
												<time
													dateTime={ev.performed_at}
													className="text-muted"
												>
													{formattedDate}
												</time>
											) : (
												<span className="inline-block rounded-full border border-border bg-surface px-2 py-0.5 font-medium text-muted">
													Sin fecha de realización
												</span>
											)}
										</div>
										{evHasUnknown && (
											<p className="mt-1.5 text-[11px] font-medium text-danger">
												Padrón con casos desconocidos
											</p>
										)}
									</th>
								);
							})}
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{groups.map((group) => (
							<tr
								key={group.id}
								className="transition hover:bg-surface/40"
							>
								<th
									scope="row"
									className="px-6 py-4 text-left align-top font-normal"
								>
									<div className="font-semibold text-foreground">
										{group.name}
									</div>
									<p className="mt-1 max-w-xs text-xs leading-relaxed text-muted">
										{group.members.length > 0
											? group.members
													.map(
														(m) =>
															m.full_name ||
															m.email,
													)
													.join(", ")
											: "Sin integrantes activos"}
									</p>
								</th>
								{visibleEvaluations.map((ev) => {
									const key = `${group.id}-${ev.id}`;
									const serverGrade = group.grades[ev.id];
									const current = latestGrade(
										serverGrade,
										savedGrades[key],
									);
									const snapshot =
										resolveEvaluationGroupSnapshot(
											participantsByEvaluation[ev.id],
											group.id,
											studentNames,
										);
									const cellState = classifyGradeCellState({
										evaluation: ev,
										gradeRecord: current,
										snapshot,
									});

									const legacy = cellState.kind === "legacy";
									const isSaving = status[key] === "saving";
									const isSaved =
										status[key] === "saved" &&
										!(key in edits) &&
										!errors[key];
									const isDirty = key in edits;
									const displayValue =
										edits[key] ??
										formatGradeForDisplay(current?.grade);

									const badgeId = `grade-badge-${key}`;
									const errorId = `grade-error-${key}`;
									const noticeId = `grade-notice-${key}`;
									const describedBy = [
										badgeId,
										errors[key] ? errorId : null,
										notices[key] ? noticeId : null,
									]
										.filter(Boolean)
										.join(" ");

									const confirmedParticipants =
										current && current.revision > 0
											? (serverGrade?.participants ??
												current.participants ??
												snapshot.names)
											: null;

									return (
										<td
											key={ev.id}
											className="px-4 py-4 align-top"
										>
											<div className="space-y-2">
												<div className="flex flex-wrap items-center gap-2">
													<input
														ref={(node) => {
															inputRefs.current[
																key
															] = node;
														}}
														type="text"
														inputMode="decimal"
														aria-label={`${group.name}, ${ev.name}`}
														aria-describedby={
															describedBy
														}
														aria-invalid={Boolean(
															errors[key],
														)}
														readOnly={
															legacy || isSaving
														}
														value={displayValue}
														placeholder="—"
														onChange={(event) => {
															const value =
																event.target
																	.value;
															setEdits(
																(previous) => ({
																	...previous,
																	[key]: value,
																}),
															);
															setErrors(
																(previous) => {
																	if (
																		!previous[
																			key
																		]
																	) {
																		return previous;
																	}
																	const next =
																		{
																			...previous,
																		};
																	delete next[
																		key
																	];
																	return next;
																},
															);
															setNotices(
																(previous) => {
																	if (
																		!previous[
																			key
																		]
																	) {
																		return previous;
																	}
																	const next =
																		{
																			...previous,
																		};
																	delete next[
																		key
																	];
																	return next;
																},
															);
															if (
																status[key] ===
																"saved"
															) {
																setStatus(
																	(
																		previous,
																	) => {
																		const next =
																			{
																				...previous,
																			};
																		delete next[
																			key
																		];
																		return next;
																	},
																);
															}
														}}
														onKeyDown={(event) => {
															if (
																event.key ===
																"Enter"
															) {
																event.preventDefault();
																void submitCell(
																	group,
																	ev,
																	current,
																	snapshot.names,
																);
															} else if (
																event.key ===
																"Escape"
															) {
																event.preventDefault();
																discardEdit(
																	key,
																);
															}
														}}
														onBlur={() =>
															handleBlur(
																group,
																ev,
																current,
																snapshot.names,
															)
														}
														className={`min-h-10 w-24 rounded-xl border px-3 py-1.5 text-center font-medium outline-none transition focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent ${
															errors[key]
																? "border-danger bg-surface text-foreground"
																: legacy ||
																	  isSaving
																	? "cursor-not-allowed border-border bg-surface-muted/70 text-muted"
																	: "border-border bg-surface text-foreground"
														}`}
													/>

													<span
														id={badgeId}
														className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${
															cellState.kind ===
																"legacy" ||
															cellState.kind ===
																"unknown-history"
																? "border-danger/30 bg-danger-soft/70 text-danger"
																: cellState.kind ===
																			"saved" ||
																	  cellState.kind ===
																			"corrected"
																	? "border-border bg-surface text-foreground"
																	: "border-border bg-surface-muted/60 text-muted"
														}`}
													>
														{cellState.label}
													</span>
												</div>

												{isSaving && (
													<p
														role="status"
														aria-live="polite"
														className="text-xs font-medium text-accent"
													>
														Guardando…
													</p>
												)}

												{isSaved && !isSaving && (
													<p className="text-xs text-muted">
														Guardada y visible
													</p>
												)}

												{!ev.performed_at &&
													!errors[key] &&
													!current && (
														<p className="text-xs text-muted">
															Registra la fecha de
															la actividad antes de
															calificar.
														</p>
													)}

												{notices[key] && (
													<p
														id={noticeId}
														role="status"
														className="text-xs text-muted"
													>
														{notices[key]}
													</p>
												)}

												{errors[key] && (
													<div className="space-y-1.5">
														<p
															id={errorId}
															role="alert"
															className="text-xs font-medium text-danger"
														>
															{errors[key]}
															{current?.grade !=
																null && (
																<>
																	{" "}
																	Nota
																	confirmada
																	vigente:{" "}
																	{
																		current.grade
																	}
																	.
																</>
															)}
														</p>
														<div className="flex flex-wrap gap-2">
															<button
																type="button"
																disabled={
																	isSaving
																}
																onMouseDown={(
																	event,
																) =>
																	event.preventDefault()
																}
																onClick={() =>
																	void submitCell(
																		group,
																		ev,
																		current,
																		snapshot.names,
																	)
																}
																className="min-h-8 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
															>
																Reintentar
															</button>
															<button
																type="button"
																disabled={
																	isSaving
																}
																onMouseDown={(
																	event,
																) =>
																	event.preventDefault()
																}
																onClick={() =>
																	discardEdit(
																		key,
																	)
																}
																className="min-h-8 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
															>
																Descartar
															</button>
														</div>
													</div>
												)}

												{isDirty &&
													!errors[key] &&
													!isSaving && (
														<div className="flex flex-wrap gap-2">
															<button
																type="button"
																onMouseDown={(
																	event,
																) =>
																	event.preventDefault()
																}
																onClick={() =>
																	void submitCell(
																		group,
																		ev,
																		current,
																		snapshot.names,
																	)
																}
																className="min-h-8 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
															>
																Guardar
															</button>
															<button
																type="button"
																onMouseDown={(
																	event,
																) =>
																	event.preventDefault()
																}
																onClick={() =>
																	discardEdit(
																		key,
																	)
																}
																className="min-h-8 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
															>
																Descartar
															</button>
														</div>
													)}

												{confirmedParticipants !==
												null ? (
													<details className="text-xs text-muted">
														<summary className="cursor-pointer font-medium text-foreground/80">
															Destinatarios
															históricos (
															{
																confirmedParticipants.length
															}
															)
														</summary>
														<p className="mt-1 leading-relaxed">
															{confirmedParticipants.length >
															0
																? confirmedParticipants.join(
																		", ",
																	)
																: "Sin destinatarios registrados."}
														</p>
													</details>
												) : (
													ev.performed_at &&
													!legacy && (
														<details className="text-xs text-muted">
															<summary className="cursor-pointer">
																Destinatarios
																previstos (
																{
																	snapshot
																		.names
																		.length
																}
																)
															</summary>
															<p className="mt-1 leading-relaxed">
																{snapshot.error
																	? "No se pudo consultar la participación histórica."
																	: snapshot
																				.names
																				.length >
																		  0
																		? snapshot.names.join(
																				", ",
																			)
																		: "Sin integrantes registrados en esa fecha."}
															</p>
														</details>
													)
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
