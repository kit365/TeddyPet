import { ArrowRight } from "iconoir-react";
import { ProductBanner } from "../product/sections/ProductBanner";
import { Link } from "react-router-dom";
import { Sidebar } from "./sections/Sidebar";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const ProfileEditPage = () => {
    const user = { name: "Demo User" }; // Fixed data for portability

    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Tài khoản", to: "/dashboard/profile" },
        { label: "Chỉnh sửa thông tin", to: `/dashboard/profile/edit` },
    ];

    if (!user) {
        return (
            <>
                <ProductBanner
                    pageTitle="Tài khoản"
                    breadcrumbs={breadcrumbs}
                    url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-details.jpg"
                    className="bg-top"
                />
                <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 bg-[#f9f9f9]">
                    <p className="text-[1.8rem] text-client-secondary">Vui lòng đăng nhập để xem thông tin tài khoản.</p>
                    <a href="/auth/login" className="bg-client-secondary text-white px-8 py-3 rounded-full text-[1.6rem] hover:bg-client-primary transition-all">Đăng nhập ngay</a>
                </div>
            </>
        );
    }

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("Cập nhật thông tin thành công!");
    };

    return (
        <>
            <ProductBanner
                pageTitle="Chỉnh sửa thông tin"
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
                        <h3 className="text-[2.4rem] font-[600] text-client-secondary mb-[25px] flex items-center justify-between">
                            Chỉnh sửa thông tin
                            <Link className="relative overflow-hidden group bg-[#ffa500] rounded-[8px] px-[25px] py-[12px] font-[500] text-[1.4rem] text-white" to={"/dashboard/profile"}>
                                <span className="relative z-10">Hủy</span>
                                <div className="absolute top-0 left-0 w-full h-full bg-[#cc8400] transition-transform duration-500 ease-in-out transform scale-x-0 origin-left group-hover:scale-x-100"></div>
                            </Link>
                        </h3>
                        <div className="p-[25px] border border-[#eee] rounded-[10px]">
                            <form className="space-y-[20px]" onSubmit={onSubmit}>
                                <div className="grid grid-cols-2 gap-[25px]">
                                    <div className="flex flex-col gap-[10px]">
                                        <label className="text-[1.5rem] font-[600] text-client-secondary">Họ tên</label>
                                        <input type="text" className="border border-[#eee] rounded-[10px] px-[20px] py-[15px] text-[1.5rem] focus:outline-none focus:border-client-primary focus:ring-4 focus:ring-client-primary/10 transition-all bg-[#fcfcfc] hover:bg-white" defaultValue="Jhon Deo" />
                                    </div>
                                    <div className="flex flex-col gap-[10px]">
                                        <label className="text-[1.5rem] font-[600] text-client-secondary">Email</label>
                                        <input type="email" className="border border-[#eee] rounded-[10px] px-[20px] py-[15px] text-[1.5rem] focus:outline-none focus:border-client-primary focus:ring-4 focus:ring-client-primary/10 transition-all bg-[#fcfcfc] hover:bg-white" defaultValue="example@yahoo.com" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-[25px]">
                                    <div className="flex flex-col gap-[10px]">
                                        <label className="text-[1.5rem] font-[600] text-client-secondary">Số điện thoại</label>
                                        <input type="text" className="border border-[#eee] rounded-[10px] px-[20px] py-[15px] text-[1.5rem] focus:outline-none focus:border-client-primary focus:ring-4 focus:ring-client-primary/10 transition-all bg-[#fcfcfc] hover:bg-white" defaultValue="0123456789" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-[10px] pt-[20px]">
                                    <button type="submit" className="relative overflow-hidden group bg-client-primary rounded-[8px] px-[30px] py-[12px] font-[500] text-[1.4rem] text-white cursor-pointer flex items-center gap-[8px]">
                                        <span className="relative z-10">Lưu thay đổi</span>
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
