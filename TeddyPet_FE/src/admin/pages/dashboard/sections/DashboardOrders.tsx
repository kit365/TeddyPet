import {
    Box,
    Card,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    Chip,
    Skeleton,
    Button
} from "@mui/material";
import { useEffect, useState } from "react";
import { getRecentOrders } from "../../../api/dashboard.api";
import { OrderResponse } from "../../../../types/order.type";
import { useNavigate } from "react-router-dom";
import { prefixAdmin } from "../../../constants/routes";

const statusMap: Record<string, { label: string; color: "success" | "warning" | "info" | "error" | "default" | "primary" | "secondary" }> = {
    PENDING: { label: "Chờ xử lý", color: "warning" },
    CONFIRMED: { label: "Đã xác nhận", color: "info" },
    PROCESSING: { label: "Đang xử lý", color: "info" },
    DELIVERING: { label: "Đang giao", color: "primary" },
    DELIVERED: { label: "Đã giao", color: "success" },
    COMPLETED: { label: "Hoàn thành", color: "success" },
    CANCELLED: { label: "Đã hủy", color: "error" },
    RETURN_REQUESTED: { label: "Yêu cầu trả", color: "secondary" },
    RETURNED: { label: "Hoàn trả", color: "error" },
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN').format(value) + '₫';

const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const DashboardOrders = () => {
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        getRecentOrders(10)
            .then(res => setOrders(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <Card
            sx={{
                p: "24px",
                borderRadius: "24px",
                boxShadow: "0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)",
            }}
        >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: "24px" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.8rem", color: "#1C252E" }}>
                    Đơn hàng gần đây
                </Typography>
                <Button
                    variant="text"
                    sx={{ fontSize: "1.3rem", textTransform: "none", color: "#00A76F", fontWeight: 600 }}
                    onClick={() => navigate(`/${prefixAdmin}/order/list`)}
                >
                    Xem tất cả →
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} variant="rounded" height={48} />
                    ))}
                </Box>
            ) : orders.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 6 }}>
                    <Typography sx={{ fontSize: "1.4rem", color: "#919EAB" }}>
                        Chưa có đơn hàng nào
                    </Typography>
                </Box>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: "#F4F6F8" }}>
                            <TableRow>
                                <TableCell sx={{ fontSize: "1.3rem", fontWeight: 600, color: "#637381", border: "none" }}>Mã đơn</TableCell>
                                <TableCell sx={{ fontSize: "1.3rem", fontWeight: 600, color: "#637381", border: "none" }}>Khách hàng</TableCell>
                                <TableCell sx={{ fontSize: "1.3rem", fontWeight: 600, color: "#637381", border: "none" }}>Sản phẩm</TableCell>
                                <TableCell sx={{ fontSize: "1.3rem", fontWeight: 600, color: "#637381", border: "none" }}>Tổng tiền</TableCell>
                                <TableCell sx={{ fontSize: "1.3rem", fontWeight: 600, color: "#637381", border: "none" }}>Trạng thái</TableCell>
                                <TableCell sx={{ fontSize: "1.3rem", fontWeight: 600, color: "#637381", border: "none" }}>Thời gian</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map((order) => {
                                const statusInfo = statusMap[order.status] || { label: order.status, color: "default" as const };
                                const customerName = order.user?.fullName || order.shippingName || order.guestEmail || "Khách vãng lai";
                                const productSummary = order.orderItems?.length > 0
                                    ? order.orderItems[0].productName + (order.orderItems.length > 1 ? ` (+${order.orderItems.length - 1})` : "")
                                    : "—";
                                return (
                                    <TableRow
                                        key={order.id}
                                        sx={{
                                            '&:hover': { bgcolor: "#f9fafb", cursor: "pointer" },
                                            transition: "background-color 0.15s"
                                        }}
                                        onClick={() => navigate(`/${prefixAdmin}/order/${order.id}`)}
                                    >
                                        <TableCell sx={{ fontSize: "1.3rem", py: "14px", borderBottom: "1px dashed #e5e7eb", fontWeight: 600, color: "#1C252E" }}>
                                            {order.orderCode}
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: "1px dashed #e5e7eb" }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <Avatar sx={{ width: 32, height: 32, fontSize: "1.2rem", bgcolor: "#00A76F" }}>
                                                    {customerName.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography sx={{ fontSize: "1.3rem", fontWeight: 500, lineHeight: 1.4 }}>
                                                        {customerName}
                                                    </Typography>
                                                    {order.shippingPhone && (
                                                        <Typography sx={{ fontSize: "1.1rem", color: "#919EAB" }}>
                                                            {order.shippingPhone}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ fontSize: "1.3rem", borderBottom: "1px dashed #e5e7eb", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {productSummary}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: "1.3rem", fontWeight: 600, borderBottom: "1px dashed #e5e7eb", color: "#1C252E" }}>
                                            {formatCurrency(order.finalAmount)}
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: "1px dashed #e5e7eb" }}>
                                            <Chip
                                                label={statusInfo.label}
                                                color={statusInfo.color}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    fontSize: "1.1rem",
                                                    fontWeight: 700,
                                                    borderRadius: "6px",
                                                    height: "24px"
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: "1.2rem", borderBottom: "1px dashed #e5e7eb", color: "#637381", whiteSpace: "nowrap" }}>
                                            {formatDate(order.createdAt)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Card>
    );
};
