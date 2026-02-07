import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
    Avatar
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
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
import { getOrderById, updateShippingFee, updateOrderStatus } from "../../api/order.api";
import { getShippingFeeSuggestion } from "../../api/shipping.api";
import { OrderResponse } from "../../../types/order.type";
import { COLORS } from "../product/configs/constants";


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

    useEffect(() => {
        if (id) {
            fetchOrder(id);
        }
    }, [id]);

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

    const getNextAction = (currentStatus: string) => {
        switch (currentStatus) {
            case 'CONFIRMED': return { status: 'PROCESSING', label: 'Bắt đầu đóng gói', color: '#16A34A', icon: <LocalShippingIcon /> };
            case 'PROCESSING': return { status: 'DELIVERING', label: 'Bắt đầu giao hàng', color: '#1064ad', icon: <LocalShippingIcon /> };
            case 'DELIVERING': return { status: 'DELIVERED', label: 'Xác nhận Đã giao thành công', color: '#118D57', icon: <CheckCircleOutlineIcon /> };
            // DELIVERED → COMPLETED: Do khách hàng tự nhấn "Đã nhận hàng"
            default: return null;
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        if (!id) return;
        setUpdating(true);
        try {
            const response = await updateOrderStatus(id, newStatus);
            if (response.success) {
                toast.success("Cập nhật trạng thái thành công");
                fetchOrder(id);
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



    const handleUpdateShippingFee = async () => {
        if (!order || !id) return;

        const fee = parseFloat(newShippingFee);
        if (isNaN(fee) || fee < 0) {
            toast.error("Phí vận chuyển không hợp lệ");
            return;
        }

        setUpdating(true);
        try {
            const response = await updateShippingFee(id, fee);
            if (response.success) {
                if (order.status === 'PENDING') {
                    await updateOrderStatus(id, 'CONFIRMED');
                    toast.success("Cập nhật phí & Xác nhận đơn hàng thành công");
                } else {
                    toast.success("Cập nhật phí vận chuyển thành công");
                }
                setOpenConfirmDialog(false);
                fetchOrder(id);
            } else {
                toast.error(response.message || "Cập nhật thất bại");
            }
        } catch (error) {
            console.error("Error updating shipping fee:", error);
            toast.error("Lỗi khi cập nhật phí vận chuyển");
        } finally {
            setUpdating(false);
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Chờ xác nhận';
            case 'CONFIRMED': return 'Đã xác nhận';
            case 'PROCESSING': return 'Đang đóng gói';
            case 'DELIVERING': return 'Đang giao hàng';
            case 'DELIVERED': return 'Đã giao hàng';
            case 'COMPLETED': return 'Hoàn thành';
            case 'CANCELLED': return 'Đã hủy';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return { bg: '#FFF7CD', color: '#B76E00' };
            case 'CONFIRMED': return { bg: '#D0F2FE', color: '#04297A' };
            case 'PROCESSING': return { bg: '#E9FCD4', color: '#229A16' };
            case 'DELIVERING': return { bg: '#D6E4FF', color: '#091A7A' };
            case 'DELIVERED':
            case 'COMPLETED': return { bg: '#E9FCD4', color: '#229A16' };
            case 'CANCELLED': return { bg: '#FFE7D9', color: '#B7211F' };
            default: return { bg: '#F4F6F8', color: '#919EAB' };
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

    return (
        <Box sx={{ pb: 8, bgcolor: '#F4F7F9', minHeight: '100vh' }}>
            {/* 1. Header (Balanced) */}
            <Box sx={{ p: 3, mb: 4, bgcolor: 'white', borderBottom: '1px solid #E5E8EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => window.history.back()}
                        sx={{ color: '#637381', fontWeight: 800, mb: 1, textTransform: 'none', fontSize: '1.3rem', '&:hover': { bgcolor: 'transparent', color: '#1C252E' } }}
                    >
                        Trở lại
                    </Button>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="h4" sx={{ fontWeight: 900, color: '#1C252E', letterSpacing: '-0.5px' }}>
                            #{order.orderCode}
                        </Typography>
                        <Chip
                            label={getStatusLabel(order.status)}
                            sx={{
                                fontWeight: 800,
                                fontSize: '1.2rem',
                                bgcolor: getStatusColor(order.status).bg,
                                color: getStatusColor(order.status).color,
                                borderRadius: '8px'
                            }}
                        />
                    </Stack>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<LocalPrintshopIcon />}
                    sx={{ borderRadius: '12px', px: 3, py: 1, fontWeight: 800, bgcolor: '#1C252E', textTransform: 'none', '&:hover': { bgcolor: '#333' } }}
                >
                    In hóa đơn
                </Button>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 400px' }, gap: 4, px: { xs: 2, md: 5 } }}>
                {/* Left Side (65%) */}
                <Box>
                    <Stack spacing={4}>
                        {/* Timeline Card - Horizontal */}
                        <Card sx={{ p: 4, borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #FFF', overflow: 'hidden' }}>
                            <Typography sx={{ fontWeight: 900, fontSize: '1.8rem', mb: 5, color: '#1C252E' }}>Trạng thái vận đơn</Typography>

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
                                    <Stack spacing={2} alignItems="center" sx={{ width: '25%' }}>
                                        <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#00AB55', border: '5px solid white', boxShadow: '0 0 0 1px #00AB55' }} />
                                        <Box textAlign="center">
                                            <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#1C252E', mb: 0.5 }}>Đã đặt hàng</Typography>
                                            <Typography sx={{ fontSize: '1.25rem', color: '#637381' }}>{new Date(order.createdAt).toLocaleString('vi-VN')}</Typography>
                                        </Box>
                                    </Stack>

                                    {/* Step 2: Confirmed/Processing */}
                                    <Stack spacing={2} alignItems="center" sx={{ width: '25%' }}>
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
                                            <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: order.status === 'PENDING' ? '#B76E00' : '#1C252E', mb: 0.5 }}>Chốt phí & Xác nhận</Typography>
                                            <Typography sx={{ fontSize: '1.25rem', color: '#637381' }}>
                                                {order.status === 'PENDING' ? 'Đang chờ xử lý...' : new Date(order.updatedAt).toLocaleDateString('vi-VN')}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    {/* Step 3: Delivering */}
                                    <Stack spacing={2} alignItems="center" sx={{ width: '25%' }}>
                                        <Box sx={{
                                            width: 28, height: 28, borderRadius: '50%',
                                            bgcolor: (['DELIVERING', 'DELIVERED', 'COMPLETED'].includes(order.status)) ? '#00AB55' : '#919EAB',
                                            border: '5px solid white',
                                            boxShadow: `0 0 0 1px ${(['DELIVERING', 'DELIVERED', 'COMPLETED'].includes(order.status)) ? '#00AB55' : '#919EAB'}`,
                                            animation: order.status === 'DELIVERING' ? 'pulse-blue 2s infinite' : 'none',
                                            '@keyframes pulse-blue': {
                                                '0%': { boxShadow: '0 0 0 0 rgba(24, 144, 255, 0.4)' },
                                                '70%': { boxShadow: '0 0 0 10px rgba(24, 144, 255, 0)' },
                                                '100%': { boxShadow: '0 0 0 0 rgba(24, 144, 255, 0)' }
                                            }
                                        }} />
                                        <Box textAlign="center">
                                            <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: order.status === 'DELIVERING' ? '#1064ad' : (['DELIVERED', 'COMPLETED'].includes(order.status) ? '#1C252E' : '#919EAB'), mb: 0.5 }}>
                                                Đang giao hàng
                                            </Typography>
                                            <Typography sx={{ fontSize: '1.25rem', color: '#919EAB' }}>
                                                {order.status === 'DELIVERING' ? 'Đang vận chuyển...' : (['DELIVERED', 'COMPLETED'].includes(order.status) ? 'Đã giao tới nơi' : 'Chờ vận chuyển')}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    {/* Step 4: Delivered/Completed */}
                                    <Stack spacing={2} alignItems="center" sx={{ width: '25%' }}>
                                        <Box sx={{
                                            width: 28, height: 28, borderRadius: '50%',
                                            bgcolor: (['DELIVERED', 'COMPLETED'].includes(order.status)) ? '#00AB55' : '#919EAB',
                                            border: '5px solid white',
                                            boxShadow: `0 0 0 1px ${(['DELIVERED', 'COMPLETED'].includes(order.status)) ? '#00AB55' : '#919EAB'}`
                                        }} />
                                        <Box textAlign="center">
                                            <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: (['DELIVERED', 'COMPLETED'].includes(order.status)) ? '#1C252E' : '#919EAB', mb: 0.5 }}>
                                                Giao hàng & Hoàn tất
                                            </Typography>
                                            <Typography sx={{ fontSize: '1.25rem', color: '#919EAB' }}>
                                                {(['DELIVERED', 'COMPLETED'].includes(order.status)) ? new Date(order.updatedAt).toLocaleDateString('vi-VN') : 'Dự kiến sau khi chốt'}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Stack>
                            </Box>
                        </Card>

                        {/* Customer Info (Section 2) */}
                        <Card sx={{ p: 4, borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #FFF' }}>
                            <Typography sx={{ fontWeight: 900, fontSize: '1.8rem', mb: 3, color: '#1C252E' }}>Thông tin khách hàng</Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1.5fr' }, gap: 4 }}>
                                <Box>
                                    <Typography sx={{ color: '#919EAB', fontWeight: 800, fontSize: '1.1rem', mb: 1.5, textTransform: 'uppercase' }}>Họ tên & SĐT</Typography>
                                    <Typography sx={{ fontWeight: 900, fontSize: '1.7rem', color: '#1C252E' }}>{order.shippingName}</Typography>
                                    <Typography sx={{ color: '#3F51B5', fontWeight: 800, fontSize: '1.6rem', mt: 0.5 }}>{order.shippingPhone}</Typography>
                                    <Typography sx={{ color: '#637381', fontWeight: 700, fontSize: '1.3rem', mt: 0.5 }}>
                                        {order.user?.email || order.guestEmail || 'Không có email'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography sx={{ color: '#919EAB', fontWeight: 800, fontSize: '1.1rem', mb: 1.5, textTransform: 'uppercase' }}>Địa chỉ nhận hàng</Typography>
                                    <Typography
                                        component="a"
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.shippingAddress)}`}
                                        target="_blank"
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: '1.5rem',
                                            lineHeight: 1.6,
                                            color: '#637381',
                                            textDecoration: 'none',
                                            '&:hover': { color: '#007B55', textDecoration: 'underline' }
                                        }}
                                    >
                                        {order.shippingAddress}
                                    </Typography>
                                    {order.distanceKm && (
                                        <Box /> /* Moved to Right Panel */
                                    )}                                </Box>
                            </Box>
                            {order.notes && (
                                <Box sx={{ mt: 3, p: 2.5, borderRadius: '16px', bgcolor: '#FFF5F5', border: '1px dashed #FF5630', display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ p: 1, borderRadius: '50%', bgcolor: 'rgba(255, 86, 48, 0.1)', color: '#FF5630' }}>📝</Box>
                                    <Box>
                                        <Typography sx={{ color: '#FF5630', fontWeight: 900, fontSize: '1.2rem' }}>GHI CHÚ:</Typography>
                                        <Typography sx={{ color: '#B71D18', fontSize: '1.4rem', fontWeight: 600 }}>"{order.notes}"</Typography>
                                    </Box>
                                </Box>
                            )}
                        </Card>

                        {/* Product List (Section 3) */}
                        <Card sx={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #FFF', overflow: 'hidden' }}>
                            <Box sx={{ p: 3, bgcolor: '#F8F9FA', borderBottom: '1px solid #F4F6F8', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <ShoppingBagIcon sx={{ color: '#1C252E' }} />
                                <Typography sx={{ fontWeight: 900, fontSize: '1.7rem', color: '#1C252E' }}>Chi tiết giỏ hàng ({order.orderItems.length})</Typography>
                            </Box>
                            <Stack divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
                                {order.orderItems.map((item) => (
                                    <Box key={item.id} sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3, '&:hover': { bgcolor: '#F9FAFB' } }}>
                                        <Badge badgeContent={item.quantity} color="primary" overlap="rectangular" anchorOrigin={{ vertical: 'top', horizontal: 'left' }}>
                                            <Avatar src={item.imageUrl} variant="rounded" sx={{ width: 80, height: 80, borderRadius: '16px', border: '1px solid #F4F6F8' }} />
                                        </Badge>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={{ fontWeight: 900, fontSize: '1.6rem', color: '#1C252E', mb: 0.5 }}>{item.productName}</Typography>
                                            <Typography sx={{ fontSize: '1.2rem', color: '#919EAB', fontWeight: 700 }}>SKU: {item.variantId || 'N/A'}</Typography>
                                            <Typography sx={{ fontSize: '1.25rem', color: '#637381', fontWeight: 600 }}>Phân loại: <Box component="span" sx={{ fontWeight: 800, color: '#3F51B5' }}>{item.variantName}</Box></Typography>
                                        </Box>
                                        <Box textAlign="right">
                                            <Typography sx={{ fontWeight: 900, fontSize: '1.8rem', color: '#1C252E' }}>{(item.unitPrice * item.quantity).toLocaleString('vi-VN')}₫</Typography>
                                            <Typography sx={{ fontSize: '1.25rem', color: '#919EAB', fontWeight: 600 }}>{item.unitPrice.toLocaleString('vi-VN')}₫ x {item.quantity}</Typography>
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
                        {/* Shipping Control Card - Only for PENDING */}
                        {order.status === 'PENDING' && (
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
                                        <LocalShippingIcon sx={{ fontSize: '2.2rem' }} />
                                    </Box>
                                    <Typography sx={{ fontWeight: 900, fontSize: '1.9rem', color: '#1C252E', letterSpacing: '-0.3px', flex: 1 }}>Vận hành Giao nhận</Typography>
                                    {order?.distanceKm && (
                                        <Chip
                                            icon={<LocationOnOutlinedIcon style={{ fontSize: '1.4rem', color: '#00AB55' }} />}
                                            label={`Cách cửa hàng: ${order.distanceKm} km`}
                                            size="small"
                                            sx={{
                                                bgcolor: 'rgba(0, 171, 85, 0.1)',
                                                color: '#007B55',
                                                fontWeight: 800,
                                                fontSize: '1.2rem',
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
                                                    endAdornment: <InputAdornment position="end"><Typography sx={{ fontWeight: 800, color: '#919EAB', fontSize: '1.2rem' }}>km</Typography></InputAdornment>,
                                                    sx: { fontSize: '1.8rem', fontWeight: 900, py: 0.5 }
                                                }}
                                                sx={{ '& label': { fontSize: '1.1rem', fontWeight: 800, color: '#919EAB', letterSpacing: '0.5px' }, '& .MuiInput-underline:after': { borderBottomColor: '#00AB55' } }}
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
                                                    endAdornment: <InputAdornment position="end"><Typography sx={{ fontWeight: 800, color: '#919EAB', fontSize: '1.2rem' }}>kg</Typography></InputAdornment>,
                                                    sx: { fontSize: '1.8rem', fontWeight: 900, py: 0.5 }
                                                }}
                                                sx={{ '& label': { fontSize: '1.1rem', fontWeight: 800, color: '#919EAB', letterSpacing: '0.5px' }, '& .MuiInput-underline:after': { borderBottomColor: '#00AB55' } }}
                                            />
                                        </Box>
                                    </Stack>

                                    {distance > 10 && (
                                        <Box sx={{ px: 2, py: 1.5, bgcolor: '#F0FDF4', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: 1.5, border: '1px dashed #00AB55' }}>
                                            <Typography sx={{ color: '#007B55', fontWeight: 800, fontSize: '1.15rem' }}>
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
                                        alignItems: 'center'
                                    }}>
                                        <Typography sx={{ color: '#94A3B8', fontWeight: 800, fontSize: '1.1rem', mb: 0.5, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Đề xuất hệ thống</Typography>

                                        {fetchingSuggestion ? (
                                            <CircularProgress size={24} sx={{ my: 2, color: '#00AB55' }} />
                                        ) : suggestionStatus === 'UNKNOWN_RULE' ? (
                                            <Box sx={{ mb: 2, textAlign: 'center' }}>
                                                <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#FFAB00', mb: 1 }}>
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
                                        ) : suggestionStatus === 'FREE_SHIP' ? (
                                            <Box sx={{ mb: 2, textAlign: 'center' }}>
                                                <Typography sx={{ fontWeight: 800, fontSize: '1.8rem', color: '#00AB55', mb: 0.5 }}>
                                                    MIỄN PHÍ VẬN CHUYỂN
                                                </Typography>
                                                <Typography sx={{ fontWeight: 600, fontSize: '1.1rem', color: '#637381' }}>
                                                    Đơn hàng đủ điều kiện Freeship
                                                </Typography>
                                            </Box>
                                        ) : suggestionStatus === 'OUT_OF_RANGE' ? (
                                            <Box sx={{ mb: 2, textAlign: 'center' }}>
                                                <Typography sx={{ fontWeight: 800, fontSize: '1.8rem', color: '#FF5630', mb: 0.5 }}>
                                                    QUÁ XA
                                                </Typography>
                                                <Typography sx={{ fontWeight: 600, fontSize: '1.1rem', color: '#637381' }}>
                                                    Vượt quá giới hạn giao hàng
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography sx={{ fontWeight: 900, fontSize: '2.8rem', color: '#00AB55', mb: 1.5 }}>
                                                {suggestedFee.toLocaleString('vi-VN')}₫
                                            </Typography>
                                        )}

                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                size="small"
                                                onClick={() => setNewShippingFee(suggestedFee.toString())}
                                                sx={{ borderRadius: '8px', px: 2, fontWeight: 800, color: '#00AB55', fontSize: '1.1rem', bgcolor: 'rgba(0, 171, 85, 0.08)', '&:hover': { bgcolor: 'rgba(0, 171, 85, 0.15)' } }}
                                            >
                                                Áp dụng giá này
                                            </Button>
                                            <Button
                                                size="small"
                                                onClick={() => setNewShippingFee('0')}
                                                sx={{ borderRadius: '8px', px: 2, fontWeight: 800, color: '#FF5630', fontSize: '1.1rem', '&:hover': { bgcolor: 'rgba(255, 86, 48, 0.08)' } }}
                                            >
                                                Đặt 0đ (Freeship)
                                            </Button>
                                        </Stack>
                                    </Box>

                                    <Box>
                                        <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#919EAB', mb: 1, ml: 1, textTransform: 'uppercase', letterSpacing: '1px' }}>Phí ship cuối cùng</Typography>
                                        <TextField
                                            fullWidth
                                            value={newShippingFee}
                                            onChange={(e) => setNewShippingFee(e.target.value)}
                                            placeholder="0"
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 900, fontSize: '1.4rem', color: '#00AB55' }}>₫</Typography></InputAdornment>,
                                                sx: {
                                                    borderRadius: '16px',
                                                    bgcolor: 'white',
                                                    border: '1px solid #E5E8EB',
                                                    '& input': { fontWeight: 900, fontSize: '2.2rem', textAlign: 'center', color: '#00AB55', py: 1.5 }
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
                            <Typography sx={{ fontWeight: 900, fontSize: '1.8rem', mb: 4, color: '#1C252E', letterSpacing: '-0.5px' }}>Tổng kết thanh toán</Typography>

                            <Stack spacing={2.5}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '1.4rem', color: '#919EAB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tạm tính</Typography>
                                    <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#1C252E' }}>{order.subtotal.toLocaleString('vi-VN')}₫</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '1.4rem', color: '#919EAB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phí vận chuyển</Typography>
                                    <Typography sx={{ fontWeight: 900, fontSize: '1.5rem', color: '#00AB55' }}>+{Number(newShippingFee).toLocaleString('vi-VN')}₫</Typography>
                                </Box>
                                {order.discountAmount > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: '1.4rem', color: '#FF5630', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Giảm giá</Typography>
                                        <Typography sx={{ fontWeight: 900, fontSize: '1.5rem', color: '#FF5630' }}>-{order.discountAmount.toLocaleString('vi-VN')}₫</Typography>
                                    </Box>
                                )}

                                <Divider sx={{ borderColor: '#F4F6F8', my: 1, borderStyle: 'dashed' }} />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pt: 1 }}>
                                    <Typography sx={{ fontWeight: 900, fontSize: '1.5rem', color: '#1C252E', mb: 0.5 }}>TỔNG CỘNG</Typography>
                                    <Typography sx={{ fontWeight: 900, fontSize: '3rem', color: '#007B55', textAlign: 'right', lineHeight: 1, letterSpacing: '-1px' }}>
                                        {(order.subtotal + Number(newShippingFee) - order.discountAmount).toLocaleString('vi-VN')}₫
                                    </Typography>
                                </Box>
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2, p: 2, borderRadius: '16px', bgcolor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                                    <Box sx={{
                                        width: 32, height: 32, borderRadius: '10px', bgcolor: 'rgba(255, 171, 0, 0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <PaymentsIcon sx={{ fontSize: '1.8rem', color: '#FFAB00' }} />
                                    </Box>
                                    <Stack spacing={0}>
                                        <Typography sx={{ fontSize: '1.2rem', color: '#919EAB', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hình thức</Typography>
                                        <Typography sx={{ fontSize: '1.4rem', color: '#1C252E', fontWeight: 800 }}>{order.payments[0]?.paymentMethod === 'CASH' ? 'Thanh toán khi nhận hàng' : 'Đã thanh toán Online'}</Typography>
                                    </Stack>
                                </Stack>
                            </Stack>
                        </Card>

                        {/* General Status Steps Support */}
                        {order.status !== 'PENDING' && !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(order.status) && (
                            <Card sx={{
                                p: 3.5,
                                borderRadius: '32px',
                                border: '1px solid rgba(255, 255, 255, 0.8)',
                                boxShadow: '0 8px 32px rgba(145, 158, 171, 0.1), 0 1px 2px rgba(145, 158, 171, 0.2)',
                                background: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(10px)',
                            }}>
                                <Typography sx={{ fontWeight: 900, fontSize: '1.8rem', mb: 3, color: '#1C252E' }}>Bước xử lý tiếp theo</Typography>
                                <Stack spacing={2.5}>
                                    {getNextAction(order.status) && (
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            startIcon={getNextAction(order.status)?.icon}
                                            onClick={() => getNextAction(order.status) && handleUpdateStatus(getNextAction(order.status)!.status)}
                                            disabled={updating}
                                            sx={{
                                                py: 2,
                                                borderRadius: '20px',
                                                fontSize: '1.6rem',
                                                fontWeight: 900,
                                                textTransform: 'none',
                                                bgcolor: getNextAction(order.status)?.color,
                                                '&:hover': { bgcolor: getNextAction(order.status)?.color, filter: 'brightness(0.9)' }
                                            }}
                                        >
                                            {updating ? 'Đang xử lý...' : getNextAction(order.status)?.label}
                                        </Button>
                                    )}

                                    {!['DELIVERED', 'COMPLETED'].includes(order.status) && (
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            color="error"
                                            onClick={() => handleUpdateStatus('CANCELLED')}
                                            disabled={updating}
                                            sx={{
                                                py: 1.5,
                                                borderRadius: '20px',
                                                fontSize: '1.4rem',
                                                fontWeight: 800,
                                                textTransform: 'none',
                                                borderWidth: '2px',
                                                '&:hover': { borderWidth: '2px' }
                                            }}
                                        >
                                            Hủy đơn hàng
                                        </Button>
                                    )}

                                    <Typography sx={{ fontSize: '1.2rem', color: '#637381', textAlign: 'center', fontStyle: 'italic', mt: 1 }}>
                                        * Nhấn nút để thực hiện bước chuyển đổi trạng thái tiếp theo.
                                    </Typography>
                                </Stack>
                            </Card>
                        )}

                        <Box sx={{ px: 1 }}>
                            {order.status === 'PENDING' ? (
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    onClick={() => setOpenConfirmDialog(true)}
                                    disabled={updating}
                                    sx={{
                                        py: 2.5,
                                        borderRadius: '24px',
                                        fontSize: '1.8rem',
                                        fontWeight: 900,
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
                            ) : (
                                <Typography sx={{ textAlign: 'center', color: '#919EAB', fontWeight: 700, fontSize: '1.4rem' }}>
                                    Đơn hàng đã được xác nhận & chốt phí.
                                </Typography>
                            )}
                        </Box>
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
                            <Box component="span" sx={{ fontSize: '1.4rem', fontWeight: 900 }}>i</Box>
                        </Box>
                        <Typography sx={{ fontWeight: 900, fontSize: '1.8rem', color: '#1C252E' }}>Xác nhận Chi tiết Vận chuyển</Typography>
                    </Stack>
                    <IconButton onClick={() => setOpenConfirmDialog(false)} size="small" sx={{ bgcolor: '#F4F6F8' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ px: 4, py: 2 }}>
                    {/* Customer Info */}
                    <Stack spacing={1.5} sx={{ mb: 3, mt: 1 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <PersonOutlineIcon sx={{ color: '#00AB55', fontSize: '2rem' }} />
                            <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#919EAB', textTransform: 'uppercase' }}>
                                KHÁCH HÀNG: <Box component="span" sx={{ color: '#1C252E', fontWeight: 900 }}>{order.shippingName.toUpperCase()}</Box>
                            </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            <LocationOnOutlinedIcon sx={{ color: '#FF5630', fontSize: '2rem' }} />
                            <Typography sx={{ fontSize: '1.35rem', fontWeight: 700, color: '#1C252E' }}>
                                Giao đến: {order.shippingAddress}
                            </Typography>
                        </Stack>
                    </Stack>

                    {/* Fee Details Box */}
                    <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', mb: 3 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                            <LocalShippingIcon sx={{ color: '#16A34A', fontSize: '1.8rem' }} />
                            <Typography sx={{ fontWeight: 900, color: '#16A34A', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                CHI TIẾT ĐỀ XUẤT HỆ THỐNG
                            </Typography>
                        </Stack>

                        <Stack spacing={1.5}>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography sx={{ fontSize: '1.25rem', color: '#15803D', fontWeight: 600, fontStyle: 'italic' }}>
                                    Quãng đường ({distance} km x {(breakdown?.feePerKm || 3000).toLocaleString('vi-VN')}₫)
                                </Typography>
                                <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#166534' }}>
                                    {(distance * (breakdown?.feePerKm || 3000)).toLocaleString('vi-VN')}đ
                                </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography sx={{ fontSize: '1.25rem', color: '#15803D', fontWeight: 600, fontStyle: 'italic' }}>
                                    Phụ khí cân nặng (Dồi dư {weight > (breakdown?.baseWeight || 1) ? (weight - (breakdown?.baseWeight || 1)).toFixed(1) : 0} kg)
                                </Typography>
                                <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#166534' }}>
                                    {(weight > (breakdown?.baseWeight || 1) ? (weight - (breakdown?.baseWeight || 1)) * (breakdown?.overWeightFee || 0) : 0).toLocaleString('vi-VN')}đ
                                </Typography>
                            </Stack>

                            <Divider sx={{ borderColor: '#BBF7D0', borderStyle: 'dashed', my: 1 }} />

                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography sx={{ fontSize: '1.2rem', color: '#166534', fontWeight: 900, textTransform: 'uppercase' }}>
                                    PHÍ SHIP CHỐT CUỐI CÙNG
                                </Typography>
                                <Typography sx={{ fontSize: '2.2rem', fontWeight: 900, color: '#15803D', textUnderlineOffset: '4px' }}>
                                    {Number(newShippingFee).toLocaleString('vi-VN')}đ
                                </Typography>
                            </Stack>
                        </Stack>
                    </Box>

                    {/* Total Comparison */}
                    <Box sx={{ p: 2, borderRadius: '16px', bgcolor: '#F8FAFC', border: '1px solid #F1F5F9', textAlign: 'center' }}>
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={4}>
                            <Box>
                                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#919EAB', textTransform: 'uppercase' }}>TỔNG CŨ</Typography>
                                <Typography sx={{ fontSize: '1.8rem', fontWeight: 700, color: '#919EAB', textDecoration: 'line-through' }}>
                                    {order.finalAmount.toLocaleString('vi-VN')}đ
                                </Typography>
                            </Box>

                            <Box sx={{ p: 1, borderRadius: '50%', bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                <ArrowForwardIcon sx={{ color: '#00AB55' }} />
                            </Box>

                            <Box>
                                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#00AB55', textTransform: 'uppercase' }}>HÓA ĐƠN MỚI</Typography>
                                <Typography sx={{ fontSize: '2.2rem', fontWeight: 900, color: '#1C252E' }}>
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
                            fontSize: '1.1rem'
                        }}
                    >
                        XÁC NHẬN & GỬI MAIL
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
