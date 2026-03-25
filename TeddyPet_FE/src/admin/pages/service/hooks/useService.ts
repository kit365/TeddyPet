import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getServices,
    getServicesByCategoryId,
    getServiceById,
    getServicePricings,
    createOrUpdateService,
    deleteService,
} from '../../../api/service.api';
import { ApiResponse } from '../../../config/type';

export const useServices = () => {
    return useQuery({
        queryKey: ['services'],
        queryFn: () => getServices(),
        select: (res: ApiResponse<import('../configs/types').IService[]>) => res.data ?? [],
    });
};

export const useServicesByCategory = (categoryId: number | undefined) => {
    return useQuery({
        queryKey: ['services', 'category', categoryId],
        queryFn: () => getServicesByCategoryId(categoryId!),
        enabled: !!categoryId,
        select: (res: ApiResponse<import('../configs/types').IService[]>) => res.data ?? [],
    });
};

export const useServiceDetail = (id?: string | number) => {
    return useQuery({
        queryKey: ['service', id],
        queryFn: () => getServiceById(id!),
        enabled: !!id,
    });
};

export const useServicePricings = (serviceId: number | undefined) => {
    return useQuery({
        queryKey: ['service-pricings', serviceId],
        queryFn: () => getServicePricings(serviceId!),
        enabled: !!serviceId,
        select: (res: ApiResponse<import('../configs/types').IServicePricing[]>) => res.data ?? [],
    });
};

export const useCreateService = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => createOrUpdateService(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
        },
    });
};

export const useUpdateService = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => createOrUpdateService(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
            queryClient.invalidateQueries({ queryKey: ['service'] });
            queryClient.invalidateQueries({ queryKey: ['service-pricings'] });
        },
    });
};

export const useDeleteService = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteService,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
        },
    });
};
