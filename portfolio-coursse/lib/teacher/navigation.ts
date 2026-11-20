export type TeacherNavContext = {
	period: string | null;
	course: string | null;
};

type SearchParamReader = {
	get(name: string): string | null;
};

const COURSE_ROUTE_PATTERN = /^\/teacher\/courses\/([^/?#]+)/;

/**
 * Extracts active period and course public IDs from the current URL so
 * sidebar links keep academic context across teacher modules.
 */
export function resolveTeacherNavContext(
	pathname: string,
	searchParams: SearchParamReader,
): TeacherNavContext {
	const period = searchParams.get("period");
	const queryCourse = searchParams.get("course");
	const routeCourse = pathname.match(COURSE_ROUTE_PATTERN)?.[1] ?? null;

	return {
		period: period || null,
		course: queryCourse || routeCourse || null,
	};
}

/**
 * Builds a teacher module href preserving period (and course when supported).
 */
export function buildTeacherNavHref(
	baseHref: string,
	context: TeacherNavContext,
	preserveCourse = false,
): string {
	const params = new URLSearchParams();
	if (context.period) {
		params.set("period", context.period);
	}
	if (preserveCourse && context.course) {
		params.set("course", context.course);
	}
	const query = params.toString();
	return query ? `${baseHref}?${query}` : baseHref;
}
