import { GridColDef } from '@mui/x-data-grid';
import { Stack, Typography, IconButton, Tooltip, Box, Avatar, Chip, Popover, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import { NavLink } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
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

export const getOrderColumns = (onQuickConfirm?: (id: string) => void): GridColDef<OrderResponse>[] => [
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
        width: 140,
        renderCell: (params) => {
            const payment = params.row.payments[0];
            const isCOD = payment?.paymentMethod === 'CASH' || !payment;
            return (
                <Stack spacing={0} sx={{ py: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        {isCOD ? <PaymentsIcon sx={{ color: '#637381', fontSize: '1.6rem' }} /> : <AccountBalanceIcon sx={{ color: '#2196F3', fontSize: '1.6rem' }} />}
                        <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#1C252E' }}>
                            {isCOD ? 'Tiền mặt' : 'Chuyển khoản'}
                        </Typography>
                    </Stack>
                    <Typography sx={{
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: payment?.status === 'PAID' ? '#00A76F' : '#FF5630',
                        textTransform: 'uppercase'
                    }}>
                        {payment?.status === 'PAID' ? '● Đã trả' : '○ Chưa trả'}
                    </Typography>
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
        width: 140,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
            const status = params.value;
            let bgColor = "rgba(145, 158, 171, 0.16)";
            let textColor = "#637381";
            let dotColor = "#919EAB";
            let label = status;

            switch (status) {
                case 'PENDING':
                    bgColor = "rgba(255, 171, 0, 0.16)";
                    textColor = "#B76E00";
                    dotColor = "#FFAB00";
                    label = "Chờ xử lý";
                    break;
                case 'CONFIRMED':
                    bgColor = "rgba(0, 184, 217, 0.16)";
                    textColor = "#006C9C";
                    dotColor = "#00B8D9";
                    label = "Đã xác nhận";
                    break;
                case 'SHIPPING':
                    bgColor = "rgba(16, 100, 173, 0.16)";
                    textColor = "#1064ad";
                    dotColor = "#1064ad";
                    label = "Đang giao";
                    break;
                case 'DELIVERED':
                    bgColor = "rgba(34, 197, 94, 0.16)";
                    textColor = "#118D57";
                    dotColor = "#22C55E";
                    label = "Đã giao";
                    break;
                case 'CANCELLED':
                    bgColor = "rgba(255, 86, 48, 0.16)";
                    textColor = "#B71D18";
                    dotColor = "#FF5630";
                    label = "Đã hủy";
                    break;
            }

            return (
                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '8px',
                            bgcolor: bgColor,
                            color: textColor,
                            fontWeight: 800,
                            fontSize: '1.1rem',
                            textTransform: 'uppercase'
                        }}
                    >
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dotColor }} />
                        <Box component="span">{label}</Box>
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
                {params.row.status === 'PENDING' && (
                    <Tooltip title="Xác nhận nhanh">
                        <IconButton
                            size="small"
                            onClick={() => onQuickConfirm?.(params.row.id)}
                            sx={{ color: '#00A76F', '&:hover': { bgcolor: 'rgba(0, 167, 111, 0.08)' } }}
                        >
                            <CheckCircleOutlineIcon sx={{ fontSize: '1.8rem' }} />
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
