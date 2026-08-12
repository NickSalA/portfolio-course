import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getTeacherContext(requestedPeriodPublicId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "teacher") redirect("/dashboard?error=forbidden");

  const { data: periods } = await supabase
    .from("academic_periods")
    .select("id, public_id, code, academic_year, semester, status")
    .order("academic_year", { ascending: false })
    .order("semester", { ascending: false });

  const availablePeriods = periods?.filter(
    (period) => period.status === "current" || period.status === "upcoming",
  ) ?? [];
  const selectedPeriod = requestedPeriodPublicId
    ? availablePeriods.find((period) => period.public_id === requestedPeriodPublicId)
    : availablePeriods.find((period) => period.status === "current") ?? availablePeriods[0];

  return {
    supabase,
    user,
    teacher: profile,
    periods: periods ?? [],
    availablePeriods,
    selectedPeriod: selectedPeriod ?? null,
  };
}
