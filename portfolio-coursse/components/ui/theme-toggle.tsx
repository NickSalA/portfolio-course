"use client";

import { useEffect, useRef, useState } from "react";

function MoonIcon() {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			className="size-4.5"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
		>
			<path
				d="M20.5 15.1A8.6 8.6 0 0 1 8.9 3.5 8.6 8.6 0 1 0 20.5 15.1Z"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function SunIcon() {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			className="size-4.5"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
		>
			<circle cx="12" cy="12" r="3.5" />
			<path
				d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4M18.7 18.7l-1.4-1.4M6.7 6.7 5.3 5.3"
				strokeLinecap="round"
			/>
		</svg>
	);
}

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
			className="grid size-9 place-items-center rounded-lg border border-border bg-surface-muted text-sm text-muted transition-[background-color,color,border-color] hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
		>
			{dark ? <SunIcon /> : <MoonIcon />}
		</button>
	);
}
