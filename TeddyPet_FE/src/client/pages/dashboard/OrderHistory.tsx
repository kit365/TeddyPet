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
import { confirmReceived } from "../../../api/order.api";
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
                            <th className="p-6 rounded-r-2xl text-[1.3rem] font-black text-slate-400 uppercase tracking-widest text-center">Thao tác</th>
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
                                        <div className="flex items-center justify-center gap-3">
                                            {order.status === "DELIVERED" && (
                                                <button
                                                    onClick={() => handleOpenConfirm(order.id)}
                                                    className="flex items-center justify-center gap-2 h-12 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-[1.2rem] transition-all shadow-lg shadow-emerald-100 active:scale-95"
                                                >
                                                    <CheckCircle className="w-5 h-5" /> NHẬN HÀNG
                                                </button>
                                            )}

                                            <Link
                                                to={`/dashboard/order/detail/${order.id}`}
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
                                                <button className="flex items-center justify-center gap-2 h-12 px-5 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all" title="Hủy đơn">
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
        </DashboardLayout>
    );
};
