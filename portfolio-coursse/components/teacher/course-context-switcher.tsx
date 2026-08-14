"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type CourseOption = { publicId: string; name: string };

export function CourseContextSwitcher({ courses }: { courses: CourseOption[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCourse = searchParams.get("course") ?? "";

  function selectCourse(coursePublicId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (coursePublicId) params.set("course", coursePublicId);
    else params.delete("course");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span>Curso</span>
      <select value={selectedCourse} onChange={(event) => selectCourse(event.target.value)} className="max-w-60 rounded-lg border border-border bg-surface-muted px-3 py-2 font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent">
        <option value="">Todos los cursos</option>
        {courses.map((course) => <option key={course.publicId} value={course.publicId}>{course.name}</option>)}
      </select>
    </label>
  );
}
