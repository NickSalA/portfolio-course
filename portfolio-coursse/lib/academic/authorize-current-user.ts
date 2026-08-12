import type { SupabaseClient } from "@supabase/supabase-js";

type AuthorizationResult =
	| { ok: true; role: "teacher" | "student" }
	| { ok: false; reason: "missing-user" | "sync-failed" | "not-authorized" };

export async function authorizeCurrentUser(
	supabase: SupabaseClient,
): Promise<AuthorizationResult> {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user?.email) {
		return { ok: false, reason: "missing-user" };
	}

	const { data: profile } = await supabase
		.from("profiles")
		.select("role")
		.eq("id", user.id)
		.maybeSingle();

	if (profile?.role === "teacher") {
		return { ok: true, role: "teacher" };
	}

	const { error: syncError } = await supabase.rpc("sync_authorized_student");

	if (syncError) {
		return { ok: false, reason: "sync-failed" };
	}

	const { data: authorization, error: authorizationError } = await supabase
		.from("authorized_students")
		.select("id")
		.eq("email", user.email.trim().toLowerCase())
		.eq("status", "active")
		.limit(1)
		.maybeSingle();

	if (authorizationError || !authorization) {
		return { ok: false, reason: "not-authorized" };
	}

	return { ok: true, role: "student" };
}
