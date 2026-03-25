import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

export const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get("token");
        const refreshToken = searchParams.get("refreshToken");
        const mustChangePassword = searchParams.get("mustChangePassword");

        if (token) {
            // Lưu token vào localStorage (khớp với logic AuthService của bạn)
            localStorage.setItem("accessToken", token);
            if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

            toast.success("Đăng nhập thành công!");

            // Nếu user này mới tạo từ Google và phải đổi mật khẩu
            if (mustChangePassword === "true") {
                navigate("/auth/setup-password");
            } else {
                // Tự động chuyển hướng về trang chủ hoặc trang quản trị tùy theo role (BE đã redirect về đây rồi)
                // Dashboard sẽ tự động check auth và redirect tiếp
                navigate("/");
            }
        } else {
            toast.error("Đăng nhập thất bại. Không tìm thấy Token.");
            navigate("/auth/login");
        }
    }, [searchParams, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="ml-4">Đang xử lý đăng nhập...</p>
        </div>
    );
};
