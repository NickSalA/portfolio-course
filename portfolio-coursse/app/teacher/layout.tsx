import { redirect } from "next/navigation";

import { PeriodContextSwitcher } from "@/components/teacher/period-context-switcher";
import { TeacherSidebar } from "@/components/teacher/teacher-sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect("/login");

	const [{ data: profile }, { data: periods }] = await Promise.all([
		supabase
			.from("profiles")
			.select("role, full_name")
			.eq("id", user.id)
			.maybeSingle(),
		supabase
			.from("academic_periods")
			.select("public_id, code, semester, status")
			.in("status", ["current", "upcoming"])
			.order("academic_year", { ascending: false })
			.order("semester", { ascending: false }),
	]);

	if (profile?.role !== "teacher") redirect("/dashboard?error=forbidden");

	return (
		<div className="min-h-screen overflow-x-hidden bg-background text-foreground md:pl-60">
			<a
				href="#teacher-content"
				className="sr-only z-50 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
			>
				Saltar al contenido
			</a>
			<TeacherSidebar />
			<div className="min-w-0 flex-1">
				<header className="glass sticky top-0 z-20 flex min-h-18 items-center justify-between gap-4 border-b border-white/20 px-5 py-3 shadow-[0_12px_32px_rgb(15_23_42/6%)] sm:px-8">
					<div className="min-w-0">
						<p className="truncate text-sm font-medium">
							{profile.full_name ?? user.email}
						</p>
						<p className="text-xs text-muted">Área docente</p>
					</div>
					<div className="flex items-center gap-3">
						<PeriodContextSwitcher
							periods={(periods ?? []).map((period) => ({
								publicId: period.public_id,
								code: period.code,
								semester: period.semester,
								status: period.status,
							}))}
						/>
						<ThemeToggle />
					</div>
				</header>
				<div id="teacher-content" className="min-w-0">
					{children}
				</div>
			</div>
		</div>
	);
}
