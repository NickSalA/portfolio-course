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
				className="sr-only z-50 rounded-lg bg-accent text-sm font-semibold text-on-accent focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:inline-flex focus:min-h-10 focus:items-center focus:px-4 focus:py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
				<div
					id="teacher-content"
					tabIndex={-1}
					className="min-w-0 scroll-mt-24 outline-none"
				>
					{children}
				</div>
			</div>
		</div>
	);
}
