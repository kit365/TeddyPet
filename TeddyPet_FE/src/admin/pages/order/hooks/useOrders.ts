import { useState, useEffect, useCallback } from 'react';
import { getAllOrders, searchOrders } from '../../../api/order.api';
import { OrderResponse } from '../../../../types/order.type';
import { toast } from 'react-toastify';

export const useOrders = () => {
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalElements, setTotalElements] = useState(0);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [keyword, setKeyword] = useState('');
    const [status, setStatus] = useState<string>('ALL');

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            let response;
            const params = {
                page,
                size: pageSize,
                sortKey: 'createdAt',
                sortDirection: 'DESC',
                status: status !== 'ALL' ? status : undefined,
                keyword: keyword || undefined
            };

            if (keyword) {
                response = await searchOrders(params as any);
            } else {
                response = await getAllOrders(params as any);
            }

            if (response.success) {
                setOrders(response.data.content);
                setTotalElements(response.data.totalElements);
            } else {
                toast.error(response.message || 'Lỗi khi tải danh sách đơn hàng');
            }
        } catch (error) {
            console.error('Fetch orders error:', error);
            toast.error('Không thể kết nối với máy chủ');
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, keyword, status]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    return {
        orders,
        loading,
        totalElements,
        page,
        setPage,
        pageSize,
        setPageSize,
        keyword,
        setKeyword,
        status,
        setStatus,
        refresh: fetchOrders
    };
};
