import { Box, Card, Typography, Skeleton, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useEffect, useState } from "react";
import { getRevenueChart, RevenueChartItem } from "../../../api/dashboard.api";

const formatVND = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toString();
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <Box sx={{
                bgcolor: "rgba(22, 28, 36, 0.9)", p: "12px 16px", borderRadius: "8px",
                boxShadow: "0 8px 16px rgba(0,0,0,0.24)"
            }}>
                <Typography sx={{ color: "#fff", fontSize: "1.3rem", fontWeight: 600, mb: 0.5 }}>
                    {label}
                </Typography>
                {payload.map((entry: any, index: number) => (
                    <Typography key={index} sx={{ color: entry.color, fontSize: "1.2rem" }}>
                        {entry.name === "revenue" ? "Doanh thu" : "Đơn hàng"}: {
                            entry.name === "revenue"
                                ? new Intl.NumberFormat('vi-VN').format(entry.value) + '₫'
                                : entry.value
                        }
                    </Typography>
                ))}
            </Box>
        );
    }
    return null;
};

export const DashboardChart = () => {
    const [data, setData] = useState<RevenueChartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);
    const [chartType, setChartType] = useState<"area" | "bar">("area");

    useEffect(() => {
        setLoading(true);
        getRevenueChart(days)
            .then(res => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [days]);

    return (
        <Card
            sx={{
                p: "24px",
                borderRadius: "24px",
                boxShadow: "0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)",
                height: "440px",
            }}
        >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: "16px" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.8rem", color: "#1C252E" }}>
                    Thống kê doanh thu
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <ToggleButtonGroup
                        size="small"
                        value={chartType}
                        exclusive
                        onChange={(_, v) => v && setChartType(v)}
                        sx={{ '& .MuiToggleButton-root': { fontSize: "1.2rem", px: 1.5, py: 0.5, borderRadius: "8px !important" } }}
                    >
                        <ToggleButton value="area">Biểu đồ</ToggleButton>
                        <ToggleButton value="bar">Cột</ToggleButton>
                    </ToggleButtonGroup>
                    <ToggleButtonGroup
                        size="small"
                        value={days}
                        exclusive
                        onChange={(_, v) => v && setDays(v)}
                        sx={{ '& .MuiToggleButton-root': { fontSize: "1.2rem", px: 1.5, py: 0.5, borderRadius: "8px !important" } }}
                    >
                        <ToggleButton value={7}>7 ngày</ToggleButton>
                        <ToggleButton value={30}>30 ngày</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Box>

            {loading ? (
                <Skeleton variant="rounded" height={340} sx={{ borderRadius: "16px" }} />
            ) : (
                <Box sx={{ width: '100%', height: '340px', position: 'relative', overflow: 'hidden' }}>
                    <ResponsiveContainer width="99%" height="100%" minWidth={0} debounce={1}>
                        {chartType === "area" ? (
                            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00A76F" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#00A76F" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FFAB00" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#FFAB00" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#919EAB" }} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#919EAB" }} tickFormatter={formatVND} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#919EAB" }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#00A76F" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                                <Area yAxisId="right" type="monotone" dataKey="orders" stroke="#FFAB00" fillOpacity={1} fill="url(#colorOrders)" strokeWidth={2} />
                            </AreaChart>
                        ) : (
                            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#919EAB" }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#919EAB" }} tickFormatter={formatVND} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="revenue" fill="#00A76F" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </Box>
            )}
        </Card>
    );
};
