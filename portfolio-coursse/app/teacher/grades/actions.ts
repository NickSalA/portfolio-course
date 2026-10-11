"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addEvaluationAction(formData: FormData) {
	const coursePublicId = String(formData.get("course_public_id") ?? "").trim();
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
		rawGrade === "" || rawGrade === null
			? null
			: Number(rawGrade);

	if (grade !== null && (isNaN(grade) || grade < 0 || grade > 20)) {
		return { error: "La calificación debe estar entre 0 y 20" };
	}

	const supabase = await createClient();

	const { error } = await supabase
		.from("group_grades")
		.upsert(
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
