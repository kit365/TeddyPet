import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "../../../api/auth.api";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { prefixAdmin } from "../../constants/routes";

export const DashboardHome = () => {
    const { data: meRes, isLoading } = useQuery({
        queryKey: ["me-admin"],
        queryFn: () => getMe(),
    });

    if (isLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                <CircularProgress />
            </Box>
        );
    }

    const role = (meRes as any)?.data?.role;

    if (role === "ADMIN" || role === "SUPER_ADMIN") {
        return <Navigate to={`/${prefixAdmin}/dashboard/system`} replace />;
    }

    if (role === "STAFF") {
        return <Navigate to={`/${prefixAdmin}/staff/dashboard`} replace />;
    }

    // Default fallback to analytics if role is unknown
    return <Navigate to={`/${prefixAdmin}/dashboard/analytics`} replace />;
};
