import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import type { ClientBookingDetailResponse } from "../../../../types/booking.type";
import { cancelBookingFromClient } from "../../../../api/booking.api";
import { apiApp } from "../../../../api";
import { getActiveBookingRefundPolicies } from "../../../../api/booking-deposit-refund-policy.api";
import type { BookingDepositRefundPolicyResponse } from "../../../../api/booking-deposit-refund-policy.api";
import { getBankInformationByBookingCode, createGuestBankInformationByBookingCode } from "../../../../api/bank.api";
import {
    getBookingRefundRequestsByBookingCode,
    type BookingRefundResponse,
} from "../../../../api/bookingRefund.api";
import { DEFAULT_SHOP_PHONE, getSupportPhone } from "../../../../api/settings.api";
import dayjs from "dayjs";

interface CancelBookingModalProps {
    booking: ClientBookingDetailResponse;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CancelBookingModal = ({ booking, open, onClose, onSuccess }: CancelBookingModalProps) => {
    const [loading, setLoading] = useState(false);
    const [waitingForAdmin, setWaitingForAdmin] = useState(false);
    const [refundFeedback, setRefundFeedback] = useState<{
        approved: boolean;
        internalNotes?: string | null;
        cancelledReason?: string | null;
    } | null>(null);
    const [pollError, setPollError] = useState<string | null>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [reason, setReason] = useState("");
    
    // Bank info state
    const [bankName, setBankName] = useState("");
    const [bankCode, setBankCode] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountHolderName, setAccountHolderName] = useState("");
    const [isEditingBankInfo, setIsEditingBankInfo] = useState(false);

    const [policy, setPolicy] = useState<BookingDepositRefundPolicyResponse | null>(null);
    const [isPolicyLoading, setIsPolicyLoading] = useState(false);
    const [policyLoadError, setPolicyLoadError] = useState<string | null>(null);

