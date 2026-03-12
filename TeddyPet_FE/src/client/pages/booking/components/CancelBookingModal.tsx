import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import type { ClientBookingDetailResponse } from "../../../../types/booking.type";
import { cancelBookingFromClient } from "../../../../api/booking.api";
import { getActiveBookingDepositRefundPolicies } from "../../../../api/booking-deposit-refund-policy.api";
import type { BookingDepositRefundPolicyResponse } from "../../../../api/booking-deposit-refund-policy.api";

interface CancelBookingModalProps {
    booking: ClientBookingDetailResponse;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CancelBookingModal = ({ booking, open, onClose, onSuccess }: CancelBookingModalProps) => {
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState("");
    
    // Bank info state
    const [bankName, setBankName] = useState("");
    const [bankCode, setBankCode] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountHolderName, setAccountHolderName] = useState("");

    const [policy, setPolicy] = useState<BookingDepositRefundPolicyResponse | null>(null);

    useEffect(() => {
        if (open && booking.depositPaid) {
            getActiveBookingDepositRefundPolicies()
                .then(res => {
                    if (res?.data && res.data.length > 0) {
                        // Assuming the first one or default one is what we want
                        const defaultPolicy = res.data.find(p => p.isDefault) || res.data[0];
                        setPolicy(defaultPolicy);
                    }
                })
                .catch(() => {
                    toast.error("Không thể tải chính sách hoàn cọc.");
                });
        }
    }, [open, booking.depositPaid]);

    // Calculate refund percentage
    const { refundPercentage, hoursDiff } = useMemo(() => {
        if (!policy) return { refundPercentage: 0, hoursDiff: 0 };

        // Find earliest check-in date
        const dates: Date[] = [];
        booking.pets?.forEach(pet => {
            pet.services?.forEach(svc => {
                if (svc.estimatedCheckInDate) {
                    dates.push(new Date(svc.estimatedCheckInDate));
                }
                if (svc.scheduledStartTime) {
                    dates.push(new Date(svc.scheduledStartTime));
                }
            });
        });

        if (dates.length === 0) return { refundPercentage: 0, hoursDiff: 0 };
        
        const earliest = dates.reduce((a, b) => a < b ? a : b);
        const now = new Date();
        const diffMs = earliest.getTime() - now.getTime();
        const diffHours = Math.max(0, diffMs / (1000 * 60 * 60));

        let percentage = 0;
        if (diffHours >= policy.fullRefundHours) {
            percentage = policy.fullRefundPercentage;
        } else if (diffHours >= policy.partialRefundHours) {
            percentage = policy.partialRefundPercentage;
        } else if (diffHours >= policy.noRefundHours) {
            percentage = policy.noRefundPercentage;
        }

        return { refundPercentage: percentage, hoursDiff: diffHours };
    }, [booking, policy]);

    const estimatedRefund = useMemo(() => {
        if (!booking.paidAmount || refundPercentage === 0) return 0;
        return (booking.paidAmount * refundPercentage) / 100;
    }, [booking.paidAmount, refundPercentage]);

    const formatCurrency = (v: number) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Only require bank info when there is refund amount > 0
        if (booking.depositPaid && estimatedRefund > 0) {
            if (!bankName || !bankCode || !accountNumber || !accountHolderName) {
                toast.error("Vui lòng điền đầy đủ thông tin ngân hàng để nhận hoàn tiền.");
                return;
            }
        }

