import { Link } from "react-router-dom";
import { useOrders } from "../../hooks/useOrders";
import { Eye, Package, Star, XmarkCircle, CheckCircle, ArrowLeft, ArrowRight, Search, Calendar } from "iconoir-react";
import { SlidersHorizontal } from "lucide-react";
import { confirmReceived, cancelOrder } from "../../../api/order.api";
import { toast } from "react-toastify";
import { useState } from "react";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { DashboardLayout } from "./sections/DashboardLayout";
import { StatusBadge } from "../../components/ui/StatusBadge";

export const OrderHistoryRefactored = () => {
    const { 
        orders, 
        loading, 
        refresh,
        currentPage,
        setCurrentPage,
        totalPages,
        totalElements,
        statusFilter,
        setStatusFilter
    } = useOrders(true);
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
    const [searchTerm, setSearchTerm] = useState('');
    const [showLoadMore, setShowLoadMore] = useState(false);
    const [dateRange, setDateRange] = useState<'all' | '30days' | 'month'>('all');
    const ITEMS_PER_PAGE = 10;

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
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                        <Package width={24} height={24} strokeWidth={2.5} className="text-indigo-600" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900">Lịch sử đơn hàng</h1>
                </div>
                <div className="bg-slate-100 text-slate-600 rounded-full px-4 py-2 text-xs font-bold">
                    {totalElements} Đơn
                </div>
            </div>

            {/* SEARCH + FILTER BAR */}
            {!loading && (
                <div className="mb-6 w-full overflow-x-auto">
                    <div className="flex items-center gap-2 min-w-[760px]">
                        <div className="flex-1 relative">
                            <Search width={16} height={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm mã đơn hàng..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setShowLoadMore(false);
                                }}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                            />
                        </div>

                        <div className="relative shrink-0">
                            <SlidersHorizontal size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select
                                value={statusFilter || ""}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value || undefined);
                                    setCurrentPage(0);
                                    setShowLoadMore(false);
                                }}
                                className="pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 whitespace-nowrap"
                                aria-label="Lọc theo trạng thái"
                            >
                                <option value="">Trạng thái</option>
                                <option value="PENDING">Chờ xác nhận</option>
                                <option value="CONFIRMED">Đã xác nhận</option>
                                <option value="PROCESSING">Đang đóng gói</option>
                                <option value="DELIVERING">Đang giao</option>
                                <option value="DELIVERED">Đã giao</option>
                                <option value="COMPLETED">Hoàn thành</option>
                                <option value="CANCELLED">Đã hủy</option>
                            </select>
                        </div>

                        <div className="relative shrink-0">
                            <Calendar width={16} height={16} strokeWidth={2.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select
                                value={dateRange}
                                onChange={(e) => {
                                    setDateRange(e.target.value as 'all' | '30days' | 'month');
                                    setCurrentPage(0);
                                    setShowLoadMore(false);
                                }}
                                className="pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 whitespace-nowrap"
                                aria-label="Lọc theo thời gian"
                            >
                                <option value="all">Thời gian</option>
                                <option value="30days">30 ngày gần nhất</option>
                                <option value="month">Chọn tháng</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* LOADING STATE */}
            {loading && (
                <div className="h-96 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-500 font-semibold">Đang tải dữ liệu...</p>
                    </div>
                </div>
            )}

            {/* ORDERS LIST - Single Container with Divide */}
            {!loading && orders.length > 0 && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
                    {orders
                        .filter(order => order.orderCode.toLowerCase().includes(searchTerm.toLowerCase()))
                        .slice(0, showLoadMore ? orders.length : ITEMS_PER_PAGE)
                        .map((order) => (
                        <div key={order.id} className="grid grid-cols-[minmax(0,1fr)_140px_140px_120px] items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
                            {/* LEFT: Icon + ID + Date */}
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                                    <Package width={24} height={24} strokeWidth={2.5} className="text-indigo-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm text-slate-800 truncate">#{order.orderCode}</p>
                                    <p className="text-xs text-slate-400">
                                        {new Date(order.createdAt).toLocaleString("vi-VN", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* CENTER 1: Status Badge */}
                            <div className="flex justify-center min-w-0">
                                <StatusBadge status={order.status} />
                            </div>

                            {/* CENTER 2: Amount */}
                            <div className="text-right min-w-0">
                                <p className="text-base font-black text-slate-900">{order.finalAmount.toLocaleString()}₫</p>
                            </div>

                            {/* RIGHT: Actions */}
                            <div className="flex items-center gap-2 min-w-0 justify-end">
                                {order.status === "DELIVERED" && (
                                    <button
                                        onClick={() => handleOpenConfirm(order.id)}
                                        disabled={processingId === order.id}
                                        className="h-8 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60"
                                        title="Xác nhận nhận hàng"
                                    >
                                        {processingId === order.id ? (
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <CheckCircle width={18} height={18} strokeWidth={2.5} />
                                        )}
                                        <span className="hidden sm:inline">Nhận</span>
                                    </button>
                                )}

                                <Link
                                    to={`/dashboard/orders/${order.id}`}
                                    className="h-9 w-9 rounded-xl flex items-center justify-center bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                                    title="Xem chi tiết"
                                >
                                    <Eye width={18} height={18} strokeWidth={2.5} />
                                </Link>

                                {order.status === "COMPLETED" && (
                                    <Link
                                        to={`/feedback?orderId=${order.id}`}
                                        className="h-9 w-9 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                                        title="Đánh giá sản phẩm"
                                    >
                                        <Star width={18} height={18} strokeWidth={2.5} />
                                    </Link>
                                )}

                                {order.status === "PENDING" && (
                                    <button
                                        onClick={() => handleOpenCancelModal(order.id)}
                                        className="h-9 w-9 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                        title="Hủy đơn hàng"
                                    >
                                        <XmarkCircle width={18} height={18} strokeWidth={2.5} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* LOAD MORE BUTTON */}
            {!loading && orders.length > ITEMS_PER_PAGE && !showLoadMore && (
                <div className="mt-6 text-center">
                    <button
                        onClick={() => setShowLoadMore(true)}
                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm transition-colors"
                    >
                        Xem thêm đơn cũ
                    </button>
                </div>
            )}

            {/* PAGINATION */}
            {!loading && orders.length > 0 && totalPages > 1 && showLoadMore && (
                <div className="mt-8 flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-500">
                        Trang {currentPage + 1} / {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                            disabled={currentPage === 0}
                            className="h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 text-xs font-semibold"
                        >
                            <ArrowLeft width={14} height={14} />
                            Trước
                        </button>
                        
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                                        currentPage === i
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                            disabled={currentPage === totalPages - 1}
                            className="h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 text-xs font-semibold"
                        >
                            Sau
                            <ArrowRight width={14} height={14} />
                        </button>
                    </div>
                </div>
            )}
            {!loading && orders.length === 0 && (
                <div className="h-96 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
                            <Package width={40} height={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-500 mb-2">Không có đơn hàng nào</h3>
                        <p className="text-sm text-slate-400 font-medium mb-6">Khám phá cửa hàng để đặt hàng</p>
                        <Link to="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors">
                            <Package width={16} height={16} />
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
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full relative z-10 shadow-2xl border border-slate-100">
                        <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-6">
                            <Star width={36} height={36} className="text-indigo-600 fill-current" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 text-center mb-2">Tuyệt vời!</h2>
                        <p className="text-slate-600 text-center font-medium mb-8">Hãy chia sẻ đánh giá để giúp TeddyPet ngày càng hoàn thiện hơn</p>
                        <div className="flex flex-col gap-3">
                            <Link to={`/feedback?orderId=${currentOrderId}`} className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                                <Star width={16} height={16} fill="white" />
                                ĐÁNH GIÁ NGAY
                            </Link>
                            <button onClick={() => setShowFeedbackModal(false)} className="h-10 text-slate-500 hover:text-slate-900 font-semibold text-sm uppercase transition-colors">Để sau nhé</button>
                        </div>
                    </div>
                </div>
            )}

            {/* CANCEL MODAL */}
            {cancelModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" onClick={handleCloseCancelModal}></div>
                    <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-2xl">
                        <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                                    <XmarkCircle width={24} height={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight text-slate-900">Hủy đơn hàng?</h2>
                                    <p className="mt-1 text-sm font-medium text-slate-500">Vui lòng chọn một lý do để TeddyPet cải thiện dịch vụ tốt hơn.</p>
                                </div>
                            </div>
                            <button
                                onClick={handleCloseCancelModal}
                                className="h-9 w-9 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">Chọn lý do hủy đơn</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                            className={`min-h-[92px] w-full rounded-2xl border p-4 text-left transition-all flex items-center gap-3 ${isSelected
                                                ? 'border-rose-300 bg-rose-50 text-rose-700 shadow-sm'
                                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span className={`h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected
                                                ? 'border-rose-500 bg-rose-500'
                                                : 'border-slate-300 bg-white'
                                            }`}>
                                                {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
                                            </span>
                                            <span className="text-sm font-semibold leading-5">{reason}</span>
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
                                    className="h-24 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                                    maxLength={500}
                                    autoFocus
                                />
                                <p className="mt-2 text-right text-xs font-medium text-slate-400">{cancelReason.length}/500</p>
                            </div>
                        )}

                        <div className="flex gap-3 font-bold">
                            <button
                                onClick={handleCloseCancelModal}
                                className="h-12 flex-1 rounded-xl bg-slate-100 text-sm uppercase tracking-wide text-slate-700 transition-colors hover:bg-slate-200"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                disabled={isCancelling || !cancelReason.trim()}
                                className="h-12 flex-1 rounded-xl bg-rose-500 text-sm uppercase tracking-wide text-white transition-colors hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isCancelling ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Đang xử lý
                                    </>
                                ) : (
                                    <>
                                        <XmarkCircle width={16} height={16} />
                                        Xác nhận hủy
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
