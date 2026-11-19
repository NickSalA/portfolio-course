import type { ImportState } from "@/app/teacher/students/actions";

const labels: Record<string, string> = {
    imported: "Importada",
    existing: "Ya existente",
    invalid: "Inválida",
    duplicate: "Duplicada",
};

const reasons: Record<string, string> = {
    row_must_be_object: "La fila no tiene un formato válido.",
    invalid_field_type: "Uno o más campos tienen un tipo de dato no válido.",
    course_required: "Falta el curso.",
    email_required: "Falta el correo electrónico.",
    invalid_email: "El correo electrónico no tiene un formato válido.",
    course_not_available:
        "No existe un curso activo con ese nombre exacto en este periodo.",
    duplicate_in_payload:
        "El correo está repetido en este lote para el mismo curso.",
    already_authorized:
        "Ya existe una autorización para este correo y curso; no se modificó.",
};

export function ImportResults({ result }: { result: ImportState }) {
    if (result.error)
        return (
            <p
                role="alert"
                className="mt-4 rounded-xl bg-danger-soft p-3 text-sm text-danger"
            >
                {result.error}
            </p>
        );
    if (!result.results) return null;
    return (
        <section
            aria-live="polite"
            className="mt-4 rounded-xl border border-border bg-surface p-3 text-sm"
        >
            <h3 className="font-semibold">Resultado de la importación</h3>
            <p className="mt-1 text-muted">
                {Object.entries(labels)
                    .map(
                        ([status, label]) =>
                            `${label}: ${result.results!.filter((row) => row.status === status).length}`,
                    )
                    .join(" · ")}
            </p>
            <p className="mt-1 text-muted">
                Posición en el lote enviado, comenzando en 1 y contando todas
                las hojas procesadas. No es el número de fila física del
                archivo.
            </p>
            <ul className="mt-2 space-y-1">
                {result.results.map((row) => (
                    <li key={row.index}>
                        Posición {row.index + 1}: {labels[row.status]}
                        {row.reason
                            ? ` — ${reasons[row.reason] ?? `Motivo no reconocido (${row.reason}).`}`
                            : ""}
                    </li>
                ))}
            </ul>
        </section>
    );
}
