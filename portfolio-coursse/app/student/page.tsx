import { redirect } from "next/navigation";
import { StudentDashboard } from "@/components/student/student-dashboard";
import { getStudentDashboard } from "@/lib/student/get-dashboard";
import { createClient } from "@/lib/supabase/server";

const groupMessages: Record<string, string> = {
	group: "No se pudo seleccionar ese grupo. Inténtalo nuevamente.",
	"group-full": "Ese grupo acaba de llenarse. Elige otro disponible.",
	"group-closed": "La ventana de selección de grupos está cerrada.",
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

	const { data: profile } = await supabase
		.from("profiles")
		.select("full_name, role")
		.eq("id", user.id)
		.maybeSingle();
	if (profile?.role === "teacher") redirect("/teacher");

	const enrollments = await getStudentDashboard(supabase, user.id);
	const displayName = profile?.full_name ?? user.email;
	const greetingName = profile?.full_name?.split(" ")[0] ?? "estudiante";

	return (
		<StudentDashboard
			displayName={displayName}
			greetingName={greetingName}
			groupMessage={errorCode ? groupMessages[errorCode] : null}
			groupUpdated={Boolean(selectedGroup)}
			enrollments={enrollments}
		/>
	);
}
