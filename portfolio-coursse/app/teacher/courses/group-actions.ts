"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateSelectionWindowInput } from "@/lib/teacher/group-config";

function value(formData: FormData, name: string) {
	const entry = formData.get(name);
	return typeof entry === "string" ? entry.trim() : "";
}

function parsePositiveInteger(raw: string): number | null {
	if (!raw) return null;
	const parsed = Number(raw);
	return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
}

function groupsPath(period: string) {
	return period
		? `/teacher?period=${encodeURIComponent(period)}`
		: "/teacher";
}

function returnPath(formData: FormData, fallback: string) {
	const requested = value(formData, "return_to");
	return requested.startsWith("/teacher/") && !requested.startsWith("//")
		? requested
		: fallback;
}

function buildRedirectUrl(
	basePath: string,
	updates: Record<string, string | null>,
) {
	const url = new URL(basePath, "http://localhost");
	url.searchParams.delete("error");
	url.searchParams.delete("saved");
	url.searchParams.delete("retained");
	url.searchParams.delete("refresh");

	for (const [key, paramValue] of Object.entries(updates)) {
		if (paramValue !== null && paramValue !== "") {
			url.searchParams.set(key, paramValue);
		}
	}

	return `${url.pathname}${url.search}`;
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
	const path = returnPath(formData, groupsPath(period));

	if (!coursePublicId) {
		redirect(buildRedirectUrl(path, { error: "course-not-found" }));
	}

	const capacity = parsePositiveInteger(value(formData, "capacity"));
	if (capacity === null) {
		redirect(buildRedirectUrl(path, { error: "capacity" }));
	}

	const rawGroupCount = value(formData, "group_count");
	const groupCount = rawGroupCount
		? parsePositiveInteger(rawGroupCount)
		: null;
	if (rawGroupCount && groupCount === null) {
		redirect(buildRedirectUrl(path, { error: "group-count" }));
	}

	const courseId = await courseIdFor(supabase, coursePublicId);
	if (!courseId) {
		redirect(buildRedirectUrl(path, { error: "course-not-found" }));
	}

	const rpcArgs: {
		target_course_id: number;
		target_capacity: number;
		target_group_count?: number;
	} = {
		target_course_id: courseId,
		target_capacity: capacity,
	};
	if (groupCount !== null) {
		rpcArgs.target_group_count = groupCount;
	}

	const { error } = await supabase.rpc("synchronize_course_groups", rpcArgs);

	if (error) {
		const code = error.message.includes("capacity_below")
			? "capacity-members"
			: error.message.includes("invalid_group_count")
				? "group-count"
				: error.message.includes("invalid_group_capacity")
					? "capacity"
					: error.message.includes("course_not_active")
						? "course-inactive"
						: "groups";
		redirect(buildRedirectUrl(path, { error: code }));
	}

	let retained: string | null = null;
	if (groupCount !== null) {
		const { count } = await supabase
			.from("groups")
			.select("id", { count: "exact", head: true })
			.eq("course_id", courseId);
		if (typeof count === "number" && count > groupCount) {
			retained = String(count - groupCount);
		}
	}

	revalidatePath("/teacher");
	revalidatePath(`/teacher/courses/${coursePublicId}`);
	redirect(buildRedirectUrl(path, { saved: "groups", retained }));
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
	const intent = value(formData, "intent");

	if (!coursePublicId) {
		redirect(buildRedirectUrl(path, { error: "course-not-found" }));
	}

	const validation = validateSelectionWindowInput({
		opensOn,
		opensAt,
		closesOn,
		closesAt,
	});
	if (!validation.ok) {
		redirect(buildRedirectUrl(path, { error: validation.code }));
	}

	const courseId = await courseIdFor(supabase, coursePublicId);
	if (!courseId) {
		redirect(buildRedirectUrl(path, { error: "course-not-found" }));
	}

	const { error } = await supabase.rpc("configure_course_group_selection", {
		target_course_id: courseId,
		opens_on: opensOn,
		opens_at: opensAt,
		closes_on: closesOn,
		closes_at: closesAt,
	});

	if (error) {
		const code = error.message.includes("course_not_active")
			? "course-inactive"
			: error.message.includes("invalid_selection_window")
				? "window-range"
				: "window";
		redirect(buildRedirectUrl(path, { error: code }));
	}

	revalidatePath("/teacher");
	revalidatePath(`/teacher/courses/${coursePublicId}`);
	redirect(
		buildRedirectUrl(path, {
			saved: intent === "reopen" ? "window-reopened" : "window",
		}),
	);
}
