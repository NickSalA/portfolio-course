function requiredEnv(name: string, value: string | undefined): string {
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value;
}

export const env = {
	supabase: {
		// Keep these direct references so Next.js can expose public variables to the browser bundle.
		url: requiredEnv(
			"NEXT_PUBLIC_SUPABASE_URL",
			process.env.NEXT_PUBLIC_SUPABASE_URL,
		),
		publishableKey: requiredEnv(
			"NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
			process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
		),
	},
} as const;
