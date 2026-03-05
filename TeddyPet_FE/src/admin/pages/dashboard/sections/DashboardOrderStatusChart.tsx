import { Box, Card, Typography, Skeleton } from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useEffect, useState } from "react";
import { getDashboardStats, DashboardStatsResponse } from "../../../api/dashboard.api";

const STATUS_COLORS: Record<string, string> = {
    "Chờ xử lý": "#FFAB00",
    "Đã xác nhận": "#00B8D9",
    "Đang xử lý": "#3366FF",
    "Đang giao": "#1890FF",
    "Đã giao": "#54D62C",
    "Hoàn thành": "#00A76F",
    "Đã hủy": "#FF4842",
    "Hoàn trả": "#FF6C40",
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
        return (
            <Box sx={{
                bgcolor: "rgba(22, 28, 36, 0.9)", p: "10px 14px", borderRadius: "8px",
                boxShadow: "0 8px 16px rgba(0,0,0,0.24)"
            }}>
                <Typography sx={{ color: "#fff", fontSize: "1.2rem" }}>
                    {payload[0].name}: <strong>{payload[0].value}</strong> đơn
                </Typography>
            </Box>
        );
    }
    return null;
};

export const DashboardOrderStatusChart = () => {
    const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboardStats()
            .then(res => setStats(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const chartData = stats ? [
        { name: "Chờ xử lý", value: stats.pendingOrders },
        { name: "Đã xác nhận", value: stats.confirmedOrders },
        { name: "Đang xử lý", value: stats.processingOrders },
        { name: "Đang giao", value: stats.deliveringOrders },
        { name: "Đã giao", value: stats.deliveredOrders },
        { name: "Hoàn thành", value: stats.completedOrders },
        { name: "Đã hủy", value: stats.cancelledOrders },
        { name: "Hoàn trả", value: stats.returnedOrders },
    ].filter(d => d.value > 0) : [];

    return (
        <Card
            sx={{
                p: 3,
                borderRadius: '24px',
                boxShadow: '0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)',
                height: '440px',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.8rem", mb: "16px", color: "#1C252E" }}>
                Phân bố đơn hàng
            </Typography>

            {loading ? (
                <Skeleton variant="circular" width={200} height={200} sx={{ mx: "auto", mt: 4 }} />
            ) : chartData.length === 0 ? (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafb', borderRadius: '16px', border: '1px dashed #e5e7eb' }}>
                    <Typography sx={{ fontSize: '1.4rem', color: '#637381', textAlign: 'center', px: 3 }}>
                        Chưa có đơn hàng nào
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ flex: 1, width: '100%', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="45%"
                                innerRadius={55}
                                outerRadius={95}
                                paddingAngle={3}
                                dataKey="value"
                                stroke="none"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={index} fill={STATUS_COLORS[entry.name] || "#919EAB"} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                iconType="circle"
                                iconSize={8}
                                formatter={(value: string) => (
                                    <span style={{ color: "#637381", fontSize: "1.2rem" }}>{value}</span>
                                )}
                                wrapperStyle={{ fontSize: "1.2rem" }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </Box>
            )}
        </Card>
    );
};
