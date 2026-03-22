import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';

const STAFF_BASE = '/api/staff/work-shifts';
const ADMIN_BASE = '/api/admin/work-shifts';

const withAuth = () => ({
    headers: { Authorization: `Bearer ${Cookies.get('tokenAdmin')}` },
});

export type ShiftStatus = 'OPEN' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PENDING_LEAVE' | 'ON_LEAVE';

export interface IWorkShift {
    shiftId: number;
    staffId?: number | null;
    staffFullName?: string | null;
    startTime: string;
    endTime: string;
    status: ShiftStatus;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    version?: number | null;
}

export type WorkType = 'FULL_TIME' | 'PART_TIME';

/** Slot theo vai trò cho một ca (để Part-time biết còn chỗ đăng ký không) */
export interface IRoleSlotInfo {
    positionId: number;
    positionName: string;
    maxSlots: number;
    approvedCount: number;
    available: number;
}

/** Ca trống trả về cho staff (kèm roleSlots) */
export interface IAvailableShiftForStaff {
    shiftId: number;
    startTime: string;
    endTime: string;
    status: ShiftStatus;
    roleSlots: IRoleSlotInfo[];
}

export interface IWorkShiftRegistration {
    registrationId: number;
    workShiftId: number;
    staffId: number;
    staffFullName: string;
    roleAtRegistrationName?: string | null;
    workType?: WorkType | null;
    status: RegistrationStatus;
    registeredAt: string;
    /** Lý do xin nghỉ do nhân viên nhập (nếu có) */
    leaveReason?: string | null;
    /** Chỉ có khi status = PENDING_LEAVE: APPROVED_LEAVE | REJECTED_LEAVE; áp dụng khi admin bấm Duyệt lần cuối */
    leaveDecision?: string | null;
}

export interface IOpenShiftRequest {
    startTime: string; // ISO datetime
    endTime: string;
}

export interface IWorkShiftBookingPetServiceItem {
    bookingPetServiceId: number;
    bookingCode: string;
    bookingId: number;
    customerName?: string | null;
    petName?: string | null;
    serviceName?: string | null;
    bookingDateFrom?: string | null;
    scheduledStartTime?: string | null;
    scheduledEndTime?: string | null;
    /** Dịch vụ đơn có isRequiredRoom — UI hiển thị theo bookingCheckInDate */
    serviceRequiresRoom?: boolean | null;
    bookingCheckInDate?: string | null;
    /** Từ service.required_staff_count */
    requiredStaffCount?: number | null;
}

/** Preview: NV trong ca đích + SL yêu cầu (GET assign-options) */
export interface IStaffShiftOption {
    staffId: number;
    fullName: string;
    positionName?: string | null;
}

export interface IWorkShiftAssignOptions {
    requiredStaffCount: number;
    shiftId: number;
    shortage: boolean;
    participatingStaff: IStaffShiftOption[];
}

export interface IWorkShiftBookingPetServicePool {
    inWeek: IWorkShiftBookingPetServiceItem[];
    waiting: IWorkShiftBookingPetServiceItem[];
}

/** Booking dịch vụ đã xếp lịch trùng khung ca (GET .../assigned-booking-pet-services) */
export interface IWorkShiftAssignedBookingPetServiceItem {
    bookingPetServiceId: number;
    bookingCode?: string | null;
    customerName?: string | null;
    petName?: string | null;
    serviceName?: string | null;
    scheduledStartTime?: string | null;
    scheduledEndTime?: string | null;
    /** Tên nhân viên được gán xử lý (cách nhau bởi dấu phẩy) */
    assignedStaffNames?: string | null;
}

/** Admin: create open shift */
export const createOpenShift = async (data: IOpenShiftRequest): Promise<ApiResponse<IWorkShift>> => {
    const res = await apiApp.post(ADMIN_BASE, data, withAuth());
    return res.data;
};

/** Admin: create many open shifts at once (e.g. standard week template) */
export const createOpenShiftsBatch = async (shifts: IOpenShiftRequest[]): Promise<ApiResponse<IWorkShift[]>> => {
    const res = await apiApp.post(`${ADMIN_BASE}/batch`, { shifts }, withAuth());
    return res.data;
};

/** Admin: update open shift (OPEN only) */
export const updateOpenShift = async (shiftId: number, data: IOpenShiftRequest): Promise<ApiResponse<IWorkShift>> => {
    const res = await apiApp.put(`${ADMIN_BASE}/${shiftId}`, data, withAuth());
    return res.data;
};

/** Admin: cancel/delete open shift (OPEN only) */
export const cancelOpenShift = async (shiftId: number): Promise<ApiResponse<unknown>> => {
    const res = await apiApp.delete(`${ADMIN_BASE}/${shiftId}`, withAuth());
    return res.data;
};

