"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, name: string) {
	const entry = formData.get(name);
	return typeof entry === "string" ? entry.trim() : "";
}

function groupsPath(period: string) {
	return period
		? `/teacher/groups?period=${encodeURIComponent(period)}`
		: "/teacher/groups";
}

function withError(path: string, error: string) {
	return `${path}${path.includes("?") ? "&" : "?"}error=${error}`;
}

function returnPath(formData: FormData, fallback: string) {
	const requested = value(formData, "return_to");
	return requested.startsWith("/teacher/") && !requested.startsWith("//")
		? requested
		: fallback;
}

async function courseIdFor(
	supabase: Awaited<ReturnType<typeof createClient>>,
	publicId: string,
) {
	const { data: course } = await supabase
		.from("courses")
		.select("id")
		.eq("public_id", publicId)
		.maybeSingle();
	return course?.id ?? null;
}

export async function synchronizeGroups(formData: FormData) {
	const supabase = await createClient();
	const coursePublicId = value(formData, "course_public_id");
	const period = value(formData, "period");
	const capacity = Number(value(formData, "capacity"));
	const path = returnPath(formData, groupsPath(period));

	if (!coursePublicId || !Number.isInteger(capacity) || capacity < 1) {
		redirect(withError(path, "capacity"));
	}

	const courseId = await courseIdFor(supabase, coursePublicId);
	if (!courseId) redirect(path);

	const { error } = await supabase.rpc("synchronize_course_groups", {
		target_course_id: courseId,
		target_capacity: capacity,
	});

	if (error) {
		const code = error.message.includes("capacity_below")
			? "capacity-members"
			: "groups";
		redirect(withError(path, code));
	}

	revalidatePath("/teacher/groups");
	redirect(`${path}${path.includes("?") ? "&" : "?"}refresh=1`);
}

export async function saveSelectionWindow(formData: FormData) {
	const supabase = await createClient();
	const coursePublicId = value(formData, "course_public_id");
	const period = value(formData, "period");
	const path = returnPath(formData, groupsPath(period));
	const opensOn = value(formData, "opens_on");
	const opensAt = value(formData, "opens_at");
	const closesOn = value(formData, "closes_on");
	const closesAt = value(formData, "closes_at");

	if (!coursePublicId || !opensOn || !opensAt || !closesOn || !closesAt) {
		redirect(withError(path, "window"));
	}

	const courseId = await courseIdFor(supabase, coursePublicId);
	if (!courseId) redirect(path);

	const { error } = await supabase.rpc("configure_course_group_selection", {
		target_course_id: courseId,
		opens_on: opensOn,
		opens_at: opensAt,
		closes_on: closesOn,
		closes_at: closesAt,
	});

	if (error) redirect(withError(path, "window"));

	revalidatePath("/teacher/groups");
	redirect(`${path}${path.includes("?") ? "&" : "?"}refresh=1`);
}
