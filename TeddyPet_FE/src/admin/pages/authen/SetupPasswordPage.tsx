import { useState } from "react"
import { Box, Button, Container, TextField, ThemeProvider, Typography, InputAdornment, IconButton } from "@mui/material"
import { useNavigate } from "react-router-dom"
import { LogoAdmin } from "../../../assets/admin/logo"
import { EyeIcon, NoEyeIcon } from "../../assets/icons"
import { adminTheme } from "../../config/theme"
import { setupInitialPassword } from "../../api/auth.api"
import { toast, ToastContainer } from "react-toastify"
import { useAuthStore } from "../../../stores/useAuthStore"
import { useQueryClient } from "@tanstack/react-query"

export const SetupPasswordPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, set } = useAuthStore();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleTogglePasswordVisibility = () => {
        setShowPassword(prev => !prev)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp!");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Mật khẩu phải từ 6 ký tự trở lên!");
            return;
        }

        setIsSubmitting(true);
        try {
            await setupInitialPassword({ newPassword, confirmPassword });
            
            // Critical: Invalidate the 'me' query so AdminGuard sees mustChangePassword is false
            await queryClient.invalidateQueries({ queryKey: ["me-admin"] });
            
            toast.success("Thiết lập mật khẩu thành công!");
            
            // Update local store state immediately
            if (user) {
                set({ user: { ...user, mustChangePassword: false } });
            }

            // Small delay to allow toast to be seen
            setTimeout(() => {
                const role = user?.role;
                let target = "/admin/dashboard/analytics";
                if (role === "ADMIN" || role === "SUPER_ADMIN") target = "/admin/dashboard/ecommerce";
                else if (role === "STAFF") target = "/admin/staff/dashboard";
                
                navigate(target, { replace: true });
            }, 1000);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Thiết lập mật khẩu thất bại!");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <ToastContainer />
            <ThemeProvider theme={adminTheme}>
                <div className="min-h-screen flex">
                    <Container
                        disableGutters
                        maxWidth={false}
                        sx={{
                            height: "72px",
                            px: "24px",
                            display: "flex",
                            alignItems: "center",
                            zIndex: "1101",
                            position: "fixed",
                            top: 0
                        }}>
                        <div className="inline-block w-[40px] h-[40px]">
                            <LogoAdmin />
                        </div>
                    </Container>
                    <main className="flex flex-1">
                        <div className="left-header-auth flex flex-col items-center justify-center gap-[64px] max-w-[480px] px-[24px] pb-[24px] pt-[72px] w-full min-h-full relative">
                            <div className="text-center">
                                <Typography sx={{ fontSize: "1.875rem", fontWeight: "700", color: "#1C252E" }}>Thiết lập mật khẩu</Typography>
                                <Typography sx={{ fontSize: "0.9375rem", mt: "16px", color: "#637381" }}>Chào mừng bạn lần đầu đăng nhập. Hãy thiết lập mật khẩu để bảo vệ tài khoản.</Typography>
                            </div>
                            <img src="https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/illustrations/illustration-dashboard.webp" alt="" className="w-full aspect-[4/3] object-cover" />
                        </div>
                        <div className="flex flex-col items-center justify-center flex-1 py-[80px] px-[16px]">
                            <Box sx={{ width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column" }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Cài đặt mật khẩu đầu tiên</Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>Dùng mật khẩu này cho những lần đăng nhập thủ công sau này (nếu bạn không dùng Google).</Typography>
                                
                                <form onSubmit={handleSubmit}>
                                    <Box sx={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                        <TextField
                                            label="Mật khẩu mới"
                                            type={showPassword ? "text" : "password"}
                                            fullWidth
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            slotProps={{
                                                input: {
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton onClick={handleTogglePasswordVisibility} edge="end">
                                                                {showPassword ? <NoEyeIcon /> : <EyeIcon />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    )
                                                }
                                            }}
                                        />
                                        <TextField
                                            label="Xác nhận mật khẩu"
                                            type={showPassword ? "text" : "password"}
                                            fullWidth
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            variant="contained"
                                            fullWidth
                                            sx={{
                                                py: 1.5,
                                                fontWeight: 700,
                                                bgcolor: "#1C252E",
                                                '&:hover': { bgcolor: "#454F5B" }
                                            }}
                                        >
                                            {isSubmitting ? "Đang xử lý..." : "Hoàn tất thiết lập"}
                                        </Button>
                                    </Box>
                                </form>
                            </Box>
                        </div>
                    </main>
                </div>
            </ThemeProvider>
        </>
    )
}
