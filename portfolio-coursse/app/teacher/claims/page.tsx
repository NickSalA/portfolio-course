import Link from "next/link";
import { CourseContextSwitcher } from "@/components/teacher/courses/course-context-switcher";
import { TeacherClaimsInbox } from "@/components/teacher/claims/teacher-claims-inbox";
import { ModuleHeader } from "@/components/teacher/shared/module-header";
import {
	listTeacherClaimNotifications,
	listTeacherClaims,
} from "@/lib/claims/teacher-claims";
import { getTeacherContext } from "@/lib/teacher/get-context";

export default async function TeacherClaimsPage({
	searchParams,
}: {
	searchParams: Promise<{ period?: string; course?: string; claim?: string }>;
}) {
	const {
		period: requestedPeriod,
		course: requestedCourse,
		claim: requestedClaim,
	} = await searchParams;
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

	const [claimsResult, notificationsResult] = await Promise.all([
		listTeacherClaims({
			supabase,
			courseId: selectedCourse?.id ?? null,
		}),
		listTeacherClaimNotifications({
			supabase,
			courseId: selectedCourse?.id ?? null,
		}),
	]);

	return (
		<main className="px-5 py-8 sm:px-8 sm:py-10">
			<div className="mx-auto max-w-6xl">
				<ModuleHeader
					eyebrow="Reclamos"
					title={
						selectedCourse
							? `Reclamos · ${selectedCourse.name}`
							: "Bandeja de reclamos"
					}
					description="Revisa los reclamos de notas grupales y puntos de tus cursos autorizados y emite respuestas finales motivadas."
					aside={
						selectedPeriod && (
							<span className="rounded-full bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent">
								{selectedPeriod.code}
							</span>
						)
					}
				/>

				{selectedPeriod && (courses ?? []).length > 0 && (
					<div className="mt-6">
						<CourseContextSwitcher
							courses={(courses ?? []).map((course) => ({
								publicId: course.public_id,
								name: course.name,
							}))}
						/>
					</div>
				)}

				<div className="mt-6">
					{!claimsResult.ok ? (
						<div
							role="alert"
							className="glass flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-danger/30 bg-danger-soft/70 p-6 text-sm text-danger"
						>
							<p>{claimsResult.error}</p>
							<Link
								href="/teacher/claims"
								className="inline-flex min-h-10 items-center rounded-xl border border-danger/40 bg-surface px-4 py-2 font-medium text-foreground transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
							>
								Recargar bandeja
							</Link>
						</div>
					) : (
						<TeacherClaimsInbox
							claims={claimsResult.claims}
							notifications={
								notificationsResult.ok
									? notificationsResult.notifications
									: {}
							}
							initialClaimPublicId={requestedClaim ?? null}
							periodPublicId={selectedPeriod?.public_id ?? null}
						/>
					)}
				</div>
			</div>
		</main>
	);
}

