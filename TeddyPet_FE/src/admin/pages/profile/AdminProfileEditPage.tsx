import React, { useEffect } from "react";
import {
    Autocomplete,
    Avatar,
    Box,
    Button,
    Card,
    CardHeader,
    Container,
    Divider,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    ThemeProvider,
    Typography,
    useTheme,
} from "@mui/material";
import { ArrowBack, Save, LockOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useAuthStore } from "../../../stores/useAuthStore";
import {
    getMyStaffProfile,
    updateStaffProfile,
    type IStaffProfileUpdateRequest,
} from "../../api/staffProfile.api";
import { prefixAdmin } from "../../constants/routes";
import { getProductCategoryTheme } from "../product-category/configs/theme";
import { FormUploadSingleFile } from "../../components/upload/FormUploadSingleFile";
import type { GenderEnum } from "../../api/staffProfile.api";
import { updateProfile } from "../../../api/user.api";

// ---------------------------------------------------------------------------

const GENDER_OPTIONS: { value: GenderEnum; label: string }[] = [
    { value: "MALE", label: "Nam" },
    { value: "FEMALE", label: "Nữ" },
    { value: "OTHER", label: "Khác" },
];

// ---------------------------------------------------------------------------

/** Card section with header */
const SectionCard = ({
    title,
    subheader,
    children,
}: {
    title: string;
    subheader?: string;
    children: React.ReactNode;
}) => (
    <Card
        sx={{
            backgroundImage: "none !important",
            backgroundColor: "#fff !important",
            boxShadow: "0 0 2px 0 #919eab33, 0 12px 24px -4px #919eab1f",
            borderRadius: "20px",
            overflow: "hidden",
        }}
    >
        <CardHeader
            title={title}
            subheader={subheader}
            slotProps={{
                title: { sx: { fontWeight: 700, fontSize: "1rem", color: "#1C252E" } },
                subheader: { sx: { color: "#637381", fontSize: "0.8125rem", mt: 0.5 } },
            }}
            sx={{ px: 3, pt: 3, pb: 0, mb: 2.5 }}
        />
        <Divider sx={{ borderColor: "#f1f5f9", mb: 0 }} />
        {children}
    </Card>
);

/** Read-only row with lock indicator (used for STAFF self-edit) */
const ReadonlyRow = ({ label, value }: { label: string; value?: string | null }) => (
    <Box
        sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            px: 3,
            py: 2.5,
            bgcolor: "#f8fafc",
            borderBottom: "1px solid #f1f5f9",
            "&:last-child": { borderBottom: "none" },
        }}
    >
        <LockOutlined sx={{ fontSize: 16, color: "#cbd5e1", flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
                sx={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "#94a3b8",
                    mb: 0.3,
                }}
            >
                {label}
            </Typography>
            <Typography
                sx={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: value ? "#475569" : "#cbd5e1",
                    fontStyle: value ? "normal" : "italic",
                }}
            >
                {value || "Chưa cập nhật"}
            </Typography>
        </Box>
    </Box>
);

// ---------------------------------------------------------------------------

type FormValues = {
    fullName: string;
    phoneNumber: string;
    gender?: GenderEnum;
    dateOfBirth?: string;
    avatarUrl?: string;
    altImage?: string;
    // Staff-only editable fields (when role = STAFF)
    address?: string;
    bankName?: string;
    bankAccountNo?: string;
    backupEmail?: string;
};

// ---------------------------------------------------------------------------

