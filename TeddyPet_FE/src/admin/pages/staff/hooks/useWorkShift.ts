import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    createOpenShift,
    createOpenShiftsBatch,
    updateOpenShift,
    cancelOpenShift,
    deleteAllWorkShifts,
    getWorkShiftById,
    getRegistrationsForShift,
    getShiftRoleConfigs,
    setShiftRoleConfigs,
    approveRegistration,
    setRegistrationOnLeave,
    rejectLeaveRequest,
    runAutoFillForShift,
    finalizeShiftApprovals,
    cancelAdminRegistration,
    getAvailableShifts,
    getShiftsForAdminByDateRange,
    registerForShift,
    cancelMyRegistration,
    requestLeave,
    undoLeave,
    getShiftsByStaffAndDateRange,
    getMyShifts,
    getMyRegistrations,
    type IOpenShiftRequest,
    type IShiftRoleConfigItemRequest,
} from '../../../api/workShift.api';
import { ApiResponse } from '../../../config/type';

const EMPTY_ARR: never[] = [];

export const useWorkShiftById = (shiftId?: number | null) => {
    return useQuery({
        queryKey: ['work-shift', shiftId],
        queryFn: () => getWorkShiftById(shiftId!),
        enabled: !!shiftId,
    });
};

export const useRegistrationsForShift = (shiftId?: number | null) => {
    return useQuery({
        queryKey: ['work-shift-registrations', shiftId],
        queryFn: () => getRegistrationsForShift(shiftId!),
        enabled: !!shiftId,
        select: (res: ApiResponse<any>) => res.data ?? EMPTY_ARR,
    });
};

export const useShiftRoleConfigs = (shiftId?: number | null) => {
    return useQuery({
        queryKey: ['work-shift-role-configs', shiftId],
        queryFn: () => getShiftRoleConfigs(shiftId!),
        enabled: !!shiftId,
        select: (res: ApiResponse<any>) => res.data ?? EMPTY_ARR,
    });
};

export const useSetShiftRoleConfigs = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ shiftId, configs }: { shiftId: number; configs: IShiftRoleConfigItemRequest[] }) =>
            setShiftRoleConfigs(shiftId, configs),
        onSuccess: (_, { shiftId }) => {
            qc.invalidateQueries({ queryKey: ['work-shift-role-configs', shiftId] });
        },
    });
};

export const useCreateOpenShift = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: IOpenShiftRequest) => createOpenShift(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['work-shift'] });
            qc.invalidateQueries({ queryKey: ['available-shifts'] });
            qc.refetchQueries({ queryKey: ['available-shifts'] });
        },
    });
};

export const useCreateOpenShiftsBatch = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (shifts: IOpenShiftRequest[]) => createOpenShiftsBatch(shifts),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['work-shift'] });
            qc.invalidateQueries({ queryKey: ['available-shifts'] });
        },
    });
};

export const useUpdateOpenShift = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ shiftId, data }: { shiftId: number; data: IOpenShiftRequest }) => updateOpenShift(shiftId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['work-shift'] });
            qc.invalidateQueries({ queryKey: ['available-shifts'] });
        },
    });
};

export const useCancelOpenShift = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (shiftId: number) => cancelOpenShift(shiftId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['work-shift'] });
            qc.invalidateQueries({ queryKey: ['available-shifts'] });
        },
    });
};

export const useDeleteAllWorkShifts = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => deleteAllWorkShifts(),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-shifts'] });
            qc.invalidateQueries({ queryKey: ['work-shift'] });
            qc.invalidateQueries({ queryKey: ['available-shifts'] });
            qc.invalidateQueries({ queryKey: ['my-shifts'] });
            qc.invalidateQueries({ queryKey: ['my-registrations'] });
        },
    });
};

export const useApproveRegistration = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ shiftId, registrationId }: { shiftId: number; registrationId: number }) =>
            approveRegistration(shiftId, registrationId),
        onSuccess: (_, { shiftId }) => {
            qc.invalidateQueries({ queryKey: ['work-shift', shiftId] });
            qc.invalidateQueries({ queryKey: ['work-shift-registrations', shiftId] });
        },
    });
};

export const useSetRegistrationOnLeave = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ shiftId, registrationId }: { shiftId: number; registrationId: number }) =>
            setRegistrationOnLeave(shiftId, registrationId),
        onSuccess: (_, { shiftId }) => {
            qc.invalidateQueries({ queryKey: ['work-shift-registrations', shiftId] });
        },
    });
};

/** Admin: Từ chối xin nghỉ (PENDING_LEAVE → APPROVED) */
export const useRejectLeaveRequest = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ shiftId, registrationId }: { shiftId: number; registrationId: number }) =>
            rejectLeaveRequest(shiftId, registrationId),
        onSuccess: (_, { shiftId }) => {
            qc.invalidateQueries({ queryKey: ['work-shift-registrations', shiftId] });
        },
    });
};

