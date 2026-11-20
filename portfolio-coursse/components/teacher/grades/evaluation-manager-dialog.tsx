"use client";

import { useState, useTransition } from "react";
import { ActivityDateCorrection } from "./activity-date-correction";
import {
    addEvaluationAction,
    deleteEvaluationAction,
    setEvaluationOccurrenceAction,
} from "@/app/teacher/grades/actions";

type Evaluation = {
    id: number;
    public_id: string;
    name: string;
    position: number;
    performed_at: string | null;
};

type Participant = {
    enrollment_id: number | null;
    authorization_id: number;
    student_id: string | null;
    membership_state: "grouped" | "ungrouped" | "inactive" | "unknown";
    group_id: number | null;
};

function OccurrenceForm({
    courseId,
    evaluationId,
}: {
    courseId: number;
    evaluationId: number;
}) {
    const [value, setValue] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function submit(event: React.FormEvent) {
        event.preventDefault();
        const date = new Date(value);
        if (!value || Number.isNaN(date.getTime())) {
            setError("Indica una fecha y hora válidas.");
            return;
        }
        const data = new FormData();
        data.set("course_id", String(courseId));
        data.set("evaluation_id", String(evaluationId));
        data.set("performed_at", date.toISOString());
        setError(null);
        startTransition(async () => {
            const result = await setEvaluationOccurrenceAction(data);
            if (result.error) setError(result.error);
        });
    }

    return (
        <form onSubmit={submit} className="mt-2 space-y-2">
            <label className="block text-xs">
                Fecha y hora de realización (hora local del dispositivo)
                <input
                    type="datetime-local"
                    required
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    disabled={pending}
                    className="mt-1 block w-full rounded-lg border border-border bg-surface px-2 py-1"
                />
            </label>
            <button
                type="submit"
                disabled={pending || !value}
                className="rounded-lg border border-border px-2 py-1 text-xs disabled:opacity-50"
            >
                {pending ? "Guardando…" : "Establecer fecha"}
            </button>
            {error && (
                <p role="alert" className="text-xs text-red-400">
                    {error}
                </p>
            )}
        </form>
    );
}

