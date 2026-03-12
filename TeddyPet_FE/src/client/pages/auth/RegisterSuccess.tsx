import { Link, useLocation } from "react-router-dom";
import { Header } from "../../components/layouts/Header";
import { FooterSub } from "../../components/layouts/FooterSub";
import { Mail } from "iconoir-react";
import { useState, useEffect } from "react";
import { resendEmail } from "../../../api/auth.api";
import { toast } from "react-toastify";

export const RegisterSuccessPage = () => {
    const location = useLocation();
    const email = location.state?.email || "email của bạn";
    const initialCooldown = location.state?.resendCooldownSeconds || 0;

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

    const handleResendEmail = async () => {
        if (cooldown > 0 || isResending) return;

        setIsResending(true);
        try {
            const response = await resendEmail(email);
            if (response.success) {
                toast.success(response.message || "Email xác thực đã được gửi lại!");
                setCooldown(response.data?.resendCooldownSeconds || 120);
            } else {
                toast.error(response.message || "Gửi lại email thất bại!");
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
                        Đăng ký thành công!
                    </h2>

                    <p className="text-[1.125rem] text-[#555] mb-[40px] leading-relaxed max-w-[600px] mx-auto">
                        Cảm ơn bạn đã đăng ký tài khoản. Chúng tôi đã gửi một email xác thực đến <span className="font-bold text-client-primary">{email}</span>.
                        <br />
                        Vui lòng kiểm tra hộp thư đến (và cả mục Spam) để kích hoạt tài khoản của bạn.
                    </p>

                    <div className="flex justify-center gap-[20px]">
                        <Link
                            to="/auth/login"
                            className="bg-client-secondary text-white px-[40px] py-[15px] rounded-[30px] text-[1rem] font-[600] hover:bg-client-primary transition-all duration-300"
                        >
                            Đăng nhập
                        </Link>
                        <Link
                            to="/"
                            className="bg-white border border-[#eee] text-client-secondary px-[40px] py-[15px] rounded-[30px] text-[1rem] font-[600] hover:bg-[#f9f9f9] transition-all duration-300"
                        >
                            Về trang chủ
                        </Link>
                    </div>

                    <p className="mt-[40px] text-[0.875rem] text-[#999]">
                        Không nhận được email? {" "}
                        {cooldown > 0 ? (
                            <span className="text-client-primary cursor-not-allowed">
                                Gửi lại sau {cooldown}s
                            </span>
                        ) : (
                            <span
                                onClick={handleResendEmail}
                                className={`text-client-primary cursor-pointer hover:underline ${isResending ? 'opacity-50 cursor-wait' : ''}`}
                            >
                                {isResending ? "Đang gửi..." : "Gửi lại email xác thực"}
                            </span>
                        )}
                    </p>
                </div>
            </div>
            <FooterSub />
        </>
    );
};
