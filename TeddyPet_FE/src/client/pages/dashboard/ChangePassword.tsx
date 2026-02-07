import { ArrowRight, ShieldCheck, Key, Lock, WarningCircle, MailOut } from "iconoir-react";
import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import { DashboardLayout } from "./sections/DashboardLayout";
import { changePassword, sendChangePasswordOtp } from "../../../api/user.api";

export const ChangePasswordPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otpCode, setOtpCode] = useState("");

    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Tài khoản", to: "/dashboard/profile" },
        { label: "Bảo mật", to: `/dashboard/change-password` },
    ];

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleSendOtp = async () => {
        try {
            setIsSendingOtp(true);
            const response = await sendChangePasswordOtp();
            toast.success(response.message || "Mã OTP đã được gửi đến email của bạn.");
            setCooldown(60); // Default cooldown 60s
        } catch (error: any) {
            toast.error(error.message || "Không thể gửi mã OTP.");
        } finally {
            setIsSendingOtp(false);
        }
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp!");
            return;
        }

        if (!otpCode) {
            toast.error("Vui lòng nhập mã OTP!");
            return;
        }

        setIsLoading(true);

        try {
            await changePassword({
                oldPassword,
                newPassword,
                otpCode
            });
            toast.success("Cập nhật mật khẩu thành công!");
            // Clear form
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setOtpCode("");
        } catch (error: any) {
            toast.error(error.message || "Đổi mật khẩu thất bại.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout pageTitle="Bảo mật tài khoản" breadcrumbs={breadcrumbs}>
            <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 shadow-inner">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <div>
                        <h3 className="text-[2.6rem] font-black text-slate-800 tracking-tight leading-tight">
                            Thay đổi mật khẩu
                        </h3>
                        <p className="text-[1.4rem] font-medium text-slate-400 mt-1">
                            TeddyPet khuyên bạn nên sử dụng mật khẩu mạnh để bảo vệ tài khoản.
                        </p>
                    </div>
                </div>
                <div className="hidden lg:block">
                    <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 flex items-center gap-3">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[1.2rem] font-black text-emerald-700 uppercase tracking-widest">Tài khoản an toàn</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                <div className="xl:col-span-2">
                    <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 p-8">
                        <form className="space-y-6" onSubmit={onSubmit}>
                            <div className="space-y-5">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[1.2rem] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Key className="w-4 h-4 text-indigo-500" /> Mật khẩu hiện tại
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        className="w-full bg-white border-2 border-slate-50 rounded-2xl px-6 py-4 text-[1.5rem] font-bold text-slate-700 focus:outline-none focus:border-indigo-600 focus:ring-8 focus:ring-indigo-100/30 transition-all placeholder:text-slate-300"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[1.2rem] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <Lock className="w-4 h-4 text-indigo-500" /> Mật khẩu mới
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-[1.4rem] font-bold text-slate-700 focus:outline-none focus:border-indigo-600 focus:ring-8 focus:ring-indigo-100/30 transition-all placeholder:text-slate-300"
                                            placeholder="Nhập mật khẩu mới"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[1.2rem] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <Lock className="w-4 h-4 text-indigo-500" /> Xác nhận
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-[1.4rem] font-bold text-slate-700 focus:outline-none focus:border-indigo-600 focus:ring-8 focus:ring-indigo-100/30 transition-all placeholder:text-slate-300"
                                            placeholder="Nhập lại mật khẩu"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[1.2rem] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <MailOut className="w-4 h-4 text-indigo-500" /> Mã xác thực (OTP)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            required
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value)}
                                            className="w-full bg-white border-2 border-slate-50 rounded-2xl px-6 py-4 text-[1.5rem] font-bold text-slate-700 focus:outline-none focus:border-indigo-600 focus:ring-8 focus:ring-indigo-100/30 transition-all placeholder:text-slate-300 pr-[140px]"
                                            placeholder="Nhập mã 6 số"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSendOtp}
                                            disabled={isSendingOtp || cooldown > 0}
                                            className={`absolute right-3 top-1/2 -translate-y-1/2 h-[40px] px-6 rounded-xl font-black text-[1.1rem] uppercase tracking-widest transition-all ${cooldown > 0
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                                                }`}
                                        >
                                            {isSendingOtp ? "Đang gửi..." : cooldown > 0 ? `${cooldown}s` : "Gửi mã"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`h-[54px] px-10 rounded-2xl font-black text-[1.4rem] flex items-center gap-3 shadow-xl transition-all active:scale-95 ${isLoading
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                        : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-slate-800 hover:shadow-slate-200'
                                        }`}
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            CẬP NHẬT MẬT KHẨU
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-amber-50 rounded-[2.5rem] border border-amber-100 flex flex-col gap-3">
                        <div className="flex items-center gap-3 text-amber-600 font-black text-[1.2rem] uppercase tracking-widest">
                            <WarningCircle className="w-5 h-5" /> Lưu ý bảo mật
                        </div>
                        <p className="text-[1.2rem] font-medium text-amber-700 leading-relaxed italic">
                            Mã OTP có hiệu lực trong 15 phút. Vui lòng kiểm tra kỹ email (bao gồm cả thư rác) để hoàn tất việc đổi mật khẩu.
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
