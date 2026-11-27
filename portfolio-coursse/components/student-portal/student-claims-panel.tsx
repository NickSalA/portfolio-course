"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
	submitGroupGradeClaimAction,
	submitPointTransactionClaimAction,
} from "@/app/student/claims/actions";
import {
	describeClaimTarget,
	filterStudentClaims,
	findGroupGradeClaim,
	findPointTransactionClaim,
	formatClaimAuthorLabel,
	formatClaimDateTimeLima,
	formatClaimScopeLabel,
	getClaimStatusLabel,
	getClaimTypeLabel,
	summarizeStudentClaims,
	type StudentClaimStatusFilter,
	type StudentClaimTarget,
} from "@/lib/claims/student-claims";
import {
	CLAIM_REASON_MAX_LENGTH,
	validateClaimReason,
} from "@/lib/claims/validation";
import type { StudentEnrollmentSummary } from "@/lib/student/get-dashboard";

function formatLimaDateTime(value: string) {
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return value;
	}
	return new Intl.DateTimeFormat("es-PE", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: "America/Lima",
	}).format(parsed);
}

function formatGroupGrade(grade: number | null) {
	return grade === null ? "Pendiente" : String(grade);
}

export function StudentCourseAcademicRecords({
	enrollment,
}: {
	enrollment: StudentEnrollmentSummary;
}) {
	const [activeTarget, setActiveTarget] = useState<StudentClaimTarget | null>(
		null,
	);
	const [reason, setReason] = useState("");
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [feedback, setFeedback] = useState<string | null>(null);
	const [statusFilter, setStatusFilter] =
		useState<StudentClaimStatusFilter>("all");

	const dialogRef = useRef<HTMLDialogElement>(null);
	const reasonRef = useRef<HTMLTextAreaElement>(null);
	const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
	const inFlightRef = useRef(false);
	const router = useRouter();
	const [isRefreshing, startTransition] = useTransition();

	const gradesHeadingId = useId();
	const pointsHeadingId = useId();
	const claimsHeadingId = useId();
	const dialogTitleId = useId();
	const dialogDescId = useId();

	const courseName = enrollment.courseName ?? "Curso";

	useEffect(() => {
		if (activeTarget && dialogRef.current && !dialogRef.current.open) {
			dialogRef.current.showModal();
			reasonRef.current?.focus();
		}
	}, [activeTarget]);

	function openDialog(
		target: StudentClaimTarget,
		trigger: HTMLButtonElement,
	) {
		triggerButtonRef.current = trigger;
		setActiveTarget(target);
		setReason("");
		setSubmitError(null);
	}

	function closeDialog() {
		dialogRef.current?.close();
		setActiveTarget(null);
		setReason("");
		setSubmitError(null);
		setIsSubmitting(false);
		triggerButtonRef.current?.focus();
	}

	async function handleSubmit() {
		if (!activeTarget || inFlightRef.current) return;

		const validation = validateClaimReason(reason);
		if (!validation.ok) {
			setSubmitError(validation.error);
			reasonRef.current?.focus();
			return;
		}

		inFlightRef.current = true;
		setIsSubmitting(true);
		setSubmitError(null);

		const formData = new FormData();
		formData.set("reason", validation.value);

		try {
			const result =
				activeTarget.claimType === "group_grade"
					? await (() => {
							formData.set(
								"group_public_id",
								activeTarget.groupPublicId,
							);
							formData.set(
								"evaluation_public_id",
								activeTarget.evaluationPublicId,
							);
							return submitGroupGradeClaimAction(formData);
						})()
					: await (() => {
							formData.set(
								"point_transaction_id",
								String(activeTarget.pointTransactionId),
							);
							return submitPointTransactionClaimAction(formData);
						})();

			if (!result.ok) {
				setSubmitError(result.error);
				if (result.code === "conflict") {
					startTransition(() => {
						router.refresh();
					});
				}
				return;
			}

			closeDialog();
			setFeedback(
				result.created
					? "Reclamo registrado en estado Pendiente. Tus notas y puntos no fueron modificados."
					: "Tu reclamo equivalente ya figuraba registrado en estado Pendiente.",
			);
			startTransition(() => {
				router.refresh();
			});
		} catch {
			setSubmitError(
				"No se pudo conectar con el servidor para enviar el reclamo. Tu texto se conserva para que puedas reintentar.",
			);
		} finally {
			inFlightRef.current = false;
			setIsSubmitting(false);
		}
	}

	const summary = summarizeStudentClaims(enrollment.claims);
	const visibleClaims = filterStudentClaims(enrollment.claims, statusFilter);
	const targetDescription = activeTarget
		? describeClaimTarget(activeTarget)
		: null;

	return (
		<>
			<dialog
				ref={dialogRef}
				aria-labelledby={dialogTitleId}
				aria-describedby={dialogDescId}
				className="m-auto w-full max-w-lg rounded-2xl border border-border bg-surface p-6 text-foreground shadow-2xl backdrop:bg-black/50"
				onCancel={(event) => {
					event.preventDefault();
					if (!isSubmitting) {
						closeDialog();
					}
				}}
			>
				{activeTarget && targetDescription && (
					<form
						noValidate
						className="space-y-4"
						onSubmit={(event) => {
							event.preventDefault();
							void handleSubmit();
						}}
					>
						<h2 id={dialogTitleId} className="text-lg font-semibold">
							Presentar reclamo
						</h2>
						<div
							id={dialogDescId}
							className="space-y-1.5 rounded-xl border border-border bg-surface-muted/50 p-3.5 text-sm"
						>
							<p className="font-semibold text-foreground">
								{targetDescription.title}
							</p>
							<p className="text-xs leading-5 text-muted">
								{targetDescription.subtitle}
							</p>
							<p className="text-xs leading-5 text-muted">
								{targetDescription.scopeNotice}
							</p>
						</div>

						{submitError && (
							<p
								role="alert"
								className="rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-xs font-medium text-danger"
							>
								{submitError}
							</p>
						)}

						<label className="block space-y-1.5 text-sm">
							<span className="font-medium text-foreground">
								Motivo del reclamo
							</span>
							<textarea
								ref={reasonRef}
								name="reason"
								rows={4}
								value={reason}
								disabled={isSubmitting}
								onChange={(event) => {
									setReason(event.target.value);
									if (submitError) {
										setSubmitError(null);
									}
								}}
								placeholder="Explica de forma clara qué aspecto solicitas revisar (máx. 2000 caracteres)"
								className="w-full rounded-xl border border-border bg-surface p-2.5 text-sm text-foreground outline-none transition focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
							/>
							<span className="block text-right text-xs text-muted">
								{reason.trim().length}/{CLAIM_REASON_MAX_LENGTH}
							</span>
						</label>

						<div className="flex flex-wrap justify-end gap-2">
							<button
								type="button"
								disabled={isSubmitting}
								onClick={closeDialog}
								className="min-h-10 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
							>
								Cancelar
							</button>
							<button
								type="submit"
								disabled={isSubmitting}
								aria-busy={isSubmitting}
								className="min-h-10 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
							>
								{isSubmitting
									? "Enviando reclamo…"
									: "Enviar reclamo"}
							</button>
						</div>
					</form>
				)}
			</dialog>

			<section
				aria-labelledby={gradesHeadingId}
				className="mt-5 border-t border-border pt-4"
			>
				<h3 id={gradesHeadingId} className="text-sm font-semibold">
					Notas grupales
				</h3>
				<p className="mt-1 text-xs text-muted">
					Resultados registrados por actividad según el grupo con el
					que participaste.
				</p>
				{enrollment.gradesError ? (
					<p
						role="alert"
						className="mt-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
					>
						No pudimos cargar tus notas grupales en este momento.
					</p>
				) : enrollment.grades.length ? (
					<ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-muted/45">
						{enrollment.grades.map((item) => {
							const isPending = item.grade === null;
							const hasDifferentHistoricalGroup =
								enrollment.groupName !== null &&
								item.groupName !== enrollment.groupName;
							const existingClaim = findGroupGradeClaim(
								enrollment.claims,
								{
									groupPublicId: item.groupPublicId,
									evaluationPublicId: item.evaluationPublicId,
								},
							);

							return (
								<li
									key={item.evaluationPublicId}
									className="space-y-2.5 px-4 py-3"
								>
									<div className="flex items-start justify-between gap-4">
										<div className="min-w-0">
											<p className="text-sm font-medium">
												{item.evaluationName}
											</p>
											<p className="mt-1 text-xs text-muted">
												Realizada:{" "}
												{formatLimaDateTime(
													item.performedAt,
												)}
											</p>
											<p className="mt-1 text-xs text-muted">
												Grupo de la actividad:{" "}
												<span className="font-medium text-foreground">
													{item.groupName}
												</span>
												{hasDifferentHistoricalGroup && (
													<span className="ml-2 inline-block rounded-full border border-accent/30 bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
														Grupo histórico (actual:{" "}
														{enrollment.groupName})
													</span>
												)}
											</p>
										</div>
										<div className="shrink-0 text-right">
											{isPending ? (
												<span className="inline-block rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted">
													Pendiente
												</span>
											) : (
												<p className="text-base font-semibold tabular-nums">
													{formatGroupGrade(
														item.grade,
													)}
												</p>
											)}
										</div>
									</div>

									{!enrollment.claimsError && (
										<div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
											{existingClaim ? (
												<a
													href={`#claim-${existingClaim.claimPublicId}`}
													className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
												>
													Reclamo:{" "}
													{getClaimStatusLabel(
														existingClaim.status,
													)}{" "}
													· por{" "}
													{formatClaimAuthorLabel(
														existingClaim,
													)}
												</a>
											) : (
												<button
													type="button"
													onClick={(event) =>
														openDialog(
															{
																claimType:
																	"group_grade",
																courseName,
																groupPublicId:
																	item.groupPublicId,
																groupName:
																	item.groupName,
																evaluationPublicId:
																	item.evaluationPublicId,
																evaluationName:
																	item.evaluationName,
																performedAt:
																	item.performedAt,
																grade: item.grade,
															},
															event.currentTarget,
														)
													}
													aria-label={`Presentar reclamo sobre ${item.evaluationName} de ${item.groupName} en ${courseName}`}
													className="inline-flex min-h-9 items-center rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
												>
													Presentar reclamo
												</button>
											)}
										</div>
									)}
								</li>
							);
						})}
					</ul>
				) : (
					<p className="mt-3 rounded-xl border border-border bg-surface-muted/45 px-4 py-4 text-sm text-muted">
						Aún no hay evaluaciones con resultados disponibles.
					</p>
				)}
			</section>

			<section
				aria-labelledby={pointsHeadingId}
				className="mt-5 border-t border-border pt-4"
			>
				<h3 id={pointsHeadingId} className="text-sm font-semibold">
					Puntos
				</h3>
				<details className="mt-2">
					<summary className="cursor-pointer text-sm font-medium text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
						Ver historial de puntos (
						{enrollment.transactions.length})
					</summary>
					<div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-muted/45">
						{enrollment.transactions.map((transaction) => {
							const existingClaim = findPointTransactionClaim(
								enrollment.claims,
								transaction.id,
							);
							const pointsText =
								transaction.points > 0
									? `+${transaction.points}`
									: String(transaction.points);

							return (
								<div
									key={transaction.id}
									className="space-y-2.5 px-4 py-3"
								>
									<div className="flex items-start justify-between gap-4">
										<div>
											<p className="text-sm">
												{transaction.reason ||
													"Sin motivo"}
											</p>
											<p className="mt-1 text-xs text-muted">
												{formatLimaDateTime(
													transaction.created_at,
												)}
											</p>
										</div>
										<p
											className={
												transaction.points > 0
													? "font-semibold tabular-nums text-accent"
													: "font-semibold tabular-nums text-danger"
											}
										>
											{pointsText}
										</p>
									</div>

									{!enrollment.claimsError && (
										<div className="flex flex-wrap items-center gap-2">
											{existingClaim ? (
												<a
													href={`#claim-${existingClaim.claimPublicId}`}
													className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
												>
													Reclamo:{" "}
													{getClaimStatusLabel(
														existingClaim.status,
													)}
												</a>
											) : (
												<button
													type="button"
													onClick={(event) =>
														openDialog(
															{
																claimType:
																	"point_transaction",
																courseName,
																pointTransactionId:
																	transaction.id,
																points: transaction.points,
																reason: transaction.reason,
																createdAt:
																	transaction.created_at,
															},
															event.currentTarget,
														)
													}
													aria-label={`Presentar reclamo sobre movimiento de ${pointsText} puntos en ${courseName}`}
													className="inline-flex min-h-9 items-center rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
												>
													Presentar reclamo
												</button>
											)}
										</div>
									)}
								</div>
							);
						})}
						{!enrollment.transactions.length && (
							<p className="px-4 py-5 text-sm text-muted">
								Aún no hay movimientos registrados.
							</p>
						)}
					</div>
				</details>
			</section>

			<section
				aria-labelledby={claimsHeadingId}
				className="mt-5 border-t border-border pt-4"
			>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<h3 id={claimsHeadingId} className="text-sm font-semibold">
						Reclamos
					</h3>
					{!enrollment.claimsError && (
						<span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-[11px] font-medium text-muted">
							{summary.total} registrados
						</span>
					)}
				</div>
				<p className="mt-1 text-xs text-muted">
					Seguimiento de reclamos grupales históricos y privados de
					puntos. Un reclamo respondido es definitivo.
				</p>

				{feedback && (
					<p
						role="status"
						aria-live="polite"
						className="mt-3 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm font-medium text-accent-strong"
					>
						{feedback}
					</p>
				)}

				{enrollment.claimsError ? (
					<div
						role="alert"
						className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
					>
						<p>
							No pudimos cargar tus reclamos en este momento.
						</p>
						<button
							type="button"
							disabled={isRefreshing}
							onClick={() =>
								startTransition(() => {
									router.refresh();
								})
							}
							className="min-h-10 rounded-xl border border-danger/40 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
						>
							{isRefreshing ? "Reintentando…" : "Reintentar"}
						</button>
					</div>
				) : enrollment.claims.length === 0 ? (
					<p className="mt-3 rounded-xl border border-border bg-surface-muted/45 px-4 py-4 text-sm text-muted">
						Aún no hay reclamos registrados en este curso.
					</p>
				) : (
					<div className="mt-3 space-y-3">
						<div
							role="group"
							aria-label={`Filtrar reclamos en ${courseName}`}
							className="flex flex-wrap gap-1.5"
						>
							{(
								[
									{
										id: "all",
										label: `Todos (${summary.total})`,
									},
									{
										id: "pending",
										label: `Pendiente (${summary.pending})`,
									},
									{
										id: "in_review",
										label: `En revisión (${summary.inReview})`,
									},
									{
										id: "responded",
										label: `Respondido (${summary.responded})`,
									},
								] as const
							).map((filterOption) => {
								const active =
									statusFilter === filterOption.id;
								return (
									<button
										key={filterOption.id}
										type="button"
										aria-pressed={active}
										onClick={() =>
											setStatusFilter(filterOption.id)
										}
										className={`min-h-9 rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
											active
												? "border-accent bg-accent-soft text-accent-strong"
												: "border-border bg-surface text-muted hover:text-foreground"
										}`}
									>
										{filterOption.label}
									</button>
								);
							})}
						</div>

						{visibleClaims.length === 0 ? (
							<p className="rounded-xl border border-border bg-surface-muted/45 px-4 py-4 text-sm text-muted">
								No hay reclamos en estado{" "}
								{statusFilter !== "all"
									? getClaimStatusLabel(statusFilter)
									: ""}
								.
							</p>
						) : (
							<ul className="space-y-3">
								{visibleClaims.map((claim) => {
									const matchedTransaction =
										claim.pointTransactionId !== null
											? enrollment.transactions.find(
													(tx) =>
														tx.id ===
														claim.pointTransactionId,
												)
											: undefined;
									const targetLabel =
										claim.claimType === "group_grade"
											? `${claim.evaluationName ?? "Evaluación"} · ${claim.groupName ?? "Grupo"}`
											: matchedTransaction
												? `Movimiento ${matchedTransaction.points > 0 ? `+${matchedTransaction.points}` : matchedTransaction.points} (${matchedTransaction.reason || "Sin motivo"})`
												: `Movimiento #${claim.pointTransactionId ?? ""}`;
									const createdLima =
										formatClaimDateTimeLima(
											claim.createdAt,
										) ?? claim.createdAt;
									const inReviewLima =
										formatClaimDateTimeLima(
											claim.inReviewAt,
										);
									const respondedLima =
										formatClaimDateTimeLima(
											claim.respondedAt,
										);

									return (
										<li
											key={claim.claimPublicId}
											id={`claim-${claim.claimPublicId}`}
											className="space-y-2 rounded-xl border border-border bg-surface-muted/45 p-4 text-sm"
										>
											<div className="flex flex-wrap items-center justify-between gap-2">
												<div className="flex flex-wrap items-center gap-1.5">
													<span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-[11px] font-medium text-foreground">
														{getClaimTypeLabel(
															claim.claimType,
														)}
													</span>
													<span
														className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
															claim.status ===
															"responded"
																? "border-accent/30 bg-accent-soft text-accent-strong"
																: "border-border bg-surface text-muted"
														}`}
													>
														{getClaimStatusLabel(
															claim.status,
														)}
													</span>
												</div>
												<span className="text-[11px] text-muted">
													{formatClaimScopeLabel(
														claim.claimType,
													)}
												</span>
											</div>

											<p className="font-semibold text-foreground">
												{targetLabel}
											</p>

											<p className="text-xs text-muted">
												Presentado por:{" "}
												<strong className="text-foreground">
													{formatClaimAuthorLabel(
														claim,
													)}
												</strong>{" "}
												· Registrado: {createdLima}
												{inReviewLima &&
													` · En revisión: ${inReviewLima}`}
											</p>

											<div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs leading-relaxed text-foreground">
												<p className="font-medium text-muted">
													Motivo registrado:
												</p>
												<p className="mt-1 whitespace-pre-wrap break-words">
													{claim.reason}
												</p>
											</div>

											{claim.status === "responded" &&
												claim.teacherResponse && (
													<div className="rounded-lg border border-accent/30 bg-accent-soft/45 px-3 py-2.5 text-xs leading-relaxed">
														<div className="flex flex-wrap items-center justify-between gap-2">
															<p className="font-semibold text-accent-strong">
																Respuesta final
																del docente
															</p>
															{respondedLima && (
																<span className="text-[11px] text-muted">
																	{
																		respondedLima
																	}
																</span>
															)}
														</div>
														<p className="mt-1 whitespace-pre-wrap break-words text-foreground">
															{
																claim.teacherResponse
															}
														</p>
														<p className="mt-1.5 text-[11px] text-muted">
															Caso cerrado de
															forma definitiva
															(solo lectura, sin
															réplica ni
															reapertura).
														</p>
													</div>
												)}
										</li>
									);
								})}
							</ul>
						)}
					</div>
				)}
			</section>
		</>
	);
}
