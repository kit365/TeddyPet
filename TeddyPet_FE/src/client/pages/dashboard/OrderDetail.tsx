import { format } from "date-fns";
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
    User,
    MapPin,
    Phone,
    Copy,
    ChatBubble,
    HelpCircle,
    Calendar,
    Wallet,
    ShieldCheck
} from "iconoir-react";
import { toast } from "react-toastify";
import { useState } from "react";
import { confirmReceived } from "../../../api/order.api";

// Component Stepper Siêu Cấp
const OrderStepper = ({ status }: { status: string }) => {
    const steps = [
        { key: 'PENDING', label: 'Chờ nhận đơn', icon: <ClipboardCheck className="w-[2.4rem] h-[2.4rem]" /> },
        { key: 'CONFIRMED', label: 'Đã xác nhận', icon: <CheckCircle className="w-[2.4rem] h-[2.4rem]" /> },
        { key: 'PROCESSING', label: 'Đóng gói', icon: <BoxIcon className="w-[2.4rem] h-[2.4rem]" /> },
        { key: 'DELIVERING', label: 'Đang giao', icon: <Truck className="w-[2.4rem] h-[2.4rem]" /> },
        { key: 'DELIVERED', label: 'Đã giao', icon: <HomeSimple className="w-[2.4rem] h-[2.4rem]" /> },
        { key: 'COMPLETED', label: 'Hoàn thành', icon: <Package className="w-[2.4rem] h-[2.4rem]" /> },
    ];

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
    const { order, loading: fetching, refresh } = useOrderDetail(id as string);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        setIsSubmitting(true);
        try {
            await confirmReceived(order.id);
            toast.success("Xác nhận đã nhận hàng thành công. TeddyPet cảm ơn bạn!");
            refresh();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra!");
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Đã sao chép mã đơn hàng!");
    };

    const paymentInfo = order.payments?.[0];
    const isPaid = paymentInfo?.status === 'SUCCESS';
    const paymentMethodLabel = paymentInfo?.paymentMethod === 'CASH' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán Online (VNPay)';

    return (
        <div className="bg-[#fcfcfc] min-h-screen pb-[120px]">
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
                            </div>
                            <Link to="/dashboard/orders" className="text-[1.4rem] font-bold text-gray-400 hover:text-client-primary flex items-center gap-2 transition-all">
                                <NavArrowRight className="w-5 h-5 rotate-180" /> Quay lại danh sách
                            </Link>
                        </div>

                        {/* 1. TIMELINE (STEPPER) */}
                        <OrderStepper status={order.status} />

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
                                        <div className="text-[1.4rem] font-bold text-gray-600 leading-relaxed font-secondary italic">
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
                                                <div className="text-[1.4rem] font-black text-client-secondary">{paymentMethodLabel}</div>
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
                        </div>

                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(25px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
            `}</style>
        </div>
    );
};
