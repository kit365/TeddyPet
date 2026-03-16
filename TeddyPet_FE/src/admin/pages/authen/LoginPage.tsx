import { useState } from "react"
import { Box, Button, Container, TextField, ThemeProvider, Typography, InputAdornment, IconButton, Alert } from "@mui/material"
import { Link, useSearchParams } from "react-router-dom"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LogoAdmin } from "../../../assets/admin/logo"
import { SettingsIcon, EyeIcon, NoEyeIcon } from "../../assets/icons"
import { adminTheme } from "../../config/theme"
import { loginSchema, LoginFormValues } from "../../schemas/login.schema"
import { useLogin } from "./hooks/use-login"
import { useGoogleLogin } from "./hooks/use-google-login"
import { SafeGoogleLogin } from "./components/SafeGoogleLogin"
import { toast } from "react-toastify"

const LOGOS = [
    "https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/icons/platforms/ic-jwt.svg",
    "https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/icons/platforms/ic-firebase.svg",
    "https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/icons/platforms/ic-amplify.svg",
    "https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/icons/platforms/ic-auth0.svg",
    "https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/icons/platforms/ic-supabase.svg"
]

export const LoginPage = () => {
    const [searchParams] = useSearchParams();
    const forbidden = searchParams.get("forbidden") === "1";
    const [showPassword, setShowPassword] = useState(false);
    const [isGlobalLoading, setIsGlobalLoading] = useState(false);
    const handleTogglePasswordVisibility = () => {
        setShowPassword(prev => !prev)
    }

    const {
        control,
        handleSubmit,
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            usernameOrEmail: "",
            password: ""
        },
    })

    const { mutate: loginMutate, isPending } = useLogin()
    const { mutate: googleLoginMutate, isPending: isGooglePending } = useGoogleLogin()

    const onSubmit = (data: LoginFormValues) => {
        loginMutate(data)
    }

    return (
        <>
            {/* Global Loading Overlay for Google Login */}
            {isGlobalLoading && (
                <Box
                    sx={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 2000,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        backdropFilter: 'blur(4px)',
                        animation: 'fadeIn 0.3s ease-in-out',
                        '@keyframes fadeIn': {
                            from: { opacity: 0 },
                            to: { opacity: 1 }
                        }
                    }}
                >
                    <Box
                        sx={{
                            width: 64,
                            height: 64,
                            border: '4px solid #1C252E',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            mb: 3,
                            '@keyframes spin': {
                                from: { transform: 'rotate(0deg)' },
                                to: { transform: 'rotate(360deg)' }
                            }
                        }}
                    />
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            color: '#1C252E',
                            animation: 'pulse 1.5s infinite ease-in-out',
                            '@keyframes pulse': {
                                '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                                '50%': { opacity: 0.7, transform: 'scale(0.98)' }
                            }
                        }}
                    >
                        Đang xác thực quyền truy cập...
                    </Typography>
                </Box>
            )}

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
                            justifyContent: "space-between",
                            position: "fixed",
                            top: "0",
                            left: "0",
                            zIndex: "1101",
                            background: "transparent"
                        }}>
                        {/* Logo */}
                        <Link to="/" className="inline-block w-[40px] h-[40px]">
                            <LogoAdmin />
                        </Link>
                        <Button
                            className="hover:scale-[1.04] hover:bg-admin-hoverIcon transition-all duration-150 ease-in-out"
                            sx={{
                                minWidth: 0,
                                padding: 0,
                            }}>
                            <SettingsIcon
                                sx={{
                                    color: "#637381",
                                    fontSize: "1.375rem",
                                    animation: "spin 10s linear infinite",
                                    "@keyframes spin": {
                                        "0%": { transform: "rotate(0deg)" },
                                        "100%": { transform: "rotate(360deg)" }
                                    }
                                }}
                            />
                        </Button>
                    </Container>
                    <main className="flex flex-1">
                        {/* Left */}
                        <div className="left-header-auth flex flex-col items-center justify-center gap-[64px] max-w-[480px] px-[24px] pb-[24px] pt-[72px] w-full min-h-full relative">
                            <div className="text-center">
                                <Typography sx={{ fontSize: "1.875rem", fontWeight: "700", color: "#1C252E" }}>Chào mừng</Typography>
                                <Typography sx={{ fontSize: "0.9375rem", mt: "16px", color: "#637381" }}>Nâng cao hiệu quả với quy trình tối ưu.</Typography>
                            </div>
                            <img src="https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/illustrations/illustration-dashboard.webp" alt="" className="w-full aspect-[4/3] object-cover" />
                            <ul className="gap-[16px] flex">
                                {LOGOS.map((logo, index) => (
                                    <li
                                        key={index}
                                        className="cursor-not-allowed grayscale"
                                    >
                                        <img
                                            src={logo}
                                            alt={`platform-${index}`}
                                            className="w-[32px] h-[32px]"
                                        />
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {/* Right */}
                        <div className="flex flex-col items-center justify-center flex-1 py-[80px] px-[16px]">
                            <Box sx={{ width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column" }}>
                                <h5 className="text-[1.1875rem] font-[700] mb-[40px]">Đăng nhập vào tài khoản của bạn</h5>
                                <form onSubmit={handleSubmit(onSubmit)}>
                                    <Box sx={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                        {forbidden && (
                                            <Alert severity="warning" sx={{ fontSize: "0.8125rem" }}>
                                                Bạn không có quyền truy cập trang quản trị. Chỉ tài khoản Admin hoặc Nhân viên mới được đăng nhập.
                                            </Alert>
                                        )}
                                        <Controller
                                            name="usernameOrEmail"
                                            control={control}
                                            render={({ field, fieldState }) => (
                                                <TextField
                                                    {...field}
                                                    label="Tên đăng nhập hoặc Email"
                                                    fullWidth
                                                    disabled={isPending}
                                                    error={!!fieldState.error}
                                                    helperText={fieldState.error?.message}
                                                />
                                            )}
                                        />
                                        <div className="flex flex-col gap-[12px]">
                                            <Link to={'/admin/auth/forgot-password'} className="text-[0.875rem] text-end hover:underline">Quên mật khẩu?</Link>
                                            <Controller
                                                name="password"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <TextField
                                                        {...field}
                                                        label="Mật khẩu"
                                                        type={showPassword ? "text" : "password"}
                                                        fullWidth
                                                        disabled={isPending}
                                                        error={!!fieldState.error}
                                                        helperText={fieldState.error?.message}
                                                        slotProps={{
                                                            input: {
                                                                endAdornment: (
                                                                    <InputAdornment position="end">
                                                                        <IconButton
                                                                            onClick={handleTogglePasswordVisibility}
                                                                            edge="end"
                                                                            disabled={isPending}
                                                                            sx={{
                                                                                padding: "8px",
                                                                            }}
                                                                        >
                                                                            {showPassword ? <NoEyeIcon sx={{ color: "#637381", mr: "0" }} /> : <EyeIcon sx={{ color: "#637381", mr: "0" }} />}
                                                                        </IconButton>
                                                                    </InputAdornment>
                                                                )
                                                            }
                                                        }}
                                                    />
                                                )}
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={isPending}
                                            sx={{
                                                padding: "8px 16px",
                                                color: "#fff",
                                                textTransform: "unset",
                                                minHeight: "48px",
                                                borderRadius: "8px",
                                                fontSize: "0.875rem",
                                                fontWeight: "700",
                                                backgroundColor: "#1C252E",
                                                borderColor: "currentColor",
                                                '&:hover': {
                                                    backgroundColor: "#454F5B",
                                                    boxShadow: "0 8px 16px 0 rgba(145 158 171 / 16%)"
                                                },
                                                '&:disabled': {
                                                    backgroundColor: "#B8BFCC",
                                                    color: "#fff"
                                                }
                                            }}>
                                            {isPending ? "Đang đăng nhập..." : "Đăng nhập"}
                                        </Button>

                                        <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                                            <Box sx={{ flex: 1, height: '1px', bgcolor: '#E5E8EB' }} />
                                            <Typography sx={{ px: 2, color: '#637381', fontSize: '0.75rem', fontWeight: 700 }}>HOẶC</Typography>
                                            <Box sx={{ flex: 1, height: '1px', bgcolor: '#E5E8EB' }} />
                                        </Box>

                                        <Box id="google-login-container" sx={{ display: 'flex', justifyContent: 'center' }}>
                                            <SafeGoogleLogin
                                                onSuccess={credential => {
                                                    const googleBtnContainer = document.getElementById('google-login-container');
                                                    if (googleBtnContainer) {
                                                        googleBtnContainer.style.opacity = '0';
                                                        googleBtnContainer.style.pointerEvents = 'none';
                                                        googleBtnContainer.style.transform = 'scale(0.95)';
                                                        googleBtnContainer.style.transition = 'all 0.2s ease';
                                                    }


                                                    setTimeout(() => {
                                                        setIsGlobalLoading(true);


                                                        setTimeout(() => {
                                                            googleLoginMutate(credential, {
                                                                onSettled: () => {
                                                                    setIsGlobalLoading(false);
                                                                    if (googleBtnContainer) {
                                                                        googleBtnContainer.style.opacity = '1';
                                                                        googleBtnContainer.style.pointerEvents = 'auto';
                                                                        googleBtnContainer.style.transform = 'scale(1)';
                                                                    }
                                                                }
                                                            });
                                                        }, 150);
                                                    }, 200);
                                                }}
                                                onError={() => {
                                                    setIsGlobalLoading(false);
                                                    toast.error('Đăng nhập Google thất bại');
                                                }}
                                                disabled={isGooglePending || isPending || isGlobalLoading}
                                            />
                                        </Box>
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