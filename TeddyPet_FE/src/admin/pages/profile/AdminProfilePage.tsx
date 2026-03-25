import React, { useState, useEffect } from "react";
import {
    Avatar,
    Box,
    Button,
    Card,
    Chip,
    Container,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { Edit, Person, Email, Phone, CalendarMonth, Shield, ArrowBack, Visibility, VisibilityOff } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useAuthStore } from "../../../stores/useAuthStore";
import { getMyStaffProfile } from "../../api/staffProfile.api";
import { prefixAdmin } from "../../constants/routes";
import { sendChangePasswordOtp, changePassword } from "../../../api/user.api";
import { logout as logoutApi } from "../../../api/auth.api";

// ----- helpers ----------------------------------------------------------------

const formatDate = (value?: string | null) => {
    if (!value) return "Chưa cập nhật";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const getRoleLabel = (role?: string | null) => {
    if (!role) return { label: "Nhân viên", color: "#0d9488", bg: "rgba(13, 148, 136, 0.1)" };
    const r = role.toUpperCase();
    if (r.includes("SUPER")) return { label: "Super Admin", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" };
    if (r.includes("ADMIN")) return { label: "Quản trị viên", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" };
    return { label: "Nhân viên", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" };
};

const getGenderLabel = (gender?: string | null) => {
    if (!gender) return "Chưa cập nhật";
    if (gender === "MALE") return "Nam";
    if (gender === "FEMALE") return "Nữ";
    return "Khác";
};

// ----- components -------------------------------------------------------------

interface InfoCardRowProps {
    icon: React.ReactNode;
    label: string;
    value?: string | null;
    chip?: React.ReactNode;
}

const InfoCardRow: React.FC<InfoCardRowProps> = ({ icon, label, value, chip }) => (
    <Box
        sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            px: { xs: 2.5, md: 3 },
            py: { xs: 2.1, md: 2.35 },
            borderBottom: "1px solid rgba(148, 163, 184, 0.18)",
            transition: "background 180ms ease, transform 180ms ease",
            "&:last-child": { borderBottom: "none" },
            "&:hover": {
                bgcolor: "rgba(13, 148, 136, 0.04)",
                transform: "translateY(-1px)",
            },
        }}
    >
        <Box
            sx={{
                flexShrink: 0,
                width: { xs: 40, md: 44 },
                height: { xs: 40, md: 44 },
                borderRadius: "12px",
                bgcolor: "rgba(13, 148, 136, 0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0d9488",
                transition: "all 0.2s ease",
                ".MuiBox-root:hover &": {
                    bgcolor: "#0d9488",
                    color: "white",
                    transform: "scale(1.05)",
                }
            }}
        >
            {icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748b", mb: 0.5 }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: value ? "#1e293b" : "#94a3b8", fontStyle: value ? "normal" : "italic", lineHeight: 1.4 }}>
                {value || "Chưa cập nhật"}
            </Typography>
        </Box>
        {chip && <Box sx={{ flexShrink: 0 }}>{chip}</Box>}
    </Box>
);

// ----- main page --------------------------------------------------------------

export const AdminProfilePage: React.FC = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const roleStr =
        typeof user?.role === "string"
            ? user.role
            : Array.isArray(user?.role)
            ? (user?.role as any).join(",")
            : String(user?.role || "");
    const isAdminRole = roleStr.includes("ADMIN");

    const { data: staffRes } = useQuery({
        queryKey: ["my-staff-profile"],
        queryFn: getMyStaffProfile,
        enabled:
            !!user &&
            (typeof user.role === "string"
                ? user.role.includes("ADMIN") || user.role.includes("STAFF")
                : true),
    });
    const staffProfile = staffRes?.data;

    const fullName =
        staffProfile?.fullName ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        "Người dùng";
    const email = staffProfile?.email || user?.email || "—";
    const backupEmail = staffProfile?.backupEmail || (user as any)?.backupEmail || null;
    const phoneNumber = staffProfile?.phoneNumber || user?.phoneNumber || null;
    const avatarSrc =
        staffProfile?.avatarUrl ||
        staffProfile?.altImage ||
        (user as any)?.avatarUrl ||
        undefined;
    const dateOfBirth = staffProfile?.dateOfBirth || (user as any)?.dateOfBirth || null;
    const gender = staffProfile?.gender || (user as any)?.gender || null;
    const address = staffProfile?.address || null;
    const positionName = staffProfile?.positionName || null;
    const employmentType = staffProfile?.employmentType || null;
    const role = user?.role;
    const roleInfo = getRoleLabel(typeof role === "string" ? role : role?.[0]);

    const handleEditProfile = () => {
        navigate(`/${prefixAdmin}/profile/edit`);
    };

    // ── Đổi mật khẩu (OTP) ─────────────────────────────────────────────────
    const [changePwdStep, setChangePwdStep] = useState<0 | 1>(0);
    const [otpCode, setOtpCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [showConfirmPwd, setShowConfirmPwd] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [changingPwd, setChangingPwd] = useState(false);

    useEffect(() => {
        if (cooldown > 0) {
            const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [cooldown]);

    const handleSendOtp = async () => {
        try {
            setSendingOtp(true);
            const res = await sendChangePasswordOtp();
            toast.success(res.message || "Mã OTP đã được gửi đến email của bạn.");
            setCooldown(typeof res.data === "number" ? res.data : 60);
            setChangePwdStep(1);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || "Không thể gửi mã OTP.");
        } finally {
            setSendingOtp(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logoutApi();
        } catch (error) {
            console.error(error);
        } finally {
            logout();
            navigate(`/${prefixAdmin}/auth/login`);
        }
    };

    const handleChangePasswordSubmit = async () => {
        if (otpCode.trim().length < 6) {
            toast.error("Vui lòng nhập đủ 6 chữ số mã OTP.");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp.");
            return;
        }
        try {
            setChangingPwd(true);
            await changePassword({ oldPassword: "", newPassword, otpCode: otpCode.trim() });
            toast.success("Đổi mật khẩu thành công!");
            setChangePwdStep(0);
            setOtpCode("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || "Đổi mật khẩu thất bại.");
        } finally {
            setChangingPwd(false);
        }
    };

    const username = (user as any)?.username ?? staffProfile?.username ?? email ?? "—";

    const initials = fullName
        .split(" ")
        .map((w: string) => w[0])
        .slice(-2)
        .join("")
        .toUpperCase();

    return (
        <Box 
            sx={{ 
                minHeight: "calc(100vh - 64px)", 
                background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
                py: { xs: 4, md: 8 },
                position: "relative",
                overflow: "hidden",
                "&::before": {
                    content: '""',
                    position: "absolute",
                    top: "-10%",
                    right: "-10%",
                    width: "40%",
                    height: "40%",
                    background: "radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)",
                    zIndex: 0,
                },
                "&::after": {
                    content: '""',
                    position: "absolute",
                    bottom: "-10%",
                    left: "-5%",
                    width: "35%",
                    height: "35%",
                    background: "radial-gradient(circle, rgba(244, 63, 94, 0.03) 0%, transparent 70%)",
                    zIndex: 0,
                }
            }}
        >
            <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
                {/* Page title and Header */}
                <Box sx={{ mb: 5, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 3 }}>
                    <Stack direction="row" spacing={2.5} alignItems="center">
                        <IconButton
                            onClick={() => navigate((location.state as { from?: string })?.from ?? `/${prefixAdmin}`)}
                            sx={{
                                bgcolor: "white",
                                width: 48,
                                height: 48,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                                border: "1px solid #E2E8F0",
                                "&:hover": { bgcolor: "#F8FAFC" },
                            }}
                        >
                            <ArrowBack sx={{ fontSize: 20, color: "#0F172A" }} />
                        </IconButton>
                        <Box>
                            <Typography sx={{ fontSize: "2.25rem", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
                                Hồ sơ cá nhân
                            </Typography>
                            <Typography sx={{ fontSize: "1rem", color: "#64748b", mt: 1, fontWeight: 500 }}>
                                Quản lý thông tin cá nhân và thiết lập tài khoản của bạn
                            </Typography>
                        </Box>
                    </Stack>
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "400px 1fr" }, gap: 4, alignItems: "start" }}>
                    {/* ── LEFT COLUMN ──────────────────────────────────────── */}
                    <Stack spacing={4}>
                        {/* Identity card */}
                        <Card
                            elevation={0}
                            sx={{
                                border: "1px solid rgba(255, 255, 255, 0.8)",
                                borderRadius: "32px",
                                overflow: "hidden",
                                boxShadow: "0 20px 40px -12px rgba(0,0,0,0.1)",
                                background: "rgba(255, 255, 255, 0.8)",
                                backdropFilter: "blur(20px)",
                            }}
                        >
                            <Box
                                sx={{
                                    height: 120,
                                    background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
                                    position: "relative",
                                }}
                            />

                            <Box sx={{ px: 4, pt: 0, pb: 4, textAlign: "center", position: "relative" }}>
                                <Box sx={{ display: "inline-block", position: "relative", mt: "-60px" }}>
                                    <Avatar
                                        src={avatarSrc}
                                        sx={{
                                            width: 120,
                                            height: 120,
                                            fontSize: "2.5rem",
                                            fontWeight: 900,
                                            border: "6px solid white",
                                            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                                            background: "linear-gradient(135deg, #0d9488, #475569)",
                                        }}
                                    >
                                        {initials}
                                    </Avatar>
                                    <Box 
                                        sx={{ 
                                            position: "absolute", 
                                            bottom: 12, 
                                            right: 4, 
                                            width: 22, 
                                            height: 22, 
                                            bgcolor: "#22c55e", 
                                            borderRadius: "50%", 
                                            border: "3px solid white",
                                        }} 
                                    />
                                </Box>

                                <Typography sx={{ mt: 2, fontSize: "1.5rem", fontWeight: 800, color: "#1e293b", letterSpacing: "-0.02em" }}>
                                    {fullName}
                                </Typography>
                                <Typography sx={{ fontSize: "0.875rem", color: "#64748b", mt: 0.5, fontWeight: 500 }}>
                                    {email}
                                </Typography>

                                <Stack direction="row" useFlexGap spacing={1} flexWrap="wrap" justifyContent="center" sx={{ mt: 3 }}>
                                    <Chip
                                        label={roleInfo.label}
                                        size="small"
                                        sx={{
                                            bgcolor: roleInfo.bg,
                                            color: roleInfo.color,
                                            fontWeight: 700,
                                            fontSize: "10px",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                        }}
                                    />
                                    {positionName && (
                                        <Chip
                                            label={positionName}
                                            size="small"
                                            sx={{
                                                bgcolor: "rgba(13, 148, 136, 0.08)",
                                                color: "#0d9488",
                                                fontWeight: 700,
                                                fontSize: "10px",
                                                textTransform: "uppercase",
                                            }}
                                        />
                                    )}
                                    {employmentType && (
                                        <Chip
                                            label={employmentType === "FULL_TIME" ? "Toàn thời gian" : "Bán thời gian"}
                                            size="small"
                                            sx={{
                                                bgcolor: "rgba(100, 116, 139, 0.08)",
                                                color: "#64748b",
                                                fontWeight: 700,
                                                fontSize: "10px",
                                                textTransform: "uppercase",
                                            }}
                                        />
                                    )}
                                </Stack>

                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={handleEditProfile}
                                    startIcon={<Edit />}
                                    sx={{
                                        mt: 3,
                                        bgcolor: "#0f172a",
                                        borderRadius: "14px",
                                        textTransform: "none",
                                        fontWeight: 700,
                                        py: 1.5,
                                        boxShadow: "0 8px 20px rgba(15,23,42,0.15)",
                                        "&:hover": { bgcolor: "#334155", transform: "translateY(-1px)" },
                                        transition: "all 0.2s",
                                    }}
                                >
                                    Chỉnh sửa hồ sơ
                                </Button>
                            </Box>
                        </Card>

                        {/* Account Management Card */}
                        <Card
                            elevation={0}
                            sx={{
                                border: "1px solid rgba(255, 255, 255, 0.8)",
                                borderRadius: "32px",
                                overflow: "hidden",
                                boxShadow: "0 10px 30px -5px rgba(0,0,0,0.05)",
                                background: "rgba(255, 255, 255, 0.8)",
                                backdropFilter: "blur(20px)",
                            }}
                        >
                            <Box sx={{ px: 4, py: 3, borderBottom: "1px solid rgba(241, 245, 249, 1)", bgcolor: "rgba(248, 250, 252, 0.5)", display: "flex", alignItems: "center", gap: 1.5 }}>
                                <Box sx={{ width: 8, height: 24, bgcolor: "#0d9488", borderRadius: "4px" }} />
                                <Typography sx={{ fontSize: "11px", fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                    Quản lý tài khoản
                                </Typography>
                            </Box>
                            <Box sx={{ p: 4 }}>
                                <InfoCardRow
                                    icon={<Person sx={{ fontSize: 20 }} />}
                                    label="Tên đăng nhập"
                                    value={username}
                                />
                                <Box sx={{ mt: 3 }}>
                                    <Typography sx={{ fontSize: "10px", fontWeight: 800, color: "#64748b", mb: 1.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        Đổi mật khẩu
                                    </Typography>
                                    <Typography sx={{ fontSize: "0.8rem", color: "#64748b", mb: 2.5, lineHeight: 1.5 }}>
                                        Gửi mã OTP đến email, sau đó nhập mã và mật khẩu mới để thay đổi.
                                    </Typography>
                                    
                                    {changePwdStep === 0 ? (
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            onClick={handleSendOtp}
                                            disabled={sendingOtp}
                                            sx={{
                                                borderRadius: "12px",
                                                textTransform: "none",
                                                fontWeight: 700,
                                                bgcolor: "rgba(13, 148, 136, 0.05)",
                                                color: "#0d9488",
                                                borderColor: "rgba(13, 148, 136, 0.3)",
                                                py: 1.25,
                                                "&:hover": { 
                                                    bgcolor: "rgba(13, 148, 136, 0.1)",
                                                    borderColor: "#0d9488",
                                                },
                                            }}
                                        >
                                            {sendingOtp ? "Đang gửi..." : "Gửi mã OTP qua email"}
                                        </Button>
                                    ) : (
                                        <Stack spacing={2}>
                                            <TextField
                                                size="small"
                                                fullWidth
                                                label="Mã OTP"
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                sx={{ "& .MuiInputBase-root": { borderRadius: "12px" } }}
                                            />
                                            <TextField
                                                size="small"
                                                fullWidth
                                                type={showNewPwd ? "text" : "password"}
                                                label="Mật khẩu mới"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton size="small" onClick={() => setShowNewPwd((p) => !p)} edge="end">
                                                                {showNewPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    ),
                                                }}
                                                sx={{ "& .MuiInputBase-root": { borderRadius: "12px" } }}
                                            />
                                            <TextField
                                                size="small"
                                                fullWidth
                                                type={showConfirmPwd ? "text" : "password"}
                                                label="Xác nhận mật khẩu"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton size="small" onClick={() => setShowConfirmPwd((p) => !p)} edge="end">
                                                                {showConfirmPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    ),
                                                }}
                                                sx={{ "& .MuiInputBase-root": { borderRadius: "12px" } }}
                                            />
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Button
                                                    size="small"
                                                    onClick={handleSendOtp}
                                                    disabled={cooldown > 0 || sendingOtp}
                                                    sx={{ textTransform: "none", fontWeight: 600, color: "#0d9488" }}
                                                >
                                                    {cooldown > 0 ? `Gửi lại (${cooldown}s)` : "Gửi lại mã"}
                                                </Button>
                                                <Box sx={{ flex: 1 }} />
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    onClick={handleChangePasswordSubmit}
                                                    disabled={changingPwd}
                                                    sx={{ borderRadius: "10px", textTransform: "none", bgcolor: "#0f172a" }}
                                                >
                                                    Đổi mật khẩu
                                                </Button>
                                            </Stack>
                                        </Stack>
                                    )}
                                </Box>

                                <Box sx={{ mt: 4, pt: 3, borderTop: "1px dashed #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <Box>
                                        <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>Đăng xuất</Typography>
                                        <Typography sx={{ fontSize: "11px", color: "#64748b" }}>Kết thúc phiên làm việc</Typography>
                                    </Box>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={handleLogout}
                                        sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, px: 2 }}
                                    >
                                        Đăng xuất
                                    </Button>
                                </Box>
                            </Box>
                        </Card>
                    </Stack>

                    {/* ── RIGHT COLUMN ─────────────────────────────────────── */}
                    <Stack spacing={4}>
                        {/* Contact info card */}
                        <Card
                            elevation={0}
                            sx={{
                                border: "1px solid rgba(255, 255, 255, 0.8)",
                                borderRadius: "32px",
                                overflow: "hidden",
                                boxShadow: "0 10px 30px -5px rgba(0,0,0,0.05)",
                                background: "rgba(255, 255, 255, 0.8)",
                                backdropFilter: "blur(20px)",
                            }}
                        >
                            <Box sx={{ px: 4, py: 3, borderBottom: "1px solid rgba(241, 245, 249, 1)", bgcolor: "rgba(248, 250, 252, 0.5)", display: "flex", alignItems: "center", gap: 1.5 }}>
                                <Box sx={{ width: 8, height: 24, bgcolor: "#0d9488", borderRadius: "4px" }} />
                                <Typography sx={{ fontSize: "11px", fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                    Thông tin cá nhân & Liên hệ
                                </Typography>
                            </Box>

                            <Box sx={{ py: 1 }}>
                                <InfoCardRow icon={<Person sx={{ fontSize: 20 }} />} label="Họ và tên" value={fullName} />
                                <InfoCardRow icon={<Email sx={{ fontSize: 20 }} />} label="Địa chỉ Email" value={email} />
                                {!isAdminRole && <InfoCardRow icon={<Email sx={{ fontSize: 20 }} />} label="Email dự phòng" value={backupEmail} />}
                                <InfoCardRow icon={<Phone sx={{ fontSize: 20 }} />} label="Số điện thoại" value={phoneNumber} />
                                <InfoCardRow icon={<CalendarMonth sx={{ fontSize: 20 }} />} label="Ngày sinh" value={formatDate(dateOfBirth)} />
                                <InfoCardRow
                                    icon={
                                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    }
                                    label="Giới tính"
                                    value={getGenderLabel(gender)}
                                />
                                {address && (
                                    <InfoCardRow
                                        icon={
                                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        }
                                        label="Địa chỉ cư trú"
                                        value={address}
                                    />
                                )}
                            </Box>
                        </Card>

                        {/* Job Info Card */}
                        {staffProfile && (
                            <Card
                                elevation={0}
                                sx={{
                                    border: "1px solid rgba(255, 255, 255, 0.8)",
                                    borderRadius: "32px",
                                    overflow: "hidden",
                                    boxShadow: "0 10px 30px -5px rgba(0,0,0,0.05)",
                                    background: "rgba(255, 255, 255, 0.8)",
                                    backdropFilter: "blur(20px)",
                                }}
                            >
                                <Box sx={{ px: 4, py: 3, borderBottom: "1px solid rgba(241, 245, 249, 1)", bgcolor: "rgba(248, 250, 252, 0.5)", display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <Box sx={{ width: 8, height: 24, bgcolor: "#0d9488", borderRadius: "4px" }} />
                                    <Typography sx={{ fontSize: "11px", fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                        Thông tin công việc
                                    </Typography>
                                </Box>
                                <Box sx={{ py: 1 }}>
                                    <InfoCardRow
                                        icon={
                                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        }
                                        label="Chức vụ"
                                        value={staffProfile.secondaryPositionName ? `${staffProfile.positionName} & ${staffProfile.secondaryPositionName}` : staffProfile.positionName}
                                    />
                                    <InfoCardRow
                                        icon={
                                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        }
                                        label="Hình thức làm việc"
                                        value={staffProfile.employmentType === "FULL_TIME" ? "Toàn thời gian" : "Bán thời gian"}
                                    />
                                    <InfoCardRow
                                        icon={<Shield sx={{ fontSize: 20 }} />}
                                        label="Mã số nhân viên / CCCD"
                                        value={`${staffProfile.staffId} ${staffProfile.citizenId ? `| ${staffProfile.citizenId}` : ""}`}
                                    />
                                </Box>
                            </Card>
                        )}

                        {/* Financial Info Card */}
                        {staffProfile && (staffProfile.bankName || staffProfile.bankAccountNo) && (
                            <Card
                                elevation={0}
                                sx={{
                                    border: "1px solid rgba(255, 255, 255, 0.8)",
                                    borderRadius: "32px",
                                    overflow: "hidden",
                                    boxShadow: "0 10px 30px -5px rgba(0,0,0,0.05)",
                                    background: "rgba(255, 255, 255, 0.8)",
                                    backdropFilter: "blur(20px)",
                                }}
                            >
                                <Box sx={{ px: 4, py: 3, borderBottom: "1px solid rgba(241, 245, 249, 1)", bgcolor: "rgba(248, 250, 252, 0.5)", display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <Box sx={{ width: 8, height: 24, bgcolor: "#0d9488", borderRadius: "4px" }} />
                                    <Typography sx={{ fontSize: "11px", fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                        Thông tin tài chính
                                    </Typography>
                                </Box>
                                <Box sx={{ py: 1 }}>
                                    <InfoCardRow
                                        icon={
                                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                        }
                                        label="Tài khoản nhận lương"
                                        value={staffProfile.bankName && staffProfile.bankAccountNo ? `${staffProfile.bankName} - ${staffProfile.bankAccountNo}` : (staffProfile.bankName || staffProfile.bankAccountNo)}
                                    />
                                </Box>
                            </Card>
                        )}
                    </Stack>
                </Box>
            </Container>
        </Box>
    );
};

export default AdminProfilePage;