/** Admin: xóa tất cả ca làm (và đăng ký, định mức) – để tạo lại từ đầu */
export const deleteAllWorkShifts = async (): Promise<ApiResponse<void>> => {
    const res = await apiApp.delete(`${ADMIN_BASE}/all`, withAuth());
    return res.data;
};

/** Admin: lấy danh sách ca trong khoảng (OPEN + ASSIGNED), kể cả ca đã khóa sau Duyệt lần cuối */
export const getShiftsForAdminByDateRange = async (
    from?: string | null,
    to?: string | null
): Promise<ApiResponse<IWorkShift[]>> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await apiApp.get(ADMIN_BASE, { ...withAuth(), params });
    return res.data;
};

/** Ca: danh sách BPS đã có scheduled overlap với [start,end] ca */
export const getAssignedBookingPetServicesForShift = async (
    shiftId: number
): Promise<ApiResponse<IWorkShiftAssignedBookingPetServiceItem[]>> => {
    const res = await apiApp.get(`${ADMIN_BASE}/${shiftId}/assigned-booking-pet-services`, withAuth());
    return res.data;
};

export const getAssignableBookingPetServices = async (
    from?: string | null,
    to?: string | null
): Promise<ApiResponse<IWorkShiftBookingPetServicePool>> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await apiApp.get(`${ADMIN_BASE}/booking-pet-services`, { ...withAuth(), params });
    return res.data;
};

/** Admin: xem trước ca đích + danh sách NV trong ca (không ghi DB) */
export const getAssignOptionsForBookingPetService = async (
    bookingPetServiceId: number
): Promise<ApiResponse<IWorkShiftAssignOptions>> => {
    const res = await apiApp.get(
        `${ADMIN_BASE}/booking-pet-services/${bookingPetServiceId}/assign-options`,
        withAuth()
    );
    return res.data;
};

/** Admin: get shift by id */
export const getWorkShiftById = async (shiftId: number): Promise<ApiResponse<IWorkShift>> => {
    const res = await apiApp.get(`${ADMIN_BASE}/${shiftId}`, withAuth());
    return res.data;
};

/** Admin: get role configs (định mức theo vai trò) for a shift */
export interface IShiftRoleConfig {
    positionId: number;
    positionName: string;
    maxSlots: number;
}

export interface IShiftRoleConfigItemRequest {
    positionId: number;
    maxSlots: number;
}

export const getShiftRoleConfigs = async (shiftId: number): Promise<ApiResponse<IShiftRoleConfig[]>> => {
    const res = await apiApp.get(`${ADMIN_BASE}/${shiftId}/role-configs`, withAuth());
    return res.data;
};

/** Admin: set role configs for a shift (e.g. Thu ngân 1, Spa 2). Only OPEN shifts. */
export const setShiftRoleConfigs = async (
    shiftId: number,
    configs: IShiftRoleConfigItemRequest[]
): Promise<ApiResponse<IShiftRoleConfig[]>> => {
    const res = await apiApp.put(`${ADMIN_BASE}/${shiftId}/role-configs`, configs, withAuth());
    return res.data;
};

/** Admin: get registrations for a shift */
export const getRegistrationsForShift = async (shiftId: number): Promise<ApiResponse<IWorkShiftRegistration[]>> => {
    const res = await apiApp.get(`${ADMIN_BASE}/${shiftId}/registrations`, withAuth());
    return res.data;
};

/** Admin: approve registration */
export const approveRegistration = async (shiftId: number, registrationId: number): Promise<ApiResponse<IWorkShift>> => {
    const res = await apiApp.post(`${ADMIN_BASE}/${shiftId}/registrations/${registrationId}/approve`, {}, withAuth());
    return res.data;
};

/** Admin: Duyệt xin nghỉ – chuyển Xin nghỉ chờ duyệt sang Đã nghỉ (nhả slot cho Part-time đăng ký bù) */
export const setRegistrationOnLeave = async (shiftId: number, registrationId: number): Promise<ApiResponse<IWorkShiftRegistration>> => {
    const res = await apiApp.put(`${ADMIN_BASE}/${shiftId}/registrations/${registrationId}/on-leave`, {}, withAuth());
    return res.data;
};

/** Admin: Từ chối xin nghỉ – chuyển Xin nghỉ chờ duyệt về Đã xếp ca */
export const rejectLeaveRequest = async (shiftId: number, registrationId: number): Promise<ApiResponse<IWorkShiftRegistration>> => {
    const res = await apiApp.put(`${ADMIN_BASE}/${shiftId}/registrations/${registrationId}/reject-leave`, {}, withAuth());
    return res.data;
};

/** Admin: Điền ca theo lịch cố định – tạo định mức mặc định (nếu chưa có) và gán Full-time trùng lịch (trạng thái Chờ duyệt). */
export const runAutoFillForShift = async (shiftId: number): Promise<ApiResponse<void>> => {
    const res = await apiApp.post(`${ADMIN_BASE}/${shiftId}/auto-fill`, {}, withAuth());
    return res.data;
};

