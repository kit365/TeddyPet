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
    Xmark
} from "iconoir-react";
import { toast } from "react-toastify";
import { useState, useEffect, useRef } from "react";
import { confirmReceived, cancelOrder, requestReturn, downloadMyOrderInvoice, createPaymentUrl } from "../../../api/order.api";
import { ORDER_STATUS_MAP } from "../../../constants/status";
import { useLocation, useNavigate } from "react-router-dom";

// Component Stepper Siêu Cấp
const OrderStepper = ({ status }: { status: string }) => {
    const steps = [
        { key: 'PENDING', label: ORDER_STATUS_MAP.PENDING.label, icon: <ClipboardCheck width={24} height={24} /> },
        { key: 'CONFIRMED', label: ORDER_STATUS_MAP.CONFIRMED.label, icon: <CheckCircle width={24} height={24} /> },
        { key: 'PROCESSING', label: ORDER_STATUS_MAP.PROCESSING.label, icon: <BoxIcon width={24} height={24} /> },
        { key: 'DELIVERING', label: ORDER_STATUS_MAP.DELIVERING.label, icon: <Truck width={24} height={24} /> },
        { key: 'DELIVERED', label: ORDER_STATUS_MAP.DELIVERED.label, icon: <HomeSimple width={24} height={24} /> },
        { key: 'COMPLETED', label: ORDER_STATUS_MAP.COMPLETED.label, icon: <Package width={24} height={24} /> },
    ];

    if (status === 'RETURN_REQUESTED') {
        steps.push({ key: 'RETURN_REQUESTED', label: 'Yêu cầu trả', icon: <RefreshDouble className="w-[2.4rem] h-[2.4rem]" /> });
    }

    const currentIdx = steps.findIndex(s => s.key === status);
    const isCancelled = status === 'CANCELLED';

    if (isCancelled) {
        return (
            <div className="bg-red-50/50 border border-dashed border-red-200 rounded-2xl p-4 flex items-center gap-3 animate-fadeIn mb-4">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white shadow-md shrink-0">
                    <WarningCircle width={20} height={20} />
                </div>
                <div>
                    <h3 className="text-[1rem] font-bold text-red-600 uppercase leading-none mb-1">Đơn hàng đã hủy</h3>
                    <p className="text-[0.8125rem] text-red-400 font-medium leading-none">TeddyPet rất tiếc vì đơn hàng này đã bị hủy trên hệ thống.</p>
                </div>
            </div>
        );
    }

    const isReturned = status === 'RETURNED';
    if (isReturned) {
        return (
            <div className="bg-orange-50/50 border border-dashed border-orange-200 rounded-2xl p-4 flex items-center gap-3 animate-fadeIn mb-4">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-md shrink-0">
                    <RefreshDouble width={20} height={20} />
                </div>
                <div>
                    <h3 className="text-[1rem] font-bold text-orange-600 uppercase leading-none mb-1">Đơn hàng đã hoàn trả</h3>
                    <p className="text-[0.8125rem] text-orange-400 font-medium leading-none">Đơn hàng này đã được hoàn trả về shop.</p>
                </div>
            </div>
        );
    }

    const isCompleted = status === 'COMPLETED';

    return (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-4 animate-fadeIn">
            <div className="relative flex items-center justify-between px-2">
                <div className="absolute top-[18px] left-[8%] right-[8%] h-0.5 bg-gray-100 -z-0 rounded-full"></div>
                <div
                    className={`absolute top-[18px] left-[8%] h-0.5 transition-all duration-[1200ms] ease-in-out -z-0 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-client-primary'}`}
                    style={{ width: currentIdx > 0 ? `${(currentIdx / (steps.length - 1)) * 84}%` : '0%' }}
                ></div>

                {steps.map((step, index) => {
                    const isActive = index <= currentIdx;
                    const isCurrent = index === currentIdx;

                    return (
                        <div key={step.key} className="flex flex-col items-center gap-2 z-10 w-[14%] relative">
                            <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-700 ${isActive
                                    ? (isCompleted ? 'bg-emerald-500 shadow-emerald-200' : 'bg-client-primary shadow-client-primary/30') + ' text-white scale-105 shadow-md'
                                    : 'bg-white text-gray-200 border border-gray-100 text-[0.875rem]'
                                    } ${isCurrent ? (isCompleted ? 'ring-4 ring-emerald-50' : 'ring-4 ring-client-primary/10') : ''}`}
                            >
                                {step.icon && (typeof step.icon === 'object' ? { ...step.icon, props: { ...step.icon.props, width: 18, height: 18 } } : step.icon)}
                            </div>
                            <span className={`text-[0.625rem] font-bold text-center transition-colors duration-500 uppercase tracking-tight leading-tight px-1 ${isActive
                                ? (isCompleted ? 'text-emerald-600' : 'text-slate-900')
                                : 'text-gray-300'
                                }`}>
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
    const { order, loading: fetching, refresh } = useOrderDetail(id as string);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [isCancelling, setIsCancelling] = useState(false);
    const [isCustomReason, setIsCustomReason] = useState(false);

    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnReason, setReturnReason] = useState("");
    const [returnEvidence, setReturnEvidence] = useState(""); // Comma separated URLs
    const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
    
    const quickReasons = [
        "Tôi đổi ý, không muốn mua nữa",
        "Tôi muốn thay đổi sản phẩm khác",
        "Tôi tìm được giá rẻ hơn",
        "Thời gian giao hàng quá lâu",
        "Tôi đặt nhầm số lượng",
        "Lý do khác"
    ];

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

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const cancel = queryParams.get('cancel');
        const code = queryParams.get('code');

        if (hasToastedRef.current) return;

        if (cancel === 'true') {
            hasToastedRef.current = true;
            toast.info("Bạn đã hủy thanh toán. Đơn hàng vẫn đang chờ bạn!");
            navigate(location.pathname, { replace: true });
        } else if (code === '00') {
            hasToastedRef.current = true;
            toast.success("Thanh toán thành công! TeddyPet đang chuẩn bị hàng cho bạn.");
            navigate(location.pathname, { replace: true });

            // Polling logic
            let count = 0;
            const poll = setInterval(() => {
                refresh();
                count++;
                if (count >= 5) clearInterval(poll);
            }, 3000);
        }
    }, [location.search, refresh, navigate, location.pathname]);

    const lastRefreshRef = useRef<string | null>(null);

    useEffect(() => {
        if (order?.status === 'CONFIRMED' && order?.payments?.[0]?.paymentMethod === 'BANK_TRANSFER' && order?.payments?.[0]?.status !== 'COMPLETED') {
            const timer = setInterval(() => {
                const createdAt = new Date(order.createdAt).getTime();
                const expireAt = createdAt + 60 * 60 * 1000;
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
        } else if (order?.status === 'CANCELLED') {
            setTimeLeft("Đã hủy");
        }
    }, [order, refresh]);

    if (fetching || !order) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-client-primary/10 border-t-client-primary rounded-full animate-spin"></div>
                    <p className="text-[1rem] font-bold text-gray-400">Đang tải dữ liệu đơn hàng...</p>
                </div>
            </div>
        );
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

    const handleCancelOrder = async () => {
        if (!cancelReason.trim() || cancelReason.length < 5) {
            toast.error("Vui lòng nhập lý do hủy đơn (ít nhất 5 ký tự)");
            return;
        }
        setIsCancelling(true);
        try {
            await cancelOrder(order.id, cancelReason.trim());
            toast.success("Đã hủy đơn hàng thành công!");
            setShowCancelModal(false);
            setCancelReason("");
            await refresh();
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

    const handlePayment = async () => {
        setIsSubmitting(true);
        try {
            const returnUrl = `${window.location.origin}/dashboard/orders/${order.id}`;
            const response = await createPaymentUrl(order.id, "PAYOS", returnUrl);
            if (response.success && response.data) {
                window.open(response.data as string, "_blank");
                toast.success("Đang mở trang thanh toán PayOS...");
                setTimeout(() => refresh(), 5000);
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
    const paymentMethodLabel = paymentInfo?.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản VietQR (PayOS)' : 'Thanh toán khi nhận hàng (COD)';

    return (
        <DashboardLayout pageTitle="Chi tiết đơn hàng" breadcrumbs={breadcrumbs}>
            <div className="space-y-5">
                {/* Header Section */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm animate-fadeIn">
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-[1.125rem] font-bold text-slate-900 uppercase tracking-tight">Mã đơn: {order.orderCode}</h2>
                        <button
                            onClick={() => copyToClipboard(order.orderCode)}
                            className="w-9 h-9 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:text-client-primary hover:bg-white hover:border-client-primary/30 hover:shadow-sm transition-all active:scale-95"
                            title="Sao chép mã đơn"
                        >
                            <Copy width={15} height={15} strokeWidth={2.4} />
                        </button>
                        <button
                            onClick={handleDownloadInvoice}
                            disabled={isDownloadingInvoice}
                            className="ml-0.5 px-3 h-9 bg-slate-900 text-white rounded-lg text-[0.6875rem] font-bold flex items-center gap-1.5 hover:bg-client-primary hover:shadow-sm hover:shadow-client-primary/20 transition-all disabled:opacity-50"
                        >
                            {isDownloadingInvoice ? <RefreshDouble width={13} height={13} className="animate-spin" /> : <Download width={13} height={13} strokeWidth={2.4} />}
                            <span className="hidden sm:inline uppercase">Hóa đơn</span>
                        </button>
                    </div>
                    <Link to="/dashboard/orders" className="h-9 px-3.5 rounded-lg border border-slate-200 bg-white text-[0.75rem] font-bold text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 transition-all uppercase tracking-wide">
                        <NavArrowRight width={13} height={13} className="rotate-180" /> Quay lại
                    </Link>
                </div>

                {/* 1. TIMELINE */}
                <OrderStepper status={order.status} />

                {/* Status Reasons (Cancel/Return) */}
                {(order.status === 'CANCELLED' || order.status === 'RETURNED' || order.status === 'RETURN_REQUESTED' || ((order.status as string) === 'COMPLETED' && (order.returnReason || order.adminReturnNote))) && (
                    <div className="space-y-5 animate-fadeIn">
                        {(order.status === 'CANCELLED' || order.status === 'RETURNED') && order.cancelReason && (
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${order.status === 'CANCELLED' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
                                        <WarningCircle width={18} height={18} />
                                    </div>
                                    <div>
                                        <div className="text-[0.625rem] text-gray-400 font-bold uppercase tracking-widest mb-1">Lý do {order.status === 'CANCELLED' ? 'hủy đơn' : 'hoàn trả'}</div>
                                        <div className="text-[0.9375rem] font-bold text-slate-700 leading-tight">"{order.cancelReason}"</div>
                                        {order.cancelledBy && (
                                            <div className="text-[0.6875rem] text-gray-400 mt-2 font-medium">Thực hiện bởi: <span className="font-bold text-gray-500">{order.cancelledBy}</span></div>
                                        )}
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
                                            {(order.status as string) === 'COMPLETED' && order.adminReturnNote ? <WarningCircle width={20} height={20} /> : <RefreshDouble width={20} height={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`text-[1rem] font-bold uppercase leading-tight mb-0.5 ${(order.status as string) === 'COMPLETED' && order.adminReturnNote ? 'text-red-600' : 'text-blue-600'}`}>
                                                {(order.status as string) === 'RETURN_REQUESTED' ? 'Đang xử lý yêu cầu' : ((order.status as string) === 'COMPLETED' && order.adminReturnNote ? 'Yêu cầu trả hàng bị từ chối' : 'Thông tin trả hàng')}
                                            </h3>
                                            <p className="text-[0.8125rem] font-medium text-slate-500 pr-4 leading-relaxed">
                                                {(order.status as string) === 'COMPLETED' && order.adminReturnNote ? 'Admin đã xem xét và từ chối yêu cầu.' : 'Yêu cầu của bạn đang được xử lý.'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50 space-y-4 shadow-sm">
                                        {order.adminReturnNote && (
                                            <div className="pb-3 border-b border-dashed border-slate-200">
                                                <span className="text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5"><ChatBubble width={12} height={12} /> Lý do từ chối</span>
                                                <div className="text-[0.875rem] font-bold text-red-600 leading-relaxed pl-3 border-l-2 border-red-400">"{order.adminReturnNote}"</div>
                                            </div>
                                        )}
                                        {order.returnReason && (
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><HelpCircle width={12} height={12} /> Lý do bạn gửi</span>
                                                </div>
                                                <div className="text-[0.875rem] font-medium text-slate-600 italic pl-3">"{order.returnReason}"</div>
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

                {/* 2. ADDRESS & SUPPORT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-[0.875rem] font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <MapPin width={16} height={16} className="text-client-primary" /> Địa chỉ nhận hàng
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <div className="text-[0.625rem] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Người nhận</div>
                                <div className="text-[0.9375rem] font-bold text-slate-900 uppercase">{order.shippingName}</div>
                                <div className="flex items-center gap-1.5 text-client-primary font-bold mt-0.5 text-[0.8125rem]"><Phone width={12} height={12} /> {order.shippingPhone}</div>
                            </div>
                            <div>
                                <div className="text-[0.625rem] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Địa chỉ</div>
                                <div className="text-[0.8125rem] font-medium text-slate-600 leading-relaxed italic">{order.shippingAddress}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm bg-gradient-to-tr from-white to-blue-50/20">
                        <h3 className="text-[0.875rem] font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <HelpCircle width={16} height={16} className="text-blue-500" /> Hướng dẫn & Hỗ trợ
                        </h3>
                        <div className="space-y-3">
                            <p className="text-[0.75rem] text-slate-500 font-medium leading-relaxed mb-3">TeddyPet sẵn sàng hỗ trợ bạn trong vòng 24h.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <a href="https://m.me/teddypet" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 h-9 bg-slate-900 text-white rounded-lg font-bold text-[0.75rem] hover:bg-client-primary transition-all shadow-sm uppercase tracking-wide">
                                    <ChatBubble width={14} height={14} /> Liên hệ Shop
                                </a>
                                <Link to="/bai-viet" className="flex items-center justify-center gap-2 h-9 bg-white border border-slate-200 text-slate-500 rounded-lg font-bold text-[0.75rem] hover:border-slate-900 hover:text-slate-900 transition-all uppercase tracking-wide">
                                    <HelpCircle width={14} height={14} /> Hỗ trợ
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. PRODUCTS LIST */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm animate-fadeIn">
                    <h3 className="text-[0.875rem] font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Package width={16} height={16} className="text-client-primary" /> Sản phẩm đã đặt ({order.orderItems?.length})
                    </h3>
                    <div className="divide-y divide-slate-50">
                        {order.orderItems?.map((item, idx) => (
                            <div key={idx} className="flex gap-4 py-3 first:pt-0 last:pb-0 group">
                                <div className="w-14 h-14 rounded-lg overflow-hidden bg-white border border-slate-100 shrink-0 relative shadow-sm">
                                    <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute top-0 right-0 bg-slate-900 text-white text-[0.5rem] font-bold px-1 py-0.5 rounded-bl-md">x{item.quantity}</div>
                                </div>
                                <div className="flex-1 flex flex-col justify-center min-w-0">
                                    <h4 className="text-[0.875rem] font-bold text-slate-900 truncate group-hover:text-client-primary transition-colors">{item.productName}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest">{item.variantName}</span>
                                    </div>
                                    <div className="mt-0.5 text-[0.9375rem] font-bold text-slate-900">{(item.unitPrice * item.quantity).toLocaleString()}đ</div>
                                </div>
                                {order.status === 'COMPLETED' && (
                                    <div className="flex items-center">
                                        <Link
                                            to={`/feedback?orderId=${order.id}&productId=${item.productId}${item.variantId ? `&variantId=${item.variantId}` : ''}`}
                                            className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-client-primary rounded-full font-bold text-[0.625rem] hover:bg-client-primary hover:text-white transition-all uppercase tracking-wide"
                                        >
                                            <Star width={10} height={10} /> Đánh giá
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. PAYMENT SUMMARY */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm animate-fadeIn">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Summary Info */}
                        <div className="space-y-4">
                            <h3 className="text-[0.875rem] font-bold text-slate-900 pb-2 border-b border-slate-50 uppercase tracking-tight">Thanh toán</h3>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500 shrink-0"><Wallet width={16} height={16} /></div>
                                    <div>
                                        <div className="text-[0.625rem] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Phương thức</div>
                                        <div className="text-[0.875rem] font-bold text-slate-900 leading-none">{paymentMethodLabel}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 shrink-0"><Calendar width={16} height={16} /></div>
                                    <div>
                                        <div className="text-[0.625rem] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Thời gian đặt</div>
                                        <div className="text-[0.875rem] font-bold text-slate-900 leading-none">{format(new Date(order.createdAt), "HH:mm - dd/MM/yyyy")}</div>
                                    </div>
                                </div>
                                {isPaid && (
                                    <div className="flex items-start gap-3 animate-fadeIn">
                                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500 shrink-0"><ShieldCheck width={16} height={16} /></div>
                                        <div>
                                            <div className="text-[0.625rem] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Xác nhận thanh toán</div>
                                            <div className="text-[0.875rem] font-bold text-slate-900 leading-none">{format(new Date(order.updatedAt), "HH:mm - dd/MM/yyyy")}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bill Totals */}
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between items-center text-[0.8125rem]">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider">Tạm tính</span>
                                    <span className="font-bold text-slate-900">{order.subtotal.toLocaleString()}đ</span>
                                </div>
                                <div className="flex justify-between items-center text-[0.8125rem]">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider">Phí ship</span>
                                    <span className="font-bold text-slate-900">+{order.shippingFee.toLocaleString()}đ</span>
                                </div>
                                {order.discountAmount > 0 && (
                                    <div className="flex justify-between items-center text-[0.8125rem] text-red-500">
                                        <span className="font-bold uppercase tracking-wider">Giảm giá</span>
                                        <span className="font-bold">-{order.discountAmount.toLocaleString()}đ</span>
                                    </div>
                                )}
                            </div>
                            <div className="pt-3 border-t border-dashed border-slate-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-[0.8125rem] font-bold text-slate-900 uppercase">Tổng cộng</span>
                                    <span className="text-[1.25rem] font-black text-client-primary tracking-tighter leading-none">{order.finalAmount.toLocaleString()}đ</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-8 border-t border-slate-50 pt-8">
                        {order.status === 'DELIVERED' && (
                            <button
                                onClick={handleConfirmReceived}
                                disabled={isSubmitting}
                                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[1rem] rounded-xl transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 hover:translate-y-[-1px] active:translate-y-0"
                            >
                                {isSubmitting ? <RefreshDouble width={18} height={18} className="animate-spin" /> : <CheckCircle width={18} height={18} />}
                                {isSubmitting ? "Đang xác nhận..." : "Tôi đã nhận được hàng"}
                            </button>
                        )}

                        {order.status === 'CONFIRMED' && paymentInfo?.paymentMethod === 'BANK_TRANSFER' && !isPaid && (
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3 animate-fadeIn">
                                    <WarningCircle width={18} height={18} className="text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-[0.875rem] font-medium text-blue-700 leading-relaxed">
                                        <strong>Lưu ý:</strong> Vui lòng thanh toán <strong>chính xác số tiền</strong> ({order.finalAmount.toLocaleString()}đ) để hệ thống tự động xác nhận đơn hàng ngay lập tức.
                                    </p>
                                </div>
                                <button
                                    onClick={handlePayment}
                                    disabled={isSubmitting || timeLeft === "Hết hạn"}
                                    className="w-full h-12 bg-slate-900 hover:bg-client-secondary text-white font-bold text-[1rem] rounded-xl transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 hover:translate-y-[-1px] active:translate-y-0 disabled:opacity-50"
                                >
                                    {isSubmitting ? <RefreshDouble width={18} height={18} className="animate-spin" /> : <Wallet width={18} height={18} />}
                                    {timeLeft === "Hết hạn" ? "Thanh toán đã hết hạn" : "Thanh toán đơn hàng ngay"}
                                </button>
                            </div>
                        )}

                        {order.status === 'PENDING' && (
                            <button
                                onClick={() => setShowCancelModal(true)}
                                className="w-full h-12 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-bold text-[1rem] rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <WarningCircle width={18} height={18} /> Hủy đơn hàng
                            </button>
                        )}

                        {order.status === 'COMPLETED' && isWithinReturnPeriod() && (
                            <button
                                onClick={() => setShowReturnModal(true)}
                                className="w-full h-12 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-100 font-bold text-[1rem] rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshDouble width={18} height={18} /> {order.adminReturnNote ? "Gửi lại yêu cầu trả hàng" : "Yêu cầu trả hàng / Hoàn tiền"}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {showFeedbackModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-client-secondary/40 backdrop-blur-md" onClick={() => setShowFeedbackModal(false)}></div>
                    <div className="bg-white rounded-[1.5rem] p-8 max-w-[420px] w-full relative z-10 shadow-2xl border border-slate-100 text-center animate-scaleUp">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-4 shadow-sm border border-emerald-100"><Star className="w-8 h-8 fill-current" /></div>
                        <h3 className="text-[1.25rem] font-bold text-slate-900 mb-2 leading-tight uppercase">Xác nhận thành công!</h3>
                        <p className="text-[0.875rem] text-slate-500 font-medium mb-6 leading-relaxed">Đơn hàng đã hoàn tất. TeddyPet rất mong nhận được đánh giá từ bạn! 🐾</p>
                        <div className="flex flex-col gap-2">
                            <Link to={`/feedback?orderId=${order.id}`} className="h-12 bg-slate-900 text-white rounded-xl font-bold text-[0.875rem] flex items-center justify-center gap-2 hover:bg-client-primary shadow-lg shadow-slate-100 transition-all uppercase tracking-wide"><Star width={16} height={16} /> Đánh giá ngay</Link>
                            <button onClick={() => setShowFeedbackModal(false)} className="h-9 text-slate-400 font-bold text-[0.75rem] hover:text-slate-900 transition-colors uppercase tracking-widest leading-none">Để sau nhé</button>
                        </div>
                    </div>
                </div>
            )}

            {showReturnModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-client-secondary/40 backdrop-blur-md" onClick={() => { setShowReturnModal(false); setReturnReason(""); setReturnEvidence(""); setIsCustomReturnReason(false); }}></div>
                    <div className="bg-white rounded-2xl p-6 max-w-[480px] w-full relative z-10 shadow-2xl border border-slate-100 animate-scaleUp">
                        <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mx-auto mb-4 shadow-sm border border-orange-100"><RefreshDouble width={28} height={28} /></div>
                        <h3 className="text-[1.125rem] font-bold text-slate-900 mb-1 uppercase text-center tracking-tight">Yêu cầu trả hàng</h3>
                        <p className="text-[0.75rem] text-slate-500 font-medium mb-5 text-center px-6 leading-relaxed">Hỗ trợ trả hàng trong 7 ngày nếu sản phẩm lỗi hoặc không đúng mô tả.</p>
                        <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-1">
                            <div className="grid grid-cols-2 gap-2">
                                <label className="text-[0.625rem] text-slate-400 font-bold uppercase tracking-widest col-span-2 px-1">Chọn lý do <span className="text-red-500">*</span></label>
                                {quickReturnReasons.map((reason, index) => (
                                    <button
                                        key={index}
                                        onClick={() => { if (reason === "Lý do khác") { setIsCustomReturnReason(true); setReturnReason(''); } else { setIsCustomReturnReason(false); setReturnReason(reason); } }}
                                        className={`p-2.5 rounded-xl text-left transition-all border-2 text-[0.75rem] font-bold ${(reason === "Lý do khác" && isCustomReturnReason) || returnReason === reason ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-slate-50 hover:border-slate-200 text-slate-600'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0 ${(reason === "Lý do khác" && isCustomReturnReason) || returnReason === reason ? 'border-orange-500 bg-orange-500' : 'border-slate-200'}`}>
                                                {((reason === "Lý do khác" && isCustomReturnReason) || returnReason === reason) && <CheckCircle width={6} height={6} className="text-white" />}
                                            </div>
                                            <span className="leading-tight">{reason}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            {isCustomReturnReason && (
                                <div className="animate-fadeIn">
                                    <textarea value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="Mô tả chi tiết..." className="w-full h-20 p-3 border border-slate-200 rounded-xl text-[0.8125rem] font-medium text-slate-700 focus:border-orange-300 focus:outline-none transition-all resize-none italic" maxLength={500} autoFocus />
                                </div>
                            )}
                            <div>
                                <label className="text-[0.625rem] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block px-1">Link ảnh bằng chứng</label>
                                <input type="text" value={returnEvidence} onChange={(e) => setReturnEvidence(e.target.value)} placeholder="Link 1, Link 2..." className="w-full h-9 px-3 border border-slate-200 rounded-xl text-[0.8125rem] font-medium focus:border-orange-300 focus:outline-none transition-all" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { setShowReturnModal(false); setReturnReason(""); setReturnEvidence(""); setIsCustomReturnReason(false); }} className="flex-1 h-11 bg-slate-50 text-slate-600 rounded-xl font-bold text-[0.8125rem] hover:bg-slate-100 transition-all uppercase">Hủy</button>
                            <button onClick={handleRequestReturn} disabled={isSubmittingReturn || !returnReason.trim()} className="flex-1 h-11 bg-slate-900 text-white rounded-xl font-bold text-[0.8125rem] hover:bg-client-primary transition-all shadow-md flex items-center justify-center gap-2 uppercase">{isSubmittingReturn ? <RefreshDouble width={14} height={14} className="animate-spin" /> : <ShieldCheck width={14} height={14} />}{isSubmittingReturn ? "Đang gửi" : "Gửi yêu cầu"}</button>
                        </div>
                    </div>
                </div>
            )}

            {showCancelModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" onClick={() => { setShowCancelModal(false); setCancelReason(""); setIsCustomReason(false); }}></div>
                    <div className="relative z-10 w-full max-w-[700px] max-h-[88vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-7 md:p-8 shadow-2xl animate-scaleUp">
                        <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                                    <WarningCircle width={20} height={20} strokeWidth={2.4} />
                                </div>
                                <div>
                                    <h3 className="text-[1.5rem] font-black tracking-tight text-slate-900">Hủy đơn hàng?</h3>
                                    <p className="mt-1 text-[0.9rem] font-medium text-slate-500">Vui lòng chọn lý do để TeddyPet cải thiện dịch vụ tốt hơn.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setShowCancelModal(false); setCancelReason(""); setIsCustomReason(false); }}
                                className="h-9 w-9 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                            >
                                <Xmark width={18} height={18} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">Chọn lý do hủy đơn</p>
                            <div className="flex flex-col gap-2.5">
                                {quickReasons.map((reason, index) => {
                                    const isSelected = (reason === "Lý do khác" && isCustomReason) || cancelReason === reason;
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                if (reason === "Lý do khác") {
                                                    setIsCustomReason(true);
                                                    setCancelReason('');
                                                } else {
                                                    setIsCustomReason(false);
                                                    setCancelReason(reason);
                                                }
                                            }}
                                            className={`min-h-[64px] w-full rounded-2xl border px-4 py-3 text-left transition-all flex items-center gap-3.5 ${isSelected
                                                ? 'border-rose-300 bg-rose-50 text-rose-700 shadow-sm'
                                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected
                                                ? 'border-rose-500 bg-rose-500'
                                                : 'border-slate-300 bg-white'
                                            }`}>
                                                {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                                            </span>
                                            <span className="text-[0.95rem] font-medium leading-6">{reason}</span>
                                        </button>
                                    );
                                })}

                                {isCustomReason && (
                                    <div className="mt-1 animate-fadeIn">
                                        <textarea
                                            value={cancelReason}
                                            onChange={(e) => setCancelReason(e.target.value)}
                                            placeholder="Nhập lý do cụ thể..."
                                            className="h-24 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[0.9rem] font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                                            maxLength={500}
                                            autoFocus
                                        />
                                        <p className="mt-1.5 text-right text-[11px] font-medium text-slate-400">{cancelReason.length}/500</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowCancelModal(false); setCancelReason(""); setIsCustomReason(false); }}
                                className="h-12 flex-1 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                disabled={isCancelling || !cancelReason.trim()}
                                className="h-12 flex-1 rounded-xl bg-rose-500 text-sm font-semibold text-white transition-colors hover:bg-rose-600 hover:shadow-md hover:shadow-rose-200 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isCancelling ? (
                                    <>
                                        <RefreshDouble width={14} height={14} className="animate-spin" />
                                        Đang hủy...
                                    </>
                                ) : (
                                    <>
                                        <WarningCircle width={14} height={14} />
                                        Xác nhận hủy
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};
