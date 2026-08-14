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

export async function importStudents(formData: FormData) {
	const supabase = await createClient();
	const periodPublicId = value(formData, "period_public_id");
	const payload = value(formData, "students");
	const path = `/teacher/students?period=${encodeURIComponent(periodPublicId)}`;

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
	if (error) redirect(`${path}&error=import`);

	const result = Array.isArray(data) ? data[0] : data;
	revalidatePath("/teacher/students");
	revalidatePath("/teacher/courses");
	revalidatePath("/teacher/groups");
	redirect(
		`${path}&imported=${result?.imported_students ?? students.length}&courses=${result?.created_courses ?? 0}`,
	);
}
