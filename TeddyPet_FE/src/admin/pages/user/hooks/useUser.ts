import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../../../api/user.api';
import { ApiResponse } from '../../../config/type';

export const useUsers = () => {
    return useQuery({
        queryKey: ['admin-users'],
        queryFn: () => getUsers(),
        select: (res: ApiResponse<any>) => {
            if (!res) return [];
            if (Array.isArray(res.data)) return res.data;
            if (res.data && typeof res.data === 'object' && Array.isArray((res.data as any).content))
                return (res.data as any).content;
            return [];
        },
        retry: false,
    });
};
