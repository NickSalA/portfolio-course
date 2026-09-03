import { redirect } from "next/navigation";

export default async function GroupsPage({
	searchParams,
}: {
	searchParams: Promise<{ period?: string }>;
}) {
	const { period } = await searchParams;
	redirect(
		`/teacher${period ? `?period=${encodeURIComponent(period)}` : ""}`,
	);
}
