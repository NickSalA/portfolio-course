"use client";

import { archiveCourse } from "@/app/teacher/courses/actions";
import { CourseStudentImportForm } from "@/components/teacher/students/course-student-import-form";

export function CourseDetailActions({
	coursePublicId,
	courseName,
	periodPublicId,
}: {
	coursePublicId: string;
	courseName: string;
	periodPublicId: string;
}) {
	return (
		<div className="flex items-center gap-2">
			<CourseStudentImportForm
				periodPublicId={periodPublicId}
				courseName={courseName}
			/>
			<details className="relative">
				<summary className="grid size-10 cursor-pointer place-items-center rounded-xl border border-border text-lg text-muted transition hover:border-accent hover:text-foreground">
					⋯
				</summary>
				<div className="absolute right-0 z-10 mt-2 w-48 rounded-xl border border-border bg-surface p-2 shadow-xl">
					<form
						action={archiveCourse}
						onSubmit={(event) => {
							if (
								!window.confirm(
									"¿Ocultar este curso? Seguirá conservando sus alumnos, grupos y puntos.",
								)
							)
								event.preventDefault();
						}}
					>
						<input
							type="hidden"
							name="course_public_id"
							value={coursePublicId}
						/>
						<input
							type="hidden"
							name="period_public_id"
							value={periodPublicId}
						/>
						<button className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-danger hover:bg-danger-soft">
							Ocultar curso
						</button>
					</form>
				</div>
			</details>
		</div>
	);
}
