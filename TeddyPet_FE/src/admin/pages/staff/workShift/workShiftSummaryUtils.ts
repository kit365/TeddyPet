import dayjs from 'dayjs';
import type { IWorkShift, IWorkShiftRegistration } from '../../../api/workShift.api';

export const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/** Chỉ số cột ngày (0=T2, 6=CN) từ ISO */
export function getDayIndex(iso: string): number {
    const d = dayjs(iso).day();
    return d === 0 ? 6 : d - 1;
}
/** 0 = sáng, 1 = chiều */
export function getSlotIndex(iso: string): number {
    return dayjs(iso).hour() >= 12 ? 1 : 0;
}
export function formatTimeRange(start: string, end: string): string {
    return `${dayjs(start).format('HH:mm')} - ${dayjs(end).format('HH:mm')}`;
}

export interface SummaryStaffItem {
    name: string;
    roleName: string;
}
export interface SummarySlot {
    slotLabel: string;
    timeRange: string;
    staffList: SummaryStaffItem[];
}
export interface SummaryDay {
    dayLabel: string;
    dateStr: string;
    slots: SummarySlot[];
}
export interface SummaryCell {
    timeRange: string;
    staffByRole: Record<string, string[]>;
}
export interface SummaryMatrix {
    rowLabels: string[];
    columnLabels: string[];
    columnDates: string[];
    matrix: SummaryCell[][];
}

function isParticipatingInShift(reg: IWorkShiftRegistration): boolean {
    return (
        reg.status === 'APPROVED' ||
        (reg.status === 'PENDING_LEAVE' && String(reg.leaveDecision ?? '').toUpperCase() === 'REJECTED_LEAVE')
    );
}

function groupStaffByRole(staffList: SummaryStaffItem[]): Record<string, string[]> {
    const map: Record<string, string[]> = {};
    for (const s of staffList) {
        const role = s.roleName?.trim() || '—';
        if (!map[role]) map[role] = [];
        map[role].push(s.name);
    }
    return map;
}

const DAY_NAMES = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
const SLOT_NAMES = ['Ca Sáng', 'Ca Chiều'];

export function groupShiftsForSummary(
    shifts: IWorkShift[],
    registrationsByShiftId: Record<number, IWorkShiftRegistration[]>
): SummaryDay[] {
    const byDay: Record<number, { dayLabel: string; dateStr: string; slots: SummarySlot[] }> = {};
    for (let i = 0; i < 7; i++) {
        byDay[i] = { dayLabel: DAY_NAMES[i], dateStr: '', slots: [] };
    }
    const sortedShifts = [...shifts].sort((a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf());

    for (const shift of sortedShifts) {
        const dayIndex = getDayIndex(shift.startTime);
        const slotIndex = getSlotIndex(shift.startTime);
        if (dayIndex < 0 || dayIndex > 6 || slotIndex < 0 || slotIndex > 1) continue;

        const regs = registrationsByShiftId[shift.shiftId] ?? [];
        const staffList: SummaryStaffItem[] = regs.filter(isParticipatingInShift).map((r) => ({
            name: r.staffFullName?.trim() || '—',
            roleName: r.roleAtRegistrationName?.trim() || '—',
        }));

        if (!byDay[dayIndex].dateStr) {
            byDay[dayIndex].dateStr = dayjs(shift.startTime).format('DD/MM/YYYY');
        }
        byDay[dayIndex].slots[slotIndex] = {
            slotLabel: SLOT_NAMES[slotIndex],
            timeRange: formatTimeRange(shift.startTime, shift.endTime),
            staffList,
        };
    }

    return DAY_NAMES.map((_, i) => ({
        dayLabel: byDay[i].dayLabel,
        dateStr: byDay[i].dateStr || '—',
        slots: byDay[i].slots.filter(Boolean),
    }));
}

export function buildSummaryMatrix(summaryData: SummaryDay[]): SummaryMatrix {
    const rowLabels = ['Ca Sáng', 'Ca Chiều'];
    const columnLabels = DAY_LABELS;
    const columnDates = summaryData.slice(0, 7).map((d) => d.dateStr);
    const emptyCell = (): SummaryCell => ({ timeRange: '—', staffByRole: {} });
    const matrix: SummaryCell[][] = [];
    for (let r = 0; r < 2; r++) {
        matrix[r] = [];
        for (let c = 0; c < 7; c++) matrix[r][c] = emptyCell();
    }
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const day = summaryData[dayIndex];
        if (!day) continue;
        for (let slotIndex = 0; slotIndex <= 1; slotIndex++) {
            const slot = day.slots[slotIndex];
            matrix[slotIndex][dayIndex] = slot
                ? { timeRange: slot.timeRange, staffByRole: groupStaffByRole(slot.staffList) }
                : emptyCell();
        }
    }
    return { rowLabels, columnLabels, columnDates, matrix };
}

/** Thứ tự chức vụ cố định để cùng chức vụ luôn nằm trên cùng một hàng ngang. */
const ROLE_SORT_KEYWORDS = ['chăm sóc', 'bán hàng', 'thu ngân', 'spa', 'groomer'];

function getRoleSortKey(roleName: string): number {
    const lower = roleName.toLowerCase();
    if (lower === '—') return 999;
    const idx = ROLE_SORT_KEYWORDS.findIndex((kw) => lower.includes(kw));
    return idx >= 0 ? idx : 998;
}

export interface RoleRowData {
    roleName: string;
    cellsByDay: string[][];
}

export interface SlotBlockData {
    slotLabel: string;
    timeRangeByDay: string[];
    roleRows: RoleRowData[];
}

/** Chuyển matrix thành từng khối ca (Ca Sáng / Ca Chiều), mỗi ca có các hàng theo chức vụ (cùng chức vụ = 1 hàng ngang). */
export function buildMatrixByRole(matrix: SummaryMatrix): SlotBlockData[] {
    const result: SlotBlockData[] = [];
    for (let slotIndex = 0; slotIndex <= 1; slotIndex++) {
        const roleSet = new Set<string>();
        for (let d = 0; d < 7; d++) {
            const cell = matrix.matrix[slotIndex]?.[d];
            if (cell?.staffByRole) Object.keys(cell.staffByRole).forEach((r) => roleSet.add(r));
        }
        const sortedRoles = Array.from(roleSet).sort((a, b) => {
            const ka = getRoleSortKey(a);
            const kb = getRoleSortKey(b);
            if (ka !== kb) return ka - kb;
            return a.localeCompare(b);
        });
        const roleRows: RoleRowData[] = sortedRoles.map((roleName) => ({
            roleName,
            cellsByDay: Array.from({ length: 7 }, (_, dayIndex) => {
                const names = matrix.matrix[slotIndex]?.[dayIndex]?.staffByRole[roleName];
                return names ?? [];
            }),
        }));
        const timeRangeByDay = Array.from({ length: 7 }, (_, dayIndex) => matrix.matrix[slotIndex]?.[dayIndex]?.timeRange ?? '—');
        result.push({
            slotLabel: matrix.rowLabels[slotIndex] ?? (slotIndex === 0 ? 'Ca Sáng' : 'Ca Chiều'),
            timeRangeByDay,
            roleRows,
        });
    }
    return result;
}
