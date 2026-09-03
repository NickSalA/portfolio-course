import { selectStudentGroup } from "@/app/student/actions";
import { createClient } from "@/lib/supabase/server";

type Props = {
	enrollmentId: number;
	currentGroupId: number | null;
	opensAt: string | null;
	closesAt: string | null;
};

function formatLima(value: string) {
	return new Intl.DateTimeFormat("es-PE", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: "America/Lima",
	}).format(new Date(value));
}

export async function GroupSelection({
	enrollmentId,
	currentGroupId,
	opensAt,
	closesAt,
}: Props) {
	const supabase = await createClient();
	const { data: groups } =
		opensAt && closesAt
			? await supabase.rpc("available_course_group_details", {
					enrollment_id: enrollmentId,
				})
			: { data: [] };
	if (!opensAt || !closesAt)
		return (
			<p className="mt-5 text-sm text-muted">
				La selección de grupo aún no está configurada.
			</p>
		);
	return (
		<section className="mt-5 border-t border-border pt-4">
			<div className="rounded-xl border border-border bg-surface-muted/40 px-4 py-3">
				<p className="text-sm font-medium">Elige o cambia tu grupo</p>
				<p className="mt-1 text-xs leading-5 text-muted">
					Disponible desde {formatLima(opensAt)} hasta{" "}
					{formatLima(closesAt)}.
				</p>
			</div>
			<div className="mt-3 max-h-112 space-y-3 overflow-y-auto pr-1">
				{(groups ?? []).map(
					(group: {
						id: number;
						group_position: number;
						capacity: number;
						active_members: number;
						members: { full_name: string | null; email: string }[];
					}) => {
						const full = group.active_members >= group.capacity;
						const current = group.id === currentGroupId;
						return (
							<form
								key={group.id}
								action={selectStudentGroup}
								className="rounded-xl border border-border bg-surface-muted/55 p-4"
							>
								<input
									type="hidden"
									name="enrollment_id"
									value={enrollmentId}
								/>
								<input
									type="hidden"
									name="group_id"
									value={group.id}
								/>
								<div className="flex items-start justify-between gap-4">
									<div className="min-w-0">
										<p className="text-sm font-medium">
											Grupo {group.group_position}
										</p>
										<p className="mt-1 text-xs text-muted">
											{group.active_members}/
											{group.capacity} integrantes
										</p>
										{group.members.length > 0 && (
											<p className="mt-2 text-xs leading-5 text-muted">
												{group.members
													.map(
														(member) =>
															member.full_name ||
															member.email,
													)
													.join(", ")}
											</p>
										)}
									</div>
									<button
										disabled={full && !current}
										className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
									>
										{current
											? "Seleccionado"
											: full
												? "Lleno"
												: "Elegir"}
									</button>
								</div>
							</form>
						);
					},
				)}
				{!(groups ?? []).length && (
					<p className="text-sm text-muted">
						No hay grupos disponibles.
					</p>
				)}
			</div>
		</section>
	);
}
