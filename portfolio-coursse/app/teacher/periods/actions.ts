"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
	nextAcademicPeriods,
	suggestedAcademicPeriods,
} from "@/lib/academic/calendar";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, name: string) {
	const entry = formData.get(name);
	return typeof entry === "string" ? entry.trim() : "";
}

function redirectWithError(error: string) {
	redirect(`/teacher/periods?error=${error}`);
}

export async function preparePeriod(formData: FormData) {
	const supabase = await createClient();
	const academicYear = Number(value(formData, "academic_year"));
	const semester = Number(value(formData, "semester"));

	if (!Number.isInteger(academicYear) || ![0, 1, 2].includes(semester)) {
		redirectWithError("period-data");
	}

	const { data: currentPeriod } = await supabase
		.from("academic_periods")
		.select("academic_year, semester")
		.eq("status", "current")
		.maybeSingle();

	const allowed = currentPeriod
		? [
				{
					academicYear: currentPeriod.academic_year,
					semester: currentPeriod.semester as 0 | 1 | 2,
				},
				...nextAcademicPeriods({
					academicYear: currentPeriod.academic_year,
					semester: currentPeriod.semester as 0 | 1 | 2,
				}),
			]
		: suggestedAcademicPeriods(new Date());

	if (
		!allowed.some(
			(period) =>
				period.academicYear === academicYear &&
				period.semester === semester,
		)
	) {
		redirectWithError("period-not-available");
	}

	const { error } = await supabase.from("academic_periods").insert({
		academic_year: academicYear,
		semester,
	});

	if (error)
		redirectWithError(
			error.code === "23505" ? "period-duplicate" : "period-create",
		);

	revalidatePath("/teacher");
	revalidatePath("/teacher/periods");
	redirect("/teacher/periods");
}

export async function updatePeriodDates(formData: FormData) {
	const supabase = await createClient();
	const periodId = Number(value(formData, "period_id"));
	const startsAt = value(formData, "starts_at") || null;
	const endsAt = value(formData, "ends_at") || null;
	if (
		!Number.isInteger(periodId) ||
		(startsAt && endsAt && endsAt < startsAt)
	) {
		redirectWithError("period-data");
	}

	const { error } = await supabase
		.from("academic_periods")
		.update({ starts_at: startsAt, ends_at: endsAt })
		.eq("id", periodId)
		.in("status", ["upcoming", "current"]);
	if (error) redirectWithError("period-status");

	revalidatePath("/teacher/periods");
	redirect("/teacher/periods");
}

export async function setPeriodCurrent(formData: FormData) {
	const supabase = await createClient();
	const periodId = Number(value(formData, "period_id"));
	if (!Number.isInteger(periodId)) redirectWithError("period-status");

	const { error } = await supabase.rpc("promote_academic_period", {
		target_period_id: periodId,
	});
	if (error) redirectWithError("period-status");

	revalidatePath("/teacher");
	revalidatePath("/teacher/periods");
	redirect("/teacher/periods");
}
