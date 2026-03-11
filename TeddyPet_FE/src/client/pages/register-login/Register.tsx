import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-toastify";
import { ProductBanner } from "../product/sections/ProductBanner";
import { Input } from "./sections/Input";
import { FooterSub } from "../../components/layouts/FooterSub";
import { register } from "../../../api/auth.api";

const registerSchema = z.object({
    firstName: z.string().min(2, "Họ phải có ít nhất 2 ký tự").nonempty("Vui lòng nhập họ"),
    lastName: z.string().min(2, "Tên phải có ít nhất 2 ký tự").nonempty("Vui lòng nhập tên"),
    username: z.string().nonempty("Vui lòng nhập tên đăng nhập"),
    phoneNumber: z.string()
        .regex(/^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/, "Số điện thoại không đúng định dạng")
        .nonempty("Vui lòng nhập số điện thoại"),
    email: z.string().email("Email không đúng định dạng").nonempty("Vui lòng nhập email"),
    password: z.string()
        .min(5, "Mật khẩu phải có ít nhất 5 ký tự")
        .nonempty("Vui lòng nhập mật khẩu"),
    confirmPassword: z.string().nonempty("Vui lòng xác nhận mật khẩu")
}).refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const breadcrumbs = [
    { label: "Trang chủ", to: "/" },
    { label: "Đăng ký", to: "/auth/register" }
];

export const RegisterPage = () => {
    const navigate = useNavigate();
    const { register: registerField, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema)
    });

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            const { confirmPassword, ...payload } = data;
            const res = await register(payload);

            if (!res.success) {
                toast.error(res.message);
                return;
            }

            toast.success("Đăng ký thành công!");

            setTimeout(() => {
                navigate("/auth/login");
            }, 2000);
            navigate("/auth/login");
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Đăng ký thất bại";
            toast.error(msg);
        }
    };

    return (
        <>
            <ProductBanner pageTitle="Đăng ký" breadcrumbs={breadcrumbs} url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-details.jpg" className="bg-top" />
            <div className="app-container">
                <div className="flex gap-[40px] mx-[160px] 2xl:mx-[50px] mb-[120px] 2xl:mb-[100px] p-[20px] max-w-[1200px] rounded-[20px] bg-[#e67e20]">
                    <div className="flex-1">
                        <img
                            src="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/Pet-Daycare-img.jpg"
                            alt=""
                            width={560}
                            height={788}
                            className="w-full h-full object-cover rounded-[20px]"
                        />
                    </div>
                    <div className="flex-1">
                        <div className="py-[30px] pr-[20px]">
                            <h2 className="text-center font-secondary text-[4rem] 2xl:text-[3.5rem] text-white mt-[24px] mb-[12px]">Đăng ký</h2>
                            <p className="text-center text-white">Bạn chưa có tài khoản?</p>
                            <form onSubmit={handleSubmit(onSubmit)} className="mt-[30px] w-full">
                                <div className="flex gap-[16px]">
                                    <div className="flex-1">
                                        <Input
                                            placeholder="Họ *"
                                            {...registerField("firstName")}
                                            error={errors.firstName?.message}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Input
                                            placeholder="Tên *"
                                            {...registerField("lastName")}
                                            error={errors.lastName?.message}
                                        />
                                    </div>
                                </div>
                                <Input
                                    placeholder="Tên đăng nhập *"
                                    {...registerField("username")}
                                    error={errors.username?.message}
                                />
                                <Input
                                    placeholder="Số điện thoại *"
                                    {...registerField("phoneNumber")}
                                    error={errors.phoneNumber?.message}
                                />
                                <Input
                                    placeholder="Email *"
                                    type="email"
                                    {...registerField("email")}
                                    error={errors.email?.message}
                                />
                                <Input
                                    placeholder="Mật khẩu *"
                                    type="password"
                                    {...registerField("password")}
                                    error={errors.password?.message}
                                />
                                <Input
                                    placeholder="Xác nhận mật khẩu *"
                                    type="password"
                                    {...registerField("confirmPassword")}
                                    error={errors.confirmPassword?.message}
                                />
                                <button className="w-full mt-[10px] mb-[20px] py-[16px] px-[30px] bg-client-secondary text-white font-secondary text-[1.8rem] rounded-[40px] transition-default cursor-pointer hover:bg-white hover:text-client-secondary">Đăng ký</button>
                            </form>
                            <p className="text-center text-white">Bạn đã có tài khoản? <Link className="underline decoration-transparent hover:decoration-white transition-all duration-300 ease-linear" to={"/auth/login"}>Đăng nhập</Link></p>
                        </div>
                    </div>
                </div>
            </div>
            <FooterSub />
        </>
    )
}