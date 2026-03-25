import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation, Link, useNavigate, useSearchParams } from "react-router-dom";
import { ProductBanner } from "../product/sections/ProductBanner";
import { FooterSub } from "../../components/layouts/FooterSub";
import { trackOrder, confirmReceived, lookupGuestOrder, createPaymentUrl, cancelPayosPaymentLink, createOrderRefundRequest, updateOrderRefundRequest, getOrderRefundRequests, cancelOrderByGuest } from "../../../api/order.api";
import { getOrderShippingFeeLabel } from "../../utils/orderShippingDisplay";
import { createGuestBankInformationByOrderCode } from "../../../api/bank.api";
import { OrderResponse } from "../../../types/order.type";
import { toast } from "react-toastify";
import {
    Search, Package, MapPin, CheckCircle, WarningCircle,
    RefreshDouble, ClipboardCheck, Truck, Box as BoxIcon, HomeSimple,
    Mail, Copy, HelpCircle, ChatBubble, Wallet, Calendar,
    ShieldCheck, InfoCircle, Star, Clock, XmarkCircle
} from "iconoir-react";
import { format } from "date-fns";
import { useAuthStore } from "../../../stores/useAuthStore";
import { RefundRequestModal } from "../dashboard/sections/RefundRequestModal";
import { CancelOrderModal } from "../dashboard/sections/CancelOrderModal";
import { apiApp } from "../../../api";
import type { ApiResponse } from "../../../types/common.type";
import type { ClientBookingDetailResponse } from "../../../types/booking.type";

/**
 * PayOS gắn `code=00`/`01` lên returnUrl — trùng tên với query `code` (mã đơn) của tra cứu.
 * Dùng `tpOrder` cho link thanh toán; vẫn hỗ trợ `code` cũ (mã đơn dạng ORD-...).
 */
function resolveTrackingOrderCodeFromSearch(search: string): string | null {
    const p = new URLSearchParams(search);
    const tp = p.get("tpOrder")?.trim();
    if (tp) return tp;
    const c = p.get("code")?.trim();
    if (!c) return null;
    if (/^(0\d|01)$/.test(c)) return null;
    if (/^BK-/i.test(c)) return null;
    return c;
}

/** Mã đặt lịch từ URL (ưu tiên bookingCode / tpBooking; hoặc code nếu dạng BK-...). */
function resolveBookingCodeFromSearch(search: string): string | null {
    const p = new URLSearchParams(search);
    const b = p.get("bookingCode")?.trim() || p.get("tpBooking")?.trim();
    if (b) return b;
    const c = p.get("code")?.trim();
    if (c && /^BK-/i.test(c)) return c;
    return null;
}

function digitsOnly(s: string): string {
    return s.replace(/\D/g, "");
}

/** Khớp email hoặc SĐT với đơn đặt lịch — cùng tinh thần với tra cứu đơn hàng (guest). */
function contactMatchesBookingLookup(
    customerEmail: string | null | undefined,
    customerPhone: string | null | undefined,
    input: string
): boolean {
    const id = input.trim();
    if (!id) return false;

    const em = (customerEmail ?? "").trim().toLowerCase();
    if (em && id.toLowerCase() === em) return true;

    const ph = (customerPhone ?? "").trim();
    if (ph && id === ph) return true;

    const dIn = digitsOnly(id);
    const dPh = digitsOnly(ph);
    if (dIn.length >= 9 && dPh.length >= 9) {
        if (dIn === dPh) return true;
        if (dIn.endsWith(dPh.slice(-9)) || dPh.endsWith(dIn.slice(-9))) return true;
    }
    return false;
}

// Màu riêng cho từng trạng thái đơn hàng (+ bước ảo Đã thanh toán)
const STEP_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
    PENDING: { bg: 'bg-amber-500', text: 'text-amber-600', ring: 'ring-amber-100' },
    CONFIRMED: { bg: 'bg-blue-500', text: 'text-blue-600', ring: 'ring-blue-100' },
    PAID: { bg: 'bg-green-500', text: 'text-green-600', ring: 'ring-green-100' },
    PROCESSING: { bg: 'bg-violet-500', text: 'text-violet-600', ring: 'ring-violet-100' },
    DELIVERING: { bg: 'bg-sky-500', text: 'text-sky-600', ring: 'ring-sky-100' },
    DELIVERED: { bg: 'bg-teal-500', text: 'text-teal-600', ring: 'ring-teal-100' },
    COMPLETED: { bg: 'bg-emerald-500', text: 'text-emerald-600', ring: 'ring-emerald-100' },
};

