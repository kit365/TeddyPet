import { Box, Card, Stack, Typography, Skeleton } from "@mui/material";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TodayIcon from '@mui/icons-material/Today';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useEffect, useState } from "react";
import { getDashboardStats, DashboardStatsResponse } from "../../../api/dashboard.api";

const formatCurrency = (value: number) => {
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M₫`;
    }
    return new Intl.NumberFormat('vi-VN').format(value) + '₫';
};

export const DashboardStats = () => {
    const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboardStats()
            .then(res => setStats(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const statCards = stats ? [
        {
            title: "Tổng doanh thu",
            value: formatCurrency(stats.totalRevenue),
            sub: `Hôm nay: ${formatCurrency(stats.todayRevenue)}`,
            icon: <AttachMoneyIcon sx={{ fontSize: "3rem", color: "#007B55" }} />,
            bgColor: "#C8FACD"
        },
        {
            title: "Tổng đơn hàng",
            value: stats.totalOrders.toLocaleString(),
            sub: `Hôm nay: ${stats.todayOrders}`,
            icon: <ShoppingBagIcon sx={{ fontSize: "3rem", color: "#005249" }} />,
            bgColor: "#D0F9FB"
        },
        {
            title: "Khách hàng",
            value: stats.totalCustomers.toLocaleString(),
            sub: `Sản phẩm: ${stats.totalProducts}`,
            icon: <PeopleIcon sx={{ fontSize: "3rem", color: "#7A4F01" }} />,
            bgColor: "#FFF7CD"
        },
        {
            title: "Chờ xử lý",
            value: stats.pendingOrders.toLocaleString(),
            sub: `Đã xác nhận: ${stats.confirmedOrders}`,
            icon: <PendingActionsIcon sx={{ fontSize: "3rem", color: "#B76E00" }} />,
            bgColor: "#FFF5CC"
        },
        {
            title: "Đang xử lý",
            value: stats.processingOrders.toLocaleString(),
            sub: `Đang giao: ${stats.deliveringOrders}`,
            icon: <InventoryIcon sx={{ fontSize: "3rem", color: "#006C9C" }} />,
            bgColor: "#CAFDF5"
        },
        {
            title: "Đã giao",
            value: stats.deliveredOrders.toLocaleString(),
            sub: `Hoàn thành: ${stats.completedOrders}`,
            icon: <LocalShippingIcon sx={{ fontSize: "3rem", color: "#118D57" }} />,
            bgColor: "#D3FCD2"
        },
        {
            title: "Đã hủy",
            value: stats.cancelledOrders.toLocaleString(),
            sub: `Hoàn trả: ${stats.returnedOrders}`,
            icon: <TrendingUpIcon sx={{ fontSize: "3rem", color: "#B71D18" }} />,
            bgColor: "#FFE9D5"
        },
        {
            title: "Doanh thu hôm nay",
            value: formatCurrency(stats.todayRevenue),
            sub: `${stats.todayOrders} đơn hàng`,
            icon: <TodayIcon sx={{ fontSize: "3rem", color: "#7A0C2E" }} />,
            bgColor: "#FFE7D9"
        }
    ] : [];

    if (loading) {
        return (
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px", mb: "40px" }}>
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} variant="rounded" height={120} sx={{ borderRadius: "24px" }} />
                ))}
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
                gap: "24px",
                mb: "40px"
            }}
        >
            {statCards.map((stat, index) => (
                <Card
                    key={index}
                    sx={{
                        p: "24px",
                        borderRadius: "24px",
                        boxShadow: "0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)",
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: "0 0 2px 0 rgba(145, 158, 171, 0.2), 0 20px 40px -4px rgba(145, 158, 171, 0.16)"
                        }
                    }}
                >
                    <Box
                        sx={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: stat.bgColor,
                            flexShrink: 0
                        }}
                    >
                        {stat.icon}
                    </Box>
                    <Stack spacing={0.5}>
                        <Typography sx={{ color: "#637381", fontSize: "1.3rem", fontWeight: 600 }}>
                            {stat.title}
                        </Typography>
                        <Typography sx={{ fontSize: "2rem", fontWeight: 700, color: "#1C252E" }}>
                            {stat.value}
                        </Typography>
                        <Typography sx={{ color: "#919EAB", fontSize: "1.2rem" }}>
                            {stat.sub}
                        </Typography>
                    </Stack>
                </Card>
            ))}
        </Box>
    );
};
