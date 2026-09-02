import { ModuleHeader } from "@/components/teacher/module-header";
import { getTeacherContext } from "@/lib/teacher/get-context";

export default async function TeacherPage({
	searchParams,
}: {
	searchParams: Promise<{ period?: string }>;
}) {
	const { period: requestedPeriod } = await searchParams;
	const { teacher, selectedPeriod } = await getTeacherContext({
		requestedPeriodPublicId: requestedPeriod,
	});
	return (
		<main className="px-5 py-8 sm:px-8 sm:py-10">
			<div className="mx-auto max-w-6xl">
				<ModuleHeader
					eyebrow="Inicio"
					title={`Hola, ${teacher.full_name?.split(" ")[0] ?? "docente"}.`}
					description={
						selectedPeriod
							? `Este es el panorama de ${selectedPeriod.code}.`
							: "Prepara un periodo para comenzar a organizar tu actividad académica."
					}
				/>
			</div>
		</main>
	);
}
