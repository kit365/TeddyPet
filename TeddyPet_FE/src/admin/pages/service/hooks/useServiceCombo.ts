import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getServiceCombos,
    getServiceComboById,
    createOrUpdateServiceCombo,
    deleteServiceCombo,
} from '../../../api/service-combo.api';
import { ApiResponse } from '../../../config/type';

export const useServiceCombos = () => {
    return useQuery({
        queryKey: ['service-combos'],
        queryFn: getServiceCombos,
        select: (res: ApiResponse<import('../configs/types').IServiceCombo[]>) => res.data ?? [],
    });
};

export const useServiceComboDetail = (id?: string | number) => {
    return useQuery({
        queryKey: ['service-combo', id],
        queryFn: () => getServiceComboById(id!),
        enabled: !!id,
    });
};

export const useCreateServiceCombo = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => createOrUpdateServiceCombo(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-combos'] });
        },
    });
};

export const useUpdateServiceCombo = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => createOrUpdateServiceCombo(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-combos'] });
            queryClient.invalidateQueries({ queryKey: ['service-combo'] });
        },
    });
};

export const useDeleteServiceCombo = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteServiceCombo,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-combos'] });
        },
    });
};
