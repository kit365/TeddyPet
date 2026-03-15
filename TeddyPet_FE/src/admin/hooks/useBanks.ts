import { useQuery } from '@tanstack/react-query';
import { getVietQRBanks, VietQRBank } from '../../api/vietqr.api';

export const useBanks = () => {
    return useQuery<VietQRBank[]>({
        queryKey: ['vietqr-banks'],
        queryFn: getVietQRBanks,
        staleTime: 24 * 60 * 60 * 1000, // 24 hours (bank list doesn't change often)
        gcTime: 24 * 60 * 60 * 1000,
    });
};
