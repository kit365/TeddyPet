import { RoleRouteGuard } from "./RoleRouteGuard";
import { prefixAdmin } from "../../constants/routes";

const STAFF_REDIRECT = `/${prefixAdmin}/staff/dashboard`;

interface AdminOnlyGuardProps {
    children: React.ReactNode;
}

/** Chỉ cho phép ADMIN/SUPER_ADMIN. STAFF truy cập sẽ bị redirect về trang nhiệm vụ. */
export const AdminOnlyGuard = ({ children }: AdminOnlyGuardProps) => (
    <RoleRouteGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]} redirectTo={STAFF_REDIRECT}>
        {children}
    </RoleRouteGuard>
);
