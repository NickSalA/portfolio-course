"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const messages = {
	oauth: "No se pudo completar el inicio de sesión con Google.",
	authorization: "No se pudo validar tu autorización académica.",
	unauthorized: "Tu cuenta no está autorizada en ningún curso.",
};

export default function LoginPage() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function signInWithGoogle() {
		setLoading(true);
		setError(null);

		const supabase = createClient();
		const { error: signInError } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: `${window.location.origin}/auth/callback`,
			},
		});

		if (signInError) {
			setError(signInError.message);
			setLoading(false);
		}
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-white">
			<section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur">
				<p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
					Aula · Portafolio
				</p>
				<h1 className="text-3xl font-semibold tracking-tight">
					Iniciar sesión
				</h1>
				<p className="mt-3 text-sm leading-6 text-slate-300">
					Accede con tu cuenta institucional de Google. Los alumnos
					deben haber sido cargados previamente por su docente.
				</p>

				{error && (
					<p className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">
						{messages[error as keyof typeof messages] ?? error}
					</p>
				)}

				<button
					type="button"
					onClick={signInWithGoogle}
					disabled={loading}
					className="mt-8 flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 font-medium text-slate-900 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{loading ? "Conectando…" : "Continuar con Google"}
				</button>
			</section>
		</main>
	);
}
