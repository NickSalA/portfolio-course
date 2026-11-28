import fs from "node:fs";
import { defineConfig } from "@playwright/test";
import { requireLocalSupabase } from "./tests/e2e/support/environment";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL && fs.existsSync(".env.local")) {
	process.loadEnvFile(".env.local");
}

requireLocalSupabase();

export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 1 : 0,
	reporter: [["list"], ["html", { open: "never" }]],
	use: {
		baseURL: "http://127.0.0.1:3000",
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
	},
	webServer: {
		command: process.platform === "win32" ? "corepack pnpm dev" : "pnpm dev",
		url: "http://127.0.0.1:3000",
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
});
