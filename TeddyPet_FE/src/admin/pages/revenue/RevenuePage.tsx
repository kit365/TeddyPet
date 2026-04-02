import React from 'react';
import {
    Typography,
    Box,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    CircularProgress,
    Stack,
    Grid,
    Card,
    Container,
    Breadcrumbs,
    Link as MuiLink,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';
import { getTotalRevenueDetails } from '../../api/dashboard.api';
import dayjs from 'dayjs';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { prefixAdmin } from '../../constants/routes';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(value);
};

export const RevenuePage: React.FC = () => {
    const navigate = useNavigate();
    const { data: response, isLoading, isError } = useQuery({
        queryKey: ['dashboard-total-revenue-details'],
        queryFn: getTotalRevenueDetails,
    });

    const details = response?.data;

    const combinedRows = React.useMemo(() => {
        if (!details) return [];
        
        const orderRows = details.orders.map(o => ({
            id: o.orderId,
            code: o.orderCode,
            customer: o.customerName,
            amount: o.finalAmount,
            status: o.status === 'COMPLETED' || o.status === 'DELIVERED' ? 'Hoàn thành' : o.status,
            date: o.createdAt,
            type: 'Order'
        }));

        const bookingRows = details.bookings.map(b => ({
            id: b.bookingId,
            code: b.bookingCode,
            customer: b.customerName,
            amount: b.totalAmount,
            status: b.paymentStatus === 'PAID' ? 'Đã thanh toán' : b.paymentStatus,
            date: b.createdAt,
            type: 'Booking'
        }));

        return [...orderRows, ...bookingRows].sort((a, b) => 
            dayjs(b.date).unix() - dayjs(a.date).unix()
        );
    }, [details]);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress sx={{ color: 'var(--palette-primary-main)' }} />
            </Box>
        );
    }

    if (isError || !details) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="error">Không thể tải dữ liệu. Vui lòng thử lại sau.</Typography>
            </Box>
        );
    }

    return (
        <Container maxWidth="xl">
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    Tổng doanh thu tích lũy
                </Typography>
                <Breadcrumbs separator={<Icon icon="eva:chevron-right-fill" />} sx={{ color: 'text.disabled' }}>
                    <MuiLink component={RouterLink} color="inherit" to={`/${prefixAdmin}/dashboard`}>
                        Dashboard
                    </MuiLink>
                    <Typography color="text.primary">Doanh thu</Typography>
                </Breadcrumbs>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ p: 2, textAlign: 'center', borderRadius: '12px', boxShadow: 'var(--customShadows-z4)' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', mb: 0.5 }}>Tổng doanh thu tích lũy</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--palette-primary-main)', fontSize: '1.25rem' }}>
                            {formatCurrency(details.totalRevenue)}
                        </Typography>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ p: 2, textAlign: 'center', borderRadius: '12px', boxShadow: 'var(--customShadows-z4)' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', mb: 0.5 }}>Tổng đơn hàng</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>{details.completedOrdersCount}</Typography>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ p: 2, textAlign: 'center', borderRadius: '12px', boxShadow: 'var(--customShadows-z4)' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', mb: 0.5 }}>Tổng lịch đặt</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>{details.completedBookingsCount}</Typography>
                    </Card>
                </Grid>
            </Grid>

            <Card sx={{ borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--customShadows-z8)' }}>
                <Box sx={{ p: 0 }}>
                    <TableContainer>
                        <Table stickyHeader sx={{ minWidth: 800 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Mã</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Loại</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Khách hàng</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Thời gian</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Doanh thu</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {combinedRows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                            <Stack alignItems="center" spacing={1}>
                                                <Icon icon="solar:box-broken" width={64} style={{ color: 'var(--palette-text-disabled)' }} />
                                                <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                                                    Chưa có dữ liệu doanh thu
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    combinedRows.map((row) => (
                                        <TableRow 
                                            key={`${row.type}-${row.id}`} 
                                            hover
                                            onClick={() => {
                                                const path = row.type === 'Order' ? 'order' : 'booking';
                                                navigate(`/${prefixAdmin}/${path}/detail/${row.id}`);
                                            }}
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            <TableCell sx={{ fontWeight: 600 }}>{row.code}</TableCell>
                                            <TableCell>
                                                <Box sx={{
                                                    display: 'inline-flex', alignItems: 'center', height: 22, px: 1, borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 700,
                                                    color: row.type === 'Order' ? '#1890FF' : '#722ED1',
                                                    bgcolor: row.type === 'Order' ? 'rgba(24, 144, 255, 0.12)' : 'rgba(114, 46, 209, 0.12)'
                                                }}>
                                                    {row.type === 'Order' ? 'Sản phẩm' : 'Dịch vụ'}
                                                </Box>
                                            </TableCell>
                                            <TableCell>{row.customer}</TableCell>
                                            <TableCell>{dayjs(row.date).format('HH:mm DD/MM/YYYY')}</TableCell>
                                            <TableCell>
                                                <Box sx={{
                                                    display: 'inline-flex', alignItems: 'center', height: 22, px: 1, borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 700,
                                                    color: '#00a76f', bgcolor: 'rgba(0, 167, 111, 0.12)'
                                                }}>
                                                    {row.status}
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                                                {formatCurrency(row.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Card>
        </Container>
    );
};

export default RevenuePage;
