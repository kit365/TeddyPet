import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Button, Chip, IconButton } from "@mui/material";
import DashboardCard from "../DashboardCard";
import { Icon } from '@iconify/react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getLatestProducts } from "../../../api/dashboard.api";
import { useEffect } from "react";

// Local helper
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(value);
};

export const LatestProducts = () => {
    const queryClient = useQueryClient();
    const { data: res, isLoading } = useQuery({
        queryKey: ["latest-products"],
        queryFn: getLatestProducts
    });

    useEffect(() => {
        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ["latest-products"] });
        };
        window.addEventListener('DASHBOARD_STATS_UPDATED', handleUpdate);
        return () => window.removeEventListener('DASHBOARD_STATS_UPDATED', handleUpdate);
    }, [queryClient]);

    const products = res?.data || [];

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'IN_STOCK':
                return { label: 'Còn hàng', color: 'success' as const };
            case 'LOW_STOCK':
                return { label: 'Sắp hết', color: 'warning' as const };
            case 'OUT_OF_STOCK':
                return { label: 'Hết hàng', color: 'error' as const };
            default:
                return { label: 'Đang nhập', color: 'warning' as const };
        }
    };

    return (
        <DashboardCard sx={{ height: '100%' }}>
            <Box sx={{ p: 3, pb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Sản phẩm mới</Typography>
            </Box>

            <TableContainer>
                <Table sx={{ minWidth: 640 }}>
                    <TableHead sx={{ bgcolor: 'rgba(145, 158, 171, 0.04)' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Tên sản phẩm</TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Danh mục</TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Giá</TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Trạng thái</TableCell>
                            <TableCell />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>Đang tải...</TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>Chưa có sản phẩm nào.</TableCell>
                            </TableRow>
                        ) : products.map((product) => {
                            const status = getStatusConfig(product.stockStatus);
                            const hasPrice = product.minPrice > 0;
                            return (
                                <TableRow key={product.id} hover>
                                    <TableCell sx={{ fontWeight: 600 }}>{product.name}</TableCell>
                                    <TableCell sx={{ color: 'text.secondary' }}>
                                        {product.categories?.[0]?.name || 'Phụ kiện'}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: hasPrice ? 'text.primary' : 'error.main' }}>
                                            {hasPrice ? formatCurrency(product.minPrice) : 'Liên hệ'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={status.label} 
                                            size="small" 
                                            sx={{ 
                                                bgcolor: (theme: any) => `${theme.palette[status.color].main}14`,
                                                color: (theme: any) => theme.palette[status.color].dark,
                                                fontWeight: 700,
                                                borderRadius: 1
                                            }} 
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small">
                                            <Icon icon="eva:more-vertical-fill" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ p: 2, textAlign: 'right' }}>
                <Button
                    size="small"
                    color="inherit"
                    endIcon={<Icon icon="eva:arrow-ios-forward-fill" />}
                    sx={{ fontWeight: 700, fontSize: '0.813rem' }}
                >
                    Xem tất cả
                </Button>
            </Box>
        </DashboardCard>
    );
};
