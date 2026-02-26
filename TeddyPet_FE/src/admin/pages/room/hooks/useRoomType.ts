import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getRoomTypes,
    getRoomTypeById,
    createOrUpdateRoomType,
    deleteRoomType,
    type IRoomType,
} from '../../../api/room.api';
import { ApiResponse } from '../../../config/type';

export const useRoomTypes = (serviceId?: number | null) => {
    return useQuery({
        queryKey: ['room-types', serviceId],
        queryFn: () => getRoomTypes(serviceId),
        select: (res: ApiResponse<IRoomType[]>) => res.data ?? [],
    });
};

export const useRoomTypeDetail = (id?: string | number) => {
    return useQuery({
        queryKey: ['room-type', id],
        queryFn: () => getRoomTypeById(id!),
        enabled: !!id,
    });
};

export const useCreateRoomType = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => createOrUpdateRoomType(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['room-types'] });
        },
    });
};

export const useUpdateRoomType = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => createOrUpdateRoomType(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['room-types'] });
            queryClient.invalidateQueries({ queryKey: ['room-type'] });
        },
    });
};

export const useDeleteRoomType = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteRoomType,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['room-types'] });
        },
    });
};
