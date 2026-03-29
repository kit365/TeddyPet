import { useMutation } from "@tanstack/react-query";
import { login } from "../../../api/auth.api";
import { getMe } from "../../../../api/auth.api";
import { AuthResponse } from "../../../../types/auth.type";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import Cookies from "js-cookie";
import { useAuthStore } from "../../../../stores/useAuthStore";

const ALLOWED_ADMIN_ROLES = ['ADMIN', 'STAFF', 'SUPER_ADMIN'];

export const useLogin = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: login,
        onSuccess: async (response: AuthResponse) => {
            if (!response.success || !response.data?.token) {
                toast.error(response.message ?? 'Đăng nhập thất bại');
                return;
            }
            Cookies.set("tokenAdmin", response.data.token, {
                expires: 1,
                secure: false,
                sameSite: "lax"
            });
            if (response.data.refreshToken) {
                Cookies.set("refreshTokenAdmin", response.data.refreshToken, {
                    expires: 7,
                    secure: false,
                    sameSite: "lax"
                });
            }
            try {
                const meRes = await getMe(response.data.token);
                const role = meRes?.data?.role;
                if (role && !ALLOWED_ADMIN_ROLES.includes(role)) {
                    Cookies.remove("tokenAdmin");
                    Cookies.remove("refreshTokenAdmin");
                    toast.error("Bạn không có quyền truy cập trang quản trị. Chỉ tài khoản Admin hoặc Nhân viên mới được vào.");
                    return;
                }

                if (meRes?.data) {
                    // Use adminLoginSync to avoid overwriting regular user cookies
                    const fullUserData = {
                        ...meRes.data,
                        mustChangePassword: response.data.mustChangePassword ?? (meRes.data as any).mustChangePassword
                    };
                    useAuthStore.getState().adminLoginSync(fullUserData as any, response.data.token);

                    if (fullUserData.mustChangePassword) {
                        toast.info("Vui lòng thiết lập mật khẩu của bạn.");
                        navigate("/admin/setup-password", { replace: true });
                        return;
                    }
                }

                toast.success(response.message);

                const params = new URLSearchParams(window.location.search);
                const rawReturn = params.get("returnUrl");
                let safeReturn: string | null = null;
                if (rawReturn) {
                    try {
                        const decoded = decodeURIComponent(rawReturn);
                        if (decoded.startsWith("/admin") && !decoded.includes("//")) {
                            safeReturn = decoded;
                        }
                    } catch {
                        /* ignore */
                    }
                }

                if (safeReturn && (role === "ADMIN" || role === "SUPER_ADMIN")) {
                    setTimeout(() => navigate(safeReturn), 100);
                    return;
                }

                if (role === "ADMIN" || role === "SUPER_ADMIN") {
                    setTimeout(() => navigate("/admin/dashboard/system"), 100);
                } else if (role === "STAFF") {
                    setTimeout(() => navigate("/admin/staff/dashboard"), 100);
                } else {
                    setTimeout(() => navigate("/admin/dashboard/system"), 100);
                }
            } catch {
                toast.error("Không thể xác thực quyền. Vui lòng thử lại.");
                Cookies.remove("tokenAdmin");
                Cookies.remove("refreshTokenAdmin");
            }
        },
        onError: (error: any) => {
            const errorMessage = 
                error?.response?.data?.message || 
                error?.response?.data?.error || 
                error?.message || 
                "Đăng nhập thất bại!";
            toast.error(errorMessage);
        }
    });
};
