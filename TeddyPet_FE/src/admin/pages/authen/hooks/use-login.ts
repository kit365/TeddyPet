import { useMutation } from "@tanstack/react-query";
import { login } from "../../../api/auth.api";
import { getMe } from "../../../../api/auth.api";
import { AuthResponse } from "../../../../types/auth.type";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import Cookies from "js-cookie";
import { useAuthStore } from "../../../../stores/useAuthStore";

const ALLOWED_ADMIN_ROLES = ['ADMIN', 'STAFF'];

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
                const meRes = await getMe();
                const role = meRes?.data?.role;
                if (role && !ALLOWED_ADMIN_ROLES.includes(role)) {
                    Cookies.remove("tokenAdmin");
                    Cookies.remove("refreshTokenAdmin");
                    toast.error("Bạn không có quyền truy cập trang quản trị. Chỉ tài khoản Admin hoặc Nhân viên mới được vào.");
                    return;
                }

                if (meRes?.data) {
                    // Use adminLoginSync to avoid overwriting regular user cookies
                    useAuthStore.getState().adminLoginSync(meRes.data as any, response.data.token);
                }

                toast.success(response.message);
                setTimeout(() => navigate("/admin/dashboard"), 500);
            } catch {
                toast.error("Không thể xác thực quyền. Vui lòng thử lại.");
                Cookies.remove("tokenAdmin");
                Cookies.remove("refreshTokenAdmin");
            }
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || "Đăng nhập thất bại!";
            toast.error(errorMessage);
        }
    });
};
