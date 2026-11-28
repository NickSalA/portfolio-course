"use client";

import { useTransition } from "react";
import { voidPointTransaction } from "@/app/teacher/points/actions";

export function VoidPointTransactionButton({
	transactionId,
	course,
	period,
}: {
	transactionId: number;
	course: string;
	period: string;
}) {
	const [isPending, startTransition] = useTransition();
	return (
		<button
			type="button"
			disabled={isPending}
			aria-label="Anular movimiento de puntos"
			onClick={() => {
				const reason = window.prompt(
					"Indica el motivo de la anulación:",
				);
				if (reason === null) return;
				if (!reason.trim()) {
					window.alert(
						"Escribe un motivo para anular el movimiento.",
					);
					return;
				}
				startTransition(async () => {
					const data = new FormData();
					data.set("transaction_id", String(transactionId));
					data.set("course", course);
					data.set("period", period);
					data.set("void_reason", reason.trim());
					await voidPointTransaction(data);
				});
			}}
			className="inline-flex min-h-8 items-center rounded-lg px-2 py-1 text-xs font-medium text-danger hover:bg-danger-soft hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-50"
		>
			{isPending ? "Anulando…" : "Anular"}
		</button>
	);
}
