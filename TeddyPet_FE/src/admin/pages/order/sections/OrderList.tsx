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
import { Stack, Typography, TextField, InputAdornment, Box, Tabs, Tab, Badge, Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, IconButton, Divider } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ReplayIcon from '@mui/icons-material/Replay';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { updateOrderStatus, updateShippingFee, cancelOrderByAdmin, returnOrder, downloadOrderInvoice, handleOrderRefundRequest, getOrderRefundRequests } from '../../../api/order.api';
import { getBankInformationByOrderId } from '../../../../api/bank.api';
import { getShippingFeeSuggestion } from '../../../api/shipping.api';
import { getAllSettings } from '../../../api/setting.api';
import { APP_SETTING_KEYS } from '../../../constants/settings';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import { OrderResponse, OrderRefundResponse } from '../../../../types/order.type';
import { StatusConfirmDialog } from '../../../components/StatusConfirmDialog';

const STATUS_OPTIONS = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'Chờ xác nhận', value: 'PENDING', color: '#B76E00' },
    { label: 'Đã xác nhận', value: 'CONFIRMED', color: '#006C9C' },
    { label: 'Đang đóng gói', value: 'PROCESSING', color: '#229A16' },
    { label: 'Đang giao hàng', value: 'DELIVERING', color: '#1064ad' },
    { label: 'Đã giao hàng', value: 'DELIVERED', color: '#118D57' },
    { label: 'Hoàn tất', value: 'COMPLETED', color: '#05A845' },
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
            <Typography variant="body1" sx={{ fontSize: '0.9375rem', fontWeight: 500, color: 'text.secondary' }}>
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
        pendingCount,
        page,
        setPage,
        pageSize,
        setPageSize,
        keyword,
        setKeyword,
        status,
        setStatus,
        sortKey,
        setSortKey,
        sortDirection,
        setSortDirection,
        refresh
    } = useOrders();

    const [confirmingOrder, setConfirmingOrder] = useState<OrderResponse | null>(null);
    const [newShippingFee, setNewShippingFee] = useState<string>("0");
    const [distance, setDistance] = useState<number>(0);
    const [weight, setWeight] = useState<number>(0);
    const [updating, setUpdating] = useState(false);

    // New states for suggestion sync with Detail page
    const [suggestedFee, setSuggestedFee] = useState<number>(0);
    const [suggestionStatus, setSuggestionStatus] = useState<string>('');
    const [fetchingSuggestion, setFetchingSuggestion] = useState(false);

    // Cancel / refund order states
    const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);
    const [refundOrder, setRefundOrder] = useState<OrderResponse | null>(null);
    const [refundNote, setRefundNote] = useState('');
    const [refundTxId, setRefundTxId] = useState('');
    const [refundRequestId, setRefundRequestId] = useState<number | null>(null);
    const [refundBankInfo, setRefundBankInfo] = useState<{
        accountNumber: string;
        accountHolderName: string;
        bankCode: string;
        bankName?: string | null;
    } | null>(null);
    const [refundHistory, setRefundHistory] = useState<OrderRefundResponse[]>([]);
    const [loadingRefundHistory, setLoadingRefundHistory] = useState(false);

    // Status Confirmation Dialog State
    const [statusConfirm, setStatusConfirm] = useState<{ id: string, status: string } | null>(null);

    // Địa chỉ cửa hàng (hiển thị trong dialog xác nhận vận chuyển)
    const [shopAddress, setShopAddress] = useState<string>('');

    const quickCancelReasons = [
        "Hết hàng thực tế",
        "Khách yêu cầu hủy",
        "Không liên lạc được (đã gọi 3 lần)",
        "Khách từ chối phí ship",
        "Đơn hàng ảo/Spam"
    ];

    const handleQuickConfirm = (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (order) {
            setConfirmingOrder(order);
            setNewShippingFee(order.shippingFee.toString());
            setDistance(order.distanceKm || 0);
            setWeight(1); // Default weight like in Detail page
        }
    };

    useEffect(() => {
        const loadShopAddress = async () => {
            try {
                const res = await getAllSettings();
                if (res.success && res.data) {
                    const addr = res.data.find(s => s.settingKey === APP_SETTING_KEYS.SHOP_ADDRESS)?.settingValue || '';
                    setShopAddress(addr);
                }
            } catch {
                setShopAddress('');
            }
        };
        if (confirmingOrder) loadShopAddress();
    }, [confirmingOrder]);

    useEffect(() => {
        const fetchSuggestion = async () => {
            if (confirmingOrder && distance > 0) {
                setFetchingSuggestion(true);
                try {
                    const response = await getShippingFeeSuggestion(distance, 0, confirmingOrder.subtotal, weight);
                    if (response.success && response.data) {
                        setSuggestedFee(response.data.amount || 0);
                        setSuggestionStatus(response.data.status);
                    } else {
                        setSuggestedFee(0);
                        setSuggestionStatus('ERROR');
                    }
                } catch (error) {
                    console.error("Error fetching suggestion:", error);
                    setSuggestedFee(0);
                    setSuggestionStatus('ERROR');
                } finally {
                    setFetchingSuggestion(false);
                }
            } else {
                setSuggestedFee(0);
                setSuggestionStatus('');
            }
        };
        fetchSuggestion();
    }, [distance, weight, confirmingOrder]);

    const handleConfirmFinal = async () => {
        if (!confirmingOrder) return;
        setUpdating(true);
        try {
            // Chỉ gọi cập nhật phí ship: backend đã tự chuyển PENDING → CONFIRMED trong updateManualShippingFee
            await updateShippingFee(confirmingOrder.id, Number(newShippingFee));
            toast.success("Đã xác nhận đơn hàng & Cập nhật phí ship!");
            setConfirmingOrder(null);
            refresh();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi hệ thống");
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateStatus = (id: string, newStatus: string) => {
        setStatusConfirm({ id, status: newStatus });
    };

    const handleConfirmStatusChange = async () => {
        if (!statusConfirm) return;

        setUpdating(true);
        try {
            const response = await updateOrderStatus(statusConfirm.id, statusConfirm.status);
            if (response.success) {
                toast.success("Cập nhật trạng thái thành công");
                setStatusConfirm(null);
                refresh();
            } else {
                toast.error(response.message || "Cập nhật thất bại");
            }
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Lỗi khi cập nhật trạng thái");
        } finally {
            setUpdating(false);
        }
    };

    const handleCancelOrder = (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (order) {
            const payment = order.payments?.[0];
            const isOnlinePayment = order.orderType === 'ONLINE' && payment && payment.paymentMethod !== 'CASH';
            if (isOnlinePayment && ['PAID', 'PROCESSING'].includes(order.status)) {
                setRefundOrder(order);
                setRefundNote('');
                return;
            }
        }
        setCancellingOrderId(orderId);
        setCancelReason('');
    };

    const handleConfirmCancel = async () => {
        if (!cancellingOrderId || !cancelReason.trim()) return;
        setIsCancelling(true);
        try {
            const response = await cancelOrderByAdmin(cancellingOrderId, cancelReason);
            if (response.success) {
                toast.success("Đã hủy đơn hàng thành công");
                setCancellingOrderId(null);
                setCancelReason('');
                refresh();
            } else {
                toast.error(response.message || "Hủy đơn thất bại");
            }
        } catch (error) {
            toast.error("Lỗi hệ thống khi hủy đơn");
        } finally {
            setIsCancelling(false);
        }
    };

    // Return order states
    const [returningOrderId, setReturningOrderId] = useState<string | null>(null);
    const [returnReason, setReturnReason] = useState('');
    const [isReturning, setIsReturning] = useState(false);

    const quickReturnReasons = [
        "Khách không nhận hàng",
        "Khách đổi ý không mua nữa",
        "Không liên lạc được khách",
        "Sản phẩm bị hư hỏng trong quá trình vận chuyển",
        "Địa chỉ không chính xác"
    ];

    const handleReturnOrder = (orderId: string) => {
        setReturningOrderId(orderId);
        setReturnReason('');
    };

    useEffect(() => {
        const loadRefundBankInfo = async () => {
            if (!refundOrder?.id) {
                setRefundBankInfo(null);
                setRefundRequestId(null);
                return;
            }
            try {
                const res = await getBankInformationByOrderId(refundOrder.id);
                if (res.success && res.data) {
                    setRefundBankInfo({
                        accountNumber: res.data.accountNumber,
                        accountHolderName: res.data.accountHolderName,
                        bankCode: res.data.bankCode,
                        bankName: res.data.bankName,
                    });
                } else {
                    setRefundBankInfo(null);
                }
            } catch (error) {
                console.error("Error loading refund bank info:", error);
                setRefundBankInfo(null);
            }

            // Use latestRefundId from order list response if available
            setRefundRequestId(refundOrder.latestRefundId ?? null);
        };
        loadRefundBankInfo();
    }, [refundOrder?.id]);

    useEffect(() => {
        if (!refundOrder?.id) {
            setRefundHistory([]);
            return;
        }
        setLoadingRefundHistory(true);
        getOrderRefundRequests(refundOrder.id)
            .then((res) => {
                if (res.success && Array.isArray(res.data)) setRefundHistory(res.data);
            })
            .catch(() => setRefundHistory([]))
            .finally(() => setLoadingRefundHistory(false));
    }, [refundOrder?.id]);

    const handleConfirmReturn = async () => {
        if (!returningOrderId || !returnReason.trim()) return;
        setIsReturning(true);
        try {
            const response = await returnOrder(returningOrderId, returnReason);
            if (response.success) {
                toast.success("Đã hoàn đơn hàng thành công");
                setReturningOrderId(null);
                setReturnReason('');
                refresh();
            } else {
                toast.error(response.message || "Hoàn đơn thất bại");
            }
        } catch (error) {
            toast.error("Lỗi hệ thống khi hoàn đơn");
        } finally {
            setIsReturning(false);
        }
    };

    const handlePrintOrder = async (orderId: string, orderCode: string) => {
        try {
            toast.info("Đang tạo vận đơn...");
            const blob = await downloadOrderInvoice(orderId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${orderCode}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Đã tải vận đơn thành công!");
        } catch (error) {
            console.error("Lỗi khi tải vận đơn:", error);
            toast.error("Không thể tải vận đơn. Vui lòng thử lại sau.");
        }
    };

    const columns = getOrderColumns(handleQuickConfirm, handleUpdateStatus, handleCancelOrder, handleReturnOrder, handlePrintOrder);
    const localeText = useDataGridLocale();

    const handleTabChange = (_: any, newValue: string) => {
        setStatus(newValue);
        setPage(0);
    };

    // Auto-refresh on global event (triggered by WebSocket notifications)
    useEffect(() => {
        const handleRefresh = () => {
            console.log("🔔 Global refresh event received: Updating Order List...");
            refresh();
        };
        window.addEventListener('REFRESH_ADMIN_ORDERS', handleRefresh);
        return () => window.removeEventListener('REFRESH_ADMIN_ORDERS', handleRefresh);
    }, [refresh]);

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
                        fontSize: '0.875rem',
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
                                {opt.value === 'PENDING' && pendingCount > 0 && (
                                    <Badge
                                        badgeContent={pendingCount}
                                        color="error"
                                        sx={{
                                            ml: 1.5,
                                            '& .MuiBadge-badge': {
                                                fontSize: '0.625rem',
                                                height: 18,
                                                minWidth: 18,
                                                position: 'static',
                                                transform: 'none'
                                            }
                                        }}
                                    />
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
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1C252E', fontSize: '1.125rem' }}>
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
                                <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.125rem' }} />
                            </InputAdornment>
                        ),
                    }}
                />
            </Stack>

            <div style={{ ...dataGridContainerStyles, padding: '0 24px 8px' }}>
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
                    sortingMode="server"
                    sortModel={[{ field: sortKey, sort: sortDirection.toLowerCase() as 'asc' | 'desc' }]}
                    onSortModelChange={(model) => {
                        if (model.length > 0) {
                            setSortKey(model[0].field);
                            setSortDirection(model[0].sort?.toUpperCase() as 'ASC' | 'DESC');
                        }
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

            {/* Quick Confirm Shipping Fee Dialog - Synchronized with Detail Page */}
            <Dialog
                open={!!confirmingOrder}
                onClose={() => setConfirmingOrder(null)}
                PaperProps={{ sx: { borderRadius: '24px', p: 0, maxWidth: 600, width: '100%' } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 1 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#00AB55', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <Box component="span" sx={{ fontSize: '0.875rem', fontWeight: 900 }}>i</Box>
                        </Box>
                        <Typography sx={{ fontWeight: 900, fontSize: '1.125rem', color: '#1C252E' }}>Xác nhận Chi tiết Vận chuyển</Typography>
                    </Stack>
                    <IconButton onClick={() => setConfirmingOrder(null)} size="small" sx={{ bgcolor: '#F4F6F8' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ px: 4, py: 2 }}>
                    {/* Customer Info Section */}
                    {confirmingOrder && (
                        <Stack spacing={1.5} sx={{ mb: 3, mt: 1 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <PersonOutlineIcon sx={{ color: '#00AB55', fontSize: '1.25rem' }} />
                                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#919EAB', textTransform: 'uppercase' }}>
                                    KHÁCH HÀNG: <Box component="span" sx={{ color: '#1C252E', fontWeight: 900 }}>{(confirmingOrder.user?.fullName || confirmingOrder.shippingName).toUpperCase()}</Box>
                                </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                <LocationOnOutlinedIcon sx={{ color: '#00AB55', fontSize: '1.25rem', mt: 0.2 }} />
                                <Typography sx={{ fontSize: '0.8438rem', fontWeight: 700, color: '#1C252E', lineHeight: 1.4 }}>
                                    Địa chỉ hiện tại: {shopAddress || '— Chưa cấu hình (vào Cài đặt)'}
                                </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                <LocationOnOutlinedIcon sx={{ color: '#FF5630', fontSize: '1.25rem', mt: 0.2 }} />
                                <Typography sx={{ fontSize: '0.8438rem', fontWeight: 700, color: '#1C252E', lineHeight: 1.4 }}>
                                    Giao đến: {confirmingOrder.shippingAddress}
                                </Typography>
                            </Stack>
                        </Stack>
                    )}

                    <Box sx={{ p: 2.5, bgcolor: '#F4F6F8', borderRadius: '16px', mb: 3, border: '1px solid #E5E8EB' }}>
                        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                            <TextField
                                fullWidth
                                label="Khoảng cách (km)"
                                type="number"
                                variant="standard"
                                value={distance}
                                onChange={(e) => setDistance(Number(e.target.value))}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end"><Typography sx={{ fontWeight: 800, color: '#919EAB', fontSize: '0.75rem' }}>km</Typography></InputAdornment>,
                                    sx: { fontSize: '1rem', fontWeight: 900 }
                                }}
                                sx={{ '& label': { fontSize: '0.6875rem', fontWeight: 800, color: '#919EAB' } }}
                            />
                            <TextField
                                fullWidth
                                label="Trọng lượng (kg)"
                                type="number"
                                variant="standard"
                                value={weight}
                                onChange={(e) => setWeight(Number(e.target.value))}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end"><Typography sx={{ fontWeight: 800, color: '#919EAB', fontSize: '0.75rem' }}>kg</Typography></InputAdornment>,
                                    sx: { fontSize: '1rem', fontWeight: 900 }
                                }}
                                sx={{ '& label': { fontSize: '0.6875rem', fontWeight: 800, color: '#919EAB' } }}
                            />
                        </Stack>

                        <Box sx={{
                            p: 2,
                            borderRadius: '16px',
                            bgcolor: '#F0FDF4',
                            border: '1px solid #BBF7D0',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}>
                            <Typography sx={{ color: '#16A34A', fontWeight: 900, fontSize: '0.6875rem', mb: 1, textTransform: 'uppercase', letterSpacing: '0.8px' }}>CHI TIẾT ĐỀ XUẤT HỆ THỐNG</Typography>
                            {fetchingSuggestion ? (
                                <CircularProgress size={20} sx={{ my: 1, color: '#16A34A' }} />
                            ) : suggestionStatus === 'FREE_SHIP' ? (
                                <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#16A34A', mb: 1 }}>MIỄN PHÍ VẬN CHUYỂN</Typography>
                            ) : suggestionStatus === 'OUT_OF_RANGE' ? (
                                <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#FF5630', mb: 1 }}>QUÁ XA</Typography>
                            ) : (
                                <Typography sx={{ fontWeight: 900, fontSize: '1.5rem', color: '#15803D', mb: 1 }}>
                                    {suggestedFee.toLocaleString('vi-VN')}₫
                                </Typography>
                            )}

                            <Stack direction="row" spacing={1}>
                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => setNewShippingFee(suggestedFee.toString())}
                                    sx={{
                                        borderRadius: '10px',
                                        px: 2,
                                        fontWeight: 800,
                                        bgcolor: '#16A34A',
                                        color: 'white',
                                        fontSize: '0.6875rem',
                                        '&:hover': { bgcolor: '#15803D' }
                                    }}
                                >
                                    Áp dụng giá này
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => setNewShippingFee('0')}
                                    sx={{
                                        borderRadius: '10px',
                                        px: 2,
                                        fontWeight: 800,
                                        color: '#FF5630',
                                        fontSize: '0.6875rem',
                                        border: '1px solid #FF5630',
                                        '&:hover': { bgcolor: 'rgba(255, 86, 48, 0.05)' }
                                    }}
                                >
                                    Freeship (0đ)
                                </Button>
                            </Stack>
                        </Box>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <TextField
                            fullWidth
                            label="PHÍ SHIP CHỐT CUỐI CÙNG"
                            type="number"
                            value={newShippingFee}
                            onChange={(e) => setNewShippingFee(e.target.value)}
                            InputProps={{
                                endAdornment: <InputAdornment position="end"><Typography sx={{ fontWeight: 900, fontSize: '1rem', color: '#16A34A' }}>₫</Typography></InputAdornment>,
                                sx: {
                                    borderRadius: '16px',
                                    '& input': { fontWeight: 900, fontSize: '1.375rem', textAlign: 'center', color: '#16A34A' }
                                }
                            }}
                            sx={{ '& label': { fontWeight: 800, color: '#919EAB', fontSize: '0.6875rem' } }}
                        />
                    </Box>

                    <Box sx={{ p: 2, borderRadius: '16px', bgcolor: '#F8FAFC', border: '1px solid #F1F5F9', textAlign: 'center', mb: 1 }}>
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={4}>
                            <Box>
                                <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, color: '#919EAB', textTransform: 'uppercase' }}>TỔNG CŨ</Typography>
                                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#919EAB', textDecoration: 'line-through' }}>
                                    {confirmingOrder && confirmingOrder.finalAmount.toLocaleString('vi-VN')}đ
                                </Typography>
                            </Box>

                            <Box sx={{ p: 0.8, borderRadius: '50%', bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex' }}>
                                <ArrowForwardIcon sx={{ color: '#00AB55', fontSize: '1.125rem' }} />
                            </Box>

                            <Box>
                                <Typography sx={{ fontSize: '0.625rem', fontWeight: 800, color: '#00AB55', textTransform: 'uppercase' }}>HÓA ĐƠN MỚI</Typography>
                                <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, color: '#1C252E' }}>
                                    {confirmingOrder && (confirmingOrder.subtotal + Number(newShippingFee) - confirmingOrder.discountAmount).toLocaleString('vi-VN')}₫
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>

                    {/* NEW: Detailed Payment Summary Section */}
                    {confirmingOrder && (
                        <Box sx={{ p: 3, borderRadius: '24px', border: '1px solid #F1F5F9', bgcolor: 'white', mb: 1 }}>
                            <Typography sx={{ fontWeight: 900, fontSize: '1rem', color: '#1C252E', mb: 3 }}>Tổng kết thanh toán</Typography>

                            <Stack spacing={2}>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography sx={{ fontWeight: 700, color: '#919EAB', fontSize: '0.75rem', textTransform: 'uppercase' }}>TẠM TÍNH</Typography>
                                    <Typography sx={{ fontWeight: 900, color: '#1C252E', fontSize: '0.875rem' }}>{confirmingOrder.subtotal.toLocaleString('vi-VN')}₫</Typography>
                                </Stack>

                                <Stack direction="row" justifyContent="space-between">
                                    <Typography sx={{ fontWeight: 700, color: '#919EAB', fontSize: '0.75rem', textTransform: 'uppercase' }}>PHÍ VẬN CHUYỂN</Typography>
                                    <Typography sx={{ fontWeight: 900, color: '#00A76F', fontSize: '0.875rem' }}>+{Number(newShippingFee).toLocaleString('vi-VN')}₫</Typography>
                                </Stack>

                                {confirmingOrder.discountAmount > 0 && (
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography sx={{ fontWeight: 700, color: '#FF5630', fontSize: '0.75rem', textTransform: 'uppercase' }}>KHUYẾN MÃI</Typography>
                                        <Typography sx={{ fontWeight: 900, color: '#FF5630', fontSize: '0.875rem' }}>-{confirmingOrder.discountAmount.toLocaleString('vi-VN')}₫</Typography>
                                    </Stack>
                                )}

                                <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography sx={{ fontWeight: 900, color: '#1C252E', fontSize: '1rem', textTransform: 'uppercase' }}>TỔNG CỘNG</Typography>
                                    <Typography sx={{ fontWeight: 900, color: '#006C9C', fontSize: '1.75rem', letterSpacing: '-1px' }}>
                                        {(confirmingOrder.subtotal + Number(newShippingFee) - confirmingOrder.discountAmount).toLocaleString('vi-VN')}₫
                                    </Typography>
                                </Stack>

                                <Box sx={{ mt: 2, p: 2, borderRadius: '16px', bgcolor: '#F8FAFC', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'white', display: 'flex' }}>
                                        <CreditCardIcon sx={{ color: '#FFA48D', fontSize: '1.25rem' }} />
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontSize: '0.625rem', fontWeight: 800, color: '#919EAB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>HÌNH THỨC</Typography>
                                        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 900, color: '#1C252E' }}>
                                            {confirmingOrder.payments?.[0]?.paymentMethod === 'CASH' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản / Ví điện tử'}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Stack>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1, gap: 2 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => setConfirmingOrder(null)}
                        sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            color: '#637381',
                            borderColor: '#E5E8EB',
                            fontWeight: 800,
                            bgcolor: '#F9FAFB',
                            '&:hover': { bgcolor: '#F4F6F8', borderColor: '#C4CDD5' }
                        }}
                    >
                        CHỈNH SỬA THÊM
                    </Button>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleConfirmFinal}
                        disabled={updating}
                        sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            fontWeight: 800,
                            bgcolor: '#00AB55',
                            boxShadow: '0 8px 16px rgba(0, 171, 85, 0.24)',
                            '&:hover': { bgcolor: '#007B55', boxShadow: '0 12px 20px rgba(0, 171, 85, 0.32)' },
                            textTransform: 'none',
                            fontSize: '0.6875rem'
                        }}
                    >
                        {updating ? "ĐANG XỬ LÝ..." : "XÁC NHẬN & GỬI MAIL"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Cancel Order Dialog */}
            <Dialog
                open={!!cancellingOrderId}
                onClose={() => { setCancellingOrderId(null); setCancelReason(''); }}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '24px', boxShadow: '0 24px 48px rgba(0, 0, 0, 0.16)' }
                }}
            >
                <DialogTitle sx={{
                    p: 3,
                    pb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #F4F6F8'
                }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            bgcolor: 'rgba(255, 86, 48, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <CloseIcon sx={{ color: '#FF5630', fontSize: 24 }} />
                        </Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9375rem', color: '#1C252E' }}>
                            Hủy đơn hàng
                        </Typography>
                    </Stack>
                    <IconButton onClick={() => { setCancellingOrderId(null); setCancelReason(''); }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    <Typography sx={{ fontSize: '0.6875rem', color: '#637381', mb: 3 }}>
                        Chọn lý do hủy đơn hàng:
                    </Typography>
                    <Stack spacing={1.5}>
                        {quickCancelReasons.map((reason, index) => (
                            <Box
                                key={index}
                                onClick={() => setCancelReason(reason)}
                                sx={{
                                    p: 2,
                                    borderRadius: '12px',
                                    border: '2px solid',
                                    borderColor: cancelReason === reason ? '#FF5630' : '#F4F6F8',
                                    bgcolor: cancelReason === reason ? 'rgba(255, 86, 48, 0.08)' : 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': { borderColor: '#FF5630', bgcolor: 'rgba(255, 86, 48, 0.04)' }
                                }}
                            >
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Box sx={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: '50%',
                                        border: '2px solid',
                                        borderColor: cancelReason === reason ? '#FF5630' : '#C4CDD5',
                                        bgcolor: cancelReason === reason ? '#FF5630' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {cancelReason === reason && (
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'white' }} />
                                        )}
                                    </Box>
                                    <Typography sx={{
                                        fontWeight: 600,
                                        fontSize: '0.6875rem',
                                        color: cancelReason === reason ? '#FF5630' : '#1C252E'
                                    }}>
                                        {reason}
                                    </Typography>
                                </Stack>
                            </Box>
                        ))}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 2, gap: 2 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => { setCancellingOrderId(null); setCancelReason(''); }}
                        sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            color: '#637381',
                            borderColor: '#E5E8EB',
                            fontWeight: 700,
                            fontSize: '0.6562rem'
                        }}
                    >
                        Đóng
                    </Button>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleConfirmCancel}
                        disabled={isCancelling || !cancelReason.trim()}
                        sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '0.6562rem',
                            bgcolor: '#FF5630',
                            '&:hover': { bgcolor: '#B71D18' },
                            '&:disabled': { bgcolor: '#FFD8D0', color: '#FF5630' }
                        }}
                    >
                        {isCancelling ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Xác nhận hủy'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Refund Request Dialog for ONLINE + thanh toán online khi đã PAID / PROCESSING or APPROVED */}
            <Dialog
                open={!!refundOrder}
                onClose={() => { setRefundOrder(null); setRefundNote(''); setRefundTxId(''); }}
                PaperProps={{ sx: { borderRadius: '24px', p: 0, maxWidth: 520, width: '100%' } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 1 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: refundOrder?.latestRefundStatus === 'APPROVED' ? '#00AB55' : '#FFAB00', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            {refundOrder?.latestRefundStatus === 'APPROVED' ? <CheckCircleOutlineIcon sx={{ fontSize: '1.6rem' }} /> : <ReplayIcon sx={{ fontSize: '1.6rem' }} />}
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1C252E' }}>
                                {refundOrder?.latestRefundStatus === 'APPROVED' ? 'Xác nhận Chuyển tiền' : 'Hủy đơn / Yêu cầu hoàn tiền'}
                            </Typography>
                            {refundOrder && (
                                <Typography sx={{ fontSize: '0.8rem', color: '#919EAB', mt: 0.3 }}>
                                    Mã đơn: <strong>{refundOrder.orderCode}</strong>
                                </Typography>
                            )}
                        </Box>
                    </Stack>
                    <IconButton onClick={() => { setRefundOrder(null); setRefundNote(''); setRefundTxId(''); }} size="small" sx={{ bgcolor: '#F4F6F8' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ px: 4, py: 2 }}>
                    <Typography sx={{ mb: 2, fontSize: '0.9rem', color: '#637381' }}>
                        Đơn hàng đã được thanh toán online. Vui lòng ghi rõ lý do hủy/hoàn tiền để hệ thống ghi nhận và thông báo cho khách hàng.
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 1, color: '#637381' }}>
                            Lịch sử yêu cầu hoàn tiền
                        </Typography>
                        {loadingRefundHistory ? (
                            <Typography sx={{ fontSize: '0.8rem', color: '#919EAB' }}>Đang tải...</Typography>
                        ) : refundHistory.length === 0 ? (
                            <Typography sx={{ fontSize: '0.8rem', color: '#919EAB', fontStyle: 'italic' }}>Chưa có yêu cầu nào.</Typography>
                        ) : (
                            <Stack spacing={1.5} sx={{ maxHeight: 220, overflow: 'auto' }}>
                                {refundHistory.map((r) => (
                                    <Box
                                        key={r.id}
                                        sx={{
                                            p: 1.5,
                                            borderRadius: '12px',
                                            border: '1px solid',
                                            borderColor: r.status === 'PENDING' ? '#FED7AA' : r.status === 'APPROVED' ? '#BBF7D0' : '#FECACA',
                                            bgcolor: r.status === 'PENDING' ? '#FFF7ED' : r.status === 'APPROVED' ? '#F0FDF4' : '#FEF2F2',
                                        }}
                                    >
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={0.5}>
                                            <Typography sx={{ fontSize: '0.75rem', color: '#637381' }}>
                                                {r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : '—'}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: 700,
                                                    px: 1,
                                                    py: 0.25,
                                                    borderRadius: '8px',
                                                    bgcolor: r.status === 'PENDING' ? '#FEF3C7' : r.status === 'APPROVED' ? '#D1FAE5' : '#FEE2E2',
                                                    color: r.status === 'PENDING' ? '#92400E' : r.status === 'APPROVED' ? '#065F46' : '#991B1B',
                                                }}
                                            >
                                                {r.status === 'PENDING' ? 'Chờ xử lý' : r.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}
                                            </Typography>
                                        </Stack>
                                        {r.customerReason && (
                                            <Typography sx={{ fontSize: '0.8rem', color: '#1C252E', mt: 1, whiteSpace: 'pre-wrap' }}>
                                                {r.customerReason}
                                            </Typography>
                                        )}
                                        {r.adminDecisionNote && (
                                            <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#637381', textTransform: 'uppercase' }}>
                                                    Phản hồi admin{r.processedBy ? ` (${r.processedBy})` : ''}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.8rem', color: '#1C252E', mt: 0.5 }}>
                                                    {r.adminDecisionNote}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </Box>

                    {refundOrder?.cancelReason && (
                        <Box sx={{ mb: 2 }}>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 1, color: '#637381' }}>
                                Yêu cầu từ khách hàng
                            </Typography>
                            <Box
                                sx={{
                                    p: 1.5,
                                    bgcolor: '#FFF7ED',
                                    border: '1px solid #FED7AA',
                                    borderRadius: '12px',
                                }}
                            >
                                <Typography sx={{ fontSize: '0.85rem', color: '#9A3412', whiteSpace: 'pre-wrap' }}>
                                    {refundOrder.cancelReason}
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {refundBankInfo && (
                        <Box sx={{ mb: 2 }}>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 1, color: '#637381' }}>
                                Thông tin ngân hàng khách đã thanh toán
                            </Typography>
                            <Box
                                sx={{
                                    p: 1.5,
                                    bgcolor: '#EFF6FF',
                                    border: '1px solid #BFDBFE',
                                    borderRadius: '12px',
                                }}
                            >
                                <Typography sx={{ fontSize: '0.85rem', mb: 0.5 }}>
                                    Ngân hàng: <strong>{refundBankInfo.bankName}</strong> ({refundBankInfo.bankCode})
                                </Typography>
                                <Typography sx={{ fontSize: '0.85rem', mb: 0.5 }}>
                                    Số tài khoản: <strong>{refundBankInfo.accountNumber}</strong>
                                </Typography>
                                <Typography sx={{ fontSize: '0.85rem' }}>
                                    Chủ TK: <strong>{refundBankInfo.accountHolderName}</strong>
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {refundOrder?.latestRefundStatus === 'APPROVED' && (
                        <Box sx={{ mb: 2 }}>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 1, color: '#637381' }}>
                                Mã giao dịch hoàn tiền (nếu có)
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                value={refundTxId}
                                onChange={(e) => setRefundTxId(e.target.value)}
                                placeholder="Nhập mã giao dịch chuyển khoản..."
                                sx={{
                                    '& .MuiOutlinedInput-root': { borderRadius: '12px' }
                                }}
                            />
                        </Box>
                    )}

                    <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 1, color: '#637381' }}>
                            Ghi chú nội bộ cho việc hoàn tiền
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            value={refundNote}
                            onChange={(e) => setRefundNote(e.target.value)}
                            placeholder="Ví dụ: Hủy theo yêu cầu khách, đã xác nhận sẽ hoàn tiền trong 3 ngày làm việc..."
                            sx={{
                                '& .MuiOutlinedInput-root': { borderRadius: '16px', fontSize: '0.85rem' }
                            }}
                        />
                        <Typography sx={{ mt: 0.5, fontSize: '0.75rem', color: '#919EAB', textAlign: 'right' }}>
                            {refundNote.length}/500
                        </Typography>
                    </Box>

                    {refundOrder && !refundOrder.guestEmail?.trim() && !refundOrder.user?.email?.trim() && (
                        <Box sx={{ mb: 2, p: 1.5, borderRadius: '12px', bgcolor: '#FFF4E5', border: '1px solid #FFAB00' }}>
                            <Typography sx={{ fontSize: '0.85rem', color: '#B76E00', fontWeight: 600 }}>
                                ⚠ Đơn này không có email khách hàng. Thông báo qua email sẽ <strong>không được gửi</strong>. Cập nhật email ở trang chi tiết đơn nếu cần.
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ mb: 1.5, p: 1.5, borderRadius: '12px', bgcolor: '#F4F6F8' }}>
                        <Typography sx={{ fontSize: '0.8rem', color: '#637381' }}>
                            {refundOrder?.latestRefundStatus === 'APPROVED'
                                ? 'Xác nhận rằng nhân viên đã thực hiện chuyển khoản số tiền hoàn lại cho khách hàng thành công. Trạng thái yêu cầu sẽ chuyển thành ĐÃ HOÀN TIỀN.'
                                : 'Thao tác này sẽ cập nhật đơn hàng sang trạng thái ĐÃ HỦY. Nhân viên cần thực hiện hoàn tiền cho khách theo đúng quy trình (dùng thông tin ngân hàng đã lưu ở chi tiết đơn).'}
                        </Typography>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 1, gap: 2 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => { setRefundOrder(null); setRefundNote(''); setRefundTxId(''); }}
                        sx={{ py: 1.5, borderRadius: '12px', color: '#637381', borderColor: '#E5E8EB', fontWeight: 800 }}
                    >
                        Đóng
                    </Button>
                    {refundOrder?.latestRefundStatus === 'PENDING' && (
                        <Button
                            fullWidth
                            variant="outlined"
                            color="error"
                            onClick={async () => {
                                if (!refundOrder || !refundRequestId) {
                                    toast.error("Không tìm thấy yêu cầu hoàn tiền để hủy duyệt.");
                                    return;
                                }
                                setIsCancelling(true);
                                try {
                                    const res = await handleOrderRefundRequest(refundOrder.id, refundRequestId, {
                                        approved: false,
                                        adminNote: refundNote.trim() || undefined,
                                    });
                                    if (res.success) {
                                        toast.success("Đã hủy duyệt yêu cầu hoàn tiền.");
                                        setRefundOrder(null);
                                        setRefundNote('');
                                        refresh();
                                    } else {
                                        toast.error(res.message || "Không thể hủy duyệt yêu cầu hoàn tiền.");
                                    }
                                } catch (error: any) {
                                    toast.error(error.response?.data?.message || "Lỗi hệ thống khi hủy duyệt.");
                                } finally {
                                    setIsCancelling(false);
                                }
                            }}
                            disabled={isCancelling}
                            sx={{ py: 1.5, borderRadius: '12px', fontWeight: 800 }}
                        >
                            Hủy duyệt
                        </Button>
                    )}
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={async () => {
                            if (!refundOrder || !refundRequestId) {
                                toast.error("Không tìm thấy yêu cầu hoàn tiền để xử lý.");
                                return;
                            }
                            setIsCancelling(true);
                            try {
                                const response = await handleOrderRefundRequest(refundOrder.id, refundRequestId, {
                                    approved: true,
                                    adminNote: refundNote.trim() || undefined,
                                    refundTransactionId: refundOrder.latestRefundStatus === 'APPROVED' ? refundTxId : undefined,
                                });
                                if (response.success) {
                                    const msg = refundOrder.latestRefundStatus === 'APPROVED' ? "Đã xác nhận chuyển khoản hoàn tiền." : "Đã duyệt yêu cầu hoàn tiền cho đơn này.";
                                    toast.success(msg);
                                    setRefundOrder(null);
                                    setRefundNote('');
                                    setRefundTxId('');
                                    refresh();
                                } else {
                                    toast.error(response.message || "Không thể xử lý yêu cầu hoàn tiền.");
                                }
                            } catch (error: any) {
                                toast.error(error.response?.data?.message || "Lỗi hệ thống khi xử lý yêu cầu hoàn tiền.");
                            } finally {
                                setIsCancelling(false);
                            }
                        }}
                        disabled={isCancelling}
                        sx={{
                            py: 1.5, borderRadius: '12px', fontWeight: 800,
                            bgcolor: refundOrder?.latestRefundStatus === 'APPROVED' ? '#00AB55' : '#FFAB00',
                            boxShadow: `0 8px 16px ${refundOrder?.latestRefundStatus === 'APPROVED' ? 'rgba(0, 171, 85, 0.24)' : 'rgba(255, 171, 0, 0.24)'}`,
                            '&:hover': { bgcolor: refundOrder?.latestRefundStatus === 'APPROVED' ? '#007B55' : '#B76E00' },
                            '&:disabled': { bgcolor: '#E5E8EB' }
                        }}
                    >
                        {isCancelling ? 'Đang xử lý...' : (refundOrder?.latestRefundStatus === 'APPROVED' ? 'Xác nhận đã chuyển tiền' : 'Xác nhận hủy / hoàn tiền')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Return Order Dialog */}
            <Dialog
                open={!!returningOrderId}
                onClose={() => { setReturningOrderId(null); setReturnReason(''); }}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '24px', boxShadow: '0 24px 48px rgba(0, 0, 0, 0.16)' }
                }}
            >
                <DialogTitle sx={{
                    p: 3,
                    pb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #F4F6F8'
                }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            bgcolor: 'rgba(255, 171, 0, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <ArrowForwardIcon sx={{ color: '#B76E00', fontSize: 24, transform: 'rotate(180deg)' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9375rem', color: '#1C252E' }}>
                            Hoàn đơn hàng
                        </Typography>
                    </Stack>
                    <IconButton onClick={() => { setReturningOrderId(null); setReturnReason(''); }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    <Typography sx={{ fontSize: '0.6875rem', color: '#637381', mb: 3 }}>
                        Chọn lý do hoàn đơn hàng:
                    </Typography>
                    <Stack spacing={1.5}>
                        {quickReturnReasons.map((reason, index) => (
                            <Box
                                key={index}
                                onClick={() => setReturnReason(reason)}
                                sx={{
                                    p: 2,
                                    borderRadius: '12px',
                                    border: '2px solid',
                                    borderColor: returnReason === reason ? '#B76E00' : '#F4F6F8',
                                    bgcolor: returnReason === reason ? 'rgba(255, 171, 0, 0.08)' : 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': { borderColor: '#B76E00', bgcolor: 'rgba(255, 171, 0, 0.04)' }
                                }}
                            >
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Box sx={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: '50%',
                                        border: '2px solid',
                                        borderColor: returnReason === reason ? '#B76E00' : '#C4CDD5',
                                        bgcolor: returnReason === reason ? '#B76E00' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {returnReason === reason && (
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'white' }} />
                                        )}
                                    </Box>
                                    <Typography sx={{
                                        fontWeight: 600,
                                        fontSize: '0.6875rem',
                                        color: returnReason === reason ? '#B76E00' : '#1C252E'
                                    }}>
                                        {reason}
                                    </Typography>
                                </Stack>
                            </Box>
                        ))}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 2, gap: 2 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => { setReturningOrderId(null); setReturnReason(''); }}
                        sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            color: '#637381',
                            borderColor: '#E5E8EB',
                            fontWeight: 700,
                            fontSize: '0.6562rem'
                        }}
                    >
                        Đóng
                    </Button>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleConfirmReturn}
                        disabled={isReturning || !returnReason.trim()}
                        sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '0.6562rem',
                            bgcolor: '#B76E00',
                            '&:hover': { bgcolor: '#8A5200' },
                            '&:disabled': { bgcolor: '#FFE8CC', color: '#B76E00' }
                        }}
                    >
                        {isReturning ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Xác nhận hoàn'}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Status Confirm Dialog */}
            <StatusConfirmDialog
                open={!!statusConfirm}
                onClose={() => setStatusConfirm(null)}
                onConfirm={handleConfirmStatusChange}
                newStatus={statusConfirm?.status || ''}
                isUpdating={updating}
            />
        </Card>
    )
}
