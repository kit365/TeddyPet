import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Tabs,
    Tab,
    CircularProgress,
    Stack,
    IconButton
} from '@mui/material';
import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';
import { getTodayRevenueDetails } from '../../../api/dashboard.api';
import dayjs from 'dayjs';

interface TodayRevenueModalProps {
    open: boolean;
    onClose: () => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(value);
};

export const TodayRevenueModal: React.FC<TodayRevenueModalProps> = ({ open, onClose }) => {
    const [tabIndex, setTabIndex] = React.useState(0);

    const { data: response, isLoading, isError } = useQuery({
        queryKey: ['dashboard-today-revenue-details'],
        queryFn: getTodayRevenueDetails,
        enabled: open,
    });

    const details = response?.data;

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue);
    };

    const orderTotal = details?.orders.reduce((sum, order) => sum + order.finalAmount, 0) || 0;
    const bookingTotal = details?.bookings.reduce((sum, booking) => sum + booking.totalAmount, 0) || 0;

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
                sx: { borderRadius: '16px', boxShadow: 'var(--customShadows-z24)' }
            }}
        >
            <DialogTitle sx={{ fontWeight: 700, p: 3, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
                        Chi tiết doanh thu hôm nay
                    </Typography>
                    {details && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            Tổng cộng:{' '}
                            <Typography component="span" sx={{ fontWeight: 700, color: 'var(--palette-primary-main)' }}>
                                {formatCurrency(details.totalRevenue)}
                            </Typography>
                        </Typography>
                    )}
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
                    <Icon icon="eva:close-fill" />
                </IconButton>
            </DialogTitle>
            
            <DialogContent sx={{ p: 0, minHeight: 400 }}>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                        <CircularProgress sx={{ color: 'var(--palette-primary-main)' }} />
                    </Box>
                ) : isError ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="error">Không thể tải dữ liệu. Vui lòng thử lại sau.</Typography>
                    </Box>
                ) : !details ? (
                     <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">Chưa có dữ liệu</Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Box sx={{ px: 3, mb: 2 }}>
                            <Box sx={{ bgcolor: 'var(--palette-background-neutral)', borderRadius: '10px', p: '4px', overflow: 'hidden' }}>
                                <Tabs
                                    value={tabIndex}
                                    onChange={handleTabChange}
                                    variant="fullWidth"
                                    sx={{
                                        minHeight: 44,
                                        '& .MuiTabs-indicator': { 
                                            height: '100%', 
                                            borderRadius: '8px', 
                                            bgcolor: 'var(--palette-common-white)', 
                                            boxShadow: 'var(--customShadows-z1)', 
                                            zIndex: 0 
                                        }
                                    }}
                                >
                                    <Tab 
                                        label={
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                                                <span>Đơn hàng ({details.completedOrdersCount})</span>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.8, marginTop: '2px' }}>{formatCurrency(orderTotal)}</span>
                                            </Box>
                                        }
                                        sx={{ 
                                            zIndex: 1, 
                                            minHeight: 52, 
                                            fontSize: '0.875rem', 
                                            textTransform: 'none', 
                                            fontWeight: 600, 
                                            color: tabIndex === 0 ? 'var(--palette-text-primary) !important' : 'var(--palette-text-secondary)' 
                                        }} 
                                    />
                                    <Tab 
                                        label={
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                                                <span>Lịch đặt ({details.completedBookingsCount})</span>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.8, marginTop: '2px' }}>{formatCurrency(bookingTotal)}</span>
                                            </Box>
                                        }
                                        sx={{ 
                                            zIndex: 1, 
                                            minHeight: 52, 
                                            fontSize: '0.875rem', 
                                            textTransform: 'none', 
                                            fontWeight: 600, 
                                            color: tabIndex === 1 ? 'var(--palette-text-primary) !important' : 'var(--palette-text-secondary)' 
                                        }} 
                                    />
                                </Tabs>
                            </Box>
                        </Box>
                        
                        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                            {tabIndex === 0 && (
                                <TableContainer>
                                    <Table stickyHeader sx={{ minWidth: 600 }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ bgcolor: 'var(--palette-background-neutral)', color: 'var(--palette-text-secondary)', fontWeight: 600, borderBottom: 'none' }}>Mã đơn</TableCell>
                                                <TableCell sx={{ bgcolor: 'var(--palette-background-neutral)', color: 'var(--palette-text-secondary)', fontWeight: 600, borderBottom: 'none' }}>Khách hàng</TableCell>
                                                <TableCell sx={{ bgcolor: 'var(--palette-background-neutral)', color: 'var(--palette-text-secondary)', fontWeight: 600, borderBottom: 'none' }}>Thời gian</TableCell>
                                                <TableCell sx={{ bgcolor: 'var(--palette-background-neutral)', color: 'var(--palette-text-secondary)', fontWeight: 600, borderBottom: 'none' }}>Trạng thái</TableCell>
                                                <TableCell align="right" sx={{ bgcolor: 'var(--palette-background-neutral)', color: 'var(--palette-text-secondary)', fontWeight: 600, borderBottom: 'none', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>Thành tiền</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {details.orders.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                                        <Stack alignItems="center" spacing={1}>
                                                            <Icon icon="solar:box-broken" width={48} style={{ color: 'var(--palette-text-disabled)' }} />
                                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                                Không có đơn hàng nào đóng góp vào doanh thu hôm nay
                                                            </Typography>
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                details.orders.map((order) => (
                                                    <TableRow key={order.orderId} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                        <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{order.orderCode}</TableCell>
                                                        <TableCell>{order.customerName}</TableCell>
                                                        <TableCell>{dayjs(order.createdAt).format('HH:mm')}</TableCell>
                                                        <TableCell>
                                                            <Box sx={{
                                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 24, px: 1, borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap',
                                                                ...(order.status === 'COMPLETED' || order.status === 'DELIVERED' 
                                                                    ? { color: '#00a76f', bgcolor: 'rgba(0, 167, 111, 0.16)' } 
                                                                    : { color: 'var(--palette-text-secondary)', bgcolor: 'var(--palette-background-neutral)' })
                                                            }}>
                                                                {order.status === 'COMPLETED' ? 'Hoàn thành' : order.status === 'DELIVERED' ? 'Đã giao' : order.status}
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                            {formatCurrency(order.finalAmount)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}

                            {tabIndex === 1 && (
                                <TableContainer>
                                    <Table stickyHeader sx={{ minWidth: 600 }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ bgcolor: 'var(--palette-background-neutral)', color: 'var(--palette-text-secondary)', fontWeight: 600, borderBottom: 'none' }}>Mã lịch</TableCell>
                                                <TableCell sx={{ bgcolor: 'var(--palette-background-neutral)', color: 'var(--palette-text-secondary)', fontWeight: 600, borderBottom: 'none' }}>Khách hàng</TableCell>
                                                <TableCell sx={{ bgcolor: 'var(--palette-background-neutral)', color: 'var(--palette-text-secondary)', fontWeight: 600, borderBottom: 'none' }}>Thời gian</TableCell>
                                                <TableCell sx={{ bgcolor: 'var(--palette-background-neutral)', color: 'var(--palette-text-secondary)', fontWeight: 600, borderBottom: 'none' }}>Thanh toán</TableCell>
                                                <TableCell align="right" sx={{ bgcolor: 'var(--palette-background-neutral)', color: 'var(--palette-text-secondary)', fontWeight: 600, borderBottom: 'none', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>Tổng tiền</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {details.bookings.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                                        <Stack alignItems="center" spacing={1}>
                                                            <Icon icon="solar:calendar-time-broken" width={48} style={{ color: 'var(--palette-text-disabled)' }} />
                                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                                Không có lịch đặt nào đóng góp vào doanh thu hôm nay
                                                            </Typography>
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                details.bookings.map((booking) => (
                                                    <TableRow key={booking.bookingId} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                        <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{booking.bookingCode}</TableCell>
                                                        <TableCell>{booking.customerName}</TableCell>
                                                        <TableCell>{dayjs(booking.createdAt).format('HH:mm')}</TableCell>
                                                        <TableCell>
                                                            <Box sx={{
                                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 24, px: 1, borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap',
                                                                ...(booking.paymentStatus === 'PAID' 
                                                                    ? { color: '#00a76f', bgcolor: 'rgba(0, 167, 111, 0.16)' } 
                                                                    : { color: '#ffab00', bgcolor: 'rgba(255, 171, 0, 0.16)' })
                                                            }}>
                                                                {booking.paymentStatus === 'PAID' ? 'Đã TT' : booking.paymentStatus}
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                            {formatCurrency(booking.totalAmount)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2 }}>
                <Button 
                    onClick={onClose} 
                    variant="outlined" 
                    color="inherit" 
                    sx={{ 
                        fontWeight: 600, 
                        textTransform: 'none', 
                        borderRadius: '8px',
                        color: 'text.primary',
                        borderColor: 'rgba(145, 158, 171, 0.32)',
                        '&:hover': {
                            borderColor: 'text.primary',
                            bgcolor: 'action.hover'
                        }
                    }}
                >
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};
