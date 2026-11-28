import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import { createClient, type User } from "@supabase/supabase-js";
import {
	expect,
	test,
	type Browser,
	type BrowserContext,
	type Locator,
	type Page,
} from "@playwright/test";
import * as XLSX from "xlsx";
import { requireLocalSupabase } from "./support/environment";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL && fs.existsSync(".env.local")) {
	process.loadEnvFile(".env.local");
}

const SUPABASE_URL = requireLocalSupabase().replace(/\/$/, "");
const SUPABASE_SECRET_KEY =
	process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_JWT_SECRET =
	process.env.SUPABASE_JWT_SECRET ??
	"super-secret-jwt-token-with-at-least-32-characters-long";
const DB_CONTAINER =
	process.env.PORTFOLIO_QA_DB_CONTAINER ?? "supabase_db_portfolio-course";
const AUTH_COOKIE_NAME = `sb-${new URL(SUPABASE_URL).hostname.split(".")[0]}-auth-token`;
const MAX_COOKIE_CHUNK_SIZE = 3180;

if (!SUPABASE_SECRET_KEY) {
	throw new Error(
		"SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) is required for E2E fixtures",
	);
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
	auth: { autoRefreshToken: false, persistSession: false },
});

type AuthCookieEntry = {
	name: string;
	value: string;
	domain: string;
	path: string;
	httpOnly: boolean;
	secure: boolean;
	sameSite: "Lax";
};

type SyntheticActor = {
	id: string;
	email: string;
	fullName: string;
	cookies: AuthCookieEntry[];
};

type Qa01Fixture = {
	runId: string;
	periodId: number;
	periodPublicId: string;
	periodCode: string;
	courseId: number;
	coursePublicId: string;
	courseName: string;
	group1Id: number;
	group2Id: number;
	group3Id: number;
	evalT1Id: number;
	evalT2Id: number;
	evalT3Id: number;
	teacher: SyntheticActor;
	student1: SyntheticActor;
	student2: SyntheticActor;
	student3: SyntheticActor;
	createdUserIds: string[];
};

function runPsql(sql: string): string {
	return execFileSync(
		"docker",
		[
			"exec",
			"-i",
			DB_CONTAINER,
			"psql",
			"-X",
			"-v",
			"ON_ERROR_STOP=1",
			"-U",
			"postgres",
			"-d",
			"postgres",
		],
		{
			input: sql,
			encoding: "utf8",
			stdio: ["pipe", "pipe", "pipe"],
		},
	);
}

function sqlLiteral(value: string): string {
	return `'${value.replaceAll("'", "''")}'`;
}

function signOAuthJwt(user: User, sessionId: string): {
	accessToken: string;
	expiresAt: number;
} {
	const nowSec = Math.floor(Date.now() / 1000);
	const expiresAt = nowSec + 3600;
	const header = Buffer.from(
		JSON.stringify({ alg: "HS256", typ: "JWT" }),
	).toString("base64url");
	const payload = Buffer.from(
		JSON.stringify({
			iss: `${SUPABASE_URL}/auth/v1`,
			sub: user.id,
			aud: "authenticated",
			exp: expiresAt,
			iat: nowSec,
			email: user.email,
			phone: "",
			app_metadata: { provider: "google", providers: ["google"] },
			user_metadata: user.user_metadata ?? {},
			role: "authenticated",
			aal: "aal1",
			amr: [{ method: "oauth", timestamp: nowSec }],
			session_id: sessionId,
			is_anonymous: false,
		}),
	).toString("base64url");
	const signature = crypto
		.createHmac("sha256", SUPABASE_JWT_SECRET)
		.update(`${header}.${payload}`)
		.digest("base64url");

	return {
		accessToken: `${header}.${payload}.${signature}`,
		expiresAt,
	};
}

function createSsrSessionCookies(
	user: User,
	accessToken: string,
	expiresAt: number,
	refreshToken: string,
): AuthCookieEntry[] {
	const sessionPayload = JSON.stringify({
		access_token: accessToken,
		token_type: "bearer",
		expires_in: 3600,
		expires_at: expiresAt,
		refresh_token: refreshToken,
		user,
	});
	const encoded = `base64-${Buffer.from(sessionPayload, "utf8").toString("base64url")}`;
	const urlEncoded = encodeURIComponent(encoded);
	const chunks: Array<{ name: string; value: string }> = [];

	if (urlEncoded.length <= MAX_COOKIE_CHUNK_SIZE) {
		chunks.push({ name: AUTH_COOKIE_NAME, value: encoded });
	} else {
		let remaining = urlEncoded;
		let index = 0;
		while (remaining.length > 0) {
			let head = remaining.slice(0, MAX_COOKIE_CHUNK_SIZE);
			const lastPercent = head.lastIndexOf("%");
			if (lastPercent > MAX_COOKIE_CHUNK_SIZE - 3) {
				head = head.slice(0, lastPercent);
			}
			let decodedHead = "";
			while (head.length > 0) {
				try {
					decodedHead = decodeURIComponent(head);
					break;
				} catch {
					head = head.slice(0, head.length - 3);
				}
			}
			chunks.push({
				name: `${AUTH_COOKIE_NAME}.${index}`,
				value: decodedHead,
			});
			remaining = remaining.slice(head.length);
			index += 1;
		}
	}

	return chunks.map((chunk) => ({
		name: chunk.name,
		value: chunk.value,
		domain: new URL(SUPABASE_URL).hostname,
		path: "/",
		httpOnly: false,
		secure: false,
		sameSite: "Lax",
	}));
}

async function createSyntheticActor(
	email: string,
	fullName: string,
	role: "teacher" | "student",
): Promise<SyntheticActor> {
	const { data, error } = await adminClient.auth.admin.createUser({
		email,
		email_confirm: true,
		user_metadata: { full_name: fullName, email_verified: true },
		app_metadata: { provider: "google", providers: ["google"] },
	});
	if (error || !data.user) {
		throw new Error(`Failed to create user ${email}: ${error?.message}`);
	}
	const user = data.user;

	const { error: profileError } = await adminClient
		.from("profiles")
		.update({ role, full_name: fullName })
		.eq("id", user.id);
	if (profileError) {
		throw new Error(
			`Failed to update profile for ${email}: ${profileError.message}`,
		);
	}

	const sessionId = crypto.randomUUID();
	const refreshToken = crypto.randomBytes(24).toString("hex");
	const identityData = JSON.stringify({
		email,
		email_verified: true,
		sub: user.id,
		full_name: fullName,
	});

	runPsql(`
begin;
delete from auth.identities where user_id = ${sqlLiteral(user.id)}::uuid and provider <> 'google';
insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  ${sqlLiteral(user.id)},
  ${sqlLiteral(user.id)}::uuid,
  ${sqlLiteral(identityData)}::jsonb,
  'google',
  now(),
  now(),
  now()
)
on conflict (provider_id, provider) do update
set identity_data = excluded.identity_data,
    updated_at = now();

insert into auth.sessions (id, user_id, created_at, updated_at, aal, not_after)
values (
  ${sqlLiteral(sessionId)}::uuid,
  ${sqlLiteral(user.id)}::uuid,
  now(),
  now(),
  'aal1',
  now() + interval '2 hours'
);

insert into auth.mfa_amr_claims (id, session_id, created_at, updated_at, authentication_method)
values (
  gen_random_uuid(),
  ${sqlLiteral(sessionId)}::uuid,
  now(),
  now(),
  'oauth'
);

insert into auth.refresh_tokens (instance_id, token, user_id, revoked, created_at, updated_at, session_id)
values (
  '00000000-0000-0000-0000-000000000000'::uuid,
  ${sqlLiteral(refreshToken)},
  ${sqlLiteral(user.id)},
  false,
  now(),
  now(),
  ${sqlLiteral(sessionId)}::uuid
);
commit;
`);

	const { accessToken, expiresAt } = signOAuthJwt(user, sessionId);
	const cookies = createSsrSessionCookies(
		user,
		accessToken,
		expiresAt,
		refreshToken,
	);

	return { id: user.id, email, fullName, cookies };
}

