import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getProductTags, createProductTag, deleteProductTag,
    getProductAgeRanges, createProductAgeRange, updateProductAgeRange, deleteProductAgeRange, getProductAgeRangeById,
    getCountries, createProduct
} from '../../../api/product.api';
import { getBrands } from '../../../api/brand.api';
import { ApiResponse } from '../../../config/type';

// --- COUNTRIES ---
export const useCountries = () => {
    return useQuery({
        queryKey: ['countries'],
        queryFn: getCountries,
        select: (data) => data.map((country: any) => ({
            code: country.cca2,
            name: country.name.common
        })).sort((a: any, b: any) => a.name.localeCompare(b.name))
    });
};

// --- TAGS ---
export const useProductTags = () => {
    return useQuery({
        queryKey: ['product-tags'],
        queryFn: getProductTags,
        select: (res: ApiResponse<any>) => res.data || [],
    });
};

export const useCreateProductTag = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createProductTag,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-tags'] });
        },
    });
};

export const useDeleteProductTag = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteProductTag,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-tags'] });
        },
    });
};

// --- AGE RANGES ---
export const useProductAgeRanges = () => {
    return useQuery({
        queryKey: ['product-age-ranges'],
        queryFn: getProductAgeRanges,
        select: (res: ApiResponse<any>) => res.data || [],
    });
};

export const useProductAgeRangeDetail = (id?: string | number) => {
    return useQuery({
        queryKey: ['product-age-range', id],
        queryFn: () => getProductAgeRangeById(id!),
        enabled: !!id,
        select: (res: any) => res.data,
    });
};

export const useCreateProductAgeRange = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createProductAgeRange,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-age-ranges'] });
        },
    });
};

export const useUpdateProductAgeRange = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: any }) => updateProductAgeRange(id, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['product-age-ranges'] });
            queryClient.invalidateQueries({ queryKey: ['product-age-range', variables.id] });
        },
    });
};

export const useDeleteProductAgeRange = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteProductAgeRange,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-age-ranges'] });
        },
    });
};

// --- BRANDS ---
export const useBrands = () => {
    return useQuery({
        queryKey: ['brands'],
        queryFn: getBrands,
        select: (res: ApiResponse<any>) => res.data || [],
    });
};

// --- PRODUCT ---
export const useCreateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
};
