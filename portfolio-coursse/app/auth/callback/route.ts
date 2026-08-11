import { NextResponse } from "next/server";
import { authorizeCurrentUser } from "@/lib/academic/authorize-current-user";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get("code");
	const requestedNext = requestUrl.searchParams.get("next");
	const next =
		requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
			? requestedNext
			: "/dashboard";

	if (!code) {
		return NextResponse.redirect(
			new URL("/login?error=oauth", requestUrl.origin),
		);
	}

	const supabase = await createClient();
	const { error } = await supabase.auth.exchangeCodeForSession(code);

	if (error) {
		return NextResponse.redirect(
			new URL("/login?error=oauth", requestUrl.origin),
		);
	}

	const authorization = await authorizeCurrentUser(supabase);

	if (!authorization.ok) {
		await supabase.auth.signOut();
		const error =
			authorization.reason === "sync-failed"
				? "authorization"
				: "unauthorized";
		return NextResponse.redirect(
			new URL(`/login?error=${error}`, requestUrl.origin),
		);
	}

	return NextResponse.redirect(new URL(next, requestUrl.origin));
}
