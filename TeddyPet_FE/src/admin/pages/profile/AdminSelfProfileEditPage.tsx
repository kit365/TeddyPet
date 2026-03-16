import { useState, useEffect } from "react";
import {
    Avatar,
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Card,
    Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyStaffProfile, updateStaffProfile } from "../../api/staffProfile.api";
import { uploadImage } from "../../../api/upload.api";
import { toast } from "react-toastify";

export const AdminSelfProfileEditPage = () => {
    const navigate = useNavigate();
    const { data: myProfileRes } = useQuery({
        queryKey: ["my-staff-profile"],
        queryFn: getMyStaffProfile,
    });
    const myProfile = myProfileRes?.data;
    const queryClient = useQueryClient();

    const [avatarUrl, setAvatarUrl] = useState("");
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [address, setAddress] = useState("");
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (myProfile) {
            setAvatarUrl(myProfile.avatarUrl ?? "");
            setAvatarPreview(null);
            setEmail(myProfile.email ?? "");
            setPhoneNumber(myProfile.phoneNumber ?? "");
            setAddress(myProfile.address ?? "");
        }
    }, [myProfile]);

    const { mutate: doUpdate, isPending } = useMutation({
        mutationFn: async () => {
            if (!myProfile) return;
            // Gửi lại đầy đủ thông tin hiện có để backend không xóa các field khác (chức vụ, ngày sinh, ...)
            return updateStaffProfile(myProfile.staffId, {
                fullName: myProfile.fullName,
                email: email || myProfile.email || null,
                phoneNumber: phoneNumber || myProfile.phoneNumber || null,
                citizenId: myProfile.citizenId ?? null,
                dateOfBirth: myProfile.dateOfBirth ?? null,
                gender: myProfile.gender ?? null,
                avatarUrl: avatarUrl || myProfile.avatarUrl || null,
                altImage: myProfile.altImage ?? null,
                address: address || myProfile.address || null,
                bankAccountNo: myProfile.bankAccountNo ?? null,
                bankName: myProfile.bankName ?? null,
                positionId: myProfile.positionId ?? null,
                secondaryPositionId: myProfile.secondaryPositionId ?? null,
                employmentType: myProfile.employmentType ?? null,
                backupEmail: myProfile.backupEmail ?? null,
            });
        },
        onSuccess: (res: any) => {
            if (!res?.success) {
                toast.error(res?.message ?? "Cập nhật hồ sơ thất bại.");
                return;
            }
            queryClient.invalidateQueries({ queryKey: ["my-staff-profile"] });
            toast.success(res.message ?? "Cập nhật hồ sơ thành công.");
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message ?? err?.message ?? "Cập nhật hồ sơ thất bại.";
            toast.error(msg);
        },
    });

    const handleUploadAvatar = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Vui lòng chọn file ảnh (JPG, PNG, ...).");
            return;
        }
        const maxSizeMB = 10;
        if (file.size > maxSizeMB * 1024 * 1024) {
            toast.error(`Ảnh không được quá ${maxSizeMB}MB.`);
            return;
        }
        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
        }
        setAvatarPreview(URL.createObjectURL(file));
        setUploading(true);
        try {
            const url = await uploadImage(file, "staff-avatars");
            setAvatarUrl(url);
            toast.success("Tải ảnh lên thành công");
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || "Tải ảnh lên thất bại.";
            toast.error(msg);
        } finally {
            setUploading(false);
        }
    };

    if (!myProfile) {
        return (
            <Container maxWidth="md" sx={{ py: 6 }}>
                <Typography>Không tải được thông tin nhân viên.</Typography>
            </Container>
        );
    }

    const initials = myProfile.fullName
        .split(" ")
        .map((w: string) => w[0])
        .slice(-2)
        .join("")
        .toUpperCase();

    return (
        <Box sx={{ minHeight: "calc(100vh - 64px)", bgcolor: "#f8fafc", py: { xs: 3, md: 5 } }}>
            <Container maxWidth="md">
                <Box sx={{ mb: 4 }}>
                    <Typography sx={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>
                        Chỉnh sửa hồ sơ của bạn
                    </Typography>
                    <Typography sx={{ fontSize: "0.875rem", color: "#64748b", mt: 0.5 }}>
                        Cập nhật ảnh đại diện, email, số điện thoại và địa chỉ cá nhân.
                    </Typography>
                </Box>

                <Stack spacing={3}>
                    <Card
                        sx={{
                            borderRadius: "20px",
                            p: 3,
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            gap: 3,
                            alignItems: { xs: "flex-start", sm: "center" },
                        }}
                        elevation={0}
                    >
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                            <Avatar
                                src={avatarPreview || avatarUrl || myProfile.avatarUrl || undefined}
                                sx={{
                                    width: 96,
                                    height: 96,
                                    fontSize: "2rem",
                                    fontWeight: 800,
                                    bgcolor: "#0f172a",
                                    color: "white",
                                }}
                            >
                                {initials}
                            </Avatar>
                            <Button
                                variant="outlined"
                                size="small"
                                component="label"
                                sx={{ textTransform: "none", borderRadius: "999px", fontWeight: 600, fontSize: "0.8rem" }}
                            >
                                Đổi ảnh đại diện
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleUploadAvatar(file);
                                    }}
                                />
                            </Button>
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack spacing={2}>
                                <TextField
                                    label="Họ và tên"
                                    value={myProfile.fullName}
                                    size="small"
                                    disabled
                                    helperText="Nếu cần đổi tên, vui lòng liên hệ quản lý."
                                />
                                <TextField
                                    label="Email"
                                    value={email}
                                    size="small"
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <TextField
                                    label="Số điện thoại"
                                    value={phoneNumber}
                                    size="small"
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                />
                                <TextField
                                    label="Địa chỉ"
                                    value={address}
                                    size="small"
                                    multiline
                                    minRows={2}
                                    onChange={(e) => setAddress(e.target.value)}
                                />
                            </Stack>
                        </Box>
                    </Card>

                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
                        <Button
                        variant="outlined"
                        sx={{ textTransform: "none", borderRadius: "10px", px: 3, fontWeight: 600 }}
                        onClick={() => {
                            navigate("/admin/profile");
                        }}
                        >
                            Hủy thay đổi
                        </Button>
                        <Button
                            variant="contained"
                            sx={{
                                textTransform: "none",
                                borderRadius: "10px",
                                px: 3,
                                fontWeight: 700,
                                bgcolor: "#0f172a",
                                "&:hover": { bgcolor: "#1e293b" },
                            }}
                            disabled={isPending || uploading}
                            onClick={() => doUpdate()}
                        >
                            {isPending || uploading ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </Box>
                </Stack>
            </Container>
        </Box>
    );
};

export default AdminSelfProfileEditPage;

