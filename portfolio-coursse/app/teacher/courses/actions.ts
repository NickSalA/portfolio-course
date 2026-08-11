"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function textValue(value: FormDataEntryValue | null): string {
	return typeof value === "string" ? value.trim() : "";
}

function optionalDate(value: FormDataEntryValue | null): string | null {
	const date = textValue(value);
	return date || null;
}

export async function createPeriod(formData: FormData) {
	const supabase = await createClient();
	const academicYear = Number(textValue(formData.get("academic_year")));
	const semester = Number(textValue(formData.get("semester")));
	const startsAt = optionalDate(formData.get("starts_at"));
	const endsAt = optionalDate(formData.get("ends_at"));

	if (
		!Number.isInteger(academicYear) ||
		academicYear < 2000 ||
		![0, 1, 2].includes(semester)
	) {
		redirect("/teacher/courses?error=period-data");
	}

	if (startsAt && endsAt && endsAt < startsAt) {
		redirect("/teacher/courses?error=period-dates");
	}

	const { error } = await supabase.from("academic_periods").insert({
		academic_year: academicYear,
		semester,
		starts_at: startsAt,
		ends_at: endsAt,
	});

	if (error) {
		redirect(
			`/teacher/courses?error=${error.code === "23505" ? "period-duplicate" : "period-create"}`,
		);
	}

	revalidatePath("/teacher/courses");
	redirect("/teacher/courses");
}

export async function createCourse(formData: FormData) {
	const supabase = await createClient();
	const name = textValue(formData.get("name"));
	const description = textValue(formData.get("description")) || null;
	const periodId = Number(textValue(formData.get("period_id")));

	const opensAt = textValue(formData.get("group_selection_opens_at"));
	const closesAt = textValue(formData.get("group_selection_closes_at"));

	if (!name || !Number.isInteger(periodId) || periodId <= 0) {
		redirect("/teacher/courses?error=course-data");
	}

	if (
		(opensAt || closesAt) &&
		(!opensAt || !closesAt || closesAt <= opensAt)
	) {
		redirect("/teacher/courses?error=group-window");
	}

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect("/login");

	const { data: profile } = await supabase
		.from("profiles")
		.select("role")
		.eq("id", user.id)
		.maybeSingle();

	if (profile?.role !== "teacher") {
		redirect("/dashboard?error=forbidden");
	}

	const { error } = await supabase.from("courses").insert({
		teacher_id: user.id,
		period_id: periodId,
		name,
		description,
		group_selection_opens_at: opensAt
			? new Date(opensAt).toISOString()
			: null,
		group_selection_closes_at: closesAt
			? new Date(closesAt).toISOString()
			: null,
	});

	if (error) {
		redirect(
			`/teacher/courses?error=${error.code === "23505" ? "course-duplicate" : "course-create"}`,
		);
	}

	revalidatePath("/teacher/courses");
	redirect("/teacher/courses");
}
