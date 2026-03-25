import { useEffect, useMemo, useState } from "react";
import { Rating, Box, Stack, Typography, IconButton, Dialog, DialogContent } from "@mui/material";
import { ChevronLeft, ChevronRight, Star, MessageCircle, AlertCircle, X, Camera, Trash2, Plus } from "lucide-react";
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
import { createBookingDepositPayosUrl } from "../../../api/booking-deposit.api";
import { cancelBookingFromClient, upsertServiceReviewFromClient } from "../../../api/booking.api";
import { getBookingRefundRequestsByBookingCode } from "../../../api/bookingRefund.api";
import type { BookingRefundResponse } from "../../../api/bookingRefund.api";
import { uploadImagesToCloudinary } from "../../../api/uploadCloudinary.api";
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

const getPaymentStatusValueNode = (paymentStatus?: string | null) => {
    switch (String(paymentStatus ?? "").toUpperCase()) {
        case "PAID":
            return <span className="font-[600] text-[#059669]">Đã thanh toán</span>;
        case "PARTIAL":
            return <span className="font-[600] text-[#b45309]">Thanh toán một phần</span>;
        case "REFUNDED":
            return <span className="font-[600] text-[#dc2626]">Đã hoàn tiền</span>;
        case "PENDING":
        default:
            return <span className="font-[600] text-[#d97706]">Chưa thanh toán</span>;
    }
};

const isServiceReviewed = (svc?: ClientBookingPetServiceDetail | null) =>
    Boolean(
        svc &&
        (
            (svc.customerRating != null && Number(svc.customerRating) > 0) ||
            (svc.customerReview != null && String(svc.customerReview).trim() !== "")
        )
    );

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
        case "WAITING_STAFF": return "Chờ nhân viên xử lý";
        case "IN_PROGRESS": return "Đang thực hiện";
        case "PET_IN_HOTEL": return "Đã đưa thú cưng vào hotel";
        case "COMPLETED": return "Hoàn tất";
        case "CANCELLED": return "Đã hủy";
        default: return s;
    }
};

/** Sau cọc PayOS: bỏ query return (tránh postMessage + reload lặp) rồi reload để đồng bộ toàn trang. */
const refreshBookingPageAfterDeposit = () => {
    try {
        window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    } catch {
        /* ignore */
    }
    window.location.reload();
};

const svcStatusBadgeClass = (s?: string) => {
    switch (String(s ?? "").toUpperCase()) {
        case "COMPLETED":
            return "bg-[#d1fae5] text-[#065f46]";
        case "CANCELLED":
            return "bg-[#fee2e2] text-[#991b1b]";
        case "IN_PROGRESS":
            return "bg-[#dbeafe] text-[#1e40af]";
        case "PET_IN_HOTEL":
            return "bg-[#dcfce7] text-[#166534]";
        case "WAITING_STAFF":
        case "PENDING":
            return "bg-[#fef3c7] text-[#92400e]";
        default:
            return "bg-[#f3f4f6] text-[#374151]";
    }
};

/* ─── Sub-component: Section Header ─── */
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-2 mb-4">
        <h3 className="text-[1rem] font-[700] text-[#111827] tracking-tight">{children}</h3>
    </div>
);

const InfoRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
    <div className="flex gap-2 py-[3px]">
        <span className="font-[600] text-[#374151] shrink-0 min-w-[140px]">{label}:</span>
        <span className="text-[#111827]">{value ?? "—"}</span>
    </div>
);

type ActiveView = "detail" | "payment";