/** Admin: Hủy xếp ca – xóa đăng ký (PENDING hoặc APPROVED) khỏi ca để nhả slot. */
export const useCancelAdminRegistration = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ shiftId, registrationId }: { shiftId: number; registrationId: number }) =>
            cancelAdminRegistration(shiftId, registrationId),
        onSuccess: (_, { shiftId }) => {
            qc.invalidateQueries({ queryKey: ['work-shift-registrations', shiftId] });
            qc.invalidateQueries({ queryKey: ['available-shifts'] });
        },
    });
};

/** Admin: Điền ca theo lịch cố định – cập nhật định mức và gán Full-time (trạng thái Chờ duyệt). */
export const useRunAutoFillForShift = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (shiftId: number) => runAutoFillForShift(shiftId),
        onSuccess: (_, shiftId) => {
            qc.invalidateQueries({ queryKey: ['work-shift-registrations', shiftId] });
            qc.invalidateQueries({ queryKey: ['work-shift-role-configs', shiftId] });
            qc.invalidateQueries({ queryKey: ['available-shifts'] });
            qc.invalidateQueries({ queryKey: ['my-shifts'] });
            qc.invalidateQueries({ queryKey: ['my-registrations'] });
        },
    });
};

/** Admin: Duyệt lần cuối – duyệt Part-time chờ duyệt (nếu có) và khóa ca (nhân viên không thể đăng ký/xin nghỉ). */
export const useFinalizeShiftApprovals = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (shiftId: number) => finalizeShiftApprovals(shiftId),
        onSuccess: (_, shiftId) => {
            qc.invalidateQueries({ queryKey: ['work-shift-registrations', shiftId] });
            qc.invalidateQueries({ queryKey: ['work-shift-role-configs', shiftId] });
            qc.invalidateQueries({ queryKey: ['available-shifts'] });
            qc.invalidateQueries({ queryKey: ['admin-shifts'] });
            qc.invalidateQueries({ queryKey: ['my-shifts'] });
            qc.invalidateQueries({ queryKey: ['my-registrations'] });
        },
    });
};

export const useAvailableShifts = (from?: string | null, to?: string | null) => {
    return useQuery({
        queryKey: ['available-shifts', from, to],
        queryFn: () => getAvailableShifts(from, to),
        select: (res: ApiResponse<any>) => res.data ?? [],
    });
};

/** Admin: danh sách ca trong khoảng (OPEN + ASSIGNED) để hiển thị grid, kể cả ca đã khóa */
export const useShiftsForAdmin = (from?: string | null, to?: string | null) => {
    return useQuery({
        queryKey: ['admin-shifts', from, to],
        queryFn: () => getShiftsForAdminByDateRange(from, to),
        select: (res: ApiResponse<any>) => res.data ?? [],
    });
};

export const useRegisterForShift = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (shiftId: number) => registerForShift(shiftId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['available-shifts'] });
            qc.invalidateQueries({ queryKey: ['my-shifts'] });
            qc.invalidateQueries({ queryKey: ['my-registrations'] });
            qc.invalidateQueries({ queryKey: ['admin-shifts'] });
        },
    });
};

/** Part-time: Hoàn tác đăng ký ca (hủy đăng ký PENDING) */
export const useCancelMyRegistration = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (shiftId: number) => cancelMyRegistration(shiftId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['available-shifts'] });
            qc.invalidateQueries({ queryKey: ['my-shifts'] });
            qc.invalidateQueries({ queryKey: ['my-registrations'] });
            qc.invalidateQueries({ queryKey: ['admin-shifts'] });
        },
    });
};

/** Full-time: Xin nghỉ ca (chuyển sang ON_LEAVE, nhả slot cho Part-time đăng ký bù) */
export const useRequestLeave = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (shiftId: number) => requestLeave(shiftId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['available-shifts'] });
            qc.invalidateQueries({ queryKey: ['my-shifts'] });
            qc.invalidateQueries({ queryKey: ['my-registrations'] });
        },
    });
};

/** Full-time: Hoàn tác xin nghỉ (ON_LEAVE -> APPROVED) */
export const useUndoLeave = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (shiftId: number) => undoLeave(shiftId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['available-shifts'] });
            qc.invalidateQueries({ queryKey: ['my-shifts'] });
            qc.invalidateQueries({ queryKey: ['my-registrations'] });
        },
    });
};

export const useMyRegistrations = (from?: string | null, to?: string | null) => {
    return useQuery({
        queryKey: ['my-registrations', from, to],
        queryFn: () => getMyRegistrations(from, to),
        select: (res: ApiResponse<any>) => res.data ?? [],
    });
};

export const useShiftsByStaffAndDateRange = (staffId?: number | null, from?: string | null, to?: string | null) => {
    return useQuery({
        queryKey: ['staff-shifts', staffId, from, to],
        queryFn: () => getShiftsByStaffAndDateRange(staffId!, from, to),
        enabled: !!staffId,
        select: (res: ApiResponse<any>) => res.data ?? [],
    });
};

export const useMyShifts = (from?: string | null, to?: string | null) => {
    return useQuery({
        queryKey: ['my-shifts', from, to],
        queryFn: () => getMyShifts(from, to),
        select: (res: ApiResponse<any>) => res.data ?? [],
    });
};
