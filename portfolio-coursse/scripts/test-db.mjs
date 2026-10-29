import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const container = "supabase_db_portfolio-course";
const fixtures = fileURLToPath(new URL("../supabase/qa/.", import.meta.url));
const pending = process.argv[2] === "--pending";

if (process.argv.length > 3 || (process.argv[2] && !pending)) {
    console.error("Usage: node scripts/test-db.mjs [--pending]");
    process.exit(1);
}

function docker(args, options = {}) {
    const result = spawnSync("docker", args, { stdio: "inherit", ...options });
    if (result.error) throw result.error;
    if (result.status !== 0) {
        throw new Error(
            `docker ${args[0]} failed (exit ${result.status ?? "unknown"})`,
        );
    }
    return result;
}

let directory;
let failed = false;
try {
    const result = docker(
        ["exec", container, "mktemp", "-d", "/tmp/portfolio-qa.XXXXXXXX"],
        {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "inherit"],
        },
    );
    const temporaryDirectory = result.stdout.trim();
    if (!/^\/tmp\/portfolio-qa\.[A-Za-z0-9]+$/.test(temporaryDirectory)) {
        throw new Error("Unexpected temporary directory returned by Docker");
    }
    directory = temporaryDirectory;
    docker(["cp", `${fixtures}/.`, `${container}:${directory}`]);
    const scripts = pending
        ? ["pending_requirements.sql"]
        : ["current_capabilities.sql", "group_grades_rls.sql"];
    for (const script of scripts) {
        console.log(`\nRunning ${script}`);
        docker([
            "exec",
            container,
            "psql",
            "-X",
            "-U",
            "postgres",
            "-d",
            "postgres",
            "-f",
            `${directory}/${script}`,
        ]);
    }
} catch (error) {
    console.error(`Database tests failed: ${error.message}`);
    console.error(
        "Ensure Docker and the local Supabase stack for portfolio-course are running.",
    );
    failed = true;
} finally {
    if (directory) {
        try {
            docker(["exec", container, "rm", "-rf", "--", directory]);
        } catch (error) {
            console.error(
                `Could not remove temporary test files: ${error.message}`,
            );
            failed = true;
        }
    }
}
if (failed) process.exitCode = 1;
