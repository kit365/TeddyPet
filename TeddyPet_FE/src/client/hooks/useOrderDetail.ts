import { useState, useEffect, useCallback } from "react";
import { getMyOrderById } from "../../api/order.api";
import { OrderResponse } from "../../types/order.type";

export const useOrderDetail = (id: string) => {
    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<any>(null);

    const fetchOrderDetail = useCallback(async (isRefresh = false) => {
        if (!id) return;

        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const response = await getMyOrderById(id);
            if (response.success) {
                setOrder(response.data);
            } else {
                setError("Không tìm thấy đơn hàng");
            }
        } catch (err) {
            console.error("Error fetching order detail:", err);
            setError(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        fetchOrderDetail();
    }, [fetchOrderDetail]);

    return {
        order,
        loading,
        refreshing,
        error,
        refresh: () => fetchOrderDetail(true)
    };
};
