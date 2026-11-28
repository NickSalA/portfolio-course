"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
	buildTeacherNavHref,
	resolveTeacherNavContext,
} from "@/lib/teacher/navigation";

const modules = [
	{ href: "/teacher", label: "Inicio", symbol: "◫", preserveCourse: false },
	{ href: "/teacher/students", label: "Alumnos", symbol: "◌", preserveCourse: true },
	{ href: "/teacher/points", label: "Puntos", symbol: "+", preserveCourse: true },
	{ href: "/teacher/grades", label: "Notas", symbol: "★", preserveCourse: true },
	{ href: "/teacher/claims", label: "Reclamos", symbol: "!", preserveCourse: true },
];

export function TeacherSidebar({ name }: { name: string }) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const navContext = resolveTeacherNavContext(pathname, searchParams);
	const periodsHref = buildTeacherNavHref("/teacher/periods", navContext);
	const settingsHref = buildTeacherNavHref("/teacher/settings", navContext);
	const periodsActive = pathname.startsWith("/teacher/periods");
	const settingsActive = pathname.startsWith("/teacher/settings");

	return (
		<aside className="glass flex w-full shrink-0 flex-col border-b border-white/20 shadow-[8px_0_30px_rgb(15_23_42/4%)] md:fixed md:inset-y-0 md:left-0 md:z-30 md:h-dvh md:w-60 md:border-b-0 md:border-r">
			<div className="flex h-18 items-center justify-between gap-3 px-5">
				<div className="flex min-w-0 items-center gap-3">
					<span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-sm font-bold text-on-accent">
						{name.slice(0, 1).toUpperCase()}
					</span>
					<span className="min-w-0">
						<strong className="block truncate text-sm tracking-wide">
							{name}
						</strong>
						<small className="block text-[10px] text-muted">
							Docente
						</small>
					</span>
				</div>
				<div className="md:hidden">
					<SignOutButton compact />
				</div>
			</div>
			<nav
				aria-label="Panel docente"
				className="flex gap-1 overflow-x-auto border-t border-border px-3 py-3 md:flex-col md:overflow-visible"
			>
				{modules.map((item) => {
					const active =
						item.href === "/teacher"
							? pathname === item.href
							: pathname.startsWith(item.href);
					return (
						<Link
							key={item.href}
							href={buildTeacherNavHref(
								item.href,
								navContext,
								item.preserveCourse,
							)}
							aria-current={active ? "page" : undefined}
							className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${active ? "border border-white/30 bg-white/20 font-medium text-accent shadow-sm" : "text-muted hover:bg-white/15 hover:text-foreground"}`}
						>
							<span
								aria-hidden="true"
								className="grid size-5 place-items-center font-semibold"
							>
								{item.symbol}
							</span>
							{item.label}
						</Link>
					);
				})}
				<Link
					href={periodsHref}
					aria-current={periodsActive ? "page" : undefined}
					className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:hidden ${periodsActive ? "border border-white/30 bg-white/20 font-medium text-accent shadow-sm" : "text-muted hover:bg-white/15 hover:text-foreground"}`}
				>
					<span aria-hidden="true">◷</span>Periodos
				</Link>
				<Link
					href={settingsHref}
					aria-current={settingsActive ? "page" : undefined}
					className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:hidden ${settingsActive ? "border border-white/30 bg-white/20 font-medium text-accent shadow-sm" : "text-muted hover:bg-white/15 hover:text-foreground"}`}
				>
					<span aria-hidden="true">⚙</span>Ajustes
				</Link>
			</nav>
			<div className="mt-auto hidden border-t border-white/20 p-4 md:block">
				<Link
					href={periodsHref}
					aria-current={periodsActive ? "page" : undefined}
					className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-[background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${periodsActive ? "border border-white/30 bg-white/20 font-medium text-accent shadow-sm" : "text-muted hover:bg-white/15 hover:text-foreground"}`}
				>
					<span aria-hidden="true">◷</span>Periodos
				</Link>
				<Link
					href={settingsHref}
					aria-current={settingsActive ? "page" : undefined}
					className={`mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-[background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${settingsActive ? "border border-white/30 bg-white/20 font-medium text-accent shadow-sm" : "text-muted hover:bg-white/15 hover:text-foreground"}`}
				>
					<span aria-hidden="true">⚙</span>Ajustes
				</Link>
				<div className="mt-3 border-t border-white/20 pt-3">
					<SignOutButton />
				</div>
			</div>
		</aside>
	);
}
