import { ProductBanner } from "../product/sections/ProductBanner";
import { Link } from "react-router-dom";
import { Sidebar } from "./sections/Sidebar";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useOrders } from "../../hooks/useOrders";
import {
    Eye,
    CheckCircle,
    BoxIso,
    Star,
    XmarkCircle,
    RefreshDouble
} from "iconoir-react";
import { confirmReceived } from "../../../api/order.api";
import { toast } from "react-toastify";
import { useState } from "react";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

export const OrderHistoryPage = () => {
    const { orders, loading, refresh } = useOrders();
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; orderId: string | null }>({
        isOpen: false,
        orderId: null
    });

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
                refresh();
                setConfirmModal({ isOpen: false, orderId: null });
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
        <div className="bg-[#fcfcfc] min-h-screen pb-[100px]">
            <ProductBanner
                pageTitle="Lịch sử đơn hàng"
                breadcrumbs={breadcrumbs}
                url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-details.jpg"
                className="bg-top"
            />

            <div className="app-container app-container-wider mt-[-100px] relative z-20">
                <div className="flex gap-[30px] items-stretch">
                    <div className="w-[320px] shrink-0">
                        <Sidebar />
                    </div>

                    <div className="flex-1">
                        <div className="p-[40px] bg-white border border-gray-100 shadow-sm rounded-[32px] animate-fadeIn">
                            <div className="flex justify-between items-center mb-[35px]">
                                <h3 className="text-[2.4rem] font-black text-client-secondary uppercase tracking-tight flex items-center gap-4">
                                    <BoxIso className="text-client-primary w-10 h-10" />
                                    Đơn hàng của bạn
                                </h3>
                                <div className="px-5 py-2 bg-gray-50 rounded-full border border-gray-100 text-[1.4rem] font-bold text-gray-400">
                                    Tổng cộng: {orders.length} đơn hàng
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-separate border-spacing-y-4">
                                    <thead>
                                        <tr className="bg-gray-50/50">
                                            <th className="p-[20px] rounded-l-2xl text-[1.3rem] font-black text-client-secondary uppercase tracking-widest">Mã đơn</th>
                                            <th className="p-[20px] text-[1.3rem] font-black text-client-secondary uppercase tracking-widest text-center">Ngày đặt</th>
                                            <th className="p-[20px] text-[1.3rem] font-black text-client-secondary uppercase tracking-widest text-center">Trạng thái</th>
                                            <th className="p-[20px] text-[1.3rem] font-black text-client-secondary uppercase tracking-widest text-right">Tổng tiền</th>
                                            <th className="p-[20px] rounded-r-2xl text-[1.3rem] font-black text-client-secondary uppercase tracking-widest text-center">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="before:block before:h-2">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={5} className="p-[60px] text-center">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="w-[40px] h-[40px] border-[4px] border-client-primary/10 border-t-client-primary rounded-full animate-spin"></div>
                                                        <p className="text-[1.6rem] font-bold text-gray-300">Đang đồng bộ đơn hàng...</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : orders.length > 0 ? (
                                            orders.map((order) => (
                                                <tr key={order.id} className="group hover:bg-gray-50/50 transition-all">
                                                    <td className="p-[20px] border-t border-b border-l border-gray-100 rounded-l-2xl">
                                                        <span className="text-[1.6rem] font-black text-client-secondary group-hover:text-client-primary transition-colors">#{order.orderCode}</span>
                                                    </td>
                                                    <td className="p-[20px] border-t border-b border-gray-100 text-center">
                                                        <span className="text-[1.4rem] font-bold text-gray-500">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</span>
                                                    </td>
                                                    <td className="p-[20px] border-t border-b border-gray-100 text-center">
                                                        <div className="flex justify-center">
                                                            <StatusBadge status={order.status} />
                                                        </div>
                                                    </td>
                                                    <td className="p-[20px] border-t border-b border-gray-100 text-right">
                                                        <span className="text-[1.7rem] font-black text-client-secondary">{order.finalAmount.toLocaleString()}đ</span>
                                                    </td>
                                                    <td className="p-[20px] border-t border-b border-r border-gray-100 rounded-r-2xl">
                                                        <div className="flex flex-col gap-2 scale-90 origin-right lg:scale-100">
                                                            {order.status === "DELIVERED" && (
                                                                <button
                                                                    onClick={() => handleOpenConfirm(order.id)}
                                                                    className="flex items-center justify-center gap-2 h-[42px] px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[1.2rem] transition-all shadow-md shadow-emerald-100 animate-pulse active:scale-95"
                                                                >
                                                                    <CheckCircle className="w-5 h-5" />
                                                                    XÁC NHẬN NHẬN HÀNG
                                                                </button>
                                                            )}

                                                            <div className="flex items-center justify-center gap-2">
                                                                <Link
                                                                    to={`/dashboard/order/detail/${order.id}`}
                                                                    className="flex flex-1 items-center justify-center gap-2 h-[42px] bg-white border border-gray-200 text-gray-500 hover:border-client-primary hover:text-client-primary rounded-xl font-bold text-[1.2rem] transition-all"
                                                                >
                                                                    <Eye className="w-4 h-4" /> Chi tiết
                                                                </Link>

                                                                {order.status === "COMPLETED" && (
                                                                    <Link
                                                                        to={`/dashboard/order/detail/${order.id}`}
                                                                        className="flex flex-1 items-center justify-center gap-2 h-[42px] bg-client-primary/5 text-client-primary border border-client-primary/10 hover:bg-client-primary hover:text-white rounded-xl font-bold text-[1.2rem] transition-all"
                                                                    >
                                                                        <Star className="w-4 h-4" /> Đánh giá
                                                                    </Link>
                                                                )}

                                                                {order.status === "PENDING" && (
                                                                    <button className="flex items-center justify-center gap-2 h-[42px] w-[42px] bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all" title="Hủy đơn">
                                                                        <XmarkCircle className="w-5 h-5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="p-[80px] text-center">
                                                    <div className="flex flex-col items-center gap-4 grayscale opacity-40">
                                                        <BoxIso className="w-20 h-20 text-gray-300" />
                                                        <p className="text-[1.8rem] font-bold text-gray-400">Bạn chưa có đơn hàng nào tại TeddyPet.</p>
                                                        <Link to="/cua-hang" className="mt-4 px-8 py-3 bg-client-primary text-white rounded-full font-black text-[1.4rem]">MUA SẮM NGAY</Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Custom Confirm Modal */}
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

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
            `}</style>
        </div>
    );
};
