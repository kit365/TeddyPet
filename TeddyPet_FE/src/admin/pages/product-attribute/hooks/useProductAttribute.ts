import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getProductAttributes,
    getProductAttributeDetail,
    deleteProductAttribute,
    updateProductAttribute,
    getDisplayTypes,
    getSalesUnits,
    getMeasurementUnits,
    createProductAttribute
} from '../../../api/product-attribute.api';
import { ApiResponse } from '../../../config/type';

export const useProductAttributes = () => {
    return useQuery({
        queryKey: ['product-attributes'],
        queryFn: getProductAttributes,
        select: (res: ApiResponse<any[]>) => res.data || [],
    });
};

export const useProductAttributeDetail = (id: string | undefined) => {
    return useQuery({
        queryKey: ['product-attribute-detail', id],
        queryFn: () => getProductAttributeDetail(id!),
        enabled: !!id,
    });
};

export const useDisplayTypes = () => {
    return useQuery({
        queryKey: ['display-types'],
        queryFn: getDisplayTypes,
        select: (res: ApiResponse<any[]>) => res.data || [],
    });
};

export const useSalesUnits = () => {
    return useQuery({
        queryKey: ['sales-units'],
        queryFn: getSalesUnits,
        select: (res: ApiResponse<any[]>) => res.data || [],
    });
};

export const useMeasurementUnits = () => {
    return useQuery({
        queryKey: ['measurement-units'],
        queryFn: getMeasurementUnits,
        select: (res: ApiResponse<any[]>) => res.data || [],
    });
};

export const useCreateProductAttribute = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createProductAttribute,
        onSuccess: (response: any) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: ['product-attributes'] });
            }
        },
    });
};

export const useUpdateProductAttribute = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number | string; data: any }) => updateProductAttribute(id, data),
        onSuccess: (response: any) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: ['product-attributes'] });
                queryClient.invalidateQueries({ queryKey: ['product-attribute-detail'] });
            }
        },
    });
};

export const useDeleteProductAttribute = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteProductAttribute,
        onSuccess: (response: any) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: ['product-attributes'] });
            }
        },
    });
};
