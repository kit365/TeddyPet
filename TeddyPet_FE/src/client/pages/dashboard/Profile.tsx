import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
    Calendar, Mail, Phone, User, VenusAndMars, Edit2, Check, X, Loader, Plus, ChevronDown
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

export const ProfilePage = () => {
    const { user, set } = useAuthStore();

    const [loading, setLoading] = useState(!user);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);

    const dateInputRef = useRef<HTMLInputElement | null>(null);

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
                    <div className="w-[7.5rem] h-[7.5rem] bg-slate-100 rounded-full flex items-center justify-center border-2 border-dashed border-slate-300">
                        <User size={52} className="text-slate-400" />
                    </div>
                    <div className="text-center">
                        <p className="text-[1.35rem] font-bold text-slate-800 tracking-tight leading-snug">Vui lòng đăng nhập</p>
                        <p className="text-[1rem] text-slate-500 mt-[0.5rem] font-medium">Bạn cần đăng nhập để xem và quản lý thông tin cá nhân.</p>
                    </div>
                    <Link to="/auth/login" className="bg-client-primary text-white px-[2rem] py-[0.85rem] rounded-[1rem] font-semibold text-[0.95rem] uppercase tracking-[0.05em] hover:bg-client-secondary transition-all duration-300 shadow-md shadow-client-primary/25 active:scale-95">
                        Đăng nhập ngay
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout pageTitle="Thông tin cá nhân" breadcrumbs={breadcrumbs}>
            <div className="max-w-[50rem]">
                {/* HEADER */}
                <div className="flex items-center justify-between gap-4 mb-[2rem]">
                    <h1 className="text-[1.5rem] font-bold text-slate-800">Hồ sơ cá nhân</h1>

                    {!editing ? (
                        <button
                            onClick={() => setEditing(true)}
                            className="inline-flex items-center gap-[0.5rem] px-[1.25rem] py-[0.7rem] bg-client-primary text-white rounded-[0.85rem] font-semibold text-[0.9rem] hover:bg-[#102937] hover:shadow-[0_10px_24px_rgba(16,41,55,0.25)] transition-all duration-200 shadow-[0_10px_24px_rgba(255,98,98,0.25)] active:scale-95"
                        >
                            <Edit2 size={16} />
                            Chỉnh sửa
                        </button>
                    ) : (
                        <div className="flex items-center gap-[0.6rem]">
                            <button
                                onClick={() => setEditing(false)}
                                className="inline-flex items-center gap-[0.4rem] px-[1rem] py-[0.7rem] text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-[0.75rem] font-semibold text-[0.9rem] hover:shadow-sm transition-all duration-200 active:scale-95"
                            >
                                <X size={18} />
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-[0.5rem] px-[1.25rem] py-[0.7rem] bg-client-primary text-white rounded-[0.85rem] font-semibold text-[0.9rem] hover:bg-client-secondary hover:shadow-lg hover:shadow-client-primary/30 transition-all duration-200 shadow-sm shadow-client-primary/20 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                            >
                                {saving ? (
                                    <>
                                        <Loader size={16} className="animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        Lưu thay đổi
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {editing && (
                    <div className="mb-[1.5rem] rounded-[0.85rem] border border-client-primary/20 bg-client-primary/[0.06] px-[1rem] py-[0.75rem] text-[0.9rem] text-client-primary font-medium flex items-center gap-[0.6rem]">
                        <Edit2 size={16} />
                        Chế độ chỉnh sửa đang bật
                    </div>
                )}

                {/* CONTENT */}
                {loading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-[7rem] rounded-[1.25rem] bg-slate-100 animate-pulse border border-slate-200" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-[1.5rem]">
                        {/* NAME SECTION */}
                        <ListGroup>
                            {editing ? (
                                <>
                                    <ListGroupItem>
                                        <Field
                                            icon={<User size={18} />}
                                            label="Họ"
                                            value={form.lastName}
                                            editing={editing}
                                            onChange={(v) => setForm(p => ({ ...p, lastName: v }))}
                                        />
                                    </ListGroupItem>
                                    <ListGroupItem border>
                                        <Field
                                            icon={<User size={18} />}
                                            label="Tên"
                                            value={form.firstName}
                                            editing={editing}
                                            onChange={(v) => setForm(p => ({ ...p, firstName: v }))}
                                        />
                                    </ListGroupItem>
                                </>
                            ) : (
                                <ListGroupItem>
                                    <Field
                                        icon={<User size={18} />}
                                        label="Họ và tên"
                                        value={`${form.lastName} ${form.firstName}`.trim()}
                                        editing={false}
                                        onChange={() => {}}
                                    />
                                </ListGroupItem>
                            )}
                        </ListGroup>

                        {/* CONTACT SECTION */}
                        <ListGroup>
                            <ListGroupItem>
                                <div className="grid grid-cols-[auto_1fr] items-center gap-4">
                                    <div className="flex items-center gap-[0.7rem] flex-shrink-0">
                                        <Mail size={16} className="text-slate-400" />
                                        <span className="text-[0.75rem] font-bold uppercase text-slate-500 tracking-wider whitespace-nowrap">Email chính</span>
                                    </div>
                                    <div className="flex items-center gap-2 justify-end w-full max-w-[260px] min-w-[260px] ml-auto">
                                        <span className="font-medium text-slate-800 text-[0.95rem] flex-1 text-right">{user?.email || "---"}</span>
                                        <div className="px-[0.6rem] py-[0.3rem] bg-emerald-50 border border-emerald-200 rounded-full flex items-center gap-[0.3rem] whitespace-nowrap flex-shrink-0">
                                            <div className="w-[0.4rem] h-[0.4rem] bg-emerald-500 rounded-full" />
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Xác minh</span>
                                        </div>
                                    </div>
                                </div>
                            </ListGroupItem>
                            <ListGroupItem border>
                                <div className="grid grid-cols-[auto_1fr] items-center gap-4">
                                    <div className="flex items-center gap-[0.7rem] flex-shrink-0">
                                        <Phone size={16} className="text-slate-400" />
                                        <span className="text-[0.75rem] font-bold uppercase text-slate-500 tracking-wider whitespace-nowrap">Số điện thoại</span>
                                    </div>
                                    {editing ? (
                                        <input
                                            type="tel"
                                            value={form.phoneNumber}
                                            onChange={(e) => setForm(p => ({ ...p, phoneNumber: e.target.value }))}
                                            placeholder="0123456789"
                                            className="w-full max-w-[260px] min-w-[260px] ml-auto text-right outline-none font-normal text-sm text-slate-800 bg-slate-50 border border-transparent rounded-lg px-3 py-2 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300 placeholder:font-light"
                                        />
                                    ) : (
                                        <span className={`block w-full max-w-[260px] min-w-[260px] ml-auto text-right font-medium text-slate-800 text-[0.95rem] ${form.phoneNumber ? "text-slate-800" : "text-slate-400 italic"}`}>
                                            {form.phoneNumber || "Chưa cập nhật"}
                                        </span>
                                    )}
                                </div>
                            </ListGroupItem>
                        </ListGroup>

                        {/* PERSONAL INFO SECTION */}
                        <ListGroup>
                            <ListGroupItem>
                                <div className="grid grid-cols-[auto_1fr] items-stretch gap-4">
                                    <div className="flex items-center gap-[0.7rem] flex-shrink-0">
                                        <Calendar size={16} className="text-slate-400" />
                                        <span className="text-[0.75rem] font-bold uppercase text-slate-500 tracking-wider whitespace-nowrap">Ngày sinh</span>
                                    </div>
                                    {editing ? (
                                        <div className="relative w-full max-w-[260px] min-w-[260px] ml-auto">
                                            <input
                                                ref={dateInputRef}
                                                type="date"
                                                value={form.dateOfBirth}
                                                onChange={(e) => setForm(p => ({ ...p, dateOfBirth: e.target.value }))}
                                                className="w-full text-right outline-none font-normal text-sm text-slate-800 bg-slate-50 border border-transparent rounded-lg pl-3 pr-10 py-2 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all [appearance:textfield] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    dateInputRef.current?.showPicker?.();
                                                    dateInputRef.current?.focus();
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors pointer-events-auto"
                                            >
                                                <Calendar size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className={`block w-full max-w-[260px] min-w-[260px] ml-auto text-right font-medium text-[0.95rem] ${form.dateOfBirth ? "text-slate-800" : "text-slate-400 italic"}`}>
                                            {form.dateOfBirth ? showDate(form.dateOfBirth) : "Chưa cập nhật"}
                                        </span>
                                    )}
                                </div>
                            </ListGroupItem>
                            <ListGroupItem border>
                                <div className="grid grid-cols-[auto_1fr] items-stretch gap-4">
                                    <div className="flex items-center gap-[0.7rem] flex-shrink-0">
                                        <VenusAndMars size={16} className="text-slate-400" />
                                        <span className="text-[0.75rem] font-bold uppercase text-slate-500 tracking-wider whitespace-nowrap">Giới tính</span>
                                    </div>
                                    {editing ? (
                                        <div className="relative w-full max-w-[260px] min-w-[260px] ml-auto">
                                            <select
                                                value={form.gender}
                                                onChange={(e) => setForm(p => ({ ...p, gender: e.target.value as GenderValue }))}
                                                className="w-full text-right outline-none font-normal text-sm text-slate-800 bg-slate-50 border border-transparent rounded-lg pl-3 pr-10 py-2 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
                                            >
                                                {GENDER_OPTIONS.map((o) => (
                                                    <option key={o.value} value={o.value}>{o.label}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center h-full">
                                                <ChevronDown size={16} strokeWidth={2.5} />
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="block w-full max-w-[260px] min-w-[260px] ml-auto text-right font-medium text-slate-800 text-[0.95rem]">
                                            {GENDER_OPTIONS.find((x) => x.value === form.gender)?.label || "---"}
                                        </span>
                                    )}
                                </div>
                            </ListGroupItem>
                        </ListGroup>

                        {/* ADDITIONAL INFO SECTION */}
                        <ListGroup>
                            <ListGroupItem>
                                <div className="grid grid-cols-[auto_1fr] items-center gap-4">
                                    <div className="flex items-center gap-[0.7rem] flex-shrink-0">
                                        <Calendar size={16} className="text-slate-400" />
                                        <span className="text-[0.75rem] font-bold uppercase text-slate-500 tracking-wider whitespace-nowrap">Ngày tham gia</span>
                                    </div>
                                    <span className="block w-full max-w-[260px] min-w-[260px] ml-auto text-right font-medium text-slate-800 text-[0.95rem]">{showDate(joinedAtRaw)}</span>
                                </div>
                            </ListGroupItem>
                            <ListGroupItem border>
                                <div className="grid grid-cols-[auto_1fr] items-center gap-4">
                                    <div className="flex items-center gap-[0.7rem] flex-shrink-0">
                                        <Mail size={16} className="text-slate-400" />
                                        <span className="text-[0.75rem] font-bold uppercase text-slate-500 tracking-wider whitespace-nowrap">Email phụ</span>
                                    </div>
                                    {editing ? (
                                        <input
                                            type="email"
                                            value={form.optionalEmail}
                                            onChange={(e) => setForm(p => ({ ...p, optionalEmail: e.target.value }))}
                                            placeholder="email.khac@gmail.com"
                                            className="w-full max-w-[260px] min-w-[260px] ml-auto text-right outline-none font-normal text-sm text-slate-800 bg-slate-50 border border-transparent rounded-lg px-3 py-2 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300 placeholder:font-light"
                                        />
                                    ) : (
                                        <div className="flex w-full max-w-[260px] min-w-[260px] ml-auto items-center gap-[0.5rem] text-right justify-end">
                                            <span className={`font-medium text-[0.95rem] ${form.optionalEmail ? "text-slate-800" : "text-slate-400 italic"}`}>
                                                {form.optionalEmail || "Chưa cập nhật"}
                                            </span>
                                            {!form.optionalEmail && !editing && (
                                                <button
                                                    onClick={() => setEditing(true)}
                                                    className="text-client-primary hover:text-client-secondary text-[0.8rem] font-bold flex items-center gap-[0.2rem] transition-colors"
                                                    title="Thêm email phụ"
                                                >
                                                    <Plus size={14} />
                                                    Thêm
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </ListGroupItem>
                        </ListGroup>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ListGroup = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white rounded-[1.25rem] border border-slate-100 shadow-sm overflow-hidden">
        {children}
    </div>
);

const ListGroupItem = ({ border, children }: { border?: boolean; children: React.ReactNode }) => (
    <div className={`px-[1rem] py-[0.8rem] ${border ? "border-t border-slate-100" : ""}`}>
        {children}
    </div>
);

const Field = ({
    icon,
    label,
    value,
    editing,
    onChange,
    type = "text",
    placeholder = "",
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    editing: boolean;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
}) => (
    <div className="grid grid-cols-[auto_1fr] items-center gap-4">
        <div className="flex items-center gap-[0.7rem] flex-shrink-0">
            <span className="text-slate-400">{icon}</span>
            <span className="text-[0.75rem] font-bold uppercase text-slate-500 tracking-wider whitespace-nowrap">{label}</span>
        </div>
        {editing ? (
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full max-w-[260px] min-w-[260px] ml-auto text-right outline-none font-normal text-sm text-slate-800 bg-slate-50 border border-transparent rounded-lg px-3 py-2 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300 placeholder:font-light"
            />
        ) : (
            <span className={`block w-full max-w-[260px] min-w-[260px] ml-auto text-right font-medium text-[0.95rem] ${value ? "text-slate-800" : "text-slate-400 italic"}`}>
                {value || "Chưa cập nhật"}
            </span>
        )}
    </div>
);
