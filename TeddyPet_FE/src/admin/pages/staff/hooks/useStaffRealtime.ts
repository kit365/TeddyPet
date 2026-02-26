import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getRealtimeStatus,
    setAvailable,
    setBusy,
    setOffline,
    setOnBreak,
    updateRealtimeStatus,
    type StaffRealtimeStatus,
} from '../../../api/staffRealtime.api';

export const useRealtimeStatus = (staffId?: number | null) => {
    return useQuery({
        queryKey: ['staff-realtime', staffId],
        queryFn: () => getRealtimeStatus(staffId!),
        enabled: !!staffId,
    });
};

export const useSetRealtimeAvailable = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: setAvailable,
        onSuccess: (_, staffId) => qc.invalidateQueries({ queryKey: ['staff-realtime', staffId] }),
    });
};

export const useSetRealtimeBusy = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ staffId, bookingId }: { staffId: number; bookingId: string }) => setBusy(staffId, bookingId),
        onSuccess: (_, { staffId }) => qc.invalidateQueries({ queryKey: ['staff-realtime', staffId] }),
    });
};

export const useSetRealtimeOffline = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: setOffline,
        onSuccess: (_, staffId) => qc.invalidateQueries({ queryKey: ['staff-realtime', staffId] }),
    });
};

export const useSetRealtimeOnBreak = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: setOnBreak,
        onSuccess: (_, staffId) => qc.invalidateQueries({ queryKey: ['staff-realtime', staffId] }),
    });
};

export const useUpdateRealtimeStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            staffId,
            status,
            bookingId,
        }: {
            staffId: number;
            status: StaffRealtimeStatus;
            bookingId?: string | null;
        }) => updateRealtimeStatus(staffId, status, bookingId),
        onSuccess: (_, { staffId }) => qc.invalidateQueries({ queryKey: ['staff-realtime', staffId] }),
    });
};
