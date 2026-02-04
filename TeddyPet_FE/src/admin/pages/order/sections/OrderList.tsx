import {
    DataGrid,
} from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import { SortAscendingIcon, SortDescendingIcon, UnsortedIcon } from '../../../assets/icons';
import { getOrderColumns } from '../configs/column.config';
import { useDataGridLocale } from '../../../hooks/useDataGridLocale';
import { useOrders } from '../hooks/useOrders';
import {
    dataGridCardStyles,
    dataGridContainerStyles,
    columnsPanelStyles,
    filterPanelStyles,
    dataGridStyles,
} from '../../product/configs/styles.config';
import { Stack, Typography, TextField, InputAdornment, Box, Tabs, Tab, Badge, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { updateOrderStatus, updateShippingFee } from '../../../api/order.api';
import { toast } from 'react-toastify';
import { useState, useMemo } from 'react';
import { OrderResponse } from '../../../../types/order.type';

const STATUS_OPTIONS = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'Chờ xử lý', value: 'PENDING', color: '#B76E00' },
    { label: 'Đã xác nhận', value: 'CONFIRMED', color: '#006C9C' },
    { label: 'Đang giao', value: 'SHIPPING', color: '#1064ad' },
    { label: 'Hoàn tất', value: 'DELIVERED', color: '#118D57' },
    { label: 'Đã hủy', value: 'CANCELLED', color: '#B71D18' },
];

const CustomNoRowsOverlay = () => {
    return (
        <Stack height="100%" alignItems="center" justifyContent="center">
            <div className="w-[100px] h-[100px] mb-[20px]">
                <img
                    src="https://img.icons8.com/fluency/200/nothing-found.png"
                    alt="No data"
                    className="w-full h-full object-contain filter grayscale opacity-60"
                />
            </div>
            <Typography variant="body1" sx={{ fontSize: '1.5rem', fontWeight: 500, color: 'text.secondary' }}>
                Không tìm thấy đơn hàng nào
            </Typography>
        </Stack>
    );
}

