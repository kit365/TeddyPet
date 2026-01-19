import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory, getNestedCategories, getCategoryById, deleteCategory } from '../../../api/product-category.api';
import { ApiResponse } from '../../../config/type';

export const useProductCategories = () => {
    return useQuery({
        queryKey: ['product-categories'],
        queryFn: getCategories,
        select: (res: ApiResponse<any[]>) => res.data || [],
    });
};

export const useNestedProductCategories = () => {
    return useQuery({
        queryKey: ['product-categories', 'nested'],
        queryFn: getNestedCategories,
        select: (res) => res.data,
    });
};

export const useCreateProductCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-categories'] });
        },
    });
};

export const useUpdateProductCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        // Sử dụng chung hàm createCategory, data lúc này sẽ bao gồm categoryId
        mutationFn: (data: any) => createCategory(data),
        onSuccess: (response) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: ['product-categories'] });
                queryClient.invalidateQueries({ queryKey: ['product-category'] });
            }
        },
    });
};

export const useProductCategoryDetail = (id?: string | number) => {
    return useQuery({
        queryKey: ['product-category', id],
        queryFn: () => getCategoryById(id!),
        enabled: !!id,
    });
};

export const useDeleteProductCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-categories'] });
        },
    });
};
