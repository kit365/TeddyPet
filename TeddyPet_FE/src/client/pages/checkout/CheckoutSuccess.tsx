import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Cookies from "js-cookie";
import { FooterSub } from "../../components/layouts/FooterSub";
import { ProductBanner } from "../product/sections/ProductBanner";
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneEnabledOutlinedIcon from '@mui/icons-material/PhoneEnabledOutlined';
import EditLocationAltOutlinedIcon from '@mui/icons-material/EditLocationAltOutlined';
import { getMyOrderByCode, lookupGuestOrder, trackOrder, cancelOrder, cancelOrderByGuest } from "../../../api/order.api";
import { OrderResponse } from "../../../types/order.type";
import { toast } from "react-toastify";
import { Wallet, CheckCircle, Box as BoxIcon, Truck, HomeSimple } from "iconoir-react";
import { CancelOrderModal } from "../dashboard/sections/CancelOrderModal";

const breadcrumbs = [
    { label: "Trang chủ", to: "/" },
    { label: "Thanh toán", to: "/checkout" },
    { label: "Thanh toán thành công", to: "#" },
];

const ORDER_TIMELINE_STEPS = [
    { key: "pending_payment", label: "Chờ thanh toán", icon: Wallet },
    { key: "paid", label: "Đã thanh toán", icon: CheckCircle },
    { key: "processing", label: "Chờ đóng hàng", icon: BoxIcon },
    { key: "delivering", label: "Đang vận chuyển", icon: Truck },
    { key: "delivered", label: "Đã giao", icon: HomeSimple },
] as const;

function getOrderTimelineStepIndex(order: OrderResponse): number {
    const paymentCompleted = order.payments?.[0]?.status === "COMPLETED";
    const status = order.status;
    if (status === "CANCELLED" || status === "RETURNED" || status === "RETURN_REQUESTED") return 0;
    if (!paymentCompleted && status === "PENDING") return 0;
    if (paymentCompleted && (status === "PENDING" || status === "CONFIRMED")) return 1;
    if (status === "PROCESSING") return 2;
    if (status === "DELIVERING") return 3;
    if (status === "DELIVERED" || status === "COMPLETED") return 4;
    return 0;
}

