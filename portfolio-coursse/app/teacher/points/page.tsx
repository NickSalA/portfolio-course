import { ModuleHeader } from "@/components/teacher/module-header";
import { PointsContent } from "@/components/teacher/points-content";
import { getTeacherContext } from "@/lib/teacher/get-context";

const errors: Record<string, string> = {
	transaction:
		"No se pudo registrar el movimiento. Revisa el alumno y el valor indicado.",
};

export default async function PointsPage({
	searchParams,
}: {
	searchParams: Promise<{
		period?: string;
		course?: string;
		error?: string;
		refresh?: string;
	}>;
}) {
	const {
		period: requestedPeriod,
		course,
		error: errorCode,
		refresh,
	} = await searchParams;
	const { selectedPeriod } = await getTeacherContext({
		requestedPeriodPublicId: requestedPeriod,
	});
	const error = errorCode ? errors[errorCode] : null;

	return (
		<main className="px-5 py-8 sm:px-8 sm:py-10">
			<div className="mx-auto max-w-6xl">
				<ModuleHeader
					eyebrow="Puntos"
					title="Movimientos de puntos"
					description="Selecciona un curso para registrar y consultar movimientos de puntos."
					aside={
						selectedPeriod && (
							<span className="rounded-full bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent">
								{selectedPeriod.code}
							</span>
						)
					}
				/>
				{error && (
					<p
						role="alert"
						className="mt-5 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
					>
						{error}
					</p>
				)}
				{selectedPeriod ? (
					<PointsContent
						key={`${selectedPeriod.public_id}:${course ?? "all"}:${refresh ?? ""}`}
						periodPublicId={selectedPeriod.public_id}
						selectedCoursePublicId={course ?? null}
						refresh={refresh === "1"}
					/>
				) : (
					<p className="mt-6 rounded-2xl border border-dashed border-border p-5 text-sm text-muted">
						Selecciona un periodo para consultar los movimientos.
					</p>
				)}
			</div>
		</main>
	);
}
