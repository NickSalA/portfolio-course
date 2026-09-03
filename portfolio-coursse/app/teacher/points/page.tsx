import Link from "next/link";
import { CourseContextSwitcher } from "@/components/teacher/course-context-switcher";
import { ModuleHeader } from "@/components/teacher/module-header";
import { PointsStudentList } from "@/components/teacher/points-student-list";
import { getTeacherContext } from "@/lib/teacher/get-context";

export default async function PointsPage({
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
				.select("id, public_id, name")
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
				.select(
					"id, full_name, email, point_transactions(id, points, reason, created_at, is_voided)",
				)
				.eq("course_id", selectedCourse.id)
				.eq("status", "active")
				.order("full_name")
		: { data: [] };
	return (
		<main className="px-5 py-8 sm:px-8 sm:py-10">
			<div className="mx-auto max-w-6xl">
				<ModuleHeader
					eyebrow="Puntos"
					title={
						selectedCourse
							? selectedCourse.name
							: "Movimientos de puntos"
					}
					description={
						selectedCourse
							? "Registra ajustes y consulta el saldo derivado de cada alumno autorizado."
							: "Selecciona un curso para registrar y consultar movimientos de puntos."
					}
					aside={
						selectedPeriod && (
							<span className="rounded-full bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent">
								{selectedPeriod.code}
							</span>
						)
					}
				/>
				{selectedPeriod && (
					<div className="mt-6">
						<CourseContextSwitcher
							courses={(courses ?? []).map((course) => ({
								publicId: course.public_id,
								name: course.name,
							}))}
						/>
					</div>
				)}
				{selectedCourse ? (
					<PointsStudentList
						course={selectedCourse.public_id}
						period={selectedPeriod?.public_id ?? ""}
						students={students ?? []}
					/>
				) : (
					<section className="mt-6">
						<p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
							Cursos
						</p>
						<h2 className="mt-2 text-xl font-semibold">
							Selecciona un curso
						</h2>
						<div className="mt-4 grid gap-3 md:grid-cols-2">
							{(courses ?? []).map((course) => (
								<Link
									key={course.id}
									href={`/teacher/points?period=${selectedPeriod?.public_id}&course=${course.public_id}`}
									className="glass flex items-center justify-between rounded-2xl border border-white/25 p-5 transition hover:border-accent"
								>
									<span className="font-medium">
										{course.name}
									</span>
									<span
										aria-hidden="true"
										className="text-xl text-muted"
									>
										→
									</span>
								</Link>
							))}
						</div>
					</section>
				)}
			</div>
		</main>
	);
}
