import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
	const periodPublicId = request.nextUrl.searchParams.get("period")?.trim();
	const coursePublicId = request.nextUrl.searchParams.get("course")?.trim();
	if (!periodPublicId) {
		return NextResponse.json({ error: "Periodo inválido." }, { status: 400 });
	}

	const supabase = await createClient();
	const { data: userData } = await supabase.auth.getUser();
	if (!userData.user) {
		return NextResponse.json({ error: "No autorizado." }, { status: 401 });
	}

	const { data: period } = await supabase
		.from("academic_periods")
		.select("id")
		.eq("public_id", periodPublicId)
		.maybeSingle();
	if (!period) {
		return NextResponse.json({ courses: [], students: [] });
	}

	const { data: courses, error: coursesError } = await supabase
		.from("courses")
		.select("id, public_id, name")
		.eq("teacher_id", userData.user.id)
		.eq("period_id", period.id)
		.order("name");
	if (coursesError) {
		return NextResponse.json({ error: "No se pudieron cargar los cursos." }, { status: 500 });
	}

	const selectedCourse = (courses ?? []).find(
		(course) => course.public_id === coursePublicId,
	);
	if (!selectedCourse) return NextResponse.json({ courses: courses ?? [], students: [] });

	const { data: students, error: studentsError } = await supabase
		.from("authorized_students")
		.select("id, full_name, email, point_transactions(points, reason, created_at)")
		.eq("course_id", selectedCourse.id)
		.eq("status", "active")
		.order("full_name");
	if (studentsError) {
		return NextResponse.json({ error: "No se pudieron cargar los movimientos." }, { status: 500 });
	}

	return NextResponse.json({ courses: courses ?? [], students: students ?? [] });
}
