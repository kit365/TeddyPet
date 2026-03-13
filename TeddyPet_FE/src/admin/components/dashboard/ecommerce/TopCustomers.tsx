import { Box, Typography, Stack, Avatar } from "@mui/material";
import DashboardCard from "../DashboardCard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTopCustomers } from "../../../api/dashboard.api";
import { useEffect } from "react";
import { Icon } from '@iconify/react';

// Unified format function for large numbers
const formatCompactNumber = (number: number) => {
    if (number >= 1000000) return (number / 1000000).toFixed(1) + 'M';
    if (number >= 1000) return (number / 1000).toFixed(1) + 'k';
    return number.toString();
};

export const TopCustomers = () => {
    const queryClient = useQueryClient();
    const { data: res, isLoading } = useQuery({
        queryKey: ["top-customers"],
        queryFn: getTopCustomers
    });

    useEffect(() => {
        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ["top-customers"] });
        };
        window.addEventListener('DASHBOARD_STATS_UPDATED', handleUpdate);
        return () => window.removeEventListener('DASHBOARD_STATS_UPDATED', handleUpdate);
    }, [queryClient]);

    const customers = res?.data || [];

    const getIconConfig = (index: number) => {
        const configs = [
            { color: '#FFAB00', icon: 'eva:shopping-bag-fill' },  // Gold
            { color: '#00B8D9', icon: 'eva:shopping-bag-fill' },  // Cyan
            { color: '#8E33FF', icon: 'eva:shopping-bag-fill' },  // Purple
        ];
        return configs[index] || { color: '#919EAB', icon: 'eva:shopping-bag-fill' };
    };

    return (
        <DashboardCard sx={{ height: '100%', p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Khách hàng tiêu biểu
            </Typography>
            
            <Stack spacing={3}>
                {isLoading ? (
                    <Typography color="text.secondary">Đang tải...</Typography>
                ) : customers.length === 0 ? (
                    <Typography color="text.secondary">Chưa có dữ liệu.</Typography>
                ) : customers.slice(0, 3).map((customer, index) => {
                    const config = getIconConfig(index);
                    return (
                        <Stack key={customer.email} direction="row" alignItems="center" justifyContent="space-between">
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar 
                                    src={customer.avatarUrl} 
                                    sx={{ width: 44, height: 44 }} 
                                />
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                        {customer.fullName}
                                    </Typography>
                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                        <Icon icon="eva:shopping-bag-fill" color="text.disabled" width={16} />
                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                            {formatCompactNumber(customer.totalSpent)}
                                        </Typography>
                                    </Stack>
                                </Box>
                            </Stack>

                            <Box
                                sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: `${config.color}14`,
                                    color: config.color
                                }}
                            >
                                <Icon icon={config.icon} width={18} />
                            </Box>
                        </Stack>
                    );
                })}
            </Stack>
        </DashboardCard>
    );
};