export const OrderList = () => {
    const {
        orders,
        loading,
        totalElements,
        page,
        setPage,
        pageSize,
        setPageSize,
        keyword,
        setKeyword,
        status,
        setStatus,
        refresh
    } = useOrders();

    const [confirmingOrder, setConfirmingOrder] = useState<OrderResponse | null>(null);
    const [newShippingFee, setNewShippingFee] = useState<string>("0");
    const [distance, setDistance] = useState<number>(0);
    const [weight, setWeight] = useState<number>(0);
    const [updating, setUpdating] = useState(false);

    const handleQuickConfirm = (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (order) {
            setConfirmingOrder(order);
            setNewShippingFee(order.shippingFee.toString());
            setDistance(0);
            setWeight(0);
        }
    };

    const suggestedFee = useMemo(() => {
        // Same logic as Detail page
        return (distance * 5000) + (weight > 2 ? (weight - 2) * 5000 : 0);
    }, [distance, weight]);

    const handleConfirmFinal = async () => {
        if (!confirmingOrder) return;
        setUpdating(true);
        try {
            await updateShippingFee(confirmingOrder.id, Number(newShippingFee));
            const response = await updateOrderStatus(confirmingOrder.id, 'CONFIRMED');
            if (response.success) {
                toast.success("Đã xác nhận đơn hàng \u0026 Cập nhật phí ship!");
                setConfirmingOrder(null);
                refresh();
            } else {
                toast.error(response.message || "Xác nhận thất bại");
            }
        } catch (error) {
            toast.error("Lỗi hệ thống");
        } finally {
            setUpdating(false);
        }
    };

    const columns = getOrderColumns(handleQuickConfirm);
    const localeText = useDataGridLocale();

    const handleTabChange = (_: any, newValue: string) => {
        setStatus(newValue);
        setPage(0);
    };

    return (
        <Card
            elevation={0}
            sx={{
                ...dataGridCardStyles,
                background: 'white',
                border: '1px solid rgba(145, 158, 171, 0.2)',
                boxShadow: '0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)',
                borderRadius: '24px'
            }}
        >
            <Tabs
                value={status}
                onChange={handleTabChange}
                sx={{
                    px: 3,
                    pt: 1,
                    borderBottom: '1px solid rgba(145, 158, 171, 0.1)',
                    '& .MuiTab-root': {
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        textTransform: 'none',
                        minWidth: 120,
                        py: 2,
                        color: '#637381',
                        '&.Mui-selected': { color: '#1C252E' }
                    },
                    '& .MuiTabs-indicator': {
                        height: 3,
                        bgcolor: '#1C252E'
                    }
                }}
            >
                {STATUS_OPTIONS.map((opt) => (
                    <Tab
                        key={opt.value}
                        value={opt.value}
                        label={
                            <Stack direction="row" spacing={1} alignItems="center">
                                {opt.label}
                                {opt.value === 'PENDING' && totalElements > 0 && status === 'ALL' && (
                                    <Badge badgeContent={totalElements} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '1rem', height: 18, minWidth: 18 } }} />
                                )}
                            </Stack>
                        }
                    />
                ))}
            </Tabs>

            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                sx={{
                    p: 3,
                    alignItems: { md: 'center' },
                    justifyContent: 'space-between',
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{ bgcolor: 'rgba(0, 167, 111, 0.1)', p: 1, borderRadius: '8px', display: 'flex' }}>
                        <SearchIcon sx={{ color: '#00A76F' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1C252E', fontSize: '1.8rem' }}>
                        {status === 'ALL' ? 'Tất cả đơn hàng' : STATUS_OPTIONS.find(o => o.value === status)?.label}
                        <Box component="span" sx={{ ml: 1, color: 'text.secondary', fontWeight: 500 }}>
                            ({totalElements})
                        </Box>
                    </Typography>
                </Stack>

                <TextField
                    size="small"
                    placeholder="Tìm mã đơn, tên khách, SĐT..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    sx={{
                        width: { xs: '100%', md: 400 },
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            bgcolor: '#F4F6F8',
                            '& fieldset': { border: 'none' },
                            '&:hover fieldset': { border: 'none' },
                            '&.Mui-focused fieldset': { border: '1px solid #1C252E' }
                        }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.8rem' }} />
                            </InputAdornment>
                        ),
                    }}
                />
            </Stack>

            <div style={{ ...dataGridContainerStyles, padding: '0 24px 24px' }}>
                <DataGrid
                    loading={loading}
                    rows={orders}
                    columns={columns}
                    density="comfortable"
                    rowCount={totalElements}
                    paginationMode="server"
                    paginationModel={{ page, pageSize }}
                    onPaginationModelChange={(model) => {
                        setPage(model.page);
                        setPageSize(model.pageSize);
                    }}
                    showCellVerticalBorder={false}
                    showColumnVerticalBorder={false}
                    slots={{
                        columnSortedAscendingIcon: SortAscendingIcon,
                        columnSortedDescendingIcon: SortDescendingIcon,
                        columnUnsortedIcon: UnsortedIcon,
                        noRowsOverlay: CustomNoRowsOverlay
                    }}
                    slotProps={{
                        columnsPanel: {
                            sx: columnsPanelStyles,
                        },
                        filterPanel: {
                            sx: filterPanelStyles,
                        },
                    }}
                    localeText={localeText}
                    pageSizeOptions={[5, 10, 25, 50]}
                    getRowHeight={() => 'auto'}
                    disableRowSelectionOnClick
                    sx={{
                        ...dataGridStyles,
                        border: 'none',
                        '& .MuiDataGrid-columnHeader': {
                            bgcolor: '#F4F6F8',
                            color: '#637381',
                            fontWeight: 700
                        },
                        '& .MuiDataGrid-cell': {
                            borderBottom: '1px dashed rgba(145, 158, 171, 0.2)'
                        }
                    }}
                />
            </div>

            {/* Quick Confirm Shipping Fee Dialog */}
            <Dialog
                open={!!confirmingOrder}
                onClose={() => setConfirmingOrder(null)}
                PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 900, fontSize: '2rem', textAlign: 'center', pb: 0 }}>
                    Xác nhận nhanh?
                </DialogTitle>
                <DialogContent sx={{ textAlign: 'center', py: 3, minWidth: 450 }}>
                    <Typography sx={{ fontSize: '1.4rem', mb: 1, color: 'text.secondary' }}>
                        Khách đặt hàng: <b>{confirmingOrder && new Date(confirmingOrder.createdAt).toLocaleString('vi-VN')}</b>
                    </Typography>
                    <Typography sx={{ fontSize: '1.6rem', mb: 3 }}>
                        Xác nhận đơn <b>#{confirmingOrder?.orderCode}</b>
                    </Typography>

                    <Box sx={{ p: 2.5, bgcolor: '#F4F6F8', borderRadius: '16px', mb: 3 }}>
                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                            <TextField
                                label="Khoảng cách (km)"
                                type="number"
                                size="small"
                                value={distance}
                                onChange={(e) => setDistance(Number(e.target.value))}
                                InputProps={{ endAdornment: <InputAdornment position="end">km</InputAdornment> }}
                            />
                            <TextField
                                label="Cân nặng (kg)"
                                type="number"
                                size="small"
                                value={weight}
                                onChange={(e) => setWeight(Number(e.target.value))}
                                InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }}
                            />
                        </Stack>
                        <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#006C9C' }}>
                            Phi đề xuất: {suggestedFee.toLocaleString('vi-VN')}₫
                        </Typography>
                    </Box>

                    <Box sx={{ mb: 4 }}>
                        <TextField
                            fullWidth
                            label="Phí ship áp dụng"
                            type="number"
                            value={newShippingFee}
                            onChange={(e) => setNewShippingFee(e.target.value)}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">₫</InputAdornment>,
                                sx: {
                                    borderRadius: '16px',
                                    '& input': { fontWeight: 900, fontSize: '2rem', textAlign: 'center', color: '#B71D18' }
                                }
                            }}
                        />
                    </Box>

                    <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{ bgcolor: '#1C252E', p: 2, borderRadius: '16px' }}>
                        <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                            TỔNG THANH TOÁN:
                        </Typography>
                        <Typography sx={{ fontSize: '2.2rem', fontWeight: 900, color: '#00A76F' }}>
                            {confirmingOrder && (confirmingOrder.subtotal + Number(newShippingFee) - confirmingOrder.discountAmount).toLocaleString('vi-VN')}₫
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 4, gap: 2 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => setConfirmingOrder(null)}
                        sx={{ borderRadius: '12px', py: 1.5, fontWeight: 800 }}
                    >
                        HỦY
                    </Button>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleConfirmFinal}
                        disabled={updating}
                        sx={{ bgcolor: '#1C252E', borderRadius: '12px', py: 1.5, fontWeight: 800, '&:hover': { bgcolor: '#333' } }}
                    >
                        {updating ? "Đang xử lý..." : "XÁC NHẬN NHANH"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    )
}
