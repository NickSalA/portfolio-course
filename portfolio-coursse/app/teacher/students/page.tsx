import { StudentImportForm } from "@/components/students/student-import-form";
import { StudentList } from "@/components/students/student-list";
import { CourseContextSwitcher } from "@/components/teacher/courses/course-context-switcher";
import { ModuleHeader } from "@/components/teacher/shared/module-header";
import { getTeacherContext } from "@/lib/teacher/get-context";

export default async function StudentsPage({
	searchParams,
}: {
	searchParams: Promise<{ period?: string; course?: string }>;
}) {
	const { period: requestedPeriod, course: requestedCourse } =
		await searchParams;
	const { supabase, user, selectedPeriod } = await getTeacherContext({
		requestedPeriodPublicId: requestedPeriod,
	});
	const { data: courses } = selectedPeriod
		? await supabase
				.from("courses")
				.select(
					"id, public_id, name, authorized_students(count), course_students(count)",
				)
				.eq("teacher_id", user.id)
				.eq("period_id", selectedPeriod.id)
				.eq("active", true)
				.order("name")
		: { data: [] };
	const selectedCourse =
		(courses ?? []).find(
			(course) => course.public_id === requestedCourse,
		) ?? null;
	const { data: students } = selectedCourse
		? await supabase
				.from("authorized_students")
				.select("id, full_name, email, status")
				.eq("course_id", selectedCourse.id)
				.eq("status", "active")
				.order("full_name")
		: { data: [] };
	return (
		<main className="px-5 py-8 sm:px-8 sm:py-10">
			<div className="mx-auto max-w-6xl">
				<ModuleHeader
					eyebrow="Alumnos"
					title={
						selectedPeriod
							? `Alumnos de ${selectedPeriod.code}`
							: "Alumnos"
					}
					description="Consulta las autorizaciones, el acceso y el grupo de cada alumno."
					aside={
						selectedPeriod && (
							<span className="rounded-full bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent">
								{selectedPeriod.code}
							</span>
						)
					}
				/>
				{selectedPeriod && (
					<>
						<div className="mt-6 flex flex-wrap items-center justify-between gap-4">
							<CourseContextSwitcher
								courses={(courses ?? []).map((course) => ({
									publicId: course.public_id,
									name: course.name,
								}))}
							/>
							{!selectedCourse && (
								<StudentImportForm
									periodPublicId={selectedPeriod.public_id}
								/>
							)}
						</div>
						{selectedCourse ? (
							<StudentList
								students={students ?? []}
								period={selectedPeriod.public_id}
								course={selectedCourse.public_id}
							/>
						) : (
							<div className="mt-6 grid gap-3 md:grid-cols-2">
								{(courses ?? []).map((course) => (
									<a
										key={course.id}
										href={`/teacher/students?period=${selectedPeriod.public_id}&course=${course.public_id}`}
										className="glass rounded-2xl border border-white/25 p-5"
									>
										<h2 className="font-medium">
											{course.name}
										</h2>
									</a>
								))}
							</div>
						)}
					</>
				)}
			</div>
		</main>
	);
}
