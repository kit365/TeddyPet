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
        className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold text-[1.4rem] transition-all ${active
            ? `bg-indigo-600 text-white shadow-lg shadow-indigo-200 translate-x-2`
            : `text-slate-500 hover:bg-slate-50 hover:text-indigo-600`
            }`}
    >
        <Icon size={20} />
        <span className="flex-1 text-left">{label}</span>
        {active && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>}
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
        <div className="space-y-6">
            {/* User Brief Card */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-white p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-client-primary to-orange-400"></div>

                <div className="relative inline-block mb-6">
                    <img
                        src={user.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Kiet"}
                        className="w-28 h-28 rounded-[2rem] border-4 border-slate-50 shadow-inner bg-slate-50 p-1 object-cover"
                        alt="avatar"
                    />
                    <label htmlFor="profile_photo" className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2.5 rounded-2xl shadow-lg hover:scale-110 transition-transform border-4 border-white cursor-pointer">
                        <Camera size={18} />
                    </label>
                    <input type="file" id="profile_photo" hidden />
                </div>

                <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
                    {user.lastName} {user.firstName}
                </h2>
                <p className="text-[1.2rem] font-bold text-slate-400 uppercase tracking-widest mt-2">
                    {user.email}
                </p>
            </div>

            {/* Navigation Menu */}
            <div className="bg-white p-3 rounded-[2.5rem] shadow-lg shadow-slate-200/40 border border-slate-100">
                <div className="px-5 py-3">
                    <p className="text-[1rem] font-black text-slate-300 uppercase tracking-[0.2em]">Tổng quan tài khoản</p>
                </div>
                <div className="space-y-1">
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
                        active={pathname === "/dashboard/pets"}
                    />
                    <SidebarItem
                        to="/dashboard/orders"
                        icon={Package}
                        label="Lịch sử đơn hàng"
                        active={pathname.startsWith("/dashboard/order")}
                    />
                </div>

                <div className="h-px bg-slate-50 my-3 mx-5"></div>

                <div className="px-5 py-3">
                    <p className="text-[1rem] font-black text-slate-300 uppercase tracking-[0.2em]">Cài đặt & Bảo mật</p>
                </div>
                <div className="space-y-1">
                    <SidebarItem
                        to="/dashboard/change-password"
                        icon={ShieldCheck}
                        label="Mật khẩu & Bảo mật"
                        active={pathname === "/dashboard/change-password"}
                    />
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold text-[1.4rem] text-rose-500 hover:bg-rose-50 transition-all border-none cursor-pointer"
                    >
                        <LogOut size={20} />
                        <span className="flex-1 text-left">Đăng xuất</span>
                    </button>
                </div>
            </div>
        </div >
    );
};
