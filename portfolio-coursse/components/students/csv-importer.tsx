"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

type StudentRow = {
	course_name: string;
	full_name: string;
	email: string;
	student_number: string;
};

type CsvImporterProps = {
	onValidated: (students: StudentRow[]) => void;
};

type Cell = string | number | boolean | null | undefined;

function headerKey(value: Cell) {
	return String(value ?? "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.trim()
		.toLowerCase();
}

function cell(row: Cell[], index: number | undefined) {
	return index === undefined ? "" : String(row[index] ?? "").trim();
}

function parseWorkbook(workbook: XLSX.WorkBook) {
	const students: StudentRow[] = [];
	const errors: string[] = [];
	const seen = new Set<string>();

	workbook.SheetNames.forEach((sheetName) => {
		const sheet = workbook.Sheets[sheetName];
		const rows = XLSX.utils.sheet_to_json<Cell[]>(sheet, {
			header: 1,
			defval: "",
			blankrows: false,
		});
		if (rows.length < 2) return;

		const headers = rows[0].map(headerKey);
		const index = Object.fromEntries(
			headers.map((header, position) => [header, position]),
		);
		const courseIndex = index.curso;
		const emailIndex = index.email ?? index["correo institucional"];
		if (courseIndex === undefined || emailIndex === undefined) {
			errors.push(
				`${sheetName}: faltan las columnas Curso y Correo institucional.`,
			);
			return;
		}

		rows.slice(1).forEach((row, rowIndex) => {
			const courseName = cell(row, courseIndex);
			const email = cell(row, emailIndex).toLowerCase();
			const directName = cell(row, index.nombre);
			const paternalName = cell(row, index["apellido paterno"]);
			const maternalName = cell(row, index["apellido materno"]);
			const fullName = [directName, paternalName, maternalName]
				.filter(Boolean)
				.join(" ");
			const studentNumber = cell(row, index.matricula);
			const rowLabel = `${sheetName}, fila ${rowIndex + 2}`;

			if (!courseName) errors.push(`${rowLabel}: falta el curso.`);
			else if (!email || !email.includes("@"))
				errors.push(`${rowLabel}: el correo no es válido.`);
			else if (seen.has(`${courseName.toLowerCase()}::${email}`))
				errors.push(
					`${rowLabel}: el correo está repetido para ese curso.`,
				);
			else {
				seen.add(`${courseName.toLowerCase()}::${email}`);
				students.push({
					course_name: courseName,
					full_name: fullName,
					email,
					student_number: studentNumber,
				});
			}
		});
	});

	return {
		students,
		errors:
			students.length || errors.length
				? errors
				: ["El archivo no contiene alumnos."],
	};
}

export function CsvImporter({ onValidated }: CsvImporterProps) {
	const [students, setStudents] = useState<StudentRow[]>([]);
	const [errors, setErrors] = useState<string[]>([]);
	const [fileName, setFileName] = useState("");

	async function selectFile(file: File | undefined) {
		setStudents([]);
		setErrors([]);
		onValidated([]);
		setFileName(file?.name ?? "");
		if (!file) return;
		if (!/\.(csv|xlsx)$/i.test(file.name)) {
			setErrors(["Selecciona un archivo CSV o XLSX."]);
			return;
		}

		try {
			const workbook = XLSX.read(await file.arrayBuffer(), {
				type: "array",
			});
			const result = parseWorkbook(workbook);
			setStudents(result.students);
			setErrors(result.errors);
			if (!result.errors.length) onValidated(result.students);
		} catch {
			setErrors([
				"No se pudo leer el archivo. Verifica que sea un CSV o XLSX válido.",
			]);
		}
	}

	return (
		<div>
			{students.length > 0 && !errors.length ? (
				<div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface-muted/45 px-4 py-3">
					<p className="min-w-0 truncate text-sm font-medium">
						{fileName}
					</p>
					<label className="shrink-0 cursor-pointer text-sm font-semibold text-accent transition hover:text-accent-strong">
						Cambiar archivo
						<input
							type="file"
							accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
							onChange={(event) =>
								selectFile(event.target.files?.[0])
							}
							className="sr-only"
						/>
					</label>
				</div>
			) : (
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
						accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
						onChange={(event) =>
							selectFile(event.target.files?.[0])
						}
						className="sr-only"
					/>
					<span
						aria-hidden="true"
						className="grid size-12 place-items-center rounded-full bg-accent-soft text-xl text-accent"
					>
						↑
					</span>
					<span className="mt-4 text-sm font-semibold text-foreground">
						Seleccionar archivo CSV o XLSX
					</span>
					<span className="mt-1 text-xs leading-5 text-muted">
						O arrastra un archivo aquí
					</span>
				</label>
			)}
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
