import { Link, useLocation } from "react-router-dom";
import { Header } from "../../components/layouts/Header";
import { FooterSub } from "../../components/layouts/FooterSub";
import { Mail } from "iconoir-react";
import { useState, useEffect } from "react";
import { forgotPassword } from "../../../api/auth.api";
import { toast } from "react-toastify";

export const ForgotPasswordSuccessPage = () => {
    const location = useLocation();
    const email = location.state?.email || "email của bạn";
    const initialCooldown = 60; // Default cooldown 60s

    const [cooldown, setCooldown] = useState(initialCooldown);
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown((prev: number) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleResendLink = async () => {
        if (cooldown > 0 || isResending) return;

        setIsResending(true);
        try {
            // Re-use forgotPassword API to resend the link
            const response = await forgotPassword(email);
            if (response.success) {
                toast.success(response.message || "Link xác nhận đã được gửi lại!");
                setCooldown(60); // Reset cooldown
            } else {
                toast.error(response.message || "Gửi lại link thất bại!");
            }
        } catch (error: any) {
            const message = error?.response?.data?.message || "Đã có lỗi xảy ra.";
            toast.error(message);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <>
            <Header />
            <div className="app-container my-[100px]">
                <div className="max-w-[800px] mx-auto text-center">
                    <div className="w-[120px] h-[120px] bg-green-50 rounded-full flex items-center justify-center mx-auto mb-[40px]">
                        <Mail className="w-[60px] h-[60px] text-green-500" strokeWidth={1.5} />
                    </div>

                    <h2 className="text-[2.25rem] font-[700] text-client-secondary mb-[20px]">
                        Kiểm tra email của bạn
                    </h2>

                    <p className="text-[1.125rem] text-[#555] mb-[40px] leading-relaxed max-w-[600px] mx-auto">
                        Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến <span className="font-bold text-client-primary">{email}</span>.
                        <br />
                        Vui lòng kiểm tra hộp thư đến (và cả mục Spam) để lấy lại mật khẩu.
                    </p>

                    <div className="flex justify-center gap-[20px]">
                        <Link
                            to="/auth/login"
                            className="bg-client-secondary text-white px-[40px] py-[15px] rounded-[30px] text-[1rem] font-[600] hover:bg-client-primary transition-all duration-300"
                        >
                            Quay lại đăng nhập
                        </Link>
                    </div>
                </div>
            </div>
            <FooterSub />
        </>
    );
};
