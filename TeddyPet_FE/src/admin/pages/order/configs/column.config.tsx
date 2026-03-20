import { GridColDef } from '@mui/x-data-grid';
import { Stack, Typography, IconButton, Tooltip, Box, Badge } from '@mui/material';
import { NavLink } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CancelIcon from '@mui/icons-material/Cancel';
import ReplayIcon from '@mui/icons-material/Replay';
import { getOrderStatus, getRefundStatus } from '../../../../constants/status';
import { prefixAdmin } from '../../../constants/routes';
import { OrderResponse } from '../../../../types/order.type';




export const getOrderColumns = (
    onQuickConfirm?: (id: string) => void,
    onUpdateStatus?: (id: string, status: string) => void,
    onCancelOrder?: (id: string) => void,
    onReturnOrder?: (id: string) => void,
    onPrintOrder?: (id: string, code: string) => void
): GridColDef<OrderResponse>[] => [
        {
            field: 'orderCode',
            headerName: 'Mã đơn',
            width: 140,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography
                        component={NavLink}
                        to={`/${prefixAdmin}/order/detail/${params.row.id}`}
                        sx={{
                            fontWeight: 900,
                            color: '#3F51B5',
                            textDecoration: 'none',
                            fontSize: '0.8125rem',
                            letterSpacing: '0.5px',
                            whiteSpace: 'nowrap',
                            textAlign: 'center',
                            width: '100%',
                            display: 'block',
                            '&:hover': { textDecoration: 'underline' }
                        }}
                    >
                        #{params.value}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'orderType',
            headerName: 'Loại đơn',
            width: 100,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
                const type = params.value as string | undefined;
                const isOffline = type === 'OFFLINE';
                return (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            color: isOffline ? '#6366F1' : '#0EA5E9',
                            whiteSpace: 'nowrap'
                        }}>
                            {isOffline ? 'Tại quầy' : 'Đặt online'}
                        </Typography>
                    </Box>
                );
            }
        },
        {
            field: 'createdAt',
            headerName: 'Ngày đặt',
            width: 130,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
                const date = new Date(params.value);
                return (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Stack spacing={0} alignItems="center">
                            <Typography sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#1C252E' }}>
                                {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </Typography>
                            <Typography sx={{ fontSize: '0.625rem', color: '#919EAB', fontWeight: 700 }}>
                                {date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                        </Stack>
                    </Box>
                );
            }
        },
        {
            field: 'customer',
            headerName: 'Khách hàng',
            flex: 2,
            minWidth: 180,
            renderCell: (params) => {
                const row = params.row;
                return (
                    <Stack spacing={0} sx={{ py: 1 }}>
                        <Typography noWrap sx={{ fontWeight: 800, fontSize: '0.8438rem', color: '#1C252E' }}>
                            {row.user?.fullName || row.shippingName}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#637381', fontWeight: 600 }}>
                            {row.shippingPhone}
                        </Typography>
                        <Typography noWrap sx={{ fontSize: '0.6875rem', color: '#919EAB', fontWeight: 700 }}>
                            {/* Ưu tiên email nhập theo đơn (guestEmail) nếu có, sau đó mới tới email tài khoản */}
                            {row.guestEmail || row.user?.email || ''}
                        </Typography>
                    </Stack>
                );
            }
        },
        {
            field: 'orderItems',
            headerName: 'Số món',
            width: 80,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
                const items = params.value as any[];
                return (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.875rem', color: '#1C252E' }}>
                            {items.reduce((acc, item) => acc + item.quantity, 0)}
                        </Typography>
                    </Box>
                );
            }
        },
        {
            field: 'payment',
            headerName: 'Thanh toán',
            width: 100,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
                const payment = params.row.payments[0];
                const isCOD = payment?.paymentMethod === 'CASH' || !payment;

                return (
                    <Stack
                        spacing={0.5}
                        alignItems="center"
                        justifyContent="center"
                        sx={{ width: '100%', height: '100%', py: 1 }}
                    >
                        {/* Phương thức thanh toán */}
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            {isCOD ? (
                                <PaymentsIcon sx={{ color: '#637381', fontSize: '1rem' }} />
                            ) : (
                                <AccountBalanceIcon sx={{ color: '#2196F3', fontSize: '1rem' }} />
                            )}
                            <Typography sx={{ fontWeight: 800, fontSize: '0.8125rem', color: '#1C252E' }}>
                                {isCOD ? 'COD' : 'CK'}
                            </Typography>
                        </Stack>
                    </Stack>
                );
            }
        },
        {
            field: 'finalAmount',
            headerName: 'Tổng tiền',
            width: 140,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ fontWeight: 900, color: '#1C252E', fontSize: '0.9375rem', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>
                        {params.value?.toLocaleString('vi-VN')}₫
                    </Typography>
                </Box>
            )
        },
        {
            field: 'status',
            headerName: 'Trạng thái',
            width: 110,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
                const status = params.value;
                const { label, color: textColor, bgColor, dotColor } = getOrderStatus(status);

                return (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.6}
                            sx={{
                                px: 1.2,
                                py: 0.5,
                                borderRadius: '6px',
                                bgcolor: bgColor,
                            }}
                        >
                            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: dotColor }} />
                            <Typography sx={{
                                color: textColor,
                                fontWeight: 700,
                                fontSize: '0.6562rem',
                                whiteSpace: 'nowrap'
                            }}>
                                {label}
                            </Typography>
                        </Stack>
                    </Box>
                );
            }
        },
        {
            field: 'latestRefundStatus',
            headerName: 'Hoàn tiền',
            width: 120,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
                const status = params.value;
                if (!status) return null;
                const refundInfo = getRefundStatus(status);
                if (!refundInfo) return null;

                return (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Box
                            sx={{
                                px: 1,
                                py: 0.5,
                                borderRadius: '6px',
                                bgcolor: refundInfo.bgColor,
                            }}
                        >
                            <Typography sx={{
                                color: refundInfo.color,
                                fontWeight: 800,
                                fontSize: '0.625rem',
                                whiteSpace: 'nowrap'
                            }}>
                                {refundInfo.label}
                            </Typography>
                        </Box>
                    </Box>
                );
            }
        },
        {
            field: 'actions',
            headerName: 'Hành động',
            width: 150,
            sortable: false,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (
                <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center" sx={{ height: '100%' }}>
                    {/* Luồng Next Action đồng bộ với Detail Page */}
                    {params.row.status === 'PENDING' && (
                        <Tooltip title="Xác nhận & Phí ship">
                            <IconButton
                                size="small"
                                onClick={() => onQuickConfirm?.(params.row.id)}
                                sx={{ color: '#00A76F', '&:hover': { bgcolor: 'rgba(0, 167, 111, 0.08)' } }}
                            >
                                <CheckCircleOutlineIcon sx={{ fontSize: '1.125rem' }} />
                            </IconButton>
                        </Tooltip>
                    )}

                    {/* Bắt đầu đóng gói */}
                    {((params.row.status === 'PAID' && params.row.payments?.[0]?.status === 'COMPLETED') ||
                      (params.row.status === 'CONFIRMED' && params.row.payments?.[0]?.paymentMethod === 'CASH')) && (
                        <Tooltip title="Bắt đầu đóng gói">
                            <IconButton
                                size="small"
                                onClick={() => onUpdateStatus?.(params.row.id, 'PROCESSING')}
                                sx={{ color: '#16A34A', '&:hover': { bgcolor: 'rgba(22, 163, 74, 0.08)' } }}
                            >
                                <InventoryIcon sx={{ fontSize: '1.125rem' }} />
                            </IconButton>
                        </Tooltip>
                    )}

                    {params.row.status === 'PROCESSING' && (
                        <Tooltip title="Bắt đầu giao hàng">
                            <IconButton
                                size="small"
                                onClick={() => onUpdateStatus?.(params.row.id, 'DELIVERING')}
                                sx={{ color: '#1064ad', '&:hover': { bgcolor: 'rgba(16, 100, 173, 0.08)' } }}
                            >
                                <LocalShippingIcon sx={{ fontSize: '1.125rem' }} />
                            </IconButton>
                        </Tooltip>
                    )}

                    {params.row.status === 'DELIVERING' && (
                        <Tooltip title="Xác nhận Đã giao">
                            <IconButton
                                size="small"
                                onClick={() => onUpdateStatus?.(params.row.id, 'DELIVERED')}
                                sx={{ color: '#118D57', '&:hover': { bgcolor: 'rgba(17, 141, 87, 0.08)' } }}
                            >
                                <DoneAllIcon sx={{ fontSize: '1.125rem' }} />
                            </IconButton>
                        </Tooltip>
                    )}

                    {/* Nút hủy / yêu cầu hoàn tiền:
                        - Đơn ONLINE + thanh toán online (không phải CASH) => tooltip "Hủy / Yêu cầu hoàn tiền"
                        - Các trường hợp còn lại => "Xóa / Hủy đơn hàng"
                        Chỉ hiển thị khi trạng thái là PENDING, CONFIRMED, PROCESSING */}
                    {(['PENDING', 'CONFIRMED', 'PROCESSING'].includes(params.row.status) || (params.row.status === 'CANCELLED' && params.row.latestRefundStatus === 'APPROVED')) && (() => {
                        const payment = params.row.payments?.[0];
                        const isOnlinePayment = params.row.orderType === 'ONLINE' && payment && payment.paymentMethod !== 'CASH';
                        const hasRefundRequest = isOnlinePayment && (params.row.latestRefundStatus === 'PENDING' || !!params.row.cancelReason);
                        const tooltipTitle = isOnlinePayment ? 'Hủy / Yêu cầu hoàn tiền' : 'Xóa / Hủy đơn hàng';
                        const color = isOnlinePayment ? '#F97316' : '#FF5630';
                        const hoverBg = isOnlinePayment ? 'rgba(249, 115, 22, 0.08)' : 'rgba(255, 86, 48, 0.08)';
                        const IconComponent = isOnlinePayment ? ReplayIcon : CancelIcon;
                        return (
                            <Tooltip title={tooltipTitle}>
                                <Badge
                                    color="error"
                                    variant="dot"
                                    invisible={!hasRefundRequest}
                                    overlap="circular"
                                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                                >
                                    <IconButton
                                        size="small"
                                        onClick={() => onCancelOrder?.(params.row.id)}
                                        sx={{ color, '&:hover': { bgcolor: hoverBg } }}
                                    >
                                        <IconComponent sx={{ fontSize: '1.125rem' }} />
                                    </IconButton>
                                </Badge>
                            </Tooltip>
                        );
                    })()}

                    {/* Nút hoàn đơn - chỉ hiện khi DELIVERING (giao không thành công) */}
                    {params.row.status === 'DELIVERING' && (
                        <Tooltip title="Hoàn đơn">
                            <IconButton
                                size="small"
                                onClick={() => onReturnOrder?.(params.row.id)}
                                sx={{ color: '#B76E00', '&:hover': { bgcolor: 'rgba(255, 171, 0, 0.08)' } }}
                            >
                                <ReplayIcon sx={{ fontSize: '1.125rem' }} />
                            </IconButton>
                        </Tooltip>
                    )}

                    <Tooltip title="In vận đơn">
                        <IconButton
                            size="small"
                            onClick={() => onPrintOrder?.(params.row.id, params.row.orderCode)}
                            sx={{ color: '#637381' }}
                        >
                            <LocalPrintshopIcon sx={{ fontSize: '1.125rem' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Xem chi tiết">
                        <IconButton
                            component={NavLink}
                            to={`/${prefixAdmin}/order/detail/${params.row.id}`}
                            size="small"
                            sx={{ color: '#637381' }}
                        >
                            <VisibilityIcon sx={{ fontSize: '1.25rem' }} />
                        </IconButton>
                    </Tooltip>
                </Stack>
            )
        }
    ];

export const columnsInitialState = {
    pagination: {
        paginationModel: {
            pageSize: 10,
        },
    },
};
