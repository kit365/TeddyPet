import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { FooterSub } from "../../components/layouts/FooterSub";
import type {
    ClientBookingDetailResponse,
    ClientBookingPetDetail,
    ClientBookingPetServiceDetail,
    ClientPetFoodBroughtDetail,
    ClientBookingPetServiceItemDetail,
    BookingStatus,
} from "../../../types/booking.type";
import { apiApp } from "../../../api";
import { confirmBookingDeposit } from "../../../api/booking-deposit.api";
import { CancelBookingModal } from "./components/CancelBookingModal";

/* ─── helpers ─── */
const formatCurrency = (v?: number | null) =>
    v != null
        ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v)
        : "—";

const fmtDate = (v?: string | null) => (v ? dayjs(v).format("DD/MM/YYYY") : "—");
const fmtDateTime = (v?: string | null) => (v ? dayjs(v).format("D/M/YYYY - h:mmA") : "—");

const getBookingStatusLabel = (status: BookingStatus | string) => {
    switch (status) {
        case "PENDING": return "Đang chờ xử lý";
        case "CONFIRMED": return "Đã xác nhận";
        case "IN_PROGRESS": return "Đang thực hiện";
        case "COMPLETED": return "Hoàn tất";
        case "CANCELLED": return "Đã hủy";
        default: return status || "—";
    }
};

const getBookingStatusBadgeClass = (status: BookingStatus | string) => {
    switch (status) {
        case "COMPLETED": return "bg-[#d1fae5] text-[#065f46]";
        case "CANCELLED": return "bg-[#fee2e2] text-[#991b1b]";
        case "CONFIRMED": return "bg-[#e0e7ff] text-[#3730a3]";
        case "IN_PROGRESS": return "bg-[#dbeafe] text-[#1e40af]";
        case "PENDING": return "bg-[#fef3c7] text-[#92400e]";
        default: return "bg-[#f3f4f6] text-[#374151]";
    }
};

const petTypeLabel = (t?: string) => {
    if (!t) return "—";
    switch (t.toLowerCase()) {
        case "dog": return "Chó";
        case "cat": return "Mèo";
        default: return t;
    }
};

const svcStatusLabel = (s?: string) => {
    if (!s) return "—";
    switch (s) {
        case "PENDING": return "Chờ xử lý";
        case "IN_PROGRESS": return "Đang thực hiện";
        case "COMPLETED": return "Hoàn tất";
        case "CANCELLED": return "Đã hủy";
        default: return s;
    }
};

/* ─── Sub-component: Section Header ─── */
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-2 mb-4">
        <h3 className="text-[1.6rem] font-[700] text-[#111827] tracking-tight">{children}</h3>
    </div>
);

const InfoRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
    <div className="flex gap-2 py-[3px]">
        <span className="font-[600] text-[#374151] shrink-0 min-w-[140px]">{label}:</span>
        <span className="text-[#111827]">{value ?? "—"}</span>
    </div>
);

type PaymentMethod = "BANK_TRANSFER" | "MOMO" | "ZALOPAY" | "VNPAY";
type ActiveView = "detail" | "payment";

