import { ArrowRight } from "iconoir-react";
import { ProductBanner } from "../product/sections/ProductBanner";
import { Sidebar } from "./sections/Sidebar";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const ChangePasswordPage = () => {
    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Tài khoản", to: "/dashboard/profile" },
        { label: "Đổi mật khẩu", to: `/dashboard/change-password` },
    ];

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("Cập nhật mật khẩu thành công!");
    };

    return (
        <>
            <ProductBanner
                pageTitle="Đổi mật khẩu"
                breadcrumbs={breadcrumbs}
                url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-details.jpg"
                className="bg-top"
            />

            <div className="mt-[-150px] mb-[100px] w-[1600px] mx-auto flex items-stretch">
                <div className="w-[25%] px-[12px] flex">
                    <Sidebar />
                </div>
                <div className="w-[75%] px-[12px]">
                    <div className="mt-[100px] p-[35px] bg-white shadow-[0px_8px_24px_#959da533] rounded-[12px]">
                        <h3 className="text-[2.4rem] font-[600] text-client-secondary mb-[25px]">
                            Đổi mật khẩu
                        </h3>
                        <div className="p-[25px] border border-[#eee] rounded-[10px]">
                            <form className="space-y-[20px]" onSubmit={onSubmit}>
                                <div className="grid grid-cols-2 gap-[25px]">
                                    <div className="flex flex-col gap-[10px]">
                                        <label className="text-[1.5rem] font-[600] text-client-secondary">Mật khẩu mới</label>
                                        <input
                                            type="password"
                                            required
                                            className="border border-[#eee] rounded-[10px] px-[20px] py-[15px] text-[1.5rem] focus:outline-none focus:border-client-primary focus:ring-4 focus:ring-client-primary/10 transition-all bg-[#fcfcfc] hover:bg-white"
                                            placeholder="Nhập mật khẩu mới"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-[10px]">
                                        <label className="text-[1.5rem] font-[600] text-client-secondary">Xác nhận mật khẩu</label>
                                        <input
                                            type="password"
                                            required
                                            className="border border-[#eee] rounded-[10px] px-[20px] py-[15px] text-[1.5rem] focus:outline-none focus:border-client-primary focus:ring-4 focus:ring-client-primary/10 transition-all bg-[#fcfcfc] hover:bg-white"
                                            placeholder="Nhập lại mật khẩu mới"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-[10px] pt-[20px]">
                                    <button type="submit" className="relative overflow-hidden group bg-client-primary rounded-[8px] px-[30px] py-[12px] font-[500] text-[1.4rem] text-white cursor-pointer flex items-center gap-[8px]">
                                        <span className="relative z-10">Cập nhật mật khẩu</span>
                                        <ArrowRight className="relative z-10 w-[1.8rem] h-[1.8rem] transition-transform duration-300 rotate-[-45deg] group-hover:rotate-0" />
                                        <div className="absolute top-0 left-0 w-full h-full bg-client-secondary transition-transform duration-500 ease-in-out transform scale-x-0 origin-left group-hover:scale-x-100"></div>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
