import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LogoTeddyPet } from "../../../../assets/admin/LogoTeddyPet";
import { NavGroup } from "./NavGroup";
import { menuManagementData, menuOverviewData } from "../../../constants/sideBar";
import { IconButton } from "@mui/material";
import { ArrowIcon } from "../../../assets/icons";
import { useSidebar } from "../../../context/sidebar/useSidebar";
import { getMe } from "../../../../api/auth.api";
import { useMemo } from "react";

export const SideBar = () => {
    const { isOpen, toggleSidebar } = useSidebar();
    const { data: meRes } = useQuery({ queryKey: ["me-admin"], queryFn: () => getMe() });
    const role = (meRes as any)?.data?.role as "ADMIN" | "STAFF" | "SUPER_ADMIN" | undefined;

    /** Khi chưa có role (đang load) coi như STAFF để không lộ menu chỉ dành cho ADMIN. */
    const effectiveRole = role ?? "STAFF";

    const filteredOverviewData = useMemo(() => {
        return menuOverviewData.filter((item: any) => {
            if (!item.allowedRoles) return true;
            return item.allowedRoles.includes(effectiveRole);
        });
    }, [effectiveRole]);

    const filteredManagementData = useMemo(() => {
        return menuManagementData
            .filter((group: any) => {
                if (!group.allowedRoles) return true;
                return group.allowedRoles.includes(effectiveRole);
            })
            .map((group: any) => {
                const rawChildren = group.children ?? [];

                // Với group "staff" vẫn giữ filter đặc biệt theo field `role`,
                // đồng thời tôn trọng allowedRoles trên từng child.
                if (group.id === "staff") {
                    const children = rawChildren.filter((child: any) => {
                        if (child.allowedRoles && !child.allowedRoles.includes(effectiveRole)) return false;
                        
                        // Legacy role filter: SUPER_ADMIN can see everything
                        if (child.role) {
                            if (effectiveRole === "SUPER_ADMIN") return true;
                            if (child.role !== effectiveRole) return false;
                        }
                        
                        return true;
                    });
                    return { ...group, children };
                }

                const children = rawChildren.filter((child: any) => {
                    if (!child.allowedRoles) return true;
                    return child.allowedRoles.includes(effectiveRole);
                });

                return { ...group, children };
            })
            .filter((group: any) => {
                // Nếu group có children rỗng thì ẩn hẳn group
                if (group.children && group.children.length === 0) return false;
                return true;
            });
    }, [effectiveRole]);

    return (
        <div className={`flex flex-col sticky top-0 h-screen bg-white border-r border-[#919eab1f] transition-[width] duration-[120ms] ease-linear overflow-y-auto overflow-x-hidden no-scrollbar flex-shrink-0 ${isOpen ? 'w-[300px]' : 'w-[88px]'}`}>
            {/* Icon In Out */}
            <IconButton
                onClick={toggleSidebar}
                sx={{
                    position: "absolute",
                    top: "36px",
                    right: "-12px",
                    transform: 'translate(0, -50%)',
                    p: "4px",
                    color: "#637381",
                    bgcolor: "#fff",
                    zIndex: "10",
                    border: "1px solid #919eab1f",
                    pointerEvents: "auto",
                }}>
                <ArrowIcon sx={{ fontSize: "1rem", rotate: isOpen ? "90deg" : "270deg" }} />
            </IconButton>

            <div className={isOpen
                ? "pl-[28px] pt-[24px] pb-[20px]"
                : "py-[20px] flex justify-center"
            }>
                <Link to="/" className="inline-block transition-transform hover:scale-105 active:scale-95">
                    <LogoTeddyPet width={isOpen ? "72px" : "52px"} height={isOpen ? "72px" : "52px"} />
                </Link>
            </div>

            {/* Navigation - No visible scrollbar but still scrollable if needed */}
            <nav className={`text-[#637381] flex-1 pb-10 ${isOpen ? 'px-[16px]' : 'px-[4px]'}`}>
                <ul>
                    <NavGroup title={"admin.overview"} data={filteredOverviewData} />
                    <NavGroup title={"admin.management"} data={filteredManagementData} />
                </ul>
            </nav>
        </div>
    );
};
