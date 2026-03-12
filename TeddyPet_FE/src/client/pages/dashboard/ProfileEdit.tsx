import { ArrowRight, User, Bell, Phone, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuthStore } from "../../../stores/useAuthStore";
import { DashboardLayout } from "./sections/DashboardLayout";
import { useState, useEffect } from "react";

export const ProfileEditPage = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        dateOfBirth: ""
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                email: user.email || "",
                phoneNumber: user.phoneNumber || "",
                dateOfBirth: user.dateOfBirth || ""
            });
        }
    }, [user]);

    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Tài khoản", to: "/dashboard/profile" },
        { label: "Chỉnh sửa thông tin", to: `/dashboard/profile/edit` },
    ];

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Logic call API cập nhật ở đây
        toast.success("Cập nhật thông tin thành công!");
        navigate("/dashboard/profile");
    };

    if (!user) return null;

    return (
        <DashboardLayout pageTitle="Chỉnh sửa hồ sơ" breadcrumbs={breadcrumbs}>
            <div className="space-y-12">
                <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                    <div>
                        <h3 className="text-[1.75rem] font-black text-slate-800 tracking-tight flex items-center gap-3">
                            Chỉnh sửa thông tin
                        </h3>
                        <p className="text-[0.75rem] text-slate-400 font-medium mt-1 uppercase tracking-widest">Cập nhật dữ liệu cá nhân của bạn</p>
                    </div>
                </div>

                <form onSubmit={onSubmit} className="space-y-10">
                    <div className="grid grid-cols-2 gap-10">
                        {/* HỌ */}
                        <div className="flex flex-col gap-4">
                            <label className="text-[0.6875rem] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <User size={14} className="text-slate-300" /> Họ
                            </label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="bg-white border border-slate-100 rounded-[1.25rem] px-8 py-6 text-[1rem] font-bold text-slate-800 shadow-sm focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                                placeholder="Nhập họ"
                            />
                        </div>

                        {/* TÊN */}
                        <div className="flex flex-col gap-4">
                            <label className="text-[0.6875rem] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <User size={14} className="text-slate-300" /> Tên
                            </label>
                            <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="bg-white border border-slate-100 rounded-[1.25rem] px-8 py-6 text-[1rem] font-bold text-slate-800 shadow-sm focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                                placeholder="Nhập tên"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-10">
                        {/* EMAIL */}
                        <div className="flex flex-col gap-4">
                            <label className="text-[0.6875rem] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Bell size={14} className="text-slate-300" /> Email liên hệ
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                disabled
                                className="bg-slate-50 border border-slate-100 rounded-[1.25rem] px-8 py-6 text-[1rem] font-bold text-slate-400 cursor-not-allowed opacity-70"
                            />
                        </div>

                        {/* SỐ ĐIỆN THOẠI */}
                        <div className="flex flex-col gap-4">
                            <label className="text-[0.6875rem] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Phone size={14} className="text-slate-300" /> Số điện thoại
                            </label>
                            <input
                                type="text"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                className="bg-white border border-slate-100 rounded-[1.25rem] px-8 py-6 text-[1rem] font-bold text-slate-800 shadow-sm focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                                placeholder="Nhập số điện thoại"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-10">
                        {/* NGÀY SINH */}
                        <div className="flex flex-col gap-4">
                            <label className="text-[0.6875rem] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Calendar size={14} className="text-slate-300" /> Ngày sinh
                            </label>
                            <input
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                className="bg-white border border-slate-100 rounded-[1.25rem] px-8 py-6 text-[1rem] font-bold text-slate-800 shadow-sm focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-10 border-t border-slate-50">
                        <button
                            type="submit"
                            className="flex items-center gap-3 bg-client-primary text-white px-12 py-5 rounded-3xl font-black text-[0.875rem] uppercase tracking-widest hover:bg-client-secondary transition-all shadow-xl shadow-client-primary/20 active:scale-95"
                        >
                            Lưu thay đổi <ArrowRight size={20} />
                        </button>
                        <Link
                            to="/dashboard/profile"
                            className="text-[0.8125rem] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest px-8 py-5 transition-colors"
                        >
                            Hủy bỏ
                        </Link>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
};
