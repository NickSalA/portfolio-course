"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type LoginCardProps = {
	initialError?: string;
};

const messages = {
	oauth: "No se pudo completar el inicio de sesión con Google.",
	authorization: "No se pudo validar tu autorización académica.",
	unauthorized: "Esta cuenta no tiene acceso a ningún curso autorizado.",
};

function GoogleIcon() {
	return (
		<svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
			<path
				fill="#4285F4"
				d="M21.35 12.23c0-.79-.07-1.55-.23-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42Z"
			/>
			<path
				fill="#34A853"
				d="M12 21.5c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.5Z"
			/>
			<path
				fill="#FBBC05"
				d="M6.54 13.59A5.85 5.85 0 0 1 6.23 12c0-.55.1-1.09.31-1.59V7.88H3.3A9.5 9.5 0 0 0 2.5 12c0 1.48.36 2.88.8 4.12l3.24-2.53Z"
			/>
			<path
				fill="#EA4335"
				d="M12 6.38c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.48 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53c.77-2.31 2.92-4.03 5.46-4.03Z"
			/>
		</svg>
	);
}

export function LoginCard({ initialError }: LoginCardProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(initialError ?? null);

	async function signInWithGoogle() {
		setLoading(true);
		setError(null);

		const supabase = createClient();
		const { error: signInError } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: { redirectTo: `${window.location.origin}/auth/callback` },
		});

		if (signInError) {
			setError(signInError.message);
			setLoading(false);
		}
	}

	return (
		<>
			{error && (
				<p
					role="alert"
					className="mt-6 border border-danger/30 bg-danger-soft p-3 text-sm leading-5 text-danger"
				>
					{messages[error as keyof typeof messages] ?? error}
				</p>
			)}
			<button
				type="button"
				onClick={signInWithGoogle}
				disabled={loading}
				className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground shadow-sm transition hover:border-accent hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
			>
				<GoogleIcon />
				{loading ? "Conectando…" : "Continuar con Google"}
			</button>
		</>
	);
}
