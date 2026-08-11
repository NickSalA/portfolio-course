import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get("code");
	const next = requestUrl.searchParams.get("next") ?? "/dashboard";

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

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user?.email) {
		await supabase.auth.signOut();
		return NextResponse.redirect(
			new URL("/login?error=unauthorized", requestUrl.origin),
		);
	}

	const email = user.email.trim().toLowerCase();
	const { data: profile } = await supabase
		.from("profiles")
		.select("role")
		.eq("id", user.id)
		.maybeSingle();

	if (profile?.role === "teacher") {
		return NextResponse.redirect(new URL(next, requestUrl.origin));
	}

	const { data: authorizations, error: authorizationError } = await supabase
		.from("authorized_students")
		.select("id")
		.eq("email", email)
		.eq("status", "active")
		.limit(1);

	if (authorizationError || !authorizations?.length) {
		await supabase.auth.signOut();
		return NextResponse.redirect(
			new URL("/login?error=unauthorized", requestUrl.origin),
		);
	}

	return NextResponse.redirect(new URL(next, requestUrl.origin));
}
