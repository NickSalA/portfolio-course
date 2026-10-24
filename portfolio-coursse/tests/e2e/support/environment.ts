const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

export function requireLocalSupabase(
	value = process.env.NEXT_PUBLIC_SUPABASE_URL,
): string {
	if (!value) {
		throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for browser tests");
	}

	const url = new URL(value);
	if (!LOCAL_HOSTS.has(url.hostname)) {
		throw new Error(
			`Refusing browser tests against non-local Supabase host: ${url.hostname}`,
		);
	}

	return url.toString();
}
