import Link from "next/link";
import { CourseContextSwitcher } from "@/components/teacher/courses/course-context-switcher";
import { ModuleHeader } from "@/components/teacher/shared/module-header";
import { EvaluationManagerDialog } from "@/components/teacher/grades/evaluation-manager-dialog";
import { GroupGradesTable } from "@/components/teacher/grades/group-grades-table";
import { getTeacherContext } from "@/lib/teacher/get-context";

export default async function GradesPage({
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

	// Fetch or seed evaluations if course is selected
	let evaluations: {
		id: number;
		public_id: string;
		name: string;
		position: number;
	}[] = [];

	type GradeRecord = {
		evaluation_id: number;
		grade: number | null;
		feedback: string | null;
	};

	type GroupRowData = {
		id: number;
		name: string;
		position: number;
		members: { full_name: string | null; email: string }[];
		grades: Record<number, GradeRecord>;
	};

	let groupsData: GroupRowData[] = [];

	if (selectedCourse) {
		// Ensure default evaluations (T1, T2, T3) via RPC or query
		const { data: rpcEvals, error: rpcError } = await supabase.rpc(
			"ensure_default_evaluations",
			{ target_course_id: selectedCourse.id },
		);

		if (!rpcError && rpcEvals) {
			evaluations = rpcEvals;
		} else {
			// Fallback direct select
			const { data: evals } = await supabase
				.from("course_evaluations")
				.select("id, public_id, name, position")
				.eq("course_id", selectedCourse.id)
				.order("position");
			evaluations = evals ?? [];
		}

		// Fetch groups and members
		const { data: rawGroups } = await supabase
			.from("groups")
			.select(`
				id,
				position,
				name,
				course_students(
					status,
					authorized_students(full_name, email)
				)
			`)
			.eq("course_id", selectedCourse.id)
			.order("position");

		// Fetch existing grades for these groups
		const groupIds = (rawGroups ?? []).map((g) => g.id);
		const { data: rawGrades } = groupIds.length
			? await supabase
					.from("group_grades")
					.select("group_id, evaluation_id, grade, feedback")
					.in("group_id", groupIds)
			: { data: [] };

		const gradesByGroup: Record<number, Record<number, GradeRecord>> = {};
		for (const grade of rawGrades ?? []) {
			if (!gradesByGroup[grade.group_id]) {
				gradesByGroup[grade.group_id] = {};
			}
			gradesByGroup[grade.group_id][grade.evaluation_id] = grade;
		}

		type RawStudent = {
			full_name: string | null;
			email: string;
		};

		type RawEnrollment = {
			status: string;
			authorized_students: RawStudent | RawStudent[] | null;
		};

		groupsData = (rawGroups ?? []).map((group) => {
			const enrollments = (Array.isArray(group.course_students)
				? group.course_students
				: []) as unknown as RawEnrollment[];
			const members = enrollments.flatMap((e) => {
				const s = Array.isArray(e.authorized_students)
					? e.authorized_students[0]
					: e.authorized_students;
				return s ? [{ full_name: s.full_name, email: s.email }] : [];
			});

			return {
				id: group.id,
				name: group.name || `Grupo ${group.position}`,
				position: group.position,
				members,
				grades: gradesByGroup[group.id] || {},
			};
		});
	}

	return (
		<main className="px-5 py-8 sm:px-8 sm:py-10">
			<div className="mx-auto max-w-6xl">
				<ModuleHeader
					eyebrow="Calificaciones"
					title={
						selectedCourse
							? selectedCourse.name
							: "Notas por grupo"
					}
					description={
						selectedCourse
							? "Gestiona las evaluaciones y registra las calificaciones de cada grupo."
							: "Selecciona un curso para calificar los grupos."
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
					<div className="mt-6 space-y-6">
						<div className="flex justify-end">
							<EvaluationManagerDialog
								coursePublicId={selectedCourse.public_id}
								evaluations={evaluations}
							/>
						</div>
						<GroupGradesTable
							courseName={selectedCourse.name}
							groups={groupsData}
							evaluations={evaluations}
						/>
					</div>
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
									href={`/teacher/grades?period=${selectedPeriod?.public_id}&course=${course.public_id}`}
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
							{!courses?.length && (
								<p className="text-sm text-muted">
									No hay cursos activos en este periodo.
								</p>
							)}
						</div>
					</section>
				)}
			</div>
		</main>
	);
}
