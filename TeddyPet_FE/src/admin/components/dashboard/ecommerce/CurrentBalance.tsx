import { Box, Typography, Stack, Button } from "@mui/material";
import DashboardCard from "../DashboardCard";

// Local helper
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(value);
};

interface CurrentBalanceProps {
    stats: any;
    isLoading: boolean;
    hideWithdraw?: boolean;
    hideLowStock?: boolean;
    onOpenStats?: () => void;
}

const toNum = (v: unknown): number => (typeof v === 'number' && !Number.isNaN(v)) ? v : Number(v) || 0;

export const CurrentBalance = ({ stats, isLoading, hideWithdraw, hideLowStock, onOpenStats }: CurrentBalanceProps) => {
    const todayRevenue = toNum(stats?.todayRevenue);
    const todayOrders = toNum(stats?.todayOrders);
    const todayBookings = toNum(stats?.todayBookings);
    const lowStockCount = toNum(stats?.lowStockCount);

    return (
        <DashboardCard sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 1, color: 'text.secondary' }}>
                Doanh thu hôm nay
            </Typography>
            <Typography sx={{ fontWeight: 700, fontSize: '2rem', mt: 0, mb: 2 }}>
                {isLoading ? '...' : formatCurrency(todayRevenue)}
            </Typography>

            <Stack spacing={2} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Đơn hàng hôm nay</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{todayOrders} đơn</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Lịch đặt hôm nay</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{todayBookings} lượt</Typography>
                </Box>
                {!hideLowStock && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Sắp hết hàng</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'error.main' }}>{lowStockCount} SP</Typography>
                    </Box>
                )}
            </Stack>

            <Stack direction="row" spacing={2}>
                {!hideWithdraw && (
                    <Button
                        fullWidth
                        variant="contained"
                        sx={{
                            bgcolor: '#ffab00',
                            color: '#fff',
                            boxShadow: 'none',
                            fontWeight: 700,
                            textTransform: 'none',
                            borderRadius: '8px',
                            '&:hover': { bgcolor: '#e69a00', boxShadow: 'none' }
                        }}
                    >
                        Rút tiền
                    </Button>
                )}
                <Button
                    fullWidth
                    variant="contained"
                    sx={{
                        bgcolor: '#00a76f',
                        color: '#fff',
                        boxShadow: 'none',
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: '8px',
                        '&:hover': { bgcolor: '#008b5c', boxShadow: 'none' }
                    }}
                    onClick={onOpenStats}
                >
                    Thống kê
                </Button>
            </Stack>
        </DashboardCard>
    );
};
