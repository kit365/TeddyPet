import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAmenityCategoriesAdmin,
    getAmenityCategoryById,
    createAmenityCategory,
    updateAmenityCategory,
    deleteAmenityCategory,
    getAmenityCategoriesWithAmenities,
} from '../../../api/amenity.api';
import { ApiResponse } from '../../../config/type';
import type { IAmenityCategory, IAmenityCategoryWithAmenities } from '../../../api/amenity.api';

export const useAmenityCategoriesAdmin = () => {
    return useQuery({
        queryKey: ['amenity-categories-admin'],
        queryFn: () => getAmenityCategoriesAdmin(),
        select: (res: ApiResponse<IAmenityCategory[]>) => res.data ?? [],
    });
};

export const useAmenityCategoriesWithAmenities = () => {
    return useQuery({
        queryKey: ['amenity-categories-with-amenities'],
        queryFn: () => getAmenityCategoriesWithAmenities(),
        select: (res: ApiResponse<IAmenityCategoryWithAmenities[]>) => res.data ?? [],
    });
};

export const useAmenityCategoryDetail = (id?: string | null) => {
    return useQuery({
        queryKey: ['amenity-category', id],
        queryFn: () => getAmenityCategoryById(id!),
        enabled: !!id,
    });
};

export const useCreateAmenityCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => createAmenityCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['amenity-categories-admin'] });
            queryClient.invalidateQueries({ queryKey: ['amenity-categories-with-amenities'] });
        },
    });
};

export const useUpdateAmenityCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => updateAmenityCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['amenity-categories-admin'] });
            queryClient.invalidateQueries({ queryKey: ['amenity-categories-with-amenities'] });
        },
    });
};

export const useDeleteAmenityCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteAmenityCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['amenity-categories-admin'] });
            queryClient.invalidateQueries({ queryKey: ['amenity-categories-with-amenities'] });
        },
    });
};
