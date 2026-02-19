import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getServiceCategories,
    getNestedServiceCategories,
    getServiceCategoryById,
    createOrUpdateServiceCategory,
    deleteServiceCategory,
} from '../../../api/service-category.api';
import { ApiResponse } from '../../../config/type';

export const useServiceCategories = () => {
    return useQuery({
        queryKey: ['service-categories'],
        queryFn: getServiceCategories,
        select: (res: ApiResponse<import('../configs/types').IServiceCategory[]>) => res.data ?? [],
    });
};

export const useNestedServiceCategories = () => {
    return useQuery({
        queryKey: ['service-categories', 'nested'],
        queryFn: getNestedServiceCategories,
        select: (res: ApiResponse<import('../configs/types').IServiceCategoryNode[]>) => res.data ?? [],
    });
};

export const useServiceCategoryDetail = (id?: string | number) => {
    return useQuery({
        queryKey: ['service-category', id],
        queryFn: () => getServiceCategoryById(id!),
        enabled: !!id,
    });
};

export const useCreateServiceCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Parameters<typeof createOrUpdateServiceCategory>[0]) =>
            createOrUpdateServiceCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-categories'] });
        },
    });
};

export const useUpdateServiceCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Parameters<typeof createOrUpdateServiceCategory>[0]) =>
            createOrUpdateServiceCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-categories'] });
            queryClient.invalidateQueries({ queryKey: ['service-category'] });
        },
    });
};

export const useDeleteServiceCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteServiceCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-categories'] });
        },
    });
};
