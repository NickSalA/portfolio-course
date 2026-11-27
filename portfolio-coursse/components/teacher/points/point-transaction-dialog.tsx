"use client";

import { useRef, useState } from "react";

import { registerPointTransaction } from "@/app/teacher/points/actions";
import { VoidPointTransactionButton } from "@/components/teacher/points/void-point-transaction-button";

type Transaction = {
    id: number;
    public_id: string;
    created_by: string;
    is_voided: boolean;
    points: number;
    reason: string | null;
    created_at: string;
    voided_at: string | null;
    voided_by: string | null;
    void_reason: string | null;
};

function movementDate(value: string) {
    return new Intl.DateTimeFormat("es-PE", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Lima",
    }).format(new Date(value));
}

export function PointTransactionDialog({
    course,
    period,
    userId,
    student,
}: {
    course: string;
    period: string;
    userId: string;
    student: {
        id: number;
        name: string;
        email: string;
        balance: number;
        transactions: Transaction[];
    };
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const submittingRef = useRef(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const storageKey = `point-pending:${userId}:${period}:${course}:${student.id}`;

    function openDialog() {
        setMessage("");
        try {
            const raw = sessionStorage.getItem(storageKey);
            if (raw) {
                const pending = JSON.parse(raw);
                const confirmed = student.transactions.some(
                    (t) =>
                        t.public_id === pending.id &&
                        t.created_by === userId &&
                        t.points === pending.points &&
                        (t.reason ?? "") === pending.reason,
                );
                if (confirmed) sessionStorage.removeItem(storageKey);
                else {
                    const form = dialogRef.current?.querySelector("form");
                    if (form) {
                        (
                            form.elements.namedItem(
                                "points",
                            ) as HTMLInputElement
                        ).value = String(pending.points);
                        (
                            form.elements.namedItem(
                                "reason",
                            ) as HTMLSelectElement
                        ).value = pending.reason;
                    }
                    setMessage(
                        "Hay un envío sin confirmar. Reintenta con los mismos datos; consulta el historial antes de descartarlo.",
                    );
                }
            }
        } catch {
            setMessage(
                "No se pudo acceder al intento pendiente. Habilita el almacenamiento de sesión para registrar puntos con seguridad.",
            );
        }
        dialogRef.current?.showModal();
    }

    return (
        <>
            <button
                type="button"
                onClick={openDialog}
                className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm font-semibold text-foreground transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
                Ver movimientos
            </button>
            <dialog
                ref={dialogRef}
                className="m-auto w-[min(100%-2rem,42rem)] overscroll-contain rounded-3xl border border-white/25 bg-transparent p-0 text-foreground shadow-2xl backdrop:bg-slate-950/55 backdrop:backdrop-blur-sm"
            >
                <form
                    action={registerPointTransaction}
                    onSubmit={(event) => {
                        if (submittingRef.current) {
                            event.preventDefault();
                            return;
                        }
                        try {
                            const form = event.currentTarget;
                            const data = new FormData(form);
                            const points = Number(data.get("points"));
                            const reason = String(
                                data.get("reason") ?? "",
                            ).trim();
                            const raw = sessionStorage.getItem(storageKey);
                            const pending = raw ? JSON.parse(raw) : null;
                            if (
                                pending &&
                                (pending.points !== points ||
                                    pending.reason !== reason)
                            ) {
                                event.preventDefault();
                                setMessage(
                                    "El envío pendiente tiene otros datos. Reinténtalo sin cambios o consulta el historial antes de descartarlo.",
                                );
                                return;
                            }
                            const id = pending?.id ?? crypto.randomUUID();
                            sessionStorage.setItem(
                                storageKey,
                                JSON.stringify({ id, points, reason }),
                            );
                            (
                                form.elements.namedItem(
                                    "transaction_public_id",
                                ) as HTMLInputElement
                            ).value = id;
                            submittingRef.current = true;
                            setIsSubmitting(true);
                        } catch {
                            event.preventDefault();
                            setMessage(
                                "No se pudo guardar el intento en esta sesión; no se enviaron los puntos.",
                            );
                        }
                    }}
                    className="glass-strong rounded-3xl p-6 sm:p-8"
                >
                    <input type="hidden" name="course" value={course} />
                    <input type="hidden" name="period" value={period} />
                    <input
                        type="hidden"
                        name="transaction_public_id"
                        defaultValue=""
                    />

                    <input
                        type="hidden"
                        name="authorized_student_id"
                        value={student.id}
                    />
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                                {student.name}
                            </p>
                            <p className="mt-1 truncate text-sm text-muted">
                                {student.email}
                            </p>
                            <p className="mt-4 text-xs text-muted">
                                Saldo actual{" "}
                                <span className="ml-1 text-xl font-semibold text-foreground tabular-nums">
                                    {student.balance > 0
                                        ? `+${student.balance}`
                                        : student.balance}
                                </span>
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => dialogRef.current?.close()}
                            aria-label="Cerrar movimientos"
                            className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface-muted text-lg text-muted"
                        >
                            ×
                        </button>
                    </div>
                    {message && (
                        <div role="status" className="mt-4 text-sm text-danger">
                            <p>{message}</p>
                            <button
                                type="button"
                                className="mt-2 underline"
                                onClick={() => {
                                    if (
                                        window.confirm(
                                            "Si el envío anterior sí se guardó, descartarlo y volver a registrar puede duplicar los puntos. Consulta el historial antes de continuar. ¿Descartar?",
                                        )
                                    ) {
                                        try {
                                            sessionStorage.removeItem(
                                                storageKey,
                                            );
                                            setMessage("");
                                        } catch {
                                            setMessage(
                                                "No se pudo descartar el intento pendiente.",
                                            );
                                        }
                                    }
                                }}
                            >
                                Descartar intento pendiente
                            </button>
                        </div>
                    )}
                    <div className="mt-6 border-y border-border py-5">
                        <p className="text-xs font-semibold uppercase tracking-[.14em] text-accent">
                            Registrar movimiento
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-[7rem_minmax(0,1fr)_auto]">
                            <label className="text-sm text-muted">
                                Puntos
                                <input
                                    name="points"
                                    type="number"
                                    required
                                    placeholder="Ej. +2"
                                    autoComplete="off"
                                    className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-foreground"
                                />
                            </label>
                            <label className="text-sm text-muted">
                                Motivo <span className="text-xs">opcional</span>
                                <select
                                    name="reason"
                                    defaultValue=""
                                    className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-foreground"
                                >
                                    <option value="">Sin motivo</option>
                                    <option>Participación</option>
                                    <option>Actividad</option>
                                    <option>Asistencia</option>
                                    <option>Colaboración</option>
                                    <option>Otro</option>
                                </select>
                            </label>
                            <button
                                disabled={isSubmitting}
                                className="self-end rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
                            >
                                Registrar
                            </button>
                        </div>
                    </div>
                    <div className="mt-6">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted">
                                Historial
                            </p>
                            <p className="text-xs text-muted">
                                {student.transactions.length} movimientos
                            </p>
                        </div>
                        <p className="mt-2 text-xs text-muted">
                            Los movimientos anulados se conservan en el
                            historial, pero no cuentan en el saldo ni en la
                            exportación.
                        </p>
                        <div className="mt-3 max-h-64 divide-y divide-border overflow-y-auto rounded-xl border border-border bg-surface-muted/40">
                            {student.transactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="flex items-start justify-between gap-4 px-4 py-3"
                                >
                                    <div>
                                        {transaction.is_voided && (
                                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                                                Anulado · no cuenta en el saldo
                                            </p>
                                        )}
                                        <p className="text-sm">
                                            {transaction.reason || "Sin motivo"}
                                        </p>
                                        <p className="mt-1 text-xs text-muted">
                                            {movementDate(
                                                transaction.created_at,
                                            )}
                                        </p>
                                        {transaction.is_voided && (
                                            <div className="mt-2 space-y-1 text-xs text-muted">
                                                <p>
                                                    Fecha de anulación:{" "}
                                                    {transaction.voided_at
                                                        ? movementDate(
                                                              transaction.voided_at,
                                                          )
                                                        : "No disponible"}
                                                </p>
                                                <p className="break-all">
                                                    Responsable (ID):{" "}
                                                    {transaction.voided_by ??
                                                        "No disponible"}
                                                </p>
                                                <p className="break-words">
                                                    Motivo de anulación:{" "}
                                                    {transaction.void_reason ||
                                                        "No disponible"}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {!transaction.is_voided && (
                                            <VoidPointTransactionButton
                                                transactionId={transaction.id}
                                                course={course}
                                                period={period}
                                            />
                                        )}
                                        <p
                                            className={
                                                transaction.is_voided
                                                    ? "font-semibold tabular-nums text-muted line-through"
                                                    : transaction.points > 0
                                                      ? "font-semibold tabular-nums text-accent"
                                                      : "font-semibold tabular-nums text-danger"
                                            }
                                        >
                                            {transaction.points > 0
                                                ? `+${transaction.points}`
                                                : transaction.points}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {!student.transactions.length && (
                                <p className="px-4 py-6 text-sm text-muted">
                                    Aún no hay movimientos registrados.
                                </p>
                            )}
                        </div>
                    </div>
                </form>
            </dialog>
        </>
    );
}
