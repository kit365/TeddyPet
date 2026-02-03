import { Link, useNavigate } from "react-router-dom";
import { ProductBanner } from "../product/sections/ProductBanner";
import { Input } from "./sections/Input";
import { FooterSub } from "../../components/layouts/FooterSub";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { register as registerApi } from "../../../api/auth.api";
import { toast } from "react-toastify";
import { useAuthStore } from "../../../stores/useAuthStore";
import { Header } from "../../components/layouts/Header";
import { ArrowRight } from "iconoir-react";

const breadcrumbs = [
    { label: "Trang chủ", to: "/" },
    { label: "Đăng ký", to: "/auth/register" }
];

const schema = z.object({
    username: z.string().nonempty("Vui lòng nhập tên người dùng!").min(3, "Tên người dùng phải có ít nhất 3 ký tự!").max(50),
    firstName: z.string().nonempty("Vui lòng nhập tên!").max(50),
    lastName: z.string().nonempty("Vui lòng nhập họ!").max(50),
    email: z
        .string()
        .nonempty("Vui lòng nhập email!")
        .email("Email không đúng định dạng!"),
    phone: z
        .string()
        .nonempty("Vui lòng nhập số điện thoại!")
        .regex(/^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0|6-9]|9[0-4|6-9])[0-9]{7}$/, "Số điện thoại không đúng định dạng!"),
    password: z
        .string()
        .nonempty("Vui lòng nhập mật khẩu!")
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

type RegisterFormData = z.infer<typeof schema>;