export const AdminProfileEditPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const outerTheme = useTheme();
    const localTheme = getProductCategoryTheme(outerTheme);

    const queryClient = useQueryClient();

    const { data: staffRes, isLoading } = useQuery({
        queryKey: ["my-staff-profile"],
        queryFn: getMyStaffProfile,
        enabled:
            !!user &&
            (typeof user.role === "string"
                ? user.role.includes("ADMIN") || user.role.includes("STAFF")
                : true),
    });
    const profile = staffRes?.data;

    const { control, handleSubmit, reset } = useForm<FormValues>({
        defaultValues: {
            fullName: "",
            phoneNumber: "",
            gender: undefined,
            dateOfBirth: "",
            avatarUrl: "",
            altImage: "",
            address: "",
            bankName: "",
            bankAccountNo: "",
            backupEmail: "",
        },
    });

    // Pre-populate form with existing data:
    // - Ưu tiên staff profile (nếu đã có)
    // - Nếu chưa có profile, fallback từ thông tin trong auth user
    useEffect(() => {
        if (profile) {
            reset({
                fullName: profile.fullName ?? "",
                phoneNumber: profile.phoneNumber ?? "",
                gender: (profile.gender as GenderEnum) ?? undefined,
                dateOfBirth: profile.dateOfBirth ?? "",
                avatarUrl: profile.avatarUrl ?? "",
                altImage: profile.altImage ?? "",
                address: profile.address ?? "",
                bankName: profile.bankName ?? "",
                bankAccountNo: profile.bankAccountNo ?? "",
                backupEmail: profile.backupEmail ?? "",
            });
            return;
        }

        // Fallback: map từ thông tin user đang đăng nhập (admin) nếu chưa có staff profile
        if (user) {
            const fallbackFullName =
                [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                (user as any).fullName ||
                "";
            reset({
                fullName: fallbackFullName,
                phoneNumber: (user as any).phoneNumber ?? "",
                gender: ((user as any).gender as GenderEnum) ?? undefined,
                dateOfBirth: (user as any).dateOfBirth ?? "",
                avatarUrl: (user as any).avatarUrl ?? "",
                altImage: "",
                address: "",
                bankName: "",
                bankAccountNo: "",
                backupEmail: "",
            });
        }
    }, [profile, user, reset]);

    const [isPending, setIsPending] = React.useState(false);

    const roleStr =
        typeof user?.role === "string"
            ? user.role
            : Array.isArray(user?.role)
            ? user?.role.join(",")
            : String(user?.role || "");
    const isStaffOnly = roleStr.includes("STAFF") && !roleStr.includes("ADMIN");

    const onSubmit = async (formData: FormValues) => {
        setIsPending(true);
        try {
            if (!user) {
                toast.error("Không tìm thấy thông tin đăng nhập.");
                return;
            }

            if (isStaffOnly && profile?.staffId) {
                // CASE 1: Nhân sự (role STAFF) đang ở trang admin => chỉnh hồ sơ nhân viên
                const payload: IStaffProfileUpdateRequest = {
                    fullName: formData.fullName?.trim() || profile.fullName,
                    phoneNumber: formData.phoneNumber?.trim() || profile.phoneNumber || undefined,
                    gender:
                        formData.gender && (formData.gender as string) !== ""
                            ? formData.gender
                            : profile.gender ?? undefined,
                    dateOfBirth: formData.dateOfBirth || profile.dateOfBirth || undefined,
                    avatarUrl: formData.avatarUrl?.trim() || profile.avatarUrl || undefined,
                    altImage: formData.altImage?.trim() || profile.altImage || undefined,
                    // read-only (staff self-edit): keep as-is
                    email: profile.email || undefined,
                    citizenId: profile.citizenId || undefined,
                    positionId: profile.positionId ?? undefined,
                    secondaryPositionId: profile.secondaryPositionId ?? undefined,
                    employmentType: profile.employmentType ?? undefined,
                    // editable for staff self-edit
                    address: formData.address?.trim() || undefined,
                    bankAccountNo: formData.bankAccountNo?.trim() || undefined,
                    bankName: formData.bankName?.trim() || undefined,
                    backupEmail: formData.backupEmail?.trim() || undefined,
                };

                const res = await updateStaffProfile(profile.staffId, payload);

                if ((res as any)?.success !== false) {
                    toast.success("Cập nhật hồ sơ nhân viên thành công!");
                    await queryClient.invalidateQueries({ queryKey: ["my-staff-profile"] });
                    navigate(`/${prefixAdmin}/profile`);
                } else {
                    toast.error((res as any)?.message ?? "Có lỗi xảy ra khi cập nhật hồ sơ nhân viên.");
                }
            } else {
                // CASE 2: Admin (hoặc ADMIN + STAFF) => chỉ chỉnh bảng users
                const nameParts = (formData.fullName || "").trim().split(" ").filter(Boolean);
                const firstName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : user.firstName || "";
                const lastName =
                    nameParts.length > 1 ? nameParts.slice(0, nameParts.length - 1).join(" ") : user.lastName || "";

                const res = await updateProfile({
                    firstName: firstName,
                    lastName: lastName,
                    phoneNumber: formData.phoneNumber?.trim() || undefined,
                    dateOfBirth: formData.dateOfBirth || undefined,
                    gender: formData.gender,
                    avatarUrl: formData.avatarUrl?.trim() || undefined,
                    altImage: formData.altImage?.trim() || undefined,
                });

                if (res.success && res.data) {
                    useAuthStore.getState().set({ user: res.data });
                    toast.success("Cập nhật hồ sơ thành công!");
                    await queryClient.invalidateQueries({ queryKey: ["my-staff-profile"] });
                    navigate(`/${prefixAdmin}/profile`);
                } else {
                    toast.error(res.message || "Có lỗi xảy ra khi cập nhật.");
                }
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? err?.message ?? "Cập nhật thất bại.";
            toast.error(msg);
        } finally {
            setIsPending(false);
        }
    };

    const fullName =
        profile?.fullName ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        "Người dùng";
    const avatarSrc = profile?.avatarUrl || profile?.altImage || undefined;
    const initials = fullName
        .split(" ")
        .map((w: string) => w[0])
        .slice(-2)
        .join("")
        .toUpperCase();

    if (isLoading) {
        return (
            <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary">Đang tải dữ liệu...</Typography>
            </Box>
        );
    }

    return (
        <ThemeProvider theme={localTheme}>
            <Box sx={{ minHeight: "calc(100vh - 64px)", bgcolor: "#f8fafc", pb: "100px" }}>
                <Container maxWidth="lg" sx={{ pt: 4 }}>
                    {/* ── Header ── */}
                    <Stack direction="row" alignItems="center" spacing={2.5} sx={{ mb: 4 }}>
                        <IconButton
                            onClick={() => navigate(`/${prefixAdmin}/profile`)}
                            sx={{
                                bgcolor: "white",
                                width: 44,
                                height: 44,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                                border: "1px solid #E2E8F0",
                                "&:hover": { bgcolor: "#F8FAFC" },
                            }}
                        >
                            <ArrowBack sx={{ fontSize: 20, color: "#0F172A" }} />
                        </IconButton>
                        <Box>
                            <Typography sx={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>
                                Chỉnh sửa hồ sơ
                            </Typography>
                            <Typography sx={{ fontSize: "0.875rem", color: "#64748b", mt: 0.4 }}>
                                Cập nhật thông tin cá nhân của bạn
                            </Typography>
                        </Box>
                    </Stack>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", lg: "300px 1fr" },
                                gap: 3,
                                alignItems: "start",
                            }}
                        >
                            {/* ── LEFT COLUMN (avatar) ── */}
                            <Stack spacing={3}>
                                <SectionCard title="Ảnh đại diện" subheader="Đề xuất 512×512 px">
                                    <Box sx={{ p: 3 }}>
                                        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                                            <Avatar
                                                src={avatarSrc}
                                                sx={{
                                                    width: 96,
                                                    height: 96,
                                                    fontSize: "1.75rem",
                                                    fontWeight: 800,
                                                    border: "4px solid white",
                                                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                                    background: "linear-gradient(135deg, #f43f5e, #f97316)",
                                                    color: "white",
                                                }}
                                            >
                                                {initials}
                                            </Avatar>
                                        </Box>
                                        <FormUploadSingleFile
                                            name="avatarUrl"
                                            control={control}
                                            title=""
                                            compact
                                            folder="staffs"
                                        />
                                    </Box>
                                </SectionCard>

                                {/* STAFF self-edit: show fixed info as read-only like staff profile UI */}
                                {isStaffOnly && (
                                    <SectionCard title="Thông tin cố định" subheader="Chỉ quản trị viên mới có thể thay đổi">
                                        <Box>
                                            <ReadonlyRow label="Email" value={profile?.email} />
                                            <ReadonlyRow label="Số CCCD/CMND" value={profile?.citizenId} />
                                            <ReadonlyRow label="Chức vụ chính" value={profile?.positionName} />
                                            {profile?.secondaryPositionName && (
                                                <ReadonlyRow label="Chức vụ phụ" value={profile.secondaryPositionName} />
                                            )}
                                            <ReadonlyRow
                                                label="Loại hình lao động"
                                                value={
                                                    profile?.employmentType === "FULL_TIME"
                                                        ? "Toàn thời gian"
                                                        : profile?.employmentType === "PART_TIME"
                                                        ? "Bán thời gian"
                                                        : undefined
                                                }
                                            />
                                        </Box>
                                    </SectionCard>
                                )}
                            </Stack>

                            {/* ── RIGHT COLUMN (form fields) ── */}
                            <Stack spacing={3}>
                                {/* Personal info */}
                                <SectionCard title="Thông tin cá nhân" subheader="Họ tên, ngày sinh, giới tính">
                                    <Box sx={{ p: 3, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
                                        <Controller
                                            name="fullName"
                                            control={control}
                                            rules={{ required: "Vui lòng nhập họ tên" }}
                                            render={({ field, fieldState }) => (
                                                <TextField
                                                    {...field}
                                                    label="Họ và tên *"
                                                    fullWidth
                                                    error={!!fieldState.error}
                                                    helperText={fieldState.error?.message}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="gender"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    select
                                                    label="Giới tính"
                                                    fullWidth
                                                    value={field.value ?? ""}
                                                    onChange={(e) => field.onChange(e.target.value || undefined)}
                                                >
                                                    <MenuItem value="">
                                                        <em>— Chọn giới tính —</em>
                                                    </MenuItem>
                                                    {GENDER_OPTIONS.map((o) => (
                                                        <MenuItem key={o.value} value={o.value}>
                                                            {o.label}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            )}
                                        />
                                        <Controller
                                            name="dateOfBirth"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="Ngày sinh"
                                                    type="date"
                                                    fullWidth
                                                    slotProps={{ inputLabel: { shrink: true } }}
                                                />
                                            )}
                                        />
                                    </Box>
                                </SectionCard>

                                {/* Contact info */}
                                <SectionCard title="Thông tin liên hệ" subheader={isStaffOnly ? "Số điện thoại, địa chỉ, email dự phòng" : "Số điện thoại"}>
                                    <Stack sx={{ p: 3 }} spacing={3}>
                                        <Controller
                                            name="phoneNumber"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} label="Số điện thoại" fullWidth />
                                            )}
                                        />
                                        {isStaffOnly && (
                                            <>
                                                <Controller
                                                    name="address"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <TextField
                                                            {...field}
                                                            label="Địa chỉ"
                                                            fullWidth
                                                            multiline
                                                            minRows={2}
                                                        />
                                                    )}
                                                />
                                                <Controller
                                                    name="backupEmail"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <TextField
                                                            {...field}
                                                            label="Email dự phòng"
                                                            type="email"
                                                            fullWidth
                                                            placeholder="Dùng để khôi phục tài khoản nếu email chính gặp sự cố"
                                                            helperText="Tùy chọn. Khuyến khích sử dụng email cá nhân khác."
                                                        />
                                                    )}
                                                />
                                            </>
                                        )}
                                    </Stack>
                                </SectionCard>

                                {/* STAFF self-edit: bank info matches staff profile UI */}
                                {isStaffOnly && (
                                    <SectionCard
                                        title="Thông tin ngân hàng"
                                        subheader="Tài khoản để nhận lương. Vui lòng kiểm tra kỹ trước khi lưu."
                                    >
                                        <Stack sx={{ p: 3 }} spacing={3}>
                                            <Controller
                                                name="bankName"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField {...field} label="Ngân hàng" fullWidth placeholder="VD: VCB, TCB, MB..." />
                                                )}
                                            />
                                            <Controller
                                                name="bankAccountNo"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField {...field} label="Số tài khoản ngân hàng" fullWidth />
                                                )}
                                            />
                                        </Stack>
                                    </SectionCard>
                                )}
                            </Stack>
                        </Box>

                        {/* ── Sticky footer ── */}
                        <Box
                            sx={{
                                position: "fixed",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                zIndex: 50,
                                backdropFilter: "blur(10px)",
                                background: "rgba(255,255,255,0.88)",
                                borderTop: "1px solid #e2e8f0",
                                py: 2,
                                px: { xs: 3, md: 8 },
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 1.5,
                            }}
                        >
                            <Button
                                type="button"
                                variant="outlined"
                                onClick={() => navigate(`/${prefixAdmin}/profile`)}
                                sx={{
                                    minH: "44px",
                                    height: 44,
                                    px: 4,
                                    borderRadius: "12px",
                                    textTransform: "none",
                                    fontWeight: 700,
                                    fontSize: "0.875rem",
                                    borderColor: "#e2e8f0",
                                    color: "#475569",
                                    "&:hover": { borderColor: "#94a3b8", bgcolor: "#f1f5f9" },
                                }}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={isPending}
                                startIcon={<Save />}
                                sx={{
                                    height: 44,
                                    px: 5,
                                    borderRadius: "12px",
                                    textTransform: "none",
                                    fontWeight: 700,
                                    fontSize: "0.875rem",
                                    bgcolor: "#0f172a",
                                    boxShadow: "0 4px 12px rgba(15,23,42,0.2)",
                                    "&:hover": { bgcolor: "#1e293b", boxShadow: "0 6px 18px rgba(15,23,42,0.28)" },
                                    "&.Mui-disabled": { bgcolor: "#e2e8f0", color: "#94a3b8" },
                                }}
                            >
                                {isPending ? "Đang lưu..." : "Lưu thay đổi"}
                            </Button>
                        </Box>
                    </form>
                </Container>
            </Box>
        </ThemeProvider>
    );
};

export default AdminProfileEditPage;