/* ─── Main component ─── */
export const BookingClientDetailPage = () => {
    const { bookingCode } = useParams<{ bookingCode: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const [booking, setBooking] = useState<ClientBookingDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);

    // Automatically open payment view if redirected from booking creation
    const stateOpenPayment = location.state && (location.state as any).openPayment === true;
    const [activeView, setActiveView] = useState<ActiveView>(stateOpenPayment ? "payment" : "detail");

    // Payment state
    const [isConfirming, setIsConfirming] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BANK_TRANSFER");

    // Cancel modal state
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    // Countdown timer
    const expiresAt = booking?.depositExpiresAt ? dayjs(booking.depositExpiresAt) : null;
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

    const fetchData = async () => {
        if (!bookingCode) return;
        try {
            const res = await apiApp.get<{ data: ClientBookingDetailResponse }>(`/api/bookings/code/${bookingCode}`);
            setBooking(res.data.data);
        } catch (error: any) {
            console.error("Error fetching booking details:", error);
            if (error.response?.status === 404) {
                toast.error("Không tìm thấy đơn đặt lịch.");
            } else if (error.response?.status === 401 || error.response?.status === 403) {
                // For public booking APIs, 401/403 might mean the booking exists but requires different access
                // Don't redirect to login, just show a generic error
                toast.error("Không thể truy cập thông tin đơn đặt lịch.");
            } else {
                toast.error("Đã xảy ra lỗi khi tải thông tin đơn đặt lịch.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingCode]);

    // Initialize + tick countdown whenever booking data changes
    useEffect(() => {
        if (!expiresAt) {
            setRemainingSeconds(null);
            return;
        }
        setRemainingSeconds(Math.max(0, expiresAt.diff(dayjs(), "second")));
        const timer = setInterval(() => {
            const next = Math.max(0, expiresAt.diff(dayjs(), "second"));
            setRemainingSeconds(next);
        }, 1000);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [booking?.depositExpiresAt]);

    const isExpired = useMemo(() => remainingSeconds !== null && remainingSeconds <= 0, [remainingSeconds]);
    const formattedRemaining = useMemo(() => {
        if (remainingSeconds == null) return "—";
        const m = Math.floor(remainingSeconds / 60);
        const s = remainingSeconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    }, [remainingSeconds]);

    const showDepositTimer = booking && !booking.depositPaid && booking.depositId && booking.depositExpiresAt;
    const transferContent = useMemo(
        () => `TP-DEP-${booking?.depositId ?? "XXXX"}`,
        [booking?.depositId]
    );

    const canEditServices =
        booking &&
        booking.status !== "CANCELLED" &&
        !booking.depositPaid &&
        (booking.paymentStatus === "PENDING" || booking.paymentStatus === "PARTIAL");

    const canEditContactOnly =
        booking &&
        booking.depositPaid &&
        (booking.status === "PENDING" || booking.status === "IN_PROGRESS");

    const canEdit = Boolean(canEditServices || canEditContactOnly);

    const handleCopyContent = () => {
        try {
            if (navigator && (navigator as any).clipboard && (navigator as any).clipboard.writeText) {
                (navigator as any).clipboard
                    .writeText(transferContent)
                    .then(() => toast.success("Đã copy nội dung chuyển khoản"))
                    .catch(() => undefined);
            } else {
                toast.error("Trình duyệt không hỗ trợ copy tự động.");
            }
        } catch {
            toast.error("Không thể copy nội dung. Vui lòng copy thủ công.");
        }
    };

    const handleConfirmPayment = async () => {
        if (!booking?.depositId || isExpired) {
            toast.error("Giữ chỗ đã hết hạn. Vui lòng quay lại đặt lịch và chọn lại phòng/khung giờ.");
            return;
        }
        setIsConfirming(true);
        try {
            const res = await confirmBookingDeposit(booking.depositId, paymentMethod);
            if (res?.success && res?.data?.bookingCode) {
                toast.success("Thanh toán (giả lập) thành công. Đơn hàng của bạn đã được cập nhật.");
                setActiveView("detail"); // Stay on page, switch back to detail view
                await fetchData();       // Refetch data to show PAID status and clear timer
            } else {
                toast.error(res?.message ?? "Không thể xác nhận thanh toán cọc.");
            }
        } catch (err: unknown) {
            const message = (err as { message?: string })?.message ?? "Không thể xác nhận thanh toán cọc.";
            toast.error(message);
        } finally {
            setIsConfirming(false);
        }
    };

    /* ─── Render helpers for deep data ─── */
    const renderServiceItems = (items?: ClientBookingPetServiceItemDetail[]) => {
        if (!items || items.length === 0) return null;
        return (
            <div className="mt-2">
                <div className="text-[1.25rem] font-[600] text-[#6366f1] mb-1">Dịch vụ add-on:</div>
                <div className="space-y-1">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 text-[1.25rem] text-[#374151] bg-[#f5f3ff] px-3 py-1 rounded-[8px]">
                            <span className="font-[500]">{item.itemName ?? "—"}</span>
                            <span className="text-[#6b7280]">x{item.quantity ?? 1}</span>
                            <span className="ml-auto font-[600]">{formatCurrency(item.subtotal)}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderService = (svc: ClientBookingPetServiceDetail, idx: number) => {
        const hasRoom = svc.roomName || svc.displayTypeName || svc.roomNumber;
        return (
            <div key={svc.id} className="rounded-[12px] border border-[#e5e7eb] bg-white px-4 py-3 shadow-sm mb-3">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[1.35rem] font-[700] text-[#4338ca]">
                        {`Dịch vụ ${idx + 1}: `}
                        <span className="text-[#111827]">{svc.serviceName ?? "—"}</span>
                    </span>
                    <span className={`text-[1.15rem] font-[600] px-2 py-0.5 rounded-[4px] ${svc.status === "COMPLETED" ? "bg-[#d1fae5] text-[#065f46]" : svc.status === "CANCELLED" ? "bg-[#fee2e2] text-[#991b1b]" : "bg-[#fef3c7] text-[#92400e]"}`}>
                        {svcStatusLabel(svc.status)}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-[1.3rem]">
                    {svc.estimatedCheckInDate && (
                        <InfoRow label="Ngày nhận" value={fmtDate(svc.estimatedCheckInDate)} />
                    )}
                    {svc.estimatedCheckOutDate && (
                        <InfoRow label="Ngày trả" value={fmtDate(svc.estimatedCheckOutDate)} />
                    )}
                    {svc.numberOfNights != null && svc.numberOfNights > 0 && (
                        <InfoRow label="Số đêm" value={svc.numberOfNights} />
                    )}
                    {svc.scheduledStartTime && (
                        <InfoRow label="Giờ bắt đầu" value={fmtDateTime(svc.scheduledStartTime)} />
                    )}
                    {svc.scheduledEndTime && (
                        <InfoRow label="Giờ kết thúc" value={fmtDateTime(svc.scheduledEndTime)} />
                    )}
                    {svc.timeSlotName && (
                        <InfoRow label="Khung giờ" value={svc.timeSlotName} />
                    )}
                    <InfoRow label="Đơn giá" value={formatCurrency(svc.basePrice)} />
                    <InfoRow label="Thành tiền" value={<span className="font-[700] text-[#c45a3a]">{formatCurrency(svc.subtotal)}</span>} />
                </div>

                {hasRoom && (
                    <div className="mt-2 p-2.5 rounded-[8px] bg-[#f0fdf4] border border-[#bbf7d0]">
                        <div className="flex items-center justify-between mb-1">
                            <div className="text-[1.2rem] font-[600] text-[#166534]">Căn phòng đã xếp</div>
                            {svc.roomId && (
                                <button
                                    type="button"
                                    onClick={() => navigate(`/dat-lich/phong/${svc.roomId}`)}
                                    className="text-[1.2rem] font-[600] text-[#166534] underline hover:text-[#14532d]"
                                >
                                    Xem chi tiết phòng
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 text-[1.25rem] text-[#166534]">
                            {svc.roomName && <div><span className="font-[500]">Tên: </span>{svc.roomName}</div>}
                            {svc.roomNumber && <div><span className="font-[500]">Số phòng: </span>{svc.roomNumber}</div>}
                            {svc.displayTypeName && <div><span className="font-[500]">Loại: </span>{svc.displayTypeName}</div>}
                        </div>
                    </div>
                )}

                {renderServiceItems(svc.items)}
            </div>
        );
    };

    const renderFoodItems = (foods?: ClientPetFoodBroughtDetail[]) => {
        if (!foods || foods.length === 0) return null;
        return (
            <div className="mt-3">
                <div className="text-[1.3rem] font-[600] text-[#92400e] mb-2">Thức ăn mang theo:</div>
                <div className="space-y-1.5">
                    {foods.map((food) => (
                        <div key={food.id} className="flex flex-wrap gap-x-4 gap-y-1 text-[1.25rem] text-[#78350f] bg-[#fffbeb] px-3 py-2 rounded-[8px] border border-[#fde68a]">
                            {food.foodBroughtType && <span><span className="font-[500]">Loại:</span> {food.foodBroughtType}</span>}
                            {food.foodBrand && <span><span className="font-[500]">Nhãn hiệu:</span> {food.foodBrand}</span>}
                            {food.quantity != null && <span><span className="font-[500]">Số lượng:</span> {food.quantity}</span>}
                            {food.feedingInstructions && <span><span className="font-[500]">Hướng dẫn:</span> {food.feedingInstructions}</span>}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderPet = (pet: ClientBookingPetDetail, idx: number) => (
        <div key={pet.id} className="rounded-[8px] border border-[#f3e0d6] bg-white overflow-hidden shadow-sm mb-4">
            {/* Pet header */}
            <div className="px-5 py-3 bg-[#fff5f0] border-b border-[#f3e0d6]">
                <h4 className="text-[1.45rem] font-[700] text-[#111827]">
                    Thú cưng {idx + 1}: <span className="text-[#c45a3a]">{pet.petName ?? "—"}</span>
                    <span className="ml-2 text-[1.2rem] font-[500] text-[#6b7280]">({petTypeLabel(pet.petType)})</span>
                </h4>
            </div>

            <div className="p-4 space-y-3">
                {/* Pet info row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-[1.3rem]">
                    <InfoRow label="Liên hệ khẩn cấp" value={pet.emergencyContactName} />
                    <InfoRow label="SĐT khẩn cấp" value={pet.emergencyContactPhone} />
                    {pet.weightAtBooking != null && (
                        <InfoRow label="Cân nặng" value={`${pet.weightAtBooking} kg`} />
                    )}
                    {pet.petConditionNotes && (
                        <InfoRow label="Tình trạng/ghi chú" value={pet.petConditionNotes} />
                    )}
                    {pet.arrivalCondition && (
                        <InfoRow label="Tình trạng khi đến" value={pet.arrivalCondition} />
                    )}
                    {pet.departureCondition && (
                        <InfoRow label="Tình trạng khi về" value={pet.departureCondition} />
                    )}
                </div>

                {/* Food items */}
                {pet.foodBrought && renderFoodItems(pet.foodItems)}

                {/* Services */}
                {pet.services && pet.services.length > 0 && (
                    <div className="mt-4">
                        <div className="text-[1.3rem] font-[600] text-[#4338ca] mb-2">Dịch vụ đã đăng ký:</div>
                        {pet.services.map((svc, sIdx) => renderService(svc, sIdx))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div>
            <div className="app-container py-[60px]">
                <div className="max-w-[960px] mx-auto bg-white rounded-[12px] border border-[#f1f1f1] shadow-[0_4px_20px_rgba(15,23,42,0.05)] overflow-hidden">
                    {/* Header */}
                    <div className="px-[28px] py-[22px] bg-[#fff5f0] border-b border-[#f3e0d6] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="uppercase tracking-[0.05em] text-[1.2rem] font-[700] text-[#c45a3a]">
                                {activeView === "detail" ? "Chi tiết đơn đặt lịch" : "Thanh toán cọc"}
                            </p>
                            {booking && (
                                <h2 className="mt-1 text-[2.2rem] font-[800] text-[#181818]">
                                    Mã đặt lịch:{" "}
                                    <span className="text-[#c45a3a]">
                                        {booking.bookingCode}
                                    </span>
                                </h2>
                            )}
                            {booking && (
                                <p className="mt-1 text-[1.35rem] text-[#5f6368] flex items-center">
                                    Trạng thái:{" "}
                                    <span className={`inline-flex items-center px-[8px] py-[4px] rounded-[6px] text-[1.3rem] font-[700] ml-2 ${getBookingStatusBadgeClass(booking.status)}`}>
                                        {getBookingStatusLabel(booking.status)}
                                    </span>
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Countdown timer */}
                            {showDepositTimer && (
                                <div className={`flex flex-col items-center justify-center px-4 py-2 rounded-[8px] bg-white border ${isExpired ? "border-[#ef4444]" : "border-[#ffe0ce]"}`}>
                                    <div className="text-[1.1rem] font-[600] text-[#181818]">Giờ còn lại</div>
                                    <div className={`text-[1.6rem] font-[800] ${isExpired ? "text-[#ef4444]" : "text-[#c45a3a]"}`}>
                                        {isExpired ? "Hết hạn" : formattedRemaining}
                                    </div>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => navigate("/dat-lich")}
                                className="inline-flex items-center justify-center rounded-[999px] border border-[#f1bca1] bg-white text-[#c45a3a] text-[1.35rem] font-[600] px-[16px] py-[8px] hover:bg-[#ffefe7] transition-colors"
                            >
                                Quay về đặt lịch mới
                            </button>
                        </div>
                    </div>

                    <div className="p-[24px] md:p-[28px] space-y-[20px] text-[1.5rem] bg-[#fffcfb]">
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

                        {/* =================== DETAIL VIEW =================== */}
                        {booking && activeView === "detail" && (
                            <>
                                {/* ── Section 1: Booking Info ── */}
                                <SectionTitle>Thông tin đơn đặt lịch</SectionTitle>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                                    {/* Customer info */}
                                    <div className="rounded-[8px] border border-[#f3e0d6] bg-white px-5 py-4">
                                        <p className="text-[1.5rem] font-[700] text-[#111827] mb-3">
                                            Thông tin khách hàng
                                        </p>
                                        <div className="space-y-1.5 text-[1.4rem] text-[#374151]">
                                            <InfoRow label="Mã đặt lịch" value={<span className="font-[700] text-[#c45a3a]">{booking.bookingCode}</span>} />
                                            <InfoRow label="Họ tên" value={booking.customerName} />
                                            <InfoRow label="Email" value={booking.customerEmail} />
                                            <InfoRow label="Số điện thoại" value={booking.customerPhone} />
                                        </div>
                                    </div>

                                    {/* Status & payment */}
                                    <div className="rounded-[8px] border border-[#e5f2ec] bg-[#f8fffb] px-5 py-4">
                                        <p className="text-[1.5rem] font-[700] text-[#065f46] mb-3">
                                            Trạng thái & thanh toán
                                        </p>
                                        <div className="space-y-1.5 text-[1.4rem] text-[#064e3b]">
                                            <InfoRow label="Trạng thái đặt lịch" value={<span className={`inline-flex items-center px-[8px] py-[3px] rounded-[6px] text-[1.25rem] font-[700] ${getBookingStatusBadgeClass(booking.status)}`}>{getBookingStatusLabel(booking.status)}</span>} />
                                            <InfoRow label="Thanh toán" value={booking.depositPaid ? <span className="font-[600] text-[#059669]">Đã thanh toán cọc</span> : <span className="font-[600] text-[#d97706]">Chưa thanh toán cọc</span>} />
                                            {booking.paymentMethod && <InfoRow label="PT thanh toán" value={booking.paymentMethod} />}
                                            <div className="pt-2 space-y-0.5 border-t border-[#d1fae5] mt-2">
                                                <InfoRow label="Tổng tiền" value={<span className="font-[700]">{formatCurrency(booking.totalAmount)}</span>} />
                                                <InfoRow label="Đã thanh toán" value={formatCurrency(booking.paidAmount)} />
                                                <InfoRow label="Còn lại" value={<span className="font-[700] text-[#c45a3a]">{formatCurrency(booking.remainingAmount)}</span>} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Booking dates */}
                                <div className="rounded-[8px] bg-[#f1f5f9] px-5 py-3 text-[1.35rem] mb-6">
                                    <div className="flex flex-wrap gap-x-8 gap-y-1 text-[#334155]">
                                        <InfoRow label="Thời gian đặt lịch" value={fmtDateTime(booking.createdAt)} />
                                    </div>
                                </div>

                                {/* Bank Info (if deposit not paid and not cancelled) */}
                                {!booking.depositPaid && booking.depositId && booking.status !== "CANCELLED" && (
                                    <div className="rounded-[8px] bg-white border border-[#f3e0d6] px-5 py-4 mb-6 shadow-sm">
                                        <p className="text-[1.5rem] font-[700] text-[#c45a3a] mb-3">Thông tin chuyển khoản ngân hàng (Cọc)</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <ul className="space-y-1.5 text-[1.35rem] text-[#374151]">
                                                <li>
                                                    <span className="font-[600] inline-block w-[100px]">Ngân hàng:</span> Vietcombank – Chi nhánh Q.7
                                                </li>
                                                <li>
                                                    <span className="font-[600] inline-block w-[100px]">Số TK:</span> 0123 456 789
                                                </li>
                                                <li>
                                                    <span className="font-[600] inline-block w-[100px]">Chủ TK:</span> CÔNG TY TNHH TEDDYPET
                                                </li>
                                            </ul>
                                            <div className="md:border-l md:border-[#f1f1f1] md:pl-5">
                                                <div className="font-[600] text-[1.35rem] text-[#111827] mb-2">Nội dung chuyển khoản (quan trọng)</div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        readOnly
                                                        value={transferContent}
                                                        className="flex-1 rounded-[6px] border border-[#d1d5db] bg-[#f9fafb] px-3 py-2 text-[1.4rem] font-[700] text-[#111827] outline-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleCopyContent}
                                                        className="px-4 py-2 rounded-[6px] border border-[#ffbaa0] bg-[#fff5f0] text-[#c45a3a] text-[1.35rem] hover:bg-[#ffece4] font-[600] transition-colors"
                                                    >
                                                        Copy
                                                    </button>
                                                </div>
                                                <p className="text-[#6b7280] text-[1.2rem] mt-2 italic">
                                                    * Vui lòng nhập đúng nội dung chuyển khoản để hệ thống xác nhận tự động.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── Section 2: Pets ── */}
                                {booking.pets && booking.pets.length > 0 && (
                                    <>
                                        <SectionTitle>Thú cưng ({booking.pets.length})</SectionTitle>
                                        <div className="space-y-4">
                                            {booking.pets.map((pet, idx) => renderPet(pet, idx))}
                                        </div>
                                    </>
                                )}

                                {/* Action bar */}
                                <div className="pt-4 mt-6 border-t border-[#f1f1f1] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        {booking && booking.status === "PENDING" && booking.paymentStatus === "PENDING" && !booking.depositPaid && booking.depositId && !isExpired && (
                                            <button
                                                type="button"
                                                onClick={() => setActiveView("payment")}
                                                className="inline-flex items-center justify-center rounded-[8px] bg-[#4CAF50] text-[#fff] font-[600] text-[1.4rem] px-[20px] py-[10px] hover:bg-[#45a049] transition-colors"
                                            >
                                                Thanh toán cọc ngay
                                            </button>
                                        )}
                                        {booking && booking.status !== "CANCELLED" && (!showDepositTimer || !isExpired) && (
                                            <button
                                                type="button"
                                                disabled={!canEdit}
                                                onClick={() => {
                                                    if (!booking) return;
                                                    const expiresParam = booking.depositExpiresAt
                                                        ? `?expiresAt=${encodeURIComponent(booking.depositExpiresAt)}`
                                                        : "";
                                                    navigate(
                                                        `/dat-lich/chi-tiet-don/${booking.bookingCode}/chinh-sua${expiresParam}`
                                                    );
                                                }}
                                                className="inline-flex items-center justify-center rounded-[8px] bg-[#ffbaa0] text-[#181818] font-[600] text-[1.4rem] px-[20px] py-[10px] hover:bg-[#e6a890] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Chỉnh sửa thông tin
                                            </button>
                                        )}
                                        {booking && booking.status === "PENDING" && (
                                            <button
                                                type="button"
                                                onClick={() => setIsCancelModalOpen(true)}
                                                className="inline-flex items-center justify-center rounded-[8px] bg-white border border-[#ef4444] text-[#ef4444] font-[600] text-[1.4rem] px-[20px] py-[10px] hover:bg-[#fef2f2] transition-colors"
                                            >
                                                Hủy đơn đặt lịch
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* =================== PAYMENT VIEW (INLINE) =================== */}
                        {booking && activeView === "payment" && (
                            <>
                                <div className="flex flex-wrap gap-2 items-center justify-between bg-white border border-[#f3e0d6] rounded-[8px] px-4 py-3 mb-4">
                                    <div>
                                        <div className="text-[#181818] font-[700]">Mã giữ chỗ (Deposit)</div>
                                        <div className="text-[#505050] text-[1.4rem]">{booking.depositId ?? "—"}</div>
                                    </div>
                                </div>

                                <p className="text-[#505050] text-[1.4rem] mb-6">
                                    Nếu quá thời gian quy định chưa thanh toán, hệ thống sẽ tự động hủy đơn giữ chỗ. Bạn sẽ phải thực hiện lại quy trình đặt lịch.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col items-center justify-center rounded-[8px] px-4 py-6 bg-white border border-[#f1f1f1]">
                                        <div className="mb-4 text-[1.45rem] font-[600] text-[#111827]">
                                            Quét mã QR để thanh toán
                                        </div>
                                        <div className="w-[200px] h-[200px] rounded-[12px] bg-[#f9fafb] flex items-center justify-center border border-[#e5e7eb] mb-4">
                                            <div className="text-[1.2rem] text-[#9ca3af] text-center px-4">
                                                (QR Code)
                                            </div>
                                        </div>
                                        <div className="text-[1.3rem] text-[#6b7280] text-center w-[80%]">
                                            Vui lòng đảm bảo số tiền và nội dung thanh toán.
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="text-[1.45rem] font-[700] text-[#111827] mb-2">
                                            Hình thức thanh toán
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {(["BANK_TRANSFER", "MOMO", "ZALOPAY", "VNPAY"] as PaymentMethod[]).map((id) => {
                                                const labelMap: Record<PaymentMethod, string> = {
                                                    BANK_TRANSFER: "Chuyển khoản",
                                                    MOMO: "Ví MoMo",
                                                    ZALOPAY: "ZaloPay",
                                                    VNPAY: "VNPAY",
                                                };
                                                const label = labelMap[id];
                                                const selected = paymentMethod === id;
                                                return (
                                                    <button
                                                        key={id}
                                                        type="button"
                                                        onClick={() => setPaymentMethod(id)}
                                                        className={
                                                            "px-4 py-2 rounded-[8px] border text-[1.3rem] font-[600] transition-colors " +
                                                            (selected
                                                                ? "border-[#ffbaa0] bg-[#fff5f0] text-[#c45a3a]"
                                                                : "border-[#e5e7eb] bg-white text-[#4b5563] hover:bg-[#f9fafb]")
                                                        }
                                                    >
                                                        {label}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {paymentMethod === "BANK_TRANSFER" && (
                                            <div className="mt-2 space-y-3 text-[1.35rem] text-[#111827] bg-white border border-[#f1f1f1] p-4 rounded-[8px]">
                                                <div className="font-[600] mb-2">Tài khoản ngân hàng</div>
                                                <ul className="space-y-1.5 text-[1.3rem] text-[#374151]">
                                                    <li>
                                                        <span className="font-[500] inline-block w-[100px]">Ngân hàng:</span> Vietcombank – Chi nhánh Q.7
                                                    </li>
                                                    <li>
                                                        <span className="font-[500] inline-block w-[100px]">Số TK:</span> 0123 456 789
                                                    </li>
                                                    <li>
                                                        <span className="font-[500] inline-block w-[100px]">Chủ TK:</span> CÔNG TY TNHH TEDDYPET
                                                    </li>
                                                </ul>
                                                <div className="mt-4 pt-4 border-t border-[#f1f1f1]">
                                                    <div className="font-[600] mb-2">Nội dung chuyển khoản (quan trọng)</div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            readOnly
                                                            value={transferContent}
                                                            className="flex-1 rounded-[6px] border border-[#d1d5db] bg-[#f9fafb] px-3 py-2 text-[1.35rem] font-[700] text-[#111827] outline-none"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={handleCopyContent}
                                                            className="px-3 py-2 rounded-[6px] border border-[#e5e7eb] bg-white text-[1.3rem] hover:bg-[#f3f4f6] font-[500]"
                                                        >
                                                            Copy
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {paymentMethod !== "BANK_TRANSFER" && (
                                            <div className="mt-2 text-[1.35rem] text-[#374151] bg-white border border-[#f1f1f1] p-4 rounded-[8px]">
                                                Quét mã QR qua ứng dụng {paymentMethod} để tiến hành thanh toán giữ chỗ.
                                            </div>
                                        )}

                                        <div className="flex gap-3 pt-4 mt-2 border-t border-[#f1f1f1]">
                                            <button
                                                type="button"
                                                onClick={() => setActiveView("detail")}
                                                className="py-[10px] px-[20px] rounded-[8px] border border-[#ddd] bg-white text-[#181818] font-[600] text-[1.4rem] hover:bg-[#f5f5f5] transition-colors"
                                            >
                                                Quay lại chi tiết
                                            </button>
                                            {booking.status === "PENDING" && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCancelModalOpen(true)}
                                                    className="inline-flex items-center justify-center rounded-[8px] bg-white border border-[#ef4444] text-[#ef4444] font-[600] text-[1.4rem] px-[20px] py-[10px] hover:bg-[#fef2f2] transition-colors"
                                                >
                                                    Hủy đơn đặt lịch
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                disabled={!booking.depositId || isConfirming || isExpired}
                                                onClick={handleConfirmPayment}
                                                className="py-[10px] px-[20px] rounded-[8px] bg-[#4CAF50] text-[#fff] font-[600] text-[1.4rem] hover:bg-[#45a049] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                                title="Mô phỏng thanh toán thành công"
                                            >
                                                {isExpired
                                                    ? "Giữ chỗ đã hết hạn"
                                                    : isConfirming
                                                        ? "Đang xử lý..."
                                                        : "Xác nhận đã thanh toán"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            
            {booking && (
                <CancelBookingModal
                    booking={booking}
                    open={isCancelModalOpen}
                    onClose={() => setIsCancelModalOpen(false)}
                    onSuccess={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        fetchData();
                    }}
                />
            )}
            <FooterSub />
        </div>
    );
};
