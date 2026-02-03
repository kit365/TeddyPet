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
    Chip
} from "@mui/material";

const recentOrders = [
    {
        id: "#ORD-7782",
        customer: "Phạm Minh Hùng",
        avatar: "https://api-prod-minimal-v700.pages.dev/assets/images/avatar/avatar-1.webp",
        product: "Thức ăn mèo Royal Canin",
        amount: "540,000₫",
        status: "Đã giao",
        statusColor: "success"
    },
    {
        id: "#ORD-7781",
        customer: "Trần Thị Ánh",
        avatar: "https://api-prod-minimal-v700.pages.dev/assets/images/avatar/avatar-2.webp",
        product: "Cát vệ sinh đậu nành",
        amount: "120,000₫",
        status: "Đang giao",
        statusColor: "warning"
    },
    {
        id: "#ORD-7780",
        customer: "Lê Văn Nam",
        avatar: "https://api-prod-minimal-v700.pages.dev/assets/images/avatar/avatar-3.webp",
        product: "Đồ chơi tháp bóng 3 tầng",
        amount: "85,000₫",
        status: "Chờ xử lý",
        statusColor: "info"
    },
    {
        id: "#ORD-7779",
        customer: "Hoàng Thanh Bình",
        avatar: "https://api-prod-minimal-v700.pages.dev/assets/images/avatar/avatar-4.webp",
        product: "Nệm thư giãn cho chó",
        amount: "320,000₫",
        status: "Đã hủy",
        statusColor: "error"
    }
];

export const DashboardOrders = () => {
    return (
        <Card
            sx={{
                p: "24px",
                borderRadius: "24px",
                boxShadow: "0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)",
            }}
        >
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.8rem", mb: "24px", color: "#1C252E" }}>
                Đơn hàng gần đây
            </Typography>
            <TableContainer>
                <Table>
                    <TableHead sx={{ bgcolor: "#F4F6F8" }}>
                        <TableRow>
                            <TableCell sx={{ fontSize: "1.4rem", fontWeight: 600, color: "#637381", border: "none" }}>Mã đơn</TableCell>
                            <TableCell sx={{ fontSize: "1.4rem", fontWeight: 600, color: "#637381", border: "none" }}>Khách hàng</TableCell>
                            <TableCell sx={{ fontSize: "1.4rem", fontWeight: 600, color: "#637381", border: "none" }}>Sản phẩm</TableCell>
                            <TableCell sx={{ fontSize: "1.4rem", fontWeight: 600, color: "#637381", border: "none" }}>Tổng tiền</TableCell>
                            <TableCell sx={{ fontSize: "1.4rem", fontWeight: 600, color: "#637381", border: "none" }}>Trạng thái</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {recentOrders.map((order) => (
                            <TableRow key={order.id} sx={{ '&:hover': { bgcolor: "#f9fafb" } }}>
                                <TableCell sx={{ fontSize: "1.4rem", py: "16px", borderBottom: "1px dashed #e5e7eb" }}>{order.id}</TableCell>
                                <TableCell sx={{ borderBottom: "1px dashed #e5e7eb" }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <Avatar src={order.avatar} sx={{ width: 36, height: 36 }} />
                                        <Typography sx={{ fontSize: "1.4rem", fontWeight: 500 }}>{order.customer}</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ fontSize: "1.4rem", borderBottom: "1px dashed #e5e7eb" }}>{order.product}</TableCell>
                                <TableCell sx={{ fontSize: "1.4rem", fontWeight: 600, borderBottom: "1px dashed #e5e7eb" }}>{order.amount}</TableCell>
                                <TableCell sx={{ borderBottom: "1px dashed #e5e7eb" }}>
                                    <Chip
                                        label={order.status}
                                        color={order.statusColor as any}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            fontSize: "1.2rem",
                                            fontWeight: 700,
                                            borderRadius: "6px",
                                            height: "24px"
                                        }}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Card>
    );
};
