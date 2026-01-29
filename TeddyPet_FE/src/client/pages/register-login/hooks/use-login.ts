import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import Cookies from "js-cookie";
import { login, LoginResponse } from "../../../../admin/api/auth.api";

export const useLogin = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: login,
        onSuccess: (response: LoginResponse) => {
            if (response.success && response.data?.token) {
                Cookies.set("token", response.data.token, {
                    expires: 1,        // 1 ngày
                    secure: false,     // true nếu HTTPS
                    sameSite: "lax"
                });
                toast.success(response.message);
                setTimeout(() => {
                    navigate("/");
                }, 1500);
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
