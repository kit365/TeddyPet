import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Search, PlusCircle } from "iconoir-react";
import { DashboardLayout } from "./sections/DashboardLayout";

export const BookingHistoryPage = () => {
    const navigate = useNavigate();
    const [bookingCode, setBookingCode] = useState("");

    const breadcrumbs = useMemo(
        () => [
            { label: "Trang chủ", to: "/" },
            { label: "Tài khoản", to: "/dashboard/profile" },
            { label: "Lịch sử đặt lịch", to: "/dashboard/bookings" },
        ],
        []
    );

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const code = bookingCode.trim();
        if (!code) return;
        navigate(`/dat-lich/chi-tiet-don/${encodeURIComponent(code)}`);
    };

    return (
        <DashboardLayout pageTitle="Lịch sử đặt lịch" breadcrumbs={breadcrumbs}>
            <div className="mb-4">
                <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-white px-5 py-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-client-primary to-rose-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-client-primary/30">
                            <Calendar width={20} height={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Lịch sử đặt lịch</h2>
                            <p className="text-xs text-slate-500 font-bold mt-0.5 uppercase tracking-wider">
                                Theo dõi các đơn đặt lịch của bạn
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSearch} className="mb-6">
                <div className="relative">
                    <Search width={18} height={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Nhập mã đặt lịch để xem chi tiết..."
                        value={bookingCode}
                        onChange={(e) => setBookingCode(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-client-primary/5 focus:border-client-primary transition-all shadow-sm"
                    />
                </div>
            </form>

            <div className="h-[15rem] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar width={36} height={36} className="text-slate-300" />
                    </div>
                    <h3 className="text-lg font-black text-slate-400 mb-1.5">Chưa có đơn đặt lịch nào</h3>
                    <p className="text-sm text-slate-400 font-medium mb-4">Khi bạn tạo đơn đặt lịch, lịch sử sẽ hiển thị ở đây</p>
                    <Link to="/dat-lich" className="inline-flex items-center gap-2 px-4 py-2 bg-client-primary hover:bg-rose-700 text-white rounded-lg font-bold text-sm shadow-lg shadow-client-primary/30 transition-all">
                        <PlusCircle width={18} height={18} />
                        Đặt lịch ngay
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
};
