"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type StudentImport = {
	course_name: string;
	full_name: string;
	email: string;
	student_number: string;
};

function value(formData: FormData, name: string) {
	const entry = formData.get(name);
	return typeof entry === "string" ? entry.trim() : "";
}

export async function deactivateStudentAuthorization(formData: FormData) {
	const supabase = await createClient();
	const authorizationId = Number(value(formData, "authorization_id"));
	const period = value(formData, "period");
	const course = value(formData, "course");
	const path = `/teacher/students?period=${encodeURIComponent(period)}&course=${encodeURIComponent(course)}`;
	if (!Number.isInteger(authorizationId)) redirect(path);
	const { error } = await supabase
		.from("authorized_students")
		.update({ status: "inactive" })
		.eq("id", authorizationId);
	if (error) redirect(`${path}&error=deactivate`);
	await supabase
		.from("course_students")
		.update({ status: "inactive" })
		.eq("authorized_student_id", authorizationId);
	revalidatePath("/teacher/students");
	revalidatePath("/dashboard");
	redirect(path);
}

export async function importStudents(formData: FormData) {
	const supabase = await createClient();
	const periodPublicId = value(formData, "period_public_id");
	const payload = value(formData, "students");
	const workspace = value(formData, "workspace") === "1";
	const path = workspace
		? `/teacher?module=students&period=${encodeURIComponent(periodPublicId)}`
		: `/teacher/students?period=${encodeURIComponent(periodPublicId)}`;

	let students: StudentImport[];
	try {
		students = JSON.parse(payload) as StudentImport[];
	} catch {
		redirect(`${path}&error=payload`);
	}

	if (!periodPublicId || !Array.isArray(students) || !students.length) {
		redirect(`${path}&error=payload`);
	}

	const { data: period } = await supabase
		.from("academic_periods")
		.select("id")
		.eq("public_id", periodPublicId)
		.maybeSingle();
	if (!period) redirect(path);

	const { data, error } = await supabase.rpc("import_period_students", {
		target_period_id: period.id,
		students,
	});
	if (error) {
		console.error("Student import RPC failed", {
			code: error.code,
			message: error.message,
			details: error.details,
			hint: error.hint,
		});
		redirect(`${path}&error=import`);
	}

	const result = Array.isArray(data) ? data[0] : data;
	revalidatePath("/teacher/students");
	revalidatePath("/teacher/courses");
	revalidatePath("/teacher/groups");
	redirect(
		`${path}&imported=${result?.imported_students ?? students.length}&courses=${result?.created_courses ?? 0}&refresh=1`,
	);
}
