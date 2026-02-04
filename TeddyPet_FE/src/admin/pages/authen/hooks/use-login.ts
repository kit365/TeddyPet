import { useMutation } from "@tanstack/react-query";
import { login } from "../../../api/auth.api";
import { AuthResponse } from "../../../../types/auth.type";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import Cookies from "js-cookie";

export const useLogin = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: login,
        onSuccess: (response: AuthResponse) => {
            if (response.success && response.data?.token) {
                Cookies.set("tokenAdmin", response.data.token, {
                    expires: 1,        // 1 ngày
                    secure: false,     // true nếu HTTPS
                    sameSite: "lax"
                });
                if (response.data.refreshToken) {
                    Cookies.set("refreshTokenAdmin", response.data.refreshToken, {
                        expires: 7,
                        secure: false,
                        sameSite: "lax"
                    });
                }
                toast.success(response.message);
                setTimeout(() => {
                    navigate("/admin/dashboard");
                }, 500);
            } else {
                toast.error(response.message);
            }
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || "Đăng nhập thất bại!";
            toast.error(errorMessage);
        }
    });
};
