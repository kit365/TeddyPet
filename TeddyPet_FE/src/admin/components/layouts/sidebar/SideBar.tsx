import { Link } from "react-router-dom";
import { LogoAdmin } from "../../../../assets/admin/logo";
import { NavGroup } from "./NavGroup";
import { menuManagementData, menuOverviewData } from "../../../constants/sideBar";
import { IconButton } from "@mui/material";
import { ArrowIcon } from "../../../assets/icons";
import { useSidebar } from "../../../context/sidebar/useSidebar";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "../../../../api/auth.api";

type Role = "ADMIN" | "STAFF";

type MenuItem = {
    id: string;
    label: string;
    allowedRoles: Role[];
    children?: MenuItem[];
    [key: string]: any;
};

const filterMenuByRole = (items: MenuItem[], role: Role): MenuItem[] => {
    return items
        .map((item) => {
            if (!item.allowedRoles || !item.allowedRoles.includes(role)) return null;
            const children = item.children ? filterMenuByRole(item.children as MenuItem[], role) : undefined;
            if (item.children && (!children || children.length === 0) && !item.path) {
                return null;
            }
            return { ...item, children };
        })
        .filter((x): x is MenuItem => x !== null);
};

export const SideBar = () => {
    const { isOpen, toggleSidebar } = useSidebar();
    const { data: meRes } = useQuery({ queryKey: ["me-admin"], queryFn: getMe });
    const userRole = (meRes?.data?.role as Role | undefined) ?? "STAFF";

    const filteredOverviewData = useMemo(
        () => filterMenuByRole(menuOverviewData as MenuItem[], userRole),
        [userRole]
    );

    const filteredManagementData = useMemo(
        () => filterMenuByRole(menuManagementData as MenuItem[], userRole),
        [userRole]
    );

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

            {/* Logo */}
            <div className={isOpen
                ? "pl-[28px] pt-[20px] pb-[8px]"
                : "py-[20px] flex justify-center"
            }>
                <Link to="/" className="inline-block w-[40px] h-[40px]">
                    <LogoAdmin />
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