async function setupQa01Fixture(): Promise<Qa01Fixture> {
	const runId = crypto.randomUUID().slice(0, 8);
	const createdUserIds: string[] = [];
	let courseId = 0;

	try {
		const { data: currentPeriod, error: periodError } = await adminClient
			.from("academic_periods")
			.select("id, public_id, code")
			.eq("status", "current")
			.limit(1)
			.single();
		if (periodError || !currentPeriod) {
			throw new Error(
				`Current academic period not found: ${periodError?.message}`,
			);
		}

		const teacher = await createSyntheticActor(
			`qa01-${runId}-docente@example.test`,
			"Docente QA01",
			"teacher",
		);
		createdUserIds.push(teacher.id);

		const student1 = await createSyntheticActor(
			`qa01-${runId}-alumno1@example.test`,
			"Alumno Uno",
			"student",
		);
		createdUserIds.push(student1.id);

		const student2 = await createSyntheticActor(
			`qa01-${runId}-alumno2@example.test`,
			"Alumno Dos",
			"student",
		);
		createdUserIds.push(student2.id);

		const student3 = await createSyntheticActor(
			`qa01-${runId}-alumno3@example.test`,
			"Alumno Tres",
			"student",
		);
		createdUserIds.push(student3.id);

		const nowMs = Date.now();
		const opensAt = new Date(nowMs - 60 * 60 * 1000).toISOString();
		const closesAt = new Date(nowMs + 48 * 60 * 60 * 1000).toISOString();
		const courseName = `Curso QA01 ${runId}`;

		const { data: course, error: courseError } = await adminClient
			.from("courses")
			.insert({
				teacher_id: teacher.id,
				period_id: currentPeriod.id,
				name: courseName,
				active: true,
				group_capacity: 2,
				group_selection_opens_at: opensAt,
				group_selection_closes_at: closesAt,
			})
			.select("id, public_id, name")
			.single();
		if (courseError || !course) {
			throw new Error(`Failed to create course: ${courseError?.message}`);
		}
		courseId = course.id;

		const { data: groups, error: groupsError } = await adminClient
			.from("groups")
			.insert([
				{ course_id: course.id, name: "Grupo 1", position: 1, capacity: 2 },
				{ course_id: course.id, name: "Grupo 2", position: 2, capacity: 3 },
				{ course_id: course.id, name: "Grupo 3", position: 3, capacity: 1 },
			])
			.select("id, position")
			.order("position");
		if (groupsError || !groups || groups.length !== 3) {
			throw new Error(`Failed to create groups: ${groupsError?.message}`);
		}
		const [group1, group2, group3] = groups;

		const { data: authRows, error: authError } = await adminClient
			.from("authorized_students")
			.insert([
				{
					course_id: course.id,
					email: student1.email,
					full_name: student1.fullName,
					status: "active",
				},
				{
					course_id: course.id,
					email: student2.email,
					full_name: student2.fullName,
					status: "active",
				},
				{
					course_id: course.id,
					email: student3.email,
					full_name: student3.fullName,
					status: "active",
				},
			])
			.select("id, email");
		if (authError || !authRows || authRows.length !== 3) {
			throw new Error(
				`Failed to create authorized_students: ${authError?.message}`,
			);
		}
		const auth1 = authRows.find((r) => r.email === student1.email)!;
		const auth2 = authRows.find((r) => r.email === student2.email)!;
		const auth3 = authRows.find((r) => r.email === student3.email)!;

		const { data: evaluations, error: evalError } = await adminClient
			.from("course_evaluations")
			.select("id, name, position")
			.eq("course_id", course.id)
			.order("position");
		if (evalError || !evaluations || evaluations.length < 3) {
			throw new Error(`Failed to fetch seeded evaluations: ${evalError?.message}`);
		}
		const evalT1 = evaluations.find((e) => e.name === "T1")!;
		const evalT2 = evaluations.find((e) => e.name === "T2")!;
		const evalT3 = evaluations.find((e) => e.name === "T3")!;

		// Seed enrollment timeline, activity dates, and confirmed historical grades.
		// Alumno 1: [t_start, t_move1) in Grupo 1 (T1=16), [t_move1, t_move2) in Grupo 2 (T2=0, T3=null), [t_move2, null) in Grupo 1 (before Q-E04 moves back to Grupo 2).
		// Alumno 2: [t_start, t_move1) in Grupo 1 (T1=16), [t_move1, null) in Grupo 2 (T2=0, T3=null).
		// Alumno 3: [t_start, null) in Grupo 3 (T1=14, T2=16, T3=17).
		runPsql(`
begin;
do $$
declare
  v_course_id bigint := ${course.id};
  v_teacher_id uuid := ${sqlLiteral(teacher.id)}::uuid;
  v_g1 bigint := ${group1.id};
  v_g2 bigint := ${group2.id};
  v_g3 bigint := ${group3.id};
  v_t1 bigint := ${evalT1.id};
  v_t2 bigint := ${evalT2.id};
  v_t3 bigint := ${evalT3.id};
  v_e1 bigint;
  v_e2 bigint;
  v_e3 bigint;
  v_t_start timestamptz := now() - interval '5 days';
  v_t_t1 timestamptz := now() - interval '4 days';
  v_t_move1 timestamptz := now() - interval '3 days';
  v_t_t2 timestamptz := now() - interval '2 days';
  v_t_t3 timestamptz := now() - interval '1 day';
  v_t_move2 timestamptz := now() - interval '12 hours';
begin
  insert into public.course_students (course_id, student_id, authorized_student_id, group_id, status)
  values (v_course_id, ${sqlLiteral(student1.id)}::uuid, ${auth1.id}, v_g1, 'active')
  returning id into v_e1;

  insert into public.course_students (course_id, student_id, authorized_student_id, group_id, status)
  values (v_course_id, ${sqlLiteral(student2.id)}::uuid, ${auth2.id}, v_g2, 'active')
  returning id into v_e2;

  insert into public.course_students (course_id, student_id, authorized_student_id, group_id, status)
  values (v_course_id, ${sqlLiteral(student3.id)}::uuid, ${auth3.id}, v_g3, 'active')
  returning id into v_e3;

  delete from academic_access.group_membership_history where enrollment_id in (v_e1, v_e2, v_e3);

  insert into academic_access.group_membership_history
    (enrollment_id, course_id, student_id, membership_state, group_id, valid_from, valid_until)
  values
    (v_e1, v_course_id, ${sqlLiteral(student1.id)}::uuid, 'grouped', v_g1, v_t_start, v_t_move1),
    (v_e1, v_course_id, ${sqlLiteral(student1.id)}::uuid, 'grouped', v_g2, v_t_move1, v_t_move2),
    (v_e1, v_course_id, ${sqlLiteral(student1.id)}::uuid, 'grouped', v_g1, v_t_move2, null),
    (v_e2, v_course_id, ${sqlLiteral(student2.id)}::uuid, 'grouped', v_g1, v_t_start, v_t_move1),
    (v_e2, v_course_id, ${sqlLiteral(student2.id)}::uuid, 'grouped', v_g2, v_t_move1, null),
    (v_e3, v_course_id, ${sqlLiteral(student3.id)}::uuid, 'grouped', v_g3, v_t_start, null);

  perform set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true);
  perform set_config('request.jwt.claim.sub', v_teacher_id::text, true);
  execute 'set local role authenticated';

  perform public.set_activity_performed_at(v_course_id, v_t1, v_t_t1);
  perform public.set_activity_performed_at(v_course_id, v_t2, v_t_t2);
  perform public.set_activity_performed_at(v_course_id, v_t3, v_t_t3);

  perform public.save_group_grade(v_course_id, v_t1, v_g1, 16, 0);
  perform public.save_group_grade(v_course_id, v_t2, v_g2, 0, 0);
  perform public.save_group_grade(v_course_id, v_t1, v_g3, 14, 0);
  perform public.save_group_grade(v_course_id, v_t2, v_g3, 16, 0);
  perform public.save_group_grade(v_course_id, v_t3, v_g3, 17, 0);

  execute 'reset role';
end $$;
commit;
`);

		const { error: pointsError } = await adminClient
			.from("point_transactions")
			.insert([
				{
					authorized_student_id: auth1.id,
					points: 3,
					reason: "Participación destacada QA01",
					created_by: teacher.id,
					is_voided: false,
				},
				{
					authorized_student_id: auth1.id,
					points: -1,
					reason: "Penalidad anulada QA01",
					created_by: teacher.id,
					is_voided: true,
					voided_at: new Date().toISOString(),
					voided_by: teacher.id,
					void_reason: "Registro duplicado QA01",
				},
				{
					authorized_student_id: auth3.id,
					points: 2,
					reason: "Bono QA01",
					created_by: teacher.id,
					is_voided: false,
				},
			]);
		if (pointsError) {
			throw new Error(`Failed to insert point transactions: ${pointsError.message}`);
		}

		return {
			runId,
			periodId: currentPeriod.id,
			periodPublicId: currentPeriod.public_id,
			periodCode: currentPeriod.code,
			courseId: course.id,
			coursePublicId: course.public_id,
			courseName: course.name,
			group1Id: group1.id,
			group2Id: group2.id,
			group3Id: group3.id,
			evalT1Id: evalT1.id,
			evalT2Id: evalT2.id,
			evalT3Id: evalT3.id,
			teacher,
			student1,
			student2,
			student3,
			createdUserIds,
		};
	} catch (err) {
		await cleanupSyntheticResources({
			runId,
			courseId: courseId || undefined,
			userIds: createdUserIds,
		});
		throw err;
	}
}

