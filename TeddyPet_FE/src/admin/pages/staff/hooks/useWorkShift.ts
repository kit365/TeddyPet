import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    createOpenShift,
    getWorkShiftById,
    getRegistrationsForShift,
    approveRegistration,
    getAvailableShifts,
    registerForShift,
    getShiftsByStaffAndDateRange,
    getMyShifts,
    type IOpenShiftRequest,
} from '../../../api/workShift.api';
import { ApiResponse } from '../../../config/type';

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
        select: (res: ApiResponse<any>) => res.data ?? [],
    });
};

export const useCreateOpenShift = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: IOpenShiftRequest) => createOpenShift(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['work-shift'] });
            qc.invalidateQueries({ queryKey: ['available-shifts'] });
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

export const useAvailableShifts = (from?: string | null, to?: string | null) => {
    return useQuery({
        queryKey: ['available-shifts', from, to],
        queryFn: () => getAvailableShifts(from, to),
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
        },
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
