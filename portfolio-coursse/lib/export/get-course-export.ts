import type { SupabaseClient } from "@supabase/supabase-js";
import { hasAcademicIdentity } from "../academic/authorize-current-user";
import type { PointsMovement } from "./adjusted-average";
import {
	buildCourseExportFilename,
	buildCourseExportRows,
	renderCourseExportXlsxBuffer,
	type CourseExportEvaluation,
	type CourseExportGradeAttribution,
	type CourseExportStudent,
} from "./course-export";

const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CourseExportLoadResult =
	| {
			ok: true;
			filename: string;
			buffer: Buffer;
			rowCount: number;
			evaluationCount: number;
	  }
	| {
			ok: false;
			status: 400 | 401 | 403 | 404 | 500;
			error: string;
	  };

type RawPointTransaction = {
	points: number;
	is_voided: boolean;
};

type RawAuthorizedStudent = {
	id: number;
	full_name: string | null;
	email: string;
	status: "active" | "inactive";
	point_transactions: RawPointTransaction[] | null;
};

type RawEvaluation = {
	id: number;
	name: string;
	position: number;
	performed_at: string | null;
};

type RawAttribution = {
	authorized_student_id: number;
	evaluation_id: number;
	group_id: number;
	grade: number | string;
	revision: number;
};

/**
 * Loads confirmed historical grade attributions and point movements for a
 * teacher-owned course and generates the XLSX buffer strictly read-only.
 */
export async function loadCourseExportForTeacher({
	supabase,
	userId,
	coursePublicId,
	now = new Date(),
}: {
	supabase: SupabaseClient;
	userId: string;
	coursePublicId: string;
	now?: Date;
}): Promise<CourseExportLoadResult> {
	const trimmedCourseId = coursePublicId.trim();
	if (!UUID_PATTERN.test(trimmedCourseId)) {
		return {
			ok: false,
			status: 400,
			error: "Identificador de curso inválido.",
		};
	}

	if (!(await hasAcademicIdentity(supabase))) {
		return {
			ok: false,
			status: 403,
			error: "Solo el docente responsable con sesión académica verificada puede descargar esta exportación.",
		};
	}

	const { data: profile, error: profileError } = await supabase
		.from("profiles")
		.select("role")
		.eq("id", userId)
		.maybeSingle();

	if (profileError) {
		return {
			ok: false,
			status: 500,
			error: "No se pudo verificar tu rol académico. Inténtalo nuevamente.",
		};
	}

	if (profile?.role !== "teacher") {
		return {
			ok: false,
			status: 403,
			error: "Solo el docente responsable del curso puede descargar esta exportación.",
		};
	}

	const { data: course, error: courseError } = await supabase
		.from("courses")
		.select("id, public_id, name")
		.eq("public_id", trimmedCourseId)
		.eq("teacher_id", userId)
		.maybeSingle();

	if (courseError) {
		return {
			ok: false,
			status: 500,
			error: "No se pudo consultar el curso solicitado. Inténtalo nuevamente.",
		};
	}

	if (!course) {
		return {
			ok: false,
			status: 404,
			error: "No se encontró un curso autorizado para exportar.",
		};
	}

	// Strictly read-only lookups: never seed evaluations or mutate points/grades.
	const [evaluationsRes, studentsRes, attributionsRes] = await Promise.all([
		supabase
			.from("course_evaluations")
			.select("id, name, position, performed_at")
			.eq("course_id", course.id)
			.order("position", { ascending: true })
			.order("id", { ascending: true }),
		supabase
			.from("authorized_students")
			.select(
				"id, full_name, email, status, point_transactions(points, is_voided)",
			)
			.eq("course_id", course.id),
		supabase.rpc("list_course_export_grade_attributions", {
			target_course_id: course.id,
		}),
	]);

	if (evaluationsRes.error || studentsRes.error || attributionsRes.error) {
		return {
			ok: false,
			status: 500,
			error: "No se pudieron obtener las notas históricas y puntos confirmados del curso. Inténtalo nuevamente.",
		};
	}

	const evaluations: CourseExportEvaluation[] = (
		(evaluationsRes.data ?? []) as RawEvaluation[]
	).map((evaluation) => ({
		id: Number(evaluation.id),
		name: evaluation.name,
		position: Number(evaluation.position),
		performedAt: evaluation.performed_at,
	}));

	const students: CourseExportStudent[] = (
		(studentsRes.data ?? []) as RawAuthorizedStudent[]
	).map((student) => {
		const movements: PointsMovement[] = (student.point_transactions ?? []).map(
			(transaction) => ({
				points: Number(transaction.points),
				isVoided: Boolean(transaction.is_voided),
			}),
		);
		return {
			authorizedStudentId: Number(student.id),
			fullName: student.full_name,
			email: student.email,
			status: student.status === "inactive" ? "inactive" : "active",
			movements,
		};
	});

	const attributions: CourseExportGradeAttribution[] = (
		Array.isArray(attributionsRes.data)
			? (attributionsRes.data as RawAttribution[])
			: []
	).map((row) => ({
		authorizedStudentId: Number(row.authorized_student_id),
		evaluationId: Number(row.evaluation_id),
		groupId: Number(row.group_id),
		grade: Number(row.grade),
		revision: Number(row.revision),
	}));

	try {
		const rows = buildCourseExportRows({
			students,
			evaluations,
			attributions,
		});
		const buffer = renderCourseExportXlsxBuffer({ evaluations, rows });
		const filename = buildCourseExportFilename(course.name, now);

		return {
			ok: true,
			filename,
			buffer,
			rowCount: rows.length,
			evaluationCount: evaluations.length,
		};
	} catch {
		return {
			ok: false,
			status: 500,
			error: "No se pudo generar el archivo XLSX con los resultados del curso.",
		};
	}
}

