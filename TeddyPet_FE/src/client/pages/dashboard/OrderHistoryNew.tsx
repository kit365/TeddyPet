import { Link } from "react-router-dom";
import { useOrders } from "../../hooks/useOrders";
import {
    Eye, CheckCircle, BoxIso, Star, XmarkCircle
} from "iconoir-react";
import { confirmReceived, cancelOrder } from "../../../api/order.api";
import { toast } from "react-toastify";
import { useState } from "react";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { DashboardLayout } from "./sections/DashboardLayout";
import { StatusBadge } from "../../components/ui/StatusBadge";

export const OrderHistoryNew = () => {
    const { orders, loading, refresh } = useOrders();
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; orderId: string | null }>({
        isOpen: false,
        orderId: null
    });
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

    const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; orderId: string | null }>({
        isOpen: false,
        orderId: null
    });
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);
    const [isCustomReason, setIsCustomReason] = useState(false);

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
            {/* HEADER */}
            <div className="mb-8">
                <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-500 text-white flex items-center justify-center">
                            <BoxIso width={20} height={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Lịch sử đơn hàng</h1>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">Quản lý đơn hàng của bạn</p>
                        </div>
                    </div>
                    <div className="bg-gray-900 text-white rounded-lg px-4 py-2 flex items-center gap-2">
                        <span className="text-2xl font-bold">{orders.length}</span>
                        <span className="text-xs font-bold uppercase tracking-wider">Đơn</span>
                    </div>
                </div>
            </div>

            {/* LOADING STATE */}
            {loading && (
                <div className="h-96 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-red-500 animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-500 font-semibold">Đang tải dữ liệu...</p>
                    </div>
                </div>
            )}

            {/* ORDERS LIST */}
            {!loading && orders.length > 0 && (
                <div className="space-y-2">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all p-4">
                            <div className="grid grid-cols-[auto_1fr_100px_100px_80px] gap-4 items-center">
                                {/* Icon */}
                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <BoxIso width={16} height={16} className="text-gray-600" />
                                </div>

                                {/* ID + Date */}
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm truncate">#{order.orderCode}</p>
                                    <p className="text-xs text-gray-500 font-medium">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</p>
                                </div>

                                {/* Status */}
                                <div className="flex justify-center">
                                    <StatusBadge status={order.status} />
                                </div>

                                {/* Amount */}
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900 text-sm">{order.finalAmount.toLocaleString()}₫</p>
                                    <p className="text-xs text-gray-500">Tổng</p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1.5 justify-end">
                                    {order.status === "DELIVERED" && (
                                        <button
                                            onClick={() => handleOpenConfirm(order.id)}
                                            disabled={processingId === order.id}
                                            className="h-8 px-2 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-60"
                                        >
                                            {processingId === order.id ? (
                                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <CheckCircle width={12} height={12} />
                                            )}
                                        </button>
                                    )}

                                    <Link
                                        to={`/dashboard/orders/${order.id}`}
                                        className="w-8 h-8 rounded border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 flex items-center justify-center transition-all"
                                    >
                                        <Eye width={14} height={14} />
                                    </Link>

                                    {order.status === "COMPLETED" && (
                                        <Link
                                            to={`/feedback?orderId=${order.id}`}
                                            className="w-8 h-8 rounded bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all"
                                        >
                                            <Star width={14} height={14} />
                                        </Link>
                                    )}

                                    {order.status === "PENDING" && (
                                        <button
                                            onClick={() => handleOpenCancelModal(order.id)}
                                            className="w-8 h-8 rounded bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                                        >
                                            <XmarkCircle width={14} height={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* EMPTY STATE */}
            {!loading && orders.length === 0 && (
                <div className="h-96 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                            <BoxIso width={40} height={40} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-500 mb-2">Không có đơn hàng nào</h3>
                        <p className="text-sm text-gray-400 font-medium mb-6">Khám phá cửa hàng để đặt hàng</p>
                        <Link to="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-sm transition-colors shadow-lg shadow-red-500/30">
                            <BoxIso width={16} height={16} />
                            Khám phá ngay
                        </Link>
                    </div>
                </div>
            )}

            {/* CONFIRM MODAL */}
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

            {/* FEEDBACK MODAL */}
            {showFeedbackModal && currentOrderId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFeedbackModal(false)}></div>
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full relative z-10 shadow-2xl border border-gray-100">
                        <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
                            <Star width={40} height={40} className="text-red-500 fill-current" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2 uppercase">Tuyệt vời!</h2>
                        <p className="text-gray-600 text-center font-medium mb-8">Hãy chia sẻ đánh giá để giúp TeddyPet ngày càng hoàn thiện hơn</p>
                        <div className="flex flex-col gap-3">
                            <Link to={`/feedback?orderId=${currentOrderId}`} className="h-12 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                                <Star width={16} height={16} fill="white" />
                                ĐÁNH GIÁ NGAY
                            </Link>
                            <button onClick={() => setShowFeedbackModal(false)} className="h-10 text-gray-500 hover:text-gray-900 font-semibold text-sm uppercase transition-colors">Để sau nhé</button>
                        </div>
                    </div>
                </div>
            )}

            {/* CANCEL MODAL */}
            {cancelModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseCancelModal}></div>
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full relative z-10 shadow-2xl border border-gray-100">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                                    <XmarkCircle width={18} height={18} />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900 uppercase">Hủy đơn hàng?</h2>
                            </div>
                            <button onClick={handleCloseCancelModal} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                <XmarkCircle width={20} height={20} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Lý do hủy:</p>
                            <div className="space-y-2">
                                {quickReasons.map((reason, idx) => {
                                    const isSelected = (reason === "Lý do khác" && isCustomReason) || cancelReason === reason;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                if (reason === "Lý do khác") {
                                                    setIsCustomReason(true);
                                                    setCancelReason('');
                                                } else {
                                                    setIsCustomReason(false);
                                                    setCancelReason(reason);
                                                }
                                            }}
                                            className={`w-full p-3 rounded-lg text-left text-sm font-semibold transition-all border-2 flex items-start gap-3 ${isSelected
                                                ? 'border-red-400 bg-red-50 text-red-700'
                                                : 'border-gray-100 hover:border-gray-200 bg-gray-50 text-gray-700'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 ${isSelected
                                                ? 'border-red-500 bg-red-500'
                                                : 'border-gray-300 bg-white'
                                            }`}>
                                                {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                            </div>
                                            <span>{reason}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {isCustomReason && (
                            <div className="mb-6">
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Nhập lý do chi tiết..."
                                    className="w-full h-20 p-4 border-2 border-gray-100 rounded-lg text-sm font-medium text-gray-800 focus:border-red-400 focus:outline-none transition-all resize-none placeholder:text-gray-400"
                                    maxLength={500}
                                    autoFocus
                                />
                                <p className="text-xs text-gray-400 font-medium mt-2">{cancelReason.length}/500</p>
                            </div>
                        )}

                        <div className="flex gap-3 font-bold">
                            <button
                                onClick={handleCloseCancelModal}
                                className="flex-1 h-10 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm uppercase transition-colors"
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                disabled={isCancelling || !cancelReason.trim()}
                                className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
