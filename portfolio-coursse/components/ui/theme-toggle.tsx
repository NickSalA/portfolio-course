"use client";

import { useEffect, useRef, useState } from "react";

export function ThemeToggle() {
	const [dark, setDark] = useState(false);
	const darkRef = useRef(false);

	useEffect(() => {
		const saved = window.localStorage.getItem("theme");
		const prefersDark = window.matchMedia(
			"(prefers-color-scheme: dark)",
		).matches;
		const isDark = saved ? saved === "dark" : prefersDark;
		document.documentElement.classList.toggle("dark", isDark);
		document.documentElement.classList.toggle("light", !isDark);
		darkRef.current = isDark;
	}, []);

	function toggleTheme() {
		const nextDark = !darkRef.current;
		darkRef.current = nextDark;
		document.documentElement.classList.toggle("dark", nextDark);
		document.documentElement.classList.toggle("light", !nextDark);
		window.localStorage.setItem("theme", nextDark ? "dark" : "light");
		setDark(nextDark);
	}

	return (
		<button
			type="button"
			onClick={toggleTheme}
			aria-label={dark ? "Activar tema claro" : "Activar tema oscuro"}
			className="flex h-9 items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 text-xs font-medium text-muted transition hover:border-accent hover:text-foreground"
		>
			<span aria-hidden="true" className="text-sm leading-none">
				{dark ? "☀" : "☾"}
			</span>
			<span>{dark ? "Claro" : "Oscuro"}</span>
		</button>
	);
}
