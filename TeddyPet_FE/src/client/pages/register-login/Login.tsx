import { Link } from "react-router-dom";
import { Input } from "./sections/Input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLogin } from "./hooks/use-login";

const loginSchema = z.object({
    usernameOrEmail: z
        .string()
        .nonempty("Vui lòng nhập email hoặc tên đăng nhập!"),
    password: z
        .string()
        .nonempty("Vui lòng nhập mật khẩu!")
});

type LoginFormSchema = z.infer<typeof loginSchema>;

export const LoginPage = () => {
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<LoginFormSchema>({
        defaultValues: {
            usernameOrEmail: "",
            password: ""
        },
        resolver: zodResolver(loginSchema)
    });

    const { mutate: loginMutate } = useLogin();

    const onSubmit = (data: LoginFormSchema) => {
        loginMutate(data);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
            <div className="bg-[#e67e2026] p-[70px] rounded-[20px] max-w-[615px] w-full">
                <h2 className="text-[4rem] text-client-secondary font-[700] text-center mb-[12px]">
                    Đăng nhập
                </h2>
                <p className="text-client-text text-center mb-[40px]">
                    Vui lòng nhập thông tin đăng nhập của bạn
                </p>
                <div className="m-[10px] py-[10px] px-[40px] text-[#000] rounded-[20px] border border-client-secondary text-[1.4rem] font-[500] text-center shadow-[0_0_0px_#ff6262] hover:text-white hover:bg-client-secondary transition-default cursor-pointer">
                    Google
                </div>
                <p className="mt-[30px] mb-[40px] text-client-text text-center">Hoặc đăng nhập với</p>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col mb-[30px]">
                    <div className="mb-[10px]">
                        <Input
                            placeholder="Email hoặc tên đăng nhập"
                            {...register("usernameOrEmail")}
                            error={errors.usernameOrEmail?.message}
                        />
                    </div>
                    <Input
                        placeholder="Mật khẩu"
                        type="password"
                        {...register("password")}
                        error={errors.password?.message}
                    />
                    <div className="flex items-center justify-center checkbox mb-[20px]">
                        <input type="checkbox" id="rememberPassword" hidden />
                        <label htmlFor="rememberPassword" className="text-client-text pl-[12px] ml-[-12px]">Nhớ mật khẩu</label>
                    </div>
                    <button className="mt-[10px] text-white bg-client-primary rounded-[40px] py-[16px] px-[30px] cursor-pointer transition-default hover:bg-client-secondary">Đăng nhập</button>
                </form>
                <Link to="/tai-khoan/quen-mat-khau" className="block text-center text-client-secondary underline decoration-transparent hover:decoration-client-primary hover:text-client-primary transition-all duration-300 ease-linear">Quên mật khẩu?</Link>
                <p className="text-center text-client-text mt-[10px]">Bạn chưa có tài khoản? <Link className="underline decoration-transparent hover:decoration-client-text transition-all duration-300 ease-linear" to={"/auth/register"}>Đăng ký</Link></p>
            </div>
        </div>
    )
}