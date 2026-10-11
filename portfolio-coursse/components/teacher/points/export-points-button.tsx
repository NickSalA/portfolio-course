"use client";

import * as XLSX from "xlsx";

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

export function ExportPointsButton({
	students,
	courseName,
}: {
	students: Student[];
	courseName: string;
}) {
	function handleExport() {
		const summaryData = students.map((student) => {
			const activeTransactions = (
				student.point_transactions ?? []
			).filter((transaction) => !transaction.is_voided);
			const balance = activeTransactions.reduce(
				(total, transaction) => total + transaction.points,
				0,
			);

			return {
				"Nombre Completo": student.full_name || "Sin nombre",
				Correo: student.email,
				"Puntos Acumulados": balance,
			};
		});

		const detailsData = students.flatMap((student) => {
			const activeTransactions = (
				student.point_transactions ?? []
			).filter((transaction) => !transaction.is_voided);

			return activeTransactions.map((transaction) => ({
				"Nombre Completo": student.full_name || "Sin nombre",
				Correo: student.email,
				Puntos: transaction.points,
				Motivo: transaction.reason || "Sin motivo",
				Fecha: new Date(transaction.created_at).toLocaleString(),
			}));
		});

		const workbook = XLSX.utils.book_new();

		const summarySheet = XLSX.utils.json_to_sheet(summaryData);
		XLSX.utils.book_append_sheet(workbook, summarySheet, "Saldos");

		if (detailsData.length > 0) {
			const detailsSheet = XLSX.utils.json_to_sheet(detailsData);
			XLSX.utils.book_append_sheet(
				workbook,
				detailsSheet,
				"Detalle Movimientos",
			);
		}

		const safeCourseName = courseName
			? courseName.trim().replace(/[^a-zA-Z0-9-_]/g, "_")
			: "Curso";
		const dateStamp = new Date().toISOString().split("T")[0];

		XLSX.writeFile(workbook, `Puntos_${safeCourseName}_${dateStamp}.xlsx`);
	}

	return (
		<button
			type="button"
			onClick={handleExport}
			disabled={students.length === 0}
			className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
			title="Exportar a archivo Excel"
		>
			<svg
				className="h-4 w-4 shrink-0"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
				/>
			</svg>
			<span>Exportar a Excel</span>
		</button>
	);
}
