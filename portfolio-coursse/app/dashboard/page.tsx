import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
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

	if (profile?.role === "teacher") redirect("/teacher/courses");

	return (
		<main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
			<div className="mx-auto max-w-4xl">
				<p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
					Panel
				</p>
				<h1 className="mt-3 text-4xl font-semibold">
					Hola, {profile?.full_name ?? user.email}
				</h1>
				<p className="mt-3 text-slate-300">
					{profile?.role === "teacher"
						? "Aquí podrás gestionar tus cursos, grupos y puntos."
						: "Aquí podrás consultar tus cursos, grupo e historial de puntos."}
				</p>
			</div>
		</main>
	);
}
