"use client";

import { useState, useTransition } from "react";
import {
    confirmActivityDateCorrectionAction,
    reviewActivityDateCorrectionAction,
} from "@/app/teacher/grades/actions";

type Review = NonNullable<
    Awaited<ReturnType<typeof reviewActivityDateCorrectionAction>>["review"]
>;

function stateLabel(
    state: string,
    groupId: number | null,
    groups: Record<number, string>,
) {
    if (state === "grouped")
        return groupId !== null
            ? groups[groupId] || `Grupo ${groupId}`
            : "Grupo no identificado";
    if (state === "ungrouped") return "Sin grupo (no participa)";
    if (state === "inactive") return "Inactivo (no participa)";
    return "Historia desconocida (participación no determinada)";
}

export function ActivityDateCorrection({
    courseId,
    evaluationId,
    studentNames,
    groupNames,
}: {
    courseId: number;
    evaluationId: number;
    studentNames: Record<number, string>;
    groupNames: Record<number, string>;
}) {
    const [date, setDate] = useState("");
    const [reason, setReason] = useState("");
    const [review, setReview] = useState<Review | null>(null);
    const [reviewedReason, setReviewedReason] = useState("");
    const [acknowledged, setAcknowledged] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [pending, startTransition] = useTransition();

    function resetReview() {
        setReview(null);
        setAcknowledged(false);
        setSuccess(false);
        setError(null);
    }

    function requestReview(event: React.FormEvent) {
        event.preventDefault();
        resetReview();
        const proposed = new Date(date);
        if (!date || Number.isNaN(proposed.getTime()) || !reason.trim()) {
            setError("Indica una fecha y hora válidas y un motivo.");
            return;
        }
        startTransition(async () => {
            try {
                const result = await reviewActivityDateCorrectionAction(
                    courseId,
                    evaluationId,
                    proposed.toISOString(),
                    reason,
                );
                if (result.review) {
                    setReviewedReason(reason.trim());
                    setReview(result.review);
                } else setError(result.error);
            } catch {
                setError("No se pudo obtener la revisión. Inténtalo de nuevo.");
            }
        });
    }

    function confirm() {
        if (!review || !acknowledged) return;
        startTransition(async () => {
            try {
                const result = await confirmActivityDateCorrectionAction(
                    courseId,
                    evaluationId,
                    review.review_id,
                );
                setReview(null);
                setAcknowledged(false);
                if (result.error) setError(result.error);
                else {
                    setError(null);
                    setSuccess(true);
                    setDate("");
                    setReason("");
                }
            } catch {
                setReview(null);
                setAcknowledged(false);
                setError(
                    "No se pudo confirmar el resultado. Recarga la página y comprueba la fecha antes de volver a revisar.",
                );
            }
        });
    }

    return (
        <details className="rounded-lg border border-border p-3">
            <summary className="min-h-9 cursor-pointer rounded-lg py-1.5 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                Corregir fecha de realización
            </summary>
            <form onSubmit={requestReview} className="mt-3 space-y-2">
                <label className="block">
                    Nueva fecha y hora (hora local del dispositivo)
                    <input
                        type="datetime-local"
                        required
                        value={date}
                        disabled={pending}
                        onChange={(event) => {
                            resetReview();
                            setDate(event.target.value);
                        }}
                        className="mt-1 block min-h-9 w-full rounded-lg border border-border bg-surface px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    />
                </label>
                <label className="block">
                    Motivo de la corrección
                    <textarea
                        required
                        value={reason}
                        disabled={pending}
                        onChange={(event) => {
                            resetReview();
                            setReason(event.target.value);
                        }}
                        className="mt-1 block min-h-9 w-full rounded-lg border border-border bg-surface px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    />
                </label>
                <button
                    type="submit"
                    disabled={pending || !date || !reason.trim()}
                    className="min-h-9 rounded-lg border border-border px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
                >
                    {pending ? "Procesando…" : "Revisar impacto"}
                </button>
            </form>
            {error && (
                <p role="alert" className="mt-2 text-danger">
                    {error}
                </p>
            )}
            {success && (
                <p role="status" className="mt-2">
                    Corrección confirmada. La fecha y los participantes se
                    actualizaron.
                </p>
            )}
            {review && (
                <section
                    className="mt-3 space-y-2"
                    aria-label="Revisión del impacto de la fecha"
                >
                    <h4 className="font-semibold">Revisión de impacto</h4>
                    <p>
                        Fecha anterior:{" "}
                        <time dateTime={review.old_at}>{review.old_at}</time>
                    </p>
                    <p>
                        Fecha propuesta:{" "}
                        <time dateTime={review.new_at}>{review.new_at}</time>
                    </p>
                    <p>Motivo: {reviewedReason}</p>
                    <p>
                        Se muestran todos los registros retenidos, también los
                        que no cambian. El padrón histórico podría estar
                        incompleto; un estado desconocido no significa que no
                        haya participado.
                    </p>
                    {review.impact.length === 0 ? (
                        <p>
                            No hay registros retenidos para comparar; esto no
                            acredita un padrón histórico vacío.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {review.impact.map((row) => (
                                <li
                                    key={`${row.authorization_id}-${row.enrollment_id ?? "sin-matricula"}`}
                                    className="rounded-lg border border-border p-2"
                                >
                                    <strong>
                                        {studentNames[row.authorization_id] ||
                                            `Autorización ${row.authorization_id}`}
                                    </strong>
                                    <p>
                                        Antes:{" "}
                                        {stateLabel(
                                            row.old_state,
                                            row.old_group_id,
                                            groupNames,
                                        )}
                                    </p>
                                    <p>
                                        Después:{" "}
                                        {stateLabel(
                                            row.new_state,
                                            row.new_group_id,
                                            groupNames,
                                        )}
                                    </p>
                                    <p>
                                        {row.old_state === row.new_state &&
                                        row.old_group_id === row.new_group_id
                                            ? "Sin cambio en el estado o grupo"
                                            : "Estado o grupo diferente"}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                    <label className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            checked={acknowledged}
                            disabled={pending}
                            onChange={(event) =>
                                setAcknowledged(event.target.checked)
                            }
                            className="mt-0.5 size-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        />{" "}
                        He revisado el impacto y los límites del padrón
                        histórico.
                    </label>
                    <button
                        type="button"
                        onClick={confirm}
                        disabled={pending || !acknowledged}
                        className="min-h-9 rounded-lg border border-border px-2 py-1 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
                    >
                        Confirmar corrección de fecha
                    </button>
                </section>
            )}
        </details>
    );
}
