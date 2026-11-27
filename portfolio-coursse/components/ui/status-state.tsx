import Link from "next/link";
import { GlassPanel } from "@/components/ui/glass-panel";

type StatusStateProps = {
	eyebrow: string;
	title: string;
	description: string;
	isAlert?: boolean;
	onRetry?: () => void;
	retryLabel?: string;
	primaryHref?: string;
	primaryLabel?: string;
	secondaryHref?: string;
	secondaryLabel?: string;
};

/**
 * Shared accessible state panel for error and not-found boundaries.
 */
export function StatusState({
	eyebrow,
	title,
	description,
	isAlert = false,
	onRetry,
	retryLabel = "Intentar de nuevo",
	primaryHref,
	primaryLabel,
	secondaryHref,
	secondaryLabel,
}: StatusStateProps) {
	return (
		<main className="flex min-h-[60dvh] items-center justify-center px-5 py-12 sm:px-8">
			<GlassPanel
				className="w-full max-w-lg"
				role={isAlert ? "alert" : undefined}
			>
				<p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
					{eyebrow}
				</p>
				<h1 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
					{title}
				</h1>
				<p className="mt-3 text-sm leading-6 text-muted">
					{description}
				</p>
				{(onRetry || primaryHref || secondaryHref) && (
					<div className="mt-6 flex flex-wrap items-center gap-3">
						{onRetry && (
							<button
								type="button"
								onClick={onRetry}
								className="inline-flex min-h-10 items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
							>
								{retryLabel}
							</button>
						)}
						{primaryHref && primaryLabel && (
							<Link
								href={primaryHref}
								className={
									onRetry
										? "inline-flex min-h-10 items-center justify-center rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
										: "inline-flex min-h-10 items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
								}
							>
								{primaryLabel}
							</Link>
						)}
						{secondaryHref && secondaryLabel && (
							<Link
								href={secondaryHref}
								className="inline-flex min-h-10 items-center justify-center rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
							>
								{secondaryLabel}
							</Link>
						)}
					</div>
				)}
			</GlassPanel>
		</main>
	);
}
