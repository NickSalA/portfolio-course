"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { selectStudentGroupAction } from "@/app/student/actions";
import {
	getGroupOptionViewModel,
	type GroupOptionViewModel,
	type StudentGroupOption,
	type StudentWindowState,
} from "@/lib/student/group-selection";

type Props = {
	enrollmentId: number;
	courseName: string;
	currentGroupId: number | null;
	windowState: StudentWindowState;
	groups: StudentGroupOption[];
	loadError: boolean;
};

export function GroupSelectionList({
	enrollmentId,
	courseName,
	currentGroupId,
	windowState,
	groups,
	loadError,
}: Props) {
	const [pendingGroupId, setPendingGroupId] = useState<number | null>(null);
	const [feedback, setFeedback] = useState<{
		kind: "success" | "error";
		message: string;
	} | null>(null);
	const inFlightRef = useRef(false);
	const router = useRouter();
	const [isRefreshing, startTransition] = useTransition();
	const headingId = useId();

	async function handleSelect(
		group: StudentGroupOption,
		option: GroupOptionViewModel,
	) {
		if (inFlightRef.current || !option.canSelect) return;

		inFlightRef.current = true;
		setPendingGroupId(group.id);
		setFeedback(null);

		try {
			const result = await selectStudentGroupAction(enrollmentId, group.id);
			if (!result.ok) {
				setFeedback({ kind: "error", message: result.error });
				startTransition(() => {
					router.refresh();
				});
				return;
			}

			const verb =
				currentGroupId !== null ? "Te cambiaste a" : "Elegiste";
			setFeedback({
				kind: "success",
				message: `${verb} ${option.name}. Tu selección ya quedó confirmada.`,
			});
			startTransition(() => {
				router.refresh();
			});
		} catch {
			setFeedback({
				kind: "error",
				message:
					"No se pudo conectar con el servidor para guardar tu grupo. Tu grupo actual no cambió.",
			});
		} finally {
			inFlightRef.current = false;
			setPendingGroupId(null);
		}
	}

	const windowBadgeStyle =
		windowState.status === "open"
			? "border-accent/30 bg-accent-soft text-accent-strong"
			: "border-border bg-surface text-muted";

	return (
		<section
			aria-labelledby={headingId}
			className="mt-5 border-t border-border pt-4"
		>
			<div className="rounded-xl border border-border bg-surface-muted/40 px-4 py-3">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<h3 id={headingId} className="text-sm font-semibold">
						{windowState.heading}
					</h3>
					<span
						className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${windowBadgeStyle}`}
					>
						{windowState.badgeLabel}
					</span>
				</div>
				<p className="mt-1 text-xs leading-5 text-muted">
					{windowState.description}
				</p>
			</div>

			{loadError && (
				<div
					role="alert"
					className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
				>
					<p>No pudimos cargar los grupos disponibles en este momento.</p>
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
			)}

			{feedback && (
				<p
					role={feedback.kind === "error" ? "alert" : "status"}
					aria-live={
						feedback.kind === "error" ? undefined : "polite"
					}
					className={
						feedback.kind === "error"
							? "mt-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
							: "mt-3 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm font-medium text-accent-strong"
					}
				>
					{feedback.message}
				</p>
			)}

			{windowState.status !== "unconfigured" && !loadError && (
				<div className="mt-3">
					{groups.length > 0 ? (
						<ul className="max-h-112 space-y-3 overflow-y-auto pr-1">
							{groups.map((group) => {
								const option = getGroupOptionViewModel({
									group,
									currentGroupId,
									windowStatus: windowState.status,
									courseName,
								});
								const isSavingThis = pendingGroupId === group.id;

								return (
									<li
										key={group.id}
										aria-current={
											option.isCurrent ? "true" : undefined
										}
										className={`rounded-xl border p-4 transition ${
											option.isCurrent
												? "border-accent/40 bg-accent-soft/35"
												: "border-border bg-surface-muted/55"
										}`}
									>
										<div className="flex flex-wrap items-start justify-between gap-3">
											<div className="min-w-0 flex-1">
												<div className="flex flex-wrap items-center gap-2">
													<p className="text-sm font-semibold text-foreground">
														{option.name}
													</p>
													<span
														className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${
															option.isCurrent
																? "border-accent/30 bg-accent-soft text-accent-strong"
																: option.isFull
																	? "border-border bg-surface text-muted"
																	: "border-border bg-surface text-foreground"
														}`}
													>
														{option.availabilityLabel}
													</span>
												</div>
												<p className="mt-1 text-xs text-muted">
													{option.occupancyLabel}
												</p>
												{group.members.length > 0 ? (
													<p className="mt-2 text-xs leading-5 text-muted">
														Integrantes:{" "}
														{group.members
															.map(
																(member) =>
																	member.full_name,
															)
															.join(", ")}
													</p>
												) : (
													windowState.status !==
														"open" &&
													group.active_members > 0 && (
														<p className="mt-2 text-xs leading-5 text-muted">
															Integrantes ocultos
															fuera de ventana.
														</p>
													)
												)}
											</div>

											<button
												type="button"
												disabled={
													!option.canSelect ||
													pendingGroupId !== null
												}
												aria-busy={isSavingThis}
												aria-label={option.ariaActionLabel}
												onClick={() =>
													void handleSelect(
														group,
														option,
													)
												}
												className={`min-h-10 shrink-0 rounded-xl border px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-55 ${
													option.canSelect
														? "border-border bg-surface text-foreground hover:border-accent hover:text-accent"
														: "border-border bg-surface-muted text-muted"
												}`}
											>
												{isSavingThis
													? "Guardando…"
													: option.actionLabel}
											</button>
										</div>
									</li>
								);
							})}
						</ul>
					) : (
						<p className="rounded-xl border border-border bg-surface-muted/45 px-4 py-4 text-sm text-muted">
							No hay grupos disponibles para este curso.
						</p>
					)}
				</div>
			)}
		</section>
	);
}
