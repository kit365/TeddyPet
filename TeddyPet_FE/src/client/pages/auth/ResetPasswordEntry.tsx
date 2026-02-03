import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { validateResetToken } from "../../../api/auth.api";
import { Header } from "../../components/layouts/Header";
import { FooterSub } from "../../components/layouts/FooterSub";
import { toast } from "react-toastify";

export const ResetPasswordEntryPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");
    const isCalled = useRef(false);

    useEffect(() => {
        if (!token) {
            toast.error("Đường dẫn không hợp lệ!");
            navigate("/auth/login");
            return;
        }

        const validate = async () => {
            if (isCalled.current) return;
            isCalled.current = true;

            try {
                const response = await validateResetToken(token);
                if (response.success) {
                    navigate("/auth/reset-password-form", { state: { token } });
                } else {
                    toast.error(response.message || "Đường dẫn đặt lại mật khẩu không hợp lệ hoặc đã hết hạn!");
                    navigate("/auth/login");
                }
            } catch (error: any) {
                console.error(error);
                const msg = error?.response?.data?.message || "Đã có lỗi xảy ra.";
                toast.error(msg);
                navigate("/auth/login");
            }
        };

        validate();
    }, [token, navigate]);

    return (
        <>
            <Header />
            <div className="app-container my-[100px] flex items-center justify-center min-h-[500px]">
                <div className="flex flex-col items-center">
                    <div className="w-[80px] h-[80px] border-[4px] border-[#eee] border-t-client-primary rounded-full animate-spin mb-[30px]"></div>
                    <h2 className="text-[2.4rem] font-[700] text-client-secondary mb-[10px]">Đang kiểm tra...</h2>
                    <p className="text-[1.6rem] text-[#777]">Vui lòng đợi trong giây lát</p>
                </div>
            </div>
            <FooterSub />
        </>
    );
};
