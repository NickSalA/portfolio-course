"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function textValue(value: FormDataEntryValue | null): string {
	return typeof value === "string" ? value.trim() : "";
}

async function findTeacherCourse(coursePublicId: string) {
	const supabase = await createClient();
	const { data: course } = await supabase
		.from("courses")
		.select("id, public_id")
		.eq("public_id", coursePublicId)
		.maybeSingle();

	return { supabase, course };
}

export async function createGroup(formData: FormData) {
	const coursePublicId = textValue(formData.get("course_public_id"));
	const name = textValue(formData.get("name"));
	const capacity = Number(textValue(formData.get("capacity")));
	const path = `/teacher/courses/${coursePublicId}`;

	if (
		!coursePublicId ||
		!name ||
		!Number.isInteger(capacity) ||
		capacity < 1
	) {
		redirect(`${path}?error=group-data`);
	}

	const { supabase, course } = await findTeacherCourse(coursePublicId);
	if (!course) redirect("/teacher/courses");

	const { error } = await supabase.from("groups").insert({
		course_id: course.id,
		name,
		capacity,
	});

	if (error) {
		redirect(
			`${path}?error=${error.code === "23505" ? "group-duplicate" : "group-create"}`,
		);
	}

	revalidatePath(path);
	redirect(path);
}

export async function configureGroupSelection(formData: FormData) {
	const coursePublicId = textValue(formData.get("course_public_id"));
	const opensAt = textValue(formData.get("opens_at"));
	const closesAt = textValue(formData.get("closes_at"));
	const path = `/teacher/courses/${coursePublicId}`;

	if (!coursePublicId || !opensAt || !closesAt || closesAt <= opensAt) {
		redirect(`${path}?error=selection-window`);
	}

	const { supabase, course } = await findTeacherCourse(coursePublicId);
	if (!course) redirect("/teacher/courses");

	const { error } = await supabase
		.from("courses")
		.update({
			group_selection_opens_at: new Date(opensAt).toISOString(),
			group_selection_closes_at: new Date(closesAt).toISOString(),
		})
		.eq("id", course.id);

	if (error) redirect(`${path}?error=selection-save`);

	revalidatePath(path);
	redirect(path);
}
