"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	async function signOut() {
		setLoading(true);
		const supabase = createClient();
		await supabase.auth.signOut();
		router.replace("/");
		router.refresh();
	}

	return (
		<button
			type="button"
			onClick={signOut}
			disabled={loading}
			className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm font-medium text-muted transition-[background-color,color,border-color] hover:border-danger hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
		>
			{loading ? "Saliendo…" : "Cerrar sesión"}
		</button>
	);
}
