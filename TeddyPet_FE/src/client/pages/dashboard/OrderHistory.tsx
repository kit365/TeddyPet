import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useOrders } from "../../hooks/useOrders";
import {
    Eye,
    CheckCircle,
    BoxIso,
    Star,
    XmarkCircle,
    Search,
    Settings,
    Calendar,
    Filter
} from "iconoir-react";
import { CancelOrderModal } from "./sections/CancelOrderModal";
import { confirmReceived, cancelOrder } from "../../../api/order.api";
import { toast } from "react-toastify";
import { useState } from "react";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { DashboardLayout } from "./sections/DashboardLayout";

export const OrderHistoryPage = () => {
    const { 
        orders, 
        loading, 
        refresh,
        statusFilter,
        setStatusFilter
    } = useOrders(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; orderId: string | null }>({
        isOpen: false,
        orderId: null
    });
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [timeFilter, setTimeFilter] = useState('last30');
    const [showFilters, setShowFilters] = useState(false);

    // Cancel order state
    const [cancelModal, setCancelModal] = useState({ isOpen: false, orderId: '' });
    const [isCancelling, setIsCancelling] = useState(false);

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
    };

    const handleCloseCancelModal = () => {
        setCancelModal({ isOpen: false, orderId: '' });
    };

    const handleCancelOrder = async (reason: string) => {
        setIsCancelling(true);
        try {
            const response = await cancelOrder(cancelModal.orderId, reason);
            if (response.success) {
                toast.success("Đã hủy đơn hàng thành công!");
                handleCloseCancelModal();
                refresh();
            } else {
                toast.error(response.message || "Không thể hủy đơn hàng");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể hủy đơn hàng");
        } finally {
            setIsCancelling(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.orderCode.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || order.status === statusFilter;

        // Time filter logic
        let matchesTime = true;
        if (timeFilter !== 'all') {
            const orderDate = new Date(order.createdAt);
            const now = new Date();
            if (timeFilter === 'last30') {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(now.getDate() - 30);
                matchesTime = orderDate >= thirtyDaysAgo;
            } else if (timeFilter === 'last6') {
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(now.getMonth() - 6);
                matchesTime = orderDate >= sixMonthsAgo;
            } else if (timeFilter === 'thisYear') {
                matchesTime = orderDate.getFullYear() === now.getFullYear();
            }
        }

        return matchesSearch && matchesStatus && matchesTime;
    });

    return (
        <DashboardLayout pageTitle="Lịch sử đơn hàng" breadcrumbs={breadcrumbs}>
            {/* Header Section */}
            <div className="mb-4">
                <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-white px-5 py-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-client-primary to-rose-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-client-primary/30">
                            <BoxIso width={20} height={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Lịch sử đơn hàng</h2>
                            <p className="text-xs text-slate-500 font-bold mt-0.5 uppercase tracking-wider">
                                Quản lý tất cả các đơn hàng của bạn
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Search & Filter Section */}
            {!loading && (
                <div className="mb-6 space-y-3">
                    {/* Top Row: Search & Toggle Filter Button */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                        <div className="relative flex-1">
                            <Search width={18} height={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm mã đơn hàng..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-client-primary/5 focus:border-client-primary transition-all shadow-sm"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm border ${showFilters
                                    ? 'bg-client-primary text-white border-client-primary hover:bg-rose-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            <Filter width={18} height={18} />
                            Bộ lọc {((timeFilter !== 'all' || statusFilter) && !showFilters) && <div className="w-2 h-2 rounded-full bg-rose-500"></div>}
                        </button>
                    </div>

                    {/* Expandable Filters Row */}
                    {showFilters && (
                        <div className="flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-200 p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                            {/* Time Filter */}
                            <div className="relative flex-1">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none transition-colors">
                                    <Calendar width={18} height={18} />
                                </div>
                                <select
                                    value={timeFilter}
                                    onChange={(e) => setTimeFilter(e.target.value)}
                                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-client-primary/5 focus:border-client-primary transition-all appearance-none cursor-pointer hover:border-slate-300"
                                >
                                    <option value="all">Tất cả thời gian</option>
                                    <option value="last30">30 ngày qua</option>
                                    <option value="last6">6 tháng qua</option>
                                    <option value="thisYear">Năm nay</option>
                                </select>
                            </div>
                            {/* Status Filter */}
                            <div className="relative flex-1">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none transition-colors">
                                    <Settings width={18} height={18} />
                                </div>
                                <select
                                    value={statusFilter || ""}
                                    onChange={(e) => setStatusFilter(e.target.value || undefined)}
                                    className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-client-primary/5 focus:border-client-primary transition-all appearance-none cursor-pointer hover:border-slate-300"
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="PENDING">Chờ xác nhận</option>
                                    <option value="CONFIRMED">Đã xác nhận</option>
                                    <option value="PROCESSING">Đang đóng gói</option>
                                    <option value="DELIVERING">Đang giao</option>
                                    <option value="DELIVERED">Đã giao</option>
                                    <option value="COMPLETED">Hoàn thành</option>
                                    <option value="CANCELLED">Đã hủy</option>
                                </select>
                                <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none bg-slate-300 text-slate-700 rounded-lg px-2 h-5 flex items-center justify-center text-[10px] font-black leading-none">
                                    {statusFilter ? filteredOrders.length : orders.length}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Content Section */}
            {loading ? (
                <div className="min-h-[15rem] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-slate-100 border-t-client-primary rounded-full animate-spin shadow-lg"></div>
                        <p className="text-sm font-bold text-slate-400">Đang tải lịch sử đơn hàng...</p>
                    </div>
                </div>
            ) : filteredOrders.length > 0 ? (
                <div className="space-y-3 pb-24">
                    {filteredOrders.map((order) => (
                        <div key={order.id} className="group bg-white border border-slate-100 rounded-xl p-4 hover:shadow-lg hover:border-slate-200 transition-all duration-300">
                            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center">
                                {/* Order Code */}
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-client-primary/10 transition-colors">
                                        <BoxIso width={18} height={18} className="text-slate-600 group-hover:text-client-primary transition-colors" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm group-hover:text-client-primary transition-colors">#{order.orderCode}</p>
                                        <p className="text-xs text-slate-400 font-bold mt-0.5">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</p>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="flex justify-center -ml-4">
                                    <StatusBadge status={order.status} />
                                </div>

                                {/* Total Amount */}
                                <div className="text-right min-w-[80px]">
                                    <p className="font-bold text-slate-900 text-sm whitespace-nowrap">{order.finalAmount.toLocaleString()}₫</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng tiền</p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-1">
                                    {order.status === "DELIVERED" && (
                                        <button
                                            onClick={() => handleOpenConfirm(order.id)}
                                            disabled={processingId === order.id}
                                            className="h-7 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-[10px] transition-all active:scale-95 uppercase tracking-wide shadow-sm disabled:opacity-60 flex items-center gap-1"
                                            title="Xác nhận nhận hàng"
                                        >
                                            {processingId === order.id ? (
                                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    <CheckCircle width={14} height={14} />
                                                    <span className="hidden sm:inline">Nhận</span>
                                                </>
                                            )}
                                        </button>
                                    )}

                                    <Link
                                        to={`/dashboard/orders/${order.id}`}
                                        className="w-7 h-7 bg-white border border-slate-200 text-slate-500 hover:border-slate-800 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-all flex items-center justify-center"
                                        title="Xem chi tiết"
                                    >
                                        <Eye width={14} height={14} />
                                    </Link>

                                    {order.status === "COMPLETED" && (
                                        <Link
                                            to={`/feedback?orderId=${order.id}`}
                                            className="w-7 h-7 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all flex items-center justify-center"
                                            title="Đánh giá sản phẩm"
                                        >
                                            <Star width={14} height={14} />
                                        </Link>
                                    )}

                                    {order.status === "PENDING" && (
                                        <button
                                            onClick={() => handleOpenCancelModal(order.id)}
                                            className="w-7 h-7 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all flex items-center justify-center"
                                            title="Hủy đơn hàng"
                                        >
                                            <XmarkCircle width={14} height={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-[15rem] flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BoxIso width={40} height={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-black text-slate-400 mb-1.5">Không có đơn hàng nào</h3>
                        <p className="text-sm text-slate-400 font-medium mb-4">Bắt đầu mua sắm ngay để có đơn hàng đầu tiên</p>
                        <Link to="/shop" className="inline-flex items-center gap-2 px-4 py-2 bg-client-primary hover:bg-rose-700 text-white rounded-lg font-bold text-sm shadow-lg shadow-client-primary/30 transition-all">
                            <BoxIso width={18} height={18} />
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
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full relative z-10 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="w-12 h-12 bg-gradient-to-br from-client-primary/10 to-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Star className="w-6 h-6 text-client-primary fill-current" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-1 text-center uppercase tracking-tight">Cảm ơn bạn!</h3>
                        <p className="text-sm text-slate-600 font-medium mb-4 text-center leading-relaxed">
                            Hãy chia sẻ đánh giá của bạn để giúp TeddyPet ngày càng hoàn thiện hơn 🐾
                        </p>
                        <div className="flex flex-col gap-3">
                            <Link to={`/feedback?orderId=${currentOrderId}`} className="h-10 bg-gradient-to-r from-client-primary to-rose-600 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-client-primary/30 shadow-md shadow-client-primary/20 transition-all">
                                <Star width={16} height={16} fill="white" />
                                ĐÁNH GIÁ NGAY
                            </Link>
                            <button onClick={() => setShowFeedbackModal(false)} className="h-6 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-900 transition-colors">Để sau nhé</button>
                        </div>
                    </div>
                </div>
            )}

            <CancelOrderModal
                isOpen={cancelModal.isOpen}
                onClose={handleCloseCancelModal}
                onConfirm={handleCancelOrder}
                isCancelling={isCancelling}
            />
        </DashboardLayout>
    );
};
