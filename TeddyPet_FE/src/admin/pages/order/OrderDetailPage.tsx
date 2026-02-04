import { useState, useEffect, useMemo } from "react";
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
import { toast } from "react-toastify";

import { prefixAdmin } from "../../constants/routes";
import { getOrderById, updateShippingFee, updateOrderStatus } from "../../api/order.api";
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

    useEffect(() => {
        if (id) {
            fetchOrder(id);
        }
    }, [id]);

    const fetchOrder = async (orderId: string) => {
        setLoading(true);
        try {
            const response = await getOrderById(orderId);
            if (response.success && response.data) {
                setOrder(response.data);
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


    const suggestedFee = useMemo(() => {
        const baseFee = distance * 5000;
        const excessWeight = Math.max(0, weight - 2);
        const weightSurcharge = excessWeight * 5000;
        return baseFee + weightSurcharge;
    }, [distance, weight]);

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
                            label={order.status === 'PENDING' ? 'Đang chờ' : order.status}
                            sx={{
                                fontWeight: 800,
                                fontSize: '1.2rem',
                                bgcolor: '#FFF7CD',
                                color: '#B76E00',
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
                        {/* Timeline Card */}
                        <Card sx={{ p: 4, borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #FFF' }}>
                            <Typography sx={{ fontWeight: 900, fontSize: '1.8rem', mb: 3, color: '#1C252E' }}>Trạng thái vận đơn</Typography>
                            <Box sx={{ pl: 2, position: 'relative' }}>
                                <Box sx={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '2px', bgcolor: '#F4F6F8', zIndex: 0 }} />
                                <Stack spacing={4}>
                                    <Stack direction="row" spacing={3} alignItems="flex-start" sx={{ position: 'relative', zIndex: 1 }}>
                                        <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#00AB55', border: '5px solid white', boxShadow: '0 0 0 1px #00AB55' }} />
                                        <Box>
                                            <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#1C252E' }}>Đã đặt hàng</Typography>
                                            <Typography sx={{ fontSize: '1.25rem', color: '#637381' }}>{new Date(order.createdAt).toLocaleString('vi-VN')}</Typography>
                                        </Box>
                                    </Stack>
                                    <Stack direction="row" spacing={3} alignItems="flex-start" sx={{ position: 'relative', zIndex: 1 }}>
                                        <Box sx={{
                                            width: 24, height: 24, borderRadius: '50%',
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
                                        <Box>
                                            <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: order.status === 'PENDING' ? '#B76E00' : '#1C252E' }}>Chốt phí & Xác nhận</Typography>
                                            <Typography sx={{ fontSize: '1.25rem', color: '#637381' }}>
                                                {order.status === 'PENDING' ? 'Đang chờ admin chốt phí vận chuyển' : `Xác nhận lúc ${new Date(order.updatedAt).toLocaleString('vi-VN')}`}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    <Stack direction="row" spacing={3} alignItems="flex-start" sx={{ position: 'relative', zIndex: 1, opacity: 0.4 }}>
                                        <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#919EAB', border: '5px solid white', boxShadow: '0 0 0 1px #919EAB' }} />
                                        <Box>
                                            <Typography sx={{ fontWeight: 800, fontSize: '1.5rem' }}>Giao hàng & Hoàn tất</Typography>
                                            <Typography sx={{ fontSize: '1.25rem' }}>Dự kiến giao sau khi chốt đơn</Typography>
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
                                </Box>
                                <Box>
                                    <Typography sx={{ color: '#919EAB', fontWeight: 800, fontSize: '1.1rem', mb: 1.5, textTransform: 'uppercase' }}>Địa chỉ nhận hàng</Typography>
                                    <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.6, color: '#637381' }}>{order.shippingAddress}</Typography>
                                </Box>
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
                        {/* Shipping Widget */}
                        <Card sx={{ p: 4, borderRadius: '24px', boxShadow: '0 10px 40px rgba(0, 167, 111, 0.12)', border: '1px solid rgba(0, 167, 111, 0.2)' }}>
                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                                <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(0, 167, 111, 0.1)', display: 'flex' }}>
                                    <LocalShippingIcon sx={{ color: '#00A76F' }} />
                                </Box>
                                <Typography sx={{ fontWeight: 900, fontSize: '1.7rem', color: '#1C252E' }}>Vận chuyển</Typography>
                            </Stack>

                            <Stack spacing={3}>
                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        label="Khoảng cách"
                                        type="number"
                                        value={distance}
                                        onChange={(e) => setDistance(Number(e.target.value))}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                        InputProps={{ endAdornment: <InputAdornment position="end">km</InputAdornment> }}
                                    />
                                    <TextField
                                        label="Khối lượng"
                                        type="number"
                                        value={weight}
                                        onChange={(e) => setWeight(Number(e.target.value))}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                        InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }}
                                    />
                                </Stack>

                                {distance > 10 && (
                                    <Box sx={{ p: 2, bgcolor: '#FFF5F5', borderRadius: '12px', border: '1px solid #FFD5D5' }}>
                                        <Typography sx={{ color: '#FF5630', fontWeight: 800, fontSize: '1.2rem', textAlign: 'center' }}>
                                            ⚠️ Khoảng cách xa ({'>'}10km). Ưu tiên Book App!
                                        </Typography>
                                    </Box>
                                )}

                                <Box sx={{ p: 2.5, bgcolor: '#F4F6F8', borderRadius: '20px', textAlign: 'center' }}>
                                    <Typography sx={{ color: '#637381', fontWeight: 800, fontSize: '1.2rem', mb: 1, textTransform: 'uppercase', letterSpacing: '1px' }}>Phí gợi ý</Typography>
                                    <Typography sx={{ fontWeight: 900, fontSize: '2.4rem', color: '#006C9C' }}>{suggestedFee.toLocaleString('vi-VN')}₫</Typography>
                                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
                                        <Button size="small" variant="text" onClick={() => setNewShippingFee(suggestedFee.toString())} sx={{ fontWeight: 800, color: '#006C9C', textTransform: 'none' }}>Dùng giá này</Button>
                                        <Button size="small" variant="text" onClick={() => setNewShippingFee('0')} sx={{ fontWeight: 800, color: '#FF5630', textTransform: 'none' }}>Freeship</Button>
                                    </Stack>
                                </Box>

                                <TextField
                                    fullWidth
                                    label="Phí ship chốt"
                                    value={newShippingFee}
                                    onChange={(e) => setNewShippingFee(e.target.value)}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">₫</InputAdornment>,
                                        sx: { borderRadius: '16px', bgcolor: 'white', '& input': { fontWeight: 900, fontSize: '2.6rem', textAlign: 'center', color: '#B71D18' } }
                                    }}
                                />
                            </Stack>
                        </Card>

                        {/* Payment Summary - NO LONGER DARK MODE */}
                        <Card sx={{ p: 4, borderRadius: '24px', bgcolor: 'white', boxShadow: '0 12px 40px rgba(63, 81, 181, 0.08)', border: '1px solid rgba(63, 81, 181, 0.1)' }}>
                            <Typography sx={{ fontWeight: 900, fontSize: '1.7rem', mb: 3, color: '#1C252E' }}>Tổng kết thanh toán</Typography>
                            <Stack spacing={2.5}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#637381' }}>Tạm tính</Typography>
                                    <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#1C252E' }}>{order.subtotal.toLocaleString('vi-VN')}₫</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#637381' }}>Phí vận chuyển</Typography>
                                    <Typography sx={{ fontWeight: 900, fontSize: '1.5rem', color: '#00A76F' }}>+{Number(newShippingFee).toLocaleString('vi-VN')}₫</Typography>
                                </Box>
                                {order.discountAmount > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#FF5630' }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: '1.5rem' }}>Giảm giá</Typography>
                                        <Typography sx={{ fontWeight: 900, fontSize: '1.5rem' }}>-{order.discountAmount.toLocaleString('vi-VN')}₫</Typography>
                                    </Box>
                                )}
                                <Divider sx={{ borderColor: '#F4F6F8', my: 1, borderStyle: 'dashed' }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pt: 1 }}>
                                    <Typography sx={{ fontWeight: 900, fontSize: '1.6rem', color: '#1C252E' }}>TỔNG CỘNG</Typography>
                                    <Typography sx={{ fontWeight: 900, fontSize: '3.2rem', color: '#FF5630', textAlign: 'right', lineHeight: 1 }}>
                                        {(order.subtotal + Number(newShippingFee) - order.discountAmount).toLocaleString('vi-VN')}₫
                                    </Typography>
                                </Box>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2, p: 2, borderRadius: '16px', bgcolor: '#F4F7F9' }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#FFAB00' }} />
                                    <Typography sx={{ fontSize: '1.3rem', color: '#1C252E', fontWeight: 800 }}>{order.payments[0]?.paymentMethod === 'CASH' ? 'Thanh toán COD' : 'Đã thanh toán Online'}</Typography>
                                </Stack>
                            </Stack>
                        </Card>

                        <Box sx={{ px: 1 }}>
                            <Typography sx={{ fontSize: '1.3rem', color: '#637381', textAlign: 'center', mb: 2, fontWeight: 700, lineHeight: 1.5 }}>
                                {order.status === 'PENDING' ? `⚠️ Xác nhận đơn hàng trị giá: ${(order.subtotal + Number(newShippingFee) - order.discountAmount).toLocaleString('vi-VN')}₫` : 'Đơn hàng này đã được xác nhận'}
                            </Typography>
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={() => setOpenConfirmDialog(true)}
                                disabled={order.status !== 'PENDING' || updating}
                                sx={{
                                    py: 2.5, borderRadius: '20px', fontSize: '1.8rem', fontWeight: 900, textTransform: 'none',
                                    bgcolor: '#3F51B5', boxShadow: '0 8px 24px rgba(63, 81, 181, 0.3)',
                                    '&:hover': { bgcolor: '#303F9F', boxShadow: '0 12px 32px rgba(63, 81, 181, 0.4)' }
                                }}
                            >
                                {updating ? 'Đang xử lý...' : 'XÁC NHẬN ĐƠN HÀNG'}
                            </Button>
                        </Box>
                    </Stack>
                </Box>
            </Box>

            {/* Confirm Logic Dialog (2 Steps) */}
            <Dialog
                open={openConfirmDialog}
                onClose={() => setOpenConfirmDialog(false)}
                PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 900, fontSize: '2.2rem', textAlign: 'center', pb: 1 }}>Xác nhận phí ship?</DialogTitle>
                <DialogContent sx={{ textAlign: 'center', pb: 3 }}>
                    <Typography sx={{ fontSize: '1.6rem', color: 'text.secondary', mb: 3 }}>
                        Tổng giá trị đơn hàng sẽ thay đổi thành:
                    </Typography>
                    <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                        <Typography sx={{ fontSize: '1.8rem', color: '#919EAB', textDecoration: 'line-through' }}>{order.finalAmount.toLocaleString('vi-VN')}₫</Typography>
                        <Box sx={{ px: 2, py: 1, bgcolor: '#C8FACD', borderRadius: '12px' }}>
                            <Typography sx={{ fontSize: '2.4rem', fontWeight: 900, color: '#007B55' }}>
                                {(order.subtotal + Number(newShippingFee) - order.discountAmount).toLocaleString('vi-VN')}₫
                            </Typography>
                        </Box>
                    </Stack>
                    <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color: '#FF5630', bgcolor: '#FFF5F5', p: 2, borderRadius: '12px' }}>
                        ⚠️ Hành động này sẽ chuyển trạng thái đơn hàng sang "ĐÃ XÁC NHẬN"
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 4, gap: 2 }}>
                    <Button
                        fullWidth
                        variant="text"
                        onClick={() => {
                            setNewShippingFee('0');
                            handleUpdateShippingFee();
                        }}
                        sx={{ fontSize: '1.4rem', fontWeight: 800, py: 1.5, borderRadius: '12px', bgcolor: '#F4F6F8', color: '#637381' }}
                    >
                        MIỄN PHÍ SHIP
                    </Button>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleUpdateShippingFee}
                        sx={{ fontSize: '1.4rem', fontWeight: 800, py: 1.5, borderRadius: '12px', bgcolor: '#3F51B5' }}
                    >
                        XÁC NHẬN PHÍ
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
