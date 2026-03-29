import { Navigate, Outlet, useSearchParams, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "../../../api/auth.api";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useEffect } from "react";
import { useAuthStore } from "../../../stores/useAuthStore";
import { toast } from 'react-toastify';
const ALLOWED_ADMIN_ROLES = ["ADMIN", "STAFF", "SUPER_ADMIN"];

export const AdminGuard = () => {
    const tokenAdmin = Cookies.get("tokenAdmin");
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const forbidden = searchParams.get("forbidden");

    const { data: meRes, isLoading, isError } = useQuery({
        queryKey: ["me-admin", tokenAdmin],
        queryFn: () => getMe(tokenAdmin),
        enabled: !!tokenAdmin,
        retry: false,
    });

    useEffect(() => {
        if (meRes?.data && tokenAdmin) {
            // Sync with global store if user data and token are available
            // Use adminLoginSync to avoid overwriting regular user cookies
            useAuthStore.getState().adminLoginSync(meRes.data as any, tokenAdmin);
        }
    }, [meRes, tokenAdmin]);

    if (!tokenAdmin) {
        const returnUrl = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/admin/auth/login?returnUrl=${returnUrl}`} replace />;
    }

    if (isLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                <CircularProgress />
            </Box>
        );
    }

    if (isError || !meRes?.data) {
        Cookies.remove("tokenAdmin");
        Cookies.remove("refreshTokenAdmin");
        return <Navigate to="/admin/auth/login" replace />;
    }

    const role = meRes.data.role;
    if (role && !ALLOWED_ADMIN_ROLES.includes(role)) {
        Cookies.remove("tokenAdmin");
        Cookies.remove("refreshTokenAdmin");
        toast.error("Bạn không có quyền truy cập trang quản trị. Chỉ tài khoản Admin hoặc Nhân viên mới được vào.");
        const to = forbidden ? "/admin/auth/login?forbidden=1" : "/admin/auth/login";
        return <Navigate to={to} replace />;
    }

    const isSetupPasswordPage = window.location.pathname.includes("/admin/setup-password");

    if (meRes.data.mustChangePassword && !isSetupPasswordPage) {
        return <Navigate to="/admin/setup-password" replace />;
    }

    return <Outlet />;
};
