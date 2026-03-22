import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';
import type { CareTask, EmployeeTask, SpaTask, TaskBaseStatus } from '../types/employeeDashboard';

const BASE = '/api/staff/tasks';

const withAuth = () => ({
    headers: { Authorization: `Bearer ${Cookies.get('tokenAdmin')}` },
});

export const getTodayStaffTasks = async (): Promise<ApiResponse<EmployeeTask[]>> => {
    const res = await apiApp.get(`${BASE}/today`, withAuth());
    const body = res.data as ApiResponse<unknown[]>;
    const rawList = body?.data;
    const mapped = Array.isArray(rawList) ? rawList.map(mapServerTaskToEmployeeTask).filter(Boolean) : [];
    return {
        ...body,
        data: mapped as EmployeeTask[],
    };
};

function toIsoString(v: unknown): string | undefined {
    if (v == null) return undefined;
    if (typeof v === 'string') return v;
    return undefined;
}

function normalizeStatus(s: unknown): TaskBaseStatus {
    const u = String(s ?? '')
        .trim()
        .toUpperCase();
    if (u === 'IN_PROGRESS' || u === 'COMPLETED' || u === 'PENDING') return u as TaskBaseStatus;
    return 'PENDING';
}

function mapSpaServiceType(st: unknown): SpaTask['serviceType'] {
    const s = String(st ?? '')
        .trim()
        .toUpperCase();
    if (s === 'COMBO' || s === 'HAIRCUT' || s === 'NAIL' || s === 'SHOWER') return s;
    return 'SHOWER';
}

/** Chuẩn hóa payload BE (EmployeeTaskResponse) → CareTask | SpaTask */
export function mapServerTaskToEmployeeTask(item: unknown): EmployeeTask | null {
    if (!item || typeof item !== 'object') return null;
    const o = item as Record<string, unknown>;
    const id = o.id;
    if (typeof id !== 'number' && typeof id !== 'string') return null;

    const status = normalizeStatus(o.status);
    const createdAt = toIsoString(o.createdAt) ?? new Date().toISOString();
    const base = {
        id,
        title: String(o.title ?? ''),
        description: o.description != null ? String(o.description) : null,
        status,
        createdAt,
        scheduledStart: toIsoString(o.scheduledStart) ?? null,
        scheduledEnd: toIsoString(o.scheduledEnd) ?? null,
        startedAt: toIsoString(o.startedAt) ?? null,
        finishedAt: toIsoString(o.finishedAt) ?? null,
        bookingCode: o.bookingCode != null ? String(o.bookingCode) : undefined,
        customerName: o.customerName != null ? String(o.customerName) : undefined,
    };

    const type = String(o.type ?? '')
        .trim()
        .toUpperCase();

    if (type === 'CARE') {
        const care: CareTask = {
            ...base,
            type: 'CARE',
            cageNumber: String(o.cageNumber ?? '—'),
            petName: String(o.petName ?? ''),
            petSpecies: String(o.petSpecies ?? ''),
            notes: o.notes != null ? String(o.notes) : null,
        };
        return care;
    }

    const bookingTime =
        toIsoString(o.bookingTime) ?? toIsoString(o.scheduledStart) ?? toIsoString(o.createdAt) ?? createdAt;
    const duration =
        typeof o.durationMinutes === 'number' && Number.isFinite(o.durationMinutes) ? o.durationMinutes : 60;

    const spa: SpaTask = {
        ...base,
        type: 'SPA',
        petName: String(o.petName ?? ''),
        petSpecies: String(o.petSpecies ?? ''),
        serviceType: mapSpaServiceType(o.serviceType),
        bookingTime,
        durationMinutes: duration,
    };
    return spa;
}
