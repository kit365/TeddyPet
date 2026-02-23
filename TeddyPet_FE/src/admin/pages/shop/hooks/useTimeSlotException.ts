import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getTimeSlotExceptions,
    getTimeSlotExceptionById,
    createOrUpdateTimeSlotException,
    deleteTimeSlotException,
} from '../../../api/time-slot-exception.api';
import { ApiResponse } from '../../../config/type';
import type { ITimeSlotException } from '../../../api/time-slot-exception.api';

export const useTimeSlotExceptions = () => {
    return useQuery({
        queryKey: ['time-slot-exceptions'],
        queryFn: getTimeSlotExceptions,
        select: (res: ApiResponse<ITimeSlotException[]>) => res.data ?? [],
    });
};

export const useTimeSlotExceptionDetail = (id?: string | number) => {
    return useQuery({
        queryKey: ['time-slot-exception', id],
        queryFn: () => getTimeSlotExceptionById(id!),
        enabled: !!id,
    });
};

export const useCreateOrUpdateTimeSlotException = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Parameters<typeof createOrUpdateTimeSlotException>[0]) => createOrUpdateTimeSlotException(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['time-slot-exceptions'] });
            queryClient.invalidateQueries({ queryKey: ['time-slot-exception'] });
        },
    });
};

export const useDeleteTimeSlotException = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteTimeSlotException,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['time-slot-exceptions'] });
        },
    });
};
