import { Link } from "react-router-dom";
import { ProductBanner } from "../product/sections/ProductBanner";
import { Input } from "./sections/Input";
import { FooterSub } from "../../components/layouts/FooterSub";

const breadcrumbs = [
    { label: "Trang chủ", to: "/" },
    { label: "Đăng ký", to: "/dang-ky" }
];

export const RegisterPage = () => {
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
                            <form action="" className="mt-[30px] w-full">
                                <Input placeholder="Họ *" name="firstname" />
                                <Input placeholder="Tên *" name="lastname" />
                                <Input placeholder="Tên đăng nhập *" name="" />
                                <Input placeholder="Email *" type="email" name="email" />
                                <Input placeholder="Mật khẩu *" type="password" name="password" />
                                <Input placeholder="Xác nhận mật khẩu *" type="password" name="password" />
                                <button className="w-full mt-[10px] mb-[20px] py-[16px] px-[30px] bg-client-secondary text-white font-secondary text-[1.8rem] rounded-[40px] transition-default cursor-pointer hover:bg-white hover:text-client-secondary">Đăng ký</button>
                            </form>
                            <p className="text-center text-white">Bạn đã có tài khoản? <Link className="underline decoration-transparent hover:decoration-white transition-all duration-300 ease-linear" to={"/dang-nhap"}>Đăng nhập</Link></p>
                        </div>
                    </div>
                </div>
            </div>
            <FooterSub />
        </>
    )
}