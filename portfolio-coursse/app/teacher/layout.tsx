import { PeriodContextSwitcher } from "@/components/teacher/shell/period-context-switcher";

import { TeacherSidebar } from "@/components/teacher/shell/teacher-sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getTeacherBaseContext } from "@/lib/teacher/get-context";

export default async function TeacherLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { user, teacher, availablePeriods } = await getTeacherBaseContext();

	return (
		<div className="min-h-screen overflow-x-hidden bg-background text-foreground md:pl-60">
			<a
				href="#teacher-content"
				className="sr-only z-50 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
			>
				Saltar al contenido
			</a>
			<TeacherSidebar name={teacher.full_name ?? user.email} />
			<div className="min-w-0 flex-1">
				<header className="glass sticky top-0 z-20 flex min-h-18 items-center justify-end gap-4 border-b border-white/20 px-5 py-3 shadow-[0_12px_32px_rgb(15_23_42/6%)] sm:px-8">
					<div className="flex items-center gap-3">
						<PeriodContextSwitcher
							periods={availablePeriods.map((period) => ({
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
