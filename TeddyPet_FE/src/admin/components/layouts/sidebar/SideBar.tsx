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
    const { data: meRes } = useQuery({ queryKey: ["me-admin"], queryFn: getMe });
    const role = meRes?.data?.role as "ADMIN" | "STAFF" | undefined;

    const filteredOverviewData = useMemo(() => {
        if (!role) return menuOverviewData;
        return menuOverviewData.filter((item: any) => {
            if (!item.allowedRoles) return true;
            return item.allowedRoles.includes(role);
        });
    }, [role]);

    const filteredManagementData = useMemo(() => {
        if (!role) return menuManagementData;

        return menuManagementData
            .filter((group: any) => {
                if (!group.allowedRoles) return true;
                return group.allowedRoles.includes(role);
            })
            .map((group: any) => {
                const rawChildren = group.children ?? [];

                // Với group "staff" vẫn giữ filter đặc biệt theo field `role`,
                // đồng thời tôn trọng allowedRoles trên từng child.
                if (group.id === "staff") {
                    const children = rawChildren.filter((child: any) => {
                        if (child.role && child.role !== role) return false;
                        if (child.allowedRoles && !child.allowedRoles.includes(role)) return false;
                        return true;
                    });
                    return { ...group, children };
                }

                const children = rawChildren.filter((child: any) => {
                    if (!child.allowedRoles) return true;
                    return child.allowedRoles.includes(role);
                });

                return { ...group, children };
            })
            .filter((group: any) => {
                // Nếu group có children rỗng thì ẩn hẳn group
                if (group.children && group.children.length === 0) return false;
                return true;
            });
    }, [role]);

    return (
        <div className={`flex fixed top-0 left-0 flex-col z-[1200] h-full bg-white border-r border-[#919eab1f] transition-[width] duration-[120ms] ease-linear ${isOpen ? 'w-[300px]' : 'w-[88px]'}`}>
            {/* Icon In Out */}
            <IconButton
                onClick={toggleSidebar}
                sx={{
                    position: "fixed",
                    top: "36px",
                    left: isOpen ? "300px" : "88px",
                    transform: 'translate(-50%, -50%)',
                    p: "4px",
                    color: "#637381",
                    bgcolor: "#fff",
                    zIndex: "9999",
                    border: "1px solid #919eab1f",
                    transition: "left 120ms ease-linear",
                    pointerEvents: "auto",
                }}>
                <ArrowIcon sx={{ fontSize: "1.6rem", rotate: isOpen ? "90deg" : "270deg" }} />
            </IconButton>

            <div className={isOpen
                ? "pl-[28px] pt-[24px] pb-[20px]"
                : "py-[20px] flex justify-center"
            }>
                <Link to="/" className="inline-block transition-transform hover:scale-105 active:scale-95">
                    <LogoTeddyPet width={isOpen ? "56px" : "44px"} height={isOpen ? "56px" : "44px"} />
                </Link>
            </div>

            {/* Scrollable */}
            <div className={`flex-1 flex flex-col relative min-h-0 ${isOpen ? '' : "px-[4px] pb-[16px] overflow-hidden"}`}>
                <div className="absolute inset-0 h-full overflow-y-auto sidebar-scroll">
                    <nav className={`text-[#637381] ${isOpen ? 'px-[16px]' : 'px-[4px]'}`}>
                        <ul>
                            <NavGroup title={"admin.overview"} data={filteredOverviewData} />
                            <NavGroup title={"admin.management"} data={filteredManagementData} />
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    );
};
