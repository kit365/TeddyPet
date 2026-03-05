import { Navigate, Outlet, useSearchParams } from "react-router-dom";
import Cookies from "js-cookie";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "../../../api/auth.api";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

const ALLOWED_ADMIN_ROLES = ["ADMIN", "STAFF"];

export const AdminGuard = () => {
    const tokenAdmin = Cookies.get("tokenAdmin");
    const [searchParams] = useSearchParams();
    const forbidden = searchParams.get("forbidden");

    const { data: meRes, isLoading, isError } = useQuery({
        queryKey: ["me-admin", tokenAdmin],
        queryFn: getMe,
        enabled: !!tokenAdmin,
        retry: false,
    });

    if (!tokenAdmin) {
        return <Navigate to="/admin/auth/login" replace />;
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
        const to = forbidden ? "/admin/auth/login?forbidden=1" : "/admin/auth/login";
        return <Navigate to={to} replace />;
    }

    return <Outlet />;
};
