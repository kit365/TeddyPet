import { GridColDef } from '@mui/x-data-grid';
import { Chip, Stack, Typography, IconButton, Tooltip } from '@mui/material';
import { NavLink } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';
import { prefixAdmin } from '../../../constants/routes';
import { OrderResponse } from '../../../../types/order.type';

export const getOrderColumns = (): GridColDef<OrderResponse>[] => [
    {
        field: 'orderCode',
        headerName: 'Mã đơn hàng',
        width: 180,
        renderCell: (params) => (
            <Typography
                component={NavLink}
                to={`/${prefixAdmin}/order/detail/${params.row.id}`}
                sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                }}
            >
                #{params.value}
            </Typography>
        )
    },
    {
        field: 'customer',
        headerName: 'Khách hàng',
        flex: 1,
        minWidth: 300,
        renderHeader: () => <span style={{ paddingLeft: '8px' }}>Khách hàng</span>,
        valueGetter: (_, row) => {
            if (row.user) return row.user.fullName;
            return row.guestEmail || row.shippingName || 'Khách vãng lai';
        },
        renderCell: (params) => {
            const row = params.row;
            return (
                <Stack spacing={0.5} sx={{ py: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {row.user?.fullName || row.shippingName || 'Khách vãng lai'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {row.user?.email || row.guestEmail || 'N/A'}
                    </Typography>
                </Stack>
            );
        }
    },
    {
        field: 'createdAt',
        headerName: 'Ngày đặt',
        width: 180,
        valueFormatter: (value) => {
            if (!value) return '';
            return new Date(value as string).toLocaleString('vi-VN');
        }
    },
    {
        field: 'finalAmount',
        headerName: 'Tổng tiền',
        width: 150,
        renderCell: (params) => (
            <Typography sx={{ fontWeight: 700, color: 'success.main' }}>
                {params.value?.toLocaleString('vi-VN')}₫
            </Typography>
        )
    },
    {
        field: 'status',
        headerName: 'Trạng thái',
        width: 150,
        renderCell: (params) => {
            const status = params.value;
            let color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" = "default";
            let label = status;

            switch (status) {
                case 'PENDING':
                    color = "warning";
                    label = "Chờ xử lý";
                    break;
                case 'CONFIRMED':
                    color = "info";
                    label = "Đã xác nhận";
                    break;
                case 'SHIPPING':
                    color = "primary";
                    label = "Đang giao";
                    break;
                case 'DELIVERED':
                    color = "success";
                    label = "Đã giao";
                    break;
                case 'CANCELLED':
                    color = "error";
                    label = "Đã hủy";
                    break;
            }

            return (
                <Chip
                    label={label}
                    color={color}
                    size="small"
                    sx={{ fontWeight: 600, borderRadius: '8px' }}
                />
            );
        }
    },
    {
        field: 'actions',
        headerName: 'Thao tác',
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
            <Stack direction="row" spacing={1}>
                <Tooltip title="Xem chi tiết">
                    <IconButton
                        component={NavLink}
                        to={`/${prefixAdmin}/order/detail/${params.row.id}`}
                        size="small"
                    >
                        <VisibilityIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="In hóa đơn">
                    <IconButton size="small">
                        <LocalPrintshopIcon fontSize="small" />
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
