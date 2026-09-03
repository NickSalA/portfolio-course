"use client";

import { useRef, useState } from "react";
import { importStudents } from "@/app/teacher/students/actions";
import { CsvImporter } from "@/components/students/csv-importer";

type Student = {
	course_name: string;
	full_name: string;
	email: string;
	student_number: string;
};

export function CourseStudentImportForm({
	periodPublicId,
	courseName,
}: {
	periodPublicId: string;
	courseName: string;
}) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [students, setStudents] = useState<Student[]>([]);
	const mappedStudents = students.map((student) => ({
		...student,
		course_name: courseName,
	}));
	return (
		<>
			<button
				type="button"
				onClick={() => dialogRef.current?.showModal()}
				className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground transition hover:border-accent"
			>
				Importar alumnos
			</button>
			<dialog
				ref={dialogRef}
				onClose={() => setStudents([])}
				className="m-auto w-[min(100%-2rem,42rem)] rounded-3xl border border-white/25 bg-transparent p-0 text-foreground shadow-2xl backdrop:bg-slate-950/55 backdrop:backdrop-blur-sm"
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
						value={JSON.stringify(mappedStudents)}
					/>
					<div className="flex items-start justify-between gap-4">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[.18em] text-accent">
								Importar alumnos
							</p>
							<h2 className="mt-2 text-xl font-semibold">
								{courseName}
							</h2>
							<p className="mt-2 text-sm text-muted">
								Todos los alumnos válidos del archivo se
								añadirán o actualizarán en este curso.
							</p>
						</div>
						<button
							type="button"
							onClick={() => dialogRef.current?.close()}
							aria-label="Cerrar"
							className="grid size-9 place-items-center rounded-lg border border-border text-lg text-muted"
						>
							×
						</button>
					</div>
					<div className="mt-6">
						<CsvImporter
							onValidated={setStudents}
							fixedCourseName={courseName}
						/>
					</div>
					{students.length > 0 && (
						<>
							<div className="mt-5 rounded-xl border border-border bg-surface-muted/45 px-4 py-3 text-sm">
								<strong>{students.length} alumnos</strong>
								<span className="text-muted">
									{" "}
									se importarán en {courseName}.
								</span>
							</div>
							<div className="mt-6 flex justify-end gap-3">
								<button
									type="button"
									onClick={() => dialogRef.current?.close()}
									className="rounded-xl border border-border px-4 py-2 text-sm font-medium"
								>
									Cancelar
								</button>
								<button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">
									Importar alumnos
								</button>
							</div>
						</>
					)}
				</form>
			</dialog>
		</>
	);
}
