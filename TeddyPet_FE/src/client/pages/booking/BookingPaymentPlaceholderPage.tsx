import { useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FooterSub } from "../../components/layouts/FooterSub";
import { confirmBookingDeposit } from "../../../api/booking-deposit.api";

type BookingDetailDraft = {
    // Ở đây chỉ cần giữ nguyên dữ liệu để truyền ngược lại,
    // BookingDetailPage sẽ đọc và xử lý chi tiết.
    step1Data?: Record<string, unknown>;
    pets?: unknown[];
};

type LocationState = {
    depositId?: number;
    expiresAt?: string;
    bookingId?: number;
    bookingCode?: string;
    step1Data?: Record<string, unknown>;
    bookingDraft?: BookingDetailDraft;
};

type PaymentMethod = "BANK_TRANSFER" | "MOMO" | "ZALOPAY" | "VNPAY";

export const BookingPaymentPlaceholderPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = (location.state ?? {}) as LocationState;

    const [isConfirming, setIsConfirming] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BANK_TRANSFER");

    const expiresAt = state.expiresAt ? dayjs(state.expiresAt) : null;
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(
        expiresAt ? Math.max(0, expiresAt.diff(dayjs(), "second")) : null
    );

    useEffect(() => {
        if (!expiresAt) return;
        setRemainingSeconds(Math.max(0, expiresAt.diff(dayjs(), "second")));
        const timer = setInterval(() => {
            const next = Math.max(0, expiresAt.diff(dayjs(), "second"));
            setRemainingSeconds(next);
        }, 1000);
        return () => clearInterval(timer);
    }, [expiresAt]);

    const isExpired = useMemo(() => remainingSeconds !== null && remainingSeconds <= 0, [remainingSeconds]);
    const transferContent = useMemo(
        () => `TP-DEP-${state.depositId ?? "XXXX"}`,
        [state.depositId]
    );

    const formattedRemaining = useMemo(() => {
        if (remainingSeconds == null) return "—";
        const m = Math.floor(remainingSeconds / 60);
        const s = remainingSeconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    }, [remainingSeconds]);

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
        if (!state.depositId || isExpired) {
            toast.error("Giữ chỗ đã hết hạn. Vui lòng quay lại đặt lịch và chọn lại phòng/khung giờ.");
            return;
        }
        setIsConfirming(true);
        try {
            const res = await confirmBookingDeposit(state.depositId);
            if (res?.success && res?.data?.bookingCode) {
                toast.success("Thanh toán (giả lập) thành công. Mã booking: " + res.data.bookingCode);
                navigate("/dat-lich", { state: { bookingCode: res.data.bookingCode } });
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

    return (
        <div>
            <div className="app-container py-[60px]">
                <div className="max-w-[960px] mx-auto bg-white rounded-[16px] border border-[#eee] shadow-[0_2px_16px_rgba(0,0,0,0.06)] overflow-hidden">
                    <div className="px-[24px] py-[18px] bg-gradient-to-r from-[#ffbaa0]/12 to-[#e67e2010] border-b border-[#eee]">
                        <h2 className="text-[2.2rem] font-[800] text-[#181818]">Thanh toán cọc (tạm thời)</h2>
                        <p className="text-[1.5rem] text-[#505050] mt-2">
                            Chức năng thanh toán sẽ được tích hợp sau. Hiện tại hệ thống chỉ tạo “giữ chỗ 5 phút”.
                        </p>
                    </div>

                    <div className="p-[24px] space-y-[18px] text-[1.5rem]">
                        <div className="flex flex-wrap gap-2 items-center justify-between bg-[#fff7f3] border border-[#ffe0ce] rounded-[12px] px-4 py-3">
                            <div>
                                <div className="text-[#181818] font-[700]">Mã giữ chỗ (Deposit)</div>
                                <div className="text-[#505050]">{state.depositId ?? "—"}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[#181818] font-[700]">Thời gian giữ chỗ còn lại</div>
                                <div className={`font-[700] ${isExpired ? "text-[#ef4444]" : "text-[#c45a3a]"}`}>
                                    {formattedRemaining}
                                </div>
                            </div>
                        </div>

                        <p className="text-[#505050]">
                            Nếu quá 5 phút chưa thanh toán, hệ thống sẽ tự động nhả giữ chỗ (trả lại phòng/khung giờ cho khách khác).
                            Bạn có thể quay lại màn hình đặt lịch để chọn lại.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div className="flex flex-col items-center justify-center border border-dashed border-[#e5e7eb] rounded-[14px] px-4 py-5 bg-[#f9fafb]">
                                <div className="mb-3 text-[1.4rem] font-[600] text-[#111827]">
                                    Quét mã QR để thanh toán
                                </div>
                                <div className="w-[220px] h-[220px] rounded-[12px] bg-[#ffedd5] flex items-center justify-center border border-[#fed7aa] shadow-inner mb-3">
                                    <div className="w-[180px] h-[180px] rounded-[8px] flex items-center justify-center text-[1.1rem] text-[#6b7280] text-center px-4 bg-[#f9fafb] border border-dashed border-[#d1d5db]">
                                        QR mẫu (sau này sẽ thay bằng QR thật của cổng thanh toán)
                                    </div>
                                </div>
                                <div className="text-[1.3rem] text-[#6b7280] text-center">
                                    Vui lòng đảm bảo số tiền và nội dung thanh toán khớp với hướng dẫn bên phải.
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="text-[1.4rem] font-[700] text-[#111827] mb-1">
                                    Chọn hình thức thanh toán
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {["BANK_TRANSFER", "MOMO", "ZALOPAY", "VNPAY"].map((id) => {
                                        const labelMap: Record<PaymentMethod, string> = {
                                            BANK_TRANSFER: "Chuyển khoản ngân hàng",
                                            MOMO: "Ví MoMo",
                                            ZALOPAY: "ZaloPay",
                                            VNPAY: "VNPAY",
                                        };
                                        const label = labelMap[id as PaymentMethod];
                                        const selected = paymentMethod === id;
                                        return (
                                            <button
                                                key={id}
                                                type="button"
                                                onClick={() => setPaymentMethod(id as PaymentMethod)}
                                                className={
                                                    "px-4 py-2 rounded-[999px] border text-[1.3rem] font-[600] transition-colors " +
                                                    (selected
                                                        ? "border-[#ff8a4a] bg-[#ffedd5] text-[#c45a3a]"
                                                        : "border-[#e5e7eb] bg-white text-[#4b5563] hover:bg-[#f9fafb]")
                                                }
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {paymentMethod === "BANK_TRANSFER" && (
                                    <div className="mt-2 space-y-3 text-[1.35rem] text-[#111827]">
                                        <div className="font-[600]">Thông tin tài khoản ngân hàng</div>
                                        <ul className="space-y-1 text-[1.3rem] text-[#374151]">
                                            <li>
                                                <span className="font-[500]">Ngân hàng:</span> Vietcombank – Chi nhánh Q.7
                                            </li>
                                            <li>
                                                <span className="font-[500]">Số tài khoản:</span> 0123 456 789
                                            </li>
                                            <li>
                                                <span className="font-[500]">Chủ tài khoản:</span> CÔNG TY TNHH TEDDYPET
                                            </li>
                                        </ul>
                                        <div className="mt-2">
                                            <div className="font-[600] mb-1">Nội dung chuyển khoản (quan trọng)</div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    readOnly
                                                    value={transferContent}
                                                    className="flex-1 rounded-[10px] border border-[#d1d5db] bg-[#f9fafb] px-3 py-2 text-[1.35rem] font-[600] text-[#111827]"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleCopyContent}
                                                    className="px-3 py-2 rounded-[10px] border border-[#e5e7eb] bg-white text-[1.3rem] hover:bg-[#f3f4f6]"
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                            <p className="mt-1 text-[1.25rem] text-[#6b7280]">
                                                Vui lòng giữ nguyên nội dung này để hệ thống đối chiếu chính xác giao dịch.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === "MOMO" && (
                                    <div className="mt-2 text-[1.35rem] text-[#374151] space-y-1">
                                        <p>
                                            Mở ứng dụng <span className="font-[600]">MoMo</span>, chọn{" "}
                                            <span className="font-[600]">Quét mã</span> và quét QR bên trái.
                                        </p>
                                        <p>Kiểm tra số tiền và xác nhận thanh toán.</p>
                                    </div>
                                )}

                                {paymentMethod === "ZALOPAY" && (
                                    <div className="mt-2 text-[1.35rem] text-[#374151] space-y-1">
                                        <p>
                                            Mở ứng dụng <span className="font-[600]">ZaloPay</span>, chọn{" "}
                                            <span className="font-[600]">Thanh toán QR</span> và quét mã bên trái.
                                        </p>
                                        <p>Hoàn tất thanh toán theo hướng dẫn trên ứng dụng.</p>
                                    </div>
                                )}

                                {paymentMethod === "VNPAY" && (
                                    <div className="mt-2 text-[1.35rem] text-[#374151] space-y-1">
                                        <p>
                                            Sử dụng ứng dụng ngân hàng hỗ trợ <span className="font-[600]">VNPAY-QR</span>{" "}
                                            để quét mã bên trái.
                                        </p>
                                        <p>Kiểm tra lại nội dung & số tiền trước khi xác nhận.</p>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (state.bookingCode) {
                                                navigate(`/dat-lich/chi-tiet-don/${state.bookingCode}`);
                                            } else {
                                                navigate("/dat-lich/chi-tiet", {
                                                    state: {
                                                        ...(state.step1Data ?? {}),
                                                        bookingDraft: state.bookingDraft,
                                                    },
                                                });
                                            }
                                        }}
                                        className="py-[12px] px-[20px] rounded-[12px] border border-[#ddd] bg-white text-[#181818] font-[600] hover:bg-[#f5f5f5] transition-colors"
                                    >
                                        Quay lại chỉnh dịch vụ
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!state.depositId || isConfirming || isExpired}
                                        onClick={handleConfirmPayment}
                                        className="py-[12px] px-[20px] rounded-[12px] bg-[#ffbaa0] text-[#181818] font-[600] hover:bg-[#e6a890] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                        title="Giả lập thanh toán thành công, tạo booking"
                                    >
                                        {isExpired
                                            ? "Giữ chỗ đã hết hạn"
                                            : isConfirming
                                            ? "Đang xử lý..."
                                            : "Giả lập thanh toán thành công"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <FooterSub />
        </div>
    );
};

