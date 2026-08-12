import type { ComponentPropsWithoutRef, ReactNode } from "react";

type GlassPanelProps = ComponentPropsWithoutRef<"section"> & {
	children: ReactNode;
	size?: "default" | "compact";
};

export function GlassPanel({
	children,
	size = "default",
	className = "",
	...props
}: GlassPanelProps) {
	const padding = size === "compact" ? "p-5" : "p-6 sm:p-8";

	return (
		<section
			className={`glass rounded-3xl border border-white/25 shadow-[0_20px_55px_rgb(15_23_42/8%)] ${padding} ${className}`}
			{...props}
		>
			{children}
		</section>
	);
}
