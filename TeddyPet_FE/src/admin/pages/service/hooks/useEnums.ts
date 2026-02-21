import { useQuery } from '@tanstack/react-query';
import { getPetTypes } from '../../../api/enums.api';
import type { ApiResponse } from '../../../config/type';

export const usePetTypes = () => {
    return useQuery({
        queryKey: ['enums', 'pet-types'],
        queryFn: getPetTypes,
        select: (res: ApiResponse<string[]>) => res.data ?? [],
        staleTime: 5 * 60 * 1000,
    });
};

