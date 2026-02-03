import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBlogs, createBlog, getBlogById, updateBlog, deleteBlog, getBlogTags, createBlogTag, deleteBlogTag } from '../../../api/blog.api';
import { ApiResponse } from '../../../config/type';

export const useBlogs = () => {
    return useQuery({
        queryKey: ['blogs'],
        queryFn: getBlogs,
        select: (res: ApiResponse<any>) => {
            const data = res.data;
            if (Array.isArray(data)) return data;
            // Support Spring Boot Page<T> or similar paginated structures
            if (data && typeof data === 'object' && 'content' in data && Array.isArray(data.content)) {
                return data.content;
            }
            return [];
        },
    });
};

export const useCreateBlog = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createBlog,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blogs'] });
        },
    });
};

export const useUpdateBlog = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: any }) => updateBlog(id, data),
        onSuccess: (response) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: ['blogs'] });
                queryClient.invalidateQueries({ queryKey: ['blog'] });
            }
        },
    });
};

export const useBlogDetail = (id?: string | number) => {
    return useQuery({
        queryKey: ['blog', id],
        queryFn: () => getBlogById(id!),
        enabled: !!id,
    });
};

export const useDeleteBlog = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteBlog,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blogs'] });
        },
    });
};

// --- TAGS HOOKS ---

export const useBlogTags = () => {
    return useQuery({
        queryKey: ['blog-tags'],
        queryFn: getBlogTags,
        select: (res: ApiResponse<any>) => res.data || [],
    });
};

export const useCreateBlogTag = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createBlogTag,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blog-tags'] });
        },
    });
};

export const useDeleteBlogTag = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteBlogTag,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blog-tags'] });
        },
    });
};