        setLoading(true);
        try {
            const res = await cancelBookingFromClient(booking.bookingCode, {
                reason: reason.trim() || undefined,
                bankInformation: booking.depositPaid ? {
                    bankName,
                    bankCode,
                    accountNumber,
                    accountHolderName
                } : undefined
            });

            if (res.success) {
                toast.success(
                    booking.depositPaid
                        ? "Đã gửi yêu cầu hủy đơn. Chúng tôi sẽ xác nhận trong thời gian sớm nhất."
                        : "Hủy đơn đặt lịch thành công."
                );
                onSuccess();
                onClose();
            } else {
                toast.error(res.message || "Không thể hủy đơn đặt lịch.");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Đã xảy ra lỗi khi hủy đơn đặt lịch.");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[12px] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-[1.8rem] font-[700] text-gray-900">
                        {booking.depositPaid ? "Gửi yêu cầu hủy đơn" : "Xác nhận hủy đơn"}:{" "}
                        <span className="text-[#c45a3a]">{booking.bookingCode}</span>
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {!booking.depositPaid ? (
                        <div className="mb-6">
                            <p className="text-[1.4rem] text-gray-700 mb-4">
                                Bạn có chắc chắn muốn hủy đơn đặt lịch này không? Hành động này không thể hoàn tác.
                            </p>
                        </div>
                    ) : (
                        <div className="mb-6 space-y-4">
                            <div className="text-[1.35rem] text-gray-700 bg-[#fff5f0] border border-[#f3e0d6] rounded-lg px-4 py-3">
                                Bạn đang gửi <b>yêu cầu hủy đơn</b>. Hệ thống sẽ ghi nhận và nhân viên sẽ xác nhận trong thời gian sớm nhất.
                            </div>
                            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 mb-4">
                                <h4 className="text-[1.5rem] font-[700] text-orange-900 mb-1">
                                    Chính sách hoàn cọc
                                </h4>
                                {policy ? (
                                    <>
                                        <div className="text-[1.3rem] text-orange-800 mb-3">
                                            <div className="font-[700] text-orange-950">{policy.policyName}</div>
                                            {policy.highlightText && (
                                                <div className="mt-1 font-[600]">{policy.highlightText}</div>
                                            )}
                                            {policy.description && (
                                                <div className="mt-1 opacity-90">{policy.description}</div>
                                            )}
                                        </div>
                                        {(() => {
                                            const h = hoursDiff;
                                            const tier =
                                                h >= policy.fullRefundHours ? "FULL" :
                                                h >= policy.partialRefundHours ? "PARTIAL" :
                                                h >= policy.noRefundHours ? "NO_REFUND_TIER" :
                                                "ZERO";
                                            const Row = ({ active, left, right }: { active: boolean; left: string; right: string }) => (
                                                <div className={`flex justify-between px-3 py-2 rounded-md text-[1.3rem] ${active ? "bg-white border border-orange-200" : ""}`}>
                                                    <span>{left}</span>
                                                    <span className="font-[700]">{right}</span>
                                                </div>
                                            );
                                            return (
                                                <div className="space-y-2 text-orange-900">
                                                    <Row
                                                        active={tier === "FULL"}
                                                        left={`Từ ${policy.fullRefundHours} giờ trở lên`}
                                                        right={`Hoàn ${policy.fullRefundPercentage}%`}
                                                    />
                                                    <Row
                                                        active={tier === "PARTIAL"}
                                                        left={`Từ ${policy.partialRefundHours} – dưới ${policy.fullRefundHours} giờ`}
                                                        right={`Hoàn ${policy.partialRefundPercentage}%`}
                                                    />
                                                    <Row
                                                        active={tier === "NO_REFUND_TIER"}
                                                        left={`Từ ${policy.noRefundHours} – dưới ${policy.partialRefundHours} giờ`}
                                                        right={`Hoàn ${policy.noRefundPercentage}%`}
                                                    />
                                                    <Row
                                                        active={tier === "ZERO"}
                                                        left={`Dưới ${policy.noRefundHours} giờ`}
                                                        right={`Hoàn 0%`}
                                                    />
                                                </div>
                                            );
                                        })()}
                                    </>
                                ) : (
                                    <p className="text-[1.3rem] text-orange-700">Đang tải chính sách...</p>
                                )}
                            </div>

                            <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex justify-between items-center">
                                <div>
                                    <div className="text-[1.3rem] text-green-800 mb-1">Thời gian đến lúc nhận: ~{Math.floor(hoursDiff)}H</div>
                                    <div className="text-[1.5rem] font-[600] text-green-900">
                                        Tỉ lệ hoàn: {refundPercentage}%
                                    </div>
                                    {refundPercentage === 0 && (
                                        <div className="text-[1.25rem] text-green-800 mt-1">
                                            Theo chính sách hiện tại, bạn sẽ không được hoàn cọc.
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-[1.3rem] text-green-800 mb-1">Số tiền dự kiến hoàn</div>
                                    <div className="text-[1.8rem] font-[700] text-green-700">
                                        {formatCurrency(estimatedRefund)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <form id="cancel-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[1.3rem] font-[500] text-gray-700 mb-1">Lý do hủy (Không bắt buộc)</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-[1.4rem]"
                                rows={3}
                                placeholder="Vui lòng cho chúng tôi biết lý do bạn hủy..."
                            />
                        </div>

                        {booking.depositPaid && estimatedRefund > 0 && (
                            <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                                <h4 className="text-[1.5rem] font-[600] text-gray-900">Thông tin nhận hoàn tiền</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[1.3rem] font-[500] text-gray-700 mb-1">Tên ngân hàng *</label>
                                        <input
                                            required
                                            type="text"
                                            value={bankName}
                                            onChange={(e) => setBankName(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-[1.4rem]"
                                            placeholder="VD: Vietcombank"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[1.3rem] font-[500] text-gray-700 mb-1">Mã ngân hàng (Tùy chọn)</label>
                                        <input
                                            type="text"
                                            value={bankCode}
                                            onChange={(e) => setBankCode(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-[1.4rem]"
                                            placeholder="VD: VCB"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[1.3rem] font-[500] text-gray-700 mb-1">Số tài khoản *</label>
                                        <input
                                            required
                                            type="text"
                                            value={accountNumber}
                                            onChange={(e) => setAccountNumber(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-[1.4rem]"
                                            placeholder="VD: 0123456789"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[1.3rem] font-[500] text-gray-700 mb-1">Tên chủ tài khoản *</label>
                                        <input
                                            required
                                            type="text"
                                            value={accountHolderName}
                                            onChange={(e) => setAccountHolderName(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-[1.4rem] uppercase"
                                            placeholder="VD: NGUYEN VAN A"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-[12px]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-[1.4rem] font-[500] text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Đóng
                    </button>
                    <button
                        type="submit"
                        form="cancel-form"
                        disabled={loading}
                        className="px-4 py-2 text-[1.4rem] font-[500] text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center min-w-[120px]"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            booking.depositPaid ? "Gửi yêu cầu hủy" : "Xác nhận hủy"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
