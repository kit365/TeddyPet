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
            <main className="flex-1 flex items-center justify-center my-[100px]">
                <div className="app-container">
                    <div className="max-w-[1200px] flex items-center justify-center mx-auto">
                        <div className="w-[509px] relative z-20">
                            <div className="p-[50px] bg-white shadow-[0_10px_50px_rgba(0,0,0,0.15)] rounded-[12px]">
                                <div className="text-center mb-[40px]">
                                    <div className="w-[80px] h-[80px] bg-red-50 rounded-full flex items-center justify-center text-client-primary mx-auto mb-[20px]">
                                        <Lock className="w-[40px] h-[40px]" />
                                    </div>
                                    <h3 className="text-[2.8rem] font-[700] text-[#333]">Thiết lập mật khẩu</h3>
                                    <p className="text-[1.4rem] text-[#666] mt-[10px]">Chào mừng bạn lần đầu đăng nhập. Hãy thiết lập mật khẩu để bảo vệ tài khoản của mình.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="flex flex-col gap-[25px]">
                                    <div className="relative">
                                        <label className="absolute top-[-10px] left-[15px] bg-white px-[5px] text-[1.4rem] text-client-secondary">Mật khẩu mới</label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                required
                                                placeholder="Ít nhất 6 ký tự"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full rounded-[8px] border border-[#ddd] px-[20px] py-[15px] text-[1.4rem] outline-none focus:border-client-primary transition-all pr-[50px]"
                                            />
                                            <Key className="absolute right-[15px] top-1/2 -translate-y-1/2 w-[2rem] h-[2rem] text-[#aaa]" />
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <label className="absolute top-[-10px] left-[15px] bg-white px-[5px] text-[1.4rem] text-client-secondary">Xác nhận mật khẩu</label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                required
                                                placeholder="Nhập lại mật khẩu mới"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full rounded-[8px] border border-[#ddd] px-[20px] py-[15px] text-[1.4rem] outline-none focus:border-client-primary transition-all pr-[50px]"
                                            />
                                            <CheckCircle className="absolute right-[15px] top-1/2 -translate-y-1/2 w-[2rem] h-[2rem] text-[#aaa]" />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full mt-[10px] relative overflow-hidden group bg-client-primary rounded-[8px] py-[15px] font-[600] text-[1.6rem] text-white cursor-pointer flex items-center justify-center gap-[10px] transition-all disabled:opacity-50"
                                    >
                                        <span className="relative z-10">{isSubmitting ? "Đang lưu..." : "Lưu mật khẩu"}</span>
                                        {!isSubmitting && <ArrowRight className="relative z-10 w-[2rem] h-[2rem] transition-transform duration-300 rotate-[-45deg] group-hover:rotate-0" />}
                                        <div className="absolute top-0 left-0 w-full h-full bg-client-secondary transition-transform duration-500 ease-in-out transform scale-x-0 origin-left group-hover:scale-x-100"></div>
                                    </button>
                                </form>

                                <div className="mt-[30px] p-[20px] bg-amber-50 rounded-[8px] border border-amber-100">
                                    <p className="text-[1.2rem] text-amber-700 leading-relaxed font-[500]">
                                        <b>Lưu ý:</b> Bạn sẽ dùng mật khẩu này cho những lần đăng nhập thủ công sau này (ngoài phương thức Google).
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <FooterSub />
        </div>
    );
};
