import { redirect } from "next/navigation";
import { StudentDashboard } from "@/components/student-portal/student-dashboard";
import { hasAcademicIdentity } from "@/lib/academic/authorize-current-user";
import { STUDENT_GROUP_ERROR_MESSAGES } from "@/lib/student/group-selection";
import { getStudentDashboard } from "@/lib/student/get-dashboard";
import { createClient } from "@/lib/supabase/server";

const studentMessages: Record<string, string> = {
	forbidden: "Tu cuenta no tiene permisos para acceder al panel docente.",
	...STUDENT_GROUP_ERROR_MESSAGES,
};

export default async function StudentPage({
	searchParams,
}: {
	searchParams: Promise<{ error?: string; "selected-group"?: string }>;
}) {
	const { error: errorCode, "selected-group": selectedGroup } =
		await searchParams;
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect("/login");
	if (!(await hasAcademicIdentity(supabase)))
		redirect("/login?error=unauthorized");

	const { data: profile } = await supabase
		.from("profiles")
		.select("full_name, role")
		.eq("id", user.id)
		.maybeSingle();
	if (profile?.role === "teacher") redirect("/teacher");

	const { enrollments, error: dashboardError } = await getStudentDashboard(
		supabase,
		user.id,
	);
	const displayName = profile?.full_name ?? user.email;
	const greetingName = profile?.full_name?.split(" ")[0] ?? "estudiante";

	return (
		<StudentDashboard
			displayName={displayName}
			greetingName={greetingName}
			statusMessage={errorCode ? studentMessages[errorCode] ?? null : null}
			groupUpdated={Boolean(selectedGroup)}
			dashboardError={dashboardError}
			enrollments={enrollments}
		/>
	);
}
