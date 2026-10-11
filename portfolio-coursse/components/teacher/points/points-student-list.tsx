"use client";

import { useState } from "react";
import { PointTransactionDialog } from "@/components/teacher/points/point-transaction-dialog";
import { ExportPointsButton } from "@/components/teacher/points/export-points-button";

type Transaction = {
	id: number;
	is_voided: boolean;
	points: number;
	reason: string | null;
	created_at: string;
};
type Student = {
	id: number;
	full_name: string | null;
	email: string;
	point_transactions: Transaction[] | null;
};

export function PointsStudentList({
	course,
	courseName,
	period,
	students,
}: {
	course: string;
	courseName?: string;
	period: string;
	students: Student[];
}) {
	const pageSize = 10;
	const [filter, setFilter] = useState("");
	const [page, setPage] = useState(0);
	const filteredStudents = students.filter((student) =>
		`${student.full_name ?? ""} ${student.email}`
			.toLowerCase()
			.includes(filter.toLowerCase()),
	);
	const pages = Math.ceil(filteredStudents.length / pageSize);
	const visibleStudents = filteredStudents.slice(
		page * pageSize,
		(page + 1) * pageSize,
	);

	function updateFilter(value: string) {
		setFilter(value);
		setPage(0);
	}

	return (
		<>
			<div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<label className="block w-full max-w-xl text-sm text-muted">
					Filtrar por nombre
					<input
						value={filter}
						onChange={(event) => updateFilter(event.target.value)}
						placeholder="Escribe un nombre…"
						autoComplete="off"
						className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
					/>
				</label>
				<div className="shrink-0">
					<ExportPointsButton
						students={students}
						courseName={courseName ?? course}
					/>
				</div>
			</div>
			<section className="glass mt-5 overflow-hidden rounded-3xl border border-white/25 shadow-[0_20px_55px_rgb(15_23_42/8%)]">
				<div className="grid grid-cols-[minmax(0,1fr)_7rem_9rem] gap-4 border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted sm:px-6">
					<span>Alumno</span>
					<span className="text-right">Saldo</span>
					<span className="text-right">Movimientos</span>
				</div>
				<div className="divide-y divide-border">
					{visibleStudents.map((student) => {
						const transactions = (
							student.point_transactions ?? []
						).filter((transaction) => !transaction.is_voided);
						const balance = transactions.reduce(
							(total, transaction) => total + transaction.points,
							0,
						);
						return (
							<article
								key={student.id}
								className="grid grid-cols-[minmax(0,1fr)_7rem_9rem] items-center gap-4 px-5 py-4 sm:px-6"
							>
								<div className="min-w-0">
									<p className="truncate font-medium">
										{student.full_name || "Sin nombre"}
									</p>
									<p className="mt-1 truncate text-sm text-muted">
										{student.email}
									</p>
								</div>
								<p className="text-right text-lg font-semibold tabular-nums">
									{balance > 0 ? `+${balance}` : balance}
								</p>
								<div className="flex justify-end">
									<PointTransactionDialog
										course={course}
										period={period}
										student={{
											id: student.id,
											name:
												student.full_name ||
												"Sin nombre",
											email: student.email,
											balance,
											transactions,
										}}
									/>
								</div>
							</article>
						);
					})}
					{!visibleStudents.length && (
						<p className="px-5 py-8 text-sm text-muted">
							No hay alumnos que coincidan con “{filter}”.
						</p>
					)}
				</div>
				{pages > 1 && (
					<div className="flex items-center justify-between gap-4 border-t border-border px-5 py-3 text-sm sm:px-6">
						<p className="text-muted">
							Mostrando {page * pageSize + 1}–
							{Math.min(
								(page + 1) * pageSize,
								filteredStudents.length,
							)}{" "}
							de {filteredStudents.length}
						</p>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={() =>
									setPage((current) =>
										Math.max(current - 1, 0),
									)
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
		</>
	);
}
