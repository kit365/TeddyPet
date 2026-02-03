import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory, getNestedCategories, getCategoryById, deleteCategory } from '../../../api/blog-category.api';
import { ApiResponse } from '../../../config/type';

export const useBlogCategories = () => {
    return useQuery({
        queryKey: ['blog-categories'],
        queryFn: getCategories,
        select: (res: ApiResponse<any[]>) => res.data || [],
    });
};

export const useNestedBlogCategories = () => {
    return useQuery({
        queryKey: ['blog-categories', 'nested'],
        queryFn: getNestedCategories,
        select: (res) => res.data,
    });
};

export const useCreateBlogCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
        },
    });
};

export const useUpdateBlogCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        // Sử dụng chung hàm createCategory, data lúc này sẽ bao gồm categoryId
        mutationFn: (data: any) => createCategory(data),
        onSuccess: (response) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
                queryClient.invalidateQueries({ queryKey: ['blog-category'] });
            }
        },
    });
};

export const useBlogCategoryDetail = (id?: string | number) => {
    return useQuery({
        queryKey: ['blog-category', id],
        queryFn: () => getCategoryById(id!),
        enabled: !!id,
    });
};

export const useDeleteBlogCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
        },
    });
};
