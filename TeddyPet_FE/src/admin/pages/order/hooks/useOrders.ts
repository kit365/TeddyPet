import { useState, useEffect, useCallback, useRef } from 'react';
import { getAllOrders, searchOrders, getOrdersByStatus } from '../../../api/order.api';
import { OrderResponse } from '../../../../types/order.type';
import { toast } from 'react-toastify';

export const useOrders = () => {
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalElements, setTotalElements] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [keyword, setKeyword] = useState('');
    const [debouncedKeyword, setDebouncedKeyword] = useState('');
    const [status, setStatus] = useState<string>('ALL');
    const [sortKey, setSortKey] = useState<string>('createdAt');
    const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');

    const abortControllerRef = useRef<AbortController | null>(null);

    // Debounce search keyword
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedKeyword(keyword);
            setPage(0);
        }, 500);
        return () => clearTimeout(handler);
    }, [keyword]);

    const fetchOrders = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);
        try {
            let response;
            const params = {
                page,
                size: pageSize,
                sortKey,
                sortDirection
            };

            if (debouncedKeyword) {
                response = await searchOrders({ ...params, keyword: debouncedKeyword } as any, signal);
            } else if (status !== 'ALL') {
                response = await getOrdersByStatus(status, params, signal);
            } else {
                response = await getAllOrders(params as any, signal);
            }

            if (response.success) {
                setOrders(response.data.content);
                setTotalElements(response.data.totalElements);
            } else {
                toast.error(response.message || 'Lỗi khi tải danh sách đơn hàng');
            }
        } catch (error: any) {
            if (error.name !== 'CanceledError' && error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
                console.error('Fetch orders error:', error);
                const errorMsg = error.response?.data?.message || error.message || 'Không thể kết nối với máy chủ';
                toast.error(errorMsg);
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, [page, pageSize, debouncedKeyword, status, sortKey, sortDirection]);

    const fetchPendingCount = useCallback(async () => {
        try {
            const response = await getOrdersByStatus('PENDING', { page: 0, size: 1 });
            if (response.success) {
                setPendingCount(response.data.totalElements);
            }
        } catch (error) {
            console.error('Fetch pending count error:', error);
        }
    }, []);

    useEffect(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        fetchOrders(controller.signal);

        return () => {
            controller.abort();
        };
    }, [fetchOrders]);

    useEffect(() => {
        fetchPendingCount();
    }, [fetchPendingCount]);

    return {
        orders,
        loading,
        totalElements,
        pendingCount,
        page,
        setPage,
        pageSize,
        setPageSize,
        keyword,
        setKeyword,
        status,
        setStatus,
        sortKey,
        setSortKey,
        sortDirection,
        setSortDirection,
        refresh: () => {
            fetchOrders();
            fetchPendingCount();
        }
    };
};