export const RegisterPage = () => {
    const navigate = useNavigate();
    const loginStore = useAuthStore((state) => state.login);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
        resolver: zodResolver(schema)
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            const submitData = {
                username: data.username,
                email: data.email,
                phoneNumber: data.phone,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName
            };

            const response = await registerApi(submitData);

            if (response.success) { // Changed from response.code === "success"
                toast.success(response.message || "Đăng ký thành công!");
                navigate("/auth/register-success", {
                    state: {
                        email: data.email,
                        resendCooldownSeconds: response.data?.resendCooldownSeconds,
                        canResendAt: response.data?.canResendAt
                    }
                });
            } else {
                toast.error(response.message || "Đăng ký thất bại!");
            }
        } catch (error: any) {
            console.error(error);
            // Handle statusCode 400 with message in data
            const message = error?.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại sau!";
            toast.error(message);
        }
    };

    return (
        <>
            <Header />
            <div className="app-container my-[100px]">
                <div className="flex items-center justify-center mx-auto max-w-[1200px]">
                    <div className="w-[570px] h-[850px] relative z-10">
                        <img src="https://i.imgur.com/wSh7ISz.png" alt="" className="w-full h-full object-cover rounded-[12px]" />
                    </div>
                    <div className="flex-1 max-w-[642px] ml-[-150px] relative z-20">
                        <div className="p-[50px] bg-white shadow-[0_10px_50px_rgba(0,0,0,0.15)] rounded-[12px]" >
                            <h3 className="text-center text-[3rem] font-[600] mb-[50px] text-[#333]">Đăng ký để tiếp tục 👋</h3>
                            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[20px]">
                                <div className="flex gap-[20px]">
                                    <div className="flex-1 relative">
                                        <label className="absolute top-[-10px] left-[15px] bg-white px-[5px] text-[1.4rem] text-client-secondary">Họ</label>
                                        <Input
                                            placeholder="Họ"
                                            {...register("lastName")}
                                            error={errors.lastName?.message}
                                            errorColor="text-red-500"
                                            className="!rounded-[8px] !border-[#ddd] !px-[20px] !py-[15px] !text-[1.4rem]"
                                            containerClassName="!mb-0"
                                        />
                                    </div>
                                    <div className="flex-1 relative">
                                        <label className="absolute top-[-10px] left-[15px] bg-white px-[5px] text-[1.4rem] text-client-secondary">Tên</label>
                                        <Input
                                            placeholder="Tên"
                                            {...register("firstName")}
                                            error={errors.firstName?.message}
                                            errorColor="text-red-500"
                                            className="!rounded-[8px] !border-[#ddd] !px-[20px] !py-[15px] !text-[1.4rem]"
                                            containerClassName="!mb-0"
                                        />
                                    </div>
                                </div>

                                <div className="relative">
                                    <label className="absolute top-[-10px] left-[15px] bg-white px-[5px] text-[1.4rem] text-client-secondary">Tên người dùng</label>
                                    <Input
                                        placeholder="Tên người dùng"
                                        {...register("username")}
                                        error={errors.username?.message}
                                        errorColor="text-red-500"
                                        className="!rounded-[8px] !border-[#ddd] !px-[20px] !py-[15px] !text-[1.4rem]"
                                        containerClassName="!mb-0"
                                    />
                                </div>

                                <div className="relative">
                                    <label className="absolute top-[-10px] left-[15px] bg-white px-[5px] text-[1.4rem] text-client-secondary">Email</label>
                                    <Input
                                        placeholder="example@Zenis.com"
                                        type="email"
                                        {...register("email")}
                                        error={errors.email?.message}
                                        errorColor="text-red-500"
                                        className="!rounded-[8px] !border-[#ddd] !px-[20px] !py-[15px] !text-[1.4rem]"
                                        containerClassName="!mb-0"
                                    />
                                </div>

                                <div className="relative">
                                    <label className="absolute top-[-10px] left-[15px] bg-white px-[5px] text-[1.4rem] text-client-secondary">Số điện thoại</label>
                                    <Input
                                        placeholder="Số điện thoại"
                                        {...register("phone")}
                                        error={errors.phone?.message}
                                        errorColor="text-red-500"
                                        className="!rounded-[8px] !border-[#ddd] !px-[20px] !py-[15px] !text-[1.4rem]"
                                        containerClassName="!mb-0"
                                    />
                                </div>

                                <div className="flex gap-[20px]">
                                    <div className="flex-1 relative">
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
                                    <div className="flex-1 relative">
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
                                </div>

                                <button
                                    disabled={isSubmitting}
                                    className="w-full mt-[15px] relative overflow-hidden group bg-client-primary rounded-[8px] py-[12px] font-[600] text-[1.5rem] text-white cursor-pointer flex items-center justify-center gap-[10px] transition-all disabled:opacity-50"
                                >
                                    <span className="relative z-10">{isSubmitting ? "Đang xử lý..." : "Đăng ký"}</span>
                                    {!isSubmitting && <ArrowRight className="relative z-10 w-[2rem] h-[2rem] transition-transform duration-300 rotate-[-45deg] group-hover:rotate-0" />}
                                    <div className="absolute top-0 left-0 w-full h-full bg-client-secondary transition-transform duration-500 ease-in-out transform scale-x-0 origin-left group-hover:scale-x-100"></div>
                                </button>
                            </form>
                            <p className="text-center text-[#7d7b7b] mt-[25px]">Bạn đã có tài khoản? <Link className="font-bold text-client-secondary hover:text-client-primary transition-all duration-300 ease-linear" to={"/auth/login"}>Đăng nhập ngay</Link></p>
                            <p className="text-center text-client-secondary my-[20px] relative before:absolute before:content-[''] before:w-[42%] before:h-[1px] before:bg-[#eee] before:top-[12px] before:left-0 after:absolute after:content-[''] after:w-[42%] after:h-[1px] after:bg-[#eee] after:top-[12px] after:right-0">HOẶC</p>
                            <div className="flex justify-center">
                                <Link to={"#"} className="flex items-center justify-center w-[40px] h-[40px] rounded-full border border-[#eee] hover:bg-[#f9f9f9] transition-all" title="Đăng nhập bằng Google">
                                    <img src="https://i.imgur.com/Z8EmTcv.png" alt="" className="w-[18px] h-[18px] object-cover" />
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