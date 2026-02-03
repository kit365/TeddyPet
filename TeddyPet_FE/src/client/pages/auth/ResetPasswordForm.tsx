import { useNavigate, useLocation, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { Input } from "./sections/Input";
import { Header } from "../../components/layouts/Header";
import { FooterSub } from "../../components/layouts/FooterSub";
import { ArrowLeft } from "iconoir-react";
import { useEffect } from "react";
import { resetPassword as resetPasswordApi } from "../../../api/auth.api";

const schema = z.object({
    password: z
        .string()
        .nonempty("Vui lòng nhập mật khẩu mới!")
        .min(8, "Mật khẩu phải có ít nhất 8 ký tự!")
        .regex(/[A-Z]/, "Mật khẩu phải có ít nhất một chữ cái viết hoa!")
        .regex(/[a-z]/, "Mật khẩu phải có ít nhất một chữ cái viết thường!")
        .regex(/\d/, "Mật khẩu phải có ít nhất một chữ số!")
        .regex(/[~!@#$%^&*]/, "Mật khẩu phải có ít nhất một ký tự đặc biệt! (~!@#$%^&*)"),
    confirmPassword: z.string().nonempty("Vui lòng xác nhận mật khẩu!")
}).refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp!",
    path: ["confirmPassword"]
});

type ResetPasswordFormData = z.infer<typeof schema>;

export const ResetPasswordFormPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const token = location.state?.token;

    useEffect(() => {
        if (!token) {
            toast.error("Truy cập không hợp lệ!");
            navigate("/auth/login");
        }
    }, [token, navigate]);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(schema)
    });

    const onSubmit = async (data: ResetPasswordFormData) => {
        try {
            const submitData = {
                token,
                newPassword: data.password,
                confirmPassword: data.confirmPassword
            };

            const response = await resetPasswordApi(submitData);

            if (response.success) {
                // Navigate to login with success state to show the modal
                navigate("/auth/login", {
                    state: {
                        verifyResult: { success: true, message: "Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới." }
                    }
                });
            } else {
                toast.error(response.message || "Đặt lại mật khẩu thất bại!");
            }
        } catch (error: any) {
            console.error(error);
            const msg = error?.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại sau!";
            toast.error(msg);
        }
    };

    if (!token) return null;

    return (
        <>
            <Header />
            <div className="app-container my-[100px]">
                <div className="flex items-center justify-center mx-auto max-w-[1200px]">
                    <div className="w-[570px] h-[642px] relative z-10">
                        <img src="https://i.imgur.com/wSh7ISz.png" alt="" className="w-full h-full object-cover rounded-[12px]" />
                    </div>
                    <div className="w-[509px] ml-[-150px] relative z-20">
                        <div className="p-[50px] bg-white shadow-[0_10px_50px_rgba(0,0,0,0.15)] rounded-[12px]" >
                            <h3 className="text-center text-[3rem] font-[600] mb-[20px] text-[#333]">Đặt lại mật khẩu 🔒</h3>
                            <p className="text-center text-[#777] mb-[40px] text-[1.5rem]">Vui lòng nhập mật khẩu mới của bạn.</p>

                            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[20px]">
                                <div className="relative">
                                    <label className="absolute top-[-10px] left-[15px] bg-white px-[5px] text-[1.4rem] text-client-secondary">Mật khẩu mới</label>
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

                                <div className="relative">
                                    <label className="absolute top-[-10px] left-[15px] bg-white px-[5px] text-[1.4rem] text-client-secondary">Xác nhận mật khẩu</label>
                                    <Input
                                        placeholder="********"
                                        type="password"
                                        {...register("confirmPassword")}
                                        error={errors.confirmPassword?.message}
                                        errorColor="text-red-500"
                                        className="!rounded-[8px] !border-[#ddd] !px-[20px] !py-[15px] !text-[1.4rem]"
                                        containerClassName="!mb-0"
                                    />
                                </div>

                                <button
                                    disabled={isSubmitting}
                                    className="w-full mt-[15px] relative overflow-hidden group bg-client-primary rounded-[8px] py-[12px] font-[600] text-[1.5rem] text-white cursor-pointer flex items-center justify-center gap-[10px] transition-all disabled:opacity-50"
                                >
                                    <span className="relative z-10">{isSubmitting ? "Đang xử lý..." : "Đặt lại mật khẩu"}</span>
                                    <div className="absolute top-0 left-0 w-full h-full bg-client-secondary transition-transform duration-500 ease-in-out transform scale-x-0 origin-left group-hover:scale-x-100"></div>
                                </button>
                            </form>

                            <div className="mt-[30px] text-center">
                                <Link to="/auth/login" className="flex items-center justify-center gap-[5px] mx-auto text-client-text hover:text-client-primary transition-all font-[500] text-[1.4rem]">
                                    <ArrowLeft width={18} /> Quay lại đăng nhập
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <FooterSub />
        </>
    )
}
