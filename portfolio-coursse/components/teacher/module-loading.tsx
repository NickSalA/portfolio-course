type ModuleLoadingProps = {
	cards?: number;
	showForm?: boolean;
};

export function ModuleLoading({
	cards = 3,
	showForm = true,
}: ModuleLoadingProps) {
	return (
		<main
			className="px-5 py-8 sm:px-8 sm:py-10"
			aria-busy="true"
			aria-live="polite"
		>
			<div className="mx-auto max-w-6xl">
				<span className="sr-only">Cargando contenido…</span>
				<div className="h-3 w-16 animate-pulse rounded-full bg-surface-muted" />
				<div className="mt-4 h-9 w-72 max-w-full animate-pulse rounded-xl bg-surface-muted" />
				<div className="mt-4 h-4 w-md max-w-full animate-pulse rounded-full bg-surface-muted" />

				{showForm && (
					<section className="glass mt-8 rounded-3xl border border-white/25 p-6 sm:p-8">
						<div className="h-6 w-48 animate-pulse rounded-lg bg-surface-muted" />
						<div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem]">
							<div className="h-12 animate-pulse rounded-xl bg-surface-muted" />
							<div className="h-12 animate-pulse rounded-xl bg-surface-muted" />
							<div className="h-20 animate-pulse rounded-xl bg-surface-muted md:col-span-2" />
						</div>
					</section>
				)}

				<div className="mt-6 grid gap-3">
					{Array.from({ length: cards }, (_, index) => (
						<div
							key={index}
							className="glass rounded-2xl border border-white/25 p-5"
						>
							<div className="h-5 w-52 max-w-full animate-pulse rounded-lg bg-surface-muted" />
							<div className="mt-3 h-4 w-32 animate-pulse rounded-full bg-surface-muted" />
						</div>
					))}
				</div>
			</div>
		</main>
	);
}
