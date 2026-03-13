import { Link, useLocation, useNavigate } from "react-router-dom";
import { Input } from "./sections/Input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useAuthStore } from "../../../stores/useAuthStore";
import { login as loginApi, loginWithGoogle } from "../../../api/auth.api";
import { Header } from "../../components/layouts/Header";
import { FooterSub } from "../../components/layouts/FooterSub";
import { ArrowRight, CheckCircle, XmarkCircle } from "iconoir-react";
import { useEffect, useState } from "react";
import { useWatch } from "react-hook-form";
import { AuthSupportActions } from "../register-login/sections/AuthSupportActions";
import { GoogleLogin } from "@react-oauth/google";

const schema = z.object({
    usernameOrEmail: z
        .string()
        .nonempty("Vui lòng nhập email!")
    ,
    password: z
        .string()
        .nonempty("Vui lòng nhập mật khẩu!"),
    rememberPassword: z.boolean().optional()
});

type LoginFormData = z.infer<typeof schema>;

export const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const loginStore = useAuthStore((state) => state.login);
    const [notification, setNotification] = useState<{ success: boolean; message: string } | null>(null);
    const [showSupport, setShowSupport] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
        defaultValues: {
            usernameOrEmail: "",
            password: "",
            rememberPassword: false
        },
        resolver: zodResolver(schema)
    });

    const usernameOrEmailValue = useWatch({
        control,
        name: "usernameOrEmail"
    });

    useEffect(() => {
        if (location.state?.verifyResult) {
            setNotification(location.state.verifyResult);
            // Clear state so refresh doesn't show it again
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const onSubmit = async (data: LoginFormData) => {
        try {
            const submitData = {
                usernameOrEmail: data.usernameOrEmail,
                password: data.password
            };

            const response = await loginApi(submitData);

            if (response.success) {
                toast.success(response.message || "Đăng nhập thành công!");
                setShowSupport(false);

                const { token, refreshToken } = response.data;

                // Call getMe to get full user profile
                try {
                    loginStore(response.data as any, token, refreshToken); // Optimistically set initial partial data + token

                    const { getMe } = await import("../../../api/auth.api");
                    const userResponse = await getMe(token);
                    if (userResponse.success) {
                         const fullUserData = {
                            ...userResponse.data,
                            mustChangePassword: response.data.mustChangePassword ?? (userResponse.data as any).mustChangePassword
                        };
                        loginStore(fullUserData, token, refreshToken); // Update with full profile
                    }
                } catch (error) {
                    console.error("Failed to fetch user profile", error);
                }

                navigate("/dashboard/profile");
            } else {
                toast.error(response.message || "Đăng nhập thất bại!");
            }
        } catch (error: any) {
            console.error(error);
            const message = error?.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại sau!";
            toast.error(message);

            if (message.includes("chưa được xác thực email")) {
                setShowSupport(true);
            }
        }
    };

    return (
        <>
            <Header />
            
            {/* Global Loading Overlay for Google Login */}
            {isGoogleLoading && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/60 backdrop-blur-sm animate-fadeIn">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-16 h-16 border-4 border-client-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[1.8rem] font-bold text-slate-800 animate-pulse">Đang đăng nhập bằng Google...</p>
                    </div>
                </div>
            )}

            {notification && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 animate-fadeIn">
                    <div className="bg-white rounded-[20px] shadow-[0_10px_40px_rgba(0,0,0,0.2)] p-[40px] text-center w-[450px] relative overflow-hidden animate-slideUp">
                        <div className={`absolute top-0 left-0 w-full h-[6px] ${notification.success ? 'bg-green-500' : 'bg-red-500'}`}></div>

                        <div className={`w-[80px] h-[80px] mx-auto mb-[25px] rounded-full flex items-center justify-center ${notification.success ? 'bg-green-50' : 'bg-red-50'}`}>
                            {notification.success ? (
                                <CheckCircle className="w-[40px] h-[40px] text-green-500" strokeWidth={2} />
                            ) : (
                                <XmarkCircle className="w-[40px] h-[40px] text-red-500" strokeWidth={2} />
                            )}
                        </div>

                        <h3 className="text-[2.4rem] font-[700] text-[#333] mb-[10px]">
                            {notification.success ? "Thành công!" : "Thất bại!"}
                        </h3>
                        <p className="text-[1.6rem] text-[#666] mb-[30px] leading-relaxed">
                            {notification.message}
                        </p>

                        <button
                            onClick={() => setNotification(null)}
                            className={`w-full py-[12px] rounded-full text-[1.6rem] font-[600] text-white transition-all transform hover:-translate-y-1 shadow-md hover:shadow-lg ${notification.success ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                        >
                            Đã hiểu
                        </button>
                    </div>
                </div>
            )}

            <div className="app-container my-[100px]">
                <div className="flex items-center justify-center mx-auto max-w-[1200px]">
                    <div className="w-[570px] h-[680px] relative z-10 hidden lg:block">
                        <img src="https://i.imgur.com/LZKlu0w.jpeg" alt="" className="w-full h-full object-cover rounded-[12px] shadow-lg" />
                    </div>
                    <div className="w-full lg:w-[509px] lg:ml-[-150px] relative z-20">
                        <div className="p-[30px] md:p-[50px] bg-white shadow-[0_10px_50px_rgba(0,0,0,0.15)] rounded-[20px]" >
                            <div className="text-center mb-[40px]">
                                <h3 className="text-[3rem] font-bold text-[#333]">Chào bạn trở lại! 👋</h3>
                                <p className="text-[1.4rem] text-[#666] mt-2 font-medium">Đăng nhập để tiếp tục chăm sóc thú cưng của bạn</p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[20px]">
                                <div className="relative">
                                    <label className="absolute top-[-10px] left-[15px] bg-white px-[5px] text-[1.3rem] font-bold text-client-secondary z-10">Email</label>
                                    <Input
                                        placeholder="your@email.com"
                                        {...register("usernameOrEmail")}
                                        error={errors.usernameOrEmail?.message}
                                        errorColor="text-red-500"
                                        className="!rounded-[12px] !border-[#eee] !px-[20px] !py-[15px] !text-[1.5rem] focus:!border-client-primary focus:!ring-4 focus:!ring-red-50 transition-all font-medium"
                                        containerClassName="!mb-0"
                                    />
                                </div>

                                <div className="relative">
                                    <label className="absolute top-[-10px] left-[15px] bg-white px-[5px] text-[1.3rem] font-bold text-client-secondary z-10">Mật khẩu</label>
                                    <Input
                                        placeholder="********"
                                        type="password"
                                        {...register("password")}
                                        error={errors.password?.message}
                                        errorColor="text-red-500"
                                        className="!rounded-[12px] !border-[#eee] !px-[20px] !py-[15px] !text-[1.5rem] focus:!border-client-primary focus:!ring-4 focus:!ring-red-50 transition-all font-medium"
                                        containerClassName="!mb-0"
                                    />
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-[10px] group cursor-pointer">
                                        <input
                                            type="checkbox"
                                            id="rememberPassword"
                                            {...register("rememberPassword")}
                                            className="appearance-none w-[20px] h-[20px] border-2 border-[#eee] rounded-[6px] bg-white checked:bg-client-primary checked:border-client-primary cursor-pointer transition-all bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20strokeWidth%3D%224%22%20strokeLinecap%3D%22round%22%20strokeLinejoin%3D%22round%22%3E%3Cpolyline%20points%3D%2220%206%209%2017%204%2012%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] group-hover:border-client-primary"
                                        />
                                        <label htmlFor="rememberPassword" className="text-[1.4rem] cursor-pointer select-none font-bold text-[#666] group-hover:text-client-primary transition-colors">Nhớ mật khẩu</label>
                                    </div>
                                    <Link to="/auth/forgot-password" className="text-client-secondary hover:text-client-primary transition-all text-[1.4rem] font-bold">Quên mật khẩu?</Link>
                                </div>

                                <button
                                    disabled={isSubmitting}
                                    className="w-full mt-[10px] relative overflow-hidden group bg-client-primary rounded-[12px] py-[15px] font-bold text-[1.6rem] text-white cursor-pointer flex items-center justify-center gap-[10px] transition-all disabled:opacity-50 shadow-xl shadow-red-100 hover:shadow-red-200"
                                >
                                    <span className="relative z-10">{isSubmitting ? "Đang xác thực..." : "Đăng nhập ngay"}</span>
                                    {!isSubmitting && <ArrowRight className="relative z-10 w-[2.2rem] h-[2.2rem] transition-transform duration-300 group-hover:translate-x-1" />}
                                    <div className="absolute top-0 left-0 w-full h-full bg-slate-800 transition-transform duration-500 ease-in-out transform translate-x-[-100%] group-hover:translate-x-0 origin-left"></div>
                                </button>
                            </form>

                            {showSupport && (
                                <div className="animate-fadeIn mt-6 bg-red-50/50 p-6 rounded-[15px] border border-red-100">
                                    <AuthSupportActions defaultEmail={usernameOrEmailValue} />
                                </div>
                            )}

                            <div className="text-center text-[#7d7b7b] mt-[30px] text-[1.4rem]">
                                Bạn chưa có tài khoản?{" "}
                                <Link
                                    className="font-bold text-client-secondary hover:text-client-primary transition-all underline decoration-2 underline-offset-4"
                                    to={"/auth/register"}
                                >
                                    Tham gia ngay
                                </Link>
                            </div>

                            <div className="my-[30px] flex items-center gap-4">
                                <div className="h-[1px] flex-1 bg-slate-100"></div>
                                <span className="text-[1.3rem] font-bold text-slate-400 uppercase tracking-widest">Hoặc đăng nhập với</span>
                                <div className="h-[1px] flex-1 bg-slate-100"></div>
                            </div>

                            <div className="flex justify-center">
                                <GoogleLogin
                                    onSuccess={async (credentialResponse) => {
                                        if (credentialResponse.credential) {
                                            setIsGoogleLoading(true);
                                            try {
                                                const response = await loginWithGoogle(credentialResponse.credential);
                                                if (response.success) {
                                                    toast.success("Đăng nhập Google thành công!");
                                                    
                                                    const { token, refreshToken } = response.data;
                                                    
                                                    // BẮT BUỘC: Lưu token vào store/cookie TRƯỚC khi gọi getMe
                                                    loginStore(response.data as any, token, refreshToken);
                                                    
                                                    const { getMe } = await import("../../../api/auth.api");
                                                    const userResponse = await getMe(token);
                                                    
                                                    if (userResponse.success) {
                                                        const fullUserData = {
                                                            ...userResponse.data,
                                                            mustChangePassword: response.data.mustChangePassword ?? (userResponse.data as any).mustChangePassword
                                                        };
                                                        loginStore(fullUserData, token, refreshToken);
                                                        
                                                        if (fullUserData.mustChangePassword) {
                                                            toast.info("Vui lòng thiết lập mật khẩu của bạn.");
                                                            setTimeout(() => navigate("/auth/setup-password"), 1500);
                                                            return;
                                                        }
                                                        navigate("/dashboard/profile");
                                                    }
                                                }
                                            } catch (error: any) {
                                                console.error("Google Login Error:", error);
                                                toast.error(error?.response?.data?.message || "Đăng nhập Google thất bại!");
                                            } finally {
                                                setIsGoogleLoading(false);
                                            }
                                        }
                                    }}
                                    onError={() => {
                                        toast.error("Đăng nhập Google thất bại!");
                                    }}
                                    useOneTap
                                    shape="circle"
                                    theme="outline"
                                    text="signin_with"
                                    width="100%"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <FooterSub />
        </>
    )
}