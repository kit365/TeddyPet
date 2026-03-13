import { useEffect, useState } from "react";
import { Box, Container, Typography, CircularProgress, Button, ThemeProvider } from "@mui/material";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { LogoAdmin } from "../../../assets/admin/logo";
import { adminTheme } from "../../config/theme";
import { getMe } from "../../../api/auth.api";
import Cookies from "js-cookie";
import { useAuthStore } from "../../../stores/useAuthStore";
import { verifyInvitation } from "../../api/google-whitelist.api";

export const AcceptInvitationPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState("Đang xác thực mã mời của bạn...");
    useEffect(() => {
        const verify = async () => {
            if (!token) {
                setStatus('error');
                setMessage("Mã mời không lệ hoặc đã hết hạn.");
                return;
            }

            try {
                const res = await verifyInvitation(token);
                if (res.success && res.data) {
                    const { token: accessToken, refreshToken, mustChangePassword } = res.data;
                    
                    // 1. Get user details with the new token
                    const meRes = await getMe(accessToken);
                    if (meRes.success && meRes.data) {
                        // 2. Clear old cookies and set new ones
                        Cookies.set("tokenAdmin", accessToken, { expires: 1 });
                        if (refreshToken) Cookies.set("refreshTokenAdmin", refreshToken, { expires: 7 });

                        // 3. Sync to AuthStore
                        const fullUserData = { ...meRes.data, mustChangePassword };
                        useAuthStore.getState().adminLoginSync(fullUserData as any, accessToken);

                        // 4. Redirect immediately to setup password
                        toast.success("Xác thực thành công! Vui lòng thiết lập mật khẩu của bạn.");
                        navigate("/admin/setup-password", { replace: true });
                    } else {
                        throw new Error("Không thể tải thông tin người dùng.");
                    }
                } else {
                    setStatus('error');
                    setMessage(res.message || "Xác thực mã mời thất bại.");
                }
            } catch (error: any) {
                console.error("Verification error:", error);
                setStatus('error');
                setMessage(error.message || "Đã xảy ra lỗi khi xác thực mã mời.");
            }
        };

        verify();
    }, [token, navigate]);

    return (
        <ThemeProvider theme={adminTheme}>
            <ToastContainer />
            <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Container
                    disableGutters
                    maxWidth={false}
                    sx={{
                        height: "72px",
                        px: "24px",
                        display: "flex",
                        alignItems: "center",
                        position: "absolute",
                        top: 0
                    }}>
                    <div className="inline-block w-[40px] h-[40px]">
                        <LogoAdmin />
                    </div>
                </Container>

                <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <Box sx={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
                        {status === 'loading' && (
                            <>
                                <CircularProgress sx={{ color: '#1C252E', mb: 4 }} />
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>{message}</Typography>
                            </>
                        )}

                        {status === 'success' && null}

                        {status === 'error' && (
                            <>
                                <Box sx={{ mb: 4, fontSize: '64px' }}>⚠️</Box>
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: 'error.main' }}>Rất tiếc!</Typography>
                                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                                    {message}
                                </Typography>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={() => navigate("/admin/auth/login")}
                                    sx={{
                                        py: 1.5,
                                        fontWeight: 700,
                                        borderColor: "#1C252E",
                                        color: "#1C252E",
                                        '&:hover': { borderColor: "#454F5B", bgcolor: 'rgba(0,0,0,0.04)' }
                                    }}
                                >
                                    Quay lại trang chủ
                                </Button>
                            </>
                        )}
                    </Box>
                </main>
            </Box>
        </ThemeProvider>
    );
};
