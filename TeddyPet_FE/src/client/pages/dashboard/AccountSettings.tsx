import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
    Camera,
    Check,
    ExternalLink,
    LogOut,
    MapPin,
    Package,
    PawPrint,
    Pencil,
    ShieldCheck,
    User,
    X,
} from "lucide-react";

import { ProductBanner } from "../product/sections/ProductBanner";
import { useAuthStore } from "../../../stores/useAuthStore";
import { getMe, logout as logoutApi } from "../../../api/auth.api";
import { updateProfile } from "../../../api/user.api";

// ─── types ────────────────────────────────────────────────────────────────────
type GenderValue = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

const GENDER_OPTIONS: { value: GenderValue; label: string }[] = [
    { value: "MALE", label: "Nam" },
    { value: "FEMALE", label: "Nữ" },
    { value: "OTHER", label: "Khác" },
    { value: "PREFER_NOT_TO_SAY", label: "Không tiết lộ" },
];

// ─── helpers ──────────────────────────────────────────────────────────────────
const normalizeDate = (v?: string) => (v ? v.slice(0, 10) : "");

const showDate = (v?: string) => {
    if (!v) return "---";
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? "---" : d.toLocaleDateString("vi-VN");
};

// ─── left nav tabs ────────────────────────────────────────────────────────────
const NAV_TABS = [
    { label: "Hồ sơ cá nhân", icon: User, to: "/dashboard/account-settings" },
    { label: "Sổ địa chỉ", icon: MapPin, to: "/dashboard/address" },
    { label: "Thú cưng", icon: PawPrint, to: "/dashboard/pets" },
    { label: "Lịch sử đơn hàng", icon: Package, to: "/dashboard/orders" },
    { label: "Mật khẩu & Bảo mật", icon: ShieldCheck, to: "/dashboard/change-password" },
];

