import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    Typography,
    ThemeProvider,
} from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { adminTheme } from "../../config/theme";
import { LogoTeddyPet } from "../../../assets/admin/LogoTeddyPet";
import {
    confirmStaffPasswordReissue,
    previewStaffPasswordReissue,
    type StaffPasswordReissuePreview,
} from "../../../api/auth.api";

export const StaffPasswordReissuePage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token") ?? "";
    const [confirmOpen, setConfirmOpen] = useState(false);

    const previewQuery = useQuery({
        queryKey: ["staff-reissue-preview", token],
        queryFn: () => previewStaffPasswordReissue(token),
        enabled: !!token,
        retry: false,
    });

    const preview: StaffPasswordReissuePreview | undefined = previewQuery.data?.data;

    useEffect(() => {
        if (!token) {
            toast.error("Thiếu mã xác nhận trong đường dẫn.");
        }
    }, [token]);

    const confirmMutation = useMutation({
        mutationFn: () => confirmStaffPasswordReissue(token),
        onSuccess: (res) => {
            toast.success(res.message ?? "Đã cấp mật khẩu tạm cho nhân viên.");
            setConfirmOpen(false);
            navigate("/admin/dashboard/system", { replace: true });
        },
        onError: (err: any) => {
            const msg =
                err?.response?.data?.message || err?.message || "Không thể xác nhận. Vui lòng thử lại.";
            toast.error(msg);
        },
    });

    return (
        <ThemeProvider theme={adminTheme}>
            <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6f8", py: 4, px: 2 }}>
                <Stack alignItems="center" spacing={3}>
                    <LogoTeddyPet width="120px" height="48px" />
                    <Typography variant="h5" fontWeight={800} color="#1C252E">
                        Xác nhận cấp lại mật khẩu nhân viên
                    </Typography>

                    <Card sx={{ maxWidth: 520, width: "100%", borderRadius: 2, boxShadow: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            {!token && (
                                <Typography color="error">Liên kết không hợp lệ.</Typography>
                            )}
                            {token && previewQuery.isLoading && (
                                <Stack alignItems="center" py={4}>
                                    <CircularProgress />
                                    <Typography sx={{ mt: 2 }} color="text.secondary">
                                        Đang tải thông tin…
                                    </Typography>
                                </Stack>
                            )}
                            {token && previewQuery.isError && (
                                <Typography color="error">
                                    {(previewQuery.error as any)?.response?.data?.message ||
                                        "Không tải được yêu cầu. Liên kết có thể đã hết hạn hoặc đã được xử lý."}
                                </Typography>
                            )}
                            {preview && (
                                <Stack spacing={2}>
                                    <Typography variant="body2" color="text.secondary">
                                        Vui lòng kiểm tra thông tin nhân viên trước khi cấp mật khẩu tạm. Nhân viên sẽ
                                        nhận mật khẩu qua email và phải đổi mật khẩu khi đăng nhập.
                                    </Typography>
                                    <Box sx={{ bgcolor: "#f8fafc", borderRadius: 2, p: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Email
                                        </Typography>
                                        <Typography fontWeight={600}>{preview.email}</Typography>
                                        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1.5 }}>
                                            Tên đăng nhập
                                        </Typography>
                                        <Typography fontWeight={600}>{preview.username}</Typography>
                                        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1.5 }}>
                                            Họ tên
                                        </Typography>
                                        <Typography fontWeight={600}>{preview.fullName}</Typography>
                                        {preview.staffId != null && (
                                            <>
                                                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1.5 }}>
                                                    Mã hồ sơ nhân viên
                                                </Typography>
                                                <Typography fontWeight={600}>{preview.staffId}</Typography>
                                            </>
                                        )}
                                    </Box>
                                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                                        <Button variant="outlined" onClick={() => navigate("/admin/dashboard/system")}>
                                            Hủy
                                        </Button>
                                        <Button variant="contained" color="primary" onClick={() => setConfirmOpen(true)}>
                                            Xác nhận cấp mật khẩu
                                        </Button>
                                    </Stack>
                                </Stack>
                            )}
                        </CardContent>
                    </Card>
                </Stack>

                <Dialog open={confirmOpen} onClose={() => !confirmMutation.isPending && setConfirmOpen(false)}>
                    <DialogTitle>Xác nhận cấp mật khẩu tạm?</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2">
                            Hành động này sẽ đặt mật khẩu tạm cho <strong>{preview?.email}</strong> và gửi email cho
                            nhân viên. Bạn không thể hoàn tác từ giao diện này.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setConfirmOpen(false)} disabled={confirmMutation.isPending}>
                            Quay lại
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => confirmMutation.mutate()}
                            disabled={confirmMutation.isPending}
                        >
                            {confirmMutation.isPending ? "Đang xử lý…" : "Xác nhận"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </ThemeProvider>
    );
};
