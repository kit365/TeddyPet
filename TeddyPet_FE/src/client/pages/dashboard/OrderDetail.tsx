import { format } from "date-fns";
import { showConfirmDialog } from "../../../utils/confirmation";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "./sections/DashboardLayout";
import { useOrderDetail } from "../../hooks/useOrderDetail";
import {
    CheckCircle,
    NavArrowRight,
    Package,
    Truck,
    Box as BoxIcon,
    ClipboardCheck,
    HomeSimple,
    WarningCircle,
    RefreshDouble,
    MapPin,
    Phone,
    Copy,
    ChatBubble,
    HelpCircle,
    Calendar,
    Wallet,
    ShieldCheck,
    Star,
    Download,
    InfoCircle,
    Eye
} from "iconoir-react";
import { toast } from "react-toastify";
import { useState, useEffect, useRef } from "react";
import { CancelOrderModal } from "./sections/CancelOrderModal";
import { RefundRequestModal } from "./sections/RefundRequestModal";
import { confirmReceived, cancelOrder, requestReturn, downloadMyOrderInvoice, createPaymentUrl, getOrderRefundRequests, createOrderRefundRequest, updateOrderRefundRequest } from "../../../api/order.api";
import { createGuestBankInformationByOrderCode } from "../../../api/bank.api";
import { ORDER_STATUS_MAP } from "../../../constants/status";
import { getOrderShippingFeeLabel } from "../../utils/orderShippingDisplay";
import { OrderRefundResponse } from "../../../types/order.type";
import { useLocation, useNavigate } from "react-router-dom";

