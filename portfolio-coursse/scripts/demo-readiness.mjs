import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseEnvKeys(filePath) {
	if (!fs.existsSync(filePath)) return new Set();
	const keys = new Set();
	const content = fs.readFileSync(filePath, "utf8");
	for (const line of content.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eqIndex = trimmed.indexOf("=");
		if (eqIndex <= 0) continue;
		const key = trimmed.slice(0, eqIndex).trim();
		const value = trimmed.slice(eqIndex + 1).trim();
		if (key && value && value !== '""' && value !== "''") {
			keys.add(key);
		}
	}
	return keys;
}

const envKeys = new Set([
	...parseEnvKeys(path.join(rootDir, ".env")),
	...parseEnvKeys(path.join(rootDir, ".env.local")),
	...Object.keys(process.env).filter((key) => Boolean(process.env[key]?.trim())),
]);

const checks = [
	{
		area: "App / Supabase local",
		required: [
			"NEXT_PUBLIC_SUPABASE_URL",
			"NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
		],
	},
	{
		area: "Google OAuth local (.env)",
		required: ["CLIENT_ID", "CLIENT_SECRET"],
	},
	{
		area: "Correo docente SMTP (BASE-08 / REC-06)",
		required: ["SMTP_USER", "SMTP_PASS"],
	},
];

console.log("=== QA-03 · Verificación de preparación operativa (sin secretos) ===");
for (const group of checks) {
	const missing = group.required.filter((key) => !envKeys.has(key));
	const status = missing.length === 0 ? "LISTO" : `FALTA (${missing.join(", ")})`;
	console.log(`- ${group.area}: ${status}`);
}

const migrationsDir = path.join(rootDir, "supabase", "migrations");
const migrationFiles = fs.existsSync(migrationsDir)
	? fs.readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort()
	: [];
const qaDir = path.join(rootDir, "supabase", "qa");
const qaFiles = fs.existsSync(qaDir)
	? fs.readdirSync(qaDir).filter((file) => file.endsWith(".sql")).sort()
	: [];

console.log(
	`- Migraciones versionadas: ${migrationFiles.length} (última: ${migrationFiles.at(-1) ?? "ninguna"})`,
);
console.log(`- Suites SQL sintéticas disponibles: ${qaFiles.length}`);
console.log(
	"- Siguientes comandos locales: pnpm test | pnpm lint | pnpm typecheck | pnpm build",
);
console.log(
	"- Con Docker/Supabase local activo: supabase db reset --local && pnpm test:db && pnpm dev",
);

