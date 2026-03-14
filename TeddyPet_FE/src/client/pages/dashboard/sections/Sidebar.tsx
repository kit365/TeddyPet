import {
    User, MapPin, PawPrint, Package,
    LogOut, Camera, ShieldCheck
} from 'lucide-react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../../stores/useAuthStore";
import { logout as logoutApi } from "../../../../api/auth.api";

interface SidebarItemProps {
    to: string;
    icon: any;
    label: string;
    active: boolean;
}

const SidebarItem = ({ to, icon: Icon, label, active }: SidebarItemProps) => (
    <Link
        to={to}
        className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-[0.75rem] transition-all ${active
            ? `bg-client-primary text-white shadow-lg shadow-red-100/50`
            : `text-slate-500 hover:bg-slate-50 hover:text-client-primary`
            }`}
    >
        <Icon size={16} />
        <span className="flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis leading-none">{label}</span>
        {active && <div className="w-1 h-1 bg-white rounded-full animate-pulse flex-shrink-0"></div>}
    </Link>
);

export const Sidebar = () => {
    const location = useLocation();
    const pathname = location.pathname;
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            await logoutApi();
        } catch (error) {
            console.error(error);
        } finally {
            logout();
            navigate("/auth/login");
        }
    };

    if (!user) return null;

    return (
        <div className="space-y-2.5">
            {/* User Brief Card */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-300/30 border border-slate-100 p-4 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-client-primary to-orange-400"></div>

                <div className="relative inline-block mb-2.5">
                    <img
                        src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                        className="w-14 h-14 rounded-xl border-[3px] border-slate-50 shadow-inner bg-slate-50 p-1 object-cover"
                        alt="avatar"
                    />
                    <label htmlFor="profile_photo" className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-md shadow-md hover:scale-110 transition-transform border-2 border-white cursor-pointer">
                        <Camera size={10} />
                    </label>
                    <input type="file" id="profile_photo" hidden />
                </div>

                <h2 className="text-[1rem] font-black text-slate-800 tracking-tight leading-tight truncate px-2">
                    {user.lastName} {user.firstName}
                </h2>
                <p className="text-[0.5625rem] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate px-2">
                    {user.email}
                </p>
            </div>

            {/* Navigation Menu */}
            <div className="bg-white p-2 rounded-2xl shadow-lg shadow-slate-300/30 border border-slate-100">
                <div className="px-4 pt-3 pb-2">
                    <p className="text-[0.5625rem] font-black text-slate-400/70 uppercase tracking-[0.1em] leading-tight">Tổng quan tài khoản</p>
                </div>
                <div className="space-y-0.5">
                    <SidebarItem
                        to="/dashboard/profile"
                        icon={User}
                        label="Thông tin cá nhân"
                        active={pathname === "/dashboard/profile" || pathname === "/dashboard/profile/edit"}
                    />
                    <SidebarItem
                        to="/dashboard/address"
                        icon={MapPin}
                        label="Sổ địa chỉ"
                        active={pathname.startsWith("/dashboard/address")}
                    />
                    <SidebarItem
                        to="/dashboard/pets"
                        icon={PawPrint}
                        label="Hồ sơ thú cưng"
                        active={pathname.startsWith("/dashboard/pets")}
                    />
                    <SidebarItem
                        to="/dashboard/orders"
                        icon={Package}
                        label="Lịch sử đơn hàng"
                        active={pathname.startsWith("/dashboard/order")}
                    />
                </div>

                <div className="h-px bg-slate-50 my-2 mx-4"></div>

                <div className="px-4 pt-1 pb-2">
                    <p className="text-[0.5625rem] font-black text-slate-400/70 uppercase tracking-[0.1em] leading-tight">Tài khoản</p>
                </div>
                <div className="space-y-0.5">
                    <SidebarItem
                        to="/dashboard/change-password"
                        icon={ShieldCheck}
                        label="Mật khẩu & Bảo mật"
                        active={pathname === "/dashboard/change-password"}
                    />
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[0.75rem] text-rose-500 hover:bg-rose-50 transition-all border-none cursor-pointer"
                    >
                        <LogOut size={16} />
                        <span className="flex-1 text-left whitespace-nowrap">Đăng xuất</span>
                    </button>
                </div>
            </div>
        </div >
    );
};
