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
			onClick={() =>
				startTransition(async () => {
					const data = new FormData();
					data.set("transaction_id", String(transactionId));
					data.set("course", course);
					data.set("period", period);
					await voidPointTransaction(data);
				})
			}
			className="text-xs font-medium text-danger hover:underline disabled:cursor-wait disabled:opacity-50"
		>
			{isPending ? "Anulando…" : "Anular"}
		</button>
	);
}
