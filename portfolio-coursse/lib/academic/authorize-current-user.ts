import type { SupabaseClient } from "@supabase/supabase-js";

type AuthorizationResult =
	| { ok: true; role: "teacher" | "student" }
	| { ok: false; reason: "missing-user" | "sync-failed" | "not-authorized" };

export async function hasAcademicIdentity(supabase: SupabaseClient) {
	const { data, error } = await supabase.rpc("has_academic_identity");
	return !error && data === true;
}

export async function authorizeCurrentUser(
	supabase: SupabaseClient,
): Promise<AuthorizationResult> {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user?.email) {
		return { ok: false, reason: "missing-user" };
	}

	if (!(await hasAcademicIdentity(supabase))) {
		return { ok: false, reason: "not-authorized" };
	}

	const { data: profile } = await supabase
		.from("profiles")
		.select("role")
		.eq("id", user.id)
		.maybeSingle();

	if (profile?.role === "teacher") {
		return { ok: true, role: "teacher" };
	}

	const { data: enrolled, error: syncError } = await supabase.rpc(
		"sync_authorized_student",
	);

	if (syncError) {
		return { ok: false, reason: "sync-failed" };
	}

	if (enrolled !== true) {
		return { ok: false, reason: "not-authorized" };
	}

	return { ok: true, role: "student" };
}
