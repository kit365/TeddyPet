import { ArrowRight, ShieldCheck, Key, Lock, WarningCircle, MailOut, CheckCircle, ArrowLeft, QuestionMark } from "iconoir-react";
import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "./sections/DashboardLayout";
import { changePassword, sendChangePasswordOtp, verifyChangePasswordOtp, verifyOldPassword } from "../../../api/user.api";

export const ChangePasswordPage = () => {
    const [step, setStep] = useState(0); // 0: Start/Send OTP, 1: Enter OTP, 2: Old Password, 3: New Password
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
            setCooldown(60);
            setStep(1); // Move to OTP entry step
        } catch (error: any) {
            toast.error(error.message || "Không thể gửi mã OTP.");
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleNextStep = async () => {
        if (step === 1) {
            if (otpCode.length < 6) {
                toast.error("Vui lòng nhập đủ 6 chữ số mã OTP.");
                return;
            }
            try {
                setIsLoading(true);
                await verifyChangePasswordOtp(otpCode);
                toast.success("Xác thực mã OTP thành công!");
                setStep(2);
            } catch (error: any) {
                toast.error(error.message || "Mã OTP không chính xác hoặc đã hết hạn.");
            } finally {
                setIsLoading(false);
            }
        } else if (step === 2) {
            if (!oldPassword) {
                toast.error("Vui lòng nhập mật khẩu hiện tại.");
                return;
            }
            try {
                setIsLoading(true);
                await verifyOldPassword(oldPassword);
                toast.success("Xác thực mật khẩu thành công!");
                setStep(3);
            } catch (error: any) {
                toast.error(error.message || "Mật khẩu hiện tại không chính xác.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleBackStep = () => {
        if (step > 0) setStep(step - 1);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp!");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
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
            // Reset to step 0 and clear
            setStep(0);
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

    const steps = [
        { label: "Gửi mã", icon: <MailOut /> },
        { label: "Xác thực", icon: <ShieldCheck /> },
        { label: "Hiện tại", icon: <Key /> },
        { label: "Mật khẩu mới", icon: <Lock /> }
    ];

    return (
        <DashboardLayout pageTitle="Bảo mật tài khoản" breadcrumbs={breadcrumbs}>
            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-[1.5rem] font-bold text-slate-800">
                        Bảo mật tài khoản
                    </h1>
                    <p className="text-[0.875rem] text-slate-500 font-medium mt-1 uppercase tracking-widest">
                        Quản lý mật khẩu và các lớp bảo vệ
                    </p>
                </div>
                <div className="hidden lg:block">
                    <div className="bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[0.6875rem] font-black tracking-widest uppercase text-emerald-700">An toàn</span>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8 relative px-4">
                <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 -z-0 rounded-full"></div>
                <div
                    className="absolute top-5 left-0 h-1 bg-client-primary -translate-y-1/2 -z-0 transition-all duration-500 rounded-full"
                    style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
                ></div>

                <div className="flex justify-between relative z-10">
                    {steps.map((s, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${idx < step ? 'bg-client-primary border-red-100 text-white' :
                                idx === step ? 'bg-white border-client-primary text-client-primary shadow-md scale-105' :
                                    'bg-white border-slate-100 text-slate-300'
                                }`}>
                                {idx < step ? <CheckCircle className="w-4 h-4" /> : <div className="scale-75">{s.icon}</div>}
                            </div>
                            <span className={`mt-2 text-[0.6875rem] font-bold ${idx <= step ? 'text-client-primary' : 'text-slate-400'}`}>
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="max-w-[420px] mx-auto">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/30 overflow-hidden min-h-[320px] flex flex-col">
                    <div className="p-6 flex-1 flex flex-col justify-center">
                        {step === 0 && (
                            <div className="text-center animate-fadeIn space-y-5">
                                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-client-primary mx-auto">
                                    <MailOut className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-[1.125rem] font-bold text-slate-900 mb-1.5">Gửi mã xác thực</h4>
                                    <p className="text-[0.875rem] text-slate-500 font-medium">Chúng tôi sẽ gửi một mã OTP gồm 6 chữ số đến email đã đăng ký của bạn.</p>
                                </div>
                                <button
                                    onClick={handleSendOtp}
                                    disabled={isSendingOtp || cooldown > 0}
                                    className="w-full h-[44px] bg-client-primary hover:bg-client-secondary text-white rounded-xl font-bold text-[0.875rem] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 active:scale-95"
                                >
                                    {isSendingOtp ? "Đang gửi..." : cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi mã ngay"}
                                    {!isSendingOtp && cooldown === 0 && <ArrowRight width={18} height={18} />}
                                </button>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="animate-fadeIn space-y-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <button onClick={handleBackStep} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"><ArrowLeft width={18} height={18} /></button>
                                    <h4 className="text-[1.125rem] font-bold text-slate-900">Xác thực OTP</h4>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[0.875rem] text-slate-500 font-medium italic">Vui lòng kiểm tra email và nhập mã xác thực gồm 6 chữ số.</p>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                        className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-[1.25rem] font-bold text-slate-900 text-center tracking-[0.5rem] focus:outline-none focus:border-slate-300 bg-slate-50/50 transition-all placeholder:text-slate-200"
                                        placeholder="000000"
                                    />
                                    <button
                                        onClick={handleNextStep}
                                        disabled={isLoading}
                                        className="w-full h-[44px] bg-client-primary hover:bg-client-secondary text-white rounded-xl font-bold text-[0.875rem] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 active:scale-95"
                                    >
                                        {isLoading ? (
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>Tiếp tục <ArrowRight width={18} height={18} /></>
                                        )}
                                    </button>
                                    <p className="text-center text-[0.8125rem] text-slate-400 font-bold">
                                        Không nhận được mã? <button onClick={handleSendOtp} disabled={cooldown > 0} className="text-client-primary hover:underline disabled:text-slate-300">Gửi lại</button>
                                    </p>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-fadeIn space-y-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <button onClick={handleBackStep} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"><ArrowLeft width={18} height={18} /></button>
                                    <h4 className="text-[1.125rem] font-bold text-slate-900">Mật khẩu hiện tại</h4>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[0.875rem] text-slate-500 font-medium">Vui lòng xác nhận mật khẩu đang sử dụng để tiếp tục.</p>
                                    <div className="relative">
                                        <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <input
                                            type="password"
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            className="w-full border-2 border-slate-100 rounded-xl pl-10 pr-4 py-3 text-[0.875rem] font-medium text-slate-900 focus:outline-none focus:border-slate-300 bg-slate-50/50 transition-all"
                                            placeholder="Nhập mật khẩu hiện tại"
                                        />
                                    </div>
                                    <button
                                        onClick={handleNextStep}
                                        disabled={isLoading}
                                        className="w-full h-[44px] bg-client-primary hover:bg-client-secondary text-white rounded-xl font-bold text-[0.875rem] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 active:scale-95"
                                    >
                                        {isLoading ? (
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>Xác nhận <ArrowRight width={18} height={18} /></>
                                        )}
                                    </button>
                                    <div className="pt-2 text-center">
                                        <Link to="/forgot-password" className="text-client-primary font-bold text-[0.8125rem] hover:underline flex items-center justify-center gap-2">
                                            <QuestionMark className="w-4 h-4" /> Bạn không nhớ mật khẩu hiện tại?
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-fadeIn space-y-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <button onClick={handleBackStep} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"><ArrowLeft width={18} height={18} /></button>
                                    <h4 className="text-[1.125rem] font-bold text-slate-900">Mật khẩu mới</h4>
                                </div>
                                <form onSubmit={onSubmit} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[0.8125rem] font-semibold text-slate-900 pl-1">Mật khẩu mới</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <input
                                                type="password"
                                                required
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full border-2 border-slate-100 rounded-xl pl-10 pr-4 py-3 text-[0.875rem] font-medium text-slate-900 focus:outline-none focus:border-slate-300 bg-slate-50/50 transition-all"
                                                placeholder="Ít nhất 6 ký tự"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[0.8125rem] font-semibold text-slate-900 pl-1">Xác nhận mật khẩu</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <input
                                                type="password"
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full border-2 border-slate-100 rounded-xl pl-10 pr-4 py-3 text-[0.875rem] font-medium text-slate-900 focus:outline-none focus:border-slate-300 bg-slate-50/50 transition-all"
                                                placeholder="Nhập lại mật khẩu mới"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-[44px] bg-client-primary hover:bg-client-secondary text-white rounded-xl font-bold text-[0.875rem] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 active:scale-95"
                                    >
                                        {isLoading ? (
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>Hoàn tất đổi mật khẩu <CheckCircle width={18} height={18} /></>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                    <div className="bg-amber-50 p-6 flex items-center gap-4 border-t border-amber-100">
                        <WarningCircle className="w-8 h-8 text-amber-500" />
                        <p className="text-[0.75rem] font-bold text-amber-700 leading-tight">
                            Lưu ý: Bạn chỉ có thể quay lại bước trước đó nếu mã OTP vẫn còn hiệu lực (15 phút).
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out forwards;
                }
            `}</style>
        </DashboardLayout>
    );
};
