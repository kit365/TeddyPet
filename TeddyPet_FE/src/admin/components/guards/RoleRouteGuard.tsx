import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "../../../api/auth.api";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

type Role = "ADMIN" | "STAFF";

interface RoleRouteGuardProps {
    allowedRoles: Role[];
    redirectTo: string;
    children: React.ReactNode;
}

export const RoleRouteGuard = ({ allowedRoles, redirectTo, children }: RoleRouteGuardProps) => {
    const { data: meRes, isLoading } = useQuery({
        queryKey: ["me-admin"],
        queryFn: getMe,
    });

    if (isLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
                <CircularProgress />
            </Box>
        );
    }

    const role = meRes?.data?.role as Role | undefined;
    const mustChangePassword = (meRes?.data as any)?.mustChangePassword;

    if (mustChangePassword) {
        return <Navigate to="/admin/setup-password" replace />;
    }

    if (role && !allowedRoles.includes(role)) {
        return <Navigate to={redirectTo} replace />;
    }

    return <>{children}</>;
};
