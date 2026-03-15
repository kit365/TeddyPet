import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
    Calendar, Mail, Phone, User, VenusAndMars, Edit2, Check, X, Loader
} from "lucide-react";

import { DashboardLayout } from "./sections/DashboardLayout";
import { useAuthStore } from "../../../stores/useAuthStore";
import { getMe } from "../../../api/auth.api";
import { updateProfile } from "../../../api/user.api";

type GenderValue = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

const GENDER_OPTIONS: { value: GenderValue; label: string }[] = [
    { value: "MALE", label: "Nam" },
    { value: "FEMALE", label: "Nữ" },
    { value: "OTHER", label: "Khác" },
    { value: "PREFER_NOT_TO_SAY", label: "Không tiết lộ" },
];

const normalizeDate = (value?: string) => {
    if (!value) return "";
    return value.slice(0, 10);
};

const showDate = (value?: string) => {
    if (!value) return "---";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "---";
    return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
};

export const ProfilePageV2 = () => {
    const { user, set } = useAuthStore();

    const [loading, setLoading] = useState(!user);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        dateOfBirth: "",
        gender: "PREFER_NOT_TO_SAY" as GenderValue,
        optionalEmail: "",
    });

    const breadcrumbs = useMemo(
        () => [
            { label: "Trang chủ", to: "/" },
            { label: "Tài khoản", to: "/dashboard/profile" },
            { label: "Thông tin cá nhân", to: "/dashboard/profile" },
        ],
        [],
    );

    useEffect(() => {
        const run = async () => {
            if (!user) setLoading(true);
            try {
                const res = await getMe();
                if (res.success && res.data) set({ user: res.data });
            } catch {
                // keep store data if request fails
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [set]);

    useEffect(() => {
        if (!user) return;
        setForm({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            phoneNumber: user.phoneNumber || "",
            dateOfBirth: normalizeDate(user.dateOfBirth),
            gender: (user.gender as GenderValue) || "PREFER_NOT_TO_SAY",
            optionalEmail: user.optionalEmail || "",
        });
    }, [user]);

    const handleSave = async () => {
        if (!form.firstName.trim() || !form.lastName.trim()) {
            toast.warn("Vui lòng điền đầy đủ Họ và Tên");
            return;
        }

        setSaving(true);
        try {
            const res = await updateProfile({
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                phoneNumber: form.phoneNumber.trim() || undefined,
                dateOfBirth: form.dateOfBirth || undefined,
                gender: form.gender,
                optionalEmail: form.optionalEmail.trim() || undefined,
            });

            if (res.success && res.data) {
                set({ user: res.data });
                setEditing(false);
                toast.success("Cập nhật thông tin thành công!");
            } else {
                toast.error(res.message || "Cập nhật thất bại");
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Cập nhật thất bại");
        } finally {
            setSaving(false);
        }
    };

    const joinedAtRaw = (user as any)?.createdAt || (user as any)?.createdDate || (user as any)?.createdOn || "";

    if (!user && !loading) {
        return (
            <DashboardLayout pageTitle="Tài khoản" breadcrumbs={breadcrumbs}>
                <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
                    <div className="w-[7.5rem] h-[7.5rem] bg-client-primary/[0.08] rounded-full flex items-center justify-center border-2 border-dashed border-client-primary/20">
                        <User size={52} className="text-client-primary/60" />
                    </div>
                    <div className="text-center">
                        <p className="text-[1.35rem] font-black text-client-secondary tracking-tight leading-snug">Vui lòng đăng nhập</p>
                        <p className="text-[1rem] text-gray-500 mt-[0.5rem] font-medium">Bạn cần đăng nhập để xem và quản lý thông tin cá nhân.</p>
                    </div>
                    <Link to="/auth/login" className="bg-client-primary text-white px-[2rem] py-[0.85rem] rounded-[1.25rem] font-bold text-[0.95rem] uppercase tracking-[0.05em] hover:bg-client-secondary transition-all duration-300 shadow-lg shadow-client-primary/20 active:scale-95">
                        Đăng nhập ngay
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout pageTitle="Thông tin cá nhân" breadcrumbs={breadcrumbs}>
            <div className="max-w-[60rem] animate-in fade-in duration-500">
                {/* HEADER SECTION */}
                <div className="flex items-center justify-between gap-4 mb-[2.5rem] pb-[1.25rem] border-b border-gray-100">
                    <div className="flex items-center gap-[0.9rem]">
                        <div className="w-[3rem] h-[3rem] rounded-full bg-client-primary/[0.08] border border-client-primary/15 flex items-center justify-center">
                            <User size={18} className="text-client-primary" />
                        </div>
                        <div>
                            <h2 className="text-[1.25rem] font-black text-client-secondary leading-tight">Hồ sơ cá nhân</h2>
                            <p className="text-[0.75rem] text-gray-500 font-semibold mt-[0.2rem] uppercase tracking-[0.08em]">Quản lý thông tin của bạn</p>
                        </div>
                    </div>

                    {!editing ? (
                        <button
                            onClick={() => setEditing(true)}
                            className="group flex items-center gap-[0.6rem] border-2 border-gray-200 bg-white text-client-secondary px-[1.2rem] py-[0.7rem] rounded-[0.85rem] font-semibold text-[0.9rem] hover:border-client-primary hover:text-client-primary hover:shadow-md hover:shadow-client-primary/15 transition-all duration-300 active:scale-95"
                        >
                            <Edit2 size={16} className="text-gray-400 group-hover:text-client-primary transition-colors" />
                            Chỉnh sửa
                        </button>
                    ) : (
                        <div className="flex items-center gap-[0.8rem]">
                            <button
                                onClick={() => setEditing(false)}
                                className="text-[0.9rem] font-semibold text-gray-500 hover:text-red-500 hover:bg-red-50 px-[1rem] py-[0.6rem] rounded-[0.7rem] transition-all duration-200 flex items-center gap-[0.5rem] active:scale-95"
                            >
                                <X size={18} />
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-[0.6rem] bg-client-primary text-white px-[1.5rem] py-[0.7rem] rounded-[0.85rem] font-semibold text-[0.9rem] hover:bg-client-secondary hover:shadow-lg hover:shadow-client-primary/30 transition-all duration-300 shadow-md shadow-client-primary/20 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                            >
                                {saving ? (
                                    <>
                                        <Loader size={16} className="animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        Cập nhật
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {editing && (
                    <div className="mb-[1.1rem] rounded-[0.9rem] border border-client-primary/25 bg-client-primary/[0.08] px-[1rem] py-[0.75rem] text-[0.9rem] text-client-secondary font-semibold flex items-center gap-[0.55rem]">
                        <Edit2 size={16} className="text-client-primary" />
                        Chế độ chỉnh sửa đang bật. Bạn có thể cập nhật trực tiếp các ô thông tin.
                    </div>
                )}

                {/* CONTENT SECTION */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.25rem]">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-[6.5rem] rounded-[1rem] bg-gray-50 animate-pulse border border-gray-100" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-[1.75rem]">
                        {/* NAME SECTION */}
                        <div>
                            <p className="text-[0.8rem] font-black text-gray-500 uppercase tracking-[0.1em] mb-[0.75rem]">Tên người dùng</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.25rem]">
                                <InputField
                                    icon={<User size={18} />}
                                    label="Họ"
                                    value={form.lastName}
                                    editing={editing}
                                    onChange={(v) => setForm(p => ({ ...p, lastName: v }))}
                                />
                                <InputField
                                    icon={<User size={18} />}
                                    label="Tên"
                                    value={form.firstName}
                                    editing={editing}
                                    onChange={(v) => setForm(p => ({ ...p, firstName: v }))}
                                />
                            </div>
                        </div>

                        {/* CONTACT SECTION */}
                        <div>
                            <p className="text-[0.8rem] font-black text-gray-500 uppercase tracking-[0.1em] mb-[0.75rem]">Thông tin liên hệ</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.25rem]">
                                <ReadonlyField
                                    icon={<Mail size={18} />}
                                    label="Email chính"
                                    value={user?.email || "---"}
                                    verified
                                />
                                <InputField
                                    icon={<Phone size={18} />}
                                    label="Số điện thoại"
                                    value={form.phoneNumber}
                                    editing={editing}
                                    onChange={(v) => setForm(p => ({ ...p, phoneNumber: v }))}
                                    placeholder="Ví dụ: 0123456789"
                                />
                            </div>
                        </div>

                        {/* PERSONAL INFO SECTION */}
                        <div>
                            <p className="text-[0.8rem] font-black text-gray-500 uppercase tracking-[0.1em] mb-[0.75rem]">Thông tin cá nhân</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.25rem]">
                                <InputField
                                    icon={<Calendar size={18} />}
                                    label="Ngày sinh"
                                    type="date"
                                    value={form.dateOfBirth}
                                    display={!editing ? showDate(form.dateOfBirth) : undefined}
                                    editing={editing}
                                    onChange={(v) => setForm(p => ({ ...p, dateOfBirth: v }))}
                                />
                                <SelectField
                                    icon={<VenusAndMars size={18} />}
                                    label="Giới tính"
                                    value={form.gender}
                                    editing={editing}
                                    onChange={(v) => setForm(p => ({ ...p, gender: v as GenderValue }))}
                                    options={GENDER_OPTIONS}
                                />
                            </div>
                        </div>

                        {/* ADDITIONAL INFO SECTION */}
                        <div>
                            <p className="text-[0.8rem] font-black text-gray-500 uppercase tracking-[0.1em] mb-[0.75rem]">Thông tin bổ sung</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.25rem]">
                                <ReadonlyField
                                    icon={<Calendar size={18} />}
                                    label="Ngày tham gia"
                                    value={showDate(joinedAtRaw)}
                                />
                                <InputField
                                    icon={<Mail size={18} />}
                                    label="Email phụ"
                                    type="email"
                                    value={form.optionalEmail}
                                    editing={editing}
                                    onChange={(v) => setForm(p => ({ ...p, optionalEmail: v }))}
                                    placeholder="Ví dụ: email.khac@gmail.com"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

interface InputFieldProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    editing: boolean;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    display?: string;
}

const InputField = ({
    icon,
    label,
    value,
    editing,
    onChange,
    type = "text",
    placeholder = "",
    display
}: InputFieldProps) => (
    <div className={`group border rounded-[1rem] p-[1.25rem] transition-all duration-300 ${editing
        ? "bg-white border-client-primary/55 ring-2 ring-client-primary/10 shadow-sm shadow-client-primary/15"
        : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-md hover:shadow-gray-100/50"
        } focus-within:border-client-primary focus-within:shadow-md focus-within:shadow-client-primary/[0.12]`}>
        <label className={`text-[0.75rem] font-black uppercase tracking-[0.08em] flex items-center gap-[0.5rem] mb-[0.6rem] leading-none ${editing ? "text-client-primary" : "text-gray-500"}`}>
            <span className={`transition-colors ${editing ? "text-client-primary" : "text-gray-400 group-focus-within:text-client-primary"}`}>{icon}</span>
            {label}
        </label>
        {editing ? (
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full outline-none font-semibold text-client-secondary text-[1rem] bg-white border border-gray-300 rounded-[0.65rem] px-[0.7rem] py-[0.55rem] hover:border-client-primary/50 focus:border-client-primary focus:ring-2 focus:ring-client-primary/20 transition-all placeholder:text-gray-300"
            />
        ) : (
            <div className="font-semibold text-client-secondary text-[1rem] leading-snug">
                {display || value || <span className="text-gray-400 font-normal italic">Chưa cập nhật</span>}
            </div>
        )}
    </div>
);

interface ReadonlyFieldProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    verified?: boolean;
}

const ReadonlyField = ({ icon, label, value, verified }: ReadonlyFieldProps) => (
    <div className="bg-gray-50/50 border border-gray-100 rounded-[1rem] p-[1.25rem] flex flex-col justify-between">
        <label className="text-[0.75rem] font-black text-gray-500 uppercase tracking-[0.08em] flex items-center gap-[0.5rem] mb-[0.6rem] leading-none">
            <span className="text-gray-400">{icon}</span>
            {label}
        </label>
        <div className="flex items-center gap-[0.8rem] justify-between">
            <div className="font-semibold text-client-secondary text-[1rem]">{value}</div>
            {verified && (
                <div className="px-[0.75rem] py-[0.35rem] bg-emerald-500/10 border border-emerald-200 rounded-full flex items-center gap-[0.4rem]">
                    <div className="w-[0.5rem] h-[0.5rem] bg-emerald-500 rounded-full" />
                    <span className="text-[0.7rem] font-bold text-emerald-600 uppercase tracking-wider">Đã xác minh</span>
                </div>
            )}
        </div>
    </div>
);

interface SelectFieldProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    editing: boolean;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}

const SelectField = ({
    icon,
    label,
    value,
    editing,
    onChange,
    options
}: SelectFieldProps) => {
    const display = options.find((x) => x.value === value)?.label || "---";

    return (
        <div className={`group border rounded-[1rem] p-[1.25rem] transition-all duration-300 ${editing
            ? "bg-white border-client-primary/55 ring-2 ring-client-primary/10 shadow-sm shadow-client-primary/15"
            : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-md hover:shadow-gray-100/50"
            } focus-within:border-client-primary focus-within:shadow-md focus-within:shadow-client-primary/[0.12]`}>
            <label className={`text-[0.75rem] font-black uppercase tracking-[0.08em] flex items-center gap-[0.5rem] mb-[0.6rem] leading-none ${editing ? "text-client-primary" : "text-gray-500"}`}>
                <span className={`transition-colors ${editing ? "text-client-primary" : "text-gray-400 group-focus-within:text-client-primary"}`}>{icon}</span>
                {label}
            </label>
            {editing ? (
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full outline-none font-semibold text-client-secondary text-[1rem] bg-white border border-gray-300 rounded-[0.65rem] px-[0.7rem] py-[0.55rem] hover:border-client-primary/50 focus:border-client-primary focus:ring-2 focus:ring-client-primary/20 cursor-pointer appearance-none transition-all"
                >
                    {options.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            ) : (
                <div className="font-semibold text-client-secondary text-[1rem]">{display}</div>
            )}
        </div>
    );
};
