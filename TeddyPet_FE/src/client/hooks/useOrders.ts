import { useState, useEffect, useCallback } from 'react';
import { getMyOrders } from '../../api/order.api';
import { OrderResponse } from '../../types/order.type';
import { toast } from 'react-toastify';

export const useOrders = () => {
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getMyOrders();
            if (response.success) {
                setOrders(response.data || []);
            } else {
                toast.error(response.message || 'Lỗi khi tải danh sách đơn hàng');
            }
        } catch (error: any) {
            console.error('Fetch orders error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Không thể kết nối với máy chủ';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    return {
        orders,
        loading,
        refresh: fetchOrders
    };
};
