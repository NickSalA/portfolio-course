"use client";

import { useState } from "react";

type Student = {
	id: number;
	full_name: string | null;
	email: string;
	status: string;
};

export function StudentList({ students }: { students: Student[] }) {
	const pageSize = 10;
	const [page, setPage] = useState(0);
	const pages = Math.ceil(students.length / pageSize);
	const visible = students.slice(page * pageSize, (page + 1) * pageSize);

	return (
		<section className="glass mt-5 overflow-hidden rounded-3xl border border-white/25 shadow-[0_20px_55px_rgb(15_23_42/8%)]">
			<div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-4 border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted sm:px-6">
				<span>Alumno</span>
				<span>Acceso y grupo</span>
			</div>
			<div className="divide-y divide-border">
				{visible.map((student) => (
					<article
						key={student.id}
						className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-4 px-5 py-4 sm:px-6"
					>
						<div className="min-w-0">
							<p className="truncate font-medium">
								{student.full_name || "Sin nombre"}
							</p>
							<p className="mt-1 truncate text-sm text-muted">
								{student.email}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted">Aún no ingresó</p>
							<p className="mt-1 text-sm text-muted">
								Autorizado para este curso
							</p>
						</div>
					</article>
				))}
				{!students.length && (
					<p className="px-5 py-8 text-sm text-muted sm:px-6">
						Aún no hay alumnos autorizados para este curso.
					</p>
				)}
			</div>
			{pages > 1 && (
				<div className="flex items-center justify-between gap-4 border-t border-border px-5 py-3 text-sm sm:px-6">
					<p className="text-muted">
						Mostrando {page * pageSize + 1}–
						{Math.min((page + 1) * pageSize, students.length)} de{" "}
						{students.length}
					</p>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() =>
								setPage((current) => Math.max(current - 1, 0))
							}
							disabled={page === 0}
							className="rounded-lg border border-border px-3 py-1.5 font-medium disabled:opacity-40"
						>
							Anterior
						</button>
						<button
							type="button"
							onClick={() =>
								setPage((current) =>
									Math.min(current + 1, pages - 1),
								)
							}
							disabled={page === pages - 1}
							className="rounded-lg border border-border px-3 py-1.5 font-medium disabled:opacity-40"
						>
							Siguiente
						</button>
					</div>
				</div>
			)}
		</section>
	);
}
