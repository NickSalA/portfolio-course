export default function TeacherClaimsLoading() {
	return (
		<main className="px-5 py-8 sm:px-8 sm:py-10">
			<div className="mx-auto max-w-6xl space-y-6">
				<div className="h-24 animate-pulse rounded-3xl border border-border bg-surface-muted/50" />
				<div className="h-28 animate-pulse rounded-3xl border border-border bg-surface-muted/40" />
				<div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
					<div className="h-72 animate-pulse rounded-3xl border border-border bg-surface-muted/40" />
					<div className="h-72 animate-pulse rounded-3xl border border-border bg-surface-muted/40" />
				</div>
			</div>
		</main>
	);
}

