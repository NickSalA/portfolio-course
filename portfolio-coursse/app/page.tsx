import Link from "next/link";

export default function Home() {
	return (
		<div className="min-h-dvh">
			<header className="border-b border-border">
				<nav
					aria-label="Navegación principal"
					className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5 sm:px-8"
				>
					<Link
						href="/"
						className="font-display text-lg font-semibold tracking-tight transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
					>
						Pedro Eche Querevalu
					</Link>
					<Link
						href="/login"
						className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
					>
						Iniciar sesión
					</Link>
				</nav>
			</header>
		</div>
	);
}
