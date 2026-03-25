import { Box, Typography, Stack } from "@mui/material";
import DashboardCard from "../DashboardCard";

// Local helper
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(value);
};

interface SalesOverviewProps {
    stats: any;
    isLoading: boolean;
    hideCosts?: boolean;
}

export const SalesOverview = ({ stats, isLoading, hideCosts }: SalesOverviewProps) => {
    let data = [
        { label: 'Tổng doanh thu', value: stats?.totalRevenue || 0, percent: 100, color: '#00a76f' },
        { label: 'Doanh thu trung bình', value: stats?.totalOrders > 0 ? (stats?.totalRevenue / stats?.totalOrders) : 0, percent: 75, color: '#00b8d9' },
        { label: 'Chi phí ước tính', value: (stats?.totalRevenue || 0) * 0.4, percent: 40, color: '#ffab00' },
    ];

    if (hideCosts) {
        data = data.filter(item => item.label !== 'Chi phí ước tính');
    }

    return (
        <DashboardCard sx={{ p: 3, pb: 4, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', mb: 4 }}>Doanh số tổng quan</Typography>
            <Stack spacing={4}>
                {isLoading ? (
                    <Typography color="textSecondary">Đang tải...</Typography>
                ) : data.map((item) => (
                    <Box key={item.label}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{item.label}</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {formatCurrency(item.value)}
                            </Typography>
                        </Box>
                        <Box sx={{ height: 8, bgcolor: 'rgba(145, 158, 171, 0.16)', borderRadius: 1, overflow: 'hidden' }}>
                            <Box sx={{ height: '100%', width: `${item.percent}%`, bgcolor: item.color, borderRadius: 1 }} />
                        </Box>
                    </Box>
                ))}
            </Stack>
        </DashboardCard>
    );
};
