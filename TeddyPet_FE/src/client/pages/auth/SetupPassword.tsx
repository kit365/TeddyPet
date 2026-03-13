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
            <main className="flex-1 flex items-center justify-center p-6 md:p-12">
                <div className="bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-[32px] overflow-hidden flex max-w-[1000px] w-full min-h-[600px] border border-slate-50">
                    {/* Left Side: Illustration */}
                    <div className="hidden lg:flex w-1/2 bg-slate-50 items-center justify-center p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-100/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-200/50 rounded-full -ml-32 -mb-32 blur-3xl"></div>
                        <div className="relative z-10 text-center">
                            <img 
                                src="https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/illustrations/characters/character-1.webp" 
                                alt="Security" 
                                className="w-full max-w-[320px] mx-auto drop-shadow-2xl"
                            />
                            <h2 className="text-[2.4rem] font-black text-slate-800 mt-8 tracking-tight">Bảo vệ tài khoản tối ưu</h2>
                            <p className="text-[1.4rem] text-slate-400 mt-4 font-medium px-4">Một mật khẩu mạnh sẽ giúp bạn yên tâm hơn khi sử dụng các dịch vụ tại TeddyPet.</p>
                        </div>
                    </div>

                    {/* Right Side: Form */}
                    <div className="w-full lg:w-1/2 p-10 md:p-16 flex flex-col justify-center">
                        <div className="mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-client-primary rounded-full mb-6">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-[1.1rem] font-black uppercase tracking-widest">Bước cuối cùng</span>
                            </div>
                            <h3 className="text-[3.2rem] font-black text-slate-800 leading-tight">Thiết lập mật khẩu</h3>
                            <p className="text-[1.5rem] text-slate-400 mt-3 font-medium">Vì bạn đăng nhập bằng Google lần đầu, vui lòng đặt mật khẩu riêng cho hệ thống.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[1.2rem] font-black text-slate-500 uppercase tracking-widest ml-1">Mật khẩu mới</label>
                                <div className="relative group">
                                    <input
                                        type="password"
                                        required
                                        placeholder="Ít nhất 6 ký tự"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-6 py-5 text-[1.6rem] outline-none focus:border-client-primary focus:bg-white transition-all pr-14 font-bold text-slate-800"
                                    />
                                    <Key className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 text-slate-300 group-focus-within:text-client-primary transition-colors" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[1.2rem] font-black text-slate-500 uppercase tracking-widest ml-1">Xác nhận mật khẩu</label>
                                <div className="relative group">
                                    <input
                                        type="password"
                                        required
                                        placeholder="Nhập lại mật khẩu mới"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-6 py-5 text-[1.6rem] outline-none focus:border-client-primary focus:bg-white transition-all pr-14 font-bold text-slate-800"
                                    />
                                    <CheckCircle className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 text-slate-300 group-focus-within:text-client-primary transition-colors" />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full relative overflow-hidden group bg-slate-900 rounded-[20px] py-6 font-black text-[1.6rem] text-white cursor-pointer flex items-center justify-center gap-3 transition-all hover:bg-client-primary hover:shadow-2xl hover:shadow-red-200 disabled:opacity-50"
                                >
                                    <span className="relative z-10">{isSubmitting ? "Đang xử lý..." : "Hoàn tất thiết lập"}</span>
                                    {!isSubmitting && <ArrowRight className="relative z-10 w-8 h-8 transition-transform group-hover:translate-x-1" />}
                                </button>
                            </div>
                        </form>

                        <div className="mt-12 flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                <Lock className="w-5 h-5" />
                            </div>
                            <p className="text-[1.2rem] text-slate-500 leading-relaxed font-bold">
                                <b>Lưu ý:</b> Mật khẩu này giúp bạn đăng nhập trực tiếp bằng Email mà không cần thông qua Google trong tương lai.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
            <FooterSub />
        </div>
    );
};
