"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CsvImporter } from "@/components/teacher/students/csv-importer";
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
	const pathname = usePathname();
	const [students, setStudents] = useState<Student[]>([]);
	const [courseNames, setCourseNames] = useState<Record<string, string>>({});
	const [previewPage, setPreviewPage] = useState(0);
	const courseCodes = [
		...new Set(
			students
				.map((student) => student.course_name.trim())
				.filter(Boolean),
		),
	];
	const mappedStudents = students.map((student) => ({
		...student,
		course_name: courseNames[student.course_name]?.trim() ?? "",
	}));
	const courses = [
		...new Set(
			mappedStudents
				.map((student) => student.course_name)
				.filter(Boolean),
		),
	];
	const missingCourseNames = courseCodes.some(
		(code) => !courseNames[code]?.trim(),
	);
	const previewPageSize = 10;
	const previewPages = Math.ceil(mappedStudents.length / previewPageSize);
	const previewStudents = mappedStudents.slice(
		previewPage * previewPageSize,
		(previewPage + 1) * previewPageSize,
	);

	function receiveStudents(nextStudents: Student[]) {
		setPreviewPage(0);
		setStudents(nextStudents);
		setCourseNames((current) =>
			Object.fromEntries(
				[
					...new Set(
						nextStudents.map((student) => student.course_name),
					),
				].map((code) => [code, current[code] ?? code]),
			),
		);
	}

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
				onClose={() => {
					setStudents([]);
					setCourseNames({});
					setPreviewPage(0);
				}}
				className="m-auto w-[min(100%-2rem,60rem)] rounded-3xl border border-white/25 bg-transparent p-0 text-foreground shadow-2xl backdrop:bg-slate-950/55 backdrop:backdrop-blur-sm"
			>
				<form
					action={importStudents}
					className="glass-strong rounded-3xl p-6 sm:p-8"
				>
					<input
						type="hidden"
						name="workspace"
						value={pathname === "/teacher" ? "1" : "0"}
					/>
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
						<CsvImporter onValidated={receiveStudents} />
					</div>

					{students.length > 0 && (
						<>
							<section className="mt-5 rounded-2xl border border-border bg-surface-muted/45 p-4">
								<p className="text-sm font-medium">
									Confirma los cursos
								</p>
								<p className="mt-1 text-xs text-muted">
									El archivo usa códigos. Indica el nombre
									real que se creará o actualizará.
								</p>
								<div className="mt-4 space-y-3">
									{courseCodes.map((code) => (
										<label
											key={code}
											className="grid gap-2 text-sm sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center"
										>
											<span className="font-medium text-muted">
												{code}
											</span>
											<input
												value={courseNames[code] ?? ""}
												onChange={(event) =>
													setCourseNames(
														(current) => ({
															...current,
															[code]: event.target
																.value,
														}),
													)
												}
												placeholder="Nombre del curso"
												className="rounded-xl border border-border bg-surface px-3 py-2 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
											/>
										</label>
									))}
								</div>
							</section>
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
									{previewStudents.map((student, index) => (
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
								{previewPages > 1 && (
									<div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
										<p className="text-muted">
											Mostrando{" "}
											{previewPage * previewPageSize + 1}–
											{Math.min(
												(previewPage + 1) *
													previewPageSize,
												mappedStudents.length,
											)}{" "}
											de {mappedStudents.length}
										</p>
										<div className="flex gap-2">
											<button
												type="button"
												onClick={() =>
													setPreviewPage((page) =>
														Math.max(page - 1, 0),
													)
												}
												disabled={previewPage === 0}
												className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
											>
												Anterior
											</button>
											<button
												type="button"
												onClick={() =>
													setPreviewPage((page) =>
														Math.min(
															page + 1,
															previewPages - 1,
														),
													)
												}
												disabled={
													previewPage ===
													previewPages - 1
												}
												className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
											>
												Siguiente
											</button>
										</div>
									</div>
								)}
							</section>
							<div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
								<button
									type="button"
									onClick={closeDialog}
									className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm font-medium text-muted transition hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
								>
									Cancelar
								</button>
								<button
									disabled={missingCourseNames}
									className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
								>
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