/** Admin: Duyệt lần cuối – chuyển tất cả đăng ký Chờ duyệt của ca sang Đã duyệt; sau đó "Ca của tôi" mới hiển thị. */
export const finalizeShiftApprovals = async (shiftId: number): Promise<ApiResponse<void>> => {
    const res = await apiApp.post(`${ADMIN_BASE}/${shiftId}/finalize-approvals`, {}, withAuth());
    return res.data;
};

/** Admin: Hủy xếp ca – xóa đăng ký khỏi ca để nhả slot. */
export const cancelAdminRegistration = async (shiftId: number, registrationId: number): Promise<ApiResponse<void>> => {
    const res = await apiApp.delete(`${ADMIN_BASE}/${shiftId}/registrations/${registrationId}`, withAuth());
    return res.data;
};

export const assignBookingPetServiceToShift = async (
    shiftId: number,
    bookingPetServiceId: number,
    staffIds: number[]
): Promise<ApiResponse<void>> => {
    const res = await apiApp.put(
        `${ADMIN_BASE}/${shiftId}/booking-pet-services/${bookingPetServiceId}/assign`,
        { staffIds },
        withAuth()
    );
    return res.data;
};

/** Tự tìm ca ASSIGNED phù hợp (phòng: buổi theo check-in; không phòng: overlap khung giờ) + gán nhân viên. */
export const assignBookingPetServiceToShiftAuto = async (
    bookingPetServiceId: number,
    staffIds: number[]
): Promise<ApiResponse<void>> => {
    const res = await apiApp.put(
        `${ADMIN_BASE}/booking-pet-services/${bookingPetServiceId}/assign-auto`,
        { staffIds },
        withAuth()
    );
    return res.data;
};

export const unassignBookingPetService = async (
    bookingPetServiceId: number
): Promise<ApiResponse<void>> => {
    const res = await apiApp.put(`${ADMIN_BASE}/booking-pet-services/${bookingPetServiceId}/unassign`, {}, withAuth());
    return res.data;
};

/** Staff: get available shifts with slot info per role (Part-time: show Đăng ký only when available > 0) */
export const getAvailableShifts = async (from?: string | null, to?: string | null): Promise<ApiResponse<IAvailableShiftForStaff[]>> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await apiApp.get(`${STAFF_BASE}/available`, { ...withAuth(), params });
    return res.data;
};

/** Staff (Full-time): Xin nghỉ ca – chuyển sang ON_LEAVE, nhả slot cho Part-time đăng ký bù */
export const requestLeave = async (shiftId: number, reason?: string): Promise<ApiResponse<IWorkShiftRegistration>> => {
    const payload = reason ? { reason } : {};
    const res = await apiApp.post(`${STAFF_BASE}/${shiftId}/request-leave`, payload, withAuth());
    return res.data;
};

/** Staff: register for shift (chỉ Part-time). positionId = undefined: chức vụ chính; có thể truyền chức vụ phụ để đăng ký bù. */
export const registerForShift = async (
    shiftId: number,
    positionId?: number | null
): Promise<ApiResponse<IWorkShiftRegistration>> => {
    const params = positionId != null ? { positionId } : {};
    const res = await apiApp.post(`${STAFF_BASE}/${shiftId}/register`, null, {
        ...withAuth(),
        params,
    });
    return res.data;
};

/** Staff (Part-time): undo register (hủy đăng ký PENDING) */
export const cancelMyRegistration = async (shiftId: number): Promise<ApiResponse<void>> => {
    const res = await apiApp.delete(`${STAFF_BASE}/${shiftId}/register`, withAuth());
    return res.data;
};

/** Staff (Full-time): undo leave (ON_LEAVE -> APPROVED) */
export const undoLeave = async (shiftId: number): Promise<ApiResponse<IWorkShiftRegistration>> => {
    const res = await apiApp.post(`${STAFF_BASE}/${shiftId}/undo-leave`, {}, withAuth());
    return res.data;
};

/** Get shifts by staff and date range */
export const getShiftsByStaffAndDateRange = async (
    staffId: number,
    from?: string | null,
    to?: string | null
): Promise<ApiResponse<IWorkShift[]>> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await apiApp.get(`${STAFF_BASE}/staff/${staffId}`, { ...withAuth(), params });
    return res.data;
};

/** Staff: get my shifts */
export const getMyShifts = async (from?: string | null, to?: string | null): Promise<ApiResponse<IWorkShift[]>> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await apiApp.get(`${STAFF_BASE}/my-shifts`, { ...withAuth(), params });
    return res.data;
};

/** Staff: get my pending registrations (ca đã đăng ký chờ duyệt) */
export const getMyRegistrations = async (from?: string | null, to?: string | null): Promise<ApiResponse<IWorkShiftRegistration[]>> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await apiApp.get(`${STAFF_BASE}/my-registrations`, { ...withAuth(), params });
    return res.data;
};
