import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { changeUnverifiedEmail, resendEmail } from "../../../../api/auth.api";
import { Input } from "./Input";

const changeEmailSchema = z.object({
    oldEmail: z.string().email("Email cũ không hợp lệ"),
    newEmail: z.string().email("Email mới không hợp lệ"),
    password: z.string().min(1, "Vui lòng nhập mật khẩu để xác nhận")
});

type ChangeEmailForm = z.infer<typeof changeEmailSchema>;

interface AuthSupportActionsProps {
    defaultEmail?: string;
}

export const AuthSupportActions = ({ defaultEmail }: AuthSupportActionsProps) => {
    const [isChangingEmail, setIsChangingEmail] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<ChangeEmailForm>({
        defaultValues: {
            oldEmail: defaultEmail || "",
            newEmail: "",
            password: ""
        },
        resolver: zodResolver(changeEmailSchema)
    });

    // Mutation gửi lại email
    const resendMutation = useMutation({
        mutationFn: (email: string) => resendEmail(email),
        onSuccess: (res: any) => {
            toast.success(res.message || "Đã gửi lại email xác thực!");
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Không thể gửi lại email!");
        }
    });

    // Mutation đổi email
    const changeEmailMutation = useMutation({
        mutationFn: (data: any) => changeUnverifiedEmail(data),
        onSuccess: (res: any) => {
            toast.success(res.message || "Đổi email thành công! Vui lòng kiểm tra hộp thư mới.");
            setIsChangingEmail(false);
            reset();
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Đổi email thất bại!");
        }
    });

    const handleResend = () => {
        if (!defaultEmail) {
            toast.warn("Vui lòng nhập email trước!");
            return;
        }
        resendMutation.mutate(defaultEmail);
    };

    const onSubmitChangeEmail = (data: ChangeEmailForm) => {
        changeEmailMutation.mutate(data);
    };

    return (
        <div className="mt-6 border-t border-gray-200 pt-6">
            {!isChangingEmail ? (
                <div className="flex flex-col gap-3">
                    <p className="text-[1.3rem] text-client-text text-center italic">
                        Tài khoản chưa xác thực?
                    </p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={handleResend}
                            disabled={resendMutation.isPending}
                            className="text-[1.3rem] text-client-primary hover:underline font-medium disabled:opacity-50"
                        >
                            {resendMutation.isPending ? "Đang gửi..." : "Gửi lại mã xác thực"}
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                            onClick={() => setIsChangingEmail(true)}
                            className="text-[1.3rem] text-client-secondary hover:underline font-medium"
                        >
                            Đổi email nhận mã
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit(onSubmitChangeEmail)} className="animate-fadeIn">
                    <h4 className="text-[1.5rem] font-bold text-client-secondary mb-4 text-center">Đổi Email Xác Thực</h4>
                    <div className="flex flex-col gap-4">
                        <Input
                            placeholder="Email cũ (đã đăng ký)"
                            {...register("oldEmail")}
                            error={errors.oldEmail?.message}
                        />
                        <Input
                            placeholder="Email mới muốn nhận mã"
                            {...register("newEmail")}
                            error={errors.newEmail?.message}
                        />
                        <Input
                            placeholder="Nhập mật khẩu để xác nhận"
                            type="password"
                            {...register("password")}
                            error={errors.password?.message}
                        />
                        <div className="flex gap-3 justify-end mt-2">
                            <button
                                type="button"
                                onClick={() => setIsChangingEmail(false)}
                                className="px-6 py-2 text-[1.3rem] rounded-full border border-gray-200 hover:bg-gray-50 transition-all font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={changeEmailMutation.isPending}
                                className="px-6 py-2 bg-client-primary text-white text-[1.3rem] rounded-full hover:bg-client-secondary transition-all font-medium disabled:opacity-50"
                            >
                                {changeEmailMutation.isPending ? "Đang xử lý..." : "Cập nhật & Gửi mã"}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
};
