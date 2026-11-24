"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
	respondToClaimAction,
	retryClaimNoticeAction,
	startClaimReviewAction,
} from "@/app/teacher/claims/actions";
import {
	buildAcademicCorrectionHref,
	CLAIM_STATUS_LABELS,
	CLAIM_TYPE_LABELS,
	filterTeacherClaims,
	NOTIFICATION_STATUS_LABELS,
	resolveSelectedClaim,
	summarizeTeacherClaims,
	type ClaimStatusFilter,
	type ClaimTypeFilter,
} from "@/lib/claims/inbox-helpers";
import type {
	TeacherClaimItem,
	TeacherClaimNotificationSummary,
} from "@/lib/claims/teacher-claims";
import { CLAIM_RESPONSE_MAX_LENGTH } from "@/lib/claims/validation";
import { formatActivityDateLima } from "@/lib/teacher/grade-matrix";

function statusBadgeClass(status: TeacherClaimItem["status"]): string {
	if (status === "pending") {
		return "border-border bg-surface text-foreground";
	}
	if (status === "in_review") {
		return "border-accent/40 bg-accent-soft text-accent";
	}
	return "border-border bg-surface-muted/70 text-muted";
}

function formatPointsSigned(amount: number | null): string {
	if (amount === null) return "—";
	return amount > 0 ? `+${amount}` : String(amount);
}

