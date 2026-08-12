import { notFound } from "next/navigation";

const modules: Record<string, { title: string; description: string }> = {
	groups: {
		title: "Grupos",
		description:
			"Aquí gestionarás la capacidad y selección de grupos por curso.",
	},
	students: {
		title: "Alumnos",
		description:
			"Aquí importarás alumnos, revisarás autorizaciones y consultarás matrículas.",
	},
	points: {
		title: "Puntos",
		description:
			"Aquí asignarás puntos adicionales y revisarás el historial académico.",
	},
	periods: {
		title: "Periodos",
		description:
			"Aquí consultarás el historial y administrarás el ciclo de vida académico.",
	},
	settings: {
		title: "Ajustes",
		description: "Aquí configurarás las preferencias del área docente.",
	},
};

export default async function TeacherModulePage({
	params,
}: {
	params: Promise<{ module: string }>;
}) {
	const { module } = await params;
	const item = modules[module];
	if (!item) notFound();

	return (
		<main className="px-5 py-8 sm:px-8 sm:py-10">
			<div className="mx-auto max-w-4xl rounded-3xl border border-border bg-surface p-8 shadow-sm">
				<p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
					Próximamente
				</p>
				<h1 className="mt-3 text-3xl font-semibold tracking-tight">
					{item.title}
				</h1>
				<p className="mt-3 max-w-xl text-sm leading-6 text-muted">
					{item.description}
				</p>
			</div>
		</main>
	);
}
