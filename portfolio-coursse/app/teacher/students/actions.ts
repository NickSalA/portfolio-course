"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, name: string) {
    const entry = formData.get(name);
    return typeof entry === "string" ? entry.trim() : "";
}

export async function deactivateStudentAuthorization(formData: FormData) {
    const supabase = await createClient();
    const authorizationId = Number(value(formData, "authorization_id"));
    const period = value(formData, "period");
    const course = value(formData, "course");
    const path = `/teacher/students?period=${encodeURIComponent(period)}&course=${encodeURIComponent(course)}`;
    if (!Number.isInteger(authorizationId)) redirect(path);
    const { data: updated, error } = await supabase
        .from("authorized_students")
        .update({ status: "inactive" })
        .eq("id", authorizationId)
        .select("id")
        .maybeSingle();
    if (error || !updated) redirect(`${path}&error=deactivate`);
    revalidatePath("/teacher/students");
    revalidatePath("/student");
    redirect(path);
}

export async function reactivateStudentAuthorization(formData: FormData) {
    const supabase = await createClient();
    const authorizationId = Number(value(formData, "authorization_id"));
    const period = value(formData, "period");
    const path = `/teacher/settings?period=${encodeURIComponent(period)}`;
    if (!Number.isInteger(authorizationId)) redirect(path);
    const { data: updated, error } = await supabase
        .from("authorized_students")
        .update({ status: "active" })
        .eq("id", authorizationId)
        .select("id")
        .maybeSingle();
    if (error || !updated) redirect(`${path}&error=restore-student`);
    revalidatePath("/teacher/students");
    revalidatePath("/teacher/settings");
    revalidatePath("/student");
    redirect(path);
}

export type ImportState = {
    results?: { index: number; status: string; reason: string | null }[];
    error?: string;
};

export async function importStudents(
    _previous: ImportState,
    formData: FormData,
): Promise<ImportState> {
    const periodPublicId = value(formData, "period_public_id");
    let students: unknown;
    try {
        students = JSON.parse(value(formData, "students"));
    } catch {
        return { error: "No se pudieron leer las filas enviadas." };
    }
    if (!periodPublicId || !Array.isArray(students) || !students.length) {
        return { error: "Selecciona un periodo y un archivo con alumnos." };
    }

    const supabase = await createClient();
    const { data: period, error: periodError } = await supabase
        .from("academic_periods")
        .select("id")
        .eq("public_id", periodPublicId)
        .maybeSingle();
    if (periodError || !period)
        return { error: "No se pudo consultar el periodo seleccionado." };

    const { data, error } = await supabase.rpc("import_period_students", {
        target_period_id: period.id,
        students,
    });
    if (error) {
        console.error("Student import RPC failed", {
            code: error.code,
            message: error.message,
        });
        const messages: Record<string, string> = {
            not_teacher: "Solo un docente puede importar alumnos.",
            period_not_available:
                "El periodo no está disponible para importar alumnos.",
            invalid_students_payload:
                "El lote enviado no tiene un formato válido.",
        };
        return {
            error:
                messages[error.message] ??
                "No se pudo importar el lote. Revisa el padrón antes de reintentar.",
        };
    }

    revalidatePath("/teacher");
    revalidatePath("/teacher/students");
    revalidatePath("/teacher/courses", "layout");
    const results: unknown = data;
    if (
        !Array.isArray(results) ||
        results.length !== students.length ||
        results.some((row: unknown) => {
            if (!row || typeof row !== "object") return true;
            const result = row as Record<string, unknown>;
            return (
                !Number.isInteger(result.index) ||
                (result.index as number) < 0 ||
                (result.index as number) >= students.length ||
                !["imported", "existing", "invalid", "duplicate"].includes(
                    result.status as string,
                ) ||
                (result.reason != null && typeof result.reason !== "string")
            );
        }) ||
        new Set(results.map((row: { index: number }) => row.index)).size !==
            students.length
    ) {
        return {
            error: "El servidor no devolvió un resultado completo por fila. La operación pudo haberse aplicado; verifica el padrón antes de reintentar.",
        };
    }
    return { results: [...results].sort((a, b) => a.index - b.index) };
}