    // Refund History
    const [history, setHistory] = useState<BookingRefundResponse[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [historyLoadMessage, setHistoryLoadMessage] = useState<string | null>(null);
    const [supportPhone, setSupportPhone] = useState<string>(DEFAULT_SHOP_PHONE);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        if (!booking.bookingCode?.trim()) {
            setHistory([]);
            setHistoryLoadMessage(null);
            return;
        }
        setIsHistoryLoading(true);
        setHistoryLoadMessage(null);
        try {
            const res = await getBookingRefundRequestsByBookingCode(booking.bookingCode);
            if (res.success && res.data) {
                setHistory(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch refund history", err);
            setHistoryLoadMessage("Không thể tải lịch sử yêu cầu hoàn tiền lúc này.");
        } finally {
            setIsHistoryLoading(false);
        }
    }, [booking.bookingCode]);

    const hasApprovedRefund = useMemo(
        () =>
            history.some((h) => {
                const status = String(h.status ?? "").toUpperCase();
                return status === "REFUNDED" || status === "APPROVED";
            }),
        [history]
    );

    const hasPendingRefundRequest = useMemo(
        () =>
            Boolean(booking.depositPaid && booking.cancelRequested) ||
            history.some((h) => String(h.status ?? "").toUpperCase() === "PENDING"),
        [booking.depositPaid, booking.cancelRequested, history]
    );

    const historySortedOldestFirst = useMemo(() => {
        return [...history].sort((a, b) => {
            const ta = a.createdAt ? dayjs(a.createdAt).valueOf() : 0;
            const tb = b.createdAt ? dayjs(b.createdAt).valueOf() : 0;
            return ta - tb;
        });
    }, [history]);

    useEffect(() => {
        if (open) {
            void fetchHistory();
            getSupportPhone()
                .then((phone) => {
                    const fallback = DEFAULT_SHOP_PHONE;
                    setSupportPhone(phone && phone.trim() ? phone.trim() : fallback);
                })
                .catch(() => setSupportPhone(DEFAULT_SHOP_PHONE));
            if (booking.depositPaid) {
                setIsPolicyLoading(true);
                setPolicyLoadError(null);
                getActiveBookingRefundPolicies()
                    .then(res => {
                        if (res?.data && res.data.length > 0) {
                            const defaultPolicy = res.data.find(p => p.isDefault) || res.data[0];
                            setPolicy(defaultPolicy);
                        } else {
                            setPolicy(null);
                            setPolicyLoadError("Hiện chưa có chính sách hoàn tiền.");
                        }
                    })
                    .catch(() => {
                        setPolicy(null);
                        setPolicyLoadError("Không thể tải chính sách.");
                        toast.error("Không thể tải chính sách hoàn tiền.");
                    })
                    .finally(() => {
                        setIsPolicyLoading(false);
                    });

                getBankInformationByBookingCode(booking.bookingCode)
                    .then(res => {
                        if (res?.data) {
                            setBankName(res.data.bankName || "");
                            setBankCode(res.data.bankCode || "");
                            setAccountNumber(res.data.accountNumber || "");
                            setAccountHolderName(res.data.accountHolderName || "");
                        }
                    })
                    .catch(err => {
                        console.error("Failed to load bank info", err);
                    });
            }
        }
    }, [open, booking.depositPaid, booking.bookingCode, booking.id, fetchHistory]);

    useEffect(() => {
        if (!open) {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
            setIsEditingBankInfo(false);
            setPolicyLoadError(null);
            setIsPolicyLoading(false);
            setWaitingForAdmin(false);
            setRefundFeedback(null);
            setPollError(null);
            setReason("");
            setHistoryLoadMessage(null);
        }
    }, [open]);

    const { refundPercentage, hoursDiff } = useMemo(() => {
        if (!policy) return { refundPercentage: 0, hoursDiff: 0 };
        const dates: Date[] = [];
        booking.pets?.forEach(pet => {
            pet.services?.forEach(svc => {
                if (svc.estimatedCheckInDate) dates.push(new Date(svc.estimatedCheckInDate));
                if (svc.scheduledStartTime) dates.push(new Date(svc.scheduledStartTime));
            });
        });
        if (dates.length === 0) return { refundPercentage: 0, hoursDiff: 0 };
        const earliest = dates.reduce((a, b) => a < b ? a : b);
        const now = new Date();
        const diffHours = Math.max(0, (earliest.getTime() - now.getTime()) / (1000 * 60 * 60));
        let percentage = 0;
        if (diffHours >= policy.fullRefundHours) percentage = policy.fullRefundPercentage;
        else if (diffHours >= policy.partialRefundHours) percentage = policy.partialRefundPercentage;
        else if (diffHours >= policy.noRefundHours) percentage = policy.noRefundPercentage;
        return { refundPercentage: percentage, hoursDiff: diffHours };
    }, [booking, policy]);

    const estimatedRefund = useMemo(() => {
        if (!booking.paidAmount || refundPercentage === 0) return 0;
        return (booking.paidAmount * refundPercentage) / 100;
    }, [booking.paidAmount, refundPercentage]);

    const isRefundRequest = Boolean(booking.depositPaid && estimatedRefund > 0);

    const formatCurrency = (v: number) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);