// Component Stepper – mỗi trạng thái một màu, có thêm bước "Đã thanh toán" (khi CONFIRMED + đã thanh toán)
const OrderStepper = ({ status, isPaid = false, cancelReason }: { status: string; isPaid?: boolean; cancelReason?: string }) => {
    const steps = [
        { key: 'PENDING', label: 'Chờ nhận đơn', icon: <ClipboardCheck className="w-5 h-5" /> },
        { key: 'CONFIRMED', label: 'Đã xác nhận', icon: <CheckCircle className="w-5 h-5" /> },
        { key: 'PAID', label: 'Đã thanh toán', icon: <Wallet className="w-5 h-5" /> },
        { key: 'PROCESSING', label: 'Đang đóng gói', icon: <BoxIcon className="w-5 h-5" /> },
        { key: 'DELIVERING', label: 'Đang giao', icon: <Truck className="w-5 h-5" /> },
        { key: 'DELIVERED', label: 'Đã giao', icon: <HomeSimple className="w-5 h-5" /> },
        { key: 'COMPLETED', label: 'Hoàn thành', icon: <Package className="w-5 h-5" /> },
    ];

    const getCurrentStepIndex = () => {
        if (status === 'PENDING') return 0;
        if (status === 'CONFIRMED') return isPaid ? 2 : 1;
        const idx = steps.findIndex(s => s.key === status);
        return idx >= 0 ? idx : 0;
    };
    const currentIdx = getCurrentStepIndex();
    const isCancelled = status === 'CANCELLED';
    const currentStepKey = steps[currentIdx]?.key ?? 'PENDING';
    const progressColor = STEP_COLORS[currentStepKey] ?? STEP_COLORS.PENDING;

    if (isCancelled) {
        return (
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-red-100 shadow-sm mb-3 animate-fadeIn">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-red-500 flex items-center justify-center text-white shadow-md">
                        <WarningCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-red-600 uppercase tracking-wide">
                        ĐÃ HỦY
                    </span>
                </div>
                <div className="mt-3 text-center">
                    <p className="text-[0.75rem] sm:text-sm text-red-500 font-medium">
                        {cancelReason && cancelReason.includes("Hệ thống tự động hủy")
                            ? "Đơn hàng đã bị hệ thống tự động hủy do quá thời gian thanh toán online mà chưa ghi nhận được giao dịch."
                            : cancelReason
                                ? `Đơn hàng này đã được hủy bởi nhân viên với lý do: “${cancelReason}”. Nếu cần hỗ trợ thêm, vui lòng liên hệ TeddyPet.`
                                : "Đơn hàng này đã bị hủy và không còn hiệu lực trên hệ thống TeddyPet."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm mb-3 animate-fadeIn overflow-hidden">
            <div className="relative grid grid-cols-7 gap-0 items-start">
                {/* Nền thanh tiến trình */}
                <div className="absolute top-3 left-0 right-0 h-[2px] bg-gray-100 rounded-full pointer-events-none" style={{ left: '8%', right: '8%' }}></div>
                <div
                    className={`absolute top-3 h-[2px] transition-all duration-[1200ms] ease-in-out rounded-full pointer-events-none ${progressColor.bg}`}
                    style={{ left: '8%', width: currentIdx > 0 ? `${(currentIdx / (steps.length - 1)) * 84}%` : '0%' }}
                ></div>

                {steps.map((step, index) => {
                    const isActive = index <= currentIdx;
                    const isCurrent = index === currentIdx;
                    const colors = STEP_COLORS[step.key] ?? STEP_COLORS.PENDING;

                    return (
                        <div key={step.key} className="flex flex-col items-center justify-center gap-1 z-10 min-w-0 px-0.5">
                            <div
                                className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full flex items-center justify-center transition-all duration-700 text-white ${isActive
                                    ? `${colors.bg} scale-105 shadow-md`
                                    : 'bg-white text-gray-200 border-2 border-gray-100'
                                    } ${isCurrent ? `ring-2 sm:ring-3 ${colors.ring}` : ''}`}
                            >
                                <span className="scale-75 sm:scale-90">{step.icon}</span>
                            </div>
                            <span
                                className={`text-[0.6rem] sm:text-[0.7rem] font-semibold text-center leading-tight transition-colors duration-500 break-words max-w-full ${isActive ? colors.text : 'text-gray-300'}`}
                                style={{ wordBreak: 'break-word' }}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const OrderTrackingPage = () => {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const lookupMode = searchParams.get("mode") === "booking" ? "booking" : "order";
    const setLookupMode = (mode: "order" | "booking") => {
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                if (mode === "booking") next.set("mode", "booking");
                else next.delete("mode");
                return next;
            },
            { replace: true }
        );
    };

    const breadcrumbs = useMemo(
        () => [
            { label: "Trang chủ", to: "/" },
            { label: lookupMode === "booking" ? "Tra cứu đơn đặt lịch" : "Tra cứu đơn hàng", to: "#" },
        ],
        [lookupMode]
    );

    const { user } = useAuthStore();
    const isAuthenticated = !!user;

    const [orderCode, setOrderCode] = useState("");
    const [email, setEmail] = useState("");
    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);
    const [paymentPopupUrl, setPaymentPopupUrl] = useState<string | null>(null);
    const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);
    const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
    const paymentPollRef = useRef<number | null>(null);
    const navigate = useNavigate();

    const hasAutoLooked = useRef(false);
    const hasAutoBookingLooked = useRef(false);

    // Mã đặt lịch trong ?code=BK-... → chuyển tab tra cứu đặt lịch (không cần ?mode=booking)
    useEffect(() => {
        const p = new URLSearchParams(location.search);
        const c = p.get("code")?.trim();
        if (c && /^BK-/i.test(c) && p.get("mode") !== "booking") {
            setLookupMode("booking");
        }
    }, [location.search]);

    // Khi trang được load trong iframe sau khi PayOS redirect (returnUrl có payment_popup=1) → báo parent đóng popup và refresh
    useEffect(() => {
        if (typeof window === "undefined" || window.self === window.top) return;
        const params = new URLSearchParams(window.location.search);
        if (params.get("payment_popup") !== "1") return;
        const code = resolveTrackingOrderCodeFromSearch(window.location.search);
        const emailParam = params.get("email");
        window.parent.postMessage({ type: "PAYMENT_POPUP_CLOSE", code, email: emailParam }, "*");
    }, []);

    // Parent: lắng nghe message từ iframe (sau khi thanh toán xong) để đóng popup và tra cứu lại đơn
    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.data?.type !== "PAYMENT_POPUP_CLOSE") return;
            setPaymentPopupUrl(null);
            const code = event.data?.code;
            const emailParam = event.data?.email;
            if (code) doTrackOrder(code, emailParam || undefined);
        };
        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }, []);

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const emailFromUrl = urlParams.get("email");
        if (emailFromUrl && emailFromUrl !== email) setEmail(emailFromUrl);

        if (lookupMode === "booking") {
            const bc = resolveBookingCodeFromSearch(location.search);
            if (bc && bc !== orderCode) setOrderCode(bc);
        } else {
            const codeFromUrl = resolveTrackingOrderCodeFromSearch(location.search);
            if (codeFromUrl && codeFromUrl !== orderCode) setOrderCode(codeFromUrl);
        }
    }, [location.search, lookupMode]);

    useEffect(() => {
        if (lookupMode !== "order") return;
        const codeFromUrl = resolveTrackingOrderCodeFromSearch(location.search);
        const emailFromUrl = new URLSearchParams(location.search).get("email");

        if (codeFromUrl && !hasAutoLooked.current && !order) {
            const targetEmail = emailFromUrl || email;
            if (isAuthenticated || targetEmail) {
                hasAutoLooked.current = true;
                doTrackOrder(codeFromUrl, targetEmail);
            }
        }
    }, [location.search, isAuthenticated, email, order, lookupMode]);

    const doTrackOrder = async (code: string, emailInput?: string) => {
        if (!code) return;
        setLoading(true);
        setError(null);
        try {
            let response;
            // Theo backend mới: /api/orders/track/{code} là public
            // Tuy nhiên vẫn dùng logic Guest Lookup nếu là khách vãng lai để bảo mật
            if (isAuthenticated) {
                response = await trackOrder(code.trim());
            } else {
                if (!emailInput) {
                    setError("Vui lòng nhập Email đặt hàng để bảo mật.");
                    setLoading(false);
                    return;
                }
                response = await lookupGuestOrder(code.trim(), emailInput.trim());
            }

            if (response.success && response.data) {
                // Nếu đã đăng nhập và tra cứu thành công đơn của mình -> nhảy vào trang dashboard detail luôn
                if (isAuthenticated) {
                    navigate(`/dashboard/orders/${response.data.id}`);
                    return;
                }
                setOrder(response.data);
            } else {
                setError("Không tìm thấy đơn hàng. Vui lòng kiểm tra lại thông tin.");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Không thể tìm thấy đơn hàng này.");
        } finally {
            setLoading(false);
        }
    };

    const doTrackBooking = useCallback(async (code: string, contactInput?: string) => {
        if (!code.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await apiApp.get<ApiResponse<ClientBookingDetailResponse>>(
                `/api/bookings/code/${encodeURIComponent(code.trim())}`
            );
            const payload = res.data;
            if (!payload.success || !payload.data) {
                setError(payload.message || "Không tìm thấy đơn đặt lịch.");
                return;
            }
            const b = payload.data;
            if (!isAuthenticated) {
                if (!contactInput?.trim()) {
                    setError("Vui lòng nhập Email/SĐT để bảo mật.");
                    return;
                }
                if (!contactMatchesBookingLookup(b.customerEmail, b.customerPhone, contactInput)) {
                    setError("Email/SĐT không khớp với đơn đặt lịch. Vui lòng kiểm tra lại.");
                    return;
                }
            }
            navigate(`/dat-lich/chi-tiet-don/${encodeURIComponent(b.bookingCode)}`);
        } catch (err: any) {
            setError(err.response?.data?.message || "Không tìm thấy đơn đặt lịch. Vui lòng kiểm tra lại thông tin.");
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (lookupMode !== "booking") return;
        const bc = resolveBookingCodeFromSearch(location.search);
        const emailFromUrl = new URLSearchParams(location.search).get("email");

        if (bc && !hasAutoBookingLooked.current) {
            const targetEmail = emailFromUrl || email;
            if (isAuthenticated || targetEmail) {
                hasAutoBookingLooked.current = true;
                void doTrackBooking(bc, targetEmail);
            }
        }
    }, [location.search, isAuthenticated, email, lookupMode, doTrackBooking]);

    const handleConfirmReceived = async () => {
        if (!order) return;
        setIsSubmitting(true);
        try {
            await confirmReceived(order.id);
            toast.success("Xác nhận đã nhận hàng thành công. TeddyPet cảm ơn bạn!");
            setOrder({ ...order, status: 'COMPLETED' as const });
            setShowFeedbackModal(true);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra!");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleManualLookup = (e: React.FormEvent) => {
        e.preventDefault();
        if (lookupMode === "booking") {
            if (!orderCode.trim()) { toast.error("Nhập mã đặt lịch!"); return; }
            if (!email.trim()) { toast.error("Nhập Email/SĐT bảo mật!"); return; }
            hasAutoBookingLooked.current = true;
            void doTrackBooking(orderCode, email);
            return;
        }
        if (!orderCode) { toast.error("Nhập mã đơn hàng!"); return; }
        if (!email) { toast.error("Nhập Email/SĐT bảo mật!"); return; }
        hasAutoLooked.current = true;
        void doTrackOrder(orderCode, email);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Đã sao chép mã đơn hàng!");
    };

    const paymentInfo = order?.payments?.[0];
    const isPaid = paymentInfo?.status === 'COMPLETED' || paymentInfo?.status === 'SUCCESS';
    const paymentMethodLabel = paymentInfo?.paymentMethod === 'CASH' ? 'Khi nhận hàng (COD)' : 'Online (VNPay)';
    const isOnlineBankTransfer = order?.orderType !== 'OFFLINE' && paymentInfo?.paymentMethod === 'BANK_TRANSFER';

    // Nếu khách đã hủy popup thanh toán trên MỘT đơn tra cứu, ẩn nút thanh toán cho đơn đó.
    const [paymentCancelled, setPaymentCancelled] = useState(false);
    // Khi tra cứu sang đơn khác (orderId thay đổi) thì reset lại cho phép thanh toán.
    useEffect(() => {
        setPaymentCancelled(false);
    }, [order?.id]);

    const showPaymentButton = order && order.status === 'CONFIRMED' && isOnlineBankTransfer && !isPaid && !paymentCancelled;

    // Nút yêu cầu hoàn tiền
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
    const [refundHistory, setRefundHistory] = useState<Array<{
        id: number; status: string; adminDecisionNote?: string | null; processedAt?: string | null; createdAt: string; customerReason?: string;
        evidenceUrls?: string | null; adminEvidenceUrls?: string[]; refundTransactionId?: string | null;
    }>>([]);

    // Fetch refund history khi mở modal HOẶC khi đơn đã hủy/hoàn trả (để hiển thị block lý do + bằng chứng)
    useEffect(() => {
        if (!order?.id) return;
        if (showCancelModal || order.status === 'CANCELLED' || order.status === 'RETURNED') {
            getOrderRefundRequests(order.id)
                .then((res) => { if (res.success && Array.isArray(res.data)) setRefundHistory(res.data); })
                .catch(() => setRefundHistory([]));
        }
    }, [order?.id, order?.status, showCancelModal]);

    const showRefundButton = order && isPaid && ['PAID', 'PROCESSING'].includes(order.status);
    const showCancelButton = order && !isPaid && ['PENDING', 'CONFIRMED'].includes(order.status);
    const hasPendingRefund = order?.latestRefundStatus === 'PENDING';

    // Polling logic

    // === Countdown 10 phút cho đơn đã xác nhận & chờ thanh toán online ===
    const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

    useEffect(() => {
        if (!order || !isOnlineBankTransfer || order.status !== 'CONFIRMED' || isPaid) {
            setCountdownSeconds(null);
            return;
        }
        const confirmedAt = new Date(order.updatedAt).getTime();
        const deadline = confirmedAt + 10 * 60 * 1000; // 10 phút

        const updateCountdown = () => {
            const now = Date.now();
            const diff = Math.floor((deadline - now) / 1000);
            setCountdownSeconds(diff > 0 ? diff : 0);
        };

        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);
        return () => clearInterval(timer);
    }, [order, isOnlineBankTransfer, isPaid]);

    // Khi payment đã COMPLETED: đóng popup nếu đang mở và dừng polling
    useEffect(() => {
        if (isPaid) {
            if (paymentPopupUrl) {
                setPaymentPopupUrl(null);
            }
            if (paymentPollRef.current != null) {
                window.clearInterval(paymentPollRef.current);
                paymentPollRef.current = null;
            }
        }
    }, [isPaid, paymentPopupUrl]);

    const stopPaymentPolling = () => {
        if (paymentPollRef.current != null) {
            window.clearInterval(paymentPollRef.current);
            paymentPollRef.current = null;
        }
    };

    const startPaymentPolling = (code: string, emailInput?: string) => {
        stopPaymentPolling();
        let attempts = 0;
        paymentPollRef.current = window.setInterval(() => {
            attempts += 1;
            // Sau khi thanh toán, webhook sẽ cập nhật order; ta poll lại để lấy trạng thái mới.
            doTrackOrder(code, emailInput);
            if (attempts >= 20) { // tối đa ~100 giây
                stopPaymentPolling();
            }
        }, 5000);
    };

    const handlePayment = async () => {
        if (!order) return;
        setIsPaymentSubmitting(true);
        try {
            const clientBaseUrl = import.meta.env.VITE_PUBLIC_CLIENT_URL || window.location.origin;
            const returnUrl = `${clientBaseUrl}/tra-cuu-don-hang?tpOrder=${encodeURIComponent(order.orderCode)}${order.guestEmail || email ? `&email=${encodeURIComponent(order.guestEmail || email)}` : ""}&payment_popup=1`;
            const response = await createPaymentUrl(order.id, "PAYOS", returnUrl);
            if (response.success && response.data) {
                startPaymentPolling(order.orderCode, order.guestEmail || email || undefined);
                setPaymentPopupUrl(response.data as string);
                toast.info("Đang mở cửa sổ PayOS. Vui lòng quét QR/chuyển khoản, sau khi thanh toán xong hệ thống sẽ tự cập nhật.", {
                    autoClose: 5000,
                });
            } else {
                toast.error(response.message || "Không thể tạo link thanh toán.");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể tạo link thanh toán!");
        } finally {
            setIsPaymentSubmitting(false);
        }
    };

    const handleClosePaymentPopup = async () => {
        setPaymentPopupUrl(null);
        if (!order?.id) return;
        try {
            await cancelPayosPaymentLink(order.id);
        } catch {
            // best-effort cancel
        }
    };

    const handleConfirmCancelOrder = async (reason: string) => {
        if (!order) return;
        setIsSubmittingCancel(true);
        try {
            // Dùng API guest cancel vì đây là trang tra cứu (thường cho guest)
            const res = await cancelOrderByGuest(order.orderCode, order.guestEmail || email || "", reason);
            if (res.success) {
                toast.success("Đã hủy đơn hàng thành công!");
                setShowCancelOrderModal(false);
                doTrackOrder(order.orderCode, order.guestEmail || email || undefined);
            } else {
                toast.error(res.message || "Không thể hủy đơn hàng.");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi hủy đơn hàng.");
        } finally {
            setIsSubmittingCancel(false);
        }
    };

    const handleRefundUpdate = async (refundId: number, data: any) => {
        if (!order) return;
        setIsSubmittingRefund(true);
        try {
            const response = await updateOrderRefundRequest(order.id, refundId, data);
            if (response.success) {
                toast.success("Đã cập nhật yêu cầu hoàn tiền!");
                setShowCancelModal(false);
                const res = await getOrderRefundRequests(order.id);
                if (res.success && Array.isArray(res.data)) setRefundHistory(res.data);
                doTrackOrder(order.orderCode, order.guestEmail || email || undefined);
            } else {
                toast.error(response.message || "Cập nhật thất bại.");
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Lỗi khi cập nhật.");
        } finally {
            setIsSubmittingRefund(false);
        }
    };

    const handleRefundConfirm = async (reason: string, bankInformationId?: number, guestBank?: any) => {
        if (!order) return;
        setIsSubmittingRefund(true);
        try {
            let finalBankId = bankInformationId;
            
            if (guestBank && !finalBankId) {
                const res = await createGuestBankInformationByOrderCode(order.orderCode, guestBank);
                if (res.success) {
                    finalBankId = res.data.id;
                } else {
                    throw new Error(res.message || "Không thể lưu thông tin ngân hàng.");
                }
            }

            if (!finalBankId) {
                toast.error("Thiếu thông tin ngân hàng hoàn tiền.");
                return;
            }

            const res = await createOrderRefundRequest(order.id, {
                requestedAmount: order.finalAmount,
                reason: reason.trim(),
                bankInformationId: finalBankId
            });

            if (res.success) {
                toast.success("Đã gửi yêu cầu hoàn tiền thành công!");
                setShowCancelModal(false);
                const listRes = await getOrderRefundRequests(order.id);
                if (listRes.success && Array.isArray(listRes.data)) setRefundHistory(listRes.data);
                doTrackOrder(order.orderCode, order.guestEmail || email || undefined);
            } else {
                toast.error(res.message || "Không thể gửi yêu cầu hoàn tiền.");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message || "Không thể gửi yêu cầu hoàn tiền!");
        } finally {
            setIsSubmittingRefund(false);
        }
    };

    return (
        <div className="bg-[#fcfcfc] min-h-screen">
            <ProductBanner
                pageTitle="Tra cứu hành trình"
                breadcrumbs={breadcrumbs}
                url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-listing.jpg"
                className="bg-top"
            />

            <div className="app-container py-6">
                <div className="max-w-[1100px] mx-auto space-y-4 flex flex-col items-center">

                    {/* 1. FORM TRA CỨU */}
                    {(!order || error) && !loading && (
                        <div className="w-full flex justify-center">
                            <div className="bg-white p-[24px] rounded-[22px] shadow-sm border border-[#eee] animate-fadeIn text-center w-full max-w-[980px] mx-auto origin-top scale-[0.9] md:scale-[0.94] lg:scale-[0.96]">
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center mb-5 max-w-[620px] mx-auto">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLookupMode("order");
                                            setError(null);
                                        }}
                                        className={`flex-1 min-h-[48px] px-4 rounded-[14px] text-[0.95rem] sm:text-[1.05rem] font-black uppercase tracking-tight transition-all border-2 ${
                                            lookupMode === "order"
                                                ? "bg-client-secondary text-white border-client-secondary shadow-md"
                                                : "bg-gray-50 text-gray-500 border-gray-100 hover:border-client-primary/40 hover:text-client-secondary"
                                        }`}
                                    >
                                        Tra cứu đơn hàng
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLookupMode("booking");
                                            setError(null);
                                        }}
                                        className={`flex-1 min-h-[48px] px-4 rounded-[14px] text-[0.95rem] sm:text-[1.05rem] font-black uppercase tracking-tight transition-all border-2 ${
                                            lookupMode === "booking"
                                                ? "bg-client-secondary text-white border-client-secondary shadow-md"
                                                : "bg-gray-50 text-gray-500 border-gray-100 hover:border-client-primary/40 hover:text-client-secondary"
                                        }`}
                                    >
                                        Tra cứu đơn đặt lịch
                                    </button>
                                </div>

                                <h2 className="text-[2.08rem] font-black text-client-secondary mb-2 uppercase tracking-tight">
                                    {lookupMode === "booking" ? "Kiểm tra đơn đặt lịch" : "Kiểm tra đơn hàng"}
                                </h2>
                                <p className="text-[1.201rem] text-gray-400 font-medium mb-7 italic">
                                    {isAuthenticated
                                        ? lookupMode === "booking"
                                            ? "Chỉ cần nhập mã đặt lịch của bạn"
                                            : "Chỉ cần nhập mã đơn hàng của bạn"
                                        : "Vui lòng nhập mã đơn và email/SĐT chính chủ"}
                                </p>

                                {isAuthenticated && lookupMode === "order" && (
                                    <div className="mb-6 p-3 bg-client-primary/5 rounded-2xl border border-dashed border-client-primary/20 animate-fadeIn">
                                        <p className="text-[1.039rem] text-client-secondary font-bold">
                                            💡 Bạn có thể vào <Link to="/dashboard/orders" className="text-client-primary underline">Lịch sử đơn hàng</Link> để xem danh sách trọn vẹn nhất.
                                        </p>
                                    </div>
                                )}

                                {isAuthenticated && lookupMode === "booking" && (
                                    <div className="mb-6 p-3 bg-client-primary/5 rounded-2xl border border-dashed border-client-primary/20 animate-fadeIn">
                                        <p className="text-[1.039rem] text-client-secondary font-bold">
                                            💡 Bạn có thể vào <Link to="/dashboard/bookings" className="text-client-primary underline">Lịch sử đặt lịch</Link> để xem danh sách trọn vẹn nhất.
                                        </p>
                                    </div>
                                )}

                                <form onSubmit={handleManualLookup} className="max-w-[620px] mx-auto space-y-4">
                                    <div className="relative">
                                        <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder={
                                                lookupMode === "booking"
                                                    ? "Mã đặt lịch (BK-XXXXXX)"
                                                    : "Mã đơn hàng (ORD-XXXXXX)"
                                            }
                                            value={orderCode}
                                            onChange={(e) => setOrderCode(e.target.value)}
                                            className="w-full h-[56px] pl-12 pr-5 rounded-[14px] border-2 border-gray-50 focus:border-client-primary outline-none text-[1.28rem] bg-gray-50/50 font-black transition-all"
                                        />
                                    </div>
                                    <div className="relative animate-fadeIn">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Địa chỉ Email hoặc Số điện thoại"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full h-[56px] pl-12 pr-5 rounded-[14px] border-2 border-gray-50 focus:border-client-primary outline-none text-[1.28rem] bg-gray-50/50 font-black transition-all"
                                        />
                                    </div>
                                    <button type="submit" className="w-full h-[56px] mt-1 bg-client-secondary hover:bg-client-primary text-white font-black text-[1.28rem] rounded-[14px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                                        <Search className="w-4 h-4" /> TRA CỨU NGAY
                                    </button>
                                </form>
                                {error && (
                                    <p className="mt-4 text-[0.9rem] font-semibold text-red-500">
                                        {error}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="bg-white p-6 rounded-xl text-center shadow-sm">
                            <div className="w-9 h-9 border-2 border-client-primary/10 border-t-client-primary rounded-full animate-spin mx-auto mb-3"></div>
                            <h2 className="text-sm font-semibold text-gray-400">
                                {lookupMode === "booking" ? "Đang tìm đơn đặt lịch..." : "Đang tìm đơn hàng..."}
                            </h2>
                        </div>
                    )}

                    {/* 2. KẾT QUẢ */}
                    {!loading && order && (
                        <div className="space-y-3 animate-fadeIn">

                            {/* Header chi tiết */}
                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm font-bold text-client-secondary uppercase tracking-tight">Mã đơn: {order.orderCode}</h2>
                                    <button onClick={() => copyToClipboard(order.orderCode)} className="w-7 h-7 bg-gray-50 rounded-md flex items-center justify-center text-gray-400 hover:text-client-primary hover:bg-client-primary/10 transition-all">
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="text-right">
                                    <label className="text-[0.65rem] text-gray-400 font-semibold uppercase block tracking-wide">Ngày đặt hàng</label>
                                    <span className="text-xs font-bold text-client-secondary">{format(new Date(order.createdAt), "dd/MM/yyyy - hh:mm a")}</span>
                                </div>
                            </div>

                            {/* TIMELINE */}
                            <OrderStepper
                                status={order.status}
                                isPaid={order.payments?.[0]?.status === 'COMPLETED'}
                                cancelReason={order.cancelReason}
                            />

                            {/* Lý do hủy đơn + lịch sử hoàn tiền + bằng chứng (tra cứu đơn) */}
                            {(order.status === 'CANCELLED' || order.status === 'RETURNED') && order.cancelReason && (
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${order.status === 'CANCELLED' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
                                            <WarningCircle width={20} height={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[0.625rem] text-gray-400 font-bold uppercase tracking-widest mb-1">Lý do {order.status === 'CANCELLED' ? 'hủy đơn' : 'hoàn trả'}</div>
                                            <div className="text-sm font-bold text-slate-700 leading-tight">"{order.cancelReason}"</div>
                                            {order.cancelledBy && (
                                                <div className="text-[0.625rem] text-gray-400 mt-2 font-medium">Thực hiện bởi: <span className="font-bold text-gray-500">{order.cancelledBy}</span></div>
                                            )}
                                            {refundHistory.length > 0 && (
                                                <div className="mt-4 space-y-3">
                                                    {refundHistory.map((r) => (
                                                        <div key={r.id} className="p-3 bg-white rounded-xl border border-emerald-100 shadow-sm">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className={`w-5 h-5 ${r.status === 'REFUNDED' ? 'bg-emerald-500' : r.status === 'ACTION_REQUIRED' ? 'bg-amber-500' : r.status === 'REJECTED' ? 'bg-rose-500' : 'bg-blue-500'} rounded-full flex items-center justify-center text-white`}>
                                                                    {r.status === 'REFUNDED' ? <ShieldCheck width={12} height={12} /> : <InfoCircle width={12} height={12} />}
                                                                </div>
                                                                <span className={`text-[0.625rem] font-bold ${r.status === 'REFUNDED' ? 'text-emerald-600' : r.status === 'ACTION_REQUIRED' ? 'text-amber-600' : r.status === 'REJECTED' ? 'text-rose-600' : 'text-blue-600'} uppercase tracking-widest`}>
                                                                    {r.status === 'REFUNDED' ? 'Đã xác nhận hoàn tiền' : r.status === 'ACTION_REQUIRED' ? 'Cần cập nhật thông tin' : r.status === 'REJECTED' ? 'Yêu cầu bị từ chối' : 'Đang xử lý hoàn tiền'}
                                                                </span>
                                                            </div>
                                                            {r.adminDecisionNote && (
                                                                <div className="text-[11px] font-bold text-slate-600 mb-2 p-2 bg-slate-50 rounded-lg border-l-4 border-slate-300">
                                                                    Lưu ý từ Admin: "{r.adminDecisionNote}"
                                                                </div>
                                                            )}
                                                            {r.status === 'REFUNDED' && r.refundTransactionId && (
                                                                <div className="text-[10px] text-slate-400 mb-2">Mã GD: <span className="font-bold text-slate-600 uppercase">{r.refundTransactionId}</span></div>
                                                            )}
                                                            {r.evidenceUrls && (() => {
                                                                const urls = typeof r.evidenceUrls === 'string' ? r.evidenceUrls.split(/[;,]/).map((u: string) => u.trim()).filter(Boolean) : (Array.isArray(r.evidenceUrls) ? r.evidenceUrls : []);
                                                                return urls.length > 0 ? (
                                                                    <div className="mt-2">
                                                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bằng chứng bạn gửi</div>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {urls.map((url: string, i: number) => (
                                                                                <a key={i} href={url} target="_blank" rel="noreferrer" className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:scale-105 transition-all hover:border-client-primary">
                                                                                    <img src={url} alt={`Bằng chứng ${i + 1}`} className="w-full h-full object-cover" />
                                                                                </a>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ) : null;
                                                            })()}
                                                            {r.adminEvidenceUrls && r.adminEvidenceUrls.length > 0 && (
                                                                <div className="mt-2">
                                                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bằng chứng từ TeddyPet</div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {r.adminEvidenceUrls.map((url, i) => (
                                                                            <a key={i} href={url} target="_blank" rel="noreferrer" className="w-16 h-16 rounded-lg overflow-hidden border border-emerald-50 shadow-sm hover:scale-105 transition-all">
                                                                                <img src={url} alt="Bằng chứng hoàn tiền" className="w-full h-full object-cover" />
                                                                            </a>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {r.status === 'ACTION_REQUIRED' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowCancelModal(true)}
                                                                    className="mt-2 w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg transition-all uppercase"
                                                                >
                                                                    Cập nhật thông tin ngay
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Badge đếm ngược thanh toán ngay dưới timeline */}
                            {isOnlineBankTransfer && order.status === 'CONFIRMED' && countdownSeconds !== null && (
                                <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 animate-fadeIn">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[0.7rem] font-semibold text-amber-700 uppercase tracking-wide">
                                                Đang chờ bạn thanh toán online
                                            </p>
                                            <p className="text-[0.7rem] text-amber-700">
                                                {countdownSeconds! > 0
                                                    ? `Thời gian còn lại: ${Math.floor(countdownSeconds! / 60)}:${String(countdownSeconds! % 60).padStart(2, '0')} phút`
                                                    : "Đã quá thời gian thanh toán, đơn có thể bị hệ thống hủy tự động."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* GRID 1:1 - ĐỊA CHỈ & HỖ TRỢ */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                    <h3 className="text-xs font-bold text-client-secondary mb-2 flex items-center gap-1.5 uppercase tracking-tight">
                                        <MapPin className="text-client-primary w-4 h-4 shrink-0" /> Địa chỉ giao tới
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex flex-col">
                                            <span className="text-[0.65rem] text-gray-400 font-semibold uppercase tracking-wide">Người nhận</span>
                                            <span className="text-xs font-bold text-client-secondary mt-0.5">{order.shippingName}</span>
                                            <span className="text-xs font-semibold text-client-primary mt-0.5 border-l-2 border-client-primary pl-1.5">{order.shippingPhone}</span>
                                        </div>
                                        <div className="pt-2 border-t border-gray-50">
                                            <span className="text-[0.65rem] text-gray-400 font-semibold uppercase tracking-wide">Nơi nhận</span>
                                            <p className="text-xs text-gray-600 mt-1 leading-snug">{order.shippingAddress}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm bg-gradient-to-tr from-white to-blue-50/20">
                                    <h3 className="text-xs font-bold text-client-secondary mb-2 flex items-center gap-1.5 uppercase tracking-tight">
                                        <HelpCircle className="text-blue-500 w-4 h-4 shrink-0" /> Cần giúp đỡ?
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium mb-3 leading-snug">Đơn hàng đang được xử lý. Có thắc mắc hãy liên hệ chúng tôi.</p>
                                    {showPaymentButton && (
                                        <div className="mb-3 space-y-1.5">
                                            <p className="text-[0.7rem] font-semibold text-blue-700 leading-snug">Chuyển đúng <strong>{order.finalAmount.toLocaleString()}đ</strong> để hệ thống xác nhận tự động.</p>
                                            <button
                                                type="button"
                                                onClick={handlePayment}
                                                disabled={isPaymentSubmitting}
                                                className="w-full h-9 bg-client-secondary hover:bg-client-primary text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md disabled:opacity-70"
                                            >
                                                {isPaymentSubmitting ? <RefreshDouble className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
                                                {isPaymentSubmitting ? "Đang xử lý..." : "Thanh toán đơn hàng"}
                                            </button>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-2">
                                        <a href="#" className="h-9 bg-client-secondary text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1 shadow-md">
                                            <ChatBubble className="w-3.5 h-3.5" /> Chat ngay
                                        </a>
                                        <button onClick={() => { setOrder(null); setOrderCode(""); setEmail(""); }} className="h-9 border border-gray-200 rounded-lg text-gray-500 font-semibold text-xs hover:border-client-primary hover:text-client-primary transition-all">
                                            Tra đơn khác
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* DANH SÁCH SẢN PHẨM */}
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-3 py-2 border-b border-gray-50 bg-gray-50/30 flex items-center gap-1.5">
                                    <Package className="text-client-primary w-4 h-4 shrink-0" />
                                    <h3 className="text-xs font-bold text-client-secondary uppercase tracking-tight">Sản phẩm trong kiện ({order.orderItems?.length})</h3>
                                </div>
                                <div className="p-2 space-y-1.5">
                                    {order.orderItems?.map((item, idx) => (
                                        <div key={idx} className="flex gap-3 p-2 rounded-lg hover:bg-gray-50/50 transition-all group">
                                            <div className="w-11 h-11 rounded-lg overflow-hidden border border-gray-100 shrink-0 relative">
                                                <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" alt="" />
                                                <div className="absolute top-0 right-0 bg-client-primary text-white text-[0.65rem] font-bold px-1 py-0.5 rounded-bl">x{item.quantity}</div>
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center min-w-0">
                                                <h4 className="text-xs font-bold text-client-secondary line-clamp-1">{item.productName}</h4>
                                                <span className="text-[0.65rem] text-gray-400 font-semibold uppercase tracking-wide mt-0.5">{item.variantName}</span>
                                                <div className="text-xs font-bold text-client-secondary mt-0.5">{(item.unitPrice * item.quantity).toLocaleString()}đ</div>
                                            </div>
                                            {order.status === 'COMPLETED' && (
                                                <div className="flex items-center shrink-0">
                                                    <Link
                                                        to={`/feedback?orderId=${order.id}${!order.user ? `&email=${order.guestEmail || email}` : ''}`}
                                                        className="flex items-center gap-1 px-2.5 py-1 bg-client-primary/10 text-client-primary rounded-full font-semibold text-[0.7rem] hover:bg-client-primary hover:text-white transition-all"
                                                    >
                                                        <Star className="w-3 h-3" /> Đánh giá
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* THANH TOÁN & THỜI GIAN */}
                            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-bold text-client-secondary uppercase border-b border-gray-100 pb-1.5 tracking-tight">Chi tiết giao dịch</h3>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500 shrink-0"><Wallet className="w-4 h-4" /></div>
                                                <div>
                                                    <label className="text-[0.65rem] text-gray-400 font-semibold uppercase tracking-wide block">Phương thức</label>
                                                    <span className="text-xs font-bold text-client-secondary">{paymentMethodLabel}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 shrink-0"><Calendar className="w-4 h-4" /></div>
                                                <div>
                                                    <label className="text-[0.65rem] text-gray-400 font-semibold uppercase tracking-wide block">Khởi tạo đơn</label>
                                                    <span className="text-xs font-bold text-client-secondary">{format(new Date(order.createdAt), "HH:mm - dd/MM/yyyy")}</span>
                                                </div>
                                            </div>
                                            {isPaid ? (
                                                <div className="flex items-center gap-2 animate-fadeIn">
                                                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500 shrink-0"><ShieldCheck className="w-4 h-4" /></div>
                                                    <div>
                                                        <label className="text-[0.65rem] text-gray-400 font-semibold uppercase tracking-wide block">Trạng thái thanh toán</label>
                                                        <span className="text-xs font-bold text-emerald-600">Thành công lúc {format(new Date(order.updatedAt), "HH:mm")}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                isOnlineBankTransfer && order.status === 'CONFIRMED' && countdownSeconds !== null && (
                                                    <div className="flex items-center gap-2 animate-fadeIn">
                                                        <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500 shrink-0">
                                                            <Clock className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[0.65rem] text-gray-400 font-semibold uppercase tracking-wide block">Thời gian còn lại để thanh toán</label>
                                                            <span className="text-xs font-bold text-orange-600">
                                                                {countdownSeconds! > 0
                                                                    ? `${Math.floor(countdownSeconds! / 60)}:${String(countdownSeconds! % 60).padStart(2, '0')} phút`
                                                                    : "Đã quá thời gian thanh toán. Đơn có thể bị hệ thống hủy tự động."}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 flex flex-col justify-center">
                                        <div className="flex justify-between items-center text-xs mb-1.5">
                                            <span className="text-gray-500 font-semibold uppercase tracking-wide">Tạm tính:</span>
                                            <span className="font-bold text-client-secondary">{order.subtotal.toLocaleString()}đ</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs mb-2">
                                            <span className="text-gray-500 font-semibold uppercase tracking-wide">Phí vận chuyển:</span>
                                            <span className="font-bold text-client-secondary">{getOrderShippingFeeLabel(order, { withPlusPrefix: true })}</span>
                                        </div>
                                        <div className="pt-2 border-t-2 border-dashed border-gray-200 flex justify-between items-center">
                                            <span className="text-sm font-bold text-client-secondary uppercase tracking-tight">Tổng cộng:</span>
                                            <span className="text-lg font-bold text-client-primary tracking-tight">{order.finalAmount.toLocaleString()}đ</span>
                                        </div>
                                        <div className="mt-2 flex items-center gap-1 justify-end">
                                            <InfoCircle className="w-3 h-3 text-client-primary" />
                                            <span className="text-[0.65rem] text-client-primary font-semibold uppercase italic">TeddyPet</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Nút hành động cuối trang: xác nhận nhận hàng / yêu cầu hoàn tiền */}
                            <div className="mt-3 space-y-2">
                                {order.status === 'DELIVERED' && (
                                    <button
                                        onClick={handleConfirmReceived}
                                        disabled={isSubmitting}
                                        className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-95"
                                    >
                                        {isSubmitting ? <RefreshDouble className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                        {isSubmitting ? "Đang xác nhận..." : "Tôi đã nhận được hàng"}
                                    </button>
                                )}

                                {showCancelButton && (
                                    <button
                                        type="button"
                                        onClick={() => setShowCancelOrderModal(true)}
                                        className="w-full h-10 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-rose-600 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-95 group"
                                    >
                                        <XmarkCircle className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
                                        Hủy đơn hàng
                                    </button>
                                )}

                                {showRefundButton && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setShowCancelModal(true)}
                                            className="w-full h-10 border border-red-200 bg-red-50/40 hover:bg-red-50 text-red-600 hover:text-red-700 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-95 group"
                                        >
                                            <RefreshDouble className="w-4 h-4 text-red-400 group-hover:animate-spin-slow" />
                                            Yêu cầu hoàn tiền
                                        </button>
                                        {hasPendingRefund && (
                                            <p className="text-[0.8rem] text-red-500 font-medium text-center">
                                                Đơn hàng này đang có yêu cầu hoàn tiền đang chờ TeddyPet xử lý. Bấm nút trên để xem lịch sử.
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Popup thanh toán PayOS (iframe) */}
            {paymentPopupUrl && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4">
                    <div
                        className="absolute inset-0 bg-client-secondary/50 backdrop-blur-md"
                        onClick={handleClosePaymentPopup}
                        aria-hidden
                    />
                    <div className="relative z-10 w-full max-w-2xl h-[88vh] sm:h-[90vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-scaleUp">
                        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 shrink-0 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-client-primary/10 flex items-center justify-center text-client-primary shrink-0">
                                    <Wallet className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm sm:text-base font-bold text-client-secondary uppercase tracking-tight truncate">
                                        Thanh toán đơn hàng
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Quét mã QR hoặc chuyển khoản theo hướng dẫn bên dưới</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleClosePaymentPopup}
                                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-client-primary flex items-center justify-center shrink-0 transition-colors"
                                aria-label="Đóng"
                            >
                                <span className="text-xl font-semibold leading-none">×</span>
                            </button>
                        </div>
                        <div className="flex-1 min-h-0 flex flex-col bg-gray-50/30">
                            <iframe
                                src={paymentPopupUrl}
                                title="Thanh toán PayOS"
                                className="w-full flex-1 min-h-0 border-0 rounded-b-2xl sm:rounded-b-3xl"
                                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal yêu cầu hoàn tiền mới */}
            <RefundRequestModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={handleRefundConfirm}
                onUpdate={handleRefundUpdate}
                isSubmitting={isSubmittingRefund}
                orderCode={order?.orderCode || ""}
                isLoggedIn={isAuthenticated}
                refundHistory={refundHistory}
                initialRefundRequest={refundHistory.find(r => r.status === "ACTION_REQUIRED" || r.status === "PENDING")}
            />

            <CancelOrderModal
                isOpen={showCancelOrderModal}
                onClose={() => setShowCancelOrderModal(false)}
                onConfirm={handleConfirmCancelOrder}
                isCancelling={isSubmittingCancel}
            />

            {/* Modal Gợi ý Đánh giá */}
            {showFeedbackModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-client-secondary/40 backdrop-blur-md"
                        onClick={() => setShowFeedbackModal(false)}
                    ></div>
                    <div className="bg-white rounded-[28px] p-10 max-w-[440px] w-full relative z-10 shadow-2xl border border-gray-100 text-center animate-scaleUp">
                        <div className="w-[72px] h-[72px] bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-6 shadow-sm border border-emerald-100">
                            <Star className="w-[4.0rem] h-[4.0rem] fill-current" />
                        </div>
                        <h3 className="text-[2.08rem] font-black text-client-secondary mb-4 leading-tight uppercase">
                            Tuyệt vời quá!
                        </h3>
                        <p className="text-[1.28rem] text-gray-500 font-medium mb-8 leading-relaxed">
                            Đơn hàng đã hoàn thành. Bạn hãy dành chút thời gian đánh giá sản phẩm để TeddyPet ngày càng hoàn thiện hơn nhé! 🐾
                        </p>
                        <div className="flex flex-col gap-3">
                            <Link
                                to={`/feedback?orderId=${order?.id}${!order?.user ? `&email=${order?.guestEmail || email}` : ''}`}
                                className="h-[54px] bg-client-primary text-white rounded-[16px] font-black text-[1.44rem] flex items-center justify-center gap-3 hover:bg-client-secondary shadow-xl shadow-client-primary/30 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                <Star className="w-6 h-6" /> ĐÁNH GIÁ NGAY
                            </Link>
                            <button
                                onClick={() => setShowFeedbackModal(false)}
                                className="h-[46px] text-gray-400 font-bold text-[1.201rem] hover:text-client-secondary transition-colors uppercase tracking-widest"
                            >
                                Để sau nhé
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <FooterSub />

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.8s ease-out forwards; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scaleUp { animation: scaleUp 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};
