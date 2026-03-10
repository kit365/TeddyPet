import { format } from "date-fns";
import { showConfirmDialog } from "../../../utils/confirmation";
import { Link, useParams } from "react-router-dom";
import { ProductBanner } from "../product/sections/ProductBanner";
import { Sidebar } from "./sections/Sidebar";
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
    Download
} from "iconoir-react";
import { toast } from "react-toastify";
import { useState, useEffect, useRef } from "react";
import { confirmReceived, cancelOrder, requestReturn, downloadMyOrderInvoice, createPaymentUrl } from "../../../api/order.api";
import { ORDER_STATUS_MAP } from "../../../constants/status";
import { useLocation, useNavigate } from "react-router-dom";

// Component Stepper Siêu Cấp
const OrderStepper = ({ status }: { status: string }) => {
    const steps = [
        { key: 'PENDING', label: ORDER_STATUS_MAP.PENDING.label, icon: <ClipboardCheck className="w-[2.4rem] h-[2.4rem]" /> },
        { key: 'CONFIRMED', label: ORDER_STATUS_MAP.CONFIRMED.label, icon: <CheckCircle className="w-[2.4rem] h-[2.4rem]" /> },
        { key: 'PROCESSING', label: ORDER_STATUS_MAP.PROCESSING.label, icon: <BoxIcon className="w-[2.4rem] h-[2.4rem]" /> },
        { key: 'DELIVERING', label: ORDER_STATUS_MAP.DELIVERING.label, icon: <Truck className="w-[2.4rem] h-[2.4rem]" /> },
        { key: 'DELIVERED', label: ORDER_STATUS_MAP.DELIVERED.label, icon: <HomeSimple className="w-[2.4rem] h-[2.4rem]" /> },
        { key: 'COMPLETED', label: ORDER_STATUS_MAP.COMPLETED.label, icon: <Package className="w-[2.4rem] h-[2.4rem]" /> },
    ];

    if (status === 'RETURN_REQUESTED') {
        steps.push({ key: 'RETURN_REQUESTED', label: 'Yêu cầu trả', icon: <RefreshDouble className="w-[2.4rem] h-[2.4rem]" /> });
    }

    const currentIdx = steps.findIndex(s => s.key === status);
    const isCancelled = status === 'CANCELLED';

    if (isCancelled) {
        return (
            <div className="bg-red-50/50 border-2 border-dashed border-red-200 rounded-[32px] p-[30px] flex items-center gap-[20px] animate-fadeIn mb-[30px]">
                <div className="w-[60px] h-[60px] bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg">
                    <WarningCircle className="w-[3rem] h-[3rem]" />
                </div>
                <div>
                    <h3 className="text-[2rem] font-black text-red-600 uppercase">Đơn hàng đã hủy</h3>
                    <p className="text-[1.5rem] text-red-400 font-medium">TeddyPet rất tiếc vì đơn hàng này đã bị hủy trên hệ thống.</p>
                </div>
            </div>
        );
    }

    const isReturned = status === 'RETURNED';
    if (isReturned) {
        return (
            <div className="bg-orange-50/50 border-2 border-dashed border-orange-200 rounded-[32px] p-[30px] flex items-center gap-[20px] animate-fadeIn mb-[30px]">
                <div className="w-[60px] h-[60px] bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg">
                    <RefreshDouble className="w-[3rem] h-[3rem]" />
                </div>
                <div>
                    <h3 className="text-[2rem] font-black text-orange-600 uppercase">Đơn hàng đã hoàn trả</h3>
                    <p className="text-[1.5rem] text-orange-400 font-medium">Đơn hàng này đã được hoàn trả về shop.</p>
                </div>
            </div>
        );
    }

    const isCompleted = status === 'COMPLETED';

    return (
        <div className="bg-white p-[35px] rounded-[32px] border border-gray-100 shadow-sm mb-[30px] animate-fadeIn">
            <div className="relative flex items-center justify-between px-[1rem]">
                <div className="absolute top-[30px] left-[8%] right-[8%] h-[4px] bg-gray-100 -z-0 rounded-full"></div>
                <div
                    className={`absolute top-[30px] left-[8%] h-[4px] transition-all duration-[1200ms] ease-in-out -z-0 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-client-primary'}`}
                    style={{ width: currentIdx > 0 ? `${(currentIdx / (steps.length - 1)) * 84}%` : '0%' }}
                ></div>

                {steps.map((step, index) => {
                    const isActive = index <= currentIdx;
                    const isCurrent = index === currentIdx;

                    return (
                        <div key={step.key} className="flex flex-col items-center gap-[15px] z-10 w-[14%] relative">
                            <div
                                className={`w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all duration-700 ${isActive
                                    ? (isCompleted ? 'bg-emerald-500 shadow-emerald-200' : 'bg-client-primary shadow-client-primary/30') + ' text-white scale-110 shadow-lg'
                                    : 'bg-white text-gray-200 border-2 border-gray-100'
                                    } ${isCurrent ? (isCompleted ? 'ring-8 ring-emerald-50' : 'ring-8 ring-client-primary/10') : ''}`}
                            >
                                {step.icon}
                            </div>
                            <span className={`text-[1.2rem] font-bold text-center transition-colors duration-500 ${isActive
                                ? (isCompleted ? 'text-emerald-600' : 'text-client-secondary')
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
    const { order, loading: fetching, refreshing, refresh } = useOrderDetail(id as string);
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

    // Quick return reason options
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

            let count = 0;
            const poll = setInterval(() => {
                refresh();
                count++;
                if (count >= 10) clearInterval(poll);
            }, 2000);
        }
    }, [location.search, refresh]);

    const lastRefreshRef = useRef<string | null>(null);

    useEffect(() => {
        if (order?.status === 'CONFIRMED' && order?.payments?.[0]?.paymentMethod === 'BANK_TRANSFER' && order?.payments?.[0]?.status !== 'COMPLETED') {
            const timer = setInterval(() => {
                const createdAt = new Date(order.createdAt).getTime();
                const expireAt = createdAt + 60 * 60 * 1000; // 1 tiếng
                const now = new Date().getTime();
                const distance = expireAt - now;

                if (distance <= 0) {
                    setTimeLeft("Hết hạn");
                    clearInterval(timer);
                    // Chỉ refresh 1 lần duy nhất cho mỗi đơn hàng khi vừa hết hạn
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
                <div className="flex flex-col items-center gap-6">
                    <div className="w-[60px] h-[60px] border-[6px] border-client-primary/10 border-t-client-primary rounded-full animate-spin"></div>
                    <p className="text-[1.6rem] font-bold text-gray-400">Đang tải dữ liệu đơn hàng...</p>
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
                // Reload after some time or wait for webhook
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

    const isPaid = order.payments?.some(p => p.status === 'COMPLETED') ?? false;
    const paymentInfo = order.payments?.[0]; // Dùng để lấy method chính

    return (
        <div className="bg-[#fcfcfc] min-h-screen pb-[120px] relative">
            {/* Background Refresh Loading Overlay */}
            {refreshing && (
                <div className="fixed top-[100px] right-[40px] z-[100] bg-white/80 backdrop-blur-sm border border-gray-100 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-slideInRight">
                    <div className="w-5 h-5 border-2 border-client-primary/10 border-t-client-primary rounded-full animate-spin"></div>
                    <span className="text-[1.2rem] font-bold text-gray-500 uppercase tracking-widest">Đang cập nhật...</span>
                </div>
            )}

            <ProductBanner
                pageTitle={`Chi tiết đơn hàng`}
                breadcrumbs={breadcrumbs}
                url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-listing.jpg"
                className="bg-top"
            />

            <div className="app-container app-container-wider mt-[-100px] relative z-20">
                <div className="flex gap-[30px] items-stretch">
                    <div className="w-[320px] shrink-0">
                        <Sidebar />
                    </div>

                    <div className="flex-1 space-y-[30px]">

                        {/* Header: Mã đơn hàng & Nút quay lại */}
                        <div className="flex justify-between items-center bg-white p-[25px] px-[35px] rounded-[24px] border border-gray-100 shadow-sm animate-fadeIn">
                            <div className="flex items-center gap-4">
                                <h2 className="text-[2.2rem] font-black text-client-secondary uppercase">Mã đơn: {order.orderCode}</h2>
                                <button
                                    onClick={() => copyToClipboard(order.orderCode)}
                                    className="w-[40px] h-[40px] bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-client-primary hover:bg-client-primary/10 transition-all active:scale-90"
                                    title="Sao chép mã đơn"
                                >
                                    <Copy className="w-[2rem] h-[2rem]" />
                                </button>
                                <button
                                    onClick={handleDownloadInvoice}
                                    disabled={isDownloadingInvoice}
                                    className="ml-2 px-4 py-2 bg-client-primary/10 text-client-primary rounded-lg font-bold flex items-center gap-2 hover:bg-client-primary hover:text-white transition-all disabled:opacity-50"
                                >
                                    {isDownloadingInvoice ? <RefreshDouble className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                    <span className="hidden sm:inline">Xuất hóa đơn</span>
                                </button>
                            </div>
                            <Link to="/dashboard/orders" className="text-[1.4rem] font-bold text-gray-400 hover:text-client-primary flex items-center gap-2 transition-all">
                                <NavArrowRight className="w-5 h-5 rotate-180" /> Quay lại danh sách
                            </Link>
                        </div>

                        {/* 1. TIMELINE (STEPPER) */}
                        {/* Hiển thị lý do hủy/hoàn trả nếu có - Di chuyển lên đầu */}
                        <OrderStepper status={order.status} />

                        {/* Hiển thị lý do hủy/hoàn trả nếu có - Di chuyển xuống dưới Stepper */}
                        {(order.status === 'CANCELLED' || order.status === 'RETURNED' || order.status === 'RETURN_REQUESTED' || ((order.status as string) === 'COMPLETED' && (order.returnReason || order.adminReturnNote))) && (
                            <div className="space-y-6 animate-fadeIn mt-6">
                                {(order.status === 'CANCELLED' || order.status === 'RETURNED') && order.cancelReason && (
                                    <div className="p-6 bg-gray-50 rounded-[24px] border border-gray-200">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-[40px] h-[40px] rounded-xl flex items-center justify-center shrink-0 ${order.status === 'CANCELLED' ? 'bg-red-100 text-red-500' : 'bg-orange-100 text-orange-500'}`}>
                                                <WarningCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-[1.2rem] text-gray-400 font-bold uppercase tracking-wider mb-1">Lý do {order.status === 'CANCELLED' ? 'hủy' : 'hoàn trả'}</div>
                                                <div className="text-[1.4rem] font-bold text-gray-600">{order.cancelReason}</div>
                                                {order.cancelledBy && (
                                                    <div className="text-[1.2rem] text-gray-400 mt-2">Thực hiện bởi: <span className="font-bold">{order.cancelledBy}</span></div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Hiển thị yêu cầu trả hàng của khách - PHIÊN BẢN COMPACT & BALANCED */}
                                {((order.status as string) === 'RETURNED' || (order.status as string) === 'RETURN_REQUESTED' || ((order.status as string) === 'COMPLETED' && (order.returnReason || order.adminReturnNote))) && (
                                    <div className={`relative overflow-hidden rounded-[24px] p-6 border transition-all duration-300
                                        ${(order.status as string) === 'COMPLETED' && order.adminReturnNote
                                            ? 'bg-red-50/60 border-red-100'
                                            : 'bg-blue-50/60 border-blue-100'
                                        }`}>

                                        {/* Background Icon Decoration - Reduced opacity & size */}
                                        <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
                                            {(order.status as string) === 'COMPLETED' && order.adminReturnNote ? (
                                                <WarningCircle className="w-[12rem] h-[12rem] text-red-500" />
                                            ) : (
                                                <RefreshDouble className="w-[12rem] h-[12rem] text-blue-500" />
                                            )}
                                        </div>

                                        <div className="relative z-10">
                                            {/* Header Section - Compact */}
                                            <div className="flex items-start gap-5 mb-6">
                                                <div className={`w-[56px] h-[56px] rounded-[16px] flex items-center justify-center shrink-0 shadow-md
                                                    ${(order.status as string) === 'COMPLETED' && order.adminReturnNote
                                                        ? 'bg-red-500 text-white shadow-red-200'
                                                        : 'bg-blue-500 text-white shadow-blue-200'
                                                    }`}>
                                                    {(order.status as string) === 'COMPLETED' && order.adminReturnNote ? (
                                                        <WarningCircle className="w-[2.8rem] h-[2.8rem]" />
                                                    ) : (
                                                        <RefreshDouble className="w-[2.8rem] h-[2.8rem]" />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h3 className={`text-[2rem] font-black uppercase leading-[1.2] mb-1.5
                                                        ${(order.status as string) === 'COMPLETED' && order.adminReturnNote
                                                            ? 'text-red-600'
                                                            : 'text-blue-600'
                                                        }`}>
                                                        {(order.status as string) === 'RETURN_REQUESTED' ? 'Đang xử lý yêu cầu' :
                                                            ((order.status as string) === 'COMPLETED' && order.adminReturnNote ? 'Yêu cầu trả hàng bị từ chối' : 'Thông tin trả hàng')}
                                                    </h3>
                                                    <p className="text-[1.4rem] font-medium text-gray-500 pr-4 leading-relaxed">
                                                        {(order.status as string) === 'COMPLETED' && order.adminReturnNote
                                                            ? 'Admin đã xem xét và từ chối yêu cầu. Vui lòng kiểm tra lý do bên dưới.'
                                                            : 'Yêu cầu trả hàng của bạn đang được TeddyPet xem xét.'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Content Section - Simplified */}
                                            <div className="bg-white/60 backdrop-blur-sm rounded-[20px] p-6 border border-white/50 space-y-6 shadow-sm">

                                                {/* Admin Response Highlight */}
                                                {order.adminReturnNote && (
                                                    <div className="pb-6 border-b border-dashed border-gray-300">
                                                        <span className="text-[1.3rem] font-bold text-gray-400 uppercase tracking-wider block mb-3 flex items-center gap-2">
                                                            <ChatBubble className="w-4 h-4" /> Lý do từ chối
                                                        </span>
                                                        <div className="text-[1.6rem] font-bold text-red-600 leading-relaxed pl-4 border-l-4 border-red-400">
                                                            "{order.adminReturnNote}"
                                                        </div>
                                                    </div>
                                                )}

                                                {/* User Request Reason */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-[1.3rem] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                            <HelpCircle className="w-4 h-4" /> Lý do bạn gửi
                                                        </span>
                                                    </div>
                                                    <div className="text-[1.5rem] font-medium text-gray-600 italic pl-4">
                                                        "{order.returnReason}"
                                                    </div>

                                                    {/* Evidence Images */}
                                                    {order.returnEvidence && (
                                                        <div className="mt-4 flex flex-wrap gap-2 pl-4">
                                                            {order.returnEvidence.split(',').map((url, i) => (
                                                                <a key={i} href={url} target="_blank" className="w-[70px] h-[70px] rounded-[16px] overflow-hidden border-2 border-white shadow-sm hover:scale-105 transition-all hover:border-client-primary">
                                                                    <img src={url} alt="Bằng chứng" className="w-full h-full object-cover" />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>


                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 2. ĐỊA CHỈ & HỖ TRỢ (Grid 1:1) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[30px] animate-fadeIn">
                            {/* Địa chỉ nhận hàng */}
                            <div className="bg-white p-[35px] rounded-[32px] border border-gray-100 shadow-sm">
                                <h3 className="text-[1.8rem] font-black text-client-secondary mb-[25px] flex items-center gap-3">
                                    <MapPin className="w-[2.4rem] h-[2.4rem] text-client-primary" />
                                    Địa chỉ nhận hàng
                                </h3>
                                <div className="space-y-5">
                                    <div>
                                        <div className="text-[1.2rem] text-gray-400 font-bold uppercase tracking-widest mb-1">Người nhận</div>
                                        <div className="text-[1.6rem] font-black text-client-secondary uppercase">{order.shippingName}</div>
                                        <div className="flex items-center gap-2 text-client-primary font-bold mt-1">
                                            <Phone className="w-4 h-4" /> {order.shippingPhone}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[1.2rem] text-gray-400 font-bold uppercase tracking-widest mb-1">Địa chỉ</div>
                                        <div className="text-[1.4rem] font-bold text-gray-600 leading-relaxed italic">
                                            {order.shippingAddress}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cần hỗ trợ? */}
                            <div className="bg-white p-[35px] rounded-[32px] border border-gray-100 shadow-sm bg-gradient-to-tr from-white to-blue-50/30">
                                <h3 className="text-[1.8rem] font-black text-client-secondary mb-[25px] flex items-center gap-3">
                                    <HelpCircle className="w-[2.4rem] h-[2.4rem] text-blue-500" />
                                    Bạn cần hỗ trợ?
                                </h3>
                                <div className="space-y-4">
                                    <p className="text-[1.4rem] text-gray-500 font-medium leading-relaxed mb-6">
                                        TeddyPet luôn sẵn sàng lắng nghe và giải quyết mọi vấn đề của bạn trong vòng 24h.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <a href="https://m.me/teddypet" target="_blank" className="flex items-center justify-center gap-3 h-[55px] bg-client-secondary text-white rounded-[20px] font-black text-[1.4rem] hover:scale-105 transition-all shadow-lg shadow-client-secondary/20">
                                            <ChatBubble className="w-5 h-5" /> Liên hệ Shop
                                        </a>
                                        <Link to="/bai-viet" className="flex items-center justify-center gap-3 h-[55px] bg-white border-2 border-gray-100 text-gray-500 rounded-[20px] font-black text-[1.4rem] hover:border-blue-200 hover:text-blue-500 transition-all">
                                            <HelpCircle className="w-5 h-5" /> Trung tâm hỗ trợ
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. DANH SÁCH SẢN PHẨM */}
                        <div className="bg-white p-[35px] rounded-[32px] border border-gray-100 shadow-sm animate-fadeIn">
                            <h3 className="text-[1.8rem] font-black text-client-secondary mb-[30px] flex items-center gap-3">
                                <Package className="w-[2.4rem] h-[2.4rem] text-client-primary" />
                                Sản phẩm đã đặt ({order.orderItems?.length})
                            </h3>
                            <div className="space-y-4">
                                {order.orderItems?.map((item, idx) => (
                                    <div key={idx} className="flex gap-6 p-5 rounded-[24px] hover:bg-gray-50/50 border border-transparent hover:border-gray-100 transition-all group">
                                        <div className="w-[90px] h-[90px] rounded-[18px] overflow-hidden bg-white border border-gray-100 shrink-0 relative shadow-sm">
                                            <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute top-0 right-0 bg-client-primary text-white text-[1rem] font-black px-2 py-1 rounded-bl-xl">x{item.quantity}</div>
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center min-w-0">
                                            <h4 className="text-[1.6rem] font-bold text-client-secondary truncate group-hover:text-client-primary transition-colors">{item.productName}</h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[1.2rem] font-bold text-gray-400 uppercase tracking-widest">{item.variantName}</span>
                                            </div>
                                            <div className="mt-2 text-[1.6rem] font-black text-client-secondary">{(item.unitPrice * item.quantity).toLocaleString()}đ</div>
                                        </div>
                                        {order.status === 'COMPLETED' && (
                                            <div className="flex items-center">
                                                <Link
                                                    to={`/feedback?orderId=${order.id}&productId=${item.productId}${item.variantId ? `&variantId=${item.variantId}` : ''}`}
                                                    className="flex items-center gap-2 px-6 py-2 bg-client-primary/10 text-client-primary rounded-full font-bold text-[1.2rem] hover:bg-client-primary hover:text-white transition-all shadow-sm"
                                                >
                                                    <Star className="w-4 h-4" /> Đánh giá sản phẩm
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 4. THANH TOÁN & CHI TIẾT THỜI GIAN */}
                        <div className="bg-white p-[40px] rounded-[32px] border border-gray-100 shadow-xl shadow-gray-100/20 animate-fadeIn">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* Cột trái: Thông tin thanh toán & Timeline */}
                                <div className="space-y-6">
                                    <h3 className="text-[1.8rem] font-black text-client-secondary mb-[10px] pb-4 border-b border-gray-100 uppercase tracking-tight">Chi tiết thanh toán</h3>

                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-[40px] h-[40px] bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                                                <Wallet className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-[1.1rem] text-gray-400 font-bold uppercase tracking-wider">Phương thức</div>
                                                <div className="text-[1.4rem] font-black text-client-secondary">
                                                    {paymentInfo?.paymentMethod === 'BANK_TRANSFER'
                                                        ? (isPaid ? 'Chuyển khoản VietQR (PayOS) - Đã thanh toán' : 'Chuyển khoản VietQR (PayOS) - Chờ thanh toán')
                                                        : 'Thanh toán khi nhận hàng (COD)'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-[40px] h-[40px] bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-[1.1rem] text-gray-400 font-bold uppercase tracking-wider">Thời gian đặt</div>
                                                <div className="text-[1.4rem] font-black text-client-secondary">{format(new Date(order.createdAt), "HH:mm - dd/MM/yyyy")}</div>
                                            </div>
                                        </div>

                                        {isPaid && (
                                            <div className="flex items-start gap-4 animate-fadeIn">
                                                <div className="w-[40px] h-[40px] bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
                                                    <ShieldCheck className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="text-[1.1rem] text-gray-400 font-bold uppercase tracking-wider">Xác nhận thanh toán</div>
                                                    <div className="text-[1.4rem] font-black text-client-secondary">Đã hoàn tất lúc {format(new Date(order.updatedAt), "HH:mm - dd/MM/yyyy")}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Cột phải: Tổng cộng hóa đơn */}
                                <div className="bg-gray-50/50 p-8 rounded-[28px] border border-gray-100">
                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between items-center text-[1.5rem]">
                                            <span className="text-gray-400 font-bold uppercase tracking-wider">Tổng giá trị sản phẩm</span>
                                            <span className="font-black text-client-secondary">{order.subtotal.toLocaleString()}đ</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[1.5rem]">
                                            <span className="text-gray-400 font-bold uppercase tracking-wider">Phí vận chuyển</span>
                                            <span className="font-black text-client-secondary">+{order.shippingFee.toLocaleString()}đ</span>
                                        </div>
                                        {order.discountAmount > 0 && (
                                            <div className="flex justify-between items-center text-[1.5rem] text-red-500">
                                                <span className="font-bold uppercase tracking-wider">Khuyến mãi</span>
                                                <span className="font-black">-{order.discountAmount.toLocaleString()}đ</span>
                                            </div>
                                        )}
                                        {timeLeft && timeLeft !== "Hết hạn" && (
                                            <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl border border-amber-100 animate-pulse">
                                                <span className="text-[1.2rem] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" /> Thanh toán trong
                                                </span>
                                                <span className="text-[1.6rem] font-black text-amber-700">{timeLeft}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-6 border-t-2 border-dashed border-gray-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[1.8rem] font-black text-client-secondary uppercase">Tổng đơn hàng</span>
                                            <span className="text-[3.2rem] font-black text-client-primary tracking-tighter">
                                                {order.finalAmount.toLocaleString()}đ
                                            </span>
                                        </div>
                                        <div className="text-right mt-2">
                                            <span className="px-5 py-1.5 bg-white border border-gray-100 rounded-full text-[1.2rem] font-black text-client-primary shadow-sm uppercase italic">
                                                Đơn hàng sạch - Trọn yêu thương
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Nút hành động nổi bật khi đã giao */}
                            {order.status === 'DELIVERED' && (
                                <button
                                    onClick={handleConfirmReceived}
                                    disabled={isSubmitting}
                                    className="w-full h-[65px] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[1.7rem] rounded-[24px] transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 mt-10 hover:scale-[1.01] active:scale-95"
                                >
                                    {isSubmitting ? <RefreshDouble className="w-[2.4rem] h-[2.4rem] animate-spin" /> : <CheckCircle className="w-[2.4rem] h-[2.4rem]" />}
                                    {isSubmitting ? "Đang xác nhận..." : "TÔI ĐÃ NHẬN ĐƯỢC HÀNG"}
                                </button>
                            )}

                            {/* Nút thanh toán online cho đơn đã xác nhận */}
                            {order.status === 'CONFIRMED' && paymentInfo?.paymentMethod === 'BANK_TRANSFER' && !isPaid && (
                                <div className="space-y-4 mt-10">
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-[20px] flex items-start gap-4 animate-fadeIn">
                                        <WarningCircle className="w-6 h-6 text-blue-500 shrink-0" />
                                        <p className="text-[1.3rem] font-medium text-blue-700 leading-relaxed">
                                            <strong>Lưu ý:</strong> Vui lòng thanh toán <strong>chính xác số tiền</strong> ({order.finalAmount.toLocaleString()}đ) để hệ thống tự động xác nhận đơn hàng ngay lập tức. Nếu chuyển sai số tiền, việc xác nhận sẽ mất nhiều thời gian hơn.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handlePayment}
                                        disabled={isSubmitting || timeLeft === "Hết hạn"}
                                        className="w-full h-[65px] bg-client-primary hover:bg-client-secondary text-white font-black text-[1.7rem] rounded-[24px] transition-all shadow-xl shadow-client-primary/20 flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-95 animate-pulse-slow disabled:opacity-50 disabled:animate-none"
                                    >
                                        {isSubmitting ? <RefreshDouble className="w-[2.4rem] h-[2.4rem] animate-spin" /> : <Wallet className="w-[2.4rem] h-[2.4rem]" />}
                                        {timeLeft === "Hết hạn" ? "THANH TOÁN ĐÃ HẾT HẠN" : "THANH TOÁN LÀ XONG - NHẬN HÀNG NGAY!"}
                                    </button>
                                </div>
                            )}

                            {/* Nút hủy đơn khi đơn đang chờ xác nhận */}
                            {order.status === 'PENDING' && (
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    className="w-full h-[65px] bg-red-50 hover:bg-red-100 text-red-600 border-2 border-red-200 font-black text-[1.7rem] rounded-[24px] transition-all flex items-center justify-center gap-3 mt-10 hover:scale-[1.01] active:scale-95"
                                >
                                    <WarningCircle className="w-[2.4rem] h-[2.4rem]" />
                                    HỦY ĐƠN HÀNG
                                </button>
                            )}

                            {/* Nút yêu cầu trả hàng khi đã hoàn thành trong vòng 4 ngày */}
                            {order.status === 'COMPLETED' && isWithinReturnPeriod() && (
                                <button
                                    onClick={() => setShowReturnModal(true)}
                                    className="w-full h-[65px] bg-orange-50 hover:bg-orange-100 text-orange-600 border-2 border-orange-200 font-black text-[1.7rem] rounded-[24px] transition-all flex items-center justify-center gap-3 mt-10 hover:scale-[1.01] active:scale-95"
                                >
                                    <RefreshDouble className="w-[2.4rem] h-[2.4rem]" />
                                    {order.adminReturnNote ? "GỬI LẠI YÊU CẦU TRẢ HÀNG" : "YÊU CẦU TRẢ HÀNG / HOÀN TIỀN"}
                                </button>
                            )}


                        </div>

                    </div>
                </div>
            </div>
            {/* Modal Gợi ý Đánh giá */}
            {showFeedbackModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-client-secondary/40 backdrop-blur-md"
                        onClick={() => setShowFeedbackModal(false)}
                    ></div>
                    <div className="bg-white rounded-[40px] p-10 max-w-[500px] w-full relative z-10 shadow-2xl border border-gray-100 text-center animate-scaleUp">
                        <div className="w-[100px] h-[100px] bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-6 shadow-sm border border-emerald-100">
                            <Star className="w-[5rem] h-[5rem] fill-current" />
                        </div>
                        <h3 className="text-[2.6rem] font-black text-client-secondary mb-4 leading-tight uppercase">
                            Tuyệt vời quá!
                        </h3>
                        <p className="text-[1.6rem] text-gray-500 font-medium mb-8 leading-relaxed">
                            Đơn hàng đã hoàn tất. Bạn hãy dành chút thời gian đánh giá sản phẩm để TeddyPet ngày càng hoàn thiện hơn nhé! 🐾
                        </p>
                        <div className="flex flex-col gap-3">
                            <Link
                                to={`/feedback?orderId=${order.id}`}
                                className="h-[65px] bg-client-primary text-white rounded-[24px] font-black text-[1.8rem] flex items-center justify-center gap-3 hover:bg-client-secondary shadow-xl shadow-client-primary/30 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                <Star className="w-6 h-6" /> ĐÁNH GIÁ NGAY
                            </Link>
                            <button
                                onClick={() => setShowFeedbackModal(false)}
                                className="h-[55px] text-gray-400 font-bold text-[1.5rem] hover:text-client-secondary transition-colors uppercase tracking-widest"
                            >
                                Để sau nhé
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Yêu Cầu Trả Hàng */}
            {showReturnModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-client-secondary/40 backdrop-blur-md"
                        onClick={() => { setShowReturnModal(false); setReturnReason(""); setReturnEvidence(""); setIsCustomReturnReason(false); }}
                    ></div>
                    <div className="bg-white rounded-[40px] p-10 max-w-[540px] w-full relative z-10 shadow-2xl border border-gray-100 animate-scaleUp">
                        <div className="w-[80px] h-[80px] bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mx-auto mb-6 shadow-sm border border-orange-100">
                            <RefreshDouble className="w-[4rem] h-[4rem]" />
                        </div>
                        <h3 className="text-[2.4rem] font-black text-client-secondary mb-2 leading-tight uppercase text-center">
                            Yêu cầu trả hàng
                        </h3>
                        <p className="text-[1.4rem] text-gray-500 font-medium mb-6 leading-relaxed text-center px-6">
                            TeddyPet cam kết hỗ trợ đổi trả nếu sản phẩm lỗi, vỡ hoặc không đúng cam kết trong vòng 4 ngày.
                        </p>

                        <div className="space-y-6 mb-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {/* Quick Return Reasons */}
                            <div className="grid grid-cols-1 gap-3">
                                <label className="text-[1.2rem] text-gray-400 font-bold uppercase tracking-widest mb-1 block">Chọn lý do trả hàng <span className="text-red-500">*</span></label>
                                {quickReturnReasons.map((reason, index) => (
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
                                        className={`p-4 rounded-[16px] text-left transition-all border-2 ${(reason === "Lý do khác" && isCustomReturnReason) || returnReason === reason
                                            ? 'border-orange-400 bg-orange-50 text-orange-600'
                                            : 'border-gray-100 hover:border-gray-200 text-gray-600'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${(reason === "Lý do khác" && isCustomReturnReason) || returnReason === reason
                                                ? 'border-orange-500 bg-orange-500'
                                                : 'border-gray-300'
                                                }`}>
                                                {((reason === "Lý do khác" && isCustomReturnReason) || returnReason === reason) && (
                                                    <CheckCircle className="w-3 h-3 text-white" />
                                                )}
                                            </div>
                                            <span className="text-[1.4rem] font-bold">{reason}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Custom Return Reason Input */}
                            {isCustomReturnReason && (
                                <div className="animate-fadeIn">
                                    <label className="text-[1.2rem] text-gray-400 font-bold uppercase tracking-widest mb-2 block">Mô tả chi tiết lý do <span className="text-red-500">*</span></label>
                                    <textarea
                                        value={returnReason}
                                        onChange={(e) => setReturnReason(e.target.value)}
                                        placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải..."
                                        className="w-full h-[100px] p-5 border-2 border-gray-100 rounded-[20px] text-[1.4rem] font-medium text-gray-700 focus:border-orange-300 focus:outline-none transition-all resize-none italic"
                                        maxLength={500}
                                        autoFocus
                                    />
                                    <div className="text-right text-[1.1rem] text-gray-400 mt-1">{returnReason.length}/500</div>
                                </div>
                            )}

                            <div>
                                <label className="text-[1.2rem] text-gray-400 font-bold uppercase tracking-widest mb-2 block">Link ảnh bằng chứng (nếu có)</label>
                                <input
                                    type="text"
                                    value={returnEvidence}
                                    onChange={(e) => setReturnEvidence(e.target.value)}
                                    placeholder="Link 1, Link 2..."
                                    className="w-full h-[55px] px-5 border-2 border-gray-100 rounded-[20px] text-[1.4rem] font-medium text-gray-700 focus:border-orange-300 focus:outline-none transition-all italic"
                                />
                                <p className="text-[1.1rem] text-gray-400 mt-2 italic px-2">Phân cách các link ảnh bằng dấu phẩy</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => { setShowReturnModal(false); setReturnReason(""); setReturnEvidence(""); setIsCustomReturnReason(false); }}
                                className="flex-1 h-[60px] bg-gray-100 text-gray-600 rounded-[20px] font-bold text-[1.5rem] hover:bg-gray-200 transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleRequestReturn}
                                disabled={isSubmittingReturn || !returnReason.trim()}
                                className="flex-1 h-[60px] bg-client-secondary text-white rounded-[20px] font-black text-[1.5rem] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-client-secondary/20 flex items-center justify-center gap-2 uppercase"
                            >
                                {isSubmittingReturn ? <RefreshDouble className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                {isSubmittingReturn ? "Đang gửi..." : "Gửi yêu cầu"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Hủy Đơn Hàng */}
            {showCancelModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-client-secondary/40 backdrop-blur-md"
                        onClick={() => { setShowCancelModal(false); setCancelReason(""); setIsCustomReason(false); }}
                    ></div>
                    <div className="bg-white rounded-[40px] p-10 max-w-[540px] w-full relative z-10 shadow-2xl border border-gray-100 animate-scaleUp">
                        <div className="w-[80px] h-[80px] bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6 shadow-sm border border-red-100">
                            <WarningCircle className="w-[4rem] h-[4rem]" />
                        </div>
                        <h3 className="text-[2.4rem] font-black text-client-secondary mb-2 leading-tight uppercase text-center">
                            Hủy đơn hàng?
                        </h3>
                        <p className="text-[1.4rem] text-gray-500 font-medium mb-6 leading-relaxed text-center">
                            Vui lòng cho TeddyPet biết lý do bạn muốn hủy
                        </p>

                        {/* Quick Reason Options */}
                        <div className="grid grid-cols-1 gap-3 mb-6">
                            {quickReasons.map((reason, index) => (
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
                                    className={`p-4 rounded-[16px] text-left transition-all border-2 ${(reason === "Lý do khác" && isCustomReason) || cancelReason === reason
                                        ? 'border-red-400 bg-red-50 text-red-600'
                                        : 'border-gray-100 hover:border-gray-200 text-gray-600'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${(reason === "Lý do khác" && isCustomReason) || cancelReason === reason
                                            ? 'border-red-500 bg-red-500'
                                            : 'border-gray-300'
                                            }`}>
                                            {((reason === "Lý do khác" && isCustomReason) || cancelReason === reason) && (
                                                <CheckCircle className="w-3 h-3 text-white" />
                                            )}
                                        </div>
                                        <span className="text-[1.4rem] font-bold">{reason}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Custom Reason Input - only shown when "Lý do khác" selected */}
                        {isCustomReason && (
                            <div className="mb-6">
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Nhập lý do hủy đơn của bạn..."
                                    className="w-full h-[100px] p-4 border-2 border-gray-200 rounded-[16px] text-[1.4rem] font-medium text-gray-700 focus:border-red-300 focus:outline-none transition-all resize-none"
                                    maxLength={500}
                                    autoFocus
                                />
                                <div className="text-right text-[1.2rem] text-gray-400 mt-1">{cancelReason.length}/500</div>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={() => { setShowCancelModal(false); setCancelReason(""); setIsCustomReason(false); }}
                                className="flex-1 h-[55px] bg-gray-100 text-gray-600 rounded-[20px] font-bold text-[1.5rem] hover:bg-gray-200 transition-all"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                disabled={isCancelling || !cancelReason.trim()}
                                className="flex-1 h-[55px] bg-red-500 text-white rounded-[20px] font-black text-[1.5rem] hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isCancelling ? <RefreshDouble className="w-5 h-5 animate-spin" /> : <WarningCircle className="w-5 h-5" />}
                                {isCancelling ? "Đang xử lý..." : "Xác nhận hủy"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(25px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
                .animate-scaleUp {
                    animation: scaleUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
            `}</style>
        </div>
    );
};
