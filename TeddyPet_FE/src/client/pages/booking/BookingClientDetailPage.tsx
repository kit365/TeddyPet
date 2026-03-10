import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { FooterSub } from "../../components/layouts/FooterSub";
import type { BookingResponse, BookingStatus, PaymentStatus } from "../../../types/booking.type";
import { apiApp } from "../../../api";

const formatCurrency = (v: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);

const getBookingStatusLabel = (status: BookingStatus | string) => {
    switch (status) {
        case "PENDING":
            return "Đang chờ xử lý";
        case "CONFIRMED":
            return "Đã xác nhận";
        case "IN_PROGRESS":
            return "Đang thực hiện";
        case "COMPLETED":
            return "Hoàn tất";
        case "CANCELLED":
            return "Đã hủy";
        default:
            return status || "—";
    }
};

const getPaymentStatusLabel = (status: PaymentStatus | string) => {
    switch (status) {
        case "PENDING":
            return "Đang chờ thanh toán đặt cọc";
        case "PARTIAL":
            return "Đã thanh toán một phần";
        case "PAID":
            return "Đã thanh toán đủ";
        case "REFUNDED":
            return "Đã hoàn tiền";
        default:
            return status || "—";
    }
};

export const BookingClientDetailPage = () => {
    const { bookingCode } = useParams<{ bookingCode: string }>();
    const navigate = useNavigate();
    const [booking, setBooking] = useState<BookingResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!bookingCode) return;
            try {
                const res = await apiApp.get<{ data: BookingResponse }>(`/api/bookings/code/${bookingCode}`);
                setBooking(res.data.data);
            } catch {
                toast.error("Không tìm thấy đơn đặt lịch.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [bookingCode]);

    const canEditServices =
        booking &&
        booking.deposit === 0 &&
        (booking.paymentStatus === "PENDING" || booking.paymentStatus === "PARTIAL");

    const canEditContactOnly =
        booking &&
        booking.deposit > 0 &&
        (booking.status === "PENDING" || booking.status === "IN_PROGRESS");

    const canEdit = Boolean(canEditServices || canEditContactOnly);

    return (
        <div>
            <div className="app-container py-[60px]">
                <div className="max-w-[960px] mx-auto bg-white rounded-[18px] border border-[#f1f1f1] shadow-[0_12px_45px_rgba(15,23,42,0.06)] overflow-hidden">
                    {/* Header */}
                    <div className="px-[28px] py-[22px] bg-gradient-to-r from-[#fff5f0] via-[#ffe5d7] to-[#ffece2] border-b border-[#f3e0d6] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="uppercase tracking-[0.12em] text-[1.2rem] font-[700] text-[#c45a3a]/80">
                                Chi tiết đơn đặt lịch
                            </p>
                            {booking && (
                                <h2 className="mt-1 text-[2.4rem] font-[800] text-[#181818]">
                                    Mã đặt lịch:{" "}
                                    <span className="text-[#c45a3a]">
                                        {booking.bookingCode}
                                    </span>
                                </h2>
                            )}
                            {booking && (
                                <p className="mt-1 text-[1.35rem] text-[#5f6368]">
                                    Trạng thái:{" "}
                                    <span className="font-[600] text-[#111827]">
                                        {getBookingStatusLabel(booking.status)}
                                    </span>
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate("/dat-lich")}
                            className="inline-flex items-center justify-center gap-2 rounded-[999px] border border-[#f1bca1] bg-white/90 text-[#c45a3a] text-[1.35rem] font-[600] px-[18px] py-[9px] shadow-sm hover:bg-[#ffefe7] hover:border-[#ffb997] transition-colors"
                        >
                            Quay về đặt lịch mới
                        </button>
                    </div>

                    <div className="p-[24px] md:p-[28px] space-y-[20px] text-[1.5rem] bg-[#fffdfb]">
                        {loading && (
                            <div className="text-[1.5rem] text-[#6b7280]">
                                Đang tải thông tin đơn đặt lịch...
                            </div>
                        )}
                        {!loading && !booking && (
                            <div className="text-[#ef4444] text-[1.5rem]">
                                Không tìm thấy đơn đặt lịch.
                            </div>
                        )}
                        {booking && (
                            <>
                                {/* Hai cột thông tin */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Khách hàng */}
                                    <div className="rounded-[14px] border border-[#f3e0d6] bg-white px-5 py-4 shadow-[0_6px_20px_rgba(148,98,69,0.04)]">
                                        <p className="text-[1.5rem] font-[700] text-[#111827] mb-3">
                                            Thông tin khách hàng
                                        </p>
                                        <div className="space-y-1.5 text-[1.4rem] text-[#374151]">
                                            <div>
                                                <span className="font-[600]">Họ tên: </span>
                                                <span>{booking.customerName}</span>
                                            </div>
                                            <div>
                                                <span className="font-[600]">Email: </span>
                                                <span>{booking.customerEmail}</span>
                                            </div>
                                            <div>
                                                <span className="font-[600]">Số điện thoại: </span>
                                                <span>{booking.customerPhone}</span>
                                            </div>
                                            {booking.customerAddress && (
                                                <div>
                                                    <span className="font-[600]">Địa chỉ: </span>
                                                    <span>{booking.customerAddress}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Trạng thái & thanh toán */}
                                    <div className="rounded-[14px] border border-[#e5f2ec] bg-[#f8fffb] px-5 py-4 shadow-[0_6px_20px_rgba(16,185,129,0.04)]">
                                        <p className="text-[1.5rem] font-[700] text-[#065f46] mb-3">
                                            Trạng thái & thanh toán
                                        </p>
                                        <div className="space-y-1.5 text-[1.4rem] text-[#064e3b]">
                                            <div>
                                                <span className="font-[600]">Trạng thái đặt lịch: </span>
                                                <span>{getBookingStatusLabel(booking.status)}</span>
                                            </div>
                                            <div>
                                                <span className="font-[600]">Trạng thái thanh toán: </span>
                                                <span>{getPaymentStatusLabel(booking.paymentStatus)}</span>
                                            </div>
                                            <div className="pt-1 space-y-0.5">
                                                <div>
                                                    <span className="font-[600]">Tổng tiền: </span>
                                                    <span>{formatCurrency(booking.totalAmount)}</span>
                                                </div>
                                                <div>
                                                    <span className="font-[600]">Đã thanh toán: </span>
                                                    <span>{formatCurrency(booking.paidAmount)}</span>
                                                </div>
                                                <div>
                                                    <span className="font-[600]">Còn lại: </span>
                                                    <span>{formatCurrency(booking.remainingAmount)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Thanh hành động dưới cùng */}
                                <div className="pt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div className="text-[1.3rem] text-[#6b7280]">
                                        {canEdit
                                            ? "Bạn có thể chỉnh sửa đơn đặt lịch này trước khi chúng tôi xử lý."
                                            : "Đơn đặt lịch đã ở trạng thái không thể chỉnh sửa thêm."}
                                    </div>
                                    <button
                                        type="button"
                                        disabled={!canEdit}
                                        onClick={() => {
                                            if (!booking) return;
                                            // Tạm thời: chuyển sang màn chi tiết đặt lịch để chỉnh sửa,
                                            // truyền kèm bookingCode để hiển thị trên form.
                                            navigate("/dat-lich/chi-tiet", {
                                                state: {
                                                    bookingCodeForEdit: booking.bookingCode,
                                                },
                                            });
                                        }}
                                        className="inline-flex items-center justify-center rounded-[12px] bg-[#ffbaa0] text-[#181818] font-[600] text-[1.4rem] px-[20px] py-[10px] hover:bg-[#e6a890] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Chỉnh sửa đơn đặt lịch
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <FooterSub />
        </div>
    );
};

