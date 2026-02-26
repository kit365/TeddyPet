import { Link } from "react-router-dom";
import { useAuthStore } from "../../../stores/useAuthStore";
import { Edit2, User, Bell, CreditCard, ShieldCheck, Check, X } from "lucide-react";
import { DashboardLayout } from "./sections/DashboardLayout";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

import { updateProfile } from "../../../api/user.api";

export const ProfilePage = () => {
    const { user, set } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        dateOfBirth: "",
        gender: "MALE"
    });

    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Tài khoản", to: "/dashboard/profile" },
        { label: "Thông tin cá nhân", to: `/dashboard/profile` },
    ];

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                phoneNumber: user.phoneNumber || "0764349919",
                dateOfBirth: user.dateOfBirth || "1998-10-20",
                gender: user.gender || "MALE"
            });
        }
    }, [user, isEditing]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const response = await updateProfile(formData);
            if (response.success) {
                set({ user: response.data });
                toast.success("Cập nhật thông tin thành công!");
                setIsEditing(false);
            } else {
                toast.error(response.message || "Có lỗi xảy ra");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Cập nhật thất bại");
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <DashboardLayout pageTitle="Tài khoản" breadcrumbs={breadcrumbs}>
                <div className="min-h-[40vh] flex flex-col items-center justify-center gap-6">
                    <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 animate-pulse">
                        <User size={48} />
                    </div>
                    <div className="text-center">
                        <p className="text-[2rem] font-black text-slate-800 tracking-tight">Vui lòng đăng nhập</p>
                        <p className="text-slate-400 mt-2 font-medium">Bạn cần đăng nhập để quản lý thông tin cá nhân.</p>
                    </div>
                    <Link to="/auth/login" className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-indigo-100">
                        Đăng nhập ngay
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout pageTitle="Thông tin cá nhân" breadcrumbs={breadcrumbs}>
            <div className="space-y-12">
                <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                    <div>
                        <h3 className="text-[2.8rem] font-black text-slate-800 tracking-tight flex items-center gap-3">
                            Thông tin cá nhân
                        </h3>
                        <p className="text-[1.2rem] text-slate-400 font-medium mt-1 uppercase tracking-widest">Dữ liệu định danh chính chủ</p>
                    </div>
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-3 bg-client-primary text-white px-8 py-3.5 rounded-2xl font-black text-[1.1rem] uppercase tracking-widest hover:bg-client-secondary transition-all shadow-lg shadow-client-primary/20"
                        >
                            <Edit2 size={16} /> Chỉnh sửa
                        </button>
                    ) : (
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="text-[1.2rem] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest px-6 py-3 transition-colors flex items-center gap-2"
                            >
                                <X size={18} /> Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className={`flex items-center gap-3 bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black text-[1.1rem] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-indigo-100 ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : <Check size={18} />}
                                {loading ? "Đang lưu..." : "Lưu thay đổi"}
                            </button>
                        </div>
                    )}
                </div>

                <div className="space-y-10">
                    <div className="grid grid-cols-2 gap-10">
                        {/* HỌ */}
                        <div className="flex flex-col gap-4">
                            <label className="text-[1.1rem] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <User size={14} className="text-slate-300" /> Họ
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="bg-white border border-slate-100 rounded-[2rem] px-10 py-8 text-[1.8rem] font-bold text-slate-800 shadow-sm focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                                />
                            ) : (
                                <div className="bg-white border border-slate-100 rounded-[2rem] px-10 py-8 text-[1.8rem] font-bold text-slate-800 shadow-sm shadow-slate-200/50">
                                    {user.lastName}
                                </div>
                            )}
                        </div>

                        {/* TÊN */}
                        <div className="flex flex-col gap-4">
                            <label className="text-[1.1rem] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <User size={14} className="text-slate-300" /> Tên
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="bg-white border border-slate-100 rounded-[2rem] px-10 py-8 text-[1.8rem] font-bold text-slate-800 shadow-sm focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                                />
                            ) : (
                                <div className="bg-white border border-slate-100 rounded-[2rem] px-10 py-8 text-[1.8rem] font-bold text-slate-800 shadow-sm shadow-slate-200/50">
                                    {user.firstName}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-10">
                        {/* EMAIL */}
                        <div className="flex flex-col gap-4">
                            <label className="text-[1.1rem] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Bell size={14} className="text-slate-300" /> Email liên hệ
                            </label>
                            <div className="bg-slate-50 border border-slate-100 rounded-[2rem] px-10 py-8 text-[1.8rem] font-bold text-slate-500 flex justify-between items-center shadow-sm shadow-slate-200/50 opacity-70">
                                {user.email}
                                <ShieldCheck size={22} className="text-emerald-500 fill-emerald-50" />
                            </div>
                        </div>

                        {/* SỐ ĐIỆN THOẠI */}
                        <div className="flex flex-col gap-4">
                            <label className="text-[1.1rem] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <CreditCard size={14} className="text-slate-300" /> Số điện thoại
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    className="bg-white border border-slate-100 rounded-[2rem] px-10 py-8 text-[1.8rem] font-bold text-slate-800 shadow-sm focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                                />
                            ) : (
                                <div className="bg-white border border-slate-100 rounded-[2rem] px-10 py-8 text-[1.8rem] font-bold text-slate-800 shadow-sm shadow-slate-200/50">
                                    {user.phoneNumber || "0764349919"}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-10">
                        {/* NGÀY SINH */}
                        <div className="flex flex-col gap-4">
                            <label className="text-[1.1rem] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Edit2 size={14} className="text-slate-300" /> Ngày sinh
                            </label>
                            {isEditing ? (
                                <input
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                    className="bg-white border border-slate-100 rounded-[2rem] px-10 py-8 text-[1.8rem] font-bold text-slate-800 shadow-sm focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                                />
                            ) : (
                                <div className="bg-white border border-slate-100 rounded-[2rem] px-10 py-8 text-[1.8rem] font-bold text-slate-800 shadow-sm shadow-slate-200/50">
                                    {new Date(formData.dateOfBirth).toLocaleDateString("vi-VN", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric"
                                    })}
                                </div>
                            )}
                        </div>

                        {/* GIỚI TÍNH */}
                        <div className="flex flex-col gap-4">
                            <label className="text-[1.1rem] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <User size={14} className="text-slate-300" /> Giới tính
                            </label>
                            {isEditing ? (
                                <select
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    className="bg-white border border-slate-100 rounded-[2rem] px-10 py-8 text-[1.8rem] font-bold text-slate-800 shadow-sm focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="MALE">Nam</option>
                                    <option value="FEMALE">Nữ</option>
                                    <option value="OTHER">Khác</option>
                                    <option value="PREFER_NOT_TO_SAY">Không tiết lộ</option>
                                </select>
                            ) : (
                                <div className="bg-white border border-slate-100 rounded-[2rem] px-10 py-8 text-[1.8rem] font-bold text-slate-800 shadow-sm shadow-slate-200/50">
                                    {user.gender === "MALE" ? "Nam" : user.gender === "FEMALE" ? "Nữ" : user.gender === "OTHER" ? "Khác" : "Chưa cập nhật"}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-10">
                        {/* NGÀY THAM GIA */}
                        <div className="flex flex-col gap-4">
                            <label className="text-[1.1rem] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <ShieldCheck size={14} className="text-slate-300" /> Ngày tham gia
                            </label>
                            <div className="bg-slate-50 border border-slate-100 rounded-[2rem] px-10 py-8 text-[1.8rem] font-bold text-slate-500 flex justify-between items-center shadow-sm shadow-slate-200/50">
                                04/02/2024
                            </div>
                        </div>
                    </div>
                </div>

                {/* BANNER BẢO MẬT */}
                {!isEditing && (
                    <div className="pt-10 animate-in fade-in zoom-in duration-500">
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-slate-200 ring-1 ring-white/10">
                            <div className="absolute -top-10 -right-10 opacity-10 rotate-12">
                                <ShieldCheck size={250} />
                            </div>
                            <div className="relative z-10 flex justify-between items-center gap-10">
                                <div>
                                    <h4 className="text-[2.2rem] font-black tracking-tight italic leading-tight">Bảo vệ tài khoản</h4>
                                    <p className="text-[1.4rem] text-slate-300 font-medium mt-3 max-w-[450px]">Đảm bảo tài khoản của bạn luôn an toàn với các phương thức xác thực và đổi mật khẩu định kỳ.</p>
                                </div>
                                <Link to="/dashboard/change-password" title="Quản lý" className="bg-white/10 hover:bg-white text-white hover:text-indigo-900 px-10 py-4 rounded-[1.5rem] text-[1.2rem] font-black uppercase transition-all tracking-widest backdrop-blur-md border border-white/20">
                                    Thiết lập ngay
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};