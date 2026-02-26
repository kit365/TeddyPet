import { GridColDef } from '@mui/x-data-grid';
import { Stack, Typography, IconButton, Tooltip, Box, Avatar, Chip, Popover, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import { NavLink } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CancelIcon from '@mui/icons-material/Cancel';
import ReplayIcon from '@mui/icons-material/Replay';
import { getOrderStatus, getPaymentStatus } from '../../../../constants/status';
import { prefixAdmin } from '../../../constants/routes';
import { OrderResponse } from '../../../../types/order.type';
import React, { useState } from 'react';

const ProductCell = ({ items }: { items: any[] }) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const handleHoverOpen = (event: React.MouseEvent<HTMLElement>) => {
        if (items.length > 1) {
            setAnchorEl(event.currentTarget);
        }
    };

    const handleHoverClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    return (
        <>
            <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ py: 1.5, cursor: items.length > 1 ? 'pointer' : 'default' }}
                onMouseEnter={handleHoverOpen}
                onMouseLeave={handleHoverClose}
            >
                <Avatar
                    src={items[0]?.imageUrl}
                    variant="rounded"
                    sx={{ width: 44, height: 44, borderRadius: '12px', border: '1px solid #F4F6F8' }}
                />
                <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 700, fontSize: '1.35rem', color: '#1C252E', lineHeight: 1.2 }}>
                        {items[0]?.productName}
                    </Typography>
                    {items.length > 1 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Chip
                                label={`+${items.length - 1} món khác`}
                                size="small"
                                sx={{
                                    height: 20,
                                    fontSize: '0.95rem',
                                    fontWeight: 800,
                                    bgcolor: 'rgba(51, 102, 255, 0.08)',
                                    color: '#3366FF',
                                    borderRadius: '6px',
                                    '& .MuiChip-label': { px: 1 }
                                }}
                            />
                            <KeyboardArrowDownIcon sx={{ fontSize: '1.4rem', color: '#919EAB' }} />
                        </Box>
                    )}
                </Stack>
            </Stack>
            <Popover
                sx={{ pointerEvents: 'none' }}
                open={open}
                anchorEl={anchorEl}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                onClose={handleHoverClose}
                disableRestoreFocus
            >
                <List sx={{ p: 1, width: 280 }}>
                    <Typography sx={{ px: 2, py: 1, fontWeight: 800, fontSize: '1.1rem', color: '#919EAB', textTransform: 'uppercase' }}>
                        Danh sách sản phẩm
                    </Typography>
                    {items.map((item, idx) => (
                        <ListItem key={idx} sx={{ px: 2, py: 1 }}>
                            <ListItemAvatar sx={{ minWidth: 48 }}>
                                <Avatar src={item.imageUrl} variant="rounded" sx={{ width: 32, height: 32 }} />
                            </ListItemAvatar>
                            <ListItemText
                                primary={item.productName}
                                secondary={`${item.quantity} x ${item.unitPrice.toLocaleString('vi-VN')}₫`}
                                primaryTypographyProps={{ fontSize: '1.25rem', fontWeight: 700, noWrap: true }}
                                secondaryTypographyProps={{ fontSize: '1.1rem', fontWeight: 500 }}
                            />
                        </ListItem>
                    ))}
                </List>
            </Popover>
        </>
    );
};

