import { Link, useNavigate } from "react-router-dom";
import { Input } from "./sections/Input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { forgotPassword as forgotPasswordApi } from "../../../api/auth.api";
import { Header } from "../../components/layouts/Header";
import { FooterSub } from "../../components/layouts/FooterSub";
import { ArrowRight } from "iconoir-react";

const schema = z.object({
    email: z
        .string()
        .nonempty("Vui lòng nhập email!")
        .email("Email không đúng định dạng!")
});

type ForgotPasswordFormData = z.infer<typeof schema>;

export const ForgotPasswordPage = () => {
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormData>({
        defaultValues: {
            email: ""
        },
        resolver: zodResolver(schema)
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        try {
            const response = await forgotPasswordApi(data.email);

            if (response.success) {
                navigate("/auth/forgot-password-success", { state: { email: data.email } });
            } else {
                toast.error(response.message || "Gửi yêu cầu thất bại!");
            }
        } catch (error: any) {
            console.error(error);
            const message = error?.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại sau!";
            toast.error(message);
        }
    };

    return (
        <>
            <Header />
            <div className="app-container my-[100px]">
                <div className="flex items-center justify-center mx-auto max-w-[1200px]">
                    <div className="w-[570px] h-[470px] relative z-10">
                        <img src="https://i.imgur.com/AOUepK1.png" alt="" className="w-full h-full object-cover rounded-[12px] shadow-lg" />
                    </div>
                    <div className="w-[509px] ml-[-150px] relative z-20">
                        <div className="p-[50px] bg-white shadow-[0_10px_50px_rgba(0,0,0,0.15)] rounded-[12px]" >
                            <h3 className="text-center text-[3rem] font-[600] mb-[50px] text-[#333]">Quên mật khẩu 👋</h3>
                            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[20px]">
                                <div className="relative">
                                    <label className="absolute top-[-10px] left-[15px] bg-white px-[5px] text-[1.4rem] text-client-secondary">Email</label>
                                    <Input
                                        placeholder="Nhập email của bạn"
                                        {...register("email")}
                                        error={errors.email?.message}
                                        errorColor="text-red-500"
                                        className="!rounded-[8px] !border-[#ddd] !px-[20px] !py-[15px] !text-[1.4rem]"
                                        containerClassName="!mb-0"
                                    />
                                </div>

                                <button
                                    disabled={isSubmitting}
                                    className="w-full mt-[15px] relative overflow-hidden group bg-client-primary rounded-[8px] py-[12px] font-[600] text-[1.5rem] text-white cursor-pointer flex items-center justify-center gap-[10px] transition-all disabled:opacity-50"
                                >
                                    <span className="relative z-10">{isSubmitting ? "Đang xử lý..." : "Lấy lại mật khẩu"}</span>
                                    {!isSubmitting && <ArrowRight className="relative z-10 w-[2rem] h-[2rem] transition-transform duration-300 rotate-[-45deg] group-hover:rotate-0" />}
                                    <div className="absolute top-0 left-0 w-full h-full bg-client-secondary transition-transform duration-500 ease-in-out transform scale-x-0 origin-left group-hover:scale-x-100"></div>
                                </button>
                            </form>

                            <p className="text-center text-[#7d7b7b] mt-[25px]">Quay lại <Link className="font-bold text-client-secondary hover:text-client-primary transition-all duration-300 ease-linear" to={"/auth/login"}>Đăng nhập</Link></p>
                        </div>
                    </div>
                </div>
            </div>
            <FooterSub />
        </>
    )
}
