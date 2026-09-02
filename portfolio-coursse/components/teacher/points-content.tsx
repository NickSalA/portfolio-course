"use client";

import { useEffect, useState } from "react";
import { CourseContextSwitcher } from "@/components/teacher/course-context-switcher";
import { PointsStudentList } from "@/components/teacher/points-student-list";
import { useTeacherDataCache } from "@/components/teacher/teacher-data-provider";

type Course = { id: number; public_id: string; name: string };
type Transaction = {
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
type PointsResponse = { courses: Course[]; students: Student[] };

function resourceKey(periodPublicId: string, coursePublicId: string | null) {
	return `points:${periodPublicId}:${coursePublicId ?? "all"}`;
}

export function PointsContent({
	periodPublicId,
	selectedCoursePublicId,
	refresh,
}: {
	periodPublicId: string;
	selectedCoursePublicId: string | null;
	refresh: boolean;
}) {
	const { read, load, invalidate } = useTeacherDataCache();
	const key = resourceKey(periodPublicId, selectedCoursePublicId);
	const [data, setData] = useState<PointsResponse | null>(() =>
		refresh ? null : read<PointsResponse>(key),
	);
	const [loading, setLoading] = useState(
		() => refresh || !read<PointsResponse>(key),
	);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		const cached = read<PointsResponse>(key);
		if (refresh) invalidate(`points:${periodPublicId}:`);
		if (cached && !refresh) {
			return () => {
				active = false;
			};
		}
		const params = new URLSearchParams({ period: periodPublicId });
		if (selectedCoursePublicId)
			params.set("course", selectedCoursePublicId);
		void load(key, async () => {
			const response = await fetch(
				`/api/teacher/points?${params.toString()}`,
			);
			if (!response.ok)
				throw new Error("No se pudieron cargar los datos.");
			return (await response.json()) as PointsResponse;
		})
			.then((nextData) => {
				if (active) setData(nextData);
			})
			.catch((cause: unknown) => {
				if (active)
					setError(
						cause instanceof Error
							? cause.message
							: "No se pudieron cargar los datos.",
					);
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
	}, [
		invalidate,
		key,
		periodPublicId,
		read,
		refresh,
		selectedCoursePublicId,
		load,
	]);

	const courses = data?.courses ?? [];
	const selectedCourse =
		courses.find((course) => course.public_id === selectedCoursePublicId) ??
		null;

	function selectCourse(coursePublicId: string) {
		const params = new URLSearchParams({ period: periodPublicId });
		if (coursePublicId) params.set("course", coursePublicId);
		window.history.pushState(
			null,
			"",
			`/teacher/points?${params.toString()}`,
		);
	}

	return (
		<div className="mt-6">
			<CourseContextSwitcher
				clientNavigation
				courses={courses.map((course) => ({
					publicId: course.public_id,
					name: course.name,
				}))}
			/>
			{loading && (
				<p className="mt-6 text-sm text-muted">Cargando cursos…</p>
			)}
			{error && (
				<p
					role="alert"
					className="mt-6 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
				>
					{error}
				</p>
			)}
			{!loading && !error && selectedCourse && (
				<PointsStudentList
					course={selectedCourse.public_id}
					period={periodPublicId}
					students={data?.students ?? []}
				/>
			)}
			{!loading && !error && !selectedCourse && (
				<section className="mt-6">
					<p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
						Cursos
					</p>
					<h2 className="mt-2 text-xl font-semibold">
						Selecciona un curso
					</h2>
					<div className="mt-4 grid gap-3 md:grid-cols-2">
						{courses.map((course) => (
							<button
								key={course.id}
								type="button"
								onClick={() => selectCourse(course.public_id)}
								className="glass flex items-center justify-between rounded-2xl border border-white/25 p-5 text-left transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
							>
								<span className="font-medium">
									{course.name}
								</span>
								<span
									aria-hidden="true"
									className="text-xl text-muted"
								>
									→
								</span>
							</button>
						))}
						{!courses.length && (
							<p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted">
								Aún no hay cursos en este periodo.
							</p>
						)}
					</div>
				</section>
			)}
		</div>
	);
}