const NavItem = ({
    icon: Icon,
    label,
    to,
    active,
}: {
    icon: React.ElementType;
    label: string;
    to: string;
    active: boolean;
}) => (
    <Link
        to={to}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[0.875rem] font-semibold transition-all ${
            active
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
        }`}
    >
        <Icon size={17} />
        <span>{label}</span>
    </Link>
);

// ─── section card ─────────────────────────────────────────────────────────────
const SectionCard = ({
    title,
    action,
    children,
}: {
    title: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}) => (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/40">
            <h3 className="text-[0.9375rem] font-bold text-slate-800">{title}</h3>
            {action}
        </div>
        <div className="px-6 py-5">{children}</div>
    </div>
);

// ─── field helpers ────────────────────────────────────────────────────────────
const FLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider mb-1">
        {children}
    </p>
);

const EditField = ({
    label,
    value,
    onChange,
    editing,
    type = "text",
    display,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    editing: boolean;
    type?: string;
    display?: string;
}) => (
    <div>
        <FLabel>{label}</FLabel>
        {editing ? (
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full text-[0.9375rem] font-medium text-slate-800 border-b-2 border-slate-200 focus:border-slate-700 pb-0.5 outline-none bg-transparent transition-colors"
            />
        ) : (
            <p className="text-[0.9375rem] font-medium text-slate-800">{(display ?? value) || "---"}</p>
        )}
    </div>
);

const SelectField = ({
    label,
    value,
    onChange,
    editing,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    editing: boolean;
}) => {
    const display = GENDER_OPTIONS.find((x) => x.value === value)?.label || "---";
    return (
        <div>
            <FLabel>{label}</FLabel>
            {editing ? (
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full text-[0.9375rem] font-medium text-slate-800 border-b-2 border-slate-200 focus:border-slate-700 pb-0.5 outline-none bg-transparent transition-colors cursor-pointer"
                >
                    {GENDER_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
            ) : (
                <p className="text-[0.9375rem] font-medium text-slate-800">{display}</p>
            )}
        </div>
    );
};

const ReadonlyField = ({
    label,
    value,
    badge,
    muted,
}: {
    label: string;
    value: string;
    badge?: React.ReactNode;
    muted?: boolean;
}) => (
    <div>
        <FLabel>{label}</FLabel>
        <div className="flex items-center gap-2">
            <p className={`text-[0.9375rem] font-medium ${muted ? "text-slate-500" : "text-slate-800"}`}>
                {value}
            </p>
            {badge}
        </div>
    </div>
);

// ─── page ─────────────────────────────────────────────────────────────────────
export const AccountSettingsPage = () => {
    const { user, set, logout } = useAuthStore();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        dateOfBirth: "",
        gender: "PREFER_NOT_TO_SAY" as GenderValue,
    });

    const breadcrumbs = useMemo(
        () => [
            { label: "Trang chủ", to: "/" },
            { label: "Tài khoản", to: "/dashboard/account-settings" },
            { label: "Cài đặt tài khoản", to: "/dashboard/account-settings" },
        ],
        [],
    );

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await getMe();
                if (res.success && res.data) set({ user: res.data });
            } catch {
                // use store cache
            } finally {
                setLoading(false);
            }
        })();
    }, [set]);

    useEffect(() => {
        if (!user) return;
        setForm({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            phoneNumber: user.phoneNumber || "",
            dateOfBirth: normalizeDate(user.dateOfBirth),
            gender: (user.gender as GenderValue) || "PREFER_NOT_TO_SAY",
        });
    }, [user]);

    const save = async () => {
        setSaving(true);
        try {
            const res = await updateProfile({
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                phoneNumber: form.phoneNumber.trim() || undefined,
                dateOfBirth: form.dateOfBirth || undefined,
                gender: form.gender,
            });
            if (res.success && res.data) {
                set({ user: res.data });
                setEditing(false);
                toast.success("Đã cập nhật hồ sơ");
            } else {
                toast.error(res.message || "Cập nhật thất bại");
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Cập nhật thất bại");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try { await logoutApi(); } catch {}
        logout();
        navigate("/auth/login");
    };

    const joinedAtRaw =
        (user as any)?.createdAt ||
        (user as any)?.createdDate ||
        (user as any)?.createdOn ||
        "";

    const avatarSrc =
        user?.avatarUrl ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || "user"}`;

    if (!user && !loading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-4">
                <p className="font-semibold text-slate-800">Vui lòng đăng nhập để xem hồ sơ</p>
                <Link to="/auth/login" className="px-5 py-2.5 rounded-lg bg-client-primary text-white text-sm font-semibold">
                    Đăng nhập
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 pb-20">
            {/* ── banner ── */}
            <ProductBanner
                pageTitle="Cài đặt tài khoản"
                breadcrumbs={breadcrumbs}
                url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-details.jpg"
                className="bg-top !mb-0 shadow-sm"
            />

            {/* ── main card ── */}
            <div className="max-w-[1280px] w-full mx-auto px-6 mt-8 mb-16">
                <div className="bg-white rounded-[1.875rem] shadow-xl shadow-slate-200/50 border border-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex min-h-[560px]">

                        {/* ─── LEFT sidebar ─── */}
                        <div className="w-[260px] flex-shrink-0 border-r border-slate-100 flex flex-col">
                            {/* user mini card */}
                            <div className="p-6 border-b border-slate-100 bg-slate-50/40">
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-shrink-0">
                                        <img
                                            src={avatarSrc}
                                            alt="avatar"
                                            className="w-12 h-12 rounded-xl border border-slate-200 bg-white object-cover"
                                        />
                                        <label
                                            htmlFor="as_photo"
                                            className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-lg shadow border-2 border-white cursor-pointer hover:scale-110 transition-transform"
                                        >
                                            <Camera size={10} />
                                        </label>
                                        <input type="file" id="as_photo" hidden />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[0.875rem] font-bold text-slate-800 leading-tight truncate">
                                            {user?.lastName} {user?.firstName}
                                        </p>
                                        <p className="text-[0.75rem] text-slate-400 truncate">{user?.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* nav */}
                            <nav className="flex-1 p-4 space-y-0.5">
                                <p className="text-[0.625rem] font-black text-slate-300 uppercase tracking-[0.2em] px-4 py-2">
                                    Menu
                                </p>
                                {NAV_TABS.map((t) => (
                                    <NavItem
                                        key={t.to}
                                        icon={t.icon}
                                        label={t.label}
                                        to={t.to}
                                        active={t.to === "/dashboard/account-settings"}
                                    />
                                ))}
                            </nav>

                            {/* logout */}
                            <div className="p-4 border-t border-slate-100">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[0.875rem] font-semibold text-rose-500 hover:bg-rose-50 transition-all"
                                >
                                    <LogOut size={17} />
                                    Đăng xuất
                                </button>
                            </div>
                        </div>

                        {/* ─── RIGHT content ─── */}
                        <div className="flex-1 p-8 min-w-0 space-y-5">
                            <h2 className="text-[1.25rem] font-bold text-slate-800">Account Settings</h2>

                            {loading ? (
                                <div className="space-y-4">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {/* profile header */}
                                    <SectionCard
                                        title="Hồ sơ"
                                        action={
                                            <div className="flex items-center gap-2">
                                                {editing ? (
                                                    <>
                                                        <button
                                                            onClick={() => setEditing(false)}
                                                            className="flex items-center gap-1 text-[0.8125rem] font-semibold text-slate-400 hover:text-rose-500 transition-colors"
                                                        >
                                                            <X size={14} /> Hủy
                                                        </button>
                                                        <button
                                                            onClick={save}
                                                            disabled={saving}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-client-primary text-white text-[0.8125rem] font-semibold disabled:opacity-70"
                                                        >
                                                            {saving ? "Đang lưu..." : <><Check size={13} /> Lưu</>}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => setEditing(true)}
                                                        className="flex items-center gap-1.5 text-[0.8125rem] font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all"
                                                    >
                                                        <Pencil size={13} /> Edit
                                                    </button>
                                                )}
                                            </div>
                                        }
                                    >
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={avatarSrc}
                                                alt="avatar"
                                                className="w-14 h-14 rounded-2xl border border-slate-100 bg-slate-50 object-cover flex-shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-[1rem] font-bold text-slate-800 leading-tight">
                                                    {user?.lastName} {user?.firstName}
                                                </p>
                                                <p className="text-[0.8125rem] text-slate-500 mt-0.5">Thành viên TeddyPet</p>
                                                <p className="text-[0.8125rem] text-slate-400 truncate mt-0.5">{user?.email}</p>
                                            </div>
                                        </div>
                                    </SectionCard>

                                    {/* personal info */}
                                    <SectionCard title="Thông tin cá nhân">
                                        <div className="space-y-5">
                                            <div className="grid grid-cols-2 md:grid-cols-1 gap-x-10 gap-y-5">
                                                <EditField label="Họ" value={form.lastName} editing={editing}
                                                    onChange={(v) => setForm((p) => ({ ...p, lastName: v }))} />
                                                <EditField label="Tên" value={form.firstName} editing={editing}
                                                    onChange={(v) => setForm((p) => ({ ...p, firstName: v }))} />
                                            </div>
                                            <div className="h-px bg-slate-100" />
                                            <div className="grid grid-cols-2 md:grid-cols-1 gap-x-10 gap-y-5">
                                                <ReadonlyField
                                                    label="Email address"
                                                    value={user?.email || "---"}
                                                    muted
                                                    badge={
                                                        <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                            <ShieldCheck size={11} /> Verified
                                                        </span>
                                                    }
                                                />
                                                <EditField label="Số điện thoại" value={form.phoneNumber} editing={editing}
                                                    onChange={(v) => setForm((p) => ({ ...p, phoneNumber: v }))} />
                                            </div>
                                            <div className="h-px bg-slate-100" />
                                            <div className="grid grid-cols-2 md:grid-cols-1 gap-x-10 gap-y-5">
                                                <EditField label="Ngày sinh" type="date" value={form.dateOfBirth}
                                                    display={!editing ? showDate(form.dateOfBirth) : undefined}
                                                    editing={editing}
                                                    onChange={(v) => setForm((p) => ({ ...p, dateOfBirth: v }))} />
                                                <SelectField label="Giới tính" value={form.gender} editing={editing}
                                                    onChange={(v) => setForm((p) => ({ ...p, gender: v as GenderValue }))} />
                                            </div>
                                            <div className="h-px bg-slate-100" />
                                            <ReadonlyField label="Ngày tham gia" value={showDate(joinedAtRaw)} muted />
                                        </div>
                                    </SectionCard>

                                    {/* security */}
                                    <SectionCard
                                        title="Bảo mật"
                                        action={
                                            <Link
                                                to="/dashboard/change-password"
                                                className="flex items-center gap-1.5 text-[0.8125rem] font-semibold text-client-primary hover:opacity-75 transition-opacity"
                                            >
                                                Thiết lập <ExternalLink size={13} />
                                            </Link>
                                        }
                                    >
                                        <div className="grid grid-cols-2 md:grid-cols-1 gap-x-10 gap-y-4">
                                            <ReadonlyField label="Mật khẩu" value="••••••••" muted />
                                            <ReadonlyField label="Email xác nhận" value={user?.email || "---"} muted />
                                        </div>
                                    </SectionCard>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* footer mini */}
            <div className="max-w-[1280px] w-full mx-auto px-8 flex justify-between items-center text-[0.625rem] font-black text-slate-300 uppercase tracking-widest">
                <p>© 2026 TeddyPet - Chăm sóc bằng cả trái tim</p>
                <div className="flex gap-8">
                    <a href="#" className="hover:text-slate-500 transition-colors">Điều khoản</a>
                    <a href="#" className="hover:text-slate-500 transition-colors">Bảo mật</a>
                    <a href="#" className="hover:text-slate-500 transition-colors">Hotline: 1900 1234</a>
                </div>
            </div>
        </div>
    );
};
