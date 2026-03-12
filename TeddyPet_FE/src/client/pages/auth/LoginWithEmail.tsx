import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Header } from "../../components/layouts/Header";
import { FooterSub } from "../../components/layouts/FooterSub";
import { Input } from "./sections/Input";
import { apiApp } from "../../../api";
import { useAuthStore } from "../../../stores/useAuthStore";

export const LoginWithEmailPage = () => {
    const navigate = useNavigate();
    const loginStore = useAuthStore((s) => s.login);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"email" | "otp">("email");
    const [isLoading, setIsLoading] = useState(false);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error("Vui lòng nhập email.");
            return;
        }
        setIsLoading(true);
        try {
            // Gửi OTP cho email đã có tài khoản (guest hoặc member)
            await apiApp.post("/api/otp/booking/send", { email });
            toast.success("Đã gửi mã xác thực đến email của bạn.");
            setStep("otp");
        } catch (err: any) {
            const message = err?.response?.data?.message || "Không thể gửi mã OTP. Vui lòng thử lại.";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !otp.trim()) {
            toast.error("Vui lòng nhập đầy đủ email và mã OTP.");
            return;
        }
        setIsLoading(true);
        try {
            // Xác thực OTP và lấy token đăng nhập
            const res = await apiApp.post("/api/auth/guest-login/verify-otp", {
                email,
                otpCode: otp,
            });
            const data = res.data?.data;
            if (!data?.token) {
                toast.error("Không thể đăng nhập bằng OTP.");
                setIsLoading(false);
                return;
            }
            loginStore(
                {
                    username: email,
                    email,
                    firstName: "",
                    lastName: "",
                    role: "GUEST",
                } as any,
                data.token
            );
            toast.success("Đăng nhập bằng email thành công.");
            navigate("/dashboard/profile");
        } catch (err: any) {
            const message = err?.response?.data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn.";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Header />
            <div className="app-container my-[100px]">
                <div className="flex items-center justify-center mx-auto max-w-[900px]">
                    <div className="w-full max-w-[520px] bg-white shadow-[0_10px_50px_rgba(0,0,0,0.15)] rounded-[12px] p-[40px]">
                        <h3 className="text-center text-[1.625rem] font-[600] mb-[24px] text-[#333]">
                            Đăng nhập bằng email (OTP)
                        </h3>
                        {step === "email" ? (
                            <form onSubmit={handleSendOtp} className="flex flex-col gap-[20px]">
                                <div className="relative">
                                    <label className="absolute top-[-10px] left-[15px] bg-white px-[5px] text-[0.875rem] text-client-secondary">
                                        Email
                                    </label>
                                    <Input
                                        placeholder="email@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="!rounded-[8px] !border-[#ddd] !px-[20px] !py-[15px] !text-[0.875rem]"
                                        containerClassName="!mb-0"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full mt-[10px] bg-client-primary rounded-[8px] py-[12px] font-[600] text-[0.9375rem] text-white disabled:opacity-50"
                                >
                                    {isLoading ? "Đang gửi mã..." : "Gửi mã xác thực"}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-[20px]">
                                <p className="text-[0.875rem] text-[#555]">
                                    Mã xác thực đã được gửi đến{" "}
                                    <span className="font-[600] text-client-secondary">{email}</span>. Vui lòng nhập mã gồm 6
                                    số để đăng nhập.
                                </p>
                                <div className="relative">
                                    <label className="absolute top-[-10px] left-[15px] bg-white px-[5px] text-[0.875rem] text-client-secondary">
                                        Mã OTP
                                    </label>
                                    <Input
                                        placeholder="Nhập mã 6 số"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="!rounded-[8px] !border-[#ddd] !px-[20px] !py-[15px] !text-[0.875rem]"
                                        containerClassName="!mb-0"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full mt-[10px] bg-client-primary rounded-[8px] py-[12px] font-[600] text-[0.9375rem] text-white disabled:opacity-50"
                                >
                                    {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep("email")}
                                    className="mt-[4px] text-[0.8125rem] text-client-secondary hover:text-client-primary"
                                >
                                    Đổi email khác
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
            <FooterSub />
        </>
    );
}

