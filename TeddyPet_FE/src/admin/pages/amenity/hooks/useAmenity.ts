import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAmenitiesAdmin,
    getAmenityById,
    createAmenity,
    updateAmenity,
    deleteAmenity,
} from '../../../api/amenity.api';
import { ApiResponse } from '../../../config/type';
import type { IAmenity } from '../../../api/amenity.api';

export const useAmenitiesAdmin = (categoryId?: number | null) => {
    return useQuery({
        queryKey: ['amenities-admin', categoryId],
        queryFn: () => getAmenitiesAdmin(categoryId),
        select: (res: ApiResponse<IAmenity[]>) => res.data ?? [],
    });
};

export const useAmenityDetail = (id?: string | null) => {
    return useQuery({
        queryKey: ['amenity', id],
        queryFn: () => getAmenityById(id!),
        enabled: !!id,
    });
};

export const useCreateAmenity = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => createAmenity(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['amenities-admin'] });
            queryClient.invalidateQueries({ queryKey: ['amenity-categories-with-amenities'] });
        },
    });
};

export const useUpdateAmenity = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => updateAmenity(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['amenities-admin'] });
            queryClient.invalidateQueries({ queryKey: ['amenity-categories-with-amenities'] });
        },
    });
};

export const useDeleteAmenity = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteAmenity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['amenities-admin'] });
            queryClient.invalidateQueries({ queryKey: ['amenity-categories-with-amenities'] });
        },
    });
};
