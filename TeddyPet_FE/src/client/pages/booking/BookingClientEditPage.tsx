import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { FooterSub } from "../../components/layouts/FooterSub";
import type { ClientBookingDetailResponse, BookingStatus } from "../../../types/booking.type";
import { apiApp } from "../../../api";



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



export const BookingClientEditPage = () => {
    const { bookingCode } = useParams<{ bookingCode: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [booking, setBooking] = useState<ClientBookingDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form fields
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [pets, setPets] = useState<{ id: number, petName: string, emergencyContactName: string, emergencyContactPhone: string }[]>([]);

    // Countdown timer
    const expiresAtParam = searchParams.get("expiresAt");
    const expiresAt = expiresAtParam ? dayjs(expiresAtParam) : null;
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expiresAtParam]);

    const isExpired = useMemo(() => remainingSeconds !== null && remainingSeconds <= 0, [remainingSeconds]);
    const formattedRemaining = useMemo(() => {
        if (remainingSeconds == null) return "—";
        const m = Math.floor(remainingSeconds / 60);
        const s = remainingSeconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    }, [remainingSeconds]);

    useEffect(() => {
        const fetchData = async () => {
            if (!bookingCode) return;
            try {
                const res = await apiApp.get<{ data: ClientBookingDetailResponse }>(`/api/bookings/code/${bookingCode}`);
                const b = res.data.data;
                setBooking(b);
                setCustomerName(b.customerName || "");
                setCustomerEmail(b.customerEmail || "");
                setCustomerPhone(b.customerPhone || "");
                setPets(b.pets?.map(p => ({
                    id: p.id,
                    petName: p.petName || "",
                    emergencyContactName: p.emergencyContactName || "",
                    emergencyContactPhone: p.emergencyContactPhone || ""
                })) || []);
            } catch {
                toast.error("Không tìm thấy đơn đặt lịch.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [bookingCode]);

    const handleSave = async () => {
        if (!bookingCode) return;
        if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
            toast.error("Vui lòng điền đầy đủ thông tin liên hệ.");
            return;
        }

        if (pets.some(p => !p.petName.trim())) {
            toast.error("Vui lòng điền đầy đủ tên thú cưng.");
            return;
        }

        setSaving(true);
        try {
            const res = await apiApp.put<{ data: ClientBookingDetailResponse }>(`/api/bookings/code/${bookingCode}/contact`, {
                customerName: customerName.trim(),
                customerEmail: customerEmail.trim(),
                customerPhone: customerPhone.trim(),
                pets: pets.map(p => ({
                    id: p.id,
                    petName: p.petName.trim(),
                    emergencyContactName: p.emergencyContactName.trim(),
                    emergencyContactPhone: p.emergencyContactPhone.trim(),
                }))
            });
            if (res.data?.data) {
                toast.success("Cập nhật thông tin thành công!");
                navigate(`/dat-lich/chi-tiet-don/${bookingCode}`);
            }
        } catch {
            toast.error("Không thể cập nhật thông tin liên hệ.");
        } finally {
            setSaving(false);
        }
    };

    const showTimer = expiresAt && !isExpired;

    return (
        <div>
            <div className="app-container py-[60px]">
                <div className="max-w-[960px] mx-auto bg-white rounded-[12px] border border-[#f1f1f1] shadow-[0_4px_20px_rgba(15,23,42,0.05)] overflow-hidden">
                    {/* Header */}
                    <div className="px-[28px] py-[22px] bg-[#fff5f0] border-b border-[#f3e0d6] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="uppercase tracking-[0.05em] text-[1.2rem] font-[700] text-[#c45a3a]">
                                Chỉnh sửa thông tin
                            </p>
                            {booking && (
                                <h2 className="mt-1 text-[2.2rem] font-[800] text-[#181818]">
                                    Mã đặt lịch:{" "}
                                    <span className="text-[#c45a3a]">{booking.bookingCode}</span>
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
                        <div className="flex items-center gap-3">
                            {/* Countdown timer */}
                            {(showTimer || isExpired) && (
                                <div className={`flex flex-col items-center justify-center px-4 py-2 rounded-[8px] bg-white border ${isExpired ? "border-[#ef4444]" : "border-[#ffe0ce]"}`}>
                                    <div className="text-[1.1rem] font-[600] text-[#181818]">Giữ chỗ còn lại</div>
                                    <div className={`text-[1.6rem] font-[800] ${isExpired ? "text-[#ef4444]" : "text-[#c45a3a]"}`}>
                                        {isExpired ? "Hết hạn" : formattedRemaining}
                                    </div>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => navigate(`/dat-lich/chi-tiet-don/${bookingCode}`)}
                                className="inline-flex items-center justify-center rounded-[999px] border border-[#f1bca1] bg-white text-[#c45a3a] text-[1.35rem] font-[600] px-[16px] py-[8px] hover:bg-[#ffefe7] transition-colors"
                            >
                                Quay lại chi tiết
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
                        {booking && (
                            <>
                                {/* Editable contact info */}
                                <div className="rounded-[8px] border border-[#f3e0d6] bg-white px-5 py-4 mb-6">
                                    <p className="text-[1.5rem] font-[700] text-[#111827] mb-3">
                                        Thông tin khách hàng
                                    </p>
                                    <div className="space-y-4 text-[1.4rem]">
                                        <div className="flex flex-col md:flex-row md:items-center gap-x-4 gap-y-2">
                                            <label className="font-[600] md:w-[150px] shrink-0 text-[#374151]">Họ tên <span className="text-[#ef4444]">*</span></label>
                                            <input
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                className="flex-1 min-w-0 rounded-[8px] border border-[#d1d5db] bg-white px-3 py-2.5 text-[1.4rem] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#ffbaa0] focus:border-[#ff8a4a] transition-colors"
                                                placeholder="Nhập họ tên"
                                            />
                                        </div>
                                        <div className="flex flex-col md:flex-row md:items-center gap-x-4 gap-y-2">
                                            <label className="font-[600] md:w-[150px] shrink-0 text-[#374151]">Email <span className="text-[#ef4444]">*</span></label>
                                            <input
                                                type="email"
                                                value={customerEmail}
                                                onChange={(e) => setCustomerEmail(e.target.value)}
                                                className="flex-1 min-w-0 rounded-[8px] border border-[#d1d5db] bg-white px-3 py-2.5 text-[1.4rem] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#ffbaa0] focus:border-[#ff8a4a] transition-colors"
                                                placeholder="Nhập email"
                                            />
                                        </div>
                                        <div className="flex flex-col md:flex-row md:items-center gap-x-4 gap-y-2">
                                            <label className="font-[600] md:w-[150px] shrink-0 text-[#374151]">Số điện thoại <span className="text-[#ef4444]">*</span></label>
                                            <input
                                                value={customerPhone}
                                                onChange={(e) => setCustomerPhone(e.target.value)}
                                                className="flex-1 min-w-0 rounded-[8px] border border-[#d1d5db] bg-white px-3 py-2.5 text-[1.4rem] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#ffbaa0] focus:border-[#ff8a4a] transition-colors"
                                                placeholder="Nhập số điện thoại"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Editable pet names */}
                                {pets.length > 0 && (
                                    <div className="rounded-[8px] border border-[#f3e0d6] bg-white px-5 py-4 mb-6">
                                        <p className="text-[1.5rem] font-[700] text-[#111827] mb-3">
                                            Thông tin thú cưng
                                        </p>
                                        <div className="space-y-6 text-[1.4rem]">
                                            {pets.map((p, idx) => (
                                                <div key={p.id} className="space-y-4 pt-4 first:pt-0 first:border-0 border-t border-[#f1f1f1]">
                                                    <p className="font-[700] text-[#c45a3a]">Thú cưng {idx + 1}</p>
                                                    <div className="flex flex-col md:flex-row md:items-center gap-x-4 gap-y-2">
                                                        <label className="font-[600] md:w-[150px] shrink-0 text-[#374151]">Tên thú cưng <span className="text-[#ef4444]">*</span></label>
                                                        <input
                                                            value={p.petName}
                                                            onChange={(e) => {
                                                                const newPets = [...pets];
                                                                newPets[idx].petName = e.target.value;
                                                                setPets(newPets);
                                                            }}
                                                            className="flex-1 min-w-0 rounded-[8px] border border-[#d1d5db] bg-white px-3 py-2.5 text-[1.4rem] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#ffbaa0] focus:border-[#ff8a4a] transition-colors"
                                                            placeholder="Nhập tên thú cưng"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col md:flex-row md:items-center gap-x-4 gap-y-2">
                                                        <label className="font-[600] md:w-[150px] shrink-0 text-[#374151]">Liên hệ khẩn cấp</label>
                                                        <input
                                                            value={p.emergencyContactName}
                                                            onChange={(e) => {
                                                                const newPets = [...pets];
                                                                newPets[idx].emergencyContactName = e.target.value;
                                                                setPets(newPets);
                                                            }}
                                                            className="flex-1 min-w-0 rounded-[8px] border border-[#d1d5db] bg-white px-3 py-2.5 text-[1.4rem] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#ffbaa0] focus:border-[#ff8a4a] transition-colors"
                                                            placeholder="Tên người liên lạc"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col md:flex-row md:items-center gap-x-4 gap-y-2">
                                                        <label className="font-[600] md:w-[150px] shrink-0 text-[#374151]">SĐT khẩn cấp</label>
                                                        <input
                                                            value={p.emergencyContactPhone}
                                                            onChange={(e) => {
                                                                const newPets = [...pets];
                                                                newPets[idx].emergencyContactPhone = e.target.value;
                                                                setPets(newPets);
                                                            }}
                                                            className="flex-1 min-w-0 rounded-[8px] border border-[#d1d5db] bg-white px-3 py-2.5 text-[1.4rem] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#ffbaa0] focus:border-[#ff8a4a] transition-colors"
                                                            placeholder="Số điện thoại khẩn cấp"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}



                                {/* Save/Cancel buttons */}
                                <div className="pt-4 mt-6 border-t border-[#f1f1f1] flex items-center gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/dat-lich/chi-tiet-don/${bookingCode}`)}
                                        className="py-[10px] px-[20px] rounded-[8px] border border-[#ddd] bg-white text-[#181818] font-[600] text-[1.4rem] hover:bg-[#f5f5f5] transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="button"
                                        disabled={saving}
                                        onClick={handleSave}
                                        className="py-[10px] px-[20px] rounded-[8px] bg-[#4CAF50] text-[#fff] font-[600] text-[1.4rem] hover:bg-[#45a049] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
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