export function TeacherClaimsInbox({
	claims,
	notifications,
	initialClaimPublicId = null,
	periodPublicId = null,
}: {
	claims: TeacherClaimItem[];
	notifications: Record<string, TeacherClaimNotificationSummary>;
	initialClaimPublicId?: string | null;
	periodPublicId?: string | null;
}) {
	const router = useRouter();
	const [, startRefreshTransition] = useTransition();

	const [statusFilter, setStatusFilter] = useState<ClaimStatusFilter>("all");
	const [typeFilter, setTypeFilter] = useState<ClaimTypeFilter>("all");
	const [selectedId, setSelectedId] = useState<string | null>(
		initialClaimPublicId,
	);
	const [responseDrafts, setResponseDrafts] = useState<Record<string, string>>(
		{},
	);
	const [busyAction, setBusyAction] = useState<
		"review" | "respond" | "retry-mail" | null
	>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [statusMessage, setStatusMessage] = useState<string | null>(null);

	const summary = summarizeTeacherClaims(claims);
	const filteredClaims = filterTeacherClaims(claims, {
		statusFilter,
		typeFilter,
	});
	const selectedClaim = resolveSelectedClaim(filteredClaims, selectedId);
	const selectedNotification = selectedClaim
		? notifications[selectedClaim.claimPublicId] ?? null
		: null;
	const currentDraft = selectedClaim
		? (responseDrafts[selectedClaim.claimPublicId] ?? "")
		: "";

	async function handleStartReview(claimPublicId: string) {
		if (busyAction) return;
		setBusyAction("review");
		setErrorMessage(null);
		setStatusMessage(null);

		try {
			const formData = new FormData();
			formData.set("claim_public_id", claimPublicId);
			const result = await startClaimReviewAction(formData);
			if (!result.ok) {
				setErrorMessage(result.error);
				return;
			}
			setStatusMessage(
				result.transitioned
					? "Reclamo pasado a «En revisión». Ya puedes registrar una respuesta motivada."
					: "Este reclamo ya se encontraba «En revisión».",
			);
			startRefreshTransition(() => {
				router.refresh();
			});
		} catch {
			setErrorMessage(
				"No se pudo conectar con el servidor para iniciar la revisión. Inténtalo nuevamente.",
			);
		} finally {
			setBusyAction(null);
		}
	}

	async function handleRespond(claimPublicId: string) {
		if (busyAction) return;
		const draft = (responseDrafts[claimPublicId] ?? "").trim();
		if (!draft) {
			setErrorMessage(
				"Ingresa una respuesta motivada antes de cerrar el reclamo.",
			);
			return;
		}

		setBusyAction("respond");
		setErrorMessage(null);
		setStatusMessage(null);

		try {
			const formData = new FormData();
			formData.set("claim_public_id", claimPublicId);
			formData.set("teacher_response", draft);
			const result = await respondToClaimAction(formData);
			if (!result.ok) {
				setErrorMessage(result.error);
				return;
			}
			setResponseDrafts((prev) => {
				const next = { ...prev };
				delete next[claimPublicId];
				return next;
			});
			setStatusMessage(
				"Respuesta final registrada. Si corresponde ajustar notas o puntos, hazlo por separado en el módulo académico.",
			);
			startRefreshTransition(() => {
				router.refresh();
			});
		} catch {
			setErrorMessage(
				"No se pudo conectar con el servidor. Tu borrador de respuesta se conserva para reintentar.",
			);
		} finally {
			setBusyAction(null);
		}
	}

	async function handleRetryNotice(claimPublicId: string) {
		if (busyAction) return;
		setBusyAction("retry-mail");
		setErrorMessage(null);
		setStatusMessage(null);

		try {
			const formData = new FormData();
			formData.set("claim_public_id", claimPublicId);
			const result = await retryClaimNoticeAction(formData);
			if (!result.ok) {
				setErrorMessage(result.error);
				return;
			}
			setStatusMessage(result.message);
			startRefreshTransition(() => {
				router.refresh();
			});
		} catch {
			setErrorMessage(
				"No se pudo conectar con el servidor para reintentar el aviso por correo.",
			);
		} finally {
			setBusyAction(null);
		}
	}

	return (
		<div className="space-y-5">
			<section
				aria-label="Resumen y filtros de reclamos"
				className="glass flex flex-col gap-4 rounded-3xl border border-white/25 p-4 sm:p-5"
			>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<p className="text-sm font-semibold text-foreground">
						Bandeja docente:{" "}
						<span>
							{summary.pending} pendientes · {summary.inReview} en
							revisión · {summary.responded} respondidos
						</span>
					</p>
					<p className="text-xs text-muted">
						Responder un reclamo es definitivo y no modifica notas ni
						puntos automáticamente.
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<div
						className="flex flex-wrap items-center gap-1.5"
						role="group"
						aria-label="Filtrar por estado"
					>
						{(
							[
								["all", `Todos (${summary.total})`],
								["pending", `Pendientes (${summary.pending})`],
								["in_review", `En revisión (${summary.inReview})`],
								["responded", `Respondidos (${summary.responded})`],
							] as const
						).map(([value, label]) => (
							<button
								key={value}
								type="button"
								aria-pressed={statusFilter === value}
								onClick={() => setStatusFilter(value)}
								className={`min-h-9 rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
									statusFilter === value
										? "border-accent bg-accent-soft text-accent"
										: "border-border bg-surface text-muted hover:text-foreground"
								}`}
							>
								{label}
							</button>
						))}
					</div>

					<div
						className="flex flex-wrap items-center gap-1.5"
						role="group"
						aria-label="Filtrar por tipo"
					>
						{(
							[
								["all", "Ambos tipos"],
								["group_grade", `Nota grupal (${summary.groupCount})`],
								[
									"point_transaction",
									`Puntos (${summary.pointCount})`,
								],
							] as const
						).map(([value, label]) => (
							<button
								key={value}
								type="button"
								aria-pressed={typeFilter === value}
								onClick={() => setTypeFilter(value)}
								className={`min-h-9 rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
									typeFilter === value
										? "border-accent bg-accent-soft text-accent"
										: "border-border bg-surface text-muted hover:text-foreground"
								}`}
							>
								{label}
							</button>
						))}
					</div>
				</div>

				{errorMessage && (
					<p
						role="alert"
						className="rounded-xl border border-danger/30 bg-danger-soft/70 px-3.5 py-2.5 text-xs font-medium text-danger"
					>
						{errorMessage}
					</p>
				)}

				{statusMessage && (
					<p
						role="status"
						aria-live="polite"
						className="rounded-xl border border-accent/30 bg-accent-soft px-3.5 py-2.5 text-xs font-medium text-accent"
					>
						{statusMessage}
					</p>
				)}
			</section>

			{filteredClaims.length === 0 ? (
				<div className="glass rounded-3xl border border-white/20 p-8 text-center text-sm text-muted">
					{claims.length === 0
						? "No hay reclamos registrados en los cursos seleccionados."
						: "No hay reclamos que coincidan con los filtros activos."}
				</div>
			) : (
				<div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)] lg:items-start">
					<section
						aria-label="Lista de reclamos"
						className="space-y-2.5"
					>
						{filteredClaims.map((claim) => {
							const isSelected =
								selectedClaim?.claimPublicId ===
								claim.claimPublicId;
							const notif = notifications[claim.claimPublicId];
							const createdLabel = formatActivityDateLima(
								claim.createdAt,
							);
							const targetLabel =
								claim.claimType === "group_grade"
									? `${claim.groupName || "Grupo"} · ${claim.evaluationName || "Evaluación"}`
									: `Movimiento #${claim.pointTransactionId ?? "—"} (${formatPointsSigned(claim.pointAmount)} pts)`;

							return (
								<button
									key={claim.claimPublicId}
									type="button"
									onClick={() => {
										setSelectedId(claim.claimPublicId);
										setErrorMessage(null);
										setStatusMessage(null);
									}}
									aria-current={isSelected ? "true" : undefined}
									className={`w-full rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
										isSelected
											? "border-accent bg-surface shadow-md"
											: "glass border-white/25 hover:border-accent/60"
									}`}
								>
									<div className="flex flex-wrap items-center justify-between gap-2">
										<span className="text-xs font-semibold uppercase tracking-wider text-accent">
											{CLAIM_TYPE_LABELS[claim.claimType]}
										</span>
										<span
											className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusBadgeClass(claim.status)}`}
										>
											{CLAIM_STATUS_LABELS[claim.status]}
										</span>
									</div>
									<p className="mt-1.5 font-semibold text-foreground">
										{claim.courseName}
									</p>
									<p className="mt-0.5 text-xs text-muted">
										{targetLabel}
									</p>
									<div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
										<span>Por: {claim.submittedByName}</span>
										{createdLabel && (
											<time dateTime={claim.createdAt}>
												{createdLabel}
											</time>
										)}
									</div>
									{notif && notif.status === "failed" && (
										<p className="mt-2 text-[11px] font-medium text-danger">
											Aviso por correo fallido (requiere
											reintento opcional)
										</p>
									)}
								</button>
							);
						})}
					</section>

					{selectedClaim && (
						<article
							aria-label="Detalle del reclamo"
							className="glass space-y-5 rounded-3xl border border-white/25 p-5 sm:p-6"
						>
							<header className="space-y-2 border-b border-border pb-4">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<div className="flex flex-wrap items-center gap-2">
										<span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-semibold text-foreground">
											{
												CLAIM_TYPE_LABELS[
													selectedClaim.claimType
												]
											}
										</span>
										<span
											className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(selectedClaim.status)}`}
										>
											{
												CLAIM_STATUS_LABELS[
													selectedClaim.status
												]
											}
										</span>
									</div>
									{selectedClaim.periodCode && (
										<span className="text-xs font-medium text-muted">
											Periodo {selectedClaim.periodCode}
										</span>
									)}
								</div>
								<h2 className="text-xl font-semibold text-foreground">
									{selectedClaim.courseName}
								</h2>
								<p className="text-xs text-muted">
									Presentado por{" "}
									<strong className="text-foreground">
										{selectedClaim.submittedByName}
									</strong>
									{selectedClaim.submittedByEmail
										? ` (${selectedClaim.submittedByEmail})`
										: ""}{" "}
									·{" "}
									{formatActivityDateLima(
										selectedClaim.createdAt,
									) ?? selectedClaim.createdAt}
								</p>
							</header>

							<section className="rounded-2xl border border-border bg-surface-muted/50 p-4 text-sm">
								<h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
									Registro académico histórico asociado
								</h3>
								{selectedClaim.claimType === "group_grade" ? (
									<dl className="mt-2.5 grid gap-2 sm:grid-cols-2">
										<div>
											<dt className="text-xs text-muted">
												Grupo histórico
											</dt>
											<dd className="font-medium text-foreground">
												{selectedClaim.groupName || "—"}
											</dd>
										</div>
										<div>
											<dt className="text-xs text-muted">
												Actividad
											</dt>
											<dd className="font-medium text-foreground">
												{selectedClaim.evaluationName ||
													"—"}
											</dd>
										</div>
										<div>
											<dt className="text-xs text-muted">
												Fecha de realización
											</dt>
											<dd className="font-medium text-foreground">
												{formatActivityDateLima(
													selectedClaim.evaluationPerformedAt,
												) ?? "Sin fecha"}
											</dd>
										</div>
										<div>
											<dt className="text-xs text-muted">
												Nota grupal vigente
											</dt>
											<dd className="font-medium text-foreground">
												{selectedClaim.groupGrade === null
													? "Pendiente"
													: selectedClaim.groupGrade}
											</dd>
										</div>
									</dl>
								) : (
									<dl className="mt-2.5 grid gap-2 sm:grid-cols-2">
										<div>
											<dt className="text-xs text-muted">
												Movimiento
											</dt>
											<dd className="font-medium text-foreground">
												#
												{selectedClaim.pointTransactionId ??
													"—"}
											</dd>
										</div>
										<div>
											<dt className="text-xs text-muted">
												Puntos
											</dt>
											<dd className="font-medium text-foreground">
												{formatPointsSigned(
													selectedClaim.pointAmount,
												)}
												{selectedClaim.pointIsVoided
													? " (Anulado)"
													: ""}
											</dd>
										</div>
										<div className="sm:col-span-2">
											<dt className="text-xs text-muted">
												Motivo original del movimiento
											</dt>
											<dd className="font-medium text-foreground">
												{selectedClaim.pointReason ||
													"Sin motivo registrado"}
											</dd>
										</div>
									</dl>
								)}
							</section>

							<section className="space-y-1.5">
								<h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
									Motivo del reclamo
								</h3>
								<p className="whitespace-pre-wrap rounded-2xl border border-border bg-surface p-4 text-sm leading-relaxed text-foreground">
									{selectedClaim.reason}
								</p>
							</section>

							<section className="rounded-2xl border border-border bg-surface/70 p-4">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<div>
										<h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
											Corrección académica separada
										</h3>
										<p className="mt-1 text-xs text-muted">
											Responder el reclamo nunca modifica
											notas ni puntos automáticamente.
										</p>
									</div>
									<Link
										href={buildAcademicCorrectionHref(
											selectedClaim,
											periodPublicId,
										)}
										className="inline-flex min-h-9 items-center rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
									>
										{selectedClaim.claimType ===
										"group_grade"
											? "Abrir Notas del curso →"
											: "Abrir Puntos del curso →"}
									</Link>
								</div>
							</section>

							{selectedClaim.status === "pending" && (
								<section className="space-y-3 border-t border-border pt-4">
									<p className="text-xs text-muted">
										Paso 1 de 2: pasa este reclamo a «En
										revisión» antes de emitir la respuesta
										final.
									</p>
									<button
										type="button"
										disabled={busyAction !== null}
										onClick={() =>
											handleStartReview(
												selectedClaim.claimPublicId,
											)
										}
										className="inline-flex min-h-10 items-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
									>
										{busyAction === "review"
											? "Pasando a revisión…"
											: "Iniciar revisión"}
									</button>
								</section>
							)}

							{selectedClaim.status === "in_review" && (
								<form
									className="space-y-3 border-t border-border pt-4"
									noValidate
									onSubmit={(event) => {
										event.preventDefault();
										void handleRespond(
											selectedClaim.claimPublicId,
										);
									}}
								>
									<label className="block space-y-1.5 text-sm">
										<span className="font-semibold text-foreground">
											Respuesta final motivada
										</span>
										<textarea
											name="teacher_response"
											required
											maxLength={CLAIM_RESPONSE_MAX_LENGTH}
											rows={4}
											disabled={busyAction !== null}
											value={currentDraft}
											onChange={(event) =>
												setResponseDrafts((prev) => ({
													...prev,
													[selectedClaim.claimPublicId]:
														event.target.value,
												}))
											}
											placeholder="Explica el fundamento de tu decisión final (máx. 2000 caracteres). Esta decisión no se puede reabrir."
											className="w-full rounded-xl border border-border bg-surface p-3 text-sm text-foreground outline-none transition focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
										/>
										<span className="block text-right text-xs text-muted">
											{currentDraft.trim().length}/
											{CLAIM_RESPONSE_MAX_LENGTH}
										</span>
									</label>
									<button
										type="submit"
										disabled={busyAction !== null}
										className="inline-flex min-h-10 items-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
									>
										{busyAction === "respond"
											? "Registrando respuesta final…"
											: "Enviar respuesta final"}
									</button>
								</form>
							)}

							{selectedClaim.status === "responded" && (
								<section className="space-y-2 border-t border-border pt-4">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
											Respuesta final docente (cerrada)
										</h3>
										{selectedClaim.respondedAt && (
											<time
												dateTime={
													selectedClaim.respondedAt
												}
												className="text-xs text-muted"
											>
												{formatActivityDateLima(
													selectedClaim.respondedAt,
												)}
											</time>
										)}
									</div>
									<p className="whitespace-pre-wrap rounded-2xl border border-border bg-surface-muted/50 p-4 text-sm leading-relaxed text-foreground">
										{selectedClaim.teacherResponse}
									</p>
									<p className="text-xs text-muted">
										Este reclamo quedó cerrado de forma
										definitiva y no admite réplicas ni
										reapertura.
									</p>
								</section>
							)}

							{selectedNotification && (
								<section className="border-t border-border pt-4 text-xs">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<div className="space-y-0.5">
											<p className="font-semibold text-foreground">
												Aviso técnico por correo:{" "}
												<span
													className={
														selectedNotification.status ===
														"failed"
															? "text-danger"
															: "text-muted"
													}
												>
													{
														NOTIFICATION_STATUS_LABELS[
															selectedNotification
																.status
														]
													}
												</span>
											</p>
											<p className="text-muted">
												Intentos:{" "}
												{
													selectedNotification.attemptCount
												}
												{selectedNotification.lastErrorCode
													? ` · Código: ${selectedNotification.lastErrorCode}`
													: ""}
												{selectedNotification.status ===
												"sent"
													? " · Aceptación SMTP (no certifica lectura)."
													: ""}
											</p>
										</div>

										{selectedNotification.status !==
											"sent" && (
											<button
												type="button"
												disabled={busyAction !== null}
												onClick={() =>
													handleRetryNotice(
														selectedClaim.claimPublicId,
													)
												}
												className="inline-flex min-h-9 items-center rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
											>
												{busyAction === "retry-mail"
													? "Reintentando aviso…"
													: "Reintentar aviso por correo"}
											</button>
										)}
									</div>
								</section>
							)}
						</article>
					)}
				</div>
			)}
		</div>
	);
}