export const getOrderColumns = (
    onQuickConfirm?: (id: string) => void,
    onUpdateStatus?: (id: string, status: string) => void,
    onCancelOrder?: (id: string) => void,
    onReturnOrder?: (id: string) => void
): GridColDef<OrderResponse>[] => [
        {
            field: 'orderCode',
            headerName: 'Mã đơn',
            width: 160,
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
                            fontSize: '1.3rem',
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
                            <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#1C252E' }}>
                                {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </Typography>
                            <Typography sx={{ fontSize: '1rem', color: '#919EAB', fontWeight: 700 }}>
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
            flex: 1,
            minWidth: 180,
            renderCell: (params) => {
                const row = params.row;
                return (
                    <Stack spacing={0} sx={{ py: 1 }}>
                        <Typography noWrap sx={{ fontWeight: 800, fontSize: '1.35rem', color: '#1C252E' }}>
                            {row.user?.fullName || row.shippingName}
                        </Typography>
                        <Typography sx={{ fontSize: '1.2rem', color: '#637381', fontWeight: 600 }}>
                            {row.shippingPhone}
                        </Typography>
                        <Typography noWrap sx={{ fontSize: '1.1rem', color: '#919EAB', fontWeight: 700 }}>
                            {row.user?.email || row.guestEmail || ''}
                        </Typography>
                    </Stack>
                );
            }
        },
        {
            field: 'orderItems',
            headerName: 'Sản phẩm',
            flex: 2,
            minWidth: 280,
            renderCell: (params) => <ProductCell items={params.value as any[]} />
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
                const status = payment?.status;
                const { label: statusLabel, color: statusColor, bgColor: statusBgColor } = getPaymentStatus(status);

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
                                <PaymentsIcon sx={{ color: '#637381', fontSize: '1.4rem' }} />
                            ) : (
                                <AccountBalanceIcon sx={{ color: '#2196F3', fontSize: '1.4rem' }} />
                            )}
                            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1C252E' }}>
                                {isCOD ? 'COD' : 'CK'}
                            </Typography>
                        </Stack>
                        {/* Badge trạng thái */}
                        <Box sx={{
                            px: 1,
                            py: 0.3,
                            borderRadius: '6px',
                            bgcolor: statusBgColor,
                        }}>
                            <Typography sx={{
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                color: statusColor,
                                whiteSpace: 'nowrap'
                            }}>
                                {statusLabel}
                            </Typography>
                        </Box>
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
                    <Typography sx={{ fontWeight: 900, color: '#1C252E', fontSize: '1.5rem', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>
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
                                fontSize: '1.05rem',
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
            field: 'actions',
            headerName: '',
            width: 130,
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
                                <CheckCircleOutlineIcon sx={{ fontSize: '1.8rem' }} />
                            </IconButton>
                        </Tooltip>
                    )}

                    {params.row.status === 'CONFIRMED' && (
                        <Tooltip title="Bắt đầu đóng gói">
                            <IconButton
                                size="small"
                                onClick={() => onUpdateStatus?.(params.row.id, 'PROCESSING')}
                                sx={{ color: '#16A34A', '&:hover': { bgcolor: 'rgba(22, 163, 74, 0.08)' } }}
                            >
                                <InventoryIcon sx={{ fontSize: '1.8rem' }} />
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
                                <LocalShippingIcon sx={{ fontSize: '1.8rem' }} />
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
                                <DoneAllIcon sx={{ fontSize: '1.8rem' }} />
                            </IconButton>
                        </Tooltip>
                    )}

                    {/* Nút hủy đơn - chỉ hiện khi PENDING, CONFIRMED */}
                    {['PENDING', 'CONFIRMED'].includes(params.row.status) && (
                        <Tooltip title="Hủy đơn hàng">
                            <IconButton
                                size="small"
                                onClick={() => onCancelOrder?.(params.row.id)}
                                sx={{ color: '#FF5630', '&:hover': { bgcolor: 'rgba(255, 86, 48, 0.08)' } }}
                            >
                                <CancelIcon sx={{ fontSize: '1.8rem' }} />
                            </IconButton>
                        </Tooltip>
                    )}

                    {/* Nút hoàn đơn - chỉ hiện khi DELIVERING (giao không thành công) */}
                    {params.row.status === 'DELIVERING' && (
                        <Tooltip title="Hoàn đơn">
                            <IconButton
                                size="small"
                                onClick={() => onReturnOrder?.(params.row.id)}
                                sx={{ color: '#B76E00', '&:hover': { bgcolor: 'rgba(255, 171, 0, 0.08)' } }}
                            >
                                <ReplayIcon sx={{ fontSize: '1.8rem' }} />
                            </IconButton>
                        </Tooltip>
                    )}

                    <Tooltip title="In vận đơn">
                        <IconButton size="small" sx={{ color: '#637381' }}>
                            <LocalPrintshopIcon sx={{ fontSize: '1.8rem' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Xem chi tiết">
                        <IconButton
                            component={NavLink}
                            to={`/${prefixAdmin}/order/detail/${params.row.id}`}
                            size="small"
                            sx={{ color: '#637381' }}
                        >
                            <VisibilityIcon sx={{ fontSize: '2rem' }} />
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
