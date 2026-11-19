"use client";

import { useActionState, useRef, useState } from "react";
import { importStudents } from "@/app/teacher/students/actions";
import { ImportResults } from "@/components/teacher/students/import-results";
import { CsvImporter } from "@/components/teacher/students/csv-importer";

type Student = {
    course_name: string;
    full_name: string;
    email: string;
    student_number: string;
};

export function CourseStudentImportForm({
    periodPublicId,
    courseName,
}: {
    periodPublicId: string;
    courseName: string;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [result, submit, pending] = useActionState(importStudents, {});
    const [showResult, setShowResult] = useState(false);
    const [importerKey, setImporterKey] = useState(0);
    const [students, setStudents] = useState<Student[]>([]);
    const mappedStudents = students.map((student) => ({
        ...student,
        course_name: courseName,
    }));
    return (
        <>
            <button
                type="button"
                onClick={() => dialogRef.current?.showModal()}
                className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm font-semibold text-foreground transition-[background-color,border-color,color,transform] hover:-translate-y-0.5 hover:border-accent hover:bg-accent-soft hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
                Importar alumnos
            </button>
            <dialog
                ref={dialogRef}
                onCancel={(event) => {
                    if (pending) event.preventDefault();
                }}
                onClose={() => {
                    setImporterKey((key) => key + 1);
                    setStudents([]);
                    setShowResult(false);
                }}
                className="m-auto w-[min(100%-2rem,42rem)] rounded-3xl border border-white/25 bg-transparent p-0 text-foreground shadow-2xl backdrop:bg-slate-950/55 backdrop:backdrop-blur-sm"
            >
                <form
                    action={submit}
                    onSubmit={() => setShowResult(true)}
                    className="glass-strong rounded-3xl p-6 sm:p-8"
                >
                    <input
                        type="hidden"
                        name="period_public_id"
                        value={periodPublicId}
                    />
                    <input
                        type="hidden"
                        name="students"
                        value={JSON.stringify(mappedStudents)}
                    />
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[.18em] text-accent">
                                Importar alumnos
                            </p>
                            <h2 className="mt-2 text-xl font-semibold">
                                {courseName}
                            </h2>
                            <p className="mt-2 text-sm text-muted">
                                Se enviará el nombre de este curso para cada
                                fila, ignorando la columna Curso del archivo.
                                Los cursos archivados no admiten importaciones y
                                las autorizaciones existentes no se modifican.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                if (!pending) dialogRef.current?.close();
                            }}
                            disabled={pending}
                            aria-label="Cerrar"
                            className="grid size-9 place-items-center rounded-lg border border-border text-lg text-muted"
                        >
                            ×
                        </button>
                    </div>
                    {showResult && !pending && (
                        <ImportResults result={result} />
                    )}
                    <div className="mt-6">
                        <CsvImporter
                            key={importerKey}
                            disabled={pending}
                            onValidated={(rows) => {
                                setShowResult(false);
                                setStudents(rows);
                            }}
                            fixedCourseName={courseName}
                        />
                    </div>
                    {students.length > 0 && (
                        <>
                            <div className="mt-5 rounded-xl border border-border bg-surface-muted/45 px-4 py-3 text-sm">
                                <strong>{students.length} alumnos</strong>
                                <span className="text-muted">
                                    {" "}
                                    se enviarán para {courseName}.
                                </span>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!pending)
                                            dialogRef.current?.close();
                                    }}
                                    disabled={pending}
                                    className="rounded-xl border border-border px-4 py-2 text-sm font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={pending}
                                    className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                >
                                    Importar alumnos
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </dialog>
        </>
    );
}
