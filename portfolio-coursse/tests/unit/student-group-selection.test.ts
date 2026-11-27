import { describe, expect, it } from "vitest";
import {
	getGroupOptionViewModel,
	getStudentWindowState,
	mapGroupSelectionRpcError,
	normalizeGroupOptions,
	STUDENT_GROUP_ERROR_MESSAGES,
} from "../../lib/student/group-selection";

describe("student group selection helpers", () => {
	it("computes window status badges and Lima schedule across [opens, closes) boundaries", () => {
		const opens = "2026-11-24T15:00:00.000Z"; // 10:00 Lima
		const closes = "2026-11-24T17:00:00.000Z"; // 12:00 Lima

		expect(getStudentWindowState(null, closes)).toMatchObject({
			status: "unconfigured",
			badgeLabel: "Sin configurar",
			heading: "Selección de grupo",
		});

		const beforeOpen = getStudentWindowState(
			opens,
			closes,
			new Date("2026-11-24T14:59:59.999Z"),
		);
		expect(beforeOpen).toMatchObject({
			status: "scheduled",
			badgeLabel: "Programada",
		});
		expect(beforeOpen.description).toContain("10:00 (Lima)");
		expect(beforeOpen.description).toContain("12:00 (Lima)");

		const atOpen = getStudentWindowState(
			opens,
			closes,
			new Date("2026-11-24T15:00:00.000Z"),
		);
		expect(atOpen).toMatchObject({
			status: "open",
			badgeLabel: "Abierta",
			heading: "Elige o cambia tu grupo",
		});

		const justBeforeClose = getStudentWindowState(
			opens,
			closes,
			new Date("2026-11-24T16:59:59.999Z"),
		);
		expect(justBeforeClose.status).toBe("open");

		const atClose = getStudentWindowState(
			opens,
			closes,
			new Date("2026-11-24T17:00:00.000Z"),
		);
		expect(atClose).toMatchObject({
			status: "closed",
			badgeLabel: "Cerrada",
		});
		expect(atClose.description).toContain("reabra");
	});

	it("builds group option view models distinguishing initial choice, change, current, full, and closed states", () => {
		const g1 = { id: 10, group_position: 1, capacity: 3, active_members: 1 };
		const gFull = { id: 11, group_position: 2, capacity: 2, active_members: 2 };

		expect(
			getGroupOptionViewModel({
				group: g1,
				currentGroupId: null,
				windowStatus: "open",
				courseName: "Automatización",
			}),
		).toMatchObject({
			name: "Grupo 1",
			isCurrent: false,
			isFull: false,
			availableSeats: 2,
			occupancyLabel: "1/3 integrantes",
			availabilityLabel: "2 cupos disponibles",
			canSelect: true,
			actionLabel: "Elegir grupo",
			ariaActionLabel: "Elegir grupo: Grupo 1 en Automatización",
		});

		expect(
			getGroupOptionViewModel({
				group: g1,
				currentGroupId: 99,
				windowStatus: "open",
				courseName: "Automatización",
			}),
		).toMatchObject({
			canSelect: true,
			actionLabel: "Cambiar a este grupo",
			ariaActionLabel: "Cambiar a este grupo: Grupo 1 en Automatización",
		});

		expect(
			getGroupOptionViewModel({
				group: g1,
				currentGroupId: 10,
				windowStatus: "open",
				courseName: "Automatización",
			}),
		).toMatchObject({
			isCurrent: true,
			canSelect: false,
			availabilityLabel: "Tu grupo actual",
			actionLabel: "Seleccionado",
			ariaActionLabel: "Grupo 1 ya es tu grupo actual en Automatización",
		});

		expect(
			getGroupOptionViewModel({
				group: gFull,
				currentGroupId: 10,
				windowStatus: "open",
				courseName: "Automatización",
			}),
		).toMatchObject({
			isFull: true,
			availableSeats: 0,
			canSelect: false,
			availabilityLabel: "Sin cupo",
			actionLabel: "Lleno",
		});

		expect(
			getGroupOptionViewModel({
				group: g1,
				currentGroupId: null,
				windowStatus: "closed",
				courseName: "Automatización",
			}),
		).toMatchObject({
			canSelect: false,
			actionLabel: "Ventana cerrada",
		});

		expect(
			getGroupOptionViewModel({
				group: g1,
				currentGroupId: null,
				windowStatus: "scheduled",
				courseName: "Automatización",
			}),
		).toMatchObject({
			canSelect: false,
			actionLabel: "Aún no abre",
		});
	});

	it("maps RPC errors to clear Spanish messages and codes", () => {
		expect(mapGroupSelectionRpcError("group_full")).toEqual({
			code: "group-full",
			message: STUDENT_GROUP_ERROR_MESSAGES["group-full"],
		});
		expect(mapGroupSelectionRpcError("group_selection_closed")).toEqual({
			code: "group-closed",
			message: STUDENT_GROUP_ERROR_MESSAGES["group-closed"],
		});
		expect(mapGroupSelectionRpcError("group_not_available")).toEqual({
			code: "group-unavailable",
			message: STUDENT_GROUP_ERROR_MESSAGES["group-unavailable"],
		});
		expect(mapGroupSelectionRpcError("enrollment_not_found")).toEqual({
			code: "enrollment-not-found",
			message: STUDENT_GROUP_ERROR_MESSAGES["enrollment-not-found"],
		});
		expect(mapGroupSelectionRpcError("not_authenticated")).toEqual({
			code: "not-authenticated",
			message: STUDENT_GROUP_ERROR_MESSAGES["not-authenticated"],
		});
		expect(mapGroupSelectionRpcError("unexpected error")).toEqual({
			code: "group",
			message: STUDENT_GROUP_ERROR_MESSAGES.group,
		});
		expect(mapGroupSelectionRpcError(null)).toEqual({
			code: "group",
			message: STUDENT_GROUP_ERROR_MESSAGES.group,
		});
	});

	it("normalizes RPC group options and strips unexpected member attributes", () => {
		const normalized = normalizeGroupOptions([
			{
				id: 5,
				group_position: 2,
				capacity: 4,
				active_members: 2,
				members: [
					{ full_name: " Ana Torres ", email: "leak@example.test" },
					{ full_name: "   " },
					null,
				],
			},
			{ id: "bad", group_position: 1 },
			null,
		]);

		expect(normalized).toEqual([
			{
				id: 5,
				group_position: 2,
				capacity: 4,
				active_members: 2,
				members: [{ full_name: "Ana Torres" }],
			},
		]);
		expect(normalizeGroupOptions(null)).toEqual([]);
	});
});
