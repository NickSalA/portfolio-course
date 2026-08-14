"use client";

import { useState } from "react";

type StudentRow = {
	course_name: string;
	full_name: string;
	email: string;
	student_number: string;
};

type CsvImporterProps = {
	onValidated: (students: StudentRow[]) => void;
};

const requiredHeaders = ["curso", "email"];

function parseCsv(text: string) {
	const lines = text
		.replace(/^\uFEFF/, "")
		.split(/\r?\n/)
		.filter((line) => line.trim());
	if (lines.length < 2)
		return {
			students: [],
			errors: ["El CSV debe incluir encabezados y al menos un alumno."],
		};

	const headers = lines[0]
		.split(",")
		.map((header) => header.trim().toLowerCase());
	const missingHeaders = requiredHeaders.filter(
		(header) => !headers.includes(header),
	);
	if (missingHeaders.length)
		return {
			students: [],
			errors: [`Faltan las columnas: ${missingHeaders.join(", ")}.`],
		};

	const index = Object.fromEntries(
		headers.map((header, position) => [header, position]),
	);
	const seenEmails = new Set<string>();
	const students: StudentRow[] = [];
	const errors: string[] = [];

	lines.slice(1).forEach((line, rowIndex) => {
		const columns = line.split(",").map((value) => value.trim());
		const courseName = columns[index.curso] ?? "";
		const email = (columns[index.email] ?? "").toLowerCase();
		const fullName =
			index.nombre === undefined ? "" : (columns[index.nombre] ?? "");
		const studentNumber =
			index.matricula === undefined
				? ""
				: (columns[index.matricula] ?? "");
		const row = rowIndex + 2;

		if (!courseName) errors.push(`Fila ${row}: falta el curso.`);
		else if (!email || !email.includes("@"))
			errors.push(`Fila ${row}: el correo no es válido.`);
		else if (seenEmails.has(`${courseName.toLowerCase()}::${email}`))
			errors.push(`Fila ${row}: el correo está repetido para ese curso.`);
		else {
			seenEmails.add(`${courseName.toLowerCase()}::${email}`);
			students.push({
				course_name: courseName,
				full_name: fullName,
				email,
				student_number: studentNumber,
			});
		}
	});

	return { students, errors };
}

export function CsvImporter({ onValidated }: CsvImporterProps) {
	const [students, setStudents] = useState<StudentRow[]>([]);
	const [errors, setErrors] = useState<string[]>([]);
	const [fileName, setFileName] = useState("");

	async function selectFile(file: File | undefined) {
		setStudents([]);
		setErrors([]);
		setFileName(file?.name ?? "");
		if (!file) return;
		if (!file.name.toLowerCase().endsWith(".csv")) {
			setErrors(["Selecciona un archivo CSV."]);
			return;
		}

		const result = parseCsv(await file.text());
		setStudents(result.students);
		setErrors(result.errors);
		if (!result.errors.length) onValidated(result.students);
	}

	return (
		<div>
			<label
				className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-muted/45 px-5 py-7 text-center transition-[border-color,background-color] hover:border-accent hover:bg-accent-soft/35 focus-within:ring-2 focus-within:ring-accent"
				onDragOver={(event) => event.preventDefault()}
				onDrop={(event) => {
					event.preventDefault();
					void selectFile(event.dataTransfer.files[0]);
				}}
			>
				<input
					type="file"
					accept=".csv,text/csv"
					onChange={(event) => selectFile(event.target.files?.[0])}
					className="sr-only"
				/>
				<span
					aria-hidden="true"
					className="grid size-12 place-items-center rounded-full bg-accent-soft text-xl text-accent"
				>
					↑
				</span>
				<span className="mt-4 text-sm font-semibold text-foreground">
					Seleccionar archivo CSV
				</span>
				<span className="mt-1 text-xs leading-5 text-muted">
					O arrastra un archivo aquí
				</span>
			</label>
			{fileName && <p className="mt-4 text-sm text-muted">{fileName}</p>}
			{errors.length > 0 && (
				<ul
					role="alert"
					className="mt-4 space-y-1 rounded-xl border border-danger/30 bg-danger-soft p-3 text-sm text-danger"
				>
					{errors.slice(0, 8).map((error) => (
						<li key={error}>{error}</li>
					))}
					{errors.length > 8 && (
						<li>…y {errors.length - 8} errores más.</li>
					)}
				</ul>
			)}
			{!errors.length && students.length > 0 && (
				<div className="mt-4 rounded-xl border border-border bg-surface p-3 text-sm">
					<p>
						<strong>{students.length}</strong> alumnos listos para
						importar.
					</p>
					<p className="mt-1 text-muted">
						Se crearán o actualizarán autorizaciones y los cursos
						que aún no existan en este periodo.
					</p>
				</div>
			)}
		</div>
	);
}
