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
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-client-primary to-rose-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-client-primary/30">
                            <BoxIso width={20} height={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">Lịch sử đơn hàng</h2>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5 uppercase tracking-wider">
                                Quản lý tất cả các đơn hàng của bạn
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-900 text-white rounded-xl px-4 py-2 shadow-lg">
                        <span className="text-2xl font-black">{orders.length}</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Đơn</span>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            {loading ? (
                <div className="h-96 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-16 h-16 border-4 border-slate-100 border-t-client-primary rounded-full animate-spin shadow-lg"></div>
                        <p className="text-base font-bold text-slate-400">Đang tải lịch sử đơn hàng...</p>
                    </div>
                </div>
            ) : orders.length > 0 ? (
                <div className="space-y-3">
                    {orders.map((order) => (
                        <div key={order.id} className="group bg-white border border-slate-100 rounded-xl p-5 hover:shadow-lg hover:border-slate-200 transition-all duration-300">
                            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center">
                                {/* Order Code */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-client-primary/10 transition-colors">
                                        <BoxIso width={18} height={18} className="text-slate-600 group-hover:text-client-primary transition-colors" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm group-hover:text-client-primary transition-colors">#{order.orderCode}</p>
                                        <p className="text-xs text-slate-400 font-medium mt-0.5">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</p>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="flex justify-center">
                                    <StatusBadge status={order.status} />
                                </div>

                                {/* Total Amount */}
                                <div className="text-right">
                                    <p className="font-black text-slate-900 text-sm">{order.finalAmount.toLocaleString()}₫</p>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">Tổng tiền</p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-2">
                                    {order.status === "DELIVERED" && (
                                        <button
                                            onClick={() => handleOpenConfirm(order.id)}
                                            disabled={processingId === order.id}
                                            className="flex items-center justify-center h-9 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs transition-all active:scale-95 uppercase tracking-wide shadow-md shadow-emerald-100 disabled:opacity-60"
                                            title="Xác nhận nhận hàng"
                                        >
                                            {processingId === order.id ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    <CheckCircle width={14} height={14} />
                                                    <span className="ml-1 hidden sm:inline">Nhận</span>
                                                </>
                                            )}
                                        </button>
                                    )}

                                    <Link
                                        to={`/dashboard/orders/${order.id}`}
                                        className="flex items-center justify-center w-9 h-9 bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-800 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-all font-semibold"
                                        title="Xem chi tiết"
                                    >
                                        <Eye width={16} height={16} />
                                    </Link>

                                    {order.status === "COMPLETED" && (
                                        <Link
                                            to={`/feedback?orderId=${order.id}`}
                                            className="flex items-center justify-center w-9 h-9 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all font-semibold"
                                            title="Đánh giá sản phẩm"
                                        >
                                            <Star width={16} height={16} />
                                        </Link>
                                    )}

                                    {order.status === "PENDING" && (
                                        <button
                                            onClick={() => handleOpenCancelModal(order.id)}
                                            className="flex items-center justify-center w-9 h-9 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all font-semibold"
                                            title="Hủy đơn hàng"
                                        >
                                            <XmarkCircle width={16} height={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-96 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BoxIso width={40} height={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-black text-slate-400 mb-2">Không có đơn hàng nào</h3>
                        <p className="text-sm text-slate-400 font-medium mb-6">Bắt đầu mua sắm ngay để có đơn hàng đầu tiên</p>
                        <Link to="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-client-primary hover:bg-rose-700 text-white rounded-lg font-bold text-sm shadow-lg shadow-client-primary/30 transition-all">
                            <BoxIso width={16} height={16} />
                            Khám phá cửa hàng
                        </Link>
                    </div>
                </div>
            )}

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
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowFeedbackModal(false)}></div>
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full relative z-10 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="w-24 h-24 bg-gradient-to-br from-client-primary/10 to-rose-50 rounded-full flex items-center justify-center mx-auto mb-8">
                            <Star className="w-12 h-12 text-client-primary fill-current" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-3 text-center uppercase tracking-tight">Cảm ơn bạn!</h3>
                        <p className="text-base text-slate-600 font-medium mb-8 text-center leading-relaxed">
                            Hãy chia sẻ đánh giá của bạn để giúp TeddyPet ngày càng hoàn thiện hơn 🐾
                        </p>
                        <div className="flex flex-col gap-3">
                            <Link to={`/feedback?orderId=${currentOrderId}`} className="h-14 bg-gradient-to-r from-client-primary to-rose-600 text-white rounded-xl font-black text-base flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-client-primary/30 shadow-md shadow-client-primary/20 transition-all">
                                <Star width={18} height={18} fill="white" />
                                ĐÁNH GIÁ NGAY
                            </Link>
                            <button onClick={() => setShowFeedbackModal(false)} className="h-10 text-slate-500 font-bold text-sm uppercase tracking-widest hover:text-slate-900 transition-colors">Để sau nhé</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Order Modal with Quick Options */}
            {cancelModal.isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseCancelModal}></div>
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full relative z-10 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center">
                                    <XmarkCircle width={18} height={18} />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Hủy đơn hàng?</h3>
                            </div>
                            <button onClick={handleCloseCancelModal} className="text-slate-300 hover:text-slate-700 transition-colors p-1 hover:bg-slate-100 rounded-lg">
                                <XmarkCircle className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Reason Selection */}
                        <div className="mb-6">
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Chọn lý do hủy:</p>
                            <div className="space-y-2">
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
                                            className={`w-full p-3 rounded-lg text-left transition-all border-2 flex items-start gap-3 ${isSelected
                                                ? 'border-rose-400 bg-rose-50'
                                                : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                                                }`}
                                        >
                                            <div className={`shrink-0 w-4 h-4 rounded-full border-2 mt-1 flex items-center justify-center transition-all ${isSelected
                                                ? 'border-rose-500 bg-rose-500'
                                                : 'border-slate-300 bg-white'
                                                }`}>
                                                {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                            </div>
                                            <span className={`text-sm font-semibold leading-tight ${isSelected ? 'text-rose-700' : 'text-slate-700'}`}>
                                                {reason}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Custom Reason Input */}
                        {isCustomReason && (
                            <div className="mb-6 animate-in slide-in-from-top duration-300">
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Vui lòng nhập lý do chi tiết..."
                                    className="w-full h-20 p-4 border-2 border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:border-rose-400 focus:outline-none transition-all resize-none bg-white placeholder:text-slate-400"
                                    maxLength={500}
                                    autoFocus
                                />
                                <p className="text-xs text-slate-400 font-medium mt-2">{cancelReason.length}/500</p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 font-bold">
                            <button
                                onClick={handleCloseCancelModal}
                                className="flex-1 h-10 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-all uppercase tracking-wider font-semibold"
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                disabled={isCancelling || !cancelReason.trim()}
                                className="flex-1.5 h-10 bg-rose-500 text-white rounded-lg text-sm hover:bg-rose-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-rose-200 font-bold"
                            >
                                {isCancelling ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Xử lý...
                                    </>
                                ) : (
                                    <>
                                        <XmarkCircle width={16} height={16} />
                                        Xác nhận
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