// Component Stepper Siêu Cấp
const OrderStepper = ({ status }: { status: string }) => {
    const baseSteps = [
        { key: 'PENDING', label: ORDER_STATUS_MAP.PENDING.label, icon: <ClipboardCheck width={24} height={24} /> },
        { key: 'CONFIRMED', label: ORDER_STATUS_MAP.CONFIRMED.label, icon: <CheckCircle width={24} height={24} /> },
        { key: 'PAID', label: ORDER_STATUS_MAP.PAID.label, icon: <Wallet width={24} height={24} /> },
        { key: 'PROCESSING', label: ORDER_STATUS_MAP.PROCESSING.label, icon: <BoxIcon width={24} height={24} /> },
        { key: 'DELIVERING', label: ORDER_STATUS_MAP.DELIVERING.label, icon: <Truck width={24} height={24} /> },
        { key: 'DELIVERED', label: ORDER_STATUS_MAP.DELIVERED.label, icon: <HomeSimple width={24} height={24} /> },
        { key: 'COMPLETED', label: ORDER_STATUS_MAP.COMPLETED.label, icon: <Package width={24} height={24} /> },
    ];

    const isCancelled = status === 'CANCELLED';
    const isRefunding = status === 'REFUND_PENDING';
    const isRefunded = status === 'REFUNDED';
    const isReturned = status === 'RETURNED';
    const isReturnRequested = status === 'RETURN_REQUESTED';

    // Terminal/Divergent Status
    const isDivergent = isCancelled || isRefunding || isRefunded || isReturned || isReturnRequested;

    let finalSteps = [...baseSteps];
    let effectiveIdx = baseSteps.findIndex(s => s.key === status);

    if (isDivergent) {
        const terminalStep = {
            key: status,
            label: isCancelled ? 'Đã hủy' : (isRefunding ? 'Chờ hoàn tiền' : (isRefunded ? 'Đã hoàn tiền' : (isReturned ? 'Hoàn trả' : 'Đang trả hàng'))),
            icon: isCancelled ? <WarningCircle width={24} height={24} /> : (isRefunding || isRefunded || isReturned || isReturnRequested ? <RefreshDouble width={24} height={24} /> : <Package width={24} height={24} />)
        };

        // Determine where to cut the timeline
        let cutIdx = baseSteps.length;
        if (isCancelled) {
            // Cancel usually happens before shipping
            cutIdx = 4; // Up to PROCESSING
        } else if (isRefunding || isRefunded) {
            cutIdx = 4; // Up to PROCESSING
        } else if (isReturned || isReturnRequested) {
            cutIdx = 6; // Up to DELIVERED
        }

        finalSteps = [...baseSteps.slice(0, cutIdx), terminalStep];
        effectiveIdx = finalSteps.length - 1;
    }

    const isCompleted = status === 'COMPLETED';

    return (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-4 animate-fadeIn">
            <div className="relative flex items-center justify-between px-2">
                <div className="absolute top-6 left-[8%] right-[8%] h-[2px] bg-gray-100 -z-0 rounded-full"></div>
                <div
                    className={`absolute top-6 left-[8%] h-[2px] transition-all duration-[1200ms] ease-in-out -z-0 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-client-primary'}`}
                    style={{ width: effectiveIdx > 0 ? `${(effectiveIdx / (finalSteps.length - 1)) * 84}%` : '0%' }}
                ></div>

                {finalSteps.map((step, index) => {
                    const isActive = index <= effectiveIdx;
                    const isCurrent = index === effectiveIdx;

                    let dotBgColor = isActive ? (isCompleted ? 'bg-emerald-500 shadow-emerald-200' : 'bg-client-primary shadow-client-primary/30') : 'bg-white text-gray-200 border border-gray-100';
                    let textColor = isActive ? (isCompleted ? 'text-emerald-600' : 'text-slate-900') : 'text-gray-300';

                    if (isCurrent) {
                        if (isCancelled) {
                            dotBgColor = 'bg-red-500 shadow-red-200';
                            textColor = 'text-red-500';
                        } else if (isRefunding) {
                            dotBgColor = 'bg-amber-500 shadow-amber-200';
                            textColor = 'text-amber-500';
                        } else if (isRefunded) {
                            dotBgColor = 'bg-blue-500 shadow-blue-200';
                            textColor = 'text-blue-500';
                        } else if (isReturned || isReturnRequested) {
                            dotBgColor = 'bg-orange-500 shadow-orange-200';
                            textColor = 'text-orange-500';
                        }
                    }

                    return (
                        <div key={step.key} className="flex flex-col items-center gap-2 z-10 w-[14%] relative">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-700 ${dotBgColor} text-white scale-105 shadow-md
                                     ${isCurrent && !isDivergent ? (isCompleted ? 'ring-4 ring-emerald-50' : 'ring-4 ring-client-primary/10') : ''}`}
                            >
                                {step.icon && (typeof step.icon === 'object' ? { ...step.icon, props: { ...step.icon.props, width: 20, height: 20 } } : step.icon)}
                            </div>
                            <span className={`text-[0.625rem] font-bold text-center transition-colors duration-500 uppercase tracking-tight leading-tight px-1 ${textColor}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const OrderDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const { order, loading: fetching, error: orderError, refresh } = useOrderDetail(id as string);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const [showReturnModal, setShowReturnModal] = useState(false);
    const refundRef = useRef<HTMLDivElement>(null);

    const [showRefundModal, setShowRefundModal] = useState(false);
    const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
    const [returnReason, setReturnReason] = useState("");
    const [returnEvidence, setReturnEvidence] = useState(""); // Comma separated URLs
    const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
    const quickReturnReasons = [
        "Sản phẩm bị vỡ, hỏng hóc",
        "Giao sai mẫu mã, kích thước",
        "Sản phẩm không giống mô tả",
        "Sản phẩm hết hạn sử dụng",
        "Chất lượng sản phẩm kém",
        "Lý do khác"
    ];

    const [isCustomReturnReason, setIsCustomReturnReason] = useState(false);
    const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const hasToastedRef = useRef(false);

    // Bộ đếm ngược cho thanh toán
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [refundHistory, setRefundHistory] = useState<OrderRefundResponse[]>([]);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const cancel = queryParams.get('cancel');
        const code = queryParams.get('code');
        const refundSuccess = queryParams.get('refundSuccess');

        if (hasToastedRef.current) return;

        if (cancel === 'true') {
            hasToastedRef.current = true;
            toast.info("Bạn đã hủy thanh toán. Đơn hàng vẫn đang chờ bạn!");
            navigate(location.pathname, { replace: true });
        } else if (code === '00') {
            hasToastedRef.current = true;
            toast.success("Thanh toán thành công! TeddyPet đang chuẩn bị hàng cho bạn.");
            navigate(location.pathname, { replace: true });

            // Polling nhẹ để đồng bộ trạng thái (không hiện overlay)
            let count = 0;
            const poll = setInterval(() => {
                refresh();
                count++;
                if (count >= 3) {
                    clearInterval(poll);
                }
            }, 2000);
        } else if (refundSuccess === 'true') {
            hasToastedRef.current = true;
            // No toast here, will show the banner instead
            navigate(location.pathname, { replace: true });
        }
    }, [location.search, refresh, navigate, location.pathname]);

    const lastRefreshRef = useRef<string | null>(null);

    useEffect(() => {
        if (order?.status === 'CONFIRMED' && order?.payments?.[0]?.paymentMethod === 'BANK_TRANSFER' && order?.payments?.[0]?.status !== 'COMPLETED') {
            const timer = setInterval(() => {
                const createdAt = new Date(order.createdAt).getTime();
                const expireAt = createdAt + 10 * 60 * 1000; // 10 minutes timeout
                const now = new Date().getTime();
                const distance = expireAt - now;

                if (distance <= 0) {
                    setTimeLeft("Hết hạn");
                    clearInterval(timer);
                    if (lastRefreshRef.current !== order.id) {
                        lastRefreshRef.current = order.id;
                        refresh();
                    }
                } else {
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                    setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
                }
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [order, refresh]);

    useEffect(() => {
        if (!order?.id) return;
        getOrderRefundRequests(order.id)
            .then((res) => {
                if (res.success && Array.isArray(res.data)) setRefundHistory(res.data);
            })
            .catch(() => setRefundHistory([]));
    }, [order?.id]);

    const scrollToRefundHistory = () => {
        refundRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-client-primary/10 border-t-client-primary rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-gray-400">Đang tải dữ liệu đơn hàng...</p>
                </div>
            </div>
        );
    }

    if (orderError && !order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#fcfcfc] px-4">
                <p className="text-center text-gray-600 font-medium">
                    Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn này.
                </p>
                <Link
                    to="/dashboard/orders"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-client-primary hover:bg-client-secondary text-white rounded-lg font-semibold text-sm"
                >
                    Quay lại danh sách đơn hàng
                </Link>
            </div>
        );
    }

    if (!order) {
        return null;
    }

    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Tài khoản", to: "/dashboard/profile" },
        { label: "Đơn hàng", to: "/dashboard/orders" },
        { label: `#${order.orderCode}`, to: "#" },
    ];

    const handleConfirmReceived = async () => {
        const result = await showConfirmDialog({
            title: 'Bạn đã nhận được hàng?',
            text: "Vui lòng chỉ xác nhận khi bạn đã nhận và kiểm tra sản phẩm.",
            icon: 'question',
            confirmButtonColor: '#10B981',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Đúng, tôi đã nhận!',
            cancelButtonText: 'Chưa nhận được'
        });

        if (result.isConfirmed) {
            setIsSubmitting(true);
            try {
                await confirmReceived(order.id);
                toast.success("Xác nhận đã nhận hàng thành công. TeddyPet cảm ơn bạn!");
                await refresh();
                setShowFeedbackModal(true);
            } catch (error: any) {
                toast.error(error.response?.data?.message || "Có lỗi xảy ra!");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Đã sao chép mã đơn hàng!");
    };

    const handleDownloadInvoice = async () => {
        if (!order) return;
        setIsDownloadingInvoice(true);
        try {
            const blob = await downloadMyOrderInvoice(order.id);
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

    const handleCancelOrder = async (reason: string) => {
        setIsCancelling(true);
        try {
            const response = await cancelOrder(order.id, reason);
            if (response.success) {
                toast.success("Đã hủy đơn hàng thành công!");
                setShowCancelModal(false);
                await refresh();
            } else {
                toast.error(response.message || "Không thể hủy đơn hàng!");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể hủy đơn hàng!");
        } finally {
            setIsCancelling(false);
        }
    };

    const handleRequestReturn = async () => {
        if (!returnReason.trim() || returnReason.length < 5) {
            toast.error("Vui lòng nhập lý do trả hàng (ít nhất 5 ký tự)");
            return;
        }
        setIsSubmittingReturn(true);
        try {
            const evidenceArray = returnEvidence ? returnEvidence.split(',').map(url => url.trim()).filter(url => url !== '') : [];
            await requestReturn(order.id, {
                reason: returnReason.trim(),
                evidenceUrls: evidenceArray
            });
            toast.success("Đã gửi yêu cầu trả hàng. Vui lòng chờ phản hồi từ TeddyPet!");
            setShowReturnModal(false);
            setReturnReason("");
            setReturnEvidence("");
            await refresh();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể gửi yêu cầu trả hàng!");
        } finally {
            setIsSubmittingReturn(false);
        }
    };

    const handleRefundConfirm = async (reason: string, bankInformationId?: number, guestBank?: any) => {
        setIsSubmittingRefund(true);
        try {
            let finalBankId = bankInformationId;

            // If guestBank is provided (though normally not in dashboard, but for consistency)
            if (guestBank && !finalBankId) {
                const res = await createGuestBankInformationByOrderCode(order.orderCode, guestBank);
                if (res.success) {
                    finalBankId = res.data.id;
                } else {
                    throw new Error(res.message || "Không thể lưu thông tin ngân hàng.");
                }
            }

            if (!finalBankId) {
                toast.error("Thiếu thông tin ngân hàng hoàn tiền.");
                return;
            }

            await createOrderRefundRequest(order.id, {
                requestedAmount: order.finalAmount,
                reason: reason.trim(),
                bankInformationId: finalBankId
            });

            toast.success("Đã gửi yêu cầu hoàn tiền. TeddyPet sẽ kiểm tra và phản hồi sớm!");
            setShowRefundModal(false);
            await refresh();
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message || "Không thể gửi yêu cầu hoàn tiền!");
        } finally {
            setIsSubmittingRefund(false);
        }
    };

    const handleRefundUpdate = async (refundId: number, data: any) => {
        setIsSubmittingRefund(true);
        try {
            const response = await updateOrderRefundRequest(order.id, refundId, data);
            if (response.success) {
                toast.success("Đã cập nhật yêu cầu hoàn tiền thành công!");
                setShowRefundModal(false);
                await refresh();
            } else {
                toast.error(response.message || "Cập nhật thất bại.");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi hệ thống khi cập nhật.");
        } finally {
            setIsSubmittingRefund(false);
        }
    };

    const handlePayment = async () => {
        const orderIdToPay = id ?? order?.id;
        if (!orderIdToPay) return;
        setIsSubmitting(true);
        try {
            const returnUrl = window.location.href;
            const response = await createPaymentUrl(orderIdToPay, "PAYOS", returnUrl);
            if (response.success && response.data) {
                window.location.href = response.data as string;
            } else {
                toast.error(response.message || "Không thể tạo link thanh toán.");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể tạo link thanh toán!");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isWithinReturnPeriod = () => {
        if (!order.completedAt) return false;
        const completeDate = new Date(order.completedAt);
        const now = new Date();
        const diffInDays = Math.floor((now.getTime() - completeDate.getTime()) / (1000 * 3600 * 24));
        return diffInDays <= 7;
    };

    const paymentInfo = order.payments?.[0];
    const isPaid = paymentInfo?.status === 'COMPLETED';
    const paymentMethodLabel = paymentInfo?.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Thanh toán khi nhận hàng (COD)';

    const queryParams = new URLSearchParams(location.search);
    const refundSuccess = queryParams.get('refundSuccess');

    return (
        <DashboardLayout pageTitle="Chi tiết đơn hàng" breadcrumbs={breadcrumbs}>
            <div className="space-y-[0.78125rem]">
                {refundSuccess === 'true' && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between gap-4 animate-fadeIn shadow-sm">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                            <div>
                                <h3 className="font-bold text-sm">Yêu cầu hoàn tiền đã được gửi thành công!</h3>
                                <p className="text-xs">TeddyPet sẽ kiểm tra và phản hồi bạn trong thời gian sớm nhất.</p>
                            </div>
                        </div>
                        <button
                            onClick={scrollToRefundHistory}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-[0.7rem] font-bold hover:bg-emerald-200 transition-all uppercase shrink-0"
                        >
                            <Eye width={14} height={14} /> Xem chi tiết
                        </button>
                    </div>
                )}

                {/* Header Section */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm animate-fadeIn">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Mã đơn: {order.orderCode}</h2>
                        <button
                            onClick={() => copyToClipboard(order.orderCode)}
                            className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:text-client-primary hover:bg-white hover:border-client-primary/30 hover:shadow-sm transition-all active:scale-95"
                            title="Sao chép mã đơn"
                        >
                            <Copy width={16} height={16} strokeWidth={2.4} />
                        </button>
                        <button
                            onClick={handleDownloadInvoice}
                            disabled={isDownloadingInvoice}
                            className="ml-1 px-3 h-8 bg-slate-900 text-white rounded-lg text-[0.625rem] font-bold flex items-center gap-2 hover:bg-client-primary hover:shadow-sm hover:shadow-client-primary/20 transition-all disabled:opacity-50"
                        >
                            {isDownloadingInvoice ? <RefreshDouble width={14} height={14} className="animate-spin" /> : <Download width={14} height={14} strokeWidth={2.4} />}
                            <span className="hidden sm:inline uppercase">Hóa đơn</span>
                        </button>
                    </div>
                    <Link to="/dashboard/orders" className="h-8 px-4 rounded-lg border border-slate-200 bg-white text-[0.75rem] font-bold text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 flex items-center gap-2 transition-all uppercase tracking-wide">
                        <NavArrowRight width={16} height={16} className="rotate-180" /> Quay lại
                    </Link>
                </div>

                {/* 1. TIMELINE */}
                <OrderStepper status={order.status} />

                {/* Status Reasons (Cancel/Return) */}
                {(order.status === 'CANCELLED' || order.status === 'REFUND_PENDING' || order.status === 'RETURNED' || order.status === 'RETURN_REQUESTED' || ((order.status as string) === 'COMPLETED' && (order.returnReason || order.adminReturnNote))) && (
                    <div className="space-y-5 animate-fadeIn">
                        {(order.status === 'CANCELLED' || order.status === 'REFUND_PENDING' || order.status === 'REFUNDED') && order.cancelReason && (
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${order.status === 'CANCELLED' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
                                        <WarningCircle width={20} height={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[0.625rem] text-gray-400 font-bold uppercase tracking-widest mb-1">
                                            Lý do {order.status === 'CANCELLED' ? 'hủy đơn' : 'hoàn tiền'}
                                        </div>
                                        <div className="text-sm font-bold text-slate-700 leading-tight">"{order.cancelReason}"</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {((order.status as string) === 'RETURNED' || (order.status as string) === 'RETURN_REQUESTED' || ((order.status as string) === 'COMPLETED' && (order.returnReason || order.adminReturnNote))) && (
                            <div className={`relative overflow-hidden rounded-2xl p-4 border transition-all duration-300
                                ${(order.status as string) === 'COMPLETED' && order.adminReturnNote ? 'bg-red-50/60 border-red-100' : 'bg-blue-50/60 border-blue-100'}`}>
                                <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
                                    {(order.status as string) === 'COMPLETED' && order.adminReturnNote ? <WarningCircle className="w-24 h-24 text-red-500" /> : <RefreshDouble className="w-24 h-24 text-blue-500" />}
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${(order.status as string) === 'COMPLETED' && order.adminReturnNote ? 'bg-red-500 text-white shadow-red-200' : 'bg-blue-500 text-white shadow-blue-200'}`}>
                                            {(order.status as string) === 'COMPLETED' && order.adminReturnNote ? <WarningCircle width={24} height={24} /> : <RefreshDouble width={24} height={24} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`text-sm font-bold uppercase leading-tight mb-0.5 ${(order.status as string) === 'COMPLETED' && order.adminReturnNote ? 'text-red-600' : 'text-blue-600'}`}>
                                                {(order.status as string) === 'RETURN_REQUESTED' ? 'Đang xử lý yêu cầu' : ((order.status as string) === 'COMPLETED' && order.adminReturnNote ? 'Yêu cầu trả hàng bị từ chối' : 'Thông tin trả hàng')}
                                            </h3>
                                            <p className="text-xs font-medium text-slate-500 pr-4 leading-relaxed">
                                                {(order.status as string) === 'COMPLETED' && order.adminReturnNote ? 'Admin đã xem xét và từ chối yêu cầu.' : 'Yêu cầu của bạn đang được xử lý.'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50 space-y-3 shadow-sm">
                                        {order.adminReturnNote && (
                                            <div className="pb-3 border-b border-dashed border-slate-200">
                                                <span className="text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 flex items-center gap-2"><ChatBubble width={14} height={14} /> Lý do từ chối</span>
                                                <div className="text-xs font-bold text-red-600 leading-relaxed pl-3 border-l-2 border-red-400">"{order.adminReturnNote}"</div>
                                            </div>
                                        )}
                                        {order.returnReason && (
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><HelpCircle width={14} height={14} /> Lý do bạn gửi</span>
                                                </div>
                                                <div className="text-xs font-medium text-slate-600 italic pl-3">"{order.returnReason}"</div>
                                                {order.returnEvidence && (
                                                    <div className="mt-3 flex flex-wrap gap-2 pl-3">
                                                        {order.returnEvidence.split(',').map((url, i) => (
                                                            <a key={i} href={url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-lg overflow-hidden border border-slate-100 shadow-sm hover:scale-105 transition-all hover:border-client-primary">
                                                                <img src={url} alt="Bằng chứng" className="w-full h-full object-cover" />
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {/* Refund History Section */}
                {refundHistory.length > 0 && (
                    <div ref={refundRef} className="space-y-4 animate-fadeIn scroll-mt-20">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                <RefreshDouble width={18} height={18} className="text-client-primary" />
                                Lịch sử hoàn tiền ({refundHistory.length})
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {refundHistory.map((r, idx) => (
                                <div key={r.id || idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                                    <div className={`absolute top-0 left-0 w-1 h-full ${
                                        r.status === 'PENDING' ? 'bg-amber-400' : 
                                        r.status === 'APPROVED' ? 'bg-emerald-400' : 
                                        r.status === 'REFUNDED' ? 'bg-blue-400' : 'bg-red-400'
                                    }`}></div>
                                    
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                                {r.createdAt ? format(new Date(r.createdAt), "HH:mm - dd/MM/yyyy") : '---'}
                                            </div>
                                            <div className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                r.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 
                                                r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 
                                                r.status === 'REFUNDED' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                                            }`}>
                                                {r.status === 'PENDING' ? 'Chờ xử lý' : 
                                                 r.status === 'APPROVED' ? 'Chờ hoàn tiền' : 
                                                 r.status === 'REFUNDED' ? 'Đã hoàn tiền' : 
                                                 r.status === 'REJECTED' ? 'Từ chối' : 
                                                 r.status === 'ACTION_REQUIRED' ? 'Cần bổ sung' : r.status}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Số tiền</div>
                                            <div className="text-sm font-black text-slate-900">{(r.requestedAmount || order.finalAmount).toLocaleString()}đ</div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {r.customerReason && (
                                            <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Lý do của bạn</span>
                                                <p className="text-xs font-bold text-slate-600 leading-relaxed italic">"{r.customerReason}"</p>
                                            </div>
                                        )}

                                        {(r.adminDecisionNote || (r.adminEvidenceUrls && r.adminEvidenceUrls.length > 0)) && (
                                            <div className="bg-emerald-50/30 p-2.5 rounded-xl border border-emerald-100/50">
                                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Phản hồi từ TeddyPet</span>
                                                {r.adminDecisionNote && (
                                                    <p className="text-xs font-bold text-emerald-800 leading-relaxed mb-2">"{r.adminDecisionNote}"</p>
                                                )}
                                                {r.adminEvidenceUrls && r.adminEvidenceUrls.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {r.adminEvidenceUrls.map((url, i) => (
                                                            <a 
                                                                key={i} 
                                                                href={url} 
                                                                target="_blank" 
                                                                rel="noreferrer" 
                                                                className="w-14 h-14 rounded-xl overflow-hidden border border-emerald-100 shadow-sm hover:scale-105 transition-all"
                                                            >
                                                                <img src={url} alt="Minh chứng hoàn tiền" className="w-full h-full object-cover" />
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. ADDRESS & SUPPORT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[0.625rem] animate-fadeIn">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <MapPin width={18} height={18} className="text-client-primary" /> Địa chỉ nhận hàng
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="text-[0.625rem] text-slate-400 font-bold uppercase tracking-widest mb-1">Người nhận</div>
                                <div className="text-[0.9375rem] font-bold text-slate-900 uppercase">{order.shippingName}</div>
                                <div className="flex items-center gap-2 text-client-primary font-bold mt-1 text-sm"><Phone width={14} height={14} /> {order.shippingPhone}</div>
                            </div>
                            <div>
                                <div className="text-[0.625rem] text-slate-400 font-bold uppercase tracking-widest mb-1">Địa chỉ</div>
                                <div className="text-sm font-medium text-slate-600 leading-relaxed italic">{order.shippingAddress}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm bg-gradient-to-tr from-white to-blue-50/20">
                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <HelpCircle width={18} height={18} className="text-blue-500" /> Hướng dẫn & Hỗ trợ
                        </h3>
                        <div className="space-y-4">
                            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">TeddyPet sẵn sàng hỗ trợ bạn trong vòng 24h.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <a href="https://www.facebook.com/teddypet.official" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 h-10 bg-slate-900 text-white rounded-lg font-bold text-[0.75rem] hover:bg-client-primary transition-all shadow-sm uppercase tracking-wide">
                                    <ChatBubble width={16} height={16} /> Liên hệ Shop
                                </a>
                                <Link to="/bai-viet" className="flex items-center justify-center gap-2 h-10 bg-white border border-slate-200 text-slate-500 rounded-lg font-bold text-[0.75rem] hover:border-slate-900 hover:text-slate-900 transition-all uppercase tracking-wide">
                                    <HelpCircle width={16} height={16} /> Hỗ trợ
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. PRODUCTS LIST */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm animate-fadeIn">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Package width={18} height={18} className="text-client-primary" /> Sản phẩm đã đặt ({order.orderItems?.length})
                    </h3>
                    <div className="divide-y divide-slate-50">
                        {order.orderItems?.map((item, idx) => (
                            <div key={idx} className="flex gap-4 py-4 first:pt-0 last:pb-0 group">
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border border-slate-100 shrink-0 relative shadow-sm">
                                    <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute top-0 right-0 bg-slate-900 text-white text-[0.625rem] font-bold px-1.5 py-0.5 rounded-bl-md">x{item.quantity}</div>
                                </div>
                                <div className="flex-1 flex flex-col justify-center min-w-0">
                                    <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-client-primary transition-colors">{item.productName}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest">{item.variantName}</span>
                                    </div>
                                    <div className="mt-1 text-base font-bold text-slate-900">{(item.unitPrice * item.quantity).toLocaleString()}đ</div>
                                </div>
                                {order.status === 'COMPLETED' && (
                                    <div className="flex items-center">
                                        <Link
                                            to={`/feedback?orderId=${order.id}&productId=${item.productId}${item.variantId ? `&variantId=${item.variantId}` : ''}`}
                                            className="flex items-center gap-1 px-3 py-1 bg-red-50 text-client-primary rounded-full font-bold text-[0.625rem] hover:bg-client-primary hover:text-white transition-all uppercase tracking-wide"
                                        >
                                            <Star width={12} height={12} /> Đánh giá
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. PAYMENT SUMMARY */}
                <div className="bg-white p-[0.78125rem] rounded-2xl border border-slate-100 shadow-sm animate-fadeIn">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[0.9375rem]">
                        {/* Summary Info */}
                        <div className="space-y-[0.625rem]">
                            <h3 className="text-[0.546875rem] font-bold text-slate-900 pb-[0.3125rem] border-b border-slate-50 uppercase tracking-tight">Thanh toán</h3>
                            <div className="space-y-[0.46875rem]">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500 shrink-0"><Wallet width={20} height={20} /></div>
                                    <div>
                                        <div className="text-[0.625rem] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1.5">Phương thức</div>
                                        <div className="text-sm font-bold text-slate-900 leading-none">{paymentMethodLabel}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 shrink-0"><Calendar width={20} height={20} /></div>
                                    <div>
                                        <div className="text-[0.625rem] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1.5">Thời gian đặt</div>
                                        <div className="text-sm font-bold text-slate-900 leading-none">{format(new Date(order.createdAt), "HH:mm - dd/MM/yyyy")}</div>
                                    </div>
                                </div>
                                {isPaid && (
                                    <div className="flex items-start gap-4 animate-fadeIn">
                                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500 shrink-0"><ShieldCheck width={20} height={20} /></div>
                                        <div>
                                            <div className="text-[0.625rem] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1.5">Xác nhận thanh toán</div>
                                            <div className="text-sm font-bold text-slate-900 leading-none">{format(new Date(order.updatedAt), "HH:mm - dd/MM/yyyy")}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bill Totals */}
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider">Tạm tính</span>
                                    <span className="font-bold text-slate-900">{order.subtotal.toLocaleString()}đ</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider">Phí ship</span>
                                    <span className="font-bold text-slate-900">{getOrderShippingFeeLabel(order, { withPlusPrefix: true })}</span>
                                </div>
                                {order.discountAmount > 0 && (
                                    <div className="flex justify-between items-center text-sm text-red-500">
                                        <span className="font-bold uppercase tracking-wider">Giảm giá</span>
                                        <span className="font-bold">-{order.discountAmount.toLocaleString()}đ</span>
                                    </div>
                                )}
                            </div>
                            <div className="pt-3 border-t border-dashed border-slate-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-900 uppercase">Tổng cộng</span>
                                    <span className="text-xl font-black text-client-primary tracking-tighter leading-none">{order.finalAmount.toLocaleString()}đ</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-[1.25rem] border-t border-slate-50 pt-[1.25rem]">
                        {order.status === 'DELIVERED' && (
                            <button
                                onClick={handleConfirmReceived}
                                disabled={isSubmitting}
                                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 hover:translate-y-[-1px] active:translate-y-0"
                            >
                                {isSubmitting ? <RefreshDouble width={20} height={20} className="animate-spin" /> : <CheckCircle width={20} height={20} />}
                                {isSubmitting ? "Đang xác nhận..." : "Tôi đã nhận được hàng"}
                            </button>
                        )}

                        {/* Nút thanh toán chỉ hiện sau khi admin xác nhận đơn (status CONFIRMED) */}
                        {order.status === 'CONFIRMED' && paymentInfo?.paymentMethod === 'BANK_TRANSFER' && !isPaid && (
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3 animate-fadeIn">
                                    <WarningCircle width={24} height={24} className="text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-blue-700 leading-relaxed">
                                        <strong>Lưu ý:</strong> Vui lòng thanh toán <strong>chính xác số tiền</strong> ({order.finalAmount.toLocaleString()}đ) trong vòng <strong>10 phút</strong> để hệ thống tự động xác nhận đơn hàng ngay lập tức.
                                    </p>
                                </div>
                                <button
                                    onClick={handlePayment}
                                    disabled={isSubmitting || timeLeft === "Hết hạn" || (id != null && order.id !== id)}
                                    className="w-full h-12 bg-slate-900 hover:bg-client-secondary text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 hover:translate-y-[-1px] active:translate-y-0 disabled:opacity-50"
                                >
                                    {isSubmitting ? <RefreshDouble width={20} height={20} className="animate-spin" /> : <Wallet width={20} height={20} />}
                                    {timeLeft === "Hết hạn" ? "Thanh toán đã hết hạn" : `Thanh toán đơn hàng ngay (${timeLeft})`}
                                </button>
                            </div>
                        )}

                        {/* Hủy đơn: */}
                        {order.status === 'REFUND_PENDING' && (
                            <div className="p-2 bg-[#FFF7E6] border-b border-[#FFE7B3] flex items-center gap-1.5">
                                <InfoCircle width={20} height={20} className="text-[#B76E00]" />
                                <p className="text-[#B76E00] font-semibold text-sm">
                                    Đơn hàng đang chờ hoàn tiền. Hệ thống sẽ cập nhật khi admin xác nhận.
                                </p>
                            </div>
                        )}
                        {/* Success alert was here, now moved to top */}
                        {((["PENDING", "CONFIRMED", "PAID"].includes(order.status)) &&
                            (!order.latestRefundStatus || order.latestRefundStatus === 'REJECTED' || order.latestRefundStatus === 'CANCELLED') && 
                            timeLeft !== "Hết hạn") && (
                                <div className="space-y-2">
                                    {isPaid && (
                                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
                                            <WarningCircle width={18} height={18} className="text-amber-500 shrink-0 mt-0.5" />
                                            <p className="text-xs font-medium text-amber-700 leading-relaxed">
                                                Đơn hàng đã thanh toán. Khi hủy đơn, hệ thống sẽ tạo yêu cầu hoàn tiền cho bạn.
                                            </p>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => isPaid ? setShowRefundModal(true) : setShowCancelModal(true)}
                                        className="w-full h-12 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <WarningCircle width={20} height={20} />
                                        {isPaid
                                            ? (order.latestRefundStatus === 'REJECTED' ? 'Gửi lại yêu cầu hoàn tiền' : 'Hủy đơn & yêu cầu hoàn tiền')
                                            : 'Hủy đơn hàng'}
                                    </button>
                                </div>
                            )}

                        {order.latestRefundStatus === 'ACTION_REQUIRED' && (
                            <div className="space-y-4">
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3 animate-fadeIn">
                                    <InfoCircle width={24} height={24} className="text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-amber-700 leading-relaxed">
                                        <strong>Cần cập nhật:</strong> Admin đã yêu cầu bạn cung cấp lại thông tin hoàn tiền chính xác hơn.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowRefundModal(true)}
                                    className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    <RefreshDouble width={20} height={20} /> Cập nhật thông tin hoàn tiền
                                </button>
                            </div>
                        )}

                        {order.status === 'COMPLETED' && isWithinReturnPeriod() && (
                            <button
                                onClick={() => setShowReturnModal(true)}
                                className="w-full h-12 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-100 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshDouble width={20} height={20} /> {order.adminReturnNote ? "Gửi lại yêu cầu trả hàng" : "Yêu cầu trả hàng / Hoàn tiền"}
                            </button>
                        )}
                    </div>
                </div>
            </div>


            {/* MODALS */}
            {showFeedbackModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-client-secondary/40 backdrop-blur-md" onClick={() => setShowFeedbackModal(false)}></div>
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full relative z-10 shadow-2xl border border-slate-100 text-center animate-scaleUp">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-4 shadow-sm border border-emerald-100"><Star className="w-8 h-8 fill-current" /></div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight uppercase">Xác nhận thành công!</h3>
                        <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">Đơn hàng đã hoàn tất. TeddyPet rất mong nhận được đánh giá từ bạn! 🐾</p>
                        <div className="flex flex-col gap-3">
                            <Link to={`/feedback?orderId=${order.id}`} className="h-12 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-client-primary shadow-lg shadow-slate-100 transition-all uppercase tracking-wide"><Star width={20} height={20} /> Đánh giá ngay</Link>
                            <button onClick={() => setShowFeedbackModal(false)} className="h-10 text-slate-400 font-bold text-xs hover:text-slate-900 transition-colors uppercase tracking-widest leading-none">Để sau nhé</button>
                        </div>
                    </div>
                </div>
            )}

            {showRefundModal && (
                <RefundRequestModal
                    isOpen={showRefundModal}
                    onClose={() => setShowRefundModal(false)}
                    onConfirm={handleRefundConfirm}
                    onUpdate={handleRefundUpdate}
                    isSubmitting={isSubmittingRefund}
                    orderCode={order.orderCode}
                    isLoggedIn={!!order.user}
                    initialRefundRequest={refundHistory.find(r => r.status === 'ACTION_REQUIRED' || r.status === 'PENDING')}
                    refundHistory={refundHistory}
                />
            )}

            {showReturnModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[8px]"
                        onClick={() => { setShowReturnModal(false); setReturnReason(""); setReturnEvidence(""); setIsCustomReturnReason(false); }}
                    ></div>
                    <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full relative z-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] border border-white/60 animate-scaleUp overflow-hidden">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-28 h-28 bg-orange-50 rounded-full blur-3xl opacity-60 -mr-12 -mt-12"></div>
                        <div className="absolute bottom-0 left-0 w-20 h-20 bg-rose-50 rounded-full blur-3xl opacity-40 -ml-8 -mb-8"></div>

                        {/* Header */}
                        <div className="flex flex-col items-center text-center mb-5 relative">
                            <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-3 shadow-inner border border-orange-100/50 rotate-3">
                                <RefreshDouble width={28} height={28} />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-tight">Yêu cầu trả hàng</h3>
                            <p className="mt-1 text-[10px] font-bold text-slate-400 max-w-[200px] leading-relaxed">
                                Hỗ trợ trả hàng trong vòng 7 ngày nếu lỗi 🐾
                            </p>
                        </div>

                        {/* Reasons */}
                        <div className="mb-6 relative max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2 px-1">
                                <InfoCircle width={12} height={12} />
                                Lựa chọn lý do hoàn trả:
                            </p>
                            <div className="space-y-1.5 px-0.5">
                                {quickReturnReasons.map((reason, index) => {
                                    const isSelected = (reason === "Lý do khác" && isCustomReturnReason) || returnReason === reason;
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                if (reason === "Lý do khác") {
                                                    setIsCustomReturnReason(true);
                                                    setReturnReason('');
                                                } else {
                                                    setIsCustomReturnReason(false);
                                                    setReturnReason(reason);
                                                }
                                            }}
                                            className={`w-full px-3 py-2.5 rounded-xl text-left transition-all border-2 flex items-center gap-2.5 active:scale-[0.98] ${isSelected
                                                ? 'border-orange-400 bg-orange-50 shadow-[0_4px_12px_-4px_rgba(249,115,22,0.1)]'
                                                : 'border-slate-50 hover:border-slate-100 bg-slate-50/20'
                                                }`}
                                        >
                                            <div className={`shrink-0 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                                                ? 'border-orange-500 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]'
                                                : 'border-slate-200 bg-white'
                                                }`}>
                                                {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                            </div>
                                            <span className={`text-[12px] font-bold leading-tight tracking-tight ${isSelected ? 'text-orange-600' : 'text-slate-600'}`}>
                                                {reason}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Custom Reason & Evidence Inputs */}
                            {isCustomReturnReason && (
                                <div className="mt-3 animate-fadeIn">
                                    <textarea
                                        value={returnReason}
                                        onChange={(e) => setReturnReason(e.target.value)}
                                        placeholder="Mô tả chi tiết lỗi sản phẩm với chúng mình..."
                                        className="w-full h-20 p-3 border-2 border-slate-100 rounded-xl text-[12px] font-bold text-slate-700 focus:border-orange-200 focus:bg-white focus:outline-none transition-all resize-none bg-slate-50/50 placeholder:text-slate-300 shadow-inner custom-scrollbar"
                                        maxLength={500}
                                        autoFocus
                                    />
                                </div>
                            )}

                            <div className="mt-2.5">
                                <label className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5 block px-1">Link ảnh bằng chứng</label>
                                <input
                                    type="text"
                                    value={returnEvidence}
                                    onChange={(e) => setReturnEvidence(e.target.value)}
                                    placeholder="Dán link ảnh tại đây (không bắt buộc)"
                                    className="w-full h-10 px-3 border-2 border-slate-100 rounded-xl text-[12px] font-bold focus:border-orange-200 focus:bg-white focus:outline-none transition-all bg-slate-50/50 shadow-inner placeholder:text-slate-300 text-slate-700"
                                />
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex gap-3 relative">
                            <button
                                onClick={() => { setShowReturnModal(false); setReturnReason(""); setReturnEvidence(""); setIsCustomReturnReason(false); }}
                                disabled={isSubmittingReturn}
                                className="flex-1 h-10 bg-slate-100 text-slate-500 rounded-xl text-[11px] font-black hover:bg-slate-200 hover:text-slate-600 transition-all uppercase tracking-[0.1em] active:scale-95 disabled:opacity-50"
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={handleRequestReturn}
                                disabled={isSubmittingReturn || !returnReason.trim()}
                                className="flex-[1.5] h-10 bg-orange-500 text-white rounded-xl text-[11px] font-black hover:bg-orange-600 shadow-lg shadow-orange-200/50 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 uppercase tracking-[0.1em] active:scale-95 border-b-4 border-orange-700/20"
                            >
                                {isSubmittingReturn ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-[2px] border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Đang gửi</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck width={16} height={16} />
                                        Gửi yêu cầu
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <CancelOrderModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={handleCancelOrder}
                isCancelling={isCancelling}
            />

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #F1F5F9;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #E2E8F0;
                }
            `}</style>

        </DashboardLayout>
    );
};
