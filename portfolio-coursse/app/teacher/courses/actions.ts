"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, name: string) {
	const entry = formData.get(name);
	return typeof entry === "string" ? entry.trim() : "";
}

function coursePath(period: string) {
	return period
		? `/teacher/courses?period=${encodeURIComponent(period)}`
		: "/teacher/courses";
}

export async function archiveCourse(formData: FormData) {
	const supabase = await createClient();
	const coursePublicId = value(formData, "course_public_id");
	const periodPublicId = value(formData, "period_public_id");
	const path = coursePath(periodPublicId);
	if (!coursePublicId) redirect(path);
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect("/login");
	const { error } = await supabase
		.from("courses")
		.update({ active: false })
		.eq("public_id", coursePublicId)
		.eq("teacher_id", user.id);
	if (error)
		redirect(
			`${path}${path.includes("?") ? "&" : "?"}error=course-archive`,
		);
	revalidatePath("/teacher");
	revalidatePath("/teacher/courses");
	revalidatePath("/teacher/groups");
	revalidatePath("/teacher/students");
	revalidatePath("/teacher/points");
	redirect(path);
}

export async function createCourse(formData: FormData) {
	const supabase = await createClient();
	const name = value(formData, "name");
	const description = value(formData, "description") || null;
	const periodId = Number(value(formData, "period_id"));
	const periodPublicId = value(formData, "period_public_id");
	const workspace = value(formData, "workspace") === "1";
	const path = workspace
		? `/teacher?module=courses&period=${encodeURIComponent(periodPublicId)}`
		: coursePath(periodPublicId);

	if (!name || !Number.isInteger(periodId) || periodId <= 0) {
		redirect(`${path}${path.includes("?") ? "&" : "?"}error=course-data`);
	}

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect("/login");

	const { error } = await supabase.from("courses").insert({
		teacher_id: user.id,
		period_id: periodId,
		name,
		description,
	});

	if (error) {
		const code =
			error.code === "23505" ? "course-duplicate" : "course-create";
		redirect(`${path}${path.includes("?") ? "&" : "?"}error=${code}`);
	}

	revalidatePath("/teacher/courses");
	revalidatePath("/teacher/groups");
	redirect(`${path}${path.includes("?") ? "&" : "?"}refresh=1`);
}
