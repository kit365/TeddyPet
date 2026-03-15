import {
    User, MapPin, PawPrint, Package,
    LogOut, Camera, ShieldCheck, Loader2, ImagePlus, History
} from 'lucide-react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuthStore } from "../../../../stores/useAuthStore";
import { logout as logoutApi } from "../../../../api/auth.api";
import { uploadImagesToCloudinary } from "../../../../api/uploadCloudinary.api";
import { updateProfile, getMyAvatarImages, type UserAvatarItem } from "../../../../api/user.api";

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

export const Sidebar = ({ isEditingProfile }: { isEditingProfile?: boolean }) => {
    const location = useLocation();
    const pathname = location.pathname;
    const { user, logout, set: setAuth } = useAuthStore();
    const navigate = useNavigate();
    const [uploading, setUploading] = useState(false);
    const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
    const [avatarListOpen, setAvatarListOpen] = useState(false);
    const [avatarList, setAvatarList] = useState<UserAvatarItem[]>([]);
    const [avatarListLoading, setAvatarListLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarBlockRef = useRef<HTMLDivElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith("image/") || !user) return;

        setUploading(true);
        setAvatarMenuOpen(false);
        try {
            const [url] = await uploadImagesToCloudinary([file], "user-avatars");
            const res = await updateProfile({
                firstName: user.firstName,
                lastName: user.lastName,
                avatarUrl: url
            });

            if (res.success && res.data) {
                setAuth({ user: res.data });
                toast.success("Cập nhật ảnh đại diện thành công!");
            } else {
                toast.error(res.message || "Không thể cập nhật ảnh đại diện");
            }
        } catch (error: any) {
            toast.error(error?.message || "Lỗi khi tải ảnh lên");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const handleChonAnhMoi = () => {
        setAvatarMenuOpen(false);
        fileInputRef.current?.click();
    };

    const openAvatarList = async () => {
        setAvatarMenuOpen(false);
        setAvatarListOpen(true);
        setAvatarListLoading(true);
        setAvatarList([]);
        try {
            const res = await getMyAvatarImages();
            if (res.success && res.data && res.data.length > 0) {
                setAvatarList(res.data);
            } else {
                toast.info("Chưa có ảnh đại diện nào đã lưu. Hãy chọn ảnh mới để tải lên.");
            }
        } catch {
            toast.error("Không tải được danh sách ảnh.");
        } finally {
            setAvatarListLoading(false);
        }
    };

    const handleChonAnhCu = async (imageUrl: string) => {
        if (!user) return;
        setAvatarListOpen(false);
        try {
            const res = await updateProfile({
                firstName: user.firstName,
                lastName: user.lastName,
                avatarUrl: imageUrl
            });
            if (res.success && res.data) {
                setAuth({ user: res.data });
                toast.success("Đã đổi sang ảnh đại diện đã chọn.");
            } else {
                toast.error(res.message || "Không thể đổi ảnh.");
            }
        } catch {
            toast.error("Không thể cập nhật ảnh đại diện.");
        }
    };

    useEffect(() => {
        if (!avatarMenuOpen && !avatarListOpen) return;
        const close = (e: MouseEvent) => {
            if (avatarBlockRef.current && !avatarBlockRef.current.contains(e.target as Node)) {
                setAvatarMenuOpen(false);
                setAvatarListOpen(false);
            }
        };
        const t = setTimeout(() => document.addEventListener("click", close), 0);
        return () => {
            clearTimeout(t);
            document.removeEventListener("click", close);
        };
    }, [avatarMenuOpen, avatarListOpen]);

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
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-300/30 border border-slate-100 p-4 text-center relative overflow-visible">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-client-primary to-orange-400"></div>

                <div ref={avatarBlockRef} className="relative inline-block mb-2.5">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isEditingProfile && !uploading) setAvatarMenuOpen((o) => !o);
                        }}
                        className="relative block rounded-xl border-[3px] border-slate-50 shadow-inner bg-slate-50 p-1 focus:outline-none focus:ring-2 focus:ring-client-primary/50"
                    >
                        <img
                            src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || "user"}`}
                            className={`w-14 h-14 rounded-lg object-cover ${uploading ? "opacity-50" : ""}`}
                            alt="avatar"
                        />
                        {isEditingProfile && (
                            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-md shadow-md border-2 border-white pointer-events-none">
                                {uploading ? <Loader2 size={10} className="animate-spin" /> : <Camera size={10} />}
                            </span>
                        )}
                    </button>

                    {isEditingProfile && avatarMenuOpen && (
                        <div
                            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-[100] min-w-[11rem] py-1.5 bg-white rounded-xl shadow-xl border border-slate-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={handleChonAnhMoi}
                                disabled={uploading}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-[0.8125rem] font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
                            >
                                <ImagePlus size={16} className="text-slate-500" />
                                Chọn ảnh mới
                            </button>
                            <button
                                type="button"
                                onClick={openAvatarList}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-[0.8125rem] font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
                            >
                                <History size={16} className="text-slate-500" />
                                Chọn lại ảnh cũ
                            </button>
                        </div>
                    )}

                    {isEditingProfile && avatarListOpen && (
                        <div
                            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-[100] w-[12rem] max-h-[16rem] overflow-y-auto py-2 px-2 bg-white rounded-xl shadow-xl border border-slate-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <p className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-wide px-2 pb-2">Chọn ảnh đã dùng</p>
                            {avatarListLoading ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 size={20} className="animate-spin text-slate-400" />
                                </div>
                            ) : avatarList.length === 0 ? (
                                <p className="text-[0.75rem] text-slate-400 py-2 px-2">Chưa có ảnh</p>
                            ) : (
                                <div className="grid grid-cols-3 gap-1.5">
                                    {avatarList.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => handleChonAnhCu(item.imageUrl)}
                                            className="rounded-lg overflow-hidden border-2 border-transparent hover:border-client-primary focus:border-client-primary focus:outline-none aspect-square"
                                        >
                                            <img
                                                src={item.imageUrl}
                                                alt="Avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                            {user?.avatarUrl && avatarList.length > 0 && !avatarList.some((a) => a.imageUrl === user.avatarUrl) && (
                                <div className="mt-2 pt-2 border-t border-slate-100">
                                    <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wide px-2 mb-1">Ảnh hiện tại</p>
                                    <button
                                        type="button"
                                        onClick={() => handleChonAnhCu(user.avatarUrl!)}
                                        className="w-full rounded-lg overflow-hidden border-2 border-transparent hover:border-client-primary aspect-square max-w-[4rem] mx-auto block"
                                    >
                                        <img src={user.avatarUrl} alt="Hiện tại" className="w-full h-full object-cover" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
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
                        active={pathname === "/dashboard/orders" || (pathname.startsWith("/dashboard/order/") && !pathname.includes("v2"))}
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
