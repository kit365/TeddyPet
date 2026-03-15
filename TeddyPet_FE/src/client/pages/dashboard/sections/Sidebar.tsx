import {
    User, MapPin, PawPrint, Package,
    LogOut, Camera, ShieldCheck, Loader2, ImagePlus, History, X, Check
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
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
        className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-[0.75rem] transition-all duration-200 ${active
            ? `bg-client-primary text-white shadow-lg shadow-red-100/50 hover:bg-client-secondary hover:-translate-y-0.5`
            : `text-slate-500 hover:bg-slate-100 hover:text-client-primary hover:translate-x-1`
            }`}
    >
        <Icon size={16} />
        <span className="flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis leading-none">{label}</span>
        {active && (
            <motion.div
                layoutId="active-nav-dot"
                className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0 shadow-[0_0_8px_white]"
            />
        )}
    </Link>
);

export const Sidebar = () => {
    const location = useLocation();
    const pathname = location.pathname;
    const { user, logout, set: setAuth } = useAuthStore();
    const navigate = useNavigate();
    const [uploading, setUploading] = useState(false);
    const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
    const [avatarListOpen, setAvatarListOpen] = useState(false);
    const [avatarList, setAvatarList] = useState<UserAvatarItem[]>([]);
    const [avatarListLoading, setAvatarListLoading] = useState(false);
    const [tempAvatar, setTempAvatar] = useState<string | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [savingAvatar, setSavingAvatar] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarBlockRef = useRef<HTMLDivElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith("image/") || !user) return;

        setUploading(true);
        setAvatarMenuOpen(false);
        try {
            const [url] = await uploadImagesToCloudinary([file], "user-avatars");
            setTempAvatar(url);
            setIsConfirmModalOpen(true);
        } catch (error: any) {
            toast.error(error?.message || "Lỗi khi tải ảnh lên");
        } finally {
            setUploading(false);
            if (e.target) e.target.value = "";
        }
    };

    const handleConfirmAvatar = async () => {
        if (!tempAvatar || !user) return;
        setSavingAvatar(true);
        try {
            const res = await updateProfile({
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender,
                optionalEmail: user.optionalEmail,
                altImage: user.altImage,
                avatarUrl: tempAvatar
            });

            if (res.success && res.data) {
                setAuth({ user: res.data });
                toast.success("Cập nhật ảnh đại diện thành công!");
                setIsConfirmModalOpen(false);
                setTempAvatar(null);
            } else {
                toast.error(res.message || "Không thể cập nhật ảnh đại diện");
            }
        } catch (error: any) {
            toast.error(error?.message || "Lỗi khi cập nhật");
        } finally {
            setSavingAvatar(false);
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
        setTempAvatar(imageUrl);
        setIsConfirmModalOpen(true);
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
                            if (!uploading) setAvatarMenuOpen((o) => !o);
                        }}
                        className="group relative block rounded-xl border-[3px] border-slate-50 shadow-inner bg-slate-50 p-1 focus:outline-none focus:ring-2 focus:ring-client-primary/50"
                    >
                        <img
                            src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || "user"}`}
                            className={`w-14 h-14 rounded-lg object-cover transition-all ${uploading ? "opacity-30" : "group-hover:brightness-75"}`}
                            alt="avatar"
                        />
                        <span className="absolute -bottom-1 -right-1 bg-white text-slate-700 p-1.5 rounded-md shadow-lg border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                        </span>
                    </button>

                    {avatarMenuOpen && (
                        <div
                            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-[100] min-w-[12rem] py-1.5 bg-white rounded-xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    setAvatarMenuOpen(false);
                                    setIsPreviewOpen(true);
                                }}
                                className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-[0.8125rem] font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                                    <User size={16} />
                                </div>
                                Xem ảnh đại diện
                            </button>
                            <div className="h-px bg-slate-50 my-1 mx-2"></div>
                            <button
                                type="button"
                                onClick={handleChonAnhMoi}
                                disabled={uploading}
                                className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-[0.8125rem] font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                                    <ImagePlus size={16} />
                                </div>
                                Tải ảnh mới lên
                            </button>
                            <button
                                type="button"
                                onClick={openAvatarList}
                                className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-[0.8125rem] font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                                    <History size={16} />
                                </div>
                                Chọn từ ảnh cũ
                            </button>
                        </div>
                    )}

                    {avatarListOpen && (
                        <div
                            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-[100] w-[14rem] max-h-[18rem] overflow-y-auto py-3 px-3 bg-white rounded-xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <p className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest px-1 mb-2.5">Kho ảnh của bạn</p>
                            {avatarListLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 size={24} className="animate-spin text-slate-300" />
                                </div>
                            ) : avatarList.length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-[0.75rem] text-slate-400">Chưa có ảnh nào</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    {avatarList.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => handleChonAnhCu(item.imageUrl)}
                                            className="group/avatar rounded-lg overflow-hidden border-2 border-transparent hover:border-client-primary focus:border-client-primary focus:outline-none aspect-square bg-slate-50 transition-all active:scale-95"
                                        >
                                            <img
                                                src={item.imageUrl}
                                                alt="Avatar"
                                                className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-300"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* MODAL COMFIRM CHANGE */}
                <AnimatePresence>
                    {isConfirmModalOpen && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => {
                                    if (!savingAvatar) {
                                        setIsConfirmModalOpen(false);
                                        setTempAvatar(null);
                                    }
                                }}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative bg-white w-full max-w-[400px] rounded-[2rem] shadow-2xl overflow-hidden p-8"
                            >
                                <div className="flex flex-col items-center gap-6">
                                    <div className="text-center">
                                        <h3 className="text-[1.25rem] font-black text-slate-800 uppercase tracking-tight mb-2">Đổi ảnh đại diện</h3>
                                        <p className="text-[0.875rem] text-slate-500 font-medium leading-relaxed italic">Bạn có muốn đặt bức ảnh này làm ảnh đại diện mới không?</p>
                                    </div>

                                    <div className="w-40 h-40 rounded-3xl overflow-hidden border-4 border-slate-50 shadow-xl rotate-2 hover:rotate-0 transition-transform duration-300">
                                        <img src={tempAvatar || ""} className="w-full h-full object-cover" alt="preview" />
                                    </div>

                                    <div className="flex flex-col w-full gap-3 mt-4">
                                        <button
                                            onClick={handleConfirmAvatar}
                                            disabled={savingAvatar}
                                            className="w-full bg-client-primary text-white py-4 rounded-2xl font-black text-[0.95rem] shadow-lg shadow-red-100 hover:bg-client-secondary disabled:opacity-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                        >
                                            {savingAvatar ? (
                                                <Loader2 size={20} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <Check size={20} strokeWidth={3} />
                                                    Đồng ý thay đổi
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsConfirmModalOpen(false);
                                                setTempAvatar(null);
                                            }}
                                            disabled={savingAvatar}
                                            className="w-full py-4 rounded-2xl font-bold text-[0.9rem] text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-[0.98]"
                                        >
                                            Để sau
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* MODAL VIEW FULL AVATAR */}
                <AnimatePresence>
                    {isPreviewOpen && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsPreviewOpen(false)}
                                className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="relative max-w-[500px] w-full aspect-square"
                            >
                                <img
                                    src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || "user"}`}
                                    className="w-full h-full rounded-[2.5rem] object-cover shadow-2xl border-4 border-white/10"
                                    alt="avatar full"
                                />
                                <button
                                    onClick={() => setIsPreviewOpen(false)}
                                    className="absolute -top-4 -right-4 bg-white text-slate-900 p-2.5 rounded-full shadow-xl hover:bg-slate-100 transition-all border border-slate-200"
                                >
                                    <X size={20} strokeWidth={2.5} />
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

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
                        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[0.75rem] text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all border-none cursor-pointer hover:translate-x-1"
                    >
                        <LogOut size={16} />
                        <span className="flex-1 text-left whitespace-nowrap">Đăng xuất</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
