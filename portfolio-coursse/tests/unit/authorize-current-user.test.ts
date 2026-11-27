import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { authorizeCurrentUser } from "../../lib/academic/authorize-current-user";

function studentClient(syncResults: boolean[]) {
	const pendingResults = [...syncResults];
	const rpc = vi.fn(async (name: string) => ({
		data: name === "has_academic_identity" ? true : pendingResults.shift(),
		error: null,
	}));
	const client = {
		auth: {
			getUser: async () => ({ data: { user: { id: "student", email: "student@example.test" } } }),
		},
		from: () => ({
			select: () => ({
				eq: () => ({ maybeSingle: async () => ({ data: { role: "student" } }) }),
			}),
		}),
		rpc,
	} as unknown as SupabaseClient;
	return { client, rpc };
}

describe("authorizeCurrentUser", () => {
	it("accepts an enrollment confirmed by the second synchronization", async () => {
		const { client, rpc } = studentClient([false, true]);

		await expect(authorizeCurrentUser(client)).resolves.toEqual({ ok: true, role: "student" });
		expect(rpc.mock.calls).toEqual([
			["has_academic_identity"],
			["sync_authorized_student"],
			["sync_authorized_student"],
		]);
	});

	it("denies an absent enrollment after one retry", async () => {
		const { client, rpc } = studentClient([false, false]);

		await expect(authorizeCurrentUser(client)).resolves.toEqual({ ok: false, reason: "not-authorized" });
		expect(rpc).toHaveBeenCalledTimes(3);
	});
});