    const handleClose = () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        setIsEditingBankInfo(false);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isRefundRequest && (!bankName || !bankCode || !accountNumber || !accountHolderName)) {
            toast.error("Vui lòng điền đủ thông tin ngân hàng.");
            return;
        }
        setLoading(true);
        try {
            if (isRefundRequest) {
                const bankRes = await createGuestBankInformationByBookingCode(booking.bookingCode, {
                    bankName, bankCode, accountNumber, accountHolderName,
                });
                if (!bankRes.success || !bankRes.data?.id) {
                    toast.error("Không thể lưu thông tin ngân hàng.");
                    return;
                }
            }
            const res = await cancelBookingFromClient(booking.bookingCode, {
                reason: reason.trim() || undefined,
                bankInformation: isRefundRequest ? { bankName, bankCode, accountNumber, accountHolderName } : undefined,
            });
            if (res.success) {
                void fetchHistory();
                if (isRefundRequest) {
                    toast.success("Đã gửi yêu cầu. Đang chờ admin duyệt...");
                    onSuccess();
                    setWaitingForAdmin(true);
                    setRefundFeedback(null);
                    setPollError(null);
                    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = setInterval(async () => {
                        try {
                            const res = await apiApp.get<{ data: ClientBookingDetailResponse }>(`/api/bookings/code/${booking.bookingCode}`);
                            const next = res.data?.data;
                            if (next && (next.cancelRequested === false || next.status === "CANCELLED" || next.status === "CONFIRMED")) {
                                setRefundFeedback({ approved: next.status === "CANCELLED", internalNotes: next.internalNotes ?? null, cancelledReason: next.cancelledReason ?? null });
                                setWaitingForAdmin(false);
                                void fetchHistory();
                                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                            }
                        } catch (pollErr) {
                            console.error("Failed to poll booking status", pollErr);
                        }
                    }, 2500);
                } else {
                    toast.success("Hủy đơn thành công.");
                    onSuccess();
                    handleClose();
                }
            } else toast.error(res.message || "Không thể thực hiện.");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Đã xảy ra lỗi.");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[1550px] max-h-[95vh] flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                    <h3 className="text-[1.5rem] font-[800] text-gray-900 tracking-tight">
                        {booking.depositPaid ? (isRefundRequest ? "Yêu cầu hoàn tiền" : "Xác nhận hủy đơn") : "Xác nhận hủy đơn"}:{" "}
                        <span className="text-[#c45a3a]">{booking.bookingCode}</span>
                    </h3>
                    <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-row">
                    {/* COLUMN 1: Policy (28%) */}
                    <div className="w-[28%] p-6 border-r border-gray-100 flex flex-col gap-5 bg-[#fcfcfc] overflow-y-auto">
                        {!booking.depositPaid ? (
                            <div className="bg-amber-50 border border-amber-100 rounded-[12px] p-4 text-amber-800">
                                <p className="text-[0.9375rem] font-[600] leading-relaxed">
                                    Hành động hủy đơn không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục không?
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className={`text-[0.9375rem] leading-relaxed rounded-[12px] px-4 py-3 border ${isRefundRequest ? "bg-[#fff5f0] border-[#f3e0d6] text-gray-800" : "bg-red-50 border-red-100 text-red-800"}`}>
                                    {isRefundRequest ? (
                                        <>Gửi <b className="text-orange-900">yêu cầu hoàn tiền</b>. Admin sẽ phê duyệt trong thời gian sớm nhất.</>
                                    ) : (
                                        <>Bạn đang <b className="text-red-900">xác nhận hủy đơn</b>. Bạn sẽ không được hoàn cọc.</>
                                    )}
                                </div>

                                <div className="bg-white border border-orange-100 rounded-[16px] p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        <h4 className="text-[1.125rem] font-[800] text-gray-900">Chính sách hoàn cọc</h4>
                                    </div>

                                    {isPolicyLoading ? (
                                        <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin"></div></div>
                                    ) : policy ? (
                                        <div className="space-y-4">
                                            <div className="bg-orange-50/40 p-3 rounded-[10px] border border-orange-100/50">
                                                <div className="font-[800] text-orange-950 text-[0.9375rem]">{policy.policyName}</div>
                                                {policy.highlightText && <div className="mt-0.5 font-[700] text-orange-700 text-[0.875rem]">{policy.highlightText}</div>}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                {(() => {
                                                    const h = hoursDiff;
                                                    const tier = h >= policy.fullRefundHours ? "FULL" : h >= policy.partialRefundHours ? "PARTIAL" : h >= policy.noRefundHours ? "NO_REFUND_TIER" : "ZERO";
                                                    const tiers = [
                                                        { id: "FULL", left: `≥${policy.fullRefundHours}H`, right: `${policy.fullRefundPercentage}%` },
                                                        { id: "PARTIAL", left: `${policy.partialRefundHours}H+`, right: `${policy.partialRefundPercentage}%` },
                                                        { id: "NO_REFUND_TIER", left: `${policy.noRefundHours}H+`, right: `${policy.noRefundPercentage}%` },
                                                        { id: "ZERO", left: `<${policy.noRefundHours}H`, right: `0%` }
                                                    ];
                                                    return tiers.map(t => (
                                                        <div key={t.id} className={`flex flex-col justify-center items-center p-2 rounded-[10px] border transition-all ${tier === t.id ? "bg-orange-600 text-white border-orange-600 shadow-md scale-[1.05]" : "bg-white text-gray-700 border-gray-100"}`}>
                                                            <span className="text-[0.7rem] font-[700] uppercase opacity-70 leading-tight">{t.left}</span>
                                                            <span className="text-[0.9375rem] font-[800]">Hoàn {t.right}</span>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-[0.875rem] text-orange-700/80 italic">{policyLoadError || "Chưa có chính sách."}</p>
                                    )}
                                </div>

                                <div className="bg-emerald-50 border border-emerald-100 rounded-[16px] p-5 shadow-sm space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="text-[0.75rem] text-emerald-800/80 font-[800] uppercase tracking-wider mb-1">Thời gian còn lại</div>
                                            <div className="text-[1.25rem] font-[900] text-emerald-950 flex items-baseline gap-1">
                                                ~{Math.floor(hoursDiff)}<span className="text-[0.875rem] font-[700]">Giờ</span>
                                            </div>
                                        </div>
                                        <div className="w-px h-10 bg-emerald-100/50"></div>
                                        <div className="flex-1">
                                            <div className="text-[0.75rem] text-emerald-800/80 font-[800] uppercase tracking-wider mb-1">Dự kiến hoàn</div>
                                            <div className="text-[1.25rem] font-[900] text-emerald-600 truncate">
                                                {formatCurrency(estimatedRefund)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/50 px-3 py-1.5 rounded-full border border-emerald-100/30 text-[0.875rem] font-[700] text-emerald-800">
                                        <span>Tỉ lệ hoàn tiền:</span>
                                        <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full">{refundPercentage}%</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* COLUMN 2: Form & Bank (36%) */}
                    <div className="w-[36%] p-6 flex flex-col gap-6 bg-white overflow-y-auto">
                        <form id="cancel-form" onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[0.9375rem] font-[800] text-gray-800">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Lý do {booking.depositPaid ? "hoàn tiền" : "hủy đơn"}
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    disabled={loading || waitingForAdmin || hasPendingRefundRequest || hasApprovedRefund}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[12px] focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-[0.9375rem] h-[100px] resize-none"
                                    placeholder="Vui lòng để lại lý do..."
                                />
                            </div>

                            {booking.depositPaid && estimatedRefund > 0 && (
                                <div className="space-y-3 pt-2">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-[1.05rem] font-[800] text-gray-900">Thông tin nhận hoàn tiền</h4>
                                        {!isEditingBankInfo && (
                                            <button
                                                type="button"
                                                disabled={loading || waitingForAdmin || hasPendingRefundRequest || hasApprovedRefund}
                                                onClick={() => setIsEditingBankInfo(true)}
                                                className="text-[0.875rem] font-[800] text-orange-600 hover:text-orange-700 py-1 px-2.5 rounded-[6px] hover:bg-orange-50 border border-orange-200 transition-colors"
                                            >
                                                Thay đổi
                                            </button>
                                        )}
                                    </div>

                                    {!isEditingBankInfo ? (
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 bg-gray-50 border border-gray-100 rounded-[16px]">
                                            <div className="space-y-0.5">
                                                <div className="text-[0.7rem] text-gray-400 font-[800] uppercase tracking-wider">Ngân hàng</div>
                                                <div className="text-[0.9375rem] font-[800] text-gray-900 leading-tight">{bankName || "—"}</div>
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="text-[0.7rem] text-gray-400 font-[800] uppercase tracking-wider">Mã CN</div>
                                                <div className="text-[0.9375rem] font-[800] text-gray-900 leading-tight">{bankCode || "—"}</div>
                                            </div>
                                            <div className="col-span-2 w-full h-[1px] bg-gray-200/50"></div>
                                            <div className="space-y-0.5">
                                                <div className="text-[0.7rem] text-gray-400 font-[800] uppercase tracking-wider">Số tài khoản</div>
                                                <div className="text-[0.9375rem] font-[800] text-gray-900">{accountNumber || "—"}</div>
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="text-[0.7rem] text-gray-400 font-[800] uppercase tracking-wider">Chủ tài khoản</div>
                                                <div className="text-[0.9375rem] font-[800] text-gray-900 uppercase">{accountHolderName || "—"}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white border border-orange-100 rounded-[16px] p-4 space-y-3 shadow-sm">
                                            <div className="grid grid-cols-2 gap-3">
                                                <input required type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} disabled={loading || waitingForAdmin || hasPendingRefundRequest || hasApprovedRefund} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[10px] focus:border-orange-500 outline-none text-[0.875rem]" placeholder="Tên ngân hàng *" />
                                                <input type="text" value={bankCode} onChange={(e) => setBankCode(e.target.value)} disabled={loading || waitingForAdmin || hasPendingRefundRequest || hasApprovedRefund} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[10px] focus:border-orange-500 outline-none text-[0.875rem]" placeholder="Mã CN" />
                                                <input required type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} disabled={loading || waitingForAdmin || hasPendingRefundRequest || hasApprovedRefund} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[10px] focus:border-orange-500 outline-none text-[0.875rem]" placeholder="Số tài khoản *" />
                                                <input required type="text" value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} disabled={loading || waitingForAdmin || hasPendingRefundRequest || hasApprovedRefund} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[10px] focus:border-orange-500 outline-none text-[0.875rem] uppercase" placeholder="Họ tên *" />
                                            </div>
                                            <div className="flex gap-2 justify-end pt-1">
                                                <button type="button" onClick={() => setIsEditingBankInfo(false)} className="px-3 py-1.5 text-[0.8125rem] font-[700] text-gray-500 bg-gray-50 rounded-[8px]">Hủy</button>
                                                <button type="button" onClick={() => setIsEditingBankInfo(false)} className="px-4 py-1.5 text-[0.8125rem] font-[800] text-white bg-orange-600 rounded-[8px]">Lưu</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {isRefundRequest && (waitingForAdmin || refundFeedback || pollError) && (
                                <div className={`rounded-[16px] p-4 border flex gap-3 ${pollError ? "bg-red-50 border-red-200 text-red-900" : refundFeedback?.approved ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-sky-50 border-sky-200 text-sky-900"}`}>
                                    <div className="flex-shrink-0 mt-0.5">
                                        {waitingForAdmin && !pollError ? <div className="w-5 h-5 border-2 border-sky-300 border-t-sky-600 rounded-full animate-spin"></div> : (pollError ? "⚠️" : "✅")}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[0.9375rem] font-[900]">
                                            {pollError || (waitingForAdmin ? "Đang xử lý..." : refundFeedback?.approved ? "Chấp thuận!" : "Bị từ chối")}
                                        </div>
                                        {!pollError && waitingForAdmin && <div className="text-[0.8125rem] font-[500] opacity-80">TeddyPet đang xem xét yêu cầu của bạn.</div>}
                                    </div>
                                </div>
                            )}
                            {isRefundRequest && hasApprovedRefund && !waitingForAdmin && (
                                <div className="rounded-[16px] p-4 border bg-emerald-50 border-emerald-200 text-emerald-900 text-[0.875rem]">
                                    <div className="font-[900]">Đã duyệt yêu cầu hoàn tiền từ bạn.</div>
                                    <div className="opacity-90 mt-0.5 font-[500]">
                                        Nếu có thắc mắc vui lòng liên hệ {supportPhone} để được hỗ trợ sớm nhất.
                                    </div>
                                </div>
                            )}
                            {isRefundRequest && hasPendingRefundRequest && !hasApprovedRefund && !waitingForAdmin && (
                                <div className="rounded-[16px] p-4 border bg-amber-50 border-amber-200 text-amber-900 text-[0.875rem]">
                                    <div className="font-[900]">Yêu cầu đang chờ phản hồi.</div>
                                    <div className="opacity-80 mt-0.5 font-[500]">Vui lòng chưa gửi thêm yêu cầu mới lúc này.</div>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* COLUMN 3: History (36%) */}
                    <div className="w-[36%] bg-[#fcfcfc] flex flex-col overflow-hidden border-l border-gray-100">
                        <div className="px-6 py-4 border-b border-gray-200 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-between">
                            <h4 className="text-[1.125rem] font-[800] text-gray-900 tracking-tight">Lịch sử yêu cầu</h4>
                            <span className="px-2 py-0.5 bg-gray-100 rounded-lg text-[0.7rem] font-[800] text-gray-500 uppercase">
                                {history.length} sự kiện
                            </span>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto space-y-5 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
                            {isHistoryLoading ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                                    <div className="w-6 h-6 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
                                    <span className="text-[0.8125rem] font-[700]">Đang tải...</span>
                                </div>
                            ) : historySortedOldestFirst.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400/50 text-center px-10">
                                    <div className="w-16 h-16 bg-gray-50/80 rounded-full flex items-center justify-center mb-3">
                                        <svg className="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <p className="text-[1rem] font-[800] text-gray-300">Trống</p>
                                    <p className="text-[0.8125rem] font-[500] mt-1">{historyLoadMessage || "Yêu cầu của bạn sẽ được lưu ở đây."}</p>
                                </div>
                            ) : (
                                historySortedOldestFirst.map((h) => (
                                    <div key={h.id} className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {/* CUSTOMER MSG */}
                                        <div className="flex flex-col items-end gap-1 ml-10">
                                            <div className="bg-[#c45a3a] text-white px-4 py-2.5 rounded-[18px] rounded-br-[4px] shadow-sm max-w-full">
                                                <div className="text-[0.9375rem] font-[600] leading-snug break-words">{h.customerReason || "Gửi yêu cầu hoàn tiền"}</div>
                                                <div className="text-[0.65rem] mt-1.5 opacity-80 font-[800] text-right uppercase tracking-[0.05em]">
                                                    {dayjs(h.createdAt).format("HH:mm, DD/MM/YYYY")}
                                                </div>
                                            </div>
                                            <div className="text-[0.65rem] font-[800] text-gray-300 uppercase tracking-widest mr-1">Khách hàng</div>
                                        </div>

                                        {/* ADMIN MSG */}
                                        {(() => {
                                            const adminEvidence = (h.adminEvidenceUrls ?? [])
                                                .map((url) => (typeof url === "string" ? url.trim() : ""))
                                                .filter((url) => Boolean(url));
                                            return (h.status !== "PENDING" || h.adminDecisionNote || adminEvidence.length > 0) && (
                                            <div className="flex flex-col items-start gap-1 mr-10">
                                                <div className="bg-white border border-gray-100 text-gray-800 px-4 py-2.5 rounded-[18px] rounded-bl-[4px] shadow-sm max-w-full border-l-4 border-l-orange-500">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className={`px-2 py-0.5 rounded-full text-[0.6rem] font-[900] uppercase tracking-wider ${
                                                            h.status === "APPROVED" || h.status === "REFUNDED" ? "bg-emerald-50 text-emerald-700" :
                                                            h.status === "REJECTED" ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-500"
                                                        }`}>
                                                            {h.status === "REFUNDED" ? "Đã hoàn tiền" : h.status === "APPROVED" ? "Chấp thuận" : h.status === "REJECTED" ? "Từ chối" : "Đang duyệt"}
                                                        </span>
                                                        {h.processedAt && <span className="text-[0.65rem] text-gray-300 font-[700]">{dayjs(h.processedAt).format("HH:mm, DD/MM")}</span>}
                                                    </div>
                                                    <div className="text-[0.875rem] font-[600] leading-relaxed text-gray-700">
                                                        {h.adminDecisionNote || (h.status === "APPROVED" || h.status === "REFUNDED" ? "Hệ thống đã phê duyệt và đang hoàn tiền cho bạn." : "Đang xử lý yêu cầu.")}
                                                    </div>
                                                    {adminEvidence.map((url, idx) => (
                                                        <img
                                                            key={`${h.id}-admin-evidence-${idx}`}
                                                            src={url}
                                                            alt={`Bằng chứng hoàn tiền ${idx + 1}`}
                                                            onClick={() => setSelectedImage(url)}
                                                            title="Nhấn để xem ảnh lớn"
                                                            className="mt-2.5 block max-w-full max-h-[160px] object-contain rounded-[10px] border border-gray-200 bg-gray-50 cursor-pointer hover:opacity-90 transition-opacity"
                                                        />
                                                    ))}
                                                </div>
                                                <div className="text-[0.65rem] font-[800] text-orange-600 uppercase tracking-widest ml-1 opacity-70">TeddyPet Admin</div>
                                            </div>
                                            );
                                        })()}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-end gap-3 z-10">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="px-5 py-2 text-[0.9375rem] font-[800] text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-[12px] transition-all"
                    >
                        Đóng
                    </button>
                    <button
                        type="submit"
                        form="cancel-form"
                        disabled={loading || waitingForAdmin || hasPendingRefundRequest || hasApprovedRefund}
                        className={`px-8 py-2 text-[0.9375rem] font-[900] text-white rounded-[12px] transition-all flex items-center justify-center min-w-[150px] shadow-lg ${
                            loading || waitingForAdmin || hasPendingRefundRequest || hasApprovedRefund ? "bg-gray-300 pointer-events-none" : "bg-[#e53935] hover:bg-[#d32f2f]"
                        }`}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : waitingForAdmin ? (
                            "Đang chờ..."
                        ) : booking.depositPaid ? (
                            isRefundRequest ? "Gửi yêu cầu" : "Hủy đơn ngay"
                        ) : (
                            "Xác nhận hủy"
                        )}
                    </button>
                </div>
            </div>

            {/* Full-Screen Image Lightbox/Preview */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200 cursor-zoom-out"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-6 right-6 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md cursor-pointer"
                        title="Đóng"
                    >
                        <svg className="w-8 h-8 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <img
                        src={selectedImage}
                        alt="Bằng chứng phóng to"
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-[12px] shadow-2xl cursor-default"
                        onClick={(e) => e.stopPropagation()} // Prevent click from closing the modal
                    />
                </div>
            )}
        </div>
    );
};
