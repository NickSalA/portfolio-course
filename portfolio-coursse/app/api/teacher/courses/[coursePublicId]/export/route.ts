import { NextResponse } from "next/server";
import { loadCourseExportForTeacher } from "@/lib/export/get-course-export";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
	_request: Request,
	context: { params: Promise<{ coursePublicId: string }> },
) {
	const { coursePublicId } = await context.params;
	const supabase = await createClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return NextResponse.json(
			{ error: "Debes iniciar sesión para descargar la exportación del curso." },
			{ status: 401, headers: { "Cache-Control": "no-store" } },
		);
	}

	const result = await loadCourseExportForTeacher({
		supabase,
		userId: user.id,
		coursePublicId,
	});

	if (!result.ok) {
		return NextResponse.json(
			{ error: result.error },
			{ status: result.status, headers: { "Cache-Control": "no-store" } },
		);
	}

	return new NextResponse(new Uint8Array(result.buffer), {
		status: 200,
		headers: {
			"Content-Type":
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"Content-Disposition": `attachment; filename="${result.filename}"`,
			"Cache-Control": "no-store",
			"X-Content-Type-Options": "nosniff",
		},
	});
}

