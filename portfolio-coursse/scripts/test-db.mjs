import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const container = process.env.PORTFOLIO_QA_DB_CONTAINER ?? "supabase_db_portfolio-course";
const fixtures = fileURLToPath(new URL("../supabase/qa/.", import.meta.url));
const pending = process.argv[2] === "--pending";
const grp06 = process.argv[2] === "--grp-06";

if (process.argv.length > 3 || (process.argv[2] && !pending && !grp06)) {
    console.error("Usage: node scripts/test-db.mjs [--pending|--grp-06]");
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
        : grp06
          ? ["grp_06_activity_participants.sql"]
          : [
                "current_capabilities.sql",
                "eva_02_point_audit.sql",
                "eva_02_point_replay.sql",
                "group_grades_rls.sql",
                "eva_01_group_grades.sql",
                "eva_04_student_results.sql",
                "base_04_courses_periods.sql",
                "base_05_import_students.sql",
                "base_06_student_enrollment.sql",
                "grp_01_group_configuration.sql",
                "grp_02_group_membership_history.sql",
                "grp_03_group_selection.sql",
                "grp_06_activity_participants.sql",
                "rec_01_claims_model.sql",
                "rec_02_claim_submission.sql",
                "rec_03_claim_transitions.sql",
                "rec_06_claim_notifications.sql",
                "exp_03_course_export.sql",
            ];
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