async function cleanupSyntheticResources({
	runId,
	courseId,
	userIds,
}: {
	runId: string;
	courseId?: number;
	userIds: string[];
}): Promise<void> {
	const userIdsSql =
		userIds.length > 0
			? userIds.map((id) => `${sqlLiteral(id)}::uuid`).join(", ")
			: null;

	try {
		runPsql(`
begin;
set local session_replication_role = replica;
${
	courseId
		? `
delete from public.claim_notifications
where claim_id in (select id from public.claims where course_id = ${courseId});

delete from public.claims where course_id = ${courseId};

delete from academic_access.group_grade_corrections
where grade_id in (
  select gg.id
  from public.group_grades gg
  join public.groups g on g.id = gg.group_id
  where g.course_id = ${courseId}
);

delete from academic_access.group_grade_participants
where evaluation_id in (select id from public.course_evaluations where course_id = ${courseId});

delete from public.group_grades
where evaluation_id in (select id from public.course_evaluations where course_id = ${courseId});

delete from academic_access.activity_date_corrections
where review_id in (select id from academic_access.activity_date_reviews where course_id = ${courseId});

delete from academic_access.activity_date_reviews where course_id = ${courseId};

delete from academic_access.group_membership_history where course_id = ${courseId};

delete from public.point_transactions
where authorized_student_id in (select id from public.authorized_students where course_id = ${courseId});

delete from public.course_students where course_id = ${courseId};
delete from public.authorized_students where course_id = ${courseId};
delete from public.course_evaluations where course_id = ${courseId};
delete from public.groups where course_id = ${courseId};
delete from public.courses where id = ${courseId};
`
		: ""
}
${
	userIdsSql
		? `delete from public.profiles where id in (${userIdsSql});`
		: ""
}
commit;
`);
	} catch (cleanupErr) {
		console.error("SQL cleanup warning:", cleanupErr);
	}

	for (const userId of userIds) {
		await adminClient.auth.admin.deleteUser(userId).catch(() => undefined);
	}

	// Ensure no synthetic @example.test user rows remain for this runId.
	try {
		runPsql(`
delete from auth.users where email like ${sqlLiteral(`qa01-${runId}-%@example.test`)};
`);
	} catch {
		// Ignore if already removed by adminClient.
	}
}

async function openAuthenticatedContext(
	browser: Browser,
	actor: SyntheticActor,
	viewport = { width: 1280, height: 800 },
): Promise<{ context: BrowserContext; page: Page }> {
	const context = await browser.newContext({ viewport });
	await context.addCookies(actor.cookies);
	const page = await context.newPage();
	return { context, page };
}

async function tabUntilFocused(
	page: Page,
	target: Locator,
	maxTabs = 80,
): Promise<void> {
	for (let i = 0; i < maxTabs; i += 1) {
		const isFocused = await target.evaluate(
			(el) => document.activeElement === el,
		);
		if (isFocused) return;
		await page.keyboard.press("Tab");
	}
	const activeDesc = await page.evaluate(() => {
		const el = document.activeElement;
		return el
			? `${el.tagName}#${el.id}.${el.className} (${el.textContent?.trim().slice(0, 40)})`
			: "none";
	});
	throw new Error(
		`Could not reach target element via Tab within ${maxTabs} presses. Last active: ${activeDesc}`,
	);
}

async function expectVisibleFocusStyle(locator: Locator): Promise<void> {
	const style = await locator.evaluate((el) => {
		const cs = getComputedStyle(el);
		return {
			outlineStyle: cs.outlineStyle,
			outlineWidth: Number.parseFloat(cs.outlineWidth),
			boxShadow: cs.boxShadow,
		};
	});
	const hasRing = style.boxShadow !== "none" && style.boxShadow.length > 0;
	const hasOutline = style.outlineStyle !== "none" && style.outlineWidth > 0;
	expect(
		hasRing || hasOutline,
		`Expected visible focus ring or outline, got ${JSON.stringify(style)}`,
	).toBe(true);
}

async function expectFocusNotObscured(page: Page): Promise<void> {
	const metrics = await page.evaluate(() => {
		const active = document.activeElement as HTMLElement | null;
		if (!active) return null;
		const header = document.querySelector("header");
		const headerRect = header?.getBoundingClientRect() ?? null;
		const rect = active.getBoundingClientRect();
		return {
			tag: active.tagName,
			id: active.id,
			rect: {
				top: rect.top,
				bottom: rect.bottom,
				left: rect.left,
				right: rect.right,
			},
			headerBottom: headerRect ? headerRect.bottom : 0,
			headerIsSticky: header
				? getComputedStyle(header).position === "sticky" ||
					getComputedStyle(header).position === "fixed"
				: false,
			viewportHeight: window.innerHeight,
		};
	});
	expect(metrics).not.toBeNull();
	if (!metrics) return;
	if (metrics.headerIsSticky) {
		expect(
			metrics.rect.top,
			`Focused ${metrics.tag}#${metrics.id} top (${metrics.rect.top}) obscured by sticky header bottom (${metrics.headerBottom})`,
		).toBeGreaterThanOrEqual(metrics.headerBottom - 2);
	}
	expect(metrics.rect.bottom).toBeLessThanOrEqual(metrics.viewportHeight + 2);
}

async function measureComputedContrast(
	page: Page,
	selectors: Array<{ label: string; selector: string }>,
): Promise<Array<{ label: string; ratio: number; fg: string; bg: string }>> {
	return page.evaluate((items) => {
		const canvas = document.createElement("canvas");
		canvas.width = 1;
		canvas.height = 1;
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("2D canvas unavailable");

		function parseCssColor(cssColor: string): [number, number, number, number] {
			ctx!.clearRect(0, 0, 1, 1);
			ctx!.fillStyle = "#000000";
			ctx!.fillStyle = cssColor;
			const normalized = ctx!.fillStyle;
			if (normalized.startsWith("#")) {
				const hex = normalized.slice(1);
				return [
					Number.parseInt(hex.slice(0, 2), 16),
					Number.parseInt(hex.slice(2, 4), 16),
					Number.parseInt(hex.slice(4, 6), 16),
					1,
				];
			}
			const match =
				/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)$/.exec(
					normalized,
				);
			if (match) {
				return [
					Number(match[1]),
					Number(match[2]),
					Number(match[3]),
					match[4] !== undefined ? Number(match[4]) : 1,
				];
			}
			ctx!.fillRect(0, 0, 1, 1);
			const data = ctx!.getImageData(0, 0, 1, 1).data;
			return [data[0], data[1], data[2], data[3] / 255];
		}

		function composite(
			fg: [number, number, number, number],
			bg: [number, number, number],
		): [number, number, number] {
			const a = fg[3];
			return [
				Math.round(fg[0] * a + bg[0] * (1 - a)),
				Math.round(fg[1] * a + bg[1] * (1 - a)),
				Math.round(fg[2] * a + bg[2] * (1 - a)),
			];
		}

		function resolveEffectiveBackground(el: Element): [number, number, number] {
			const layers: Array<[number, number, number, number]> = [];
			let curr: Element | null = el;
			while (curr) {
				const bgStr = getComputedStyle(curr).backgroundColor;
				const parsed = parseCssColor(bgStr);
				if (parsed[3] > 0) {
					layers.unshift(parsed);
				}
				curr = curr.parentElement;
			}
			const rootBg = parseCssColor(
				getComputedStyle(document.documentElement).getPropertyValue(
					"--background",
				) || "#ffffff",
			);
			let acc: [number, number, number] = [rootBg[0], rootBg[1], rootBg[2]];
			for (const layer of layers) {
				acc = composite(layer, acc);
			}
			return acc;
		}

		function luminance(rgb: [number, number, number]): number {
			const lin = rgb.map((c) => {
				const s = c / 255;
				return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
			});
			return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
		}

		function ratioFor(
			fg: [number, number, number],
			bg: [number, number, number],
		): number {
			const l1 = luminance(fg);
			const l2 = luminance(bg);
			return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
		}

		const results: Array<{
			label: string;
			ratio: number;
			fg: string;
			bg: string;
		}> = [];

		for (const item of items) {
			const el = document.querySelector(item.selector);
			if (!el) continue;
			const bgRgb = resolveEffectiveBackground(el);
			const fgParsed = parseCssColor(getComputedStyle(el).color);
			const fgRgb = composite(fgParsed, bgRgb);
			results.push({
				label: item.label,
				ratio: ratioFor(fgRgb, bgRgb),
				fg: `rgb(${fgRgb.join(",")})`,
				bg: `rgb(${bgRgb.join(",")})`,
			});
		}
		return results;
	}, selectors);
}

