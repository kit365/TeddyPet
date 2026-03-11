import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useOrders } from "../../hooks/useOrders";
import {
    Eye,
    CheckCircle,
    BoxIso,
    Star,
    XmarkCircle
} from "iconoir-react";
import { confirmReceived, cancelOrder } from "../../../api/order.api";
import { toast } from "react-toastify";
import { useState } from "react";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { DashboardLayout } from "./sections/DashboardLayout";

export const OrderHistoryPage = () => {
    const { orders, loading, refresh } = useOrders();
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; orderId: string | null }>({
        isOpen: false,
        orderId: null
    });
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

    // Cancel order state
    const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; orderId: string | null }>({
        isOpen: false,
        orderId: null
    });
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);
    const [isCustomReason, setIsCustomReason] = useState(false);

    // Quick cancel reason options
    const quickReasons = [
        "Tôi đổi ý, không muốn mua nữa",
        "Tôi muốn thay đổi sản phẩm khác",
        "Tôi tìm được giá rẻ hơn",
        "Thời gian giao hàng quá lâu",
        "Tôi đặt nhầm số lượng",
        "Lý do khác"
    ];

    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Tài khoản", to: "/dashboard/profile" },
        { label: "Lịch sử đơn hàng", to: "/dashboard/orders" },
    ];

    const handleOpenConfirm = (id: string) => {
        setConfirmModal({ isOpen: true, orderId: id });
    };

    const handleConfirmReceived = async () => {
        if (!confirmModal.orderId) return;

        const id = confirmModal.orderId;
        setProcessingId(id);
        try {
            const response = await confirmReceived(id);
            if (response.success) {
                toast.success("Tuyệt vời! Cảm ơn bạn đã xác nhận nhận hàng.");
                await refresh();
                setCurrentOrderId(id);
                setConfirmModal({ isOpen: false, orderId: null });
                setShowFeedbackModal(true);
            } else {
                toast.error(response.message || "Có lỗi xảy ra");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể thực hiện xác nhận");
        } finally {
            setProcessingId(null);
        }
    };

    const handleOpenCancelModal = (id: string) => {
        setCancelModal({ isOpen: true, orderId: id });
        setCancelReason('');
        setIsCustomReason(false);
    };

    const handleCloseCancelModal = () => {
        setCancelModal({ isOpen: false, orderId: null });
        setCancelReason('');
        setIsCustomReason(false);
    };

    const handleCancelOrder = async () => {
        if (!cancelModal.orderId || !cancelReason.trim()) {
            toast.error("Vui lòng chọn hoặc nhập lý do hủy đơn");
            return;
        }
        setIsCancelling(true);
        try {
            const response = await cancelOrder(cancelModal.orderId, cancelReason.trim());
            if (response.success) {
                toast.success("Đã hủy đơn hàng thành công!");
                handleCloseCancelModal();
                await refresh();
            } else {
                toast.error(response.message || "Không thể hủy đơn hàng");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể hủy đơn hàng");
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <DashboardLayout pageTitle="Lịch sử đơn hàng" breadcrumbs={breadcrumbs}>
            <div className="flex justify-between items-center mb-10">
                <h3 className="text-[2.8rem] font-black text-slate-800 italic tracking-tight flex items-center gap-4">
                    <BoxIso className="text-client-primary w-12 h-12" />
                    Đơn hàng của bạn
                </h3>
                <div className="px-6 py-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-[1.4rem] font-black text-client-primary uppercase tracking-widest">
                    {orders.length} Đơn hàng
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-4">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="p-6 rounded-l-2xl text-[1.3rem] font-black text-slate-400 uppercase tracking-widest">Mã đơn</th>
                            <th className="p-6 text-[1.3rem] font-black text-slate-400 uppercase tracking-widest text-center">Ngày đặt</th>
                            <th className="p-6 text-[1.3rem] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                            <th className="p-6 text-[1.3rem] font-black text-slate-400 uppercase tracking-widest text-right">Tổng tiền</th>
                            <th className="p-6 rounded-r-2xl text-[1.3rem] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="before:block before:h-2">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="p-20 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-12 h-12 border-4 border-rose-100 border-t-client-primary rounded-full animate-spin"></div>
                                        <p className="text-[1.6rem] font-bold text-slate-300">Đang đồng bộ dữ liệu...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : orders.length > 0 ? (
                            orders.map((order) => (
                                <tr key={order.id} className="group hover:bg-slate-50/50 transition-all">
                                    <td className="p-6 border-t border-b border-l border-slate-100 rounded-l-3xl">
                                        <span className="text-[1.6rem] font-black text-slate-800 group-hover:text-client-primary transition-colors">#{order.orderCode}</span>
                                    </td>
                                    <td className="p-6 border-t border-b border-slate-100 text-center">
                                        <span className="text-[1.4rem] font-bold text-slate-500">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</span>
                                    </td>
                                    <td className="p-6 border-t border-b border-slate-100 text-center">
                                        <div className="flex justify-center">
                                            <StatusBadge status={order.status} />
                                        </div>
                                    </td>
                                    <td className="p-6 border-t border-b border-slate-100 text-right">
                                        <span className="text-[1.7rem] font-black text-slate-800">{order.finalAmount.toLocaleString()}đ</span>
                                    </td>
                                    <td className="p-6 border-t border-b border-r border-slate-100 rounded-r-3xl">
                                        <div className="flex items-center justify-end gap-3">
                                            {order.status === "DELIVERED" && (
                                                <button
                                                    onClick={() => handleOpenConfirm(order.id)}
                                                    className="flex items-center justify-center gap-2 h-12 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-[1.2rem] transition-all shadow-lg shadow-emerald-100 active:scale-95"
                                                >
                                                    <CheckCircle className="w-5 h-5" /> NHẬN HÀNG
                                                </button>
                                            )}

                                            <Link
                                                to={`/dashboard/orders/${order.id}`}
                                                className="flex items-center justify-center gap-2 h-12 px-5 bg-white border-2 border-slate-100 text-slate-500 hover:border-indigo-600 hover:text-indigo-600 rounded-xl font-bold text-[1.2rem] transition-all"
                                                title="Chi tiết"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </Link>

                                            {order.status === "COMPLETED" && (
                                                <Link
                                                    to={`/feedback?orderId=${order.id}`}
                                                    className="flex items-center justify-center gap-2 h-12 px-5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl font-bold text-[1.2rem] transition-all"
                                                    title="Đánh giá"
                                                >
                                                    <Star className="w-5 h-5" />
                                                </Link>
                                            )}

                                            {order.status === "PENDING" && (
                                                <button
                                                    onClick={() => handleOpenCancelModal(order.id)}
                                                    className="flex items-center justify-center gap-2 h-12 px-5 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                                                    title="Hủy đơn"
                                                >
                                                    <XmarkCircle className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="p-20 text-center">
                                    <div className="flex flex-col items-center gap-6 opacity-40">
                                        <BoxIso className="w-24 h-24 text-slate-300" />
                                        <p className="text-[1.8rem] font-bold text-slate-400">Bạn chưa có đơn hàng nào.</p>
                                        <Link to="/shop" className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[1.4rem] shadow-xl shadow-indigo-100 hover:scale-105 transition-transform">MUA SẮM NGAY</Link>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, orderId: null })}
                onConfirm={handleConfirmReceived}
                isLoading={!!processingId}
                title="Xác nhận nhận hàng"
                message="Bạn đã nhận được kiện hàng và hài lòng với chất lượng sản phẩm từ TeddyPet?"
                confirmText="Đúng, đã nhận hàng"
                cancelText="Chưa, để sau"
                type="success"
            />

            {showFeedbackModal && currentOrderId && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowFeedbackModal(false)}></div>
                    <div className="bg-white rounded-[3rem] p-12 max-w-[500px] w-full relative z-10 shadow-2xl border border-white text-center animate-in zoom-in duration-300">
                        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-client-primary mx-auto mb-8">
                            <Star className="w-12 h-12 fill-current" />
                        </div>
                        <h3 className="text-[2.6rem] font-black text-slate-800 mb-4 uppercase italic">Tuyệt vời quá!</h3>
                        <p className="text-[1.6rem] text-slate-500 font-medium mb-10 leading-relaxed">
                            Đơn hàng đã hoàn tất. Bạn hãy dành chút thời gian đánh giá sản phẩm để TeddyPet ngày càng hoàn thiện hơn nhé! 🐾
                        </p>
                        <div className="flex flex-col gap-4">
                            <Link to={`/feedback?orderId=${currentOrderId}`} className="h-16 bg-indigo-600 text-white rounded-2xl font-black text-[1.6rem] flex items-center justify-center gap-3 hover:bg-slate-800 shadow-xl shadow-indigo-100 transition-all">
                                ĐÁNH GIÁ NGAY
                            </Link>
                            <button onClick={() => setShowFeedbackModal(false)} className="h-12 text-slate-400 font-bold text-[1.4rem] uppercase tracking-widest hover:text-indigo-600 transition-colors">Để sau nhé</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Order Modal with Quick Options */}
            {cancelModal.isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={handleCloseCancelModal}></div>
                    <div className="bg-white rounded-[3rem] p-10 max-w-[540px] w-full relative z-10 shadow-2xl border border-white animate-in zoom-in duration-300">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-5">
                                <XmarkCircle className="w-10 h-10" />
                            </div>
                            <h3 className="text-[2.4rem] font-black text-slate-800 uppercase">Hủy đơn hàng?</h3>
                            <p className="text-[1.4rem] text-slate-400 font-medium mt-2">
                                Vui lòng cho TeddyPet biết lý do bạn muốn hủy
                            </p>
                        </div>

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
                                    className={`p-4 rounded-2xl text-left transition-all border-2 ${(reason === "Lý do khác" && isCustomReason) || cancelReason === reason
                                        ? 'border-rose-500 bg-rose-50 text-rose-600'
                                        : 'border-slate-100 hover:border-slate-200 text-slate-600'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${(reason === "Lý do khác" && isCustomReason) || cancelReason === reason
                                            ? 'border-rose-500 bg-rose-500'
                                            : 'border-slate-300'
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
                                    className="w-full h-[100px] p-4 border-2 border-slate-200 rounded-2xl text-[1.4rem] font-medium text-slate-700 focus:border-rose-400 focus:outline-none transition-all resize-none"
                                    maxLength={500}
                                    autoFocus
                                />
                                <div className="text-right text-[1.2rem] text-slate-400 mt-1">{cancelReason.length}/500</div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={handleCloseCancelModal}
                                className="flex-1 h-14 bg-slate-100 text-slate-600 rounded-2xl font-bold text-[1.4rem] hover:bg-slate-200 transition-all"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                disabled={isCancelling || !cancelReason.trim()}
                                className="flex-1 h-14 bg-rose-500 text-white rounded-2xl font-black text-[1.4rem] hover:bg-rose-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isCancelling ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <XmarkCircle className="w-5 h-5" />
                                )}
                                {isCancelling ? "Đang xử lý..." : "Xác nhận hủy"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};