export const CheckSuccessPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const orderCode = searchParams.get("orderCode");
    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        if (orderCode) {
            fetchOrderDetails();
        }
    }, [orderCode]);

    const fetchOrderDetails = async () => {
        if (!orderCode) return;
        try {
            setLoading(true);
            const email = searchParams.get("email");
            const hasToken = !!Cookies.get("token");
            let response;

            if (email) {
                // Tra cứu cho khách vãng lai (có email trong URL)
                response = await lookupGuestOrder(orderCode, email);
            } else if (hasToken) {
                // User đã đăng nhập: dùng endpoint my-orders
                response = await getMyOrderByCode(orderCode);
            } else {
                // Khách không đăng nhập và không có email trong URL: dùng API công khai track (chỉ cần orderCode)
                response = await trackOrder(orderCode);
            }

            if (response.success) {
                setOrder(response.data);
                // Clean up URL parameters only if email is present (guest checkout)
                if (email) {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete("email");
                    setSearchParams(newParams, { replace: true });
                }
            } else {
                toast.error(response.message || "Không thể tải thông tin đơn hàng");
            }
        } catch (error: any) {
            console.error("Lỗi lấy chi tiết đơn hàng:", error);
            toast.error(error.response?.data?.message || "Không thể tải thông tin đơn hàng. Vui lòng kiểm tra lại mã đơn.");
        } finally {
            setLoading(false);
        }
    };

    const isPaid = order?.payments?.[0]?.status === "COMPLETED";
    const timelineStep = order ? getOrderTimelineStepIndex(order) : 0;

    const canCancelOrder =
        order
        && order.status !== "CANCELLED"
        && order.status !== "DELIVERED"
        && order.status !== "COMPLETED"
        && order.status !== "RETURNED"
        && order.status !== "RETURN_REQUESTED"
        && (
            // Hủy đơn chưa thanh toán
            order.status === "PENDING"
            // Hủy & hoàn tiền: đơn ONLINE đang PAID hoặc PROCESSING (backend kiểm tra đã thanh toán)
            || (order.orderType === "ONLINE" && ["PAID", "PROCESSING"].includes(order.status))
        );
    const cancelButtonLabel =
        order?.orderType === "ONLINE" && ["PAID", "PROCESSING"].includes(order.status)
            ? "Yêu cầu hoàn tiền"
            : "Hủy đơn hàng";

    const handleConfirmCancel = async (reason: string) => {
        if (!order) return;
        setIsCancelling(true);
        try {
            const hasToken = !!Cookies.get("token");
            if (hasToken) {
                await cancelOrder(order.id, reason);
            } else {
                const email = order.guestEmail || order.user?.email || "";
                if (!email) {
                    toast.error("Không thể hủy đơn. Vui lòng tra cứu đơn hàng bằng email đã đặt.");
                    return;
                }
                await cancelOrderByGuest(order.orderCode, email, reason);
            }
            toast.success(isPaid ? "Đã gửi yêu cầu hủy đơn & hoàn tiền. TeddyPet sẽ xử lý sớm." : "Đã hủy đơn hàng.");
            setShowCancelModal(false);
            fetchOrderDetails();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Không thể hủy đơn.");
        } finally {
            setIsCancelling(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-client-primary"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <h2 className="text-[1.5rem] font-bold text-client-secondary">Không tìm thấy đơn hàng</h2>
                <Link to="/" className="text-client-primary hover:underline text-[1rem]">Quay lại trang chủ</Link>
            </div>
        );
    }

    return (
        <>
            <ProductBanner
                pageTitle="Đặt hàng thành công"
                breadcrumbs={breadcrumbs}
                url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-listing.jpg"
                className="bg-top"
            />
            <div className="app-container pb-[150px] 2xl:pb-[100px] relative mt-[50px]">
                {/* Timeline trạng thái đơn hàng - rộng bằng các ô bên dưới */}
                <div className="mb-[28px] w-full flex items-center justify-center gap-0 bg-white rounded-[8px] border border-[#10293726] p-[25px] shadow-[0_0_3px_#10293726]">
                        {ORDER_TIMELINE_STEPS.map((step, index) => {
                            const isActive = index <= timelineStep;
                            const isLast = index === ORDER_TIMELINE_STEPS.length - 1;
                            const Icon = step.icon;
                            return (
                                <div key={step.key} className="flex flex-1 items-center justify-center min-w-0">
                                    <div className="flex flex-col items-center gap-2">
                                        <div
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                                                isActive
                                                    ? "bg-client-primary text-white shadow-sm"
                                                    : "bg-gray-100 text-gray-400"
                                            }`}
                                        >
                                            <Icon className="h-4 w-4" strokeWidth={2} />
                                        </div>
                                        <span
                                            className={`text-[0.6875rem] font-medium text-center leading-tight max-w-[4.5rem] ${
                                                isActive ? "text-client-secondary" : "text-gray-400"
                                            }`}
                                        >
                                            {step.label}
                                        </span>
                                    </div>
                                    {!isLast && (
                                        <div
                                            className={`flex-1 h-0.5 mx-1 min-w-[12px] max-w-[40px] rounded-full transition-colors ${
                                                index < timelineStep ? "bg-client-primary" : "bg-gray-100"
                                            }`}
                                            aria-hidden
                                        />
                                    )}
                                </div>
                            );
                        })}
                </div>

                <div className="mb-[48px] grid grid-cols-4 border border-[#10293726] p-[25px] bg-white rounded-[8px]">
                    <div className="text-[0.875rem] text-client-text text-center border-r border-dashed border-[#cfc8d8] px-[12px] my-[10px]">
                        <div className="text-gray-500 mb-1">Số đơn hàng:</div>
                        <div className="text-[1.125rem] font-bold text-client-secondary">{order.orderCode}</div>
                    </div>
                    <div className="text-[0.875rem] text-client-text text-center border-r border-dashed border-[#cfc8d8] px-[12px] my-[10px]">
                        <div className="text-gray-500 mb-1">Ngày:</div>
                        <div className="text-[1.125rem] font-bold text-client-secondary">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '---'}
                        </div>
                    </div>
                    <div className="text-[0.875rem] text-client-text text-center border-r border-dashed border-[#cfc8d8] px-[12px] my-[10px]">
                        <div className="text-gray-500 mb-1">Tổng cộng:</div>
                        <div className="text-[1.125rem] font-bold text-client-primary">
                            {(order.finalAmount || 0).toLocaleString()}đ
                        </div>
                    </div>
                    <div className="text-[0.875rem] text-client-text text-center px-[12px] my-[10px]">
                        <div className="text-gray-500 mb-1">Thanh toán:</div>
                        <div className="text-[1.125rem] font-bold text-client-secondary">
                            {order.payments?.[0]?.paymentMethod === "CASH"
                                ? "Tiền mặt"
                                : order.payments?.[0]?.paymentMethod === "BANK_TRANSFER"
                                    ? isPaid
                                        ? "Chuyển khoản (Đã thanh toán)"
                                        : "Chuyển khoản (Chờ thanh toán)"
                                    : order.payments?.[0]?.paymentMethod || "Chưa xác định"}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-[40px] mb-[50px]">
                    <div>
                        <section className="bg-white border-[1px] border-[#eee] rounded-[12px] overflow-hidden shadow-sm">
                            <div className="bg-gray-50 px-[30px] py-[20px] border-b border-[#eee]">
                                <h2 className="text-[1.25rem] text-client-secondary font-bold">Chi tiết đơn hàng</h2>
                            </div>
                            <div className="p-[30px]">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-[1rem] text-gray-500 border-b border-[#eee]">
                                            <th className="text-left py-[15px] font-medium">Sản phẩm</th>
                                            <th className="text-right py-[15px] font-medium">Tổng</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[0.9375rem]">
                                        {order.orderItems?.map((item, index) => (
                                            <tr key={index} className="border-b border-[#f9f9f9] last:border-none">
                                                <td className="py-[20px]">
                                                    <div className="flex items-center gap-[15px]">
                                                        {item.imageUrl && (
                                                            <img src={item.imageUrl} alt={item.productName} className="w-[60px] h-[60px] object-cover rounded-[8px]" />
                                                        )}
                                                        <div>
                                                            <div className="font-bold text-client-secondary">{item.productName} ({item.variantName})</div>
                                                            <div className="text-gray-400 mt-1">x {item.quantity}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-right font-bold text-client-secondary">
                                                    {(item.totalPrice || 0).toLocaleString()}đ
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="text-[1rem]">
                                        <tr>
                                            <td className="text-left py-[15px] border-t border-[#eee] text-gray-500">Tạm tính:</td>
                                            <td className="text-right py-[15px] border-t border-[#eee] font-bold text-client-secondary">{(order.subtotal || 0).toLocaleString()}đ</td>
                                        </tr>
                                        {(order.discountAmount || 0) > 0 && (
                                            <tr>
                                                <td className="text-left py-[15px] text-gray-500">Giảm giá:</td>
                                                <td className="text-right py-[15px] font-bold text-red-500">-{(order.discountAmount || 0).toLocaleString()}đ</td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td className="text-left py-[15px] text-gray-500">Phí vận chuyển:</td>
                                            <td className="text-right py-[15px] font-bold text-client-secondary">
                                                {order.shippingFee && order.shippingFee > 0 ? `${order.shippingFee.toLocaleString()}đ` : 'Liên hệ sau'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-left py-[20px] border-t border-[#eee] text-[1.125rem] font-bold text-client-secondary">Tổng cộng:</td>
                                            <td className="text-right py-[20px] border-t border-[#eee] text-[1.375rem] font-bold text-client-primary">{(order.finalAmount || 0).toLocaleString()}đ</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </section>
                    </div>

                    <div>
                        <section className="bg-white border-[1px] border-[#eee] rounded-[12px] p-[30px] shadow-sm flex flex-col gap-6 h-full">
                            <h2 className="text-[1.25rem] font-bold text-client-secondary border-b border-[#eee] pb-[15px]">Thông tin nhận hàng</h2>
                            <div className="space-y-6">
                                <div className="flex items-start gap-[15px]">
                                    <div className="w-[40px] h-[40px] bg-client-primary/10 rounded-full flex items-center justify-center shrink-0">
                                        <EmailOutlinedIcon className="text-client-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[0.875rem] text-gray-400">Người nhận</span>
                                        <p className="text-[1rem] font-bold text-client-secondary">{order.shippingName}</p>
                                        <p className="text-[0.875rem] text-gray-500">{order.user?.email || order.guestEmail}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-[15px]">
                                    <div className="w-[40px] h-[40px] bg-client-primary/10 rounded-full flex items-center justify-center shrink-0">
                                        <PhoneEnabledOutlinedIcon className="text-client-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[0.875rem] text-gray-400">Số điện thoại</span>
                                        <p className="text-[1rem] font-bold text-client-secondary">{order.shippingPhone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-[15px]">
                                    <div className="w-[40px] h-[40px] bg-client-primary/10 rounded-full flex items-center justify-center shrink-0">
                                        <EditLocationAltOutlinedIcon className="text-client-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[0.875rem] text-gray-400">Địa chỉ giao hàng</span>
                                        <p className="text-[1rem] font-bold text-client-secondary leading-relaxed">{order.shippingAddress}</p>
                                    </div>
                                </div>
                                {order.notes && (
                                    <div className="bg-yellow-50 p-[15px] rounded-[8px] border-l-4 border-yellow-400">
                                        <span className="text-[0.875rem] font-bold text-yellow-800">Ghi chú:</span>
                                        <p className="text-[0.875rem] text-yellow-700 mt-1 italic">"{order.notes}"</p>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 pt-6 border-t border-[#eee]">
                                <Link to="/shop" className="w-full py-[15px] bg-client-secondary hover:bg-client-primary text-white text-center rounded-[8px] font-bold text-[0.875rem] transition-all block">
                                    TIẾP TỤC MUA SẮM
                                </Link>
                                {canCancelOrder && (
                                    <button
                                        type="button"
                                        onClick={() => setShowCancelModal(true)}
                                        className="w-full mt-3 py-2.5 text-center text-[0.875rem] font-semibold text-red-600 hover:text-red-700 rounded-[8px] border border-red-200 bg-red-50/50 hover:bg-red-50 transition-colors"
                                    >
                                        {cancelButtonLabel}
                                    </button>
                                )}
                                <Link to={Cookies.get("token") ? `/dashboard/orders/${order.id}` : `/tra-cuu-don-hang?code=${order.orderCode}${order.guestEmail || order.user?.email ? `&email=${encodeURIComponent(order.guestEmail || order.user?.email || "")}` : ""}`} className="block w-full mt-2 py-2.5 text-center text-[0.875rem] font-semibold text-black hover:text-gray-800 rounded-[8px] border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors">
                                    {Cookies.get("token") ? "Xem chi tiết đơn hàng" : "Tra cứu đơn hàng"}
                                </Link>
                            </div>
                            <CancelOrderModal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} onConfirm={handleConfirmCancel} isCancelling={isCancelling} />
                        </section>
                    </div>
                </div>
            </div>
            <FooterSub />
        </>
    );
};