export function EvaluationManagerDialog({
    coursePublicId,
    courseId,
    studentNames,
    groupNames,
    evaluations,
    participantsByEvaluation,
}: {
    coursePublicId: string;
    courseId: number;
    studentNames: Record<number, string>;
    groupNames: Record<number, string>;
    evaluations: Evaluation[];
    participantsByEvaluation: Record<
        number,
        { rows: Participant[]; error: boolean }
    >;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;
        setError(null);

        const formData = new FormData();
        formData.set("course_public_id", coursePublicId);
        formData.set("name", name.trim());

        startTransition(async () => {
            const res = await addEvaluationAction(formData);
            if (res.error) {
                setError(res.error);
            } else {
                setName("");
            }
        });
    }

    function handleDelete(evaluationPublicId: string) {
        if (
            !confirm(
                "¿Seguro que deseas eliminar esta evaluación? Las notas asociadas se perderán.",
            )
        ) {
            return;
        }
        setError(null);

        const formData = new FormData();
        formData.set("evaluation_public_id", evaluationPublicId);

        startTransition(async () => {
            const res = await deleteEvaluationAction(formData);
            if (res.error) {
                setError(res.error);
            }
        });
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
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
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                </svg>
                Gestionar Evaluaciones
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="glass w-full max-w-md rounded-3xl border border-white/20 bg-background p-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">
                                Evaluaciones del curso
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="rounded-lg p-1.5 text-muted hover:bg-surface-muted hover:text-foreground"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="mt-2 text-sm text-muted">
                            Agrega o elimina las evaluaciones del curso (ej. T1,
                            T2, Parcial, etc.).
                        </p>

                        {error && (
                            <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleAdd} className="mt-4 flex gap-2">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej. T4, Examen Final..."
                                disabled={isPending}
                                className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                            />
                            <button
                                type="submit"
                                disabled={isPending || !name.trim()}
                                className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                            >
                                {isPending ? "..." : "Añadir"}
                            </button>
                        </form>

                        <div className="mt-5 max-h-60 divide-y divide-border overflow-y-auto rounded-2xl border border-border">
                            {evaluations.length === 0 ? (
                                <p className="p-4 text-center text-sm text-muted">
                                    No hay evaluaciones definidas.
                                </p>
                            ) : (
                                evaluations.map((ev) => (
                                    <div
                                        key={ev.id}
                                        className="px-4 py-3 text-sm"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">
                                                {ev.name}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDelete(ev.public_id)
                                                }
                                                disabled={
                                                    isPending ||
                                                    !!ev.performed_at
                                                }
                                                title={
                                                    ev.performed_at
                                                        ? "Una actividad fechada no se puede eliminar"
                                                        : undefined
                                                }
                                                className="rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                        {ev.performed_at ? (
                                            <div className="mt-2 space-y-2 text-xs">
                                                <p>
                                                    Realización:{" "}
                                                    <time
                                                        dateTime={
                                                            ev.performed_at
                                                        }
                                                    >
                                                        {ev.performed_at}
                                                    </time>
                                                </p>
                                                <ActivityDateCorrection
                                                    key={`${ev.id}-${ev.performed_at}`}
                                                    courseId={courseId}
                                                    evaluationId={ev.id}
                                                    studentNames={studentNames}
                                                    groupNames={groupNames}
                                                />
                                                <details>
                                                    <summary className="cursor-pointer">
                                                        Consultar participación
                                                        histórica
                                                    </summary>
                                                    {participantsByEvaluation[
                                                        ev.id
                                                    ]?.error ||
                                                    !participantsByEvaluation[
                                                        ev.id
                                                    ] ? (
                                                        <p role="alert">
                                                            No se pudo consultar
                                                            la participación
                                                            histórica.
                                                        </p>
                                                    ) : participantsByEvaluation[
                                                          ev.id
                                                      ].rows.length === 0 ? (
                                                        <p>
                                                            No hay registros
                                                            retenidos para esta
                                                            actividad.
                                                        </p>
                                                    ) : (
                                                        <ul className="mt-2 space-y-1">
                                                            {participantsByEvaluation[
                                                                ev.id
                                                            ].rows.map(
                                                                (
                                                                    participant,
                                                                ) => (
                                                                    <li
                                                                        key={`${participant.authorization_id}-${participant.enrollment_id ?? "sin-matricula"}`}
                                                                    >
                                                                        {studentNames[
                                                                            participant
                                                                                .authorization_id
                                                                        ] ||
                                                                            `Autorización ${participant.authorization_id}`}
                                                                        :{" "}
                                                                        {participant.membership_state ===
                                                                        "grouped"
                                                                            ? (participant.group_id !==
                                                                                  null &&
                                                                                  groupNames[
                                                                                      participant
                                                                                          .group_id
                                                                                  ]) ||
                                                                              `Grupo ${participant.group_id}`
                                                                            : participant.membership_state ===
                                                                                "unknown"
                                                                              ? "Historia desconocida"
                                                                              : participant.membership_state ===
                                                                                  "ungrouped"
                                                                                ? "Sin grupo"
                                                                                : "Inactivo"}
                                                                    </li>
                                                                ),
                                                            )}
                                                        </ul>
                                                    )}
                                                </details>
                                                <p>
                                                    La lista solo incluye
                                                    registros retenidos; no
                                                    garantiza un padrón
                                                    histórico completo. Resuelve
                                                    los casos desconocidos antes
                                                    de atribuir resultados.
                                                </p>
                                            </div>
                                        ) : (
                                            <OccurrenceForm
                                                courseId={courseId}
                                                evaluationId={ev.id}
                                            />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