async function auditTargetSizes(page: Page, routeLabel: string): Promise<void> {
	const violations = await page.evaluate(() => {
		const nodes = Array.from(
			document.querySelectorAll("button, summary, select"),
		);
		const bad: Array<{ text: string; width: number; height: number }> = [];
		for (const node of nodes) {
			const el = node as HTMLElement;
			const cs = getComputedStyle(el);
			if (cs.display === "none" || cs.visibility === "hidden") continue;
			const rect = el.getBoundingClientRect();
			if (rect.width === 0 && rect.height === 0) continue;
			// Skip elements hidden inside closed <details>
			const parentDetails = el.closest("details");
			if (
				parentDetails &&
				!parentDetails.open &&
				el.tagName.toLowerCase() !== "summary"
			) {
				continue;
			}
			if (rect.width < 23.5 || rect.height < 23.5) {
				bad.push({
					text:
						el.getAttribute("aria-label") ||
						el.textContent?.trim() ||
						el.tagName,
					width: Math.round(rect.width * 10) / 10,
					height: Math.round(rect.height * 10) / 10,
				});
			}
		}
		return bad;
	});
	expect(
		violations,
		`Target size < 24x24 on ${routeLabel}: ${JSON.stringify(violations)}`,
	).toEqual([]);
}

test.describe.serial("QA-01 Integrated Accessibility & End-to-End Journeys", () => {
	let fixture: Qa01Fixture;

	test.beforeAll(async () => {
		fixture = await setupQa01Fixture();
	});

	test.afterAll(async () => {
		if (fixture) {
			await cleanupSyntheticResources({
				runId: fixture.runId,
				courseId: fixture.courseId,
				userIds: fixture.createdUserIds,
			});
		}
	});

	test("Q-E01: /login keyboard flow, ThemeToggle, visible focus, and ?error=unauthorized alert", async ({
		page,
	}) => {
		test.setTimeout(90_000);
		await page.goto("/login");

		const toggle = page.getByRole("button", {
			name: /Activar tema (oscuro|claro)/i,
		});
		await tabUntilFocused(page, toggle, 10);
		await expectVisibleFocusStyle(toggle);

		const initialPressed = await toggle.getAttribute("aria-pressed");
		await page.keyboard.press("Enter");
		await expect(toggle).toHaveAttribute(
			"aria-pressed",
			initialPressed === "true" ? "false" : "true",
		);
		await expect(page.locator("html")).toHaveClass(
			initialPressed === "true" ? /light/ : /dark/,
		);

		// Toggle back to light for predictable state
		await page.keyboard.press("Enter");
		await expect(toggle).toHaveAttribute("aria-pressed", initialPressed ?? "false");

		const googleButton = page.getByRole("button", {
			name: /Continuar con Google/i,
		});
		await tabUntilFocused(page, googleButton, 10);
		await expectVisibleFocusStyle(googleButton);
		expect(
			await googleButton.evaluate((el) => getComputedStyle(el).cursor),
		).toBe("pointer");

		await page.goto("/login?error=unauthorized");
		await expect(page.locator('main [role="alert"]')).toContainText(
			"Esta cuenta no tiene acceso a ningún curso autorizado.",
		);
	});

	test("Q-E02: Skip links and single visible <main> landmark in /student and /teacher", async ({
		browser,
	}) => {
		test.setTimeout(90_000);
		const studentSession = await openAuthenticatedContext(
			browser,
			fixture.student1,
		);
		try {
			await studentSession.page.goto("/student", {
				waitUntil: "networkidle",
			});
			await expect(
				studentSession.page.getByRole("heading", { level: 1 }),
			).toBeVisible();
			await studentSession.page.keyboard.press("Tab");
			const skipStudent = studentSession.page.locator(
				'a[href="#student-content"]',
			);
			await expect(skipStudent).toBeFocused();
			const skipBox = await skipStudent.boundingBox();
			expect(skipBox).not.toBeNull();
			expect(skipBox!.width).toBeGreaterThan(40);
			expect(skipBox!.height).toBeGreaterThan(20);
			await studentSession.page.keyboard.press("Enter");
			const activeId = await studentSession.page.evaluate(
				() => document.activeElement?.id,
			);
			expect(activeId).toBe("student-content");
			await expect(
				studentSession.page.locator("main:visible"),
			).toHaveCount(1);
		} finally {
			await studentSession.context.close();
		}

		const teacherSession = await openAuthenticatedContext(
			browser,
			fixture.teacher,
		);
		try {
			await teacherSession.page.goto("/teacher", {
				waitUntil: "networkidle",
			});
			await expect(
				teacherSession.page.getByRole("heading", { level: 1 }),
			).toBeVisible();
			await teacherSession.page.keyboard.press("Tab");
			const skipTeacher = teacherSession.page.locator(
				'a[href="#teacher-content"]',
			);
			await expect(skipTeacher).toBeFocused();
			const skipBox = await skipTeacher.boundingBox();
			expect(skipBox).not.toBeNull();
			expect(skipBox!.width).toBeGreaterThan(40);
			expect(skipBox!.height).toBeGreaterThan(20);
			await teacherSession.page.keyboard.press("Enter");
			const activeId = await teacherSession.page.evaluate(
				() => document.activeElement?.id,
			);
			expect(activeId).toBe("teacher-content");
			await expect(
				teacherSession.page.locator("main:visible"),
			).toHaveCount(1);
		} finally {
			await teacherSession.context.close();
		}
	});

	test("Q-E03: Teacher discovery /teacher -> /teacher/courses/[id] with keyboard, menu Esc, and dialog aria-labelledby", async ({
		browser,
	}) => {
		test.setTimeout(90_000);
		const { context, page } = await openAuthenticatedContext(
			browser,
			fixture.teacher,
		);
		try {
			await page.goto("/teacher");
			const courseCard = page.getByRole("link", {
				name: new RegExp(fixture.courseName),
			});
			await tabUntilFocused(page, courseCard, 40);
			await expectVisibleFocusStyle(courseCard);
			await page.keyboard.press("Enter");
			await page.waitForURL(
				new RegExp(`/teacher/courses/${fixture.coursePublicId}`),
			);

			const moreSummary = page.locator(
				'summary[aria-label="Más acciones del curso"]',
			);
			await tabUntilFocused(page, moreSummary, 30);
			await expectVisibleFocusStyle(moreSummary);
			await page.keyboard.press("Enter");
			await expect(
				page.getByRole("button", { name: "Ocultar curso" }),
			).toBeVisible();
			await page.keyboard.press("Escape");
			await expect(
				page.getByRole("button", { name: "Ocultar curso" }),
			).not.toBeVisible();
			await expect(moreSummary).toBeFocused();

			const windowBtn = page.getByRole("button", {
				name: /Ampliar o editar ventana|Configurar ventana/i,
			});
			await tabUntilFocused(page, windowBtn, 30);
			await page.keyboard.press("Enter");
			const openDialog = page.locator("dialog[open]");
			await expect(openDialog).toBeVisible();
			const labelledBy = await openDialog.getAttribute("aria-labelledby");
			expect(labelledBy).toBeTruthy();
			await expect(page.locator(`#${labelledBy}`)).toBeVisible();
			await page.keyboard.press("Escape");
			await expect(openDialog).toHaveCount(0);
			await expect(windowBtn).toBeFocused();

			const group1Btn = page.getByRole("button", {
				name: /Grupo 1.*Ver integrantes/i,
			});
			expect(
				await group1Btn.evaluate((el) => getComputedStyle(el).cursor),
			).toBe("pointer");
			await tabUntilFocused(page, group1Btn, 20);
			await page.keyboard.press("Enter");
			const membersDialog = page.locator("dialog[open]");
			await expect(membersDialog).toBeVisible();
			const membersLabelId =
				await membersDialog.getAttribute("aria-labelledby");
			expect(membersLabelId).toBeTruthy();
			await expect(page.locator(`#${membersLabelId}`)).toHaveText(
				"Grupo 1",
			);
			await page.keyboard.press("Escape");
			await expect(membersDialog).toHaveCount(0);
			await expect(group1Btn).toBeFocused();
		} finally {
			await context.close();
		}
	});

	test("Q-E04: Student group selection & change via keyboard on /student, persistence, and full group disabled", async ({
		browser,
	}) => {
		test.setTimeout(90_000);
		const { context, page } = await openAuthenticatedContext(
			browser,
			fixture.student1,
		);
		try {
			await page.goto("/student");
			const card = page
				.locator("article")
				.filter({ hasText: fixture.courseName });
			await expect(card).toContainText("Abierta");
			await expect(card).toContainText("(Lima)");
			await expect(card).toContainText("Confirmado");
			await expect(
				card.locator('li[aria-current="true"]'),
			).toContainText("Grupo 1");

			const fullGroupItem = card
				.locator("li")
				.filter({ hasText: "Grupo 3" });
			await expect(fullGroupItem).toContainText("Sin cupo");
			const fullButton = fullGroupItem.getByRole("button");
			await expect(fullButton).toBeDisabled();

			const switchToGroup2Btn = card.getByRole("button", {
				name: `Cambiar a este grupo: Grupo 2 en ${fixture.courseName}`,
			});
			await tabUntilFocused(page, switchToGroup2Btn, 30);
			await expectVisibleFocusStyle(switchToGroup2Btn);
			await page.keyboard.press("Enter");

			await expect(card.locator('[role="status"]')).toContainText(
				"Te cambiaste a Grupo 2. Tu selección ya quedó confirmada.",
			);

			await page.reload();
			const cardAfter = page
				.locator("article")
				.filter({ hasText: fixture.courseName });
			await expect(
				cardAfter.locator('li[aria-current="true"]'),
			).toContainText("Grupo 2");
			await expect(cardAfter).toContainText("Grupo 2");
			await expect(cardAfter).toContainText("Confirmado");
		} finally {
			await context.close();
		}
	});

	test("Q-E05: Teacher discovers /teacher/grades via sidebar and EvaluationManagerDialog traps focus", async ({
		browser,
	}) => {
		test.setTimeout(90_000);
		const { context, page } = await openAuthenticatedContext(
			browser,
			fixture.teacher,
		);
		try {
			await page.goto("/teacher");
			const gradesNavLink = page
				.getByRole("navigation", { name: "Panel docente" })
				.getByRole("link", { name: /Notas/ });
			await tabUntilFocused(page, gradesNavLink, 20);
			await page.keyboard.press("Enter");
			await page.waitForURL(/\/teacher\/grades/);

			const courseSelectLink = page.getByRole("link", {
				name: new RegExp(fixture.courseName),
			});
			await tabUntilFocused(page, courseSelectLink, 40);
			await page.keyboard.press("Enter");
			await page.waitForURL(
				new RegExp(
					`/teacher/grades\\?.*course=${fixture.coursePublicId}`,
				),
			);

			const manageBtn = page.getByRole("button", {
				name: "Gestionar Evaluaciones",
			});
			await tabUntilFocused(page, manageBtn, 40);
			await page.keyboard.press("Enter");

			const dialog = page.locator("dialog[open]");
			await expect(dialog).toBeVisible();
			const labelledBy = await dialog.getAttribute("aria-labelledby");
			expect(labelledBy).toBeTruthy();

			// Verify native showModal() focus trap: Tab and Shift+Tab never leave <dialog>
			for (let i = 0; i < 12; i += 1) {
				await page.keyboard.press("Tab");
				const inside = await dialog.evaluate((d) =>
					d.contains(document.activeElement),
				);
				expect(
					inside,
					`Focus escaped dialog on Tab step ${i + 1}`,
				).toBe(true);
			}
			for (let i = 0; i < 4; i += 1) {
				await page.keyboard.press("Shift+Tab");
				const inside = await dialog.evaluate((d) =>
					d.contains(document.activeElement),
				);
				expect(
					inside,
					`Focus escaped dialog on Shift+Tab step ${i + 1}`,
				).toBe(true);
			}

			await page.keyboard.press("Escape");
			await expect(dialog).toHaveCount(0);
			await expect(manageBtn).toBeFocused();
		} finally {
			await context.close();
		}
	});

	test("Q-E06: Teacher grades matrix 0 vs Pendiente, and motivated correction with Enter & alert focus", async ({
		browser,
	}) => {
		test.setTimeout(90_000);
		const { context, page } = await openAuthenticatedContext(
			browser,
			fixture.teacher,
		);
		try {
			await page.goto(
				`/teacher/grades?period=${fixture.periodPublicId}&course=${fixture.coursePublicId}`,
			);

			const g2t2Input = page.getByRole("textbox", {
				name: "Grupo 2, T2",
			});
			await expect(g2t2Input).toHaveValue("0");
			const g2t2Cell = g2t2Input.locator("xpath=ancestor::td[1]");
			await expect(g2t2Cell).toContainText("Calificada");

			const g2t3Input = page.getByRole("textbox", {
				name: "Grupo 2, T3",
			});
			await expect(g2t3Input).toHaveValue("");
			await expect(g2t3Input).toHaveAttribute("placeholder", "—");
			const g2t3Cell = g2t3Input.locator("xpath=ancestor::td[1]");
			await expect(g2t3Cell).toContainText("Pendiente");

			// Edit Grupo 3, T1 (14 -> 15) so Alumno Uno/Dos T1=16, T2=0, T3=null remain intact
			const g3t1Input = page.getByRole("textbox", {
				name: "Grupo 3, T1",
			});
			await expect(g3t1Input).toHaveValue("14");
			await g3t1Input.focus();
			await g3t1Input.fill("15");
			await page.keyboard.press("Enter");

			const dialog = page.locator("dialog[open]");
			await expect(dialog).toBeVisible();
			await expect(dialog).toHaveAttribute(
				"aria-labelledby",
				"grade-correction-title",
			);

			const confirmBtn = dialog.getByRole("button", {
				name: "Confirmar corrección",
			});
			await tabUntilFocused(page, confirmBtn, 10);
			await page.keyboard.press("Enter");

			await expect(dialog.getByRole("alert")).toContainText(
				"Indica un motivo de corrección",
			);
			const reasonTextarea = dialog.locator('textarea[name="reason"]');
			await expect(reasonTextarea).toBeFocused();

			await reasonTextarea.fill("Ajuste de rúbrica QA-01");
			await tabUntilFocused(page, confirmBtn, 10);
			await page.keyboard.press("Enter");

			await expect(dialog).toHaveCount(0);
			const g3t1Cell = g3t1Input.locator("xpath=ancestor::td[1]");
			await expect(g3t1Cell).toContainText("Corregida · rev. 2");
			await expect(g3t1Input).toHaveValue("15");
		} finally {
			await context.close();
		}
	});

	test("Q-E07: Student historical grades (T1=16 badge, T2=0 Calificada · Nota base, T3 Pendiente) and separate +3 points", async ({
		browser,
	}) => {
		test.setTimeout(90_000);
		const { context, page } = await openAuthenticatedContext(
			browser,
			fixture.student1,
		);
		try {
			await page.goto("/student");
			const card = page
				.locator("article")
				.filter({ hasText: fixture.courseName });

			await expect(card).toContainText("Saldo+3");
			await expect(card).not.toContainText("Promedio ajustado");

			const t1Row = card.locator("li").filter({ hasText: "T1" });
			await expect(t1Row).toContainText("16");
			await expect(t1Row).toContainText("Grupo histórico (actual: Grupo 2)");

			const t2Row = card.locator("li").filter({ hasText: "T2" });
			await expect(t2Row).toContainText("0");
			await expect(t2Row).toContainText("Calificada · Nota base");

			const t3Row = card.locator("li").filter({ hasText: "T3" });
			await expect(t3Row).toContainText("Pendiente");

			const pointsSummary = card.locator("summary", {
				hasText: "Ver historial de puntos (1)",
			});
			await expect(pointsSummary).toBeVisible();
			await pointsSummary.focus();
			await page.keyboard.press("Enter");
			await expect(card).toContainText("Participación destacada QA01");
			await expect(card).not.toContainText("Penalidad anulada QA01");
		} finally {
			await context.close();
		}
	});

	test("Q-E08: Student submits group claim (T2=0) and individual point claim (+3) purely via keyboard", async ({
		browser,
	}) => {
		test.setTimeout(90_000);
		const { context, page } = await openAuthenticatedContext(
			browser,
			fixture.student1,
		);
		try {
			await page.goto("/student");
			const card = page
				.locator("article")
				.filter({ hasText: fixture.courseName });

			const groupClaimBtn = card.getByRole("button", {
				name: `Presentar reclamo sobre T2 de Grupo 2 en ${fixture.courseName}`,
			});
			await tabUntilFocused(page, groupClaimBtn, 40);
			await page.keyboard.press("Enter");

			const dialog = page.locator("dialog[open]");
			await expect(dialog).toBeVisible();
			const textarea = dialog.locator('textarea[name="reason"]');
			await expect(textarea).toBeFocused();

			// Escape closes and restores focus
			await page.keyboard.press("Escape");
			await expect(dialog).toHaveCount(0);
			await expect(groupClaimBtn).toBeFocused();

			// Reopen, submit empty -> role="alert" + aria-invalid="true"
			await page.keyboard.press("Enter");
			await expect(dialog).toBeVisible();
			const submitBtn = dialog.getByRole("button", {
				name: "Enviar reclamo",
			});
			await tabUntilFocused(page, submitBtn, 10);
			await page.keyboard.press("Enter");

			await expect(dialog.getByRole("alert")).toBeVisible();
			await expect(textarea).toHaveAttribute("aria-invalid", "true");
			await expect(textarea).toBeFocused();

			await textarea.fill("Solicitamos revisar la nota 0 asignada en T2.");
			await tabUntilFocused(page, submitBtn, 10);
			await page.keyboard.press("Enter");

			await expect(dialog).toHaveCount(0);
			await expect(card.locator('[role="status"]')).toContainText(
				"Reclamo registrado en estado Pendiente",
			);
			await expect(
				card.getByRole("link", { name: /Reclamo: Pendiente · por Tú/i }),
			).toBeVisible();

			// Submit private point transaction claim (+3) via keyboard
			const pointsSummary = card.locator("summary", {
				hasText: "Ver historial de puntos (1)",
			});
			await tabUntilFocused(page, pointsSummary, 25);
			await page.keyboard.press("Enter");

			const pointClaimBtn = card.getByRole("button", {
				name: `Presentar reclamo sobre movimiento de +3 puntos en ${fixture.courseName}`,
			});
			await tabUntilFocused(page, pointClaimBtn, 10);
			await page.keyboard.press("Enter");

			await expect(dialog).toBeVisible();
			await expect(textarea).toBeFocused();
			await textarea.fill("Consultar detalle del bono +3.");
			await tabUntilFocused(page, submitBtn, 10);
			await page.keyboard.press("Enter");

			await expect(dialog).toHaveCount(0);
			await expect(
				card.locator("li", { hasText: "Privado entre tú y el docente" }),
			).toContainText("Movimiento +3");
		} finally {
			await context.close();
		}
	});

	test("Q-E09: Shared uniqueness for Alumno 2 and keyboard #claim-<id> anchor jump resetting active filter", async ({
		browser,
	}) => {
		test.setTimeout(90_000);
		// Alumno 2 sees Alumno 1's group claim without duplicate button, and does not see private point claim
		const s2Session = await openAuthenticatedContext(
			browser,
			fixture.student2,
		);
		try {
			await s2Session.page.goto("/student");
			const card2 = s2Session.page
				.locator("article")
				.filter({ hasText: fixture.courseName });
			await expect(
				card2.getByRole("link", {
					name: /Reclamo: Pendiente · por Alumno Uno/i,
				}),
			).toBeVisible();
			await expect(
				card2.getByRole("button", {
					name: /Presentar reclamo sobre T2/i,
				}),
			).toHaveCount(0);
			await expect(card2).toContainText("1 registrados");
			await expect(card2).not.toContainText("Consultar detalle del bono");
		} finally {
			await s2Session.context.close();
		}

		// Alumno 1 sets filter to Respondido (0), then activates Reclamo: Pendiente link via Enter
		const s1Session = await openAuthenticatedContext(
			browser,
			fixture.student1,
		);
		try {
			await s1Session.page.goto("/student");
			const card1 = s1Session.page
				.locator("article")
				.filter({ hasText: fixture.courseName });
			const respondedFilter = card1.getByRole("button", {
				name: /Respondido \(0\)/,
			});
			await respondedFilter.click();
			await expect(respondedFilter).toHaveAttribute(
				"aria-pressed",
				"true",
			);
			await expect(card1).toContainText(
				"No hay reclamos en estado Respondido.",
			);

			const claimJumpLink = card1.getByRole("link", {
				name: /Reclamo: Pendiente · por Tú/i,
			});
			const href = await claimJumpLink.getAttribute("href");
			expect(href).toMatch(/^#claim-/);
			await claimJumpLink.focus();
			await s1Session.page.keyboard.press("Enter");

			const allFilter = card1.getByRole("button", {
				name: /Todos \(2\)/,
			});
			await expect(allFilter).toHaveAttribute("aria-pressed", "true");
			const targetClaimId = href!.slice(1);
			await expect(s1Session.page.locator(`#${targetClaimId}`)).toBeFocused();
			await expectFocusNotObscured(s1Session.page);
		} finally {
			await s1Session.context.close();
		}
	});

	test("Q-E10: Teacher claims inbox navigation by sidebar, filters, focus transfer to <article>, and Iniciar revisión", async ({
		browser,
	}) => {
		test.setTimeout(90_000);
		const { context, page } = await openAuthenticatedContext(
			browser,
			fixture.teacher,
		);
		try {
			await page.goto("/teacher");
			const claimsNavLink = page
				.getByRole("navigation", { name: "Panel docente" })
				.getByRole("link", { name: /Reclamos/ });
			await tabUntilFocused(page, claimsNavLink, 20);
			await page.keyboard.press("Enter");
			await page.waitForURL(/\/teacher\/claims/);

			const groupFilter = page.getByRole("button", {
				name: /Nota grupal \(/,
			});
			await expect(
				page.getByRole("button", { name: /Todos \(/ }),
			).toHaveAttribute("aria-pressed", "true");
			await tabUntilFocused(page, groupFilter, 25);
			await page.keyboard.press("Enter");
			await expect(groupFilter).toHaveAttribute("aria-pressed", "true");

			const claimBtn = page
				.locator('section[aria-label="Lista de reclamos"] button')
				.filter({ hasText: fixture.courseName })
				.filter({ hasText: "T2" })
				.first();
			await tabUntilFocused(page, claimBtn, 20);
			await page.keyboard.press("Enter");

			const detailArticle = page.locator("article[aria-labelledby]");
			await expect(detailArticle).toBeFocused();
			await expect(detailArticle).toContainText(
				"0 (Calificada — nota grupal base)",
			);

			const startReviewBtn = detailArticle.getByRole("button", {
				name: "Iniciar revisión",
			});
			await tabUntilFocused(page, startReviewBtn, 15);
			await page.keyboard.press("Enter");

			await expect(detailArticle).toContainText("En revisión");
			await expect(
				detailArticle.locator('textarea[name="teacher_response"]'),
			).toBeVisible();
		} finally {
			await context.close();
		}
	});

	test("Q-E11: Teacher empty-response validation, final closed response, and zero reply/reopen controls", async ({
		browser,
	}) => {
		test.setTimeout(90_000);
		const teacherSession = await openAuthenticatedContext(
			browser,
			fixture.teacher,
		);
		try {
			await teacherSession.page.goto(
				`/teacher/claims?period=${fixture.periodPublicId}&course=${fixture.coursePublicId}`,
			);
			const claimBtn = teacherSession.page
				.locator('section[aria-label="Lista de reclamos"] button')
				.filter({ hasText: "T2" })
				.first();
			await claimBtn.focus();
			await teacherSession.page.keyboard.press("Enter");

			const detailArticle = teacherSession.page.locator(
				"article[aria-labelledby]",
			);
			const submitResponseBtn = detailArticle.getByRole("button", {
				name: "Enviar respuesta final",
			});
			await tabUntilFocused(teacherSession.page, submitResponseBtn, 15);
			await teacherSession.page.keyboard.press("Enter");

			await expect(
				teacherSession.page.locator('main [role="alert"]'),
			).toContainText("Ingresa una respuesta motivada");
			const textarea = detailArticle.locator(
				'textarea[name="teacher_response"]',
			);
			await expect(textarea).toHaveAttribute("aria-invalid", "true");
			await expect(textarea).toBeFocused();

			await textarea.fill(
				"Se revisó la evidencia de T2 y se mantiene la calificación base de 0.",
			);
			await tabUntilFocused(teacherSession.page, submitResponseBtn, 10);
			await teacherSession.page.keyboard.press("Enter");

			await expect(detailArticle).toContainText("Respondido");
			await expect(detailArticle).toContainText(
				"Este reclamo quedó cerrado de forma definitiva y no admite réplicas ni reapertura.",
			);
			await expect(
				detailArticle.getByRole("link", {
					name: /Abrir Notas del curso/,
				}),
			).toBeVisible();
			await expect(
				detailArticle.locator(
					'textarea, button:has-text("Reabrir"), button:has-text("Editar"), button:has-text("Responder")',
				),
			).toHaveCount(0);
		} finally {
			await teacherSession.context.close();
		}

		// Verify read-only closed state & unchanged grade/points on /student
		const studentSession = await openAuthenticatedContext(
			browser,
			fixture.student1,
		);
		try {
			await studentSession.page.goto("/student");
			const card = studentSession.page
				.locator("article")
				.filter({ hasText: fixture.courseName });
			const groupClaimItem = card
				.locator("li")
				.filter({ hasText: "T2 · Grupo 2" });
			await expect(groupClaimItem).toContainText("Respondido");
			await expect(groupClaimItem).toContainText(
				"Respuesta final del docente",
			);
			await expect(groupClaimItem).toContainText(
				"Caso cerrado de forma definitiva (solo lectura, sin réplica ni reapertura).",
			);
			await expect(
				groupClaimItem.locator("button, textarea"),
			).toHaveCount(0);
			await expect(card).toContainText("Saldo+3");
		} finally {
			await studentSession.context.close();
		}
	});

	test("Q-E12: Keyboard XLSX export in /teacher/grades and /teacher/courses/[id], verifying workbook contents", async ({
		browser,
	}) => {
		test.setTimeout(90_000);
		const { context, page } = await openAuthenticatedContext(
			browser,
			fixture.teacher,
		);
		try {
			await page.goto(
				`/teacher/grades?period=${fixture.periodPublicId}&course=${fixture.coursePublicId}`,
			);
			const exportBtn = page.getByRole("button", {
				name: `Exportar resultados del curso ${fixture.courseName} en formato Excel (.xlsx)`,
			});
			const describedById = await exportBtn.getAttribute("aria-describedby");
			expect(describedById).toBeTruthy();
			await expect(page.locator(`#${describedById}`)).toContainText(
				"Incluye nota base histórica, puntos y promedio ajustado sin modificar saldos.",
			);

			await tabUntilFocused(page, exportBtn, 40);
			const [downloadGrades] = await Promise.all([
				page.waitForEvent("download"),
				page.keyboard.press("Enter"),
			]);
			await expect(page.locator('[role="status"]').first()).toContainText(
				"Exportación descargada",
			);

			const filePath = await downloadGrades.path();
			expect(filePath).toBeTruthy();
			const buffer = fs.readFileSync(filePath!);
			const workbook = XLSX.read(buffer, { type: "buffer" });
			const sheet = workbook.Sheets["Resultados Curso"];
			expect(sheet).toBeTruthy();

			const matrix = XLSX.utils.sheet_to_json<(string | number | null)[]>(
				sheet,
				{ header: 1, defval: null },
			);
			const headers = matrix[0] as string[];
			const t1Col = headers.indexOf("T1");
			const t2Col = headers.indexOf("T2");
			const t3Col = headers.indexOf("T3");
			const baseCol = headers.indexOf("Promedio base");
			const balCol = headers.indexOf("Saldo");
			const adjCol = headers.indexOf("Promedio ajustado");
			expect(t1Col).toBeGreaterThan(-1);
			expect(t2Col).toBeGreaterThan(-1);
			expect(t3Col).toBeGreaterThan(-1);
			expect(baseCol).toBeGreaterThan(-1);
			expect(balCol).toBeGreaterThan(-1);
			expect(adjCol).toBeGreaterThan(-1);

			const s1RowIndex = matrix.findIndex(
				(row) => row[1] === fixture.student1.email,
			);
			expect(s1RowIndex).toBeGreaterThan(0);
			const t2CellAddr = XLSX.utils.encode_cell({ r: s1RowIndex, c: t2Col });
			const t3CellAddr = XLSX.utils.encode_cell({ r: s1RowIndex, c: t3Col });
			const balCellAddr = XLSX.utils.encode_cell({
				r: s1RowIndex,
				c: balCol,
			});
			expect(sheet[t2CellAddr]?.t).toBe("n");
			expect(sheet[t2CellAddr]?.v).toBe(0);
			expect(sheet[t3CellAddr]?.v).toBeUndefined();
			expect(sheet[balCellAddr]?.v).toBe(3);

			const s3RowIndex = matrix.findIndex(
				(row) => row[1] === fixture.student3.email,
			);
			expect(s3RowIndex).toBeGreaterThan(0);
			expect(matrix[s3RowIndex][t1Col]).toBe(15);
			expect(matrix[s3RowIndex][t2Col]).toBe(16);
			expect(matrix[s3RowIndex][t3Col]).toBe(17);
			expect(matrix[s3RowIndex][baseCol]).toBe(16);
			expect(matrix[s3RowIndex][balCol]).toBe(2);
			expect(matrix[s3RowIndex][adjCol]).toBe(16.67);

			// Also verify keyboard download on /teacher/courses/[id]
			await page.goto(
				`/teacher/courses/${fixture.coursePublicId}?period=${fixture.periodPublicId}`,
			);
			const courseExportBtn = page.getByRole("button", {
				name: `Exportar resultados del curso ${fixture.courseName} en formato Excel (.xlsx)`,
			});
			await tabUntilFocused(page, courseExportBtn, 30);
			const [downloadCourse] = await Promise.all([
				page.waitForEvent("download"),
				page.keyboard.press("Enter"),
			]);
			const courseFilePath = await downloadCourse.path();
			expect(courseFilePath).toBeTruthy();
			const wb2 = XLSX.read(fs.readFileSync(courseFilePath!), {
				type: "buffer",
			});
			expect(wb2.Sheets["Resultados Curso"]).toBeTruthy();
		} finally {
			await page.close().catch(() => undefined);
			await context.close();
		}
	});

	test("Q-E13: Teacher points dialog keyboard open/Escape and Anular button >= 24x24 with focus-visible", async ({
		browser,
	}) => {
		test.setTimeout(90_000);
		const { context, page } = await openAuthenticatedContext(
			browser,
			fixture.teacher,
		);
		try {
			await page.goto(
				`/teacher/points?period=${fixture.periodPublicId}&course=${fixture.coursePublicId}`,
			);
			const studentRow = page
				.locator("article")
				.filter({ hasText: fixture.student1.email });
			const openDialogBtn = studentRow.getByRole("button", {
				name: "Ver movimientos",
			});
			await tabUntilFocused(page, openDialogBtn, 40);
			await page.keyboard.press("Enter");

			const dialog = page.locator("dialog[open]");
			await expect(dialog).toBeVisible();
			const labelledBy = await dialog.getAttribute("aria-labelledby");
			expect(labelledBy).toBeTruthy();
			await expect(page.locator(`#${labelledBy}`)).toContainText(
				"Alumno Uno",
			);

			const voidBtn = dialog.getByRole("button", {
				name: "Anular movimiento de puntos",
			});
			await expect(voidBtn).toBeVisible();
			const box = await voidBtn.boundingBox();
			expect(box).not.toBeNull();
			expect(box!.width).toBeGreaterThanOrEqual(24);
			expect(box!.height).toBeGreaterThanOrEqual(24);

			await tabUntilFocused(page, voidBtn, 20);
			await expectVisibleFocusStyle(voidBtn);

			await page.keyboard.press("Escape");
			await expect(dialog).toHaveCount(0);
		} finally {
			await context.close();
		}
	});

	test("Q-E14: Computed WCAG 2.2 AA contrast (>= 4.5:1) in Light and Dark themes", async ({
		browser,
	}) => {
		test.setTimeout(90_000);
		// Audit /login?error=unauthorized in light and dark
		const loginCtx = await browser.newContext({
			viewport: { width: 1280, height: 800 },
		});
		try {
			const page = await loginCtx.newPage();
			await page.goto("/login?error=unauthorized");

			for (const theme of ["light", "dark"] as const) {
				await page.evaluate((t) => {
					document.documentElement.classList.toggle("dark", t === "dark");
					document.documentElement.classList.toggle(
						"light",
						t === "light",
					);
				}, theme);
				await page.waitForTimeout(450);

				const loginChecks = await measureComputedContrast(page, [
					{ label: `${theme} login h2`, selector: "h2" },
					{ label: `${theme} login muted`, selector: "p" },
					{
						label: `${theme} login alert`,
						selector: 'main [role="alert"]',
					},
					{
						label: `${theme} login google btn`,
						selector: 'section[aria-labelledby="login-title"] button',
					},
				]);
				expect(loginChecks.length).toBe(4);
				for (const item of loginChecks) {
					expect(
						item.ratio,
						`${item.label} contrast ${item.ratio.toFixed(2)} (${item.fg} on ${item.bg})`,
					).toBeGreaterThanOrEqual(4.5);
				}
			}
		} finally {
			await loginCtx.close();
		}

		// Audit teacher grades (bg-accent text-on-accent, muted, badges) in light and dark
		const teacherSession = await openAuthenticatedContext(
			browser,
			fixture.teacher,
		);
		try {
			await teacherSession.page.goto(
				`/teacher/grades?period=${fixture.periodPublicId}&course=${fixture.coursePublicId}`,
			);
			for (const theme of ["light", "dark"] as const) {
				await teacherSession.page.evaluate((t) => {
					document.documentElement.classList.toggle("dark", t === "dark");
					document.documentElement.classList.toggle(
						"light",
						t === "light",
					);
				}, theme);
				await teacherSession.page.waitForTimeout(450);

				const checks = await measureComputedContrast(
					teacherSession.page,
					[
						{ label: `${theme} teacher h1`, selector: "h1" },
						{
							label: `${theme} teacher muted`,
							selector: ".text-muted",
						},
						{
							label: `${theme} teacher accent button`,
							selector: "button.bg-accent",
						},
						{
							label: `${theme} teacher danger text`,
							selector: ".text-danger",
						},
						{
							label: `${theme} teacher period badge`,
							selector: ".bg-accent-soft.text-accent",
						},
					],
				);
				expect(checks.length).toBeGreaterThanOrEqual(4);
				for (const item of checks) {
					expect(
						item.ratio,
						`${item.label} contrast ${item.ratio.toFixed(2)} (${item.fg} on ${item.bg})`,
					).toBeGreaterThanOrEqual(4.5);
				}
			}
		} finally {
			await teacherSession.context.close();
		}
	});

	test("Q-E15 & Q-E16: Focus Not Obscured (2.4.11) and Target Size >= 24x24px (2.5.8) across audited routes", async ({
		browser,
	}) => {
		test.setTimeout(90_000);
		const studentSession = await openAuthenticatedContext(
			browser,
			fixture.student1,
		);
		try {
			await studentSession.page.goto("/student");
			await auditTargetSizes(studentSession.page, "/student");

			// Scroll down to claims section, then Shift+Tab backwards and assert focus not obscured
			const lastFilter = studentSession.page
				.locator("article")
				.filter({ hasText: fixture.courseName })
				.getByRole("button", { name: /Respondido/ });
			await lastFilter.focus();
			for (let i = 0; i < 6; i += 1) {
				await expectFocusNotObscured(studentSession.page);
				await studentSession.page.keyboard.press("Shift+Tab");
			}
		} finally {
			await studentSession.context.close();
		}

		const teacherSession = await openAuthenticatedContext(
			browser,
			fixture.teacher,
		);
		try {
			const teacherRoutes = [
				"/teacher",
				`/teacher/courses/${fixture.coursePublicId}?period=${fixture.periodPublicId}`,
				`/teacher/grades?period=${fixture.periodPublicId}&course=${fixture.coursePublicId}`,
				`/teacher/points?period=${fixture.periodPublicId}&course=${fixture.coursePublicId}`,
				`/teacher/claims?period=${fixture.periodPublicId}&course=${fixture.coursePublicId}`,
			];
			for (const route of teacherRoutes) {
				await teacherSession.page.goto(route);
				await auditTargetSizes(teacherSession.page, route);
			}

			// Verify Shift+Tab Focus Not Obscured on /teacher/grades
			await teacherSession.page.goto(
				`/teacher/grades?period=${fixture.periodPublicId}&course=${fixture.coursePublicId}`,
			);
			const lastInput = teacherSession.page.getByRole("textbox", {
				name: "Grupo 3, T3",
			});
			await lastInput.focus();
			for (let i = 0; i < 6; i += 1) {
				await expectFocusNotObscured(teacherSession.page);
				await teacherSession.page.keyboard.press("Shift+Tab");
			}
		} finally {
			await teacherSession.context.close();
		}
	});

	test("Q-E17 & Q-E18: Desktop (1280x800) and Mobile (375x812) responsiveness across all 7 views", async ({
		browser,
	}) => {
		test.setTimeout(120_000);
		for (const viewport of [
			{ name: "desktop", width: 1280, height: 800 },
			{ name: "mobile", width: 375, height: 812 },
		]) {
			const anonCtx = await browser.newContext({
				viewport: { width: viewport.width, height: viewport.height },
			});
			try {
				const page = await anonCtx.newPage();
				await page.goto("/login");
				const overflow = await page.evaluate(
					() =>
						document.documentElement.scrollWidth >
						window.innerWidth,
				);
				expect(overflow, `/login overflow on ${viewport.name}`).toBe(
					false,
				);
				await expect(
					page.getByRole("button", { name: /Continuar con Google/i }),
				).toBeVisible();
			} finally {
				await anonCtx.close();
			}

			const sCtx = await openAuthenticatedContext(
				browser,
				fixture.student1,
				{ width: viewport.width, height: viewport.height },
			);
			try {
				await sCtx.page.goto("/student");
				const overflow = await sCtx.page.evaluate(
					() =>
						document.documentElement.scrollWidth >
						window.innerWidth,
				);
				expect(overflow, `/student overflow on ${viewport.name}`).toBe(
					false,
				);
				await expect(
					sCtx.page.getByRole("button", { name: "Cerrar sesión" }),
				).toBeVisible();
				await expect(
					sCtx.page
						.locator("article")
						.filter({ hasText: fixture.courseName }),
				).toBeVisible();
				await expect(
					sCtx.page.getByRole("heading", { name: "Notas grupales" }),
				).toBeVisible();
				await expect(
					sCtx.page.getByRole("heading", { name: "Reclamos" }),
				).toBeVisible();
			} finally {
				await sCtx.context.close();
			}

			const tCtx = await openAuthenticatedContext(
				browser,
				fixture.teacher,
				{ width: viewport.width, height: viewport.height },
			);
			try {
				const routes = [
					"/teacher",
					`/teacher/courses/${fixture.coursePublicId}?period=${fixture.periodPublicId}`,
					`/teacher/grades?period=${fixture.periodPublicId}&course=${fixture.coursePublicId}`,
					`/teacher/points?period=${fixture.periodPublicId}&course=${fixture.coursePublicId}`,
					`/teacher/claims?period=${fixture.periodPublicId}&course=${fixture.coursePublicId}`,
				];
				for (const route of routes) {
					await tCtx.page.goto(route);
					const overflow = await tCtx.page.evaluate(
						() =>
							document.documentElement.scrollWidth >
							window.innerWidth,
					);
					expect(
						overflow,
						`${route} overflow on ${viewport.name}`,
					).toBe(false);
					await expect(
						tCtx.page
							.getByRole("button", { name: "Cerrar sesión" })
							.filter({ visible: true }),
					).toHaveCount(1);
					if (route.includes("/teacher/grades")) {
						await expect(
							tCtx.page.getByRole("button", {
								name: new RegExp(
									`Exportar resultados del curso ${fixture.courseName}`,
								),
							}),
						).toBeVisible();
						await expect(
							tCtx.page.getByRole("button", {
								name: "Gestionar Evaluaciones",
							}),
						).toBeVisible();
					} else if (route.includes("/teacher/claims")) {
						await expect(
							tCtx.page.locator("article[aria-labelledby]"),
						).toBeVisible();
					}
				}
			} finally {
				await tCtx.context.close();
			}
		}
	});
});
