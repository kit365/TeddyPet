import { Link, useLocation, useNavigate } from "react-router-dom";
import { Input } from "./sections/Input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useAuthStore } from "../../../stores/useAuthStore";
import { login as loginApi } from "../../../api/auth.api";
import { Header } from "../../components/layouts/Header";
import { FooterSub } from "../../components/layouts/FooterSub";
import { ArrowRight, CheckCircle, XmarkCircle } from "iconoir-react";
import { useEffect, useState } from "react";
import { useWatch } from "react-hook-form";
import { AuthSupportActions } from "../register-login/sections/AuthSupportActions";

const schema = z.object({
    usernameOrEmail: z
        .string()
        .nonempty("Vui lòng nhập tên người dùng!")
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

                const { token } = response.data;

                // Call getMe to get full user profile
                try {
                    // Temporarily store token for the getMe call (if needed by interceptors, though usually handled by authStore later)
                    // Better approach: Since we have the token, we can manually set it or ensure our API client uses it.
                    // Assuming apiApp interceptor might need help if it reads from store:
                    loginStore(response.data, token); // Optimistically set initial partial data + token

                    const userResponse = await import("../../../api/auth.api").then(m => m.getMe());
                    if (userResponse.success) {
                        loginStore(userResponse.data, token); // Update with full profile
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

            // Chỉ hiện phần hỗ trợ nếu lỗi là do chưa xác thực email
            if (message.includes("chưa được xác thực email")) {
                setShowSupport(true);
            }
        }
    };

    return (
        <>
            <Header />
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
                    <div className="w-[570px] h-[680px] relative z-10">
                        <img src="https://i.imgur.com/LZKlu0w.jpeg" alt="" className="w-full h-full object-cover rounded-[12px] shadow-lg" />
                    </div>
                    <div className="w-[509px] ml-[-150px] relative z-20">
                        <div className="p-[50px] bg-white shadow-[0_10px_50px_rgba(0,0,0,0.15)] rounded-[12px]" >
                            <h3 className="text-center text-[3rem] font-[600] mb-[50px] text-[#333]">Đăng nhập 👋</h3>
                            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[20px]">
                                <div className="relative">
                                    <label className="absolute top-[-10px] left-[15px] bg-white px-[5px] text-[1.4rem] text-client-secondary">Tên người dùng</label>
                                    <Input
                                        placeholder="Tên người dùng"
                                        {...register("usernameOrEmail")}
                                        error={errors.usernameOrEmail?.message}
                                        errorColor="text-red-500"
                                        className="!rounded-[8px] !border-[#ddd] !px-[20px] !py-[15px] !text-[1.4rem]"
                                        containerClassName="!mb-0"
                                    />
                                </div>

                                <div className="relative">
                                    <label className="absolute top-[-10px] left-[15px] bg-white px-[5px] text-[1.4rem] text-client-secondary">Mật khẩu</label>
                                    <Input
                                        placeholder="********"
                                        type="password"
                                        {...register("password")}
                                        error={errors.password?.message}
                                        errorColor="text-red-500"
                                        className="!rounded-[8px] !border-[#ddd] !px-[20px] !py-[15px] !text-[1.4rem]"
                                        containerClassName="!mb-0"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-[10px]">
                                        <input
                                            type="checkbox"
                                            id="rememberPassword"
                                            {...register("rememberPassword")}
                                            className="appearance-none w-[18px] h-[18px] border border-[#d1d5db] rounded-[4px] bg-white checked:bg-client-primary checked:border-client-primary cursor-pointer transition-all bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20strokeWidth%3D%223%22%20strokeLinecap%3D%22round%22%20strokeLinejoin%3D%22round%22%3E%3Cpolyline%20points%3D%2220%206%209%2017%204%2012%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]"
                                        />
                                        <label htmlFor="rememberPassword" className="text-client-text text-[1.4rem] cursor-pointer select-none font-[400] text-[#555]">Nhớ mật khẩu</label>
                                    </div>
                                    <Link to="/auth/forgot-password" className="text-client-secondary hover:text-client-primary transition-all text-[1.4rem] font-[500]">Quên mật khẩu?</Link>
                                </div>

                                <button
                                    disabled={isSubmitting}
                                    className="w-full mt-[15px] relative overflow-hidden group bg-client-primary rounded-[8px] py-[12px] font-[600] text-[1.5rem] text-white cursor-pointer flex items-center justify-center gap-[10px] transition-all disabled:opacity-50"
                                >
                                    <span className="relative z-10">{isSubmitting ? "Đang xử lý..." : "Đăng nhập"}</span>
                                    {!isSubmitting && <ArrowRight className="relative z-10 w-[2rem] h-[2rem] transition-transform duration-300 rotate-[-45deg] group-hover:rotate-0" />}
                                    <div className="absolute top-0 left-0 w-full h-full bg-client-secondary transition-transform duration-500 ease-in-out transform scale-x-0 origin-left group-hover:scale-x-100"></div>
                                </button>
                            </form>

                            {showSupport && (
                                <div className="animate-fadeIn">
                                    <AuthSupportActions defaultEmail={usernameOrEmailValue} />
                                </div>
                            )}

                            <p className="text-center text-[#7d7b7b] mt-[25px]">
                                Bạn chưa có tài khoản?{" "}
                                <Link
                                    className="font-bold text-client-secondary hover:text-client-primary transition-all duration-300 ease-linear"
                                    to={"/auth/register"}
                                >
                                    Đăng ký ngay
                                </Link>
                            </p>

                            <p className="text-center text-client-secondary my-[20px] relative before:absolute before:content-[''] before:w-[42%] before:h-[1px] before:bg-[#eee] before:top-[12px] before:left-0 after:absolute after:content-[''] after:w-[42%] after:h-[1px] after:bg-[#eee] after:top-[12px] after:right-0">
                                HOẶC
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={() => navigate("/auth/login-email")}
                                    className="w-full py-[10px] rounded-[8px] border border-[#ddd] text-[1.4rem] font-[600] text-client-secondary hover:bg-[#f9fafb] transition-colors"
                                >
                                    Đăng nhập với email (không cần mật khẩu)
                                </button>

                                <div className="flex justify-center">
                                    <Link
                                        to={"#"}
                                        className="flex items-center justify-center w-[40px] h-[40px] rounded-full border border-[#eee] hover:bg-[#f9f9f9] transition-all"
                                        title="Đăng nhập bằng Google"
                                    >
                                        <img src="https://i.imgur.com/Z8EmTcv.png" alt="" className="w-[18px] h-[18px] object-cover" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <FooterSub />
        </>
    )
}