import { useState, useEffect, useCallback } from 'react';
import { getMyOrders, getMyOrdersPaginated } from '../../api/order.api';
import { OrderResponse } from '../../types/order.type';
import { toast } from 'react-toastify';

export const useOrders = (usePagination: boolean = false) => {
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            let response;
            
            if (usePagination) {
                response = await getMyOrdersPaginated(currentPage, pageSize, statusFilter);
                if (response.success && response.data) {
                    setOrders(response.data.content || []);
                    setTotalPages(response.data.totalPages || 0);
                    setTotalElements(response.data.totalElements || 0);
                } else {
                    toast.error(response.message || 'Lỗi khi tải danh sách đơn hàng');
                }
            } else {
                response = await getMyOrders();
                if (response.success) {
                    setOrders(response.data || []);
                } else {
                    toast.error(response.message || 'Lỗi khi tải danh sách đơn hàng');
                }
            }
        } catch (error: any) {
            console.error('Fetch orders error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Không thể kết nối với máy chủ';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [usePagination, currentPage, pageSize, statusFilter]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    return {
        orders,
        loading,
        refresh: fetchOrders,
        currentPage,
        setCurrentPage,
        pageSize,
        totalPages,
        totalElements,
        statusFilter,
        setStatusFilter
    };
};
