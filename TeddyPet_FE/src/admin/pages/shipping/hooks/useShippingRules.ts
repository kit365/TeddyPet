import { useState, useEffect, useCallback } from 'react';
import { ShippingRule } from '../../../../types/shipping.type';
import { getShippingRules } from '../../../api/shipping.api';
import { toast } from 'react-toastify';

export const useShippingRules = () => {
    const [rules, setRules] = useState<ShippingRule[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRules = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getShippingRules();
            if (response.success && response.data) {
                setRules(response.data);
            } else {
                setRules([]);
            }
        } catch (error) {
            console.error("Failed to fetch shipping rules", error);
            toast.error("Không thể tải danh sách phí vận chuyển");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRules();
    }, [fetchRules]);

    return {
        rules,
        loading,
        refetch: fetchRules
    };
};
