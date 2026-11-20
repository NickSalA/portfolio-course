"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addEvaluationAction(formData: FormData) {
    const coursePublicId = String(
        formData.get("course_public_id") ?? "",
    ).trim();
    const name = String(formData.get("name") ?? "").trim();

    if (!coursePublicId || !name) {
        return { error: "Datos incompletos" };
    }

    const supabase = await createClient();
    const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("id")
        .eq("public_id", coursePublicId)
        .single();

    if (courseError || !course) {
        return { error: "Curso no encontrado" };
    }

    // Calculate next position
    const { data: existing } = await supabase
        .from("course_evaluations")
        .select("position")
        .eq("course_id", course.id)
        .order("position", { ascending: false })
        .limit(1);

    const nextPosition = (existing?.[0]?.position ?? 0) + 1;

    const { error: insertError } = await supabase
        .from("course_evaluations")
        .insert({
            course_id: course.id,
            name,
            position: nextPosition,
        });

    if (insertError) {
        if (insertError.code === "23505") {
            return { error: "Ya existe una evaluación con ese nombre" };
        }
        return { error: "No se pudo crear la evaluación" };
    }

    revalidatePath("/teacher/grades");
    return { success: true };
}

export async function setEvaluationOccurrenceAction(formData: FormData) {
    const evaluationId = Number(formData.get("evaluation_id"));
    const courseId = Number(formData.get("course_id"));
    const performedAt = String(formData.get("performed_at") ?? "");
    const date = new Date(performedAt);

    if (
        !Number.isSafeInteger(evaluationId) ||
        evaluationId <= 0 ||
        !Number.isSafeInteger(courseId) ||
        courseId <= 0 ||
        !performedAt ||
        Number.isNaN(date.getTime())
    ) {
        return { error: "Fecha o evaluación inválida" };
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("set_activity_performed_at", {
        target_course_id: courseId,
        target_evaluation_id: evaluationId,
        activity_at: date.toISOString(),
    });
    if (error) {
        return {
            error: "No se pudo establecer la fecha. Debe ser pasada o actual y solo puede establecerse una vez; comprueba también tus permisos.",
        };
    }

    revalidatePath("/teacher/grades");
    return { success: true };
}

type CorrectionImpact = {
    enrollment_id: number | null;
    authorization_id: number;
    student_id: string | null;
    old_state: "grouped" | "ungrouped" | "inactive" | "unknown";
    old_group_id: number | null;
    new_state: "grouped" | "ungrouped" | "inactive" | "unknown";
    new_group_id: number | null;
};

type CorrectionReview = {
    review_id: string;
    old_at: string;
    new_at: string;
    impact: CorrectionImpact[];
};

function correctionError(message: string): string {
    if (message.includes("activity_review_stale"))
        return "La fecha o el padrón cambiaron desde la revisión. Vuelve a revisar el impacto antes de confirmar.";
    if (message.includes("activity_review_already_used"))
        return "Esta revisión ya fue utilizada. Recarga la página para comprobar la fecha.";
    if (message.includes("activity_review_not_found"))
        return "No se encontró esta revisión para tu usuario y actividad. Realiza una nueva revisión.";
    if (message.includes("activity_time_unchanged"))
        return "La fecha propuesta coincide con la fecha actual.";
    if (message.includes("invalid_activity_correction"))
        return "Indica una fecha pasada o actual y un motivo no vacío.";
    if (message.includes("activity_access_denied"))
        return "No tienes permiso para corregir esta actividad.";
    if (
        message.includes("activity_not_found") ||
        message.includes("activity_time_required")
    )
        return "No se encontró la actividad fechada. Recarga la página.";
    return "No se pudo completar la operación. Inténtalo de nuevo o recarga la página.";
}

export async function reviewActivityDateCorrectionAction(
    courseId: number,
    evaluationId: number,
    proposedAt: string,
    reason: string,
): Promise<
    | { review: CorrectionReview; error?: never }
    | { error: string; review?: never }
> {
    const date = new Date(proposedAt);
    if (
        !Number.isSafeInteger(courseId) ||
        courseId <= 0 ||
        !Number.isSafeInteger(evaluationId) ||
        evaluationId <= 0 ||
        !proposedAt ||
        Number.isNaN(date.getTime()) ||
        !reason.trim()
    ) {
        return { error: "Indica una fecha y hora válidas y un motivo." };
    }
    const supabase = await createClient();
    const { data, error } = await supabase.rpc(
        "review_activity_date_correction",
        {
            target_course_id: courseId,
            target_evaluation_id: evaluationId,
            proposed_at: date.toISOString(),
            correction_reason: reason.trim(),
        },
    );
    if (error) return { error: correctionError(error.message) };
    const review = data?.[0] as CorrectionReview | undefined;
    if (!review || !review.review_id || !Array.isArray(review.impact))
        return {
            error: "La revisión no devolvió un impacto válido. Inténtalo de nuevo.",
        };
    return { review };
}

export async function confirmActivityDateCorrectionAction(
    courseId: number,
    evaluationId: number,
    reviewId: string,
) {
    if (
        !Number.isSafeInteger(courseId) ||
        courseId <= 0 ||
        !Number.isSafeInteger(evaluationId) ||
        evaluationId <= 0 ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            reviewId,
        )
    ) {
        return { error: "Revisión inválida. Realiza una nueva revisión." };
    }
    const supabase = await createClient();
    const { error } = await supabase.rpc("confirm_activity_date_correction", {
        target_course_id: courseId,
        target_evaluation_id: evaluationId,
        reviewed_id: reviewId,
    });
    if (error) return { error: correctionError(error.message) };
    revalidatePath("/teacher/grades");
    return { success: true };
}

export async function deleteEvaluationAction(formData: FormData) {
    const evaluationPublicId = String(
        formData.get("evaluation_public_id") ?? "",
    ).trim();

    if (!evaluationPublicId) {
        return { error: "Evaluación inválida" };
    }

    const supabase = await createClient();
    const { error } = await supabase
        .from("course_evaluations")
        .delete()
        .eq("public_id", evaluationPublicId);

    if (error) {
        return { error: "No se pudo eliminar la evaluación" };
    }

    revalidatePath("/teacher/grades");
    return { success: true };
}

export async function saveGroupGradeAction(formData: FormData) {
    const groupId = Number(formData.get("group_id"));
    const evaluationId = Number(formData.get("evaluation_id"));
    const rawGrade = formData.get("grade");
    const feedback = String(formData.get("feedback") ?? "").trim() || null;

    if (!Number.isInteger(groupId) || !Number.isInteger(evaluationId)) {
        return { error: "Datos del grupo o evaluación inválidos" };
    }

    const grade =
        rawGrade === "" || rawGrade === null ? null : Number(rawGrade);

    if (grade !== null && (isNaN(grade) || grade < 0 || grade > 20)) {
        return { error: "La calificación debe estar entre 0 y 20" };
    }

    const supabase = await createClient();

    const { error } = await supabase.from("group_grades").upsert(
        {
            group_id: groupId,
            evaluation_id: evaluationId,
            grade,
            feedback,
            updated_at: new Date().toISOString(),
        },
        {
            onConflict: "group_id,evaluation_id",
        },
    );

    if (error) {
        console.error("Save grade error:", error);
        return { error: "No se pudo guardar la nota" };
    }

    revalidatePath("/teacher/grades");
    revalidatePath("/student");
    return { success: true };
}
