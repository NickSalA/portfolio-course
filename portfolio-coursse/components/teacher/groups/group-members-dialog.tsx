"use client";

import { useRef } from "react";

type Member = { full_name: string | null; email: string };

export function GroupMembersDialog({
	groupName,
	capacity,
	members,
}: {
	groupName: string;
	capacity: number;
	members: Member[];
}) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	return (
		<>
			<button
				type="button"
				onClick={() => dialogRef.current?.showModal()}
				className="group w-full rounded-2xl border border-border bg-surface-muted/55 p-4 text-left transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
			>
				<div className="flex items-center justify-between">
					<h3 className="font-medium">{groupName}</h3>
					<span className="text-sm tabular-nums text-muted">
						{members.length}/{capacity}
					</span>
				</div>
				<div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface">
					<div
						className="h-full rounded-full bg-accent"
						style={{
							width: `${Math.min((members.length / capacity) * 100, 100)}%`,
						}}
					/>
				</div>
				<p className="mt-2 text-xs text-muted">Ver integrantes</p>
			</button>
			<dialog
				ref={dialogRef}
				className="m-auto w-[min(100%-2rem,38rem)] overscroll-contain rounded-3xl border border-white/25 bg-transparent p-0 text-foreground shadow-2xl backdrop:bg-slate-950/55 backdrop:backdrop-blur-sm"
			>
				<div className="glass-strong rounded-3xl p-6 sm:p-8">
					<div className="flex items-start justify-between gap-4">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[.16em] text-accent">
								Integrantes
							</p>
							<h2 className="mt-2 text-2xl font-semibold">
								{groupName}
							</h2>
							<p className="mt-1 text-sm text-muted">
								{members.length} de {capacity} alumnos
							</p>
						</div>
						<button
							type="button"
							onClick={() => dialogRef.current?.close()}
							aria-label={`Cerrar ${groupName}`}
							className="grid size-9 place-items-center rounded-lg border border-border bg-surface-muted text-lg text-muted"
						>
							×
						</button>
					</div>
					<div className="mt-6 divide-y divide-border rounded-xl border border-border bg-surface-muted/40">
						{members.map((member) => (
							<div key={member.email} className="px-4 py-3">
								<p className="text-sm font-medium">
									{member.full_name || "Sin nombre"}
								</p>
								<p className="mt-1 text-xs text-muted">
									{member.email}
								</p>
							</div>
						))}
						{!members.length && (
							<p className="px-4 py-6 text-sm text-muted">
								Todavía no hay alumnos asignados a este grupo.
							</p>
						)}
					</div>
				</div>
			</dialog>
		</>
	);
}
