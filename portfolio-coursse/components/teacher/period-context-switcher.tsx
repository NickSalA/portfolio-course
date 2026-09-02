"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type PeriodOption = {
	publicId: string;
	code: string;
	semester: number;
	status: "draft" | "upcoming" | "current" | "closed";
};

export function PeriodContextSwitcher({
	periods,
}: {
	periods: PeriodOption[];
}) {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const selectedPublicId =
		searchParams.get("period") ??
		periods.find((period) => period.status === "current")?.publicId ??
		periods.find((period) => period.status === "upcoming")?.publicId ??
		"";

	function selectPeriod(publicId: string) {
		const params = new URLSearchParams(searchParams.toString());
		params.delete("refresh");
		params.set("period", publicId);
		router.push(`${pathname}?${params.toString()}`);
	}

	if (!periods.length) {
		return (
			<span className="text-sm text-muted">Sin periodo disponible</span>
		);
	}

	return (
		<label className="flex items-center gap-2 text-sm text-muted">
			<span className="hidden sm:inline">Periodo</span>
			<select
				value={selectedPublicId}
				onChange={(event) => selectPeriod(event.target.value)}
				className="max-w-52 rounded-lg border border-border bg-surface-muted px-3 py-2 font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
			>
				{periods.map((period) => (
					<option key={period.publicId} value={period.publicId}>
						{period.code}
					</option>
				))}
			</select>
		</label>
	);
}
