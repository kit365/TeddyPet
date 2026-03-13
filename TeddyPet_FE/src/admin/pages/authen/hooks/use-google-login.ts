import { useMutation } from "@tanstack/react-query";
import { loginWithGoogle } from "../../../api/auth.api";
import { getMe } from "../../../../api/auth.api";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import Cookies from "js-cookie";
import { useAuthStore } from "../../../../stores/useAuthStore";

const ALLOWED_ADMIN_ROLES = ['ADMIN', 'STAFF', 'SUPER_ADMIN'];

export const useGoogleLogin = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async (idToken: string) => {
            // First step: Login to get tokens
            const response = await loginWithGoogle(idToken);
            if (!response.success || !response.data?.token) {
                throw new Error(response.message || 'Đăng nhập Google thất bại');
            }

            // Second step: Get user details immediately with the new token
            // This prevents race conditions and keeps the loading state active
            const meRes = await getMe(response.data.token);
            if (!meRes.success || !meRes.data) {
                throw new Error("Không thể xác thực quyền truy cập");
            }

            // Return combined data
            return {
                token: response.data.token,
                refreshToken: response.data.refreshToken,
                mustChangePassword: response.data.mustChangePassword,
                user: meRes.data
            };
        },
        onSuccess: (data) => {
            const { token, refreshToken, user } = data;
            
            Cookies.set("tokenAdmin", token, { expires: 1, secure: false, sameSite: "lax" });
            if (refreshToken) {
                Cookies.set("refreshTokenAdmin", refreshToken, { expires: 7, secure: false, sameSite: "lax" });
            }

            const role = user.role;
            if (role && !ALLOWED_ADMIN_ROLES.includes(role)) {
                Cookies.remove("tokenAdmin");
                Cookies.remove("refreshTokenAdmin");
                toast.error("Bạn không có quyền truy cập trang quản trị. Chỉ tài khoản Admin hoặc Nhân viên mới được vào.");
                return;
            }

            const fullUserData = {
                ...user,
                mustChangePassword: data.mustChangePassword ?? (user as any).mustChangePassword
            };
            
            useAuthStore.getState().adminLoginSync(fullUserData as any, token);

            if (fullUserData.mustChangePassword) {
                toast.info("Vui lòng thiết lập mật khẩu lần đầu.");
                setTimeout(() => navigate("/admin/setup-password"), 100);
                return;
            }

            toast.success("Đăng nhập Google thành công!");
            const target = (role === "ADMIN" || role === "SUPER_ADMIN") ? "/admin/dashboard/ecommerce" 
                         : role === "STAFF" ? "/admin/staff/dashboard" 
                         : "/admin/dashboard/analytics";
            
            setTimeout(() => navigate(target), 100);
        },
        onError: (error: any) => {
            const errorMessage = error.message || error?.response?.data?.message || "Đăng nhập Google thất bại!";
            toast.error(errorMessage);
        }
    });
};
