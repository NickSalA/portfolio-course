export type AcademicPeriodStatus = "draft" | "upcoming" | "current" | "closed";

export type WorkspacePeriod = {
  id: number;
  code: string;
  academic_year: number;
  semester: number;
  status: AcademicPeriodStatus;
};

export type WorkspaceCourse = {
  id: number;
  public_id: string;
  name: string;
  description: string | null;
  academic_periods: { code: string } | { code: string }[] | null;
};

export function periodForCourse(course: WorkspaceCourse) {
  return Array.isArray(course.academic_periods)
    ? course.academic_periods[0]
    : course.academic_periods;
}

export function periodName(semester: number) {
  return semester === 0
    ? "Verano"
    : semester === 1
      ? "Primer periodo"
      : "Segundo periodo";
}
