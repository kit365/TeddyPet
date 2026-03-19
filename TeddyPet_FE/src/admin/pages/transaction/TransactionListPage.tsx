import React, { useState } from 'react';
import { Box, Typography, Stack, Card, TextField, MenuItem, Button, Chip } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getTransactions, TransactionResponse } from '../../api/transaction.api';
import { DashboardDateFilter, DateRangeValue } from '../../components/dashboard/DashboardDateFilter';

const STATUS_OPTIONS = [
    { label: 'Tất cả trạng thái', value: '' },
    { label: 'Hoàn thành', value: 'COMPLETED' },
    { label: 'Chờ thanh toán', value: 'PENDING' },
    { label: 'Thất bại', value: 'FAILED' },
    { label: 'Đã hủy', value: 'CANCELLED' },
];

const METHOD_OPTIONS = [
    { label: 'Tất cả phương thức', value: '' },
    { label: 'Tiền mặt', value: 'CASH' },
    { label: 'Chuyển khoản', value: 'BANK_TRANSFER' },
    { label: 'VietQR', value: 'VIETQR' },
    { label: 'PayOS', value: 'PAYOS' },
];

export const TransactionListPage: React.FC = () => {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [method, setMethod] = useState('');
    const [dateRange, setDateRange] = useState<DateRangeValue>({
        label: '30 ngày qua',
        startDate: dayjs().subtract(30, 'day'),
        endDate: dayjs()
    });

    const { data: transactionsRes, isLoading } = useQuery({
        queryKey: ['admin-transactions', status, method, dateRange.startDate?.toISOString(), dateRange.endDate?.toISOString()],
        queryFn: () => getTransactions({
            startDate: dateRange.startDate?.toISOString(),
            endDate: dateRange.endDate?.toISOString(),
            status: status || undefined,
            method: method || undefined
        })
    });

    const transactions = transactionsRes?.data || [];

    const filteredTransactions = transactions.filter(t => 
        t.referenceCode.toLowerCase().includes(search.toLowerCase()) ||
        t.customerName.toLowerCase().includes(search.toLowerCase())
    );

    const columns: GridColDef<TransactionResponse>[] = [
        { 
            field: 'id', 
            headerName: 'Mã GD', 
            width: 100,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    #{params.value.substring(0, 8)}
                </Typography>
            )
        },
        { 
            field: 'referenceCode', 
            headerName: 'Mã đơn/lịch', 
            width: 150,
            renderCell: (params) => (
                <Chip 
                    label={params.value} 
                    size="small" 
                    variant="outlined" 
                    color={params.row.type === 'ORDER' ? 'info' : 'warning'} 
                    sx={{ fontWeight: 700 }}
                />
            )
        },
        { 
            field: 'amount', 
            headerName: 'Số tiền', 
            width: 130,
            valueFormatter: (value: number) => 
                new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
        },
        { 
            field: 'paymentMethod', 
            headerName: 'Kênh thanh toán', 
            width: 150,
            renderCell: (params) => (
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Icon 
                        icon={params.value === 'CASH' ? 'eva:pricetags-fill' : 'eva:credit-card-fill'} 
                        width={18} 
                    />
                    <Typography variant="body2">{params.value}</Typography>
                </Stack>
            )
        },
        { 
            field: 'status', 
            headerName: 'Trạng thái', 
            width: 130,
            renderCell: (params) => {
                const isCompleted = params.value === 'COMPLETED';
                const isFailed = params.value === 'FAILED' || params.value === 'CANCELLED';
                return (
                    <Chip 
                        label={params.value} 
                        size="small" 
                        color={isCompleted ? 'success' : isFailed ? 'error' : 'default'}
                        sx={{ fontWeight: 600 }}
                    />
                );
            }
        },
        { 
            field: 'customerName', 
            headerName: 'Khách hàng', 
            width: 180 
        },
        { 
            field: 'createdAt', 
            headerName: 'Thời gian', 
            width: 180,
            valueFormatter: (value: string) => dayjs(value).format('DD/MM/YYYY HH:mm')
        },
        { 
            field: 'description', 
            headerName: 'Ghi chú', 
            flex: 1 
        },
    ];

    const handleExport = () => {
        // Simple CSV export for demo
        const headers = ['ID', 'Reference', 'Amount', 'Method', 'Status', 'Date', 'Customer'];
        const rows = filteredTransactions.map(t => [
            t.id, 
            t.referenceCode, 
            t.amount, 
            t.paymentMethod, 
            t.status, 
            dayjs(t.createdAt).format('DD/MM/YYYY'), 
            t.customerName
        ]);
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `bao-cao-giao-dich-${dayjs().format('YYYYMMDD')}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    return (
        <Box sx={{ p: 4 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Báo cáo Giao dịch</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Theo dõi và quản lý toàn bộ dòng tiền từ đơn hàng và lịch đặt dịch vụ.
                    </Typography>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={<Icon icon="eva:download-fill" />}
                    onClick={handleExport}
                    sx={{ 
                        borderRadius: '12px', 
                        px: 3, 
                        py: 1.2, 
                        bgcolor: '#00A76F',
                        '&:hover': { bgcolor: '#008b5f' },
                        boxShadow: '0 8px 16px rgba(0, 167, 111, 0.24)'
                    }}
                >
                    Xuất dữ liệu
                </Button>
            </Stack>

            <Card sx={{ p: 3, mb: 4, borderRadius: '20px', boxShadow: 'var(--customShadows-z8)' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                    <TextField
                        placeholder="Tìm theo mã hoặc tên khách..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        size="small"
                        sx={{ flexGrow: 1, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        InputProps={{
                            startAdornment: <Icon icon="eva:search-fill" width={20} style={{ marginRight: 8, color: 'gray' }} />
                        }}
                    />
                    <TextField
                        select
                        size="small"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    >
                        {STATUS_OPTIONS.map(opt => (
                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        select
                        size="small"
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    >
                        {METHOD_OPTIONS.map(opt => (
                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                        ))}
                    </TextField>
                    <DashboardDateFilter value={dateRange} onChange={setDateRange} />
                </Stack>
            </Card>

            <Card sx={{ height: 600, borderRadius: '20px', boxShadow: 'var(--customShadows-z12)', border: 'none' }}>
                <DataGrid
                    rows={filteredTransactions}
                    columns={columns}
                    loading={isLoading}
                    disableRowSelectionOnClick
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    sx={{
                        border: 'none',
                        '& .MuiDataGrid-columnHeader': {
                            bgcolor: 'background.neutral',
                            color: 'text.secondary',
                            fontWeight: 700,
                        },
                        '& .MuiDataGrid-cell': {
                            borderBottom: '1px dashed var(--palette-divider)',
                        },
                        '& .MuiDataGrid-footerContainer': {
                            borderTop: 'none',
                        }
                    }}
                />
            </Card>
        </Box>
    );
};
