import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../../../api/auth.api";
import { Header } from "../../components/layouts/Header";
import { FooterSub } from "../../components/layouts/FooterSub";

export const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");
    const isCalled = useRef(false);

    useEffect(() => {
        if (!token) {
            navigate("/auth/login", {
                state: {
                    verifyResult: { success: false, message: "Đường dẫn xác thực không hợp lệ!" }
                }
            });
            return;
        }

        const verify = async () => {
            if (isCalled.current) return;
            isCalled.current = true;

            try {
                const response = await verifyEmail(token);

                if (response.success && response.data?.token) {
                    const { token: authToken, ...userData } = response.data;

                    // Optimistically set data
                    const { login } = await import("../../../stores/useAuthStore").then(m => m.useAuthStore.getState());
                    login(userData, authToken);

                    // Fetch full profile
                    try {
                        const userResponse = await import("../../../api/auth.api").then(m => m.getMe());
                        if (userResponse.success) {
                            login(userResponse.data, authToken);
                        }
                    } catch (err) {
                        console.error("Failed to fetch user profile", err);
                    }

                    // Show success message
                    const { toast } = await import("react-toastify");
                    toast.success("Xác thực tài khoản thành công!");

                    // Redirect to home
                    navigate("/");
                    return;
                }

                // If we get here, it means either !response.success OR no token
                navigate("/auth/login", {
                    state: {
                        verifyResult: {
                            success: response.success,
                            message: response.success ? "Xác thực tài khoản thành công!" : (response.message || "Xác thực thất bại!")
                        }
                    }
                });

            } catch (error: any) {
                console.error(error);
                const msg = error?.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại sau!";
                navigate("/auth/login", {
                    state: {
                        verifyResult: { success: false, message: msg }
                    }
                });
            }
        };

        verify();
    }, [token, navigate]);

    return (
        <>
            <Header />
            <div className="app-container my-[100px] flex items-center justify-center min-h-[500px]">
                <div className="w-full max-w-[500px] bg-white rounded-[20px] shadow-[0_10px_40px_rgba(0,0,0,0.1)] p-[40px] text-center relative overflow-hidden">

                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-client-secondary to-client-primary"></div>

                    <div className="flex flex-col items-center">
                        <div className="w-[80px] h-[80px] border-[4px] border-[#eee] border-t-client-primary rounded-full animate-spin mb-[30px]"></div>
                        <h2 className="text-[2.4rem] font-[700] text-client-secondary mb-[10px]">Đang xử lý...</h2>
                        <p className="text-[1.6rem] text-[#777]">Vui lòng đợi trong giây lát</p>
                    </div>
                </div>
            </div>
            <FooterSub />
        </>
    );
};
