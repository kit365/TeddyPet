import { useState, useEffect, useRef } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { ProductBanner } from "../product/sections/ProductBanner";
import { FooterSub } from "../../components/layouts/FooterSub";
import { trackOrder, confirmReceived, lookupGuestOrder } from "../../../api/order.api";
import { OrderResponse } from "../../../types/order.type";
import { toast } from "react-toastify";
import {
    Search, Package, MapPin, CheckCircle, WarningCircle,
    RefreshDouble, ClipboardCheck, Truck, Box as BoxIcon, HomeSimple,
    Mail, Copy, HelpCircle, ChatBubble, Wallet, Calendar,
    ShieldCheck, InfoCircle, Star
} from "iconoir-react";
import { format } from "date-fns";
import { useAuthStore } from "../../../stores/useAuthStore";

const breadcrumbs = [
    { label: "Trang chủ", to: "/" },
    { label: "Tra cứu đơn hàng", to: "#" },
];

// Component Stepper Đồng bộ Premium
const OrderStepper = ({ status }: { status: string }) => {
    const steps = [
        { key: 'PENDING', label: 'Chờ nhận đơn', icon: <ClipboardCheck className="w-[1.92rem] h-[1.92rem]" /> },
        { key: 'CONFIRMED', label: 'Đã xác nhận', icon: <CheckCircle className="w-[1.92rem] h-[1.92rem]" /> },
        { key: 'PROCESSING', label: 'Đang đóng gói', icon: <BoxIcon className="w-[1.92rem] h-[1.92rem]" /> },
        { key: 'DELIVERING', label: 'Đang giao', icon: <Truck className="w-[1.92rem] h-[1.92rem]" /> },
        { key: 'DELIVERED', label: 'Đã giao', icon: <HomeSimple className="w-[1.92rem] h-[1.92rem]" /> },
        { key: 'COMPLETED', label: 'Hoàn thành', icon: <Package className="w-[1.92rem] h-[1.92rem]" /> },
    ];

    const currentIdx = steps.findIndex(s => s.key === status);
    const isCancelled = status === 'CANCELLED';

    if (isCancelled) {
        return (
            <div className="bg-red-50/50 border-2 border-dashed border-red-200 rounded-[24px] p-[20px] flex items-center gap-[14px] animate-fadeIn mb-[20px]">
                <div className="w-[46px] h-[46px] bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg">
                    <WarningCircle className="w-[2.4rem] h-[2.4rem]" />
                </div>
                <div>
                    <h3 className="text-[1.6rem] font-black text-red-600 uppercase">Đơn hàng đã hủy</h3>
                    <p className="text-[1.201rem] text-red-400 font-medium">Lưu ý: Đơn hàng này không còn hiệu lực trên hệ thông TeddyPet.</p>
                </div>
            </div>
        );
    }

    const isCompleted = status === 'COMPLETED';

    return (
        <div className="bg-white p-[22px] rounded-[24px] border border-gray-100 shadow-sm mb-[20px] animate-fadeIn">
            <div className="relative flex items-center justify-between px-[0.8rem]">
                <div className="absolute top-[22px] left-[8%] right-[8%] h-[4px] bg-gray-100 -z-0 rounded-full"></div>
                <div
                    className={`absolute top-[22px] left-[8%] h-[4px] transition-all duration-[1200ms] ease-in-out -z-0 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-client-primary'}`}
                    style={{ width: currentIdx > 0 ? `${(currentIdx / (steps.length - 1)) * 84}%` : '0%' }}
                ></div>

                {steps.map((step, index) => {
                    const isActive = index <= currentIdx;
                    const isCurrent = index === currentIdx;

                    return (
                        <div key={step.key} className="flex flex-col items-center gap-[10px] z-10 w-[14%] relative">
                            <div
                                className={`w-[46px] h-[46px] rounded-full flex items-center justify-center transition-all duration-700 ${isActive
                                    ? (isCompleted ? 'bg-emerald-500 shadow-emerald-200' : 'bg-client-primary shadow-client-primary/30') + ' text-white scale-110 shadow-lg'
                                    : 'bg-white text-gray-200 border-2 border-gray-100'
                                    } ${isCurrent ? (isCompleted ? 'ring-8 ring-emerald-50' : 'ring-8 ring-client-primary/10') : ''}`}
                            >
                                {step.icon}
                            </div>
                            <span className={`text-[0.96rem] font-bold text-center transition-colors duration-500 ${isActive
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

export const OrderTrackingPage = () => {
    const location = useLocation();
    const { user } = useAuthStore();
    const isAuthenticated = !!user;

    const [orderCode, setOrderCode] = useState("");
    const [email, setEmail] = useState("");
    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const navigate = useNavigate();

    const hasAutoLooked = useRef(false);

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const codeFromUrl = urlParams.get("code");
        const emailFromUrl = urlParams.get("email");
        if (codeFromUrl && codeFromUrl !== orderCode) setOrderCode(codeFromUrl);
        if (emailFromUrl && emailFromUrl !== email) setEmail(emailFromUrl);
    }, [location.search]);

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const codeFromUrl = urlParams.get("code");
        const emailFromUrl = urlParams.get("email");
        
        if (codeFromUrl && !hasAutoLooked.current && !order) {
            const targetEmail = emailFromUrl || email;
            if (isAuthenticated || targetEmail) {
                hasAutoLooked.current = true;
                doTrackOrder(codeFromUrl, targetEmail);
            }
        }
    }, [location.search, isAuthenticated, email, order]);

    const doTrackOrder = async (code: string, emailInput?: string) => {
        if (!code) return;
        setLoading(true);
        setError(null);
        try {
            let response;
            // Theo backend mới: /api/orders/track/{code} là public
            // Tuy nhiên vẫn dùng logic Guest Lookup nếu là khách vãng lai để bảo mật
            if (isAuthenticated) {
                response = await trackOrder(code.trim());
            } else {
                if (!emailInput) {
                    setError("Vui lòng nhập Email đặt hàng để bảo mật.");
                    setLoading(false);
                    return;
                }
                response = await lookupGuestOrder(code.trim(), emailInput.trim());
            }

            if (response.success && response.data) {
                // Nếu đã đăng nhập và tra cứu thành công đơn của mình -> nhảy vào trang dashboard detail luôn
                if (isAuthenticated) {
                    navigate(`/dashboard/orders/${response.data.id}`);
                    return;
                }
                setOrder(response.data);
            } else {
                setError("Không tìm thấy đơn hàng. Vui lòng kiểm tra lại thông tin.");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Không thể tìm thấy đơn hàng này.");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmReceived = async () => {
        if (!order) return;
        setIsSubmitting(true);
        try {
            await confirmReceived(order.id);
            toast.success("Xác nhận đã nhận hàng thành công. TeddyPet cảm ơn bạn!");
            setOrder({ ...order, status: 'COMPLETED' as const });
            setShowFeedbackModal(true);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra!");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleManualLookup = (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderCode) { toast.error("Nhập mã đơn hàng!"); return; }
        if (!isAuthenticated && !email) { toast.error("Nhập Email/SĐT bảo mật!"); return; }
        hasAutoLooked.current = true;
        doTrackOrder(orderCode, email);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Đã sao chép mã đơn hàng!");
    };

    const paymentInfo = order?.payments?.[0];
    const isPaid = paymentInfo?.status === 'SUCCESS';
    const paymentMethodLabel = paymentInfo?.paymentMethod === 'CASH' ? 'Khi nhận hàng (COD)' : 'Online (VNPay)';

    return (
        <div className="bg-[#fcfcfc] min-h-screen">
            <ProductBanner
                pageTitle="Tra cứu hành trình"
                breadcrumbs={breadcrumbs}
                url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-listing.jpg"
                className="bg-top"
            />

            <div className="app-container py-[32px]">
                <div className="max-w-[1100px] mx-auto space-y-[20px] flex flex-col items-center">

                    {/* 1. FORM TRA CỨU */}
                    {(!order || error) && !loading && (
                        <div className="w-full flex justify-center">
                            <div className="bg-white p-[24px] rounded-[22px] shadow-sm border border-[#eee] animate-fadeIn text-center w-full max-w-[980px] mx-auto origin-top scale-[0.9] md:scale-[0.94] lg:scale-[0.96]">
                                <h2 className="text-[2.08rem] font-black text-client-secondary mb-2 uppercase tracking-tight">Kiểm tra đơn hàng</h2>
                                <p className="text-[1.201rem] text-gray-400 font-medium mb-7 italic">
                                    {isAuthenticated ? "Chỉ cần nhập mã đơn hàng của bạn" : "Vui lòng nhập mã đơn và email/SĐT chính chủ"}
                                </p>

                                {isAuthenticated && (
                                    <div className="mb-6 p-3 bg-client-primary/5 rounded-2xl border border-dashed border-client-primary/20 animate-fadeIn">
                                        <p className="text-[1.039rem] text-client-secondary font-bold">
                                            💡 Bạn có thể vào <Link to="/dashboard/orders" className="text-client-primary underline">Lịch sử đơn hàng</Link> để xem danh sách trọn vẹn nhất.
                                        </p>
                                    </div>
                                )}

                                <form onSubmit={handleManualLookup} className="max-w-[620px] mx-auto space-y-4">
                                    <div className="relative">
                                        <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Mã đơn hàng (ORD-XXXXXX)"
                                            value={orderCode}
                                            onChange={(e) => setOrderCode(e.target.value)}
                                            className="w-full h-[56px] pl-12 pr-5 rounded-[14px] border-2 border-gray-50 focus:border-client-primary outline-none text-[1.28rem] bg-gray-50/50 font-black transition-all"
                                        />
                                    </div>
                                    {!isAuthenticated && (
                                        <div className="relative animate-fadeIn">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                                            <input
                                                type="text"
                                                placeholder="Địa chỉ Email hoặc Số điện thoại"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full h-[56px] pl-12 pr-5 rounded-[14px] border-2 border-gray-50 focus:border-client-primary outline-none text-[1.28rem] bg-gray-50/50 font-black transition-all"
                                            />
                                        </div>
                                    )}
                                    <button type="submit" className="w-full h-[56px] mt-1 bg-client-secondary hover:bg-client-primary text-white font-black text-[1.28rem] rounded-[14px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                                        <Search className="w-4 h-4" /> TRA CỨU NGAY
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="bg-white p-[48px] rounded-[28px] text-center shadow-sm">
                            <div className="w-[44px] h-[44px] border-[4px] border-client-primary/10 border-t-client-primary rounded-full animate-spin mx-auto mb-6"></div>
                            <h2 className="text-[1.44rem] font-bold text-gray-400">Đang tìm đơn hàng của bạn...</h2>
                        </div>
                    )}

                    {/* 2. KẾT QUẢ "CỰC PHẨM" */}
                    {!loading && order && (
                        <div className="space-y-[20px] animate-fadeIn">

                            {/* Header chi tiết */}
                            <div className="flex justify-between items-center bg-white p-[20px] px-[24px] rounded-[20px] border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-[1.76rem] font-black text-client-secondary uppercase">Mã đơn: {order.orderCode}</h2>
                                    <button onClick={() => copyToClipboard(order.orderCode)} className="w-[36px] h-[36px] bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-client-primary hover:bg-client-primary/10 transition-all">
                                        <Copy className="w-6 h-6" />
                                    </button>
                                </div>
                                <div className="text-right">
                                    <label className="text-[0.881rem] text-gray-400 font-bold uppercase block">Ngày đặt hàng</label>
                                    <span className="text-[1.201rem] font-black text-client-secondary">{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</span>
                                </div>
                            </div>

                            {/* TIMELINE */}
                            <OrderStepper status={order.status} />

                            {/* GRID 1:1 - ĐỊA CHỈ & HỖ TRỢ */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
                                <div className="bg-white p-[24px] rounded-[24px] border border-gray-100 shadow-sm">
                                    <h3 className="text-[1.44rem] font-black text-client-secondary mb-[25px] flex items-center gap-3 uppercase">
                                        <MapPin className="text-client-primary w-7 h-7" /> Địa chỉ giao tới
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex flex-col">
                                            <span className="text-[0.881rem] text-gray-400 font-bold uppercase tracking-widest">Người nhận</span>
                                            <span className="text-[1.28rem] font-black text-client-secondary mt-1 uppercase">{order.shippingName}</span>
                                            <span className="text-[1.12rem] font-bold text-client-primary mt-1 border-l-4 border-client-primary pl-3 italic">{order.shippingPhone}</span>
                                        </div>
                                        <div className="pt-4 border-t border-gray-50">
                                            <span className="text-[0.881rem] text-gray-400 font-bold uppercase tracking-widest">Nơi nhận</span>
                                            <p className="text-[1.12rem] font-bold text-gray-600 mt-2 leading-relaxed">{order.shippingAddress}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-[24px] rounded-[24px] border border-gray-100 shadow-sm bg-gradient-to-tr from-white to-blue-50/20">
                                    <h3 className="text-[1.44rem] font-black text-client-secondary mb-[25px] flex items-center gap-3 uppercase">
                                        <HelpCircle className="text-blue-500 w-7 h-7" /> Cần giúp đỡ?
                                    </h3>
                                    <p className="text-[1.12rem] text-gray-500 font-medium mb-8 leading-relaxed">Đơn hàng của bạn đang được xử lý. Nếu có bất kỳ thắc mắc nào, đừng ngần ngại liên hệ với chúng tôi.</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <a href="#" className="h-[46px] bg-client-secondary text-white rounded-[14px] font-black text-[1.12rem] flex items-center justify-center gap-2 shadow-lg">
                                            <ChatBubble className="w-5 h-5" /> Chat ngay
                                        </a>
                                        <button onClick={() => { setOrder(null); setOrderCode(""); setEmail(""); }} className="h-[46px] border-2 border-gray-100 rounded-[14px] text-gray-400 font-black text-[1.12rem] hover:border-client-primary hover:text-client-primary transition-all">
                                            Tra đơn khác
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* DANH SÁCH SẢN PHẨM */}
                            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-[20px] border-b border-gray-50 bg-gray-50/30 flex items-center gap-4">
                                    <Package className="text-client-primary w-7 h-7" />
                                    <h3 className="text-[1.44rem] font-black text-client-secondary uppercase">Sản phẩm trong kiện ({order.orderItems?.length})</h3>
                                </div>
                                <div className="p-[20px] space-y-4">
                                    {order.orderItems?.map((item, idx) => (
                                        <div key={idx} className="flex gap-6 p-4 rounded-[16px] hover:bg-gray-50/50 transition-all group">
                                            <div className="w-[72px] h-[72px] rounded-[12px] overflow-hidden border border-gray-100 shrink-0 relative shadow-sm">
                                                <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" />
                                                <div className="absolute top-0 right-0 bg-client-primary text-white text-[0.8rem] font-black px-2 py-1 rounded-bl-xl">x{item.quantity}</div>
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center">
                                                <h4 className="text-[1.28rem] font-black text-client-secondary line-clamp-1">{item.productName}</h4>
                                                <span className="text-[0.881rem] text-gray-400 font-bold uppercase tracking-widest mt-1">{item.variantName}</span>
                                                <div className="text-[1.28rem] font-black text-client-secondary mt-2">{(item.unitPrice * item.quantity).toLocaleString()}đ</div>
                                            </div>
                                            {order.status === 'COMPLETED' && (
                                                <div className="flex items-center">
                                                    <Link
                                                        to={`/feedback?orderId=${order.id}${!order.user ? `&email=${order.guestEmail || email}` : ''}`}
                                                        className="flex items-center gap-2 px-6 py-2 bg-client-primary/10 text-client-primary rounded-full font-bold text-[0.96rem] hover:bg-client-primary hover:text-white transition-all shadow-sm"
                                                    >
                                                        <Star className="w-4 h-4" /> Đánh giá
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* THANH TOÁN & THỜI GIAN */}
                            <div className="bg-white p-[24px] rounded-[24px] border border-gray-100 shadow-xl shadow-gray-100/20">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <h3 className="text-[1.44rem] font-black text-client-secondary uppercase border-b border-gray-100 pb-4">Chi tiết giao dịch</h3>
                                        <div className="space-y-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500"><Wallet /></div>
                                                <div>
                                                    <label className="text-[0.8rem] text-gray-400 font-bold uppercase tracking-widest block">Phương thức</label>
                                                    <span className="text-[1.12rem] font-black text-client-secondary">{paymentMethodLabel}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500"><Calendar /></div>
                                                <div>
                                                    <label className="text-[0.8rem] text-gray-400 font-bold uppercase tracking-widest block">Khởi tạo đơn</label>
                                                    <span className="text-[1.12rem] font-black text-client-secondary">{format(new Date(order.createdAt), "HH:mm - dd/MM/yyyy")}</span>
                                                </div>
                                            </div>
                                            {isPaid && (
                                                <div className="flex items-center gap-4 animate-fadeIn">
                                                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500"><ShieldCheck /></div>
                                                    <div>
                                                        <label className="text-[0.8rem] text-gray-400 font-bold uppercase tracking-widest block">Trạng thái thanh toán</label>
                                                        <span className="text-[1.12rem] font-black text-client-secondary font-secondary italic text-emerald-600">Thành công lúc {format(new Date(order.updatedAt), "HH:mm")}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/50 p-8 rounded-[30px] border border-gray-100 flex flex-col justify-center">
                                        <div className="flex justify-between items-center text-[1.12rem] mb-4">
                                            <span className="text-gray-400 font-bold uppercase">Tạm tính:</span>
                                            <span className="font-black text-client-secondary">{order.subtotal.toLocaleString()}đ</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[1.12rem] mb-6">
                                            <span className="text-gray-400 font-bold uppercase">Phí vận chuyển:</span>
                                            <span className="font-black text-client-secondary">+{order.shippingFee.toLocaleString()}đ</span>
                                        </div>
                                        <div className="pt-6 border-t-2 border-dashed border-gray-200 flex justify-between items-center">
                                            <span className="text-[1.44rem] font-black text-client-secondary uppercase">Tổng cộng:</span>
                                            <span className="text-[2.56rem] font-black text-client-primary tracking-tighter">{order.finalAmount.toLocaleString()}đ</span>
                                        </div>
                                        <div className="mt-6 flex items-center gap-2 justify-end">
                                            <InfoCircle className="w-4 h-4 text-client-primary" />
                                            <span className="text-[0.881rem] text-client-primary font-black uppercase italic">Dịch vụ từ tâm - TeddyPet</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Nút hành động nổi bật khi đã giao */}
                            {order.status === 'DELIVERED' && (
                                <button
                                    onClick={handleConfirmReceived}
                                    disabled={isSubmitting}
                                    className="w-full h-[56px] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[1.359rem] rounded-[18px] transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 mt-10 hover:scale-[1.01] active:scale-95"
                                >
                                    {isSubmitting ? <RefreshDouble className="w-[1.92rem] h-[1.92rem] animate-spin" /> : <CheckCircle className="w-[1.92rem] h-[1.92rem]" />}
                                    {isSubmitting ? "Đang xác nhận..." : "TÔI ĐÃ NHẬN ĐƯỢC HÀNG"}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Gợi ý Đánh giá */}
            {showFeedbackModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-client-secondary/40 backdrop-blur-md"
                        onClick={() => setShowFeedbackModal(false)}
                    ></div>
                    <div className="bg-white rounded-[28px] p-10 max-w-[440px] w-full relative z-10 shadow-2xl border border-gray-100 text-center animate-scaleUp">
                        <div className="w-[72px] h-[72px] bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-6 shadow-sm border border-emerald-100">
                            <Star className="w-[4.0rem] h-[4.0rem] fill-current" />
                        </div>
                        <h3 className="text-[2.08rem] font-black text-client-secondary mb-4 leading-tight uppercase">
                            Tuyệt vời quá!
                        </h3>
                        <p className="text-[1.28rem] text-gray-500 font-medium mb-8 leading-relaxed">
                            Đơn hàng đã hoàn thành. Bạn hãy dành chút thời gian đánh giá sản phẩm để TeddyPet ngày càng hoàn thiện hơn nhé! 🐾
                        </p>
                        <div className="flex flex-col gap-3">
                            <Link
                                to={`/feedback?orderId=${order?.id}${!order?.user ? `&email=${order?.guestEmail || email}` : ''}`}
                                className="h-[54px] bg-client-primary text-white rounded-[16px] font-black text-[1.44rem] flex items-center justify-center gap-3 hover:bg-client-secondary shadow-xl shadow-client-primary/30 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                <Star className="w-6 h-6" /> ĐÁNH GIÁ NGAY
                            </Link>
                            <button
                                onClick={() => setShowFeedbackModal(false)}
                                className="h-[46px] text-gray-400 font-bold text-[1.201rem] hover:text-client-secondary transition-colors uppercase tracking-widest"
                            >
                                Để sau nhé
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <FooterSub />

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.8s ease-out forwards; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scaleUp { animation: scaleUp 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};
