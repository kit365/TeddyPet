import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuthStore } from "../../../stores/useAuthStore";
import { setupInitialPassword } from "../../../admin/api/auth.api";
import { Header } from "../../components/layouts/Header";
import { FooterSub } from "../../components/layouts/FooterSub";
import { ArrowRight, Lock, Key, CheckCircle } from "iconoir-react";

export const SetupPasswordPage = () => {
    const navigate = useNavigate();
    const { user, login } = useAuthStore();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp!");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Mật khẩu phải từ 6 ký tự trở lên!");
            return;
        }

        setIsSubmitting(true);
        try {
            await setupInitialPassword({ newPassword, confirmPassword });
            toast.success("Thiết lập mật khẩu thành công!");

            // Update local state to clear the flag
            if (user) {
                // We use the login function to refresh the store with the new user state
                // Or manually update if possible. useAuthStore usually has a way.
                // Re-syncing with current user but updating the flag
                const token = useAuthStore.getState().token;
                if (token) {
                    login({ ...user, mustChangePassword: false }, token);
                }
            }

            setTimeout(() => navigate("/dashboard/profile"), 1500);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Thiết lập mật khẩu thất bại!");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.11)] rounded-[16px] overflow-hidden flex max-w-[760px] w-full min-h-[420px] border border-slate-50">
                    {/* Left Side: Illustration */}
                    <div className="hidden lg:flex w-1/2 bg-slate-50 items-center justify-center p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-100/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-200/50 rounded-full -ml-32 -mb-32 blur-3xl"></div>
                        <div className="relative z-10 text-center">
                            <img
                                src="https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/illustrations/characters/character-1.webp"
                                alt="Security"
                                className="w-full max-w-[220px] mx-auto drop-shadow-2xl"
                            />
                            <h2 className="text-[1.5rem] font-semibold text-slate-800 mt-6 tracking-tight">Bảo vệ tối ưu</h2>
                            <p className="text-[0.875rem] text-slate-400 mt-2 font-medium px-4">Một mật khẩu mạnh giúp bạn yên tâm hơn khi sử dụng dịch vụ.</p>
                        </div>
                    </div>

                    {/* Right Side: Form */}
                    <div className="w-full lg:w-1/2 p-8 md:p-10 flex flex-col justify-center">
                        <div className="mb-6">
                            <h3 className="text-[1.875rem] font-semibold text-slate-800 leading-tight">Thiết lập mật khẩu</h3>
                            <p className="text-[0.875rem] text-slate-400 mt-2 font-medium">Vui lòng đặt mật khẩu riêng cho hệ thống của bạn.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[0.8125rem] font-semibold text-slate-500 uppercase tracking-widest ml-1">Mật khẩu mới</label>
                                <div className="relative group">
                                    <input
                                        type="password"
                                        required
                                        placeholder="Ít nhất 6 ký tự"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full rounded-[8px] border-2 border-slate-100 bg-slate-50/50 px-5 py-[12px] text-[0.875rem] outline-none focus:border-client-primary focus:bg-white transition-all pr-12 text-slate-800"
                                    />

                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[0.8125rem] font-semibold text-slate-500 uppercase tracking-widest ml-1">Xác nhận mật khẩu</label>
                                <div className="relative group">
                                    <input
                                        type="password"
                                        required
                                        placeholder="Nhập lại mật khẩu mới"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full rounded-[8px] border-2 border-slate-100 bg-slate-50/50 px-5 py-[12px] text-[0.875rem] outline-none focus:border-client-primary focus:bg-white transition-all pr-12 text-slate-800"
                                    />
                                    <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-client-primary transition-colors" />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full relative overflow-hidden group bg-client-primary rounded-[8px] py-[12px] font-semibold text-[0.9375rem] text-white cursor-pointer flex items-center justify-center gap-[10px] transition-all disabled:opacity-50"
                                >
                                    <span className="relative z-10">{isSubmitting ? "Đang xử lý..." : "Hoàn tất thiết lập"}</span>
                                    {!isSubmitting && <ArrowRight className="relative z-10 w-[1.25rem] h-[1.25rem] transition-transform duration-300 rotate-[-45deg] group-hover:rotate-0" />}
                                </button>
                            </div>
                        </form>


                    </div>
                </div>
            </main>
            <FooterSub />
        </div>
    );
};
