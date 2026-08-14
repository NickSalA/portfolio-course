"use client";

import { useRef, useState } from "react";
import { CsvImporter } from "@/components/students/csv-importer";
import { importStudents } from "@/app/teacher/students/actions";

type Student = {
	course_name: string;
	full_name: string;
	email: string;
	student_number: string;
};

export function StudentImportForm({
	periodPublicId,
}: {
	periodPublicId: string;
}) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [students, setStudents] = useState<Student[]>([]);
	const courses = [
		...new Set(
			students
				.map((student) => student.course_name.trim())
				.filter(Boolean),
		),
	];

	function openDialog() {
		dialogRef.current?.showModal();
	}

	function closeDialog() {
		dialogRef.current?.close();
	}

	return (
		<>
			<button
				type="button"
				onClick={openDialog}
				className="shrink-0 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
			>
				Importar lista
			</button>

			<dialog
				ref={dialogRef}
				onClose={() => setStudents([])}
				className="m-auto w-[min(100%-2rem,48rem)] rounded-3xl border border-white/25 bg-transparent p-0 text-foreground shadow-2xl backdrop:bg-slate-950/55 backdrop:backdrop-blur-sm"
			>
				<form
					action={importStudents}
					className="glass-strong rounded-3xl p-6 sm:p-8"
				>
					<input
						type="hidden"
						name="period_public_id"
						value={periodPublicId}
					/>
					<input
						type="hidden"
						name="students"
						value={JSON.stringify(students)}
					/>
					<div className="flex items-start justify-between gap-5">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
								Importar lista
							</p>
							<h2 className="mt-2 text-2xl font-semibold tracking-tight">
								Carga alumnos y cursos
							</h2>
							<p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
								El archivo indica el curso de cada alumno. Los
								cursos que falten se crean dentro de este
								periodo.
							</p>
						</div>
						<button
							type="button"
							onClick={closeDialog}
							aria-label="Cerrar importación"
							className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface-muted text-lg text-muted transition hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
						>
							×
						</button>
					</div>

					<div className="mt-6">
						<CsvImporter onValidated={setStudents} />
					</div>

					{students.length > 0 && (
						<>
							<section className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface-muted/45">
								<div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
									<p className="text-sm font-medium">
										Vista previa
									</p>
									<p className="text-xs text-muted">
										{students.length} alumnos ·{" "}
										{courses.length}{" "}
										{courses.length === 1
											? "curso"
											: "cursos"}
									</p>
								</div>
								<div className="divide-y divide-border">
									{students
										.slice(0, 6)
										.map((student, index) => (
											<div
												key={`${student.course_name}-${student.email}-${index}`}
												className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 px-4 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)]"
											>
												<p className="truncate font-medium">
													{student.course_name}
												</p>
												<p className="truncate text-muted">
													{student.email}
												</p>
												<p className="hidden truncate text-muted sm:block">
													{student.full_name ||
														"Sin nombre"}
												</p>
											</div>
										))}
								</div>
							</section>
							<div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
								<button
									type="button"
									onClick={closeDialog}
									className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm font-medium text-muted transition hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
								>
									Cancelar
								</button>
								<button className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
									Importar {students.length} alumnos
								</button>
							</div>
						</>
					)}
				</form>
			</dialog>
		</>
	);
}