/* ─── Main component ─── */
export const BookingClientDetailPage = () => {
    const { bookingCode } = useParams<{ bookingCode: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const [booking, setBooking] = useState<ClientBookingDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedServiceIds, setExpandedServiceIds] = useState<Record<number, boolean>>({});

    // Automatically open payment view if redirected from booking creation
    const stateOpenPayment = location.state && (location.state as any).openPayment === true;
    const [activeView, setActiveView] = useState<ActiveView>(stateOpenPayment ? "payment" : "detail");

    const [payosCheckoutUrl, setPayosCheckoutUrl] = useState<string | null>(null);
    const [payosLoading, setPayosLoading] = useState(false);
    const [autoCancellingExpired, setAutoCancellingExpired] = useState(false);
    const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

    // When PayOS redirects back inside iframe, notify parent to close popup & refresh
    useEffect(() => {
        const isPopupReturn = searchParams.get("payment_popup") === "1";
        if (!isPopupReturn) return;
        const depositId = searchParams.get("depositId");
        try {
            (window.parent ?? window).postMessage(
                { type: "PAYOS_DEPOSIT_RETURN", depositId },
                "*"
            );
        } catch (e) {
            console.error("postMessage failed:", e);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams.toString()]);

    useEffect(() => {
        let pollTimer: any = null;
        const onMessage = (event: MessageEvent) => {
            const data = event?.data;
            if (!data || data.type !== "PAYOS_DEPOSIT_RETURN") return;
            setPayosCheckoutUrl(null);
            setActiveView("detail");

            const startedAt = Date.now();
            const tick = async () => {
                try {
                    const next = await fetchData();
                    const paid = Boolean(next?.depositPaid);
                    const status = String(next?.status ?? "").toUpperCase();
                    const depStatus = String(next?.depositStatus ?? "").toUpperCase();

                    if (paid || status === "CONFIRMED") {
                        toast.success("Thanh toán cọc thành công!");
                        refreshBookingPageAfterDeposit();
                        return;
                    }

                    if (status === "CANCELLED" || depStatus === "FAILED") {
                        toast.error("Thanh toán cọc không thành công hoặc đã bị hủy.");
                        setActiveView("detail");
                        return;
                    }
                } catch {
                    // ignore transient errors
                }
                if (Date.now() - startedAt > 60_000) {
                    toast.info("Hệ thống đang xử lý thanh toán. Vui lòng đợi thêm hoặc tải lại trang.");
                    return;
                }
                pollTimer = setTimeout(tick, 2500);
            };
            pollTimer = setTimeout(tick, 800);
        };
        window.addEventListener("message", onMessage);
        return () => {
            window.removeEventListener("message", onMessage);
            if (pollTimer) clearTimeout(pollTimer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingCode]);

    // Cancel modal state
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [bookingRefunds, setBookingRefunds] = useState<BookingRefundResponse[]>([]);
    const [reviewDraftMap, setReviewDraftMap] = useState<Record<number, { customerRating: number; customerReview: string }>>({});
    const [reviewPhotosMap, setReviewPhotosMap] = useState<Record<number, string[]>>({});
    const [reviewUploadingMap, setReviewUploadingMap] = useState<Record<number, boolean>>({});
    const [reviewSavingMap, setReviewSavingMap] = useState<Record<number, boolean>>({});
    const [reviewCarouselIndex, setReviewCarouselIndex] = useState(0);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    const latestRefundWithAdminReply = useMemo(() => {
        const withReply = bookingRefunds.filter(
            (r) => r.processedAt != null && String(r.processedAt).trim() !== ""
        );
        if (withReply.length === 0) return null;
        return [...withReply].sort(
            (a, b) => new Date(b.processedAt!).getTime() - new Date(a.processedAt!).getTime()
        )[0];
    }, [bookingRefunds]);

    const refundSeenStorageKey = booking ? `teddypet_br_refund_seen_${booking.id}` : null;
    const showRefundDot =
        Boolean(booking?.depositPaid && latestRefundWithAdminReply && refundSeenStorageKey) &&
        typeof window !== "undefined" &&
        localStorage.getItem(refundSeenStorageKey!) !== String(latestRefundWithAdminReply!.id);

    // Countdown timer
    const expiresAt = booking?.depositExpiresAt ? dayjs(booking.depositExpiresAt) : null;
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

    const fetchData = async (): Promise<ClientBookingDetailResponse | null> => {
        if (!bookingCode) return null;
        try {
            const res = await apiApp.get<{ data: ClientBookingDetailResponse }>(`/api/bookings/code/${bookingCode}`);
            const next = res.data.data;
            setBooking(next);
            if (next?.bookingCode) {
                try {
                    const rr = await getBookingRefundRequestsByBookingCode(next.bookingCode);
                    setBookingRefunds(rr?.data ?? []);
                } catch {
                    setBookingRefunds([]);
                }
            } else {
                setBookingRefunds([]);
            }
            return next;
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
        return null;
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingCode]);

    const handleReviewPhotosChange = async (serviceId: number, files: FileList | null) => {
        if (!files || files.length === 0) return;
        
        const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (validFiles.length === 0) {
            toast.warning("Vui lòng chọn file hình ảnh.");
            return;
        }

        try {
            setReviewUploadingMap(prev => ({ ...prev, [serviceId]: true }));
            const urls = await uploadImagesToCloudinary(validFiles, "booking-reviews");
            setReviewPhotosMap(prev => ({
                ...prev,
                [serviceId]: [...(prev[serviceId] || []), ...urls]
            }));
        } catch (error: any) {
            toast.error(error.message || "Không thể tải ảnh lên.");
        } finally {
            setReviewUploadingMap(prev => ({ ...prev, [serviceId]: false }));
        }
    };

    const handleRemoveReviewPhoto = (serviceId: number, photoUrl: string) => {
        setReviewPhotosMap(prev => ({
            ...prev,
            [serviceId]: (prev[serviceId] || []).filter(url => url !== photoUrl)
        }));
    };

    // Auto-switch to detail view if booking is already paid or has wrong status for payment view
    useEffect(() => {
        if (booking && (booking.depositPaid || booking.status !== "PENDING" || !booking.depositId)) {
            setActiveView("detail");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [booking]);

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
    const showDepositTimer = booking && !booking.depositPaid && booking.depositId && booking.depositExpiresAt;

    // Poll the backend periodically as long as the timer is showing to catch successful PayOS webhook without redirect
    useEffect(() => {
        if (!showDepositTimer || isExpired) return;
        const pollTimer = setInterval(async () => {
            try {
                const next = await fetchData();
                if (next && (next.depositPaid || next.status !== "PENDING")) {
                    toast.success("Đã nhận thanh toán cọc tự động.");
                    refreshBookingPageAfterDeposit();
                }
            } catch (e) {
                // ignore transient errors
            }
        }, 5000);
        return () => clearInterval(pollTimer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showDepositTimer, isExpired, fetchData]);

    const formattedRemaining = useMemo(() => {
        if (remainingSeconds == null) return "—";
        const m = Math.floor(remainingSeconds / 60);
        const s = remainingSeconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    }, [remainingSeconds]);
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
    const isWalkInBooking = String(booking?.bookingType ?? "").toUpperCase() === "WALK_IN";

    const reviewServices = useMemo(() => {
        if (!booking?.pets) return [] as Array<{ petName: string; service: ClientBookingPetServiceDetail }>;
        return booking.pets.flatMap((pet) =>
            (pet.services ?? [])
                .filter((svc) => String(svc.status ?? "").toUpperCase() !== "CANCELLED")
                .map((svc) => ({
                    petName: pet.petName ?? "Thú cưng",
                    service: svc,
                }))
        );
    }, [booking?.pets]);
    const activeReviewEntry = reviewServices[reviewCarouselIndex] ?? null;
    const activeReviewService = activeReviewEntry?.service;
    const activeReviewDraft = activeReviewService
        ? (reviewDraftMap[activeReviewService.id] ?? {
            customerRating: activeReviewService.customerRating ?? 5,
            customerReview: activeReviewService.customerReview ?? "",
        })
        : null;
    const activeReviewDisabled =
        !activeReviewService ||
        booking?.status !== "COMPLETED" ||
        String(activeReviewService.status ?? "").toUpperCase() === "CANCELLED";
    const activeReviewLocked = activeReviewService ? isServiceReviewed(activeReviewService) : false;
    const activeReviewSaving = activeReviewService ? !!reviewSavingMap[activeReviewService.id] : false;

    /** Hiển thị "Hủy đơn" / "Yêu cầu hoàn tiền": không giới hạn chỉ CONFIRMED — đơn PENDING sau khi cọc vẫn cần nút (kể cả đã gửi yêu cầu chờ duyệt). */
    const canRequestRefundOrCancel = useMemo(() => {
        if (!booking) return false;
        if (isWalkInBooking) return false;
        if (!booking.depositPaid) {
            return booking.status === "PENDING" && !isExpired;
        }
        if (booking.status === "CANCELLED" || booking.status === "COMPLETED") return false;
        return (
            booking.status === "PENDING" ||
            booking.status === "CONFIRMED" ||
            booking.status === "IN_PROGRESS" ||
            booking.cancelRequested === true
        );
    }, [booking, isWalkInBooking, isExpired]);

    useEffect(() => {
        if (!reviewServices.length) {
            setReviewCarouselIndex(0);
            return;
        }
        const firstUnreviewedIdx = reviewServices.findIndex((x) => !isServiceReviewed(x.service));
        const nextIdx = firstUnreviewedIdx >= 0 ? firstUnreviewedIdx : 0;
        setReviewCarouselIndex((prev) => {
            if (prev >= 0 && prev < reviewServices.length) return prev;
            return nextIdx;
        });
    }, [reviewServices]);

    // Auto-cancel booking when deposit expires (PayOS iframe cannot be controlled cross-origin)
    useEffect(() => {
        if (!booking) return;
        if (!isExpired) return;
        if (autoCancellingExpired) return;
        if (booking.depositPaid) return;
        if (String(booking.status ?? "").toUpperCase() !== "PENDING") return;
        if (String(booking.paymentStatus ?? "").toUpperCase() !== "PENDING") return;

        setAutoCancellingExpired(true);
        (async () => {
            try {
                const res = await cancelBookingFromClient(booking.bookingCode, { reason: "Hết hạn thanh toán cọc" });
                if ((res as any)?.success) {
                    toast.info("Đơn đặt lịch đã bị hủy do hết hạn thanh toán cọc.", { autoClose: 4500 });
                } else {
                    toast.error((res as any)?.message ?? "Không thể tự động hủy đơn khi hết hạn.");
                }
            } catch (e) {
                console.error("Auto-cancel booking failed:", e);
                toast.error("Không thể tự động hủy đơn khi hết hạn. Vui lòng tải lại trang.");
            } finally {
                setPayosCheckoutUrl(null);
                setActiveView("detail");
                await fetchData();
                setAutoCancellingExpired(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isExpired, booking?.bookingCode, booking?.status, booking?.paymentStatus, booking?.depositPaid, booking?.depositId, autoCancellingExpired]);

    const openPayosDepositInline = async () => {
        if (!booking?.depositId || isExpired) {
            toast.error("Giữ chỗ đã hết hạn. Vui lòng quay lại đặt lịch và chọn lại phòng/khung giờ.");
            return;
        }
        try {
            if (activeView !== "payment") setActiveView("payment");
            setPayosLoading(true);
            const base = window.location.origin;
            const returnUrl = `${base}${location.pathname}?payment_popup=1&depositId=${booking.depositId}`;
            const res = await createBookingDepositPayosUrl(booking.depositId, returnUrl);
            const url = (res as any)?.data?.checkoutUrl as string | undefined;
            if (!url) {
                toast.error(res?.message ?? "Không thể tạo link thanh toán PayOS.");
                return;
            }
            setPayosCheckoutUrl(url);
        } catch (e: any) {
            console.error(e);
            toast.error(e?.response?.data?.message ?? e?.message ?? "Không thể tạo link PayOS.");
        } finally {
            setPayosLoading(false);
        }
    };

    // Auto-show PayOS iframe as soon as user is on payment view
    useEffect(() => {
        if (activeView !== "payment") return;
        if (!booking?.depositId) return;
        if (booking.depositPaid) return;
        if (isExpired) return;
        if (payosCheckoutUrl) return;
        if (payosLoading) return;
        openPayosDepositInline();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeView, booking?.depositId, booking?.depositPaid, isExpired, payosCheckoutUrl, payosLoading]);

    /* ─── Render helpers for deep data ─── */
    const renderServiceItems = (items?: ClientBookingPetServiceItemDetail[]) => {
        if (!items || items.length === 0) return null;
        return (
            <div className="mt-2">
                <div className="text-[0.7812rem] font-[600] text-[#6366f1] mb-1">Dịch vụ add-on:</div>
                <div className="space-y-1">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 text-[0.7812rem] text-[#374151] bg-[#f5f3ff] px-3 py-1 rounded-[8px]">
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
        const isExpanded = !!expandedServiceIds[svc.id];
        const parseJsonStringArray = (raw?: string) => {
            if (!raw) return [] as string[];
            const s = raw.trim();
            if (!s) return [] as string[];
            if (!s.startsWith("[")) return [s];
            try {
                const arr = JSON.parse(s) as string[];
                return Array.isArray(arr) ? arr.filter((v) => typeof v === "string" && v.trim()) : [];
            } catch {
                return [];
            }
        };
        const beforePhotos = parseJsonStringArray(svc.beforePhotos);
        const duringPhotos = parseJsonStringArray(svc.duringPhotos);
        const afterPhotos = parseJsonStringArray(svc.afterPhotos);
        const hasStaffUpdate = Boolean(
            (svc.staffNotes && svc.staffNotes.trim()) ||
            beforePhotos.length ||
            duringPhotos.length ||
            afterPhotos.length ||
            svc.actualStartTime ||
            svc.actualEndTime
        );
        return (
            <div key={svc.id} className="rounded-[12px] border border-[#e5e7eb] bg-white px-4 py-3 shadow-sm mb-3">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[0.8438rem] font-[700] text-[#4338ca]">
                        {`Dịch vụ ${idx + 1}: `}
                        <span className="text-[#111827]">{svc.serviceName ?? "—"}</span>
                    </span>
                    <span className={`text-[0.7188rem] font-[600] px-2 py-0.5 rounded-[4px] ${svcStatusBadgeClass(svc.status)}`}>
                        {svcStatusLabel(svc.status)}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-[0.8125rem]">
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
                    {(svc.assignedStaffNames || svc.assignedStaffIds?.length) ? (
                        <InfoRow
                            label="Nhân viên phụ trách"
                            value={svc.assignedStaffNames || svc.assignedStaffIds?.map((id) => `#${id}`).join(", ")}
                        />
                    ) : null}
                    <InfoRow label="Đơn giá" value={formatCurrency(svc.basePrice)} />
                    <InfoRow label="Thành tiền" value={<span className="font-[700] text-[#c45a3a]">{formatCurrency(svc.subtotal)}</span>} />
                </div>

                <div className="mt-2 mb-3">
                    <button
                        type="button"
                        onClick={() =>
                            setExpandedServiceIds((prev) => ({ ...prev, [svc.id]: !prev[svc.id] }))
                        }
                        className="text-[0.7812rem] font-[700] text-[#0f766e] underline hover:text-[#115e59]"
                    >
                        {isExpanded
                            ? "Ẩn chi tiết booking_pet_service"
                            : "Xem chi tiết booking_pet_service (trạng thái & cập nhật nhân viên)"}
                    </button>
                </div>

                {isExpanded && (
                    <div className="mb-3 rounded-[8px] border border-[#d1fae5] bg-[#f0fdf4] p-3 space-y-2">
                        <div className="text-[0.7812rem] font-[700] text-[#065f46]">Thông tin cập nhật từ nhân viên</div>
                        {!hasStaffUpdate ? (
                            <div className="text-[0.75rem] text-[#6b7280]">Chưa có cập nhật chi tiết từ nhân viên.</div>
                        ) : (
                            <>
                                {svc.staffNotes ? <InfoRow label="Ghi chú nhân viên" value={svc.staffNotes} /> : null}
                                {svc.actualStartTime ? <InfoRow label="Bắt đầu thực tế" value={fmtDateTime(svc.actualStartTime)} /> : null}
                                {svc.actualEndTime ? <InfoRow label="Kết thúc thực tế" value={fmtDateTime(svc.actualEndTime)} /> : null}
                                {beforePhotos.length > 0 ? (
                                    <div>
                                        <div className="text-[0.75rem] font-[600] text-[#166534] mb-1">Ảnh trước khi làm</div>
                                        <div className="flex gap-2 flex-wrap">
                                            {beforePhotos.map((u, i) => (
                                                <img 
                                                    key={`before-${svc.id}-${i}`} 
                                                    src={u} 
                                                    className="w-16 h-16 rounded border object-cover cursor-pointer hover:opacity-80 hover:scale-105 transition-all" 
                                                    onClick={() => setZoomedImage(u)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                                {duringPhotos.length > 0 ? (
                                    <div>
                                        <div className="text-[0.75rem] font-[600] text-[#166534] mb-1">Ảnh trong lúc làm</div>
                                        <div className="flex gap-2 flex-wrap">
                                            {duringPhotos.map((u, i) => (
                                                <img 
                                                    key={`during-${svc.id}-${i}`} 
                                                    src={u} 
                                                    className="w-16 h-16 rounded border object-cover cursor-pointer hover:opacity-80 hover:scale-105 transition-all" 
                                                    onClick={() => setZoomedImage(u)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                                {afterPhotos.length > 0 ? (
                                    <div>
                                        <div className="text-[0.75rem] font-[600] text-[#166534] mb-1">Ảnh sau khi làm</div>
                                        <div className="flex gap-2 flex-wrap">
                                            {afterPhotos.map((u, i) => (
                                                <img 
                                                    key={`after-${svc.id}-${i}`} 
                                                    src={u} 
                                                    className="w-16 h-16 rounded border object-cover cursor-pointer hover:opacity-80 hover:scale-105 transition-all" 
                                                    onClick={() => setZoomedImage(u)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </>
                        )}
                    </div>
                )}

                {hasRoom && (
                    <div className="mt-2 p-2.5 rounded-[8px] bg-[#f0fdf4] border border-[#bbf7d0]">
                        <div className="flex items-center justify-between mb-1">
                            <div className="text-[0.75rem] font-[600] text-[#166534]">Căn phòng đã xếp</div>
                            {svc.roomId && (
                                <button
                                    type="button"
                                    onClick={() => navigate(`/dat-lich/phong/${svc.roomId}`)}
                                    className="text-[0.75rem] font-[600] text-[#166534] underline hover:text-[#14532d]"
                                >
                                    Xem chi tiết phòng
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 text-[0.7812rem] text-[#166534]">
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
                <div className="text-[0.8125rem] font-[600] text-[#92400e] mb-2">Thức ăn mang theo:</div>
                <div className="space-y-1.5">
                    {foods.map((food) => (
                        <div key={food.id} className="flex flex-wrap gap-x-4 gap-y-1 text-[0.7812rem] text-[#78350f] bg-[#fffbeb] px-3 py-2 rounded-[8px] border border-[#fde68a]">
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
                <h4 className="text-[0.9062rem] font-[700] text-[#111827]">
                    Thú cưng {idx + 1}: <span className="text-[#c45a3a]">{pet.petName ?? "—"}</span>
                    <span className="ml-2 text-[0.75rem] font-[500] text-[#6b7280]">({petTypeLabel(pet.petType)})</span>
                </h4>
            </div>

            <div className="p-4 space-y-3">
                {/* Pet info row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-[0.8125rem]">
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
                        <div className="text-[0.8125rem] font-[600] text-[#4338ca] mb-2">Dịch vụ đã đăng ký:</div>
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
                            <p className="uppercase tracking-[0.05em] text-[0.75rem] font-[700] text-[#c45a3a]">
                                {activeView === "detail" ? "Chi tiết đơn đặt lịch" : "Thanh toán cọc"}
                            </p>
                            {booking && (
                                <h2 className="mt-1 text-[1.375rem] font-[800] text-[#181818]">
                                    Mã đặt lịch:{" "}
                                    <span className="text-[#c45a3a]">
                                        {booking.bookingCode}
                                    </span>
                                </h2>
                            )}
                            {booking && (
                                <p className="mt-1 text-[0.8438rem] text-[#5f6368] flex items-center">
                                    Trạng thái:{" "}
                                    <span className={`inline-flex items-center px-[8px] py-[4px] rounded-[6px] text-[0.8125rem] font-[700] ml-2 ${getBookingStatusBadgeClass(booking.status)}`}>
                                        {getBookingStatusLabel(booking.status)}
                                    </span>
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Countdown timer */}
                            {showDepositTimer && (
                                <div className={`flex flex-col items-center justify-center px-4 py-2 rounded-[8px] bg-white border ${isExpired ? "border-[#ef4444]" : "border-[#ffe0ce]"}`}>
                                    <div className="text-[0.6875rem] font-[600] text-[#181818]">Giờ còn lại</div>
                                    <div className={`text-[1rem] font-[800] ${isExpired ? "text-[#ef4444]" : "text-[#c45a3a]"}`}>
                                        {isExpired ? "Hết hạn" : formattedRemaining}
                                    </div>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => navigate("/dat-lich")}
                                className="inline-flex items-center justify-center rounded-[999px] border border-[#f1bca1] bg-white text-[#c45a3a] text-[0.8438rem] font-[600] px-[16px] py-[8px] hover:bg-[#ffefe7] transition-colors"
                            >
                                Quay về đặt lịch mới
                            </button>
                        </div>
                    </div>

                    <div className="p-[24px] md:p-[28px] space-y-[20px] text-[0.9375rem] bg-[#fffcfb]">
                        {loading && (
                            <div className="text-[0.9375rem] text-[#6b7280]">
                                Đang tải thông tin đơn đặt lịch...
                            </div>
                        )}
                        {!loading && !booking && (
                            <div className="text-[#ef4444] text-[0.9375rem]">
                                Không tìm thấy đơn đặt lịch.
                            </div>
                        )}

                        {/* =================== DETAIL VIEW =================== */}
                        {booking && activeView === "detail" && (
                            <>
                                {booking.status === "CANCELLED" && booking.cancelledReason && (
                                    <div
                                        className="rounded-[12px] border border-amber-200/90 bg-amber-50/95 px-4 py-3 mb-5 text-[0.875rem] text-[#78350f] shadow-sm"
                                        role="alert"
                                    >
                                        <p className="font-[800] text-[#92400e] mb-1.5">Thông báo đơn đã hủy</p>
                                        <p className="whitespace-pre-wrap leading-relaxed">{booking.cancelledReason}</p>
                                    </div>
                                )}
                                {/* ── Section 1: Booking Info ── */}
                                <SectionTitle>Thông tin đơn đặt lịch</SectionTitle>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                                    {/* Customer info */}
                                    <div className="rounded-[8px] border border-[#f3e0d6] bg-white px-5 py-4">
                                        <p className="text-[0.9375rem] font-[700] text-[#111827] mb-3">
                                            Thông tin khách hàng
                                        </p>
                                        <div className="space-y-1.5 text-[0.875rem] text-[#374151]">
                                            <InfoRow label="Mã đặt lịch" value={<span className="font-[700] text-[#c45a3a]">{booking.bookingCode}</span>} />
                                            <InfoRow label="Họ tên" value={booking.customerName} />
                                            <InfoRow label="Email" value={booking.customerEmail} />
                                            <InfoRow label="Số điện thoại" value={booking.customerPhone} />
                                        </div>
                                    </div>

                                    {/* Status & payment */}
                                    <div className="rounded-[8px] border border-[#e5f2ec] bg-[#f8fffb] px-5 py-4">
                                        <p className="text-[0.9375rem] font-[700] text-[#065f46] mb-3">
                                            Trạng thái & thanh toán
                                        </p>
                                        <div className="space-y-1.5 text-[0.875rem] text-[#064e3b]">
                                            <InfoRow label="Trạng thái đặt lịch" value={<span className={`inline-flex items-center px-[8px] py-[3px] rounded-[6px] text-[0.7812rem] font-[700] ${getBookingStatusBadgeClass(booking.status)}`}>{getBookingStatusLabel(booking.status)}</span>} />
                                            {isWalkInBooking ? (
                                                <InfoRow label="Thanh toán" value={getPaymentStatusValueNode(booking.paymentStatus)} />
                                            ) : (
                                                <>
                                                    <InfoRow
                                                        label="Thanh toán cọc"
                                                        value={
                                                            booking.depositPaid
                                                                ? <span className="font-[600] text-[#059669]">Đã thanh toán cọc</span>
                                                                : booking.depositStatus === 'FAILED'
                                                                    ? <span className="font-[600] text-[#dc2626]">Thanh toán thất bại</span>
                                                                    : <span className="font-[600] text-[#d97706]">Chưa thanh toán cọc</span>
                                                        }
                                                    />
                                                    <InfoRow label="Thanh toán" value={getPaymentStatusValueNode(booking.paymentStatus)} />
                                                </>
                                            )}
                                            {!isWalkInBooking && booking.paymentMethod && <InfoRow label="PT thanh toán" value={booking.paymentMethod} />}
                                            <div className="pt-2 space-y-0.5 border-t border-[#d1fae5] mt-2">
                                                <InfoRow label="Tổng tiền" value={<span className="font-[700]">{formatCurrency(booking.totalAmount)}</span>} />
                                                <InfoRow label="Đã thanh toán" value={formatCurrency(booking.paidAmount)} />
                                                <InfoRow label="Còn lại" value={<span className="font-[700] text-[#c45a3a]">{formatCurrency(booking.remainingAmount)}</span>} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Booking dates */}
                                <div className="rounded-[8px] bg-[#f1f5f9] px-5 py-3 text-[0.8438rem] mb-6">
                                    <div className="flex flex-wrap gap-x-8 gap-y-1 text-[#334155]">
                                        <InfoRow label="Thời gian đặt lịch" value={fmtDateTime(booking.createdAt)} />
                                    </div>
                                </div>

                                {/* Deposit payment is handled via PayOS; no inline bank info here */}

                                {/* ── Section 2: Pets ── */}
                                {booking.pets && booking.pets.length > 0 && (
                                    <>
                                        <SectionTitle>Thú cưng ({booking.pets.length})</SectionTitle>
                                        <div className="space-y-4">
                                            {booking.pets.map((pet, idx) => renderPet(pet, idx))}
                                        </div>
                                    </>
                                )}

                                {reviewServices.length > 0 && (
                                    <div className="rounded-[20px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
                                        <div className="flex items-center justify-between mb-6">
                                            <Stack spacing={0.5}>
                                                <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b", fontSize: "1.125rem" }}>
                                                    Đánh giá dịch vụ
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500 }}>
                                                    Cảm ơn bạn đã tin tưởng TeddyPet! Hãy chia sẻ trải nghiệm của bạn nhé.
                                                </Typography>
                                            </Stack>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[0.75rem] font-bold text-[#64748b] bg-[#f1f5f9] px-2 py-1 rounded-md">
                                                    {reviewCarouselIndex + 1} / {reviewServices.length}
                                                </span>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => setReviewCarouselIndex((prev) => (prev - 1 + reviewServices.length) % reviewServices.length)}
                                                    sx={{ border: "1px solid #e2e8f0" }}
                                                >
                                                    <ChevronLeft size={18} />
                                                </IconButton>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => setReviewCarouselIndex((prev) => (prev + 1) % reviewServices.length)}
                                                    sx={{ border: "1px solid #e2e8f0" }}
                                                >
                                                    <ChevronRight size={18} />
                                                </IconButton>
                                            </div>
                                        </div>

                                        {activeReviewService && activeReviewDraft && (
                                            <Box sx={{ bgcolor: "#f8fafc", p: 3, borderRadius: "16px" }}>
                                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                                                    <Box sx={{ p: 1, bgcolor: "#fff", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                                        <Star size={20} fill="#f59e0b" color="#f59e0b" />
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 800, color: "#334155" }}>
                                                            {activeReviewEntry?.petName ?? "Thú cưng"} • {activeReviewService.serviceName ?? "Dịch vụ"}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: "#64748b" }}>
                                                            Trạng thái: {svcStatusLabel(activeReviewService.status)}
                                                        </Typography>
                                                    </Box>
                                                </Stack>

                                                <Stack spacing={3}>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ display: "block", color: "#475569", fontWeight: 700, mb: 1.5, letterSpacing: 0.5 }}>
                                                            ĐIỂM ĐÁNH GIÁ
                                                        </Typography>
                                                        <Rating
                                                            value={activeReviewDraft.customerRating}
                                                            disabled={activeReviewDisabled || activeReviewSaving || activeReviewLocked}
                                                            onChange={(_, newValue) =>
                                                                setReviewDraftMap((prev) => ({
                                                                    ...prev,
                                                                    [activeReviewService.id]: {
                                                                        customerRating: newValue || 5, // fallback to 5 or newValue
                                                                        customerReview: prev[activeReviewService.id]?.customerReview ?? activeReviewService.customerReview ?? "",
                                                                    },
                                                                }))
                                                            }
                                                            size="large"
                                                            sx={{ color: "#f59e0b" }}
                                                            emptyIcon={<Star size={28} style={{ opacity: 0.25 }} />}
                                                            icon={<Star size={28} fill="currentColor" />}
                                                        />
                                                    </Box>

                                                    <Box>
                                                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
                                                            <MessageCircle size={14} color="#64748b" />
                                                            <Typography variant="caption" sx={{ color: "#475569", fontWeight: 700, letterSpacing: 0.5 }}>
                                                                NHẬN XÉT CỦA BẠN
                                                            </Typography>
                                                        </Stack>
                                                        <textarea
                                                            value={activeReviewDraft.customerReview}
                                                            readOnly={activeReviewLocked}
                                                            disabled={activeReviewDisabled || activeReviewSaving || activeReviewLocked}
                                                            rows={4}
                                                            placeholder="Hãy cho chúng tôi biết cảm nhận của bạn về chất lượng dịch vụ nhé..."
                                                            className="w-full rounded-[14px] border border-[#e2e8f0] bg-white p-4 text-[0.875rem] text-[#1e293b] focus:border-[#4338ca] focus:ring-2 focus:ring-[#4338ca1a] transition-all outline-none resize-none disabled:bg-slate-50 disabled:text-slate-400"
                                                        />
                                                    </Box>

                                                    <Box>
                                                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1.5 }}>
                                                            <Camera size={14} color="#64748b" />
                                                            <Typography variant="caption" sx={{ color: "#475569", fontWeight: 700, letterSpacing: 0.5 }}>
                                                                HÌNH ẢNH MINH HỌA
                                                            </Typography>
                                                        </Stack>
                                                        
                                                        <div className="flex flex-wrap gap-3">
                                                            {(reviewPhotosMap[activeReviewService.id] || []).map((url, i) => (
                                                                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden group border border-[#e2e8f0]">
                                                                    <img 
                                                                        src={url} 
                                                                        alt="Review" 
                                                                        className="w-full h-full object-cover cursor-pointer"
                                                                        onClick={() => setZoomedImage(url)}
                                                                    />
                                                                    {!activeReviewLocked && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveReviewPhoto(activeReviewService.id, url)}
                                                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                            
                                                            {!activeReviewLocked && (
                                                                <label className={`w-20 h-20 flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
                                                                    reviewUploadingMap[activeReviewService.id] 
                                                                        ? "border-slate-200 bg-slate-50" 
                                                                        : "border-[#e2e8f0] bg-white hover:border-[#0f766e] hover:bg-[#f0fdfa]"
                                                                }`}>
                                                                    <input 
                                                                        type="file" 
                                                                        multiple 
                                                                        accept="image/*" 
                                                                        className="hidden" 
                                                                        onChange={(e) => handleReviewPhotosChange(activeReviewService.id, e.target.files)}
                                                                        disabled={reviewUploadingMap[activeReviewService.id]}
                                                                    />
                                                                    {reviewUploadingMap[activeReviewService.id] ? (
                                                                        <div className="w-5 h-5 border-2 border-[#0f766e]/30 border-t-[#0f766e] rounded-full animate-spin"></div>
                                                                    ) : (
                                                                        <>
                                                                            <Plus size={20} className="text-[#64748b]" />
                                                                            <span className="text-[0.625rem] font-bold text-[#64748b] mt-1">THÊM ẢNH</span>
                                                                        </>
                                                                    )}
                                                                </label>
                                                            )}
                                                        </div>
                                                    </Box>
                                                </Stack>

                                                <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
                                                    <button
                                                        type="button"
                                                        disabled={activeReviewDisabled || activeReviewSaving || activeReviewLocked || !bookingCode}
                                                        onClick={async () => {
                                                            if (!bookingCode || !activeReviewService) return;
                                                            try {
                                                                setReviewSavingMap((prev) => ({ ...prev, [activeReviewService.id]: true }));
                                                                const payload = {
                                                                    customerRating: activeReviewDraft.customerRating,
                                                                    customerReview: activeReviewDraft.customerReview?.trim() || undefined,
                                                                    customerPhotos: reviewPhotosMap[activeReviewService.id] || [],
                                                                };
                                                                const res = await upsertServiceReviewFromClient(bookingCode, activeReviewService.id, payload);
                                                                const nextBooking = res.data;
                                                                setBooking(nextBooking);
                                                                toast.success("Cảm ơn bạn đã gửi đánh giá dịch vụ!");

                                                                const flattened = (nextBooking.pets ?? []).flatMap((p) =>
                                                                    (p.services ?? [])
                                                                        .filter((svc) => String(svc.status ?? "").toUpperCase() !== "CANCELLED")
                                                                        .map((svc) => ({ service: svc }))
                                                                );
                                                                if (flattened.length > 0) {
                                                                    const currentIdx = flattened.findIndex((x) => x.service.id === activeReviewService.id);
                                                                    const total = flattened.length;
                                                                    let target = currentIdx >= 0 ? currentIdx : 0;
                                                                    for (let step = 1; step <= total; step += 1) {
                                                                        const idx = (target + step) % total;
                                                                        if (!isServiceReviewed(flattened[idx].service)) {
                                                                            target = idx;
                                                                            break;
                                                                        }
                                                                        if (step === total) {
                                                                            target = idx;
                                                                        }
                                                                    }
                                                                    setReviewCarouselIndex(target);
                                                                }
                                                            } catch (e: any) {
                                                                toast.error(e?.response?.data?.message ?? "Không thể lưu đánh giá dịch vụ.");
                                                            } finally {
                                                                setReviewSavingMap((prev) => ({ ...prev, [activeReviewService.id]: false }));
                                                            }
                                                        }}
                                                        className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#0f766e] px-6 py-3 text-[0.875rem] font-extrabold text-white hover:bg-[#115e59] shadow-lg shadow-[#0f766e2a] transition-all transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                                    >
                                                        {activeReviewSaving ? (
                                                            <>
                                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                                Đang gửi...
                                                            </>
                                                        ) : (
                                                            "Lưu đánh giá"
                                                        )}
                                                    </button>
                                                    {activeReviewDisabled ? (
                                                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "#f59e0b" }}>
                                                            <AlertCircle size={14} />
                                                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                                                Đề chờ booking hoàn tất để đánh giá nhé!
                                                            </Typography>
                                                        </Stack>
                                                    ) : activeReviewLocked ? (
                                                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "#64748b" }}>
                                                            <AlertCircle size={14} />
                                                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                                                Bạn đã gửi đánh giá cho dịch vụ này.
                                                            </Typography>
                                                        </Stack>
                                                    ) : null}
                                                </div>
                                            </Box>
                                        )}
                                    </div>
                                )}

                                {/* Action bar */}
                                <div className="pt-4 mt-6 border-t border-[#f1f1f1] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        {booking && !isWalkInBooking && booking.status === "PENDING" && booking.paymentStatus === "PENDING" && !booking.depositPaid && booking.depositId && (!isExpired || booking.depositStatus === 'FAILED') && (
                                            <button
                                                type="button"
                                                onClick={openPayosDepositInline}
                                                className="inline-flex items-center justify-center rounded-[8px] bg-[#4CAF50] text-[#fff] font-[600] text-[0.875rem] px-[20px] py-[10px] hover:bg-[#45a049] transition-colors"
                                            >
                                                {booking.depositStatus === 'FAILED' ? "Thanh toán lại" : "Thanh toán cọc ngay"}
                                            </button>
                                        )}
                                        {booking &&
                                            ["PENDING", "CONFIRMED"].includes(String(booking.status ?? "").toUpperCase()) &&
                                            !isExpired && (
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
                                                className="inline-flex items-center justify-center rounded-[8px] bg-[#ffbaa0] text-[#181818] font-[600] text-[0.875rem] px-[20px] py-[10px] hover:bg-[#e6a890] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Chỉnh sửa thông tin
                                            </button>
                                        )}
                                        {canRequestRefundOrCancel && booking && (
                                            <span className="relative inline-flex">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (
                                                            latestRefundWithAdminReply &&
                                                            refundSeenStorageKey &&
                                                            booking.depositPaid
                                                        ) {
                                                            localStorage.setItem(
                                                                refundSeenStorageKey,
                                                                String(latestRefundWithAdminReply.id)
                                                            );
                                                        }
                                                        setIsCancelModalOpen(true);
                                                    }}
                                                    className="inline-flex items-center justify-center rounded-[8px] bg-white border border-[#ef4444] text-[#ef4444] font-[600] text-[0.875rem] px-[20px] py-[10px] hover:bg-[#fef2f2] transition-colors"
                                                >
                                                    {booking.depositPaid && !isWalkInBooking ? "Yêu cầu hoàn tiền" : "Hủy đơn đặt lịch"}
                                                </button>
                                                {booking.depositPaid && !isWalkInBooking && showRefundDot ? (
                                                    <span
                                                        className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"
                                                        title="Admin đã phản hồi yêu cầu hoàn tiền"
                                                        aria-label="Có phản hồi từ admin"
                                                    />
                                                ) : null}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* =================== PAYMENT VIEW (INLINE) =================== */}
                        {booking && activeView === "payment" && (
                            <>
                                <div className="rounded-[12px] bg-white border border-[#f1f1f1] p-5">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <div>
                                            <p className="text-[#111827] font-[800]">Thanh toán cọc</p>
                                            <p className="text-[#6b7280] text-[0.875rem]">
                                                Quét mã QR/chuyển khoản trong khung PayOS bên dưới. Sau khi thanh toán xong hệ thống sẽ tự cập nhật.
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setActiveView("detail")}
                                                className="py-[10px] px-[16px] rounded-[10px] border border-[#ddd] bg-white text-[#181818] font-[700] text-[0.875rem] hover:bg-[#f5f5f5] transition-colors"
                                            >
                                                Quay lại chi tiết
                                            </button>
                                        </div>
                                    </div>

                                    {!payosCheckoutUrl ? (
                                        <div className="mt-3 rounded-[14px] overflow-hidden border border-[#e5e7eb] bg-[#fafafa] flex items-center justify-center h-[72vh]">
                                            <div className="text-[#6b7280] text-[0.9rem] font-[600]">
                                                {autoCancellingExpired
                                                    ? "Giữ chỗ đã hết hạn. Đang hủy đơn và cập nhật trạng thái..."
                                                    : payosLoading
                                                        ? "Đang tải màn hình PayOS..."
                                                        : "Đang chuẩn bị thanh toán..."}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-3 rounded-[14px] overflow-hidden border border-[#e5e7eb] bg-[#fafafa]">
                                            <iframe
                                                src={payosCheckoutUrl}
                                                title="Thanh toán PayOS"
                                                className="w-full h-[72vh] border-0"
                                                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                                            />
                                        </div>
                                    )}

                                    <div className="pt-4 mt-4 border-t border-[#e5e7eb]">
                                        <div className="space-y-1.5 text-[0.875rem] text-[#374151]">
                                            <InfoRow label="Tổng tiền" value={<span className="font-[700]">{formatCurrency(booking.totalAmount)}</span>} />
                                            <InfoRow label="Đã thanh toán" value={formatCurrency(booking.paidAmount)} />
                                            <InfoRow label="Còn lại" value={<span className="font-[700] text-[#c45a3a]">{formatCurrency(booking.remainingAmount)}</span>} />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* PayOS is rendered inline inside the payment view */}
            
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

            <Dialog
                open={Boolean(zoomedImage)}
                onClose={() => setZoomedImage(null)}
                maxWidth="lg"
                PaperProps={{
                    sx: {
                        bgcolor: 'transparent',
                        boxShadow: 'none',
                        overflow: 'hidden',
                        m: 2,
                    }
                }}
            >
                <DialogContent sx={{ p: 0, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <IconButton
                        onClick={() => setZoomedImage(null)}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            color: 'white',
                            bgcolor: 'rgba(0,0,0,0.5)',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                            zIndex: 1,
                        }}
                    >
                        <X size={24} />
                    </IconButton>
                    {zoomedImage && (
                        <img
                            src={zoomedImage}
                            alt="Zoomed"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '90vh',
                                borderRadius: '8px',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                                objectFit: 'contain',
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <FooterSub />
        </div>
    );
};
