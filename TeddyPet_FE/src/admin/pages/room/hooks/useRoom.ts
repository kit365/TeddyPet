import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getRooms,
    getRoomById,
    createOrUpdateRoom,
    deleteRoom,
    createRoomBlocking,
    type IRoom,
    type IRoomBlockingCreateRequest,
} from '../../../api/room.api';
import { ApiResponse } from '../../../config/type';

export const useRooms = (roomTypeId?: number | null) => {
    return useQuery({
        queryKey: ['rooms', roomTypeId],
        queryFn: () => getRooms(roomTypeId),
        select: (res: ApiResponse<IRoom[]>) => res.data ?? [],
    });
};

export const useRoomDetail = (id?: string | number) => {
    return useQuery({
        queryKey: ['room', id],
        queryFn: () => getRoomById(id!),
        enabled: !!id,
    });
};

export const useCreateRoom = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => createOrUpdateRoom(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
        },
    });
};

export const useUpdateRoom = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => createOrUpdateRoom(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
            queryClient.invalidateQueries({ queryKey: ['room'] });
        },
    });
};

export const useDeleteRoom = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteRoom,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
        },
    });
};

export const useCreateRoomBlocking = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: IRoomBlockingCreateRequest) => createRoomBlocking(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
        },
    });
};
