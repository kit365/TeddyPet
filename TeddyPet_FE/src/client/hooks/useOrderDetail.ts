import { useState, useEffect, useCallback, useRef } from "react";
import { getMyOrderById } from "../../api/order.api";
import { OrderResponse } from "../../types/order.type";

export const useOrderDetail = (id: string) => {
    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<any>(null);
    const fetchIdRef = useRef<string | null>(null);

    const fetchOrderDetail = useCallback(async (isRefresh = false) => {
        if (!id) return;

        const requestId = id;
        fetchIdRef.current = requestId;
        setOrder(null);
        setError(null);
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const response = await getMyOrderById(requestId);
            if (fetchIdRef.current !== requestId) return;
            if (response.success && response.data) {
                if (response.data.id !== requestId) return;
                setOrder(response.data);
            } else {
                setError("Không tìm thấy đơn hàng");
            }
        } catch (err) {
            if (fetchIdRef.current !== requestId) return;
            console.error("Error fetching order detail:", err);
            setError(err);
        } finally {
            if (fetchIdRef.current === requestId) {
                setLoading(false);
                setRefreshing(false);
            }
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
