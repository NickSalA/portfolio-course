import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    createClient,
    revalidatePath,
    redirect,
    maybeSingle,
    from,
    update,
    eq,
    inStatus,
    select,
} = vi.hoisted(() => ({
    createClient: vi.fn(),
    revalidatePath: vi.fn(),
    redirect: vi.fn((path: string): never => {
        throw new Error(path);
    }),
    maybeSingle: vi.fn(),
    from: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    inStatus: vi.fn(),
    select: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/academic/calendar", () => ({}));

import { updatePeriodDates } from "../../app/teacher/periods/actions";

beforeEach(() => {
    vi.clearAllMocks();
    createClient.mockResolvedValue({ from });
    from.mockReturnValue({ update });
    update.mockReturnValue({ eq });
    eq.mockReturnValue({ in: inStatus });
    inStatus.mockReturnValue({ select });
    select.mockReturnValue({ maybeSingle });
});

function periodForm() {
    const form = new FormData();
    form.set("period_id", "12");
    form.set("starts_at", "2026-01-01");
    form.set("ends_at", "2026-06-30");
    return form;
}

describe("updatePeriodDates", () => {
    it("revalidates and redirects only after updating a matching period", async () => {
        maybeSingle.mockResolvedValue({ data: { id: 12 }, error: null });

        await expect(updatePeriodDates(periodForm())).rejects.toThrow(
            "/teacher/periods",
        );
        expect(from).toHaveBeenCalledWith("academic_periods");
        expect(update).toHaveBeenCalledWith({
            starts_at: "2026-01-01",
            ends_at: "2026-06-30",
        });
        expect(eq).toHaveBeenCalledWith("id", 12);
        expect(inStatus).toHaveBeenCalledWith("status", [
            "upcoming",
            "current",
        ]);
        expect(select).toHaveBeenCalledWith("id");
        expect(revalidatePath).toHaveBeenCalledWith("/teacher/periods");
        expect(redirect).toHaveBeenCalledWith("/teacher/periods");
    });

    it.each([
        { data: null, error: null },
        { data: null, error: { message: "database error" } },
    ])(
        "redirects with an error when no update is confirmed: %o",
        async (result) => {
            maybeSingle.mockResolvedValue(result);

            await expect(updatePeriodDates(periodForm())).rejects.toThrow(
                "/teacher/periods?error=period-status",
            );
            expect(redirect).toHaveBeenCalledWith(
                "/teacher/periods?error=period-status",
            );
            expect(revalidatePath).not.toHaveBeenCalled();
        },
    );
});
