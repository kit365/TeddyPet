import { useEffect, useState } from "react";
import { Box, Container, Typography, CircularProgress, Button, ThemeProvider } from "@mui/material";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { LogoAdmin } from "../../../assets/admin/logo";
import { adminTheme } from "../../config/theme";
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
                if (res.success) {
                    setStatus('success');
                    setMessage("Xác nhận lời mời thành công! Bây giờ bạn có thể đăng nhập bằng Google.");
                    toast.success("Xác nhận thành công!");
                } else {
                    setStatus('error');
                    setMessage(res.message || "Xác thực mã mời thất bại.");
                }
            } catch (error: any) {
                setStatus('error');
                setMessage(error.message || "Đã xảy ra lỗi khi xác thực mã mời.");
            }
        };

        verify();
    }, [token]);

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

                        {status === 'success' && (
                            <>
                                <Box sx={{ mb: 4, fontSize: '64px' }}>🎉</Box>
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Chào mừng bạn!</Typography>
                                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                                    Bạn đã chính thức trở thành một phần của đội ngũ quản trị TeddyPet.
                                </Typography>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={() => navigate("/admin/auth/login")}
                                    sx={{
                                        py: 1.5,
                                        fontWeight: 700,
                                        bgcolor: "#1C252E",
                                        '&:hover': { bgcolor: "#454F5B" }
                                    }}
                                >
                                    Đăng nhập ngay
                                </Button>
                            </>
                        )}

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
