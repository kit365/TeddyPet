import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getStaffPositions,
    getStaffPositionById,
    createStaffPosition,
    updateStaffPosition,
    deleteStaffPosition,
    type IStaffPositionRequest,
} from '../../../../api/staffPosition.api';
import { ApiResponse } from '../../../../config/type';

export const useStaffPositions = () => {
    return useQuery({
        queryKey: ['staff-positions'],
        queryFn: () => getStaffPositions(),
        select: (res: ApiResponse<any>) => res.data ?? [],
    });
};

export const useStaffPositionById = (id?: string | number | null) => {
    return useQuery({
        queryKey: ['staff-position', id],
        queryFn: () => getStaffPositionById(id!),
        enabled: !!id,
    });
};

export const useCreateStaffPosition = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: IStaffPositionRequest) => createStaffPosition(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-positions'] }),
    });
};

export const useUpdateStaffPosition = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: IStaffPositionRequest }) => updateStaffPosition(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['staff-positions'] });
            qc.invalidateQueries({ queryKey: ['staff-position'] });
        },
    });
};

export const useDeleteStaffPosition = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deleteStaffPosition,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-positions'] }),
    });
};
