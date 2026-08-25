"use client";

import { useRef } from "react";
import { registerPointTransaction } from "@/app/teacher/points/actions";

type Transaction = { points: number; reason: string | null; created_at: string };

function movementDate(value: string) {
	return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" }).format(new Date(value));
}

export function PointTransactionDialog({ course, student }: { course: string; student: { id: number; name: string; email: string; balance: number; transactions: Transaction[] } }) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	return <>
		<button type="button" onClick={() => dialogRef.current?.showModal()} className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm font-semibold text-foreground transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Ver movimientos</button>
		<dialog ref={dialogRef} className="m-auto w-[min(100%-2rem,42rem)] overscroll-contain rounded-3xl border border-white/25 bg-transparent p-0 text-foreground shadow-2xl backdrop:bg-slate-950/55 backdrop:backdrop-blur-sm">
			<form action={registerPointTransaction} className="glass-strong rounded-3xl p-6 sm:p-8">
				<input type="hidden" name="course" value={course} /><input type="hidden" name="authorized_student_id" value={student.id} />
				<div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate text-sm font-semibold">{student.name}</p><p className="mt-1 truncate text-sm text-muted">{student.email}</p><p className="mt-4 text-xs text-muted">Saldo actual <span className="ml-1 text-xl font-semibold text-foreground tabular-nums">{student.balance > 0 ? `+${student.balance}` : student.balance}</span></p></div><button type="button" onClick={() => dialogRef.current?.close()} aria-label="Cerrar movimientos" className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface-muted text-lg text-muted">×</button></div>
				<div className="mt-6 border-y border-border py-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-accent">Registrar movimiento</p><div className="mt-3 grid gap-3 sm:grid-cols-[7rem_minmax(0,1fr)_auto]"><label className="text-sm text-muted">Puntos<input name="points" type="number" required placeholder="Ej. +2" autoComplete="off" className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-foreground" /></label><label className="text-sm text-muted">Motivo <span className="text-xs">opcional</span><input name="reason" type="text" autoComplete="off" placeholder="Ej. Participación" className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-foreground" /></label><button className="self-end rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Registrar</button></div></div>
				<div className="mt-6"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[.14em] text-muted">Historial</p><p className="text-xs text-muted">{student.transactions.length} movimientos</p></div><div className="mt-3 max-h-64 divide-y divide-border overflow-y-auto rounded-xl border border-border bg-surface-muted/40">{student.transactions.map((transaction, index) => <div key={`${transaction.created_at}-${index}`} className="flex items-start justify-between gap-4 px-4 py-3"><div><p className="text-sm">{transaction.reason || "Sin motivo"}</p><p className="mt-1 text-xs text-muted">{movementDate(transaction.created_at)}</p></div><p className={transaction.points > 0 ? "font-semibold tabular-nums text-accent" : "font-semibold tabular-nums text-danger"}>{transaction.points > 0 ? `+${transaction.points}` : transaction.points}</p></div>)}{!student.transactions.length && <p className="px-4 py-6 text-sm text-muted">Aún no hay movimientos registrados.</p>}</div></div>
			</form>
		</dialog>
	</>;
}
