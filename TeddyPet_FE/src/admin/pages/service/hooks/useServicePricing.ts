import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getServicePricingsByServiceId,
    getServicePricingById,
    createOrUpdateServicePricing,
    deleteServicePricing,
} from '../../../api/service-pricing.api';
import { ApiResponse } from '../../../config/type';

export const useServicePricingsByServiceId = (serviceId: number | undefined) => {
    return useQuery({
        queryKey: ['service-pricings', 'by-service', serviceId],
        queryFn: () => getServicePricingsByServiceId(serviceId!),
        enabled: !!serviceId,
        select: (res: ApiResponse<import('../configs/types').IServicePricing[]>) => res.data ?? [],
    });
};

export const useServicePricingDetail = (id?: string | number) => {
    return useQuery({
        queryKey: ['service-pricing', id],
        queryFn: () => getServicePricingById(id!),
        enabled: !!id,
    });
};

export const useCreateServicePricing = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => createOrUpdateServicePricing(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['service-pricings'] });
            const serviceId = variables?.serviceId as number | undefined;
            if (serviceId) {
                queryClient.invalidateQueries({ queryKey: ['service-pricings', 'by-service', serviceId] });
                queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
                queryClient.invalidateQueries({ queryKey: ['services'] });
            }
        },
    });
};

export const useUpdateServicePricing = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => createOrUpdateServicePricing(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['service-pricings'] });
            const serviceId = variables?.serviceId as number | undefined;
            if (serviceId) {
                queryClient.invalidateQueries({ queryKey: ['service-pricings', 'by-service', serviceId] });
                queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
                queryClient.invalidateQueries({ queryKey: ['services'] });
            }
        },
    });
};

export const useDeleteServicePricing = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteServicePricing,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-pricings'] });
            // We only get pricingId as variables; invalidate service detail broadly so derived basePrice refreshes
            queryClient.invalidateQueries({ queryKey: ['service'] });
            queryClient.invalidateQueries({ queryKey: ['services'] });
        },
    });
};
