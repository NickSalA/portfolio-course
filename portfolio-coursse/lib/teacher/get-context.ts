import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ContextOptions = {
	requestedPeriodPublicId?: string;
	includeHistory?: boolean;
};

// React cache is scoped to a server render. The layout and the route can reuse
// the authenticated teacher and navigation periods without duplicate requests.
export const getTeacherBaseContext = cache(async () => {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect("/login");

	const [{ data: teacher }, { data: availablePeriods }] = await Promise.all([
		supabase
			.from("profiles")
			.select("id, full_name, role")
			.eq("id", user.id)
			.maybeSingle(),
		supabase
			.from("academic_periods")
			.select(
				"id, public_id, code, academic_year, semester, status, starts_at, ends_at",
			)
			.in("status", ["current", "upcoming"])
			.order("academic_year", { ascending: false })
			.order("semester", { ascending: false }),
	]);

	if (teacher?.role !== "teacher") redirect("/student?error=forbidden");

	return {
		supabase,
		user,
		teacher,
		availablePeriods: availablePeriods ?? [],
	};
});

export async function getTeacherContext({
	requestedPeriodPublicId,
	includeHistory = false,
}: ContextOptions = {}) {
	const base = await getTeacherBaseContext();
	const selectedPeriod = requestedPeriodPublicId
		? base.availablePeriods.find(
				(period) => period.public_id === requestedPeriodPublicId,
			)
		: (base.availablePeriods.find(
				(period) => period.status === "current",
			) ?? base.availablePeriods[0]);

	if (!includeHistory) {
		return {
			...base,
			periods: base.availablePeriods,
			selectedPeriod: selectedPeriod ?? null,
		};
	}

	const { data: periods } = await base.supabase
		.from("academic_periods")
		.select(
			"id, public_id, code, academic_year, semester, status, starts_at, ends_at",
		)
		.order("academic_year", { ascending: false })
		.order("semester", { ascending: false });

	return {
		...base,
		periods: periods ?? [],
		selectedPeriod: selectedPeriod ?? null,
	};
}
