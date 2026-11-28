"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);

	async function signOut() {
		setLoading(true);
		setError(false);
		const supabase = createClient();
		const { error: signOutError } = await supabase.auth.signOut();
		if (signOutError) {
			setError(true);
			setLoading(false);
			return;
		}
		router.replace("/");
		router.refresh();
	}

	return (
		<div className={compact ? "flex items-center gap-2" : "w-full"}>
			<button
				type="button"
				onClick={signOut}
				disabled={loading}
				aria-busy={loading}
				className={`flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface-muted font-medium text-muted transition-[background-color,color,border-color] hover:border-danger hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60 ${compact ? "px-3 py-2 text-xs whitespace-nowrap" : "w-full px-3 py-2.5 text-sm"}`}
			>
				{loading ? "Saliendo…" : "Cerrar sesión"}
			</button>
			{error && (
				<p role="alert" className="mt-1.5 text-xs text-danger">
					No se pudo cerrar la sesión.
				</p>
			)}
		</div>
	);
}
