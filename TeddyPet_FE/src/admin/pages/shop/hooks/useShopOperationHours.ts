import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getShopOperationHours,
    upsertShopOperationHour,
    upsertShopOperationHoursBatch,
} from '../../../api/shop-operation-hours.api';
import { ApiResponse } from '../../../config/type';
import type { IShopOperationHour } from '../../../api/shop-operation-hours.api';

const DAY_NAMES: Record<number, string> = {
    1: 'Thứ Hai',
    2: 'Thứ Ba',
    3: 'Thứ Tư',
    4: 'Thứ Năm',
    5: 'Thứ Sáu',
    6: 'Thứ Bảy',
    7: 'Chủ Nhật',
};

export { DAY_NAMES };

export const useShopOperationHours = () => {
    return useQuery({
        queryKey: ['shop-operation-hours'],
        queryFn: getShopOperationHours,
        select: (res: ApiResponse<IShopOperationHour[]>) => res.data ?? [],
    });
};

export const useUpsertShopOperationHour = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: upsertShopOperationHour,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shop-operation-hours'] });
        },
    });
};

export const useUpsertShopOperationHoursBatch = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: upsertShopOperationHoursBatch,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shop-operation-hours'] });
        },
    });
};
