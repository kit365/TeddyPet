import { useState, useEffect } from "react";
// import { showConfirmDialog } from "../../../utils/confirmation";
import { useParams, useNavigate } from "react-router-dom";
import { StatusConfirmDialog } from "../../components/StatusConfirmDialog";
import {
    Card,
    Typography,
    Stack,
    Divider,
    Button,
    Box,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    InputAdornment,
    Badge,
    Chip,
    Avatar,
    FormControl,
    Select,
    MenuItem
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReplayIcon from '@mui/icons-material/Replay';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import PaymentsIcon from '@mui/icons-material/Payments';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // Added
import IconButton from '@mui/material/IconButton';
import { toast } from "react-toastify";

import { prefixAdmin } from "../../constants/routes";
import { getOrderById, updateShippingFee, updateOrderStatus, updateOrderPaymentMethod, cancelOrderByAdmin, returnOrder, handleReturnRequest, downloadOrderInvoice, confirmPaymentByAdmin, updateOrderContactInfo, handleOrderRefundRequest, getOrderRefundRequests } from "../../api/order.api";
import { getShippingFeeSuggestion, getShippingRules } from "../../api/shipping.api";
import { getAllSettings } from "../../api/setting.api";
import { getBankInformationByOrderId } from "../../../api/bank.api";
import { APP_SETTING_KEYS } from "../../constants/settings";
import { OrderResponse, OrderRefundResponse } from "../../../types/order.type";
import { ShippingRule } from "../../../types/shipping.type";
import { COLORS } from "../product/configs/constants";
import { getOrderStatus } from "../../../constants/status";

const ORDER_DETAIL_FONT = '"Be Vietnam Pro", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export const OrderDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Shipping Fee Dialog State
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [newShippingFee, setNewShippingFee] = useState<string>('');
    const [distance, setDistance] = useState<number>(5);
    const [weight, setWeight] = useState<number>(1);

    const [suggestedFee, setSuggestedFee] = useState<number>(0);
    const [breakdown, setBreakdown] = useState<any>(null);
    const [suggestionStatus, setSuggestionStatus] = useState<string>('');
    const [fetchingSuggestion, setFetchingSuggestion] = useState(false);

    // Danh sách quy tắc phí vận chuyển; chọn 1 bản ghi thì mới nổi bật "Áp dụng giá này"
    const [shippingRules, setShippingRules] = useState<ShippingRule[]>([]);
    const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
    // Chỉ hiển thị ô "Miễn phí vận chuyển" khi user bấm "Đặt 0đ (Freeship)"
    const [showFreeshipOnly, setShowFreeshipOnly] = useState(false);

    // Địa chỉ cửa hàng (hiển thị trong dialog xác nhận vận chuyển)
    const [shopAddress, setShopAddress] = useState<string>('');

    // Địa chỉ nhận hàng: 'delivery' = giao hàng (hiện ô nhập), 'counter' = mua tại quầy
    const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'counter'>('delivery');
    const [editableShippingAddress, setEditableShippingAddress] = useState('');
    const [editableNote, setEditableNote] = useState('');
    const [editableCustomerEmail, setEditableCustomerEmail] = useState('');
    const [editableCustomerName, setEditableCustomerName] = useState('');
    const [editableCustomerPhone, setEditableCustomerPhone] = useState('');

    // Status Confirmation Dialog State
    const [pendingStatus, setPendingStatus] = useState<string | null>(null);
    const [openConfirmPaymentDialog, setOpenConfirmPaymentDialog] = useState(false);

    // Cancel/Return Order Dialog State
    const [openCancelDialog, setOpenCancelDialog] = useState(false);
    const [openReturnDialog, setOpenReturnDialog] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [refundHistory, setRefundHistory] = useState<OrderRefundResponse[]>([]);
    const [loadingRefundHistory, setLoadingRefundHistory] = useState(false);

    // Handle Return Request State
    const [openHandleReturnDialog, setOpenHandleReturnDialog] = useState(false);
    const [returnApproved, setReturnApproved] = useState(true);
    const [adminReturnNote, setAdminReturnNote] = useState('');

    const [customerBankInfo, setCustomerBankInfo] = useState<{
        accountNumber: string;
        accountHolderName: string;
        bankCode: string;
        bankName?: string | null;
    } | null>(null);

    const quickRejectReasons = [
        "Sản phẩm không còn nguyên vẹn/đã qua sử dụng",
        "Quá thời hạn đổi trả quy định (7 ngày)",
        "Lý do trả hàng không hợp lệ/không đúng sự thật",
        "Thiếu hình ảnh/video bằng chứng xác thực",
        "Không đúng sản phẩm đã giao"
    ];

    const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);

    // Thu tiền mặt (đơn tại quầy - CASH): nhập số tiền đã thu và xác nhận
    const [openCashReceivedDialog, setOpenCashReceivedDialog] = useState(false);
    const [cashReceivedAmount, setCashReceivedAmount] = useState('');
    const [cashReceivedError, setCashReceivedError] = useState('');

    useEffect(() => {
        if (id) {
            fetchOrder(id);
            setShowFreeshipOnly(false);
            setSelectedRuleId(null);
        }
    }, [id]);

    useEffect(() => {
        if (!order) return;
        const isOffline = order.orderType === 'OFFLINE';
        const addr = (order.shippingAddress || '').trim();
        const isCounterByAddress = /mua\s*(tại\s*quầy|trực\s*tiếp\s*tại\s*quầy)/i.test(addr) || addr === '';
        const isCounter = isOffline || isCounterByAddress;
        setDeliveryMode(isCounter ? 'counter' : 'delivery');
        setEditableShippingAddress(isCounter ? 'mua tại quầy' : addr);
        setEditableNote(order.notes ?? '');
        setEditableCustomerEmail(isCounter ? '' : (order.guestEmail ?? order.user?.email ?? ''));
        setEditableCustomerName(order.shippingName ?? '');
        setEditableCustomerPhone(order.shippingPhone ?? '');
    }, [order?.id, order?.orderType, order?.shippingAddress, order?.notes, order?.guestEmail, order?.user?.email]);

    useEffect(() => {
        const loadCustomerBankInfo = async () => {
            if (!order?.id) {
                setCustomerBankInfo(null);
                return;
            }
            try {
                const response = await getBankInformationByOrderId(order.id);
                if (response.success && response.data) {
                    setCustomerBankInfo({
                        accountNumber: response.data.accountNumber,
                        accountHolderName: response.data.accountHolderName,
                        bankCode: response.data.bankCode,
                        bankName: response.data.bankName,
                    });
                } else {
                    setCustomerBankInfo(null);
                }
            } catch (error) {
                console.error("Error fetching customer bank info:", error);
                setCustomerBankInfo(null);
            }
        };

        loadCustomerBankInfo();
    }, [order?.id]);

    useEffect(() => {
        if (!openCancelDialog || !id) {
            setRefundHistory([]);
            return;
        }
        setLoadingRefundHistory(true);
        getOrderRefundRequests(id)
            .then((res) => {
                if (res.success && Array.isArray(res.data)) setRefundHistory(res.data);
            })
            .catch(() => setRefundHistory([]))
            .finally(() => setLoadingRefundHistory(false));
    }, [openCancelDialog, id]);

    useEffect(() => {
        const fetchSuggestion = async () => {
            if (distance > 0) {
                setFetchingSuggestion(true);
                try {
                    const response = await getShippingFeeSuggestion(distance, 0, order?.subtotal || 0, weight);
                    if (response.success && response.data) {
                        setSuggestedFee(response.data.amount || 0);
                        setSuggestionStatus(response.data.status);
                        setBreakdown({
                            feePerKm: response.data.feePerKm || 0,
                            overWeightFee: response.data.overWeightFee || 0,
                            baseWeight: response.data.baseWeight || 0
                        });
                    } else {
                        setSuggestedFee(0);
                        setSuggestionStatus('ERROR');
                        setBreakdown(null);
                    }
                } catch (error) {
                    console.error("Error fetching suggestion:", error);
                    setSuggestedFee(0);
                    setBreakdown(null);
                } finally {
                    setFetchingSuggestion(false);
                }
            }
        };
        fetchSuggestion();
    }, [distance, weight, order]);

    useEffect(() => {
        if (order?.status === 'PENDING') {
            getShippingRules().then((res) => {
                if (res.success && res.data) setShippingRules(res.data);
                else setShippingRules([]);
            }).catch(() => setShippingRules([]));
        }
    }, [order?.status]);

    /** Tính phí theo quy tắc với khoảng cách + trọng lượng hiện tại */
    const calcFeeByRule = (rule: ShippingRule): number => {
        const feePerKm = rule.feePerKm ?? 0;
        const baseWeight = rule.baseWeight ?? 1;
        const overWeightFee = rule.overWeightFee ?? 0;
        const minFee = rule.minFee ?? 0;
        let fee = distance * feePerKm;
        if (weight > baseWeight) fee += (weight - baseWeight) * overWeightFee;
        return Math.max(Math.round(fee), minFee);
    };

    const fetchOrder = async (orderId: string) => {
        setLoading(true);
        try {
            const response = await getOrderById(orderId);
            if (response.success && response.data) {
                setOrder(response.data);
                // Initialize shipping fee from order data
                setNewShippingFee(response.data.shippingFee.toString());
                if (response.data.distanceKm) {
                    setDistance(response.data.distanceKm);
                }
            } else {
                toast.error(response.message || "Không tìm thấy đơn hàng");
                navigate(`/${prefixAdmin}/order/list`);
            }
        } catch (error) {
            console.error("Error fetching order:", error);
            toast.error("Lỗi khi tải thông tin đơn hàng");
        } finally {
            setLoading(false);
        }
    };

    const isCounterOrder = (() => {
        if (!order) return false;
        if (order.orderType === 'OFFLINE') return true;
        const addr = (order.shippingAddress || '').trim();
        return /mua\s*(tại\s*quầy|trực\s*tiếp\s*tại\s*quầy)/i.test(addr) || addr === '';
    })();

    /**
     * Đơn tại quầy (OFFLINE) + thanh toán chuyển khoản + chưa thanh toán:
     * cần bấm "Xác nhận đã thanh toán" trước, sau đó mới hiện "Bắt đầu đóng gói".
     * Đơn ONLINE + chuyển khoản sẽ KHÔNG hiện nút này (chỉ dựa vào PayOS/webhook).
     */
    const needConfirmPaymentFirst = !!order
        && isCounterOrder
        && order.orderType === 'OFFLINE'
        && order.status === 'CONFIRMED'
        && order.payments?.[0]?.paymentMethod === 'BANK_TRANSFER'
        && order.payments?.[0]?.status !== 'COMPLETED';

    const handleConfirmPayment = async () => {
        if (!id) return;
        setUpdating(true);
        try {
            await confirmPaymentByAdmin(id);
            toast.success("Đã xác nhận thanh toán. Bạn có thể bắt đầu đóng gói.");
            setOpenConfirmPaymentDialog(false);
            fetchOrder(id);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Xác nhận thanh toán thất bại.");
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveContactInfo = async () => {
        if (!order || !id) return;
        setUpdating(true);
        try {
            await updateOrderContactInfo(id, {
                shippingAddress: editableShippingAddress,
                guestEmail: editableCustomerEmail
            });
            toast.success("Đã lưu thông tin liên hệ đơn hàng.");
            await fetchOrder(id);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể lưu thông tin liên hệ.");
        } finally {
            setUpdating(false);
        }
    };

    const getNextAction = (currentStatus: string) => {
        if (isCounterOrder) {
            if (currentStatus === 'PENDING') return { status: 'CONFIRMED', label: 'Chốt phí & Chuyển sang Chờ thanh toán', color: '#B76E00', icon: <PaymentsIcon /> };
            if (currentStatus === 'CONFIRMED') return { status: 'COMPLETED', label: 'Xác nhận đã thanh toán', color: '#118D57', icon: <CheckCircleOutlineIcon /> };
            return null;
        }
        switch (currentStatus) {
            case 'PAID': return { status: 'PROCESSING', label: 'Bắt đầu đóng gói', color: '#16A34A', icon: <LocalShippingIcon /> };
            case 'PROCESSING': return { status: 'DELIVERING', label: 'Bắt đầu giao hàng', color: '#1064ad', icon: <LocalShippingIcon /> };
            case 'DELIVERING': return { status: 'DELIVERED', label: 'Xác nhận Đã giao thành công', color: '#118D57', icon: <CheckCircleOutlineIcon /> };
            default: return null;
        }
    };

    const handleUpdateStatus = (newStatus: string) => {
        setPendingStatus(newStatus);
    };

    const handleConfirmStatusChange = async () => {
        if (!id || !pendingStatus) return;
        setUpdating(true);
        try {
            const response = await updateOrderStatus(id, pendingStatus);
            if (response.success) {
                toast.success("Cập nhật trạng thái thành công");
                fetchOrder(id);
                setPendingStatus(null);
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

    useEffect(() => {
        if (!openConfirmDialog) return;
        getAllSettings()
            .then((res) => {
                if (res.success && res.data) {
                    const addr = res.data.find(s => s.settingKey === APP_SETTING_KEYS.SHOP_ADDRESS)?.settingValue || '';
                    setShopAddress(addr);
                }
            })
            .catch(() => setShopAddress(''));
    }, [openConfirmDialog]);

    const handleOpenCashReceivedDialog = () => {
        if (!order) return;
        setCashReceivedAmount(String(order.finalAmount ?? 0));
        setCashReceivedError('');
        setOpenCashReceivedDialog(true);
    };

    const handleConfirmCashReceived = async () => {
        if (!id) return;
        const amount = Number(cashReceivedAmount.replace(/\s/g, '').replace(/\./g, '').replace(/,/g, ''));
        if (!Number.isFinite(amount) || amount <= 0) {
            setCashReceivedError('Vui lòng nhập số tiền đã thu hợp lệ.');
            return;
        }
        setCashReceivedError('');
        setUpdating(true);
        try {
            const response = await updateOrderStatus(id, 'COMPLETED');
            if (response.success) {
                toast.success('Đã xác nhận thu tiền mặt và hoàn tất đơn hàng.');
                setOpenCashReceivedDialog(false);
                fetchOrder(id);
            } else {
                toast.error(response.message || 'Xác nhận thất bại');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi khi xác nhận thanh toán');
        } finally {
            setUpdating(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!id || !cancelReason.trim() || cancelReason.length < 5) {
            toast.error("Vui lòng nhập lý do hủy đơn (ít nhất 5 ký tự)");
            return;
        }
        setUpdating(true);
        try {
            const response = await cancelOrderByAdmin(id, cancelReason.trim());
            if (response.success) {
                toast.success("Hủy đơn hàng thành công");
                setOpenCancelDialog(false);
                setCancelReason('');
                fetchOrder(id);
            } else {
                toast.error(response.message || "Hủy đơn thất bại");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi hủy đơn hàng");
        } finally {
            setUpdating(false);
        }
    };

    const handleRejectRefund = async () => {
        if (!order || !order.latestRefundId) {
            toast.error("Không tìm thấy yêu cầu hoàn tiền để hủy duyệt.");
            return;
        }
        setUpdating(true);
        try {
            const res = await handleOrderRefundRequest(order.id, order.latestRefundId, {
                approved: false,
                adminNote: cancelReason.trim() || undefined,
            });
            if (res.success) {
                toast.success("Đã hủy duyệt yêu cầu hoàn tiền.");
                setOpenCancelDialog(false);
                setCancelReason('');
                fetchOrder(order.id);
            } else {
                toast.error(res.message || "Không thể hủy duyệt yêu cầu hoàn tiền.");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi hệ thống khi hủy duyệt yêu cầu hoàn tiền.");
        } finally {
            setUpdating(false);
        }
    };

    const handleReturnOrder = async () => {
        if (!id || !cancelReason.trim() || cancelReason.length < 5) {
            toast.error("Vui lòng nhập lý do hoàn trả (ít nhất 5 ký tự)");
            return;
        }
        setUpdating(true);
        try {
            const response = await returnOrder(id, cancelReason.trim());
            if (response.success) {
                toast.success("Đánh dấu hoàn trả đơn hàng thành công");
                setOpenReturnDialog(false);
                setCancelReason('');
                fetchOrder(id);
            } else {
                toast.error(response.message || "Hoàn trả đơn thất bại");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi hoàn trả đơn hàng");
        } finally {
            setUpdating(false);
        }
    };


    const handleUpdateShippingFee = async () => {
        if (!order || !id) return;

        const fee = parseFloat(newShippingFee);
        if (isNaN(fee) || fee < 0) {
            toast.error("Phí vận chuyển không hợp lệ");
            return;
        }

        setUpdating(true);
        try {
            // Backend updateManualShippingFee đã tự chuyển PENDING → CONFIRMED khi cập nhật phí
            const response = await updateShippingFee(id, fee);
            if (response.success) {
                toast.success(order.status === 'PENDING' ? "Cập nhật phí & Xác nhận đơn hàng thành công" : "Cập nhật phí vận chuyển thành công");
                setOpenConfirmDialog(false);
                fetchOrder(id);
            } else {
                toast.error(response.message || "Cập nhật thất bại");
            }
        } catch (error: any) {
            console.error("Error updating shipping fee:", error);
            toast.error(error.response?.data?.message || "Lỗi khi cập nhật phí vận chuyển");
        } finally {
            setUpdating(false);
        }
    };

    const getStatusLabel = (status: string) => {
        return getOrderStatus(status).label;
    };

    const getStatusColor = (status: string) => {
        const { color, bgColor } = getOrderStatus(status);
        return { bg: bgColor, color: color };
    };

    const handleDownloadInvoice = async () => {
        if (!order) return;
        setIsDownloadingInvoice(true);
        try {
            const blob = await downloadOrderInvoice(order.id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${order.orderCode}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Đã tải hóa đơn thành công!");
        } catch (error) {
            console.error("Lỗi khi tải hóa đơn:", error);
            toast.error("Không thể tải hóa đơn. Vui lòng thử lại sau.");
        } finally {
            setIsDownloadingInvoice(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress sx={{ color: COLORS.primary }} />
            </Box>
        );
    }

    if (!order) return null;

    const handleProcessReturnRequest = async () => {
        if (!id) return;
        setUpdating(true);
        try {
            const response = await handleReturnRequest(id, {
                approved: returnApproved,
                adminNote: adminReturnNote.trim()
            });
            if (response.success) {
                toast.success(returnApproved ? "Đã chấp nhận yêu cầu trả hàng" : "Đã từ chối yêu cầu trả hàng");
                setOpenHandleReturnDialog(false);
                setAdminReturnNote('');
                fetchOrder(id);
            } else {
                toast.error(response.message || "Xử lý thất bại");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi xử lý yêu cầu trả hàng");
        } finally {
            setUpdating(false);
        }
    };
    return (
        <Box sx={{ pb: 8, bgcolor: '#F4F7F9', minHeight: '100vh', fontFamily: ORDER_DETAIL_FONT }}>
            {/* 1. Header (Balanced) */}
            <Box sx={{ p: 2.5, mb: 3, bgcolor: 'white', borderBottom: '1px solid #E5E8EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => window.history.back()}
                        sx={{ color: '#637381', fontWeight: 700, mb: 0.5, textTransform: 'none', fontSize: '0.875rem', '&:hover': { bgcolor: 'transparent', color: '#1C252E' } }}
                    >
                        Trở lại
                    </Button>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Typography sx={{ fontWeight: 700, fontSize: '1.125rem', color: '#1C252E', letterSpacing: '-0.3px' }}>
                            #{order.orderCode}
                        </Typography>
                        <Chip
                            label={getStatusLabel(order.status)}
                            sx={{
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                bgcolor: getStatusColor(order.status).bg,
                                color: getStatusColor(order.status).color,
                                borderRadius: '8px'
                            }}
                        />
                    </Stack>
                </Box>
                <Button
                    variant="contained"
                    startIcon={isDownloadingInvoice ? <CircularProgress size={20} color="inherit" /> : <LocalPrintshopIcon />}
                    onClick={handleDownloadInvoice}
                    disabled={isDownloadingInvoice}
                    sx={{ borderRadius: '12px', px: 2.5, py: 0.75, fontWeight: 600, fontSize: '0.875rem', bgcolor: '#1C252E', textTransform: 'none', '&:hover': { bgcolor: '#333' } }}
                >
                    {isDownloadingInvoice ? "Đang xuất..." : "Xuất hóa đơn"}
                </Button>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 400px' }, gap: 4, px: { xs: 2, md: 5 } }}>
                {/* Left Side (65%) */}
                <Box>
                    <Stack spacing={4}>
                        {/* Timeline Card - Horizontal */}
                        <Card sx={{ p: 4, borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #FFF', overflow: 'hidden' }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 3, color: '#1C252E' }}>Trạng thái vận đơn</Typography>

                            <Box sx={{ position: 'relative', px: 2 }}>
                                {/* Horizontal Line */}
                                <Box sx={{
                                    position: 'absolute',
                                    top: 12,
                                    left: 60,
                                    right: 60,
                                    height: '3px',
                                    bgcolor: '#F4F6F8',
                                    zIndex: 0
                                }} />

                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ position: 'relative', zIndex: 1 }}>

                                    {/* Step 1: Placed */}
                                    <Stack spacing={2} alignItems="center" sx={{ width: isCounterOrder ? '25%' : '20%' }}>
                                        <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#00AB55', border: '5px solid white', boxShadow: '0 0 0 1px #00AB55' }} />
                                        <Box textAlign="center">
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: '#1C252E', mb: 0.5 }}>Đã đặt hàng</Typography>
                                            <Typography sx={{ fontSize: '0.8125rem', color: '#637381' }}>{new Date(order.createdAt).toLocaleString('vi-VN')}</Typography>
                                        </Box>
                                    </Stack>

                                    {/* Step 2: Chốt phí & Xác nhận */}
                                    <Stack spacing={2} alignItems="center" sx={{ width: isCounterOrder ? '25%' : '20%' }}>
                                        <Box sx={{
                                            width: 28, height: 28, borderRadius: '50%',
                                            bgcolor: order.status === 'PENDING' ? '#FFAB00' : '#00AB55',
                                            border: '5px solid white',
                                            boxShadow: `0 0 0 1px ${order.status === 'PENDING' ? '#FFAB00' : '#00AB55'}`,
                                            animation: order.status === 'PENDING' ? 'pulse-orange 2s infinite' : 'none',
                                            '@keyframes pulse-orange': {
                                                '0%': { boxShadow: '0 0 0 0 rgba(255, 171, 0, 0.4)' },
                                                '70%': { boxShadow: '0 0 0 10px rgba(255, 171, 0, 0)' },
                                                '100%': { boxShadow: '0 0 0 0 rgba(255, 171, 0, 0)' }
                                            }
                                        }} />
                                        <Box textAlign="center">
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: order.status === 'PENDING' ? '#B76E00' : '#1C252E', mb: 0.5 }}>Chốt phí & Xác nhận</Typography>
                                            <Typography sx={{ fontSize: '0.8125rem', color: '#637381' }}>
                                                {order.status === 'PENDING' ? 'Đang chờ xử lý...' : new Date(order.updatedAt).toLocaleDateString('vi-VN')}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    {isCounterOrder ? (
                                        <>
                                            {/* Step 3: Chờ thanh toán (mua tại quầy) */}
                                            <Stack spacing={2} alignItems="center" sx={{ width: '25%' }}>
                                                <Box sx={{
                                                    width: 28, height: 28, borderRadius: '50%',
                                                    bgcolor: ['CONFIRMED', 'DELIVERED', 'COMPLETED'].includes(order.status) ? '#00AB55' : '#919EAB',
                                                    border: '5px solid white',
                                                    boxShadow: `0 0 0 1px ${['CONFIRMED', 'DELIVERED', 'COMPLETED'].includes(order.status) ? '#00AB55' : '#919EAB'}`
                                                }} />
                                                <Box textAlign="center">
                                                    <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: order.status === 'CONFIRMED' ? '#B76E00' : (['DELIVERED', 'COMPLETED'].includes(order.status) ? '#1C252E' : '#919EAB'), mb: 0.5 }}>
                                                        Chờ thanh toán
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.8125rem', color: '#919EAB' }}>
                                                        {order.status === 'CONFIRMED'
                                                            ? 'Đang chờ khách đến thanh toán'
                                                            : (['DELIVERED', 'COMPLETED'].includes(order.status)
                                                                ? new Date(order.updatedAt).toLocaleDateString('vi-VN')
                                                                : 'Sau khi xác nhận')}
                                                    </Typography>
                                                </Box>
                                            </Stack>

                                            {/* Step 4: Hoàn tất (mua tại quầy) */}
                                            <Stack spacing={2} alignItems="center" sx={{ width: '25%' }}>
                                                <Box sx={{
                                                    width: 28, height: 28, borderRadius: '50%',
                                                    bgcolor: (['DELIVERED', 'COMPLETED', 'RETURN_REQUESTED', 'RETURNED'].includes(order.status)) ? '#00AB55' : '#919EAB',
                                                    border: '5px solid white',
                                                    boxShadow: `0 0 0 1px ${(['DELIVERED', 'COMPLETED', 'RETURN_REQUESTED', 'RETURNED'].includes(order.status)) ? '#00AB55' : '#919EAB'}`
                                                }} />
                                                <Box textAlign="center">
                                                    <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: (['DELIVERED', 'COMPLETED', 'RETURN_REQUESTED', 'RETURNED'].includes(order.status)) ? '#1C252E' : '#919EAB', mb: 0.5 }}>
                                                        Hoàn tất
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.8125rem', color: '#919EAB' }}>
                                                        {(['DELIVERED', 'COMPLETED', 'RETURN_REQUESTED', 'RETURNED'].includes(order.status))
                                                            ? new Date(order.updatedAt).toLocaleDateString('vi-VN')
                                                            : 'Sau khi khách thanh toán'}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </>
                                    ) : (
                                        <>
                                            {/* Step 3: Chờ thanh toán (ONLINE + chuyển khoản) */}
                                            <Stack spacing={2} alignItems="center" sx={{ flex: 1 }}>
                                                <Box sx={{
                                                    width: 28, height: 28, borderRadius: '50%',
                                                    bgcolor:
                                                        (order.payments?.[0]?.paymentMethod === 'BANK_TRANSFER'
                                                            && order.status === 'CONFIRMED'
                                                            && order.payments?.[0]?.status !== 'COMPLETED')
                                                            ? '#FFAB00'
                                                            : (['PAID', 'PROCESSING', 'DELIVERING', 'DELIVERED', 'COMPLETED', 'RETURN_REQUESTED', 'RETURNED'].includes(order.status)
                                                                ? '#00AB55'
                                                                : '#919EAB'),
                                                    border: '5px solid white',
                                                    boxShadow: `0 0 0 1px ${
                                                        (order.payments?.[0]?.paymentMethod === 'BANK_TRANSFER'
                                                            && order.status === 'CONFIRMED'
                                                            && order.payments?.[0]?.status !== 'COMPLETED')
                                                            ? '#FFAB00'
                                                            : (['PROCESSING', 'DELIVERING', 'DELIVERED', 'COMPLETED', 'RETURN_REQUESTED', 'RETURNED'].includes(order.status)
                                                                ? '#00AB55'
                                                                : '#919EAB')
                                                    }`,
                                                    animation:
                                                        (order.payments?.[0]?.paymentMethod === 'BANK_TRANSFER'
                                                            && order.status === 'CONFIRMED'
                                                            && order.payments?.[0]?.status !== 'COMPLETED')
                                                            ? 'pulse-orange 2s infinite'
                                                            : 'none'
                                                }} />
                                                <Box textAlign="center">
                                                    <Typography sx={{
                                                        fontWeight: 700,
                                                        fontSize: '0.9375rem',
                                                        color:
                                                            (order.payments?.[0]?.paymentMethod === 'BANK_TRANSFER'
                                                                && order.status === 'CONFIRMED'
                                                                && order.payments?.[0]?.status !== 'COMPLETED')
                                                                ? '#B76E00'
                                                                : (['PAID', 'PROCESSING', 'DELIVERING', 'DELIVERED', 'COMPLETED', 'RETURN_REQUESTED', 'RETURNED'].includes(order.status)
                                                                    ? '#1C252E'
                                                                    : '#919EAB'),
                                                        mb: 0.5
                                                    }}>
                                                        Thanh toán
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.8125rem', color: '#919EAB' }}>
                                                        {order.payments?.[0]?.paymentMethod === 'BANK_TRANSFER'
                                                            ? (order.status === 'CONFIRMED'
                                                                ? 'Đang chờ khách chuyển khoản qua PayOS'
                                                                : ((order.status === 'PAID'
                                                                    || ['PROCESSING', 'DELIVERING', 'DELIVERED', 'COMPLETED', 'RETURN_REQUESTED', 'RETURNED'].includes(order.status))
                                                                    ? 'Đã thanh toán online'
                                                                    : 'Sau khi xác nhận'))
                                                            : 'Không áp dụng (COD)'}
                                                    </Typography>
                                                </Box>
                                            </Stack>

                                            {/* Step 4: Chờ đóng gói (đơn ONLINE) */}
                                            <Stack spacing={2} alignItems="center" sx={{ flex: 1 }}>
                                                <Box sx={{
                                                    width: 28, height: 28, borderRadius: '50%',
                                                    bgcolor: ['PROCESSING', 'DELIVERING', 'DELIVERED', 'COMPLETED', 'RETURN_REQUESTED', 'RETURNED'].includes(order.status) ? '#00AB55' : '#919EAB',
                                                    border: '5px solid white',
                                                    boxShadow: `0 0 0 1px ${['PROCESSING', 'DELIVERING', 'DELIVERED', 'COMPLETED', 'RETURN_REQUESTED', 'RETURNED'].includes(order.status) ? '#00AB55' : '#919EAB'}`,
                                                    animation: order.status === 'PROCESSING' ? 'pulse-orange 2s infinite' : 'none'
                                                }} />
                                                <Box textAlign="center">
                                                    <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: order.status === 'PROCESSING' ? '#B76E00' : (['DELIVERING', 'DELIVERED', 'COMPLETED', 'RETURN_REQUESTED', 'RETURNED'].includes(order.status) ? '#1C252E' : '#919EAB'), mb: 0.5 }}>
                                                        Chờ đóng gói
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.8125rem', color: '#919EAB' }}>
                                                        {order.status === 'PROCESSING'
                                                            ? 'Nhân viên đang chuẩn bị hàng'
                                                            : (['DELIVERING', 'DELIVERED', 'COMPLETED', 'RETURN_REQUESTED', 'RETURNED'].includes(order.status)
                                                                ? 'Đã đóng gói xong'
                                                                : 'Sau khi xác nhận')}
                                                    </Typography>
                                                </Box>
                                            </Stack>

                                            {/* Step 5: Đang giao hàng (ONLINE) */}
                                            <Stack spacing={2} alignItems="center" sx={{ flex: 1 }}>
                                                <Box sx={{
                                                    width: 28, height: 28, borderRadius: '50%',
                                                    bgcolor: ['DELIVERING', 'DELIVERED', 'COMPLETED', 'RETURN_REQUESTED', 'RETURNED'].includes(order.status) ? '#00AB55' : '#919EAB',
                                                    border: '5px solid white',
                                                    boxShadow: `0 0 0 1px ${['DELIVERING', 'DELIVERED', 'COMPLETED', 'RETURN_REQUESTED', 'RETURNED'].includes(order.status) ? '#00AB55' : '#919EAB'}`,
                                                    animation: order.status === 'DELIVERING' ? 'pulse-blue 2s infinite' : 'none'
                                                }} />
                                                <Box textAlign="center">
                                                    <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: order.status === 'DELIVERING' ? '#1064ad' : (['DELIVERED', 'COMPLETED', 'RETURN_REQUESTED', 'RETURNED'].includes(order.status) ? '#1C252E' : '#919EAB'), mb: 0.5 }}>
                                                        Đang giao hàng
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.8125rem', color: '#919EAB' }}>
                                                        {order.status === 'DELIVERING'
                                                            ? 'Đơn hàng đang được vận chuyển'
                                                            : (['DELIVERED', 'COMPLETED', 'RETURN_REQUESTED', 'RETURNED'].includes(order.status)
                                                                ? 'Đã giao tới nơi'
                                                                : 'Chờ vận chuyển')}
                                                    </Typography>
                                                </Box>
                                            </Stack>

                                            {/* Step 6: Giao hàng & Hoàn tất (ONLINE) */}
                                            <Stack spacing={2} alignItems="center" sx={{ flex: 1 }}>
                                                <Box sx={{
                                                    width: 28, height: 28, borderRadius: '50%',
                                                    bgcolor: (['DELIVERED', 'COMPLETED', 'RETURN_REQUESTED', 'RETURNED'].includes(order.status)) ? '#00AB55' : '#919EAB',
                                                    border: '5px solid white',
                                                    boxShadow: `0 0 0 1px ${(['DELIVERED', 'COMPLETED', 'RETURN_REQUESTED', 'RETURNED'].includes(order.status)) ? '#00AB55' : '#919EAB'}`
                                                }} />
                                                <Box textAlign="center">
                                                    <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: (['DELIVERED', 'COMPLETED', 'RETURN_REQUESTED', 'RETURNED'].includes(order.status)) ? '#1C252E' : '#919EAB', mb: 0.5 }}>
                                                        Giao hàng & Hoàn tất
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.8125rem', color: '#919EAB' }}>
                                                        {(['DELIVERED', 'COMPLETED', 'RETURN_REQUESTED', 'RETURNED'].includes(order.status))
                                                            ? new Date(order.updatedAt).toLocaleDateString('vi-VN')
                                                            : 'Dự kiến sau khi chốt'}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </>
                                    )}

                                    {/* Combined Step for Return (Conditional) */}
                                    {['RETURN_REQUESTED', 'RETURNED'].includes(order.status) && (
                                        <Stack spacing={2} alignItems="center" sx={{ width: '25%', ml: 'auto' }}>
                                            <Box sx={{
                                                width: 28, height: 28, borderRadius: '50%',
                                                bgcolor: order.status === 'RETURN_REQUESTED' ? '#00B8D9' : '#00AB55',
                                                border: '5px solid white',
                                                boxShadow: `0 0 0 1px ${order.status === 'RETURN_REQUESTED' ? '#00B8D9' : '#00AB55'}`,
                                                animation: order.status === 'RETURN_REQUESTED' ? 'pulse-cyan 2s infinite' : 'none',
                                                '@keyframes pulse-cyan': {
                                                    '0%': { boxShadow: '0 0 0 0 rgba(0, 184, 217, 0.4)' },
                                                    '70%': { boxShadow: '0 0 0 10px rgba(0, 184, 217, 0)' },
                                                    '100%': { boxShadow: '0 0 0 0 rgba(0, 184, 217, 0)' }
                                                }
                                            }} />
                                            <Box textAlign="center">
                                                <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: order.status === 'RETURN_REQUESTED' ? '#006C9C' : '#1C252E', mb: 0.5 }}>
                                                    {order.status === 'RETURN_REQUESTED' ? 'Yêu cầu trả hàng' : 'Đã hoàn trả'}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.8125rem', color: '#637381' }}>
                                                    {order.returnRequestedAt ? new Date(order.returnRequestedAt).toLocaleDateString('vi-VN') : 'Mới gửi yêu cầu'}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    )}
                                </Stack>
                            </Box>
                        </Card>

                        {/* Customer Info (Section 2) */}
                        <Card sx={{ p: 4, borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #FFF' }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 2.5, color: '#1C252E' }}>Thông tin khách hàng</Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1.5fr' }, gap: 3 }}>
                                <Box>
                                    <Typography sx={{ color: '#919EAB', fontWeight: 700, fontSize: '0.7rem', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.8 }}>Họ tên & SĐT</Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Nhập tên người nhận"
                                        value={editableCustomerName}
                                        onChange={(e) => setEditableCustomerName(e.target.value)}
                                        disabled={order.status !== 'PENDING'}
                                        sx={{
                                            mb: 1,
                                            '& .MuiOutlinedInput-root': { fontSize: '0.875rem', borderRadius: '10px', bgcolor: '#FAFBFC' }
                                        }}
                                    />
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Nhập số điện thoại"
                                        value={editableCustomerPhone}
                                        onChange={(e) => setEditableCustomerPhone(e.target.value)}
                                        disabled={order.status !== 'PENDING'}
                                        sx={{
                                            '& .MuiOutlinedInput-root': { fontSize: '0.875rem', borderRadius: '10px', bgcolor: '#FAFBFC' }
                                        }}
                                    />
                                    <Typography sx={{ color: '#919EAB', fontWeight: 700, fontSize: '0.7rem', mt: 1.5, mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.8 }}>Email (tùy chọn)</Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="email"
                                        placeholder="Nhập email khách hàng hoặc để trống"
                                        value={editableCustomerEmail}
                                        onChange={(e) => setEditableCustomerEmail(e.target.value)}
                                        disabled={order.status !== 'PENDING'}
                                        sx={{
                                            '& .MuiOutlinedInput-root': { fontSize: '0.875rem', borderRadius: '10px', bgcolor: '#FAFBFC' }
                                        }}
                                    />
                                </Box>
                                {!isCounterOrder && (
                                    <Box>
                                        <Typography sx={{ color: '#919EAB', fontWeight: 700, fontSize: '0.7rem', mb: 1, textTransform: 'uppercase', letterSpacing: 0.8 }}>Địa chỉ nhận hàng</Typography>
                                        <Box sx={{ mt: 1.5 }}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="Nhập địa chỉ giao hàng..."
                                                value={editableShippingAddress}
                                                onChange={(e) => setEditableShippingAddress(e.target.value)}
                                                disabled={order.status !== 'PENDING'}
                                                multiline
                                                minRows={2}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': { fontSize: '0.875rem', borderRadius: '12px', bgcolor: '#FAFBFC', border: '1px solid #E5E8EB', alignItems: 'center' },
                                                    '& textarea': { paddingTop: '0.75rem', paddingBottom: '0.75rem', overflow: 'auto' }
                                                }}
                                            />
                                            {editableShippingAddress.trim() && (
                                                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                                                    <LocationOnOutlinedIcon sx={{ fontSize: '1rem', color: '#00AB55' }} />
                                                    <Typography
                                                        component="a"
                                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(editableShippingAddress.trim())}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{
                                                            fontSize: '0.8125rem',
                                                            color: '#00AB55',
                                                            textDecoration: 'none',
                                                            '&:hover': { textDecoration: 'underline' }
                                                        }}
                                                    >
                                                        Mở địa chỉ trên Google Maps
                                                    </Typography>
                                                </Stack>
                                            )}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                            {order.status === 'PENDING' && (
                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleSaveContactInfo}
                                        disabled={updating}
                                        sx={{
                                            borderRadius: '999px',
                                            textTransform: 'none',
                                            fontWeight: 700,
                                            px: 3,
                                            py: 0.75,
                                            fontSize: '0.85rem',
                                        }}
                                    >
                                        {updating ? 'Đang lưu...' : 'Lưu thông tin liên hệ'}
                                    </Button>
                                </Box>
                            )}
                            <Box sx={{ mt: 3, p: 2, borderRadius: '12px', bgcolor: '#FAFBFC', border: '1px solid #E5E8EB' }}>
                                <Typography sx={{ color: '#637381', fontWeight: 600, fontSize: '0.75rem', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>Ghi chú đơn hàng</Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Nhập ghi chú (tùy chọn)..."
                                    value={editableNote}
                                    onChange={(e) => setEditableNote(e.target.value)}
                                    multiline
                                    minRows={2}
                                    sx={{
                                        '& .MuiOutlinedInput-root': { fontSize: '0.875rem', borderRadius: '10px', bgcolor: 'white', alignItems: 'center' },
                                        '& textarea': { paddingTop: '0.75rem', paddingBottom: '0.75rem' }
                                    }}
                                />
                            </Box>
                            {/* Hiển thị lý do hủy/hoàn trả nếu có */}
                            {(order.status === 'CANCELLED' || order.status === 'RETURNED') && order.cancelReason && (
                                <Box sx={{
                                    mt: 3,
                                    p: 2.5,
                                    borderRadius: '16px',
                                    bgcolor: order.status === 'CANCELLED' ? '#FFF5F5' : '#FFF4E5',
                                    border: `1px dashed ${order.status === 'CANCELLED' ? '#FF5630' : '#FFAB00'}`,
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 2
                                }}>
                                    <Box sx={{ p: 1, borderRadius: '50%', bgcolor: order.status === 'CANCELLED' ? 'rgba(255, 86, 48, 0.1)' : 'rgba(255, 171, 0, 0.1)', color: order.status === 'CANCELLED' ? '#FF5630' : '#FFAB00' }}>
                                        {order.status === 'CANCELLED' ? '❌' : '↩️'}
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography sx={{ color: order.status === 'CANCELLED' ? '#FF5630' : '#B76E00', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                            LÝ DO {order.status === 'CANCELLED' ? 'HỦY ĐƠN' : 'HOÀN TRẢ'}:
                                        </Typography>
                                        <Typography sx={{ color: '#1C252E', fontSize: '0.875rem', fontWeight: 500, mt: 0.5 }}>
                                            "{order.cancelReason}"
                                        </Typography>
                                        {order.cancelledBy && (
                                            <Typography sx={{ color: '#919EAB', fontSize: '0.8125rem', fontWeight: 500, mt: 1 }}>
                                                Thực hiện bởi: <Box component="span" sx={{ fontWeight: 700 }}>{order.cancelledBy}</Box>
                                            </Typography>
                                        )}
                                        {order.cancelledAt && (
                                            <Typography sx={{ color: '#919EAB', fontSize: '0.8125rem', fontWeight: 500 }}>
                                                Lúc: {new Date(order.cancelledAt).toLocaleString('vi-VN')}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            )}
                            {/* Hiển thị yêu cầu trả hàng nếu có */}
                            {(order.status === 'RETURN_REQUESTED' || order.returnRequestedAt) && (
                                <Box sx={{
                                    mt: 3,
                                    p: 2.5,
                                    borderRadius: '24px',
                                    bgcolor: 'rgba(0, 184, 217, 0.04)',
                                    border: '1px solid rgba(0, 184, 217, 0.2)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2
                                }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'rgba(0, 184, 217, 0.1)', color: '#006C9C' }}>
                                            📦
                                        </Box>
                                        <Typography sx={{ color: '#006C9C', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase' }}>
                                            Yêu cầu trả hàng từ khách
                                        </Typography>
                                        {order.returnRequestedAt && (
                                            <Typography sx={{ color: '#919EAB', fontSize: '0.8125rem', fontWeight: 500, ml: 'auto' }}>
                                                Lúc: {new Date(order.returnRequestedAt).toLocaleString('vi-VN')}
                                            </Typography>
                                        )}
                                    </Stack>

                                    <Box sx={{ pl: 6 }}>
                                        <Typography sx={{ color: '#1C252E', fontSize: '0.9375rem', fontWeight: 600, mb: 2 }}>
                                            "{order.returnReason}"
                                        </Typography>

                                        {order.returnEvidence && (
                                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                                {order.returnEvidence.split(',').map((url, i) => (
                                                    <Avatar
                                                        key={i}
                                                        src={url}
                                                        variant="rounded"
                                                        sx={{ width: 80, height: 80, borderRadius: '12px', border: '1px solid #E5E8EB', cursor: 'pointer' }}
                                                        onClick={() => window.open(url, '_blank')}
                                                    />
                                                ))}
                                            </Stack>
                                        )}

                                        {order.adminReturnNote && (
                                            <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed rgba(0, 184, 217, 0.2)' }}>
                                                <Typography sx={{ color: '#919EAB', fontWeight: 700, fontSize: '0.7rem', mb: 0.5, textTransform: 'uppercase' }}>
                                                    Phản hồi từ Admin:
                                                </Typography>
                                                <Typography sx={{ color: order.status === 'RETURNED' ? '#00AB55' : '#FF5630', fontSize: '0.875rem', fontWeight: 600 }}>
                                                    {order.adminReturnNote}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>

                                    {order.status === 'RETURN_REQUESTED' && (
                                        <Stack direction="row" spacing={2} sx={{ mt: 1, ml: 6 }}>
                                            <Button
                                                variant="contained"
                                                color="success"
                                                size="small"
                                                sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none' }}
                                                onClick={() => { setReturnApproved(true); setOpenHandleReturnDialog(true); }}
                                            >
                                                Đồng ý Trả hàng
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none' }}
                                                onClick={() => { setReturnApproved(false); setOpenHandleReturnDialog(true); }}
                                            >
                                                Từ chối
                                            </Button>
                                        </Stack>
                                    )}
                                </Box>
                            )}
                        </Card>

                        {/* Product List (Section 3) */}
                        <Card sx={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #FFF', overflow: 'hidden' }}>
                            <Box sx={{ p: 3, bgcolor: '#F8F9FA', borderBottom: '1px solid #F4F6F8', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <ShoppingBagIcon sx={{ color: '#1C252E' }} />
                                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1C252E' }}>Chi tiết giỏ hàng ({order.orderItems.length})</Typography>
                            </Box>
                            <Stack divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
                                {order.orderItems.map((item) => (
                                    <Box key={item.id} sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3, '&:hover': { bgcolor: '#F9FAFB' } }}>
                                        <Badge badgeContent={item.quantity} color="primary" overlap="rectangular" anchorOrigin={{ vertical: 'top', horizontal: 'left' }}>
                                            <Avatar src={item.imageUrl} variant="rounded" sx={{ width: 80, height: 80, borderRadius: '16px', border: '1px solid #F4F6F8' }} />
                                        </Badge>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: '#1C252E', mb: 0.5 }}>{item.productName}</Typography>
                                            <Typography sx={{ fontSize: '0.8125rem', color: '#919EAB', fontWeight: 500 }}>SKU: {item.variantId || 'N/A'}</Typography>
                                            <Typography sx={{ fontSize: '0.8125rem', color: '#637381', fontWeight: 500 }}>Phân loại: <Box component="span" sx={{ fontWeight: 600, color: '#3F51B5' }}>{item.variantName}</Box></Typography>
                                        </Box>
                                        <Box textAlign="right">
                                            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1C252E' }}>{(item.unitPrice * item.quantity).toLocaleString('vi-VN')}₫</Typography>
                                            <Typography sx={{ fontSize: '0.8125rem', color: '#919EAB', fontWeight: 500 }}>{item.unitPrice.toLocaleString('vi-VN')}₫ x {item.quantity}</Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Stack>
                        </Card>
                    </Stack>
                </Box>

                {/* Right Side (Sticky Control) */}
                <Box sx={{ position: 'sticky', top: 24, height: 'fit-content' }}>
                    <Stack spacing={3}>
                        {/* Shipping Control Card - Chỉ khi PENDING và đơn online (không áp dụng đơn tại quầy) */}
                        {order.status === 'PENDING' && !isCounterOrder && (
                            <Card sx={{
                                p: 3.5,
                                borderRadius: '32px',
                                border: '1px solid rgba(255, 255, 255, 0.8)',
                                boxShadow: '0 8px 32px rgba(145, 158, 171, 0.1), 0 1px 2px rgba(145, 158, 171, 0.2)',
                                background: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(10px)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                {/* Decorative Background Element */}
                                <Box sx={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(22, 163, 74, 0.05) 0%, rgba(22, 163, 74, 0) 70%)', zIndex: 0 }} />

                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4, position: 'relative', zIndex: 1 }}>
                                    <Box sx={{
                                        p: 1.25,
                                        borderRadius: '14px',
                                        bgcolor: '#00AB55',
                                        color: '#FFFFFF',
                                        display: 'flex',
                                        boxShadow: '0 8px 16px rgba(0, 171, 85, 0.24)'
                                    }}>
                                        <LocalShippingIcon sx={{ fontSize: '1.5rem' }} />
                                    </Box>
                                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1C252E', letterSpacing: '-0.3px', flex: 1 }}>Vận hành Giao nhận</Typography>
                                    {order?.distanceKm && (
                                        <Chip
                                            icon={<LocationOnOutlinedIcon style={{ fontSize: '1rem', color: '#00AB55' }} />}
                                            label={`Cách cửa hàng: ${order.distanceKm} km`}
                                            size="small"
                                            sx={{
                                                bgcolor: 'rgba(0, 171, 85, 0.1)',
                                                color: '#007B55',
                                                fontWeight: 600,
                                                fontSize: '0.75rem',
                                                border: '1px solid rgba(0, 171, 85, 0.2)',
                                                px: 0.5,
                                                height: '32px'
                                            }}
                                        />
                                    )}
                                </Stack>

                                <Stack spacing={3.5} sx={{ position: 'relative', zIndex: 1 }}>
                                    <Stack direction="row" spacing={2.5} alignItems="flex-start">
                                        <Box sx={{ flex: 1, position: 'relative' }}>
                                            <TextField
                                                fullWidth
                                                label="KHOẢNG CÁCH"
                                                type="number"
                                                value={distance}
                                                onChange={(e) => setDistance(Number(e.target.value))}
                                                variant="standard"
                                                InputProps={{
                                                    endAdornment: <InputAdornment position="end"><Typography sx={{ fontWeight: 600, color: '#919EAB', fontSize: '0.8125rem' }}>km</Typography></InputAdornment>,
                                                    sx: { fontSize: '1rem', fontWeight: 700, py: 0.5 }
                                                }}
                                                sx={{ '& label': { fontSize: '0.75rem', fontWeight: 700, color: '#919EAB', letterSpacing: '0.5px' }, '& .MuiInput-underline:after': { borderBottomColor: '#00AB55' } }}
                                            />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <TextField
                                                fullWidth
                                                label="TRỌNG LƯỢNG"
                                                type="number"
                                                value={weight}
                                                onChange={(e) => setWeight(Number(e.target.value))}
                                                variant="standard"
                                                InputProps={{
                                                    endAdornment: <InputAdornment position="end"><Typography sx={{ fontWeight: 600, color: '#919EAB', fontSize: '0.8125rem' }}>kg</Typography></InputAdornment>,
                                                    sx: { fontSize: '1rem', fontWeight: 700, py: 0.5 }
                                                }}
                                                sx={{ '& label': { fontSize: '0.75rem', fontWeight: 700, color: '#919EAB', letterSpacing: '0.5px' }, '& .MuiInput-underline:after': { borderBottomColor: '#00AB55' } }}
                                            />
                                        </Box>
                                    </Stack>

                                    {distance > 10 && (
                                        <Box sx={{ px: 2, py: 1.5, bgcolor: '#F0FDF4', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: 1.5, border: '1px dashed #00AB55' }}>
                                            <Typography sx={{ color: '#007B55', fontWeight: 600, fontSize: '0.8125rem' }}>
                                                🛵 Xa {distance}km: Tiết kiệm hơn khi Book Grab!
                                            </Typography>
                                        </Box>
                                    )}

                                    <Box sx={{
                                        p: 2.5,
                                        borderRadius: '24px',
                                        bgcolor: '#F8FAFC',
                                        border: '1px solid #F1F5F9',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'stretch'
                                    }}>
                                        <Typography sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '0.7rem', mb: 1, textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Đề xuất hệ thống</Typography>

                                        {showFreeshipOnly ? (
                                            <Box sx={{ mb: 2, textAlign: 'center' }}>
                                                <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#00AB55', mb: 0.5 }}>
                                                    MIỄN PHÍ VẬN CHUYỂN
                                                </Typography>
                                                <Typography sx={{ fontWeight: 500, fontSize: '0.8125rem', color: '#637381', mb: 1 }}>
                                                    Bạn đã chọn đặt 0đ (Freeship)
                                                </Typography>
                                                <Button
                                                    type="button"
                                                    size="small"
                                                    variant="text"
                                                    onClick={() => setShowFreeshipOnly(false)}
                                                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', color: '#637381' }}
                                                >
                                                    ← Chọn lại bản ghi phí
                                                </Button>
                                            </Box>
                                        ) : (
                                            <>
                                                {fetchingSuggestion && shippingRules.length === 0 ? (
                                                    <CircularProgress size={24} sx={{ my: 2, alignSelf: 'center', color: '#00AB55' }} />
                                                ) : shippingRules.length === 0 ? (
                                                    <Box sx={{ mb: 2, textAlign: 'center' }}>
                                                        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#FFAB00', mb: 1 }}>
                                                            ⚠️ Chưa có quy tắc tính phí
                                                        </Typography>
                                                        <Button
                                                            variant="outlined"
                                                            color="warning"
                                                            size="small"
                                                            onClick={() => navigate(`/${prefixAdmin}/shipping/list`)}
                                                            sx={{ textTransform: 'none', fontWeight: 700 }}
                                                        >
                                                            Thêm quy tắc
                                                        </Button>
                                                    </Box>
                                                ) : (
                                                    <Stack spacing={1} sx={{ mb: 2, maxHeight: 220, overflowY: 'auto' }}>
                                                        {shippingRules.map((rule) => {
                                                            const fee = calcFeeByRule(rule);
                                                            const selected = selectedRuleId === rule.id;
                                                            return (
                                                                <Box
                                                                    key={rule.id}
                                                                    onClick={() => setSelectedRuleId(rule.id)}
                                                                    sx={{
                                                                        p: 1.5,
                                                                        borderRadius: '12px',
                                                                        border: `2px solid ${selected ? '#00AB55' : '#E5E8EB'}`,
                                                                        bgcolor: selected ? 'rgba(0, 171, 85, 0.06)' : 'white',
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.2s',
                                                                        '&:hover': { borderColor: selected ? '#00AB55' : '#919EAB', bgcolor: selected ? 'rgba(0, 171, 85, 0.08)' : '#F9FAFB' }
                                                                    }}
                                                                >
                                                                    <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={0.5}>
                                                                        <Typography sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#1C252E' }}>
                                                                            {rule.note || `Quy tắc #${rule.id}`}
                                                                        </Typography>
                                                                        <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#00AB55' }}>
                                                                            {fee.toLocaleString('vi-VN')}₫
                                                                        </Typography>
                                                                    </Stack>
                                                                    <Typography sx={{ fontSize: '0.7rem', color: '#637381', mt: 0.5 }}>
                                                                        {rule.feePerKm != null && `${rule.feePerKm.toLocaleString('vi-VN')}₫/km`}
                                                                        {rule.minFee != null && ` • Tối thiểu ${rule.minFee.toLocaleString('vi-VN')}₫`}
                                                                    </Typography>
                                                                </Box>
                                                            );
                                                        })}
                                                    </Stack>
                                                )}

                                                <Stack direction="row" spacing={1} sx={{ position: 'relative', zIndex: 1 }}>
                                                    <Button
                                                        type="button"
                                                        size="small"
                                                        variant={selectedRuleId != null ? 'contained' : 'outlined'}
                                                        color="success"
                                                        disabled={selectedRuleId == null}
                                                        onClick={() => {
                                                            if (selectedRuleId == null) return;
                                                            const rule = shippingRules.find((r) => r.id === selectedRuleId);
                                                            if (rule) setNewShippingFee(calcFeeByRule(rule).toString());
                                                        }}
                                                        sx={{
                                                            borderRadius: '8px',
                                                            px: 1.5,
                                                            fontWeight: 600,
                                                            fontSize: '0.8125rem',
                                                            ...(selectedRuleId != null ? { boxShadow: '0 2px 8px rgba(0, 171, 85, 0.3)' } : {})
                                                        }}
                                                    >
                                                        Áp dụng giá này
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outlined"
                                                        size="small"
                                                        onClick={() => { setShowFreeshipOnly(true); setNewShippingFee('0'); }}
                                                        sx={{
                                                            borderRadius: '8px',
                                                            px: 1.5,
                                                            fontWeight: 600,
                                                            fontSize: '0.8125rem',
                                                            color: '#FF5630',
                                                            borderColor: 'rgba(255, 86, 48, 0.5)',
                                                            '&:hover': { borderColor: '#FF5630', bgcolor: 'rgba(255, 86, 48, 0.08)' }
                                                        }}
                                                    >
                                                        Đặt 0đ (Freeship)
                                                    </Button>
                                                </Stack>
                                            </>
                                        )}
                                    </Box>

                                    <Box>
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#919EAB', mb: 1, ml: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phí ship cuối cùng</Typography>
                                        <TextField
                                            fullWidth
                                            value={newShippingFee}
                                            onChange={(e) => setNewShippingFee(e.target.value)}
                                            placeholder="0"
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: '#00AB55' }}>₫</Typography></InputAdornment>,
                                                sx: {
                                                    borderRadius: '16px',
                                                    bgcolor: 'white',
                                                    border: '1px solid #E5E8EB',
                                                    '& input': { fontWeight: 700, fontSize: '1.125rem', textAlign: 'center', color: '#00AB55', py: 1 }
                                                }
                                            }}
                                            sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { border: 'none' }, '&.Mui-focused': { border: '2px solid #00AB55' } } }}
                                        />
                                    </Box>
                                </Stack>
                            </Card>
                        )}

                        {/* Payment Summary - ULTRA PREMIUM REDESIGN */}
                        <Card sx={{
                            p: 3.5,
                            borderRadius: '32px',
                            border: '1px solid rgba(255, 255, 255, 0.8)',
                            boxShadow: '0 8px 32px rgba(145, 158, 171, 0.1), 0 1px 2px rgba(145, 158, 171, 0.2)',
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)',
                        }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 2.5, color: '#1C252E', letterSpacing: '-0.3px' }}>Tổng kết thanh toán</Typography>

                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#919EAB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tạm tính</Typography>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: '#1C252E' }}>{order.subtotal.toLocaleString('vi-VN')}₫</Typography>
                                </Box>
                                {!isCounterOrder && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#919EAB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phí vận chuyển</Typography>
                                        <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: '#00AB55' }}>+{Number(newShippingFee).toLocaleString('vi-VN')}₫</Typography>
                                    </Box>
                                )}
                                {order.discountAmount > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#FF5630', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Giảm giá</Typography>
                                        <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: '#FF5630' }}>-{order.discountAmount.toLocaleString('vi-VN')}₫</Typography>
                                    </Box>
                                )}

                                <Divider sx={{ borderColor: '#F4F6F8', my: 1, borderStyle: 'dashed' }} />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pt: 1 }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', color: '#1C252E', mb: 0.5 }}>TỔNG CỘNG</Typography>
                                    <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#007B55', textAlign: 'right', lineHeight: 1, letterSpacing: '-0.5px' }}>
                                        {(order.subtotal + Number(newShippingFee) - order.discountAmount).toLocaleString('vi-VN')}₫
                                    </Typography>
                                </Box>
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.5, p: 1.5, borderRadius: '12px', bgcolor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                                    <Box sx={{
                                        width: 28, height: 28, borderRadius: '8px', bgcolor: 'rgba(255, 171, 0, 0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <PaymentsIcon sx={{ fontSize: '1.25rem', color: '#FFAB00' }} />
                                    </Box>
                                    <Stack spacing={0} sx={{ flex: 1 }}>
                                        <Typography sx={{ fontSize: '0.7rem', color: '#919EAB', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hình thức</Typography>
                                        {isCounterOrder && order.status === 'CONFIRMED' && order.payments?.[0]?.status !== 'COMPLETED' ? (
                                            <FormControl size="small" fullWidth sx={{ mt: 0.5 }}>
                                                <Select
                                                    value={order.payments?.[0]?.paymentMethod === 'BANK_TRANSFER' ? 'BANK_TRANSFER' : 'CASH'}
                                                    onChange={async (e) => {
                                                        const method = e.target.value as 'CASH' | 'BANK_TRANSFER';
                                                        if (!id || method === (order.payments?.[0]?.paymentMethod || 'CASH')) return;
                                                        setUpdating(true);
                                                        try {
                                                            const res = await updateOrderPaymentMethod(id, method);
                                                            if (res.success) {
                                                                toast.success('Đã đổi phương thức thanh toán.');
                                                                fetchOrder(id);
                                                            } else toast.error(res.message || 'Cập nhật thất bại');
                                                        } catch (err: any) {
                                                            toast.error(err.response?.data?.message || 'Lỗi khi đổi phương thức thanh toán');
                                                        } finally {
                                                            setUpdating(false);
                                                        }
                                                    }}
                                                    disabled={updating}
                                                    sx={{ borderRadius: '10px', fontSize: '0.875rem', fontWeight: 600 }}
                                                >
                                                    <MenuItem value="CASH">Tiền mặt (Tại quầy)</MenuItem>
                                                    <MenuItem value="BANK_TRANSFER">Chuyển khoản (QR)</MenuItem>
                                                </Select>
                                            </FormControl>
                                        ) : (
                                            <Typography sx={{ fontSize: '0.875rem', color: '#1C252E', fontWeight: 600 }}>
                                                {isCounterOrder
                                                    ? (order.payments?.[0]?.status === 'COMPLETED' ? 'Đã thanh toán tại quầy' : (order.payments?.[0]?.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản (QR)' : 'Tiền mặt (Tại quầy)'))
                                                    : (order.payments?.[0]?.paymentMethod === 'CASH'
                                                        ? 'Thanh toán khi nhận hàng'
                                                        : (order.payments?.[0]?.status === 'COMPLETED' ? 'Đã thanh toán Online' : 'Thanh toán Online'))}
                                            </Typography>
                                        )}
                                    </Stack>
                                </Stack>
                            </Stack>
                        </Card>

                        {/* General Status Steps Support (bao gồm PENDING + đơn tại quầy: Chốt phí & Chuyển sang Chờ thanh toán) */}
                        {(order.status !== 'PENDING' || isCounterOrder) && !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(order.status) && (
                            <Card sx={{
                                p: 3.5,
                                borderRadius: '32px',
                                border: '1px solid rgba(255, 255, 255, 0.8)',
                                boxShadow: '0 8px 32px rgba(145, 158, 171, 0.1), 0 1px 2px rgba(145, 158, 171, 0.2)',
                                background: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(10px)',
                            }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 2, color: '#1C252E' }}>Bước xử lý tiếp theo</Typography>
                                <Stack spacing={2}>
                                    {/* Đơn online + thanh toán online (chuyển khoản): hiện "Xác nhận đã thanh toán" trước, sau khi xác nhận mới hiện "Bắt đầu đóng gói" */}
                                    {needConfirmPaymentFirst && (
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            startIcon={<CheckCircleOutlineIcon />}
                                            onClick={() => setOpenConfirmPaymentDialog(true)}
                                            disabled={updating}
                                            sx={{
                                                py: 1.5,
                                                borderRadius: '12px',
                                                fontSize: '0.9375rem',
                                                fontWeight: 700,
                                                textTransform: 'none',
                                                bgcolor: '#118D57',
                                                '&:hover': { bgcolor: '#0d7a47', filter: 'brightness(0.95)' }
                                            }}
                                        >
                                            {updating ? 'Đang xử lý...' : 'Xác nhận đã thanh toán'}
                                        </Button>
                                    )}
                                    {/* Đơn tại quầy CONFIRMED + tiền mặt: không hiện nút "Xác nhận đã thanh toán" (chỉ dùng "Nhập số tiền đã thu & Xác nhận" bên dưới). 
                                        Đơn ONLINE (mọi hình thức thanh toán) chỉ được phép "Bắt đầu đóng gói" khi payment chính đã COMPLETED. */}
                                    {!needConfirmPaymentFirst && getNextAction(order.status) && !(isCounterOrder && order.status === 'CONFIRMED' && order.payments?.[0]?.paymentMethod === 'CASH') && (
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            startIcon={getNextAction(order.status)?.icon}
                                            onClick={() => getNextAction(order.status) && handleUpdateStatus(getNextAction(order.status)!.status)}
                                            disabled={
                                                updating
                                                || (
                                                    // Đơn ONLINE ở trạng thái CONFIRMED nhưng payment chính chưa COMPLETED → không cho "Bắt đầu đóng gói"
                                                    !isCounterOrder
                                                    && order.orderType === 'ONLINE'
                                                    && order.status === 'CONFIRMED'
                                                    && order.payments?.[0]
                                                    && order.payments[0].status !== 'COMPLETED'
                                                )
                                            }
                                            sx={{
                                                py: 1.5,
                                                borderRadius: '12px',
                                                fontSize: '0.9375rem',
                                                fontWeight: 700,
                                                textTransform: 'none',
                                                bgcolor: getNextAction(order.status)?.color,
                                                '&:hover': { bgcolor: getNextAction(order.status)?.color, filter: 'brightness(0.9)' }
                                            }}
                                        >
                                            {updating ? 'Đang xử lý...' : getNextAction(order.status)?.label}
                                        </Button>
                                    )}
                                    {/* Nút hủy đơn cho PENDING và CONFIRMED */}
                                    {['PENDING', 'CONFIRMED'].includes(order.status) && (
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            color="error"
                                            onClick={() => setOpenCancelDialog(true)}
                                            disabled={updating}
                                            sx={{
                                                py: 1.25,
                                                borderRadius: '12px',
                                                fontSize: '0.875rem',
                                                fontWeight: 600,
                                                textTransform: 'none',
                                                borderWidth: '2px',
                                                '&:hover': { borderWidth: '2px' }
                                            }}
                                        >
                                            Hủy đơn hàng
                                        </Button>
                                    )}

                                    {/* Nút yêu cầu hoàn tiền: đơn ONLINE, đang PAID hoặc PROCESSING (backend sẽ kiểm tra đã thanh toán) */}
                                    {order.orderType === 'ONLINE'
                                        && ['PAID', 'PROCESSING'].includes(order.status) && (
                                        <Badge
                                            color="error"
                                            variant="dot"
                                            invisible={order.latestRefundStatus !== 'PENDING'}
                                            overlap="rectangular"
                                            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                                        >
                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                color="warning"
                                                onClick={() => setOpenCancelDialog(true)}
                                                disabled={updating}
                                                sx={{
                                                    py: 1.25,
                                                    borderRadius: '12px',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 600,
                                                    textTransform: 'none',
                                                    borderWidth: '2px',
                                                    '&:hover': { borderWidth: '2px' }
                                                }}
                                            >
                                                Yêu cầu hoàn tiền
                                            </Button>
                                        </Badge>
                                    )}

                                    {/* Nút hoàn trả cho DELIVERING và DELIVERED */}
                                    {['DELIVERING', 'DELIVERED'].includes(order.status) && (
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            color="warning"
                                            onClick={() => setOpenReturnDialog(true)}
                                            disabled={updating}
                                            sx={{
                                                py: 1.25,
                                                borderRadius: '12px',
                                                fontSize: '0.875rem',
                                                fontWeight: 600,
                                                textTransform: 'none',
                                                borderWidth: '2px',
                                                '&:hover': { borderWidth: '2px' }
                                            }}
                                        >
                                            Đánh dấu Hoàn trả (Khách boom)
                                        </Button>
                                    )}

                                    <Typography sx={{ fontSize: '0.8125rem', color: '#637381', textAlign: 'center', fontStyle: 'italic', mt: 1 }}>
                                        * Nhấn nút để thực hiện bước chuyển đổi trạng thái tiếp theo.
                                    </Typography>
                                </Stack>
                            </Card>
                        )}

                        {/* Đơn online PENDING: nút Xác nhận Đơn hàng (mở dialog phí ship). Đơn tại quầy PENDING đã có nút trong card Bước xử lý. */}
                        {order.status === 'PENDING' && !isCounterOrder && (
                            <Box sx={{ px: 1 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    onClick={() => setOpenConfirmDialog(true)}
                                    disabled={updating}
                                    sx={{
                                        py: 1.75,
                                        borderRadius: '16px',
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        background: 'linear-gradient(135deg, #00AB55 0%, #007B55 100%)',
                                        boxShadow: '0 12px 32px rgba(0, 171, 85, 0.35)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #007B55 0%, #005249 100%)',
                                            boxShadow: '0 16px 40px rgba(0, 171, 85, 0.45)',
                                            transform: 'translateY(-2px)'
                                        },
                                        '&:disabled': {
                                            background: '#E5E8EB',
                                            boxShadow: 'none',
                                            color: '#919EAB'
                                        }
                                    }}
                                >
                                    {updating ? 'Đang xử lý...' : 'Xác nhận Đơn hàng'}
                                </Button>
                            </Box>
                        )}
                        {/* Đơn tại quầy (OFFLINE) CONFIRMED: tiền mặt → nhập số tiền đã thu; chuyển khoản → xử lý qua PayOS. Không hiện khi đơn online. */}
                        {isCounterOrder && order.status === 'CONFIRMED' && order.orderType !== 'ONLINE' && (
                            <Box sx={{ px: 1 }}>
                                {order.payments?.[0]?.paymentMethod === 'CASH' ? (
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        onClick={handleOpenCashReceivedDialog}
                                        startIcon={<PaymentsIcon />}
                                        sx={{
                                            py: 1.5,
                                            borderRadius: '16px',
                                            fontSize: '0.9375rem',
                                            fontWeight: 700,
                                            textTransform: 'none',
                                            bgcolor: '#00AB55',
                                            '&:hover': { bgcolor: '#007B55' }
                                        }}
                                    >
                                        Nhập số tiền đã thu & Xác nhận
                                    </Button>
                                ) : (
                                    <Typography sx={{ py: 1.5, fontSize: '0.875rem', color: '#637381', textAlign: 'center' }}>
                                        Thanh toán chuyển khoản được xử lý qua PayOS.
                                    </Typography>
                                )}
                            </Box>
                        )}
                        {order.status !== 'PENDING' && !isCounterOrder && (
                            <Box sx={{ px: 1 }}>
                                <Typography sx={{ textAlign: 'center', color: '#919EAB', fontWeight: 600, fontSize: '0.875rem' }}>
                                    Đơn hàng đã được xác nhận & chốt phí.
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </Box>
            </Box>

            {/* Smart Confirmation Dialog */}
            <Dialog
                open={openConfirmDialog}
                onClose={() => setOpenConfirmDialog(false)}
                PaperProps={{ sx: { borderRadius: '24px', p: 0, maxWidth: 600, width: '100%' } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 1 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#00AB55', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <Box component="span" sx={{ fontSize: '1rem', fontWeight: 700 }}>i</Box>
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1C252E' }}>Xác nhận Chi tiết Vận chuyển</Typography>
                    </Stack>
                    <IconButton onClick={() => setOpenConfirmDialog(false)} size="small" sx={{ bgcolor: '#F4F6F8' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ px: 4, py: 2 }}>
                    {/* Customer Info */}
                    <Stack spacing={1.5} sx={{ mb: 3, mt: 1 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <PersonOutlineIcon sx={{ color: '#00AB55', fontSize: '1.25rem' }} />
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#919EAB', textTransform: 'uppercase' }}>
                                KHÁCH HÀNG: <Box component="span" sx={{ color: '#1C252E', fontWeight: 700 }}>{order.shippingName.toUpperCase()}</Box>
                            </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            <LocationOnOutlinedIcon sx={{ color: '#00AB55', fontSize: '1.25rem' }} />
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1C252E' }}>
                                Địa chỉ hiện tại: {shopAddress || '— Chưa cấu hình (vào Cài đặt)'}
                            </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            <LocationOnOutlinedIcon sx={{ color: '#FF5630', fontSize: '1.25rem' }} />
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1C252E' }}>
                                Giao đến: {editableShippingAddress || order.shippingAddress}
                            </Typography>
                        </Stack>
                    </Stack>

                    {/* Fee Details Box */}
                    <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', mb: 3 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                            <LocalShippingIcon sx={{ color: '#16A34A', fontSize: '1.25rem' }} />
                            <Typography sx={{ fontWeight: 700, color: '#16A34A', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                CHI TIẾT ĐỀ XUẤT HỆ THỐNG
                            </Typography>
                        </Stack>

                        <Stack spacing={1.5}>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography sx={{ fontSize: '0.8125rem', color: '#15803D', fontWeight: 500, fontStyle: 'italic' }}>
                                    Quãng đường ({distance} km x {(breakdown?.feePerKm || 3000).toLocaleString('vi-VN')}₫)
                                </Typography>
                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#166534' }}>
                                    {(distance * (breakdown?.feePerKm || 3000)).toLocaleString('vi-VN')}đ
                                </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography sx={{ fontSize: '0.8125rem', color: '#15803D', fontWeight: 500, fontStyle: 'italic' }}>
                                    Phụ khí cân nặng (Dồi dư {weight > (breakdown?.baseWeight || 1) ? (weight - (breakdown?.baseWeight || 1)).toFixed(1) : 0} kg)
                                </Typography>
                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#166534' }}>
                                    {(weight > (breakdown?.baseWeight || 1) ? (weight - (breakdown?.baseWeight || 1)) * (breakdown?.overWeightFee || 0) : 0).toLocaleString('vi-VN')}đ
                                </Typography>
                            </Stack>

                            <Divider sx={{ borderColor: '#BBF7D0', borderStyle: 'dashed', my: 1 }} />

                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography sx={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
                                    PHÍ SHIP CHỐT CUỐI CÙNG
                                </Typography>
                                <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#15803D', textUnderlineOffset: '4px' }}>
                                    {Number(newShippingFee).toLocaleString('vi-VN')}đ
                                </Typography>
                            </Stack>
                        </Stack>
                    </Box>

                    {/* Total Comparison */}
                    <Box sx={{ p: 2, borderRadius: '16px', bgcolor: '#F8FAFC', border: '1px solid #F1F5F9', textAlign: 'center' }}>
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={4}>
                            <Box>
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#919EAB', textTransform: 'uppercase' }}>TỔNG CŨ</Typography>
                                <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: '#919EAB', textDecoration: 'line-through' }}>
                                    {order.finalAmount.toLocaleString('vi-VN')}đ
                                </Typography>
                            </Box>

                            <Box sx={{ p: 1, borderRadius: '50%', bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                <ArrowForwardIcon sx={{ color: '#00AB55' }} />
                            </Box>

                            <Box>
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#00AB55', textTransform: 'uppercase' }}>HÓA ĐƠN MỚI</Typography>
                                <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#1C252E' }}>
                                    {(order.subtotal + Number(newShippingFee) - order.discountAmount).toLocaleString('vi-VN')}đ
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 1, gap: 2 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => setOpenConfirmDialog(false)}
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
                        onClick={handleUpdateShippingFee}
                        sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            fontWeight: 800,
                            bgcolor: '#00AB55',  // Changed from Indigo to Green
                            boxShadow: '0 8px 16px rgba(0, 171, 85, 0.24)',
                            '&:hover': { bgcolor: '#007B55', boxShadow: '0 12px 20px rgba(0, 171, 85, 0.32)' },
                            textTransform: 'none',
                            fontSize: '0.875rem'
                        }}
                    >
                        XÁC NHẬN & GỬI MAIL
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Cancel Order Dialog - reuse layout of Hủy đơn / Yêu cầu hoàn tiền */}
            <Dialog
                open={openCancelDialog}
                onClose={() => { setOpenCancelDialog(false); setCancelReason(''); }}
                PaperProps={{ sx: { borderRadius: '24px', p: 0, maxWidth: 520, width: '100%' } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 1 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#FFAB00', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <ReplayIcon sx={{ fontSize: '1.6rem' }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1C252E' }}>
                                Hủy đơn / Yêu cầu hoàn tiền
                            </Typography>
                            {order && (
                                <Typography sx={{ fontSize: '0.8rem', color: '#919EAB', mt: 0.3 }}>
                                    Mã đơn: <strong>{order.orderCode}</strong>
                                </Typography>
                            )}
                        </Box>
                    </Stack>
                    <IconButton onClick={() => { setOpenCancelDialog(false); setCancelReason(''); }} size="small" sx={{ bgcolor: '#F4F6F8' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ px: 4, py: 2 }}>
                    <Typography sx={{ mb: 2, fontSize: '0.9rem', color: '#637381' }}>
                        Đơn hàng có thể cần hủy / hoàn tiền. Vui lòng ghi rõ lý do để hệ thống ghi nhận và thông báo cho khách hàng.
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

                    {order?.cancelReason && (
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
                                    {order.cancelReason}
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 1, color: '#637381' }}>
                            Thông tin ngân hàng khách cung cấp
                        </Typography>
                        {customerBankInfo ? (
                            <Box
                                sx={{
                                    p: 1.5,
                                    bgcolor: '#EFF6FF',
                                    border: '1px solid #BFDBFE',
                                    borderRadius: '12px',
                                }}
                            >
                                <Typography sx={{ fontSize: '0.85rem', mb: 0.5 }}>
                                    Ngân hàng: <strong>{customerBankInfo.bankName}</strong> ({customerBankInfo.bankCode})
                                </Typography>
                                <Typography sx={{ fontSize: '0.85rem', mb: 0.5 }}>
                                    Số tài khoản: <strong>{customerBankInfo.accountNumber}</strong>
                                </Typography>
                                <Typography sx={{ fontSize: '0.85rem' }}>
                                    Chủ TK: <strong>{customerBankInfo.accountHolderName}</strong>
                                </Typography>
                            </Box>
                        ) : (
                            <Typography sx={{ fontSize: '0.8rem', color: '#919EAB' }}>
                                Không tìm thấy thông tin ngân hàng cho khách hàng này.
                            </Typography>
                        )}
                    </Box>

                    <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 1, color: '#637381' }}>
                            Ghi chú nội bộ cho việc hủy / hoàn tiền
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Ví dụ: Hủy theo yêu cầu khách, đã xác nhận sẽ hoàn tiền trong 3 ngày làm việc..."
                            sx={{
                                '& .MuiOutlinedInput-root': { borderRadius: '16px', fontSize: '0.85rem' }
                            }}
                        />
                        <Typography sx={{ mt: 0.5, fontSize: '0.75rem', color: '#919EAB', textAlign: 'right' }}>
                            {cancelReason.length}/500
                        </Typography>
                    </Box>

                    {(!order?.guestEmail?.trim() && !order?.user?.email?.trim()) && (
                        <Box sx={{ mb: 2, p: 1.5, borderRadius: '12px', bgcolor: '#FFF4E5', border: '1px solid #FFAB00' }}>
                            <Typography sx={{ fontSize: '0.85rem', color: '#B76E00', fontWeight: 600 }}>
                                ⚠ Đơn này không có email khách hàng. Thông báo qua email sẽ <strong>không được gửi</strong> khi Hủy duyệt hoặc Xác nhận hủy đơn. Bạn có thể cập nhật Email khách ở phần thông tin liên hệ trước khi thực hiện.
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ mb: 1.5, p: 1.5, borderRadius: '12px', bgcolor: '#F4F6F8' }}>
                        <Typography sx={{ fontSize: '0.8rem', color: '#637381' }}>
                            Thao tác này sẽ cập nhật đơn hàng sang trạng thái <strong>ĐÃ HỦY</strong>. Nhân viên cần thực hiện hoàn tiền
                            cho khách (nếu có) theo đúng quy trình.
                        </Typography>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 1, gap: 2 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => { setOpenCancelDialog(false); setCancelReason(''); }}
                        sx={{ py: 1.5, borderRadius: '12px', color: '#637381', borderColor: '#E5E8EB', fontWeight: 800 }}
                    >
                        Đóng
                    </Button>
                    {order?.latestRefundStatus === 'PENDING' && order.latestRefundId != null && (
                        <Button
                            fullWidth
                            variant="outlined"
                            color="error"
                            onClick={handleRejectRefund}
                            disabled={updating}
                            sx={{ py: 1.5, borderRadius: '12px', fontWeight: 800 }}
                        >
                            Hủy duyệt
                        </Button>
                    )}
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleCancelOrder}
                        disabled={updating || cancelReason.length < 5}
                        sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            fontWeight: 800,
                            bgcolor: '#FF5630',
                            boxShadow: '0 8px 16px rgba(255, 86, 48, 0.24)',
                            '&:hover': { bgcolor: '#B7211F' },
                            '&:disabled': { bgcolor: '#E5E8EB' }
                        }}
                    >
                        {updating ? 'Đang xử lý...' : 'Xác nhận hủy đơn'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Return Order Dialog */}
            <Dialog
                open={openReturnDialog}
                onClose={() => { setOpenReturnDialog(false); setCancelReason(''); }}
                PaperProps={{ sx: { borderRadius: '24px', p: 0, maxWidth: 500, width: '100%' } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 1 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#FFAB00', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <LocalShippingIcon sx={{ fontSize: '1.6rem' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1C252E' }}>Hoàn trả đơn hàng</Typography>
                    </Stack>
                    <IconButton onClick={() => { setOpenReturnDialog(false); setCancelReason(''); }} size="small" sx={{ bgcolor: '#F4F6F8' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ px: 4, py: 2 }}>
                    <Typography sx={{ mb: 3, fontSize: '1.4rem', color: '#637381' }}>
                        Đánh dấu đơn hàng này là hoàn trả (khách boom, không nhận hàng, trả lại...). Số lượng tồn kho sẽ được hoàn lại.
                    </Typography>

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Lý do hoàn trả"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="VD: Khách boom đơn, Không liên lạc được, Từ chối nhận hàng..."
                        sx={{
                            '& .MuiOutlinedInput-root': { borderRadius: '16px' },
                            '& label': { fontWeight: 700 }
                        }}
                    />
                    <Typography sx={{ mt: 1, fontSize: '1.2rem', color: '#919EAB', textAlign: 'right' }}>{cancelReason.length}/500</Typography>
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 1, gap: 2 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => { setOpenReturnDialog(false); setCancelReason(''); }}
                        sx={{ py: 1.5, borderRadius: '12px', color: '#637381', borderColor: '#E5E8EB', fontWeight: 800 }}
                    >
                        Đóng
                    </Button>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleReturnOrder}
                        disabled={updating || cancelReason.length < 5}
                        sx={{
                            py: 1.5, borderRadius: '12px', fontWeight: 800,
                            bgcolor: '#FFAB00', boxShadow: '0 8px 16px rgba(255, 171, 0, 0.24)',
                            '&:hover': { bgcolor: '#B76E00' },
                            '&:disabled': { bgcolor: '#E5E8EB' }
                        }}
                    >
                        {updating ? 'Đang xử lý...' : 'Xác nhận hoàn trả'}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Handle Return Request Dialog */}
            <Dialog
                open={openHandleReturnDialog}
                onClose={() => { setOpenHandleReturnDialog(false); setAdminReturnNote(''); }}
                PaperProps={{ sx: { borderRadius: '24px', p: 0, maxWidth: 500, width: '100%' } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 1 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: returnApproved ? '#00AB55' : '#FF5630', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            {returnApproved ? <CheckCircleOutlineIcon sx={{ fontSize: '1.8rem' }} /> : <CloseIcon sx={{ fontSize: '1.8rem' }} />}
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1C252E' }}>
                            {returnApproved ? 'Đồng ý Trả hàng' : 'Từ chối Trả hàng'}
                        </Typography>
                    </Stack>
                    <IconButton onClick={() => { setOpenHandleReturnDialog(false); setAdminReturnNote(''); }} size="small" sx={{ bgcolor: '#F4F6F8' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ px: 4, py: 2 }}>
                    <Typography sx={{ mb: 3, fontSize: '1.4rem', color: '#637381' }}>
                        {returnApproved
                            ? 'Đồng ý hoàn trả cho đơn hàng này. Trạng thái sẽ chuyển thành HOÀN TRẢ, tồn kho sẽ được hoàn lại.'
                            : 'Từ chối yêu cầu trả hàng. Đơn hàng sẽ quay lại trạng thái HOÀN THÀNH.'}
                    </Typography>

                    {!returnApproved && (
                        <Box sx={{ mb: 2 }}>
                            <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, mb: 1.5, color: '#637381' }}>Chọn lý do nhanh:</Typography>
                            <Stack spacing={1}>
                                {quickRejectReasons.map((reason) => {
                                    const isSelected = adminReturnNote === reason;
                                    return (
                                        <Box
                                            key={reason}
                                            onClick={() => setAdminReturnNote(reason)}
                                            sx={{
                                                p: 2,
                                                borderRadius: '12px',
                                                border: `2px solid ${isSelected ? '#FF5630' : '#F4F6F8'}`,
                                                bgcolor: isSelected ? 'rgba(255, 86, 48, 0.08)' : '#F9FAFB',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    bgcolor: isSelected ? 'rgba(255, 86, 48, 0.12)' : '#F4F6F8',
                                                    borderColor: isSelected ? '#FF5630' : '#DFE3E8'
                                                }
                                            }}
                                        >
                                            <Box sx={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: '50%',
                                                border: `2px solid ${isSelected ? '#FF5630' : '#C4CDD5'}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {isSelected && <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#FF5630' }} />}
                                            </Box>
                                            <Typography sx={{ fontWeight: isSelected ? 700 : 600, color: isSelected ? '#B71D18' : '#637381', fontSize: '1.2rem' }}>
                                                {reason}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>
                    )}
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Ghi chú phản hồi cho khách"
                        value={adminReturnNote}
                        onChange={(e) => setAdminReturnNote(e.target.value)}
                        placeholder="Nhập lý do chi tiết..."
                        sx={{
                            '& .MuiOutlinedInput-root': { borderRadius: '16px' },
                            '& label': { fontWeight: 700 }
                        }}
                    />
                    <Typography sx={{ mt: 1, fontSize: '1.2rem', color: '#919EAB', textAlign: 'right' }}>{adminReturnNote.length}/500</Typography>
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 1, gap: 2 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => { setOpenHandleReturnDialog(false); setAdminReturnNote(''); }}
                        sx={{ py: 1.5, borderRadius: '12px', color: '#637381', borderColor: '#E5E8EB', fontWeight: 800 }}
                    >
                        Đóng
                    </Button>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleProcessReturnRequest}
                        disabled={updating || adminReturnNote.trim().length < 5}
                        sx={{
                            py: 1.5, borderRadius: '12px', fontWeight: 800,
                            bgcolor: returnApproved ? '#00AB55' : '#FF5630',
                            boxShadow: `0 8px 16px ${returnApproved ? 'rgba(0, 171, 85, 0.24)' : 'rgba(255, 86, 48, 0.24)'}`,
                            '&:hover': { bgcolor: returnApproved ? '#007B55' : '#B7211F' },
                            '&:disabled': { bgcolor: '#E5E8EB' }
                        }}
                    >
                        {updating ? 'Đang xử lý...' : 'Xác nhận xử lý'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog nhập số tiền đã thu (đơn tại quầy - thanh toán tiền mặt) */}
            <Dialog
                open={openCashReceivedDialog}
                onClose={() => !updating && setOpenCashReceivedDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '24px', p: 0 } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, borderBottom: '1px solid #E5E8EB' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: '#00AB55', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <PaymentsIcon />
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#1C252E' }}>Xác nhận thu tiền mặt</Typography>
                    </Stack>
                    <IconButton onClick={() => !updating && setOpenCashReceivedDialog(false)} size="small" sx={{ bgcolor: '#F4F6F8' }} disabled={updating}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    <Stack spacing={2.5}>
                        <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#F4F6F8', border: '1px solid #E5E8EB' }}>
                            <Typography sx={{ fontSize: '0.75rem', color: '#919EAB', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>Số tiền cần thu</Typography>
                            <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#1C252E' }}>
                                {(order?.finalAmount ?? 0).toLocaleString('vi-VN')}₫
                            </Typography>
                        </Box>
                        <TextField
                            label="Số tiền đã thu"
                            value={cashReceivedAmount}
                            onChange={(e) => { setCashReceivedAmount(e.target.value); setCashReceivedError(''); }}
                            error={!!cashReceivedError}
                            helperText={cashReceivedError}
                            placeholder="Nhập số tiền khách đã thanh toán"
                            type="text"
                            inputMode="numeric"
                            InputProps={{
                                endAdornment: <InputAdornment position="end">₫</InputAdornment>
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />
                        <Typography sx={{ fontSize: '0.8125rem', color: '#637381' }}>
                            Nhân viên nhập số tiền đã thu từ khách và bấm Xác nhận để hoàn tất đơn hàng.
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 2, gap: 1 }}>
                    <Button onClick={() => setOpenCashReceivedDialog(false)} disabled={updating} sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}>
                        Hủy
                    </Button>
                    <Button variant="contained" onClick={handleConfirmCashReceived} disabled={updating} sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, bgcolor: '#00AB55', '&:hover': { bgcolor: '#007B55' } }}>
                        {updating ? 'Đang xử lý...' : 'Xác nhận'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Status Confirm Dialog */}
            <StatusConfirmDialog
                open={!!pendingStatus}
                onClose={() => setPendingStatus(null)}
                onConfirm={handleConfirmStatusChange}
                newStatus={pendingStatus || ''}
                isUpdating={updating}
                statusDisplayLabel={isCounterOrder && pendingStatus === 'CONFIRMED' ? 'Chờ thanh toán' : undefined}
            />

            {/* Xác nhận thanh toán (đơn online, chuyển khoản) – cùng giao diện như dialog chuyển trạng thái */}
            <StatusConfirmDialog
                open={openConfirmPaymentDialog}
                onClose={() => setOpenConfirmPaymentDialog(false)}
                onConfirm={handleConfirmPayment}
                newStatus="COMPLETED"
                isUpdating={updating}
                statusDisplayLabel="Đã thanh toán"
            />
        </Box>
    );
};
