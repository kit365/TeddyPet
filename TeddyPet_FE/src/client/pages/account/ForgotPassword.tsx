import { FooterSub } from "../../components/layouts/FooterSub";
import { ProductBanner } from "../product/sections/ProductBanner"

const breadcrumbs = [
    { label: "Trang chủ", to: "/" },
    { label: "Tài khoản của tôi", to: "/tai-khoan/quen-mat-khau" }
];

export const ForgotPasswordPage = () => {
    return (
        <>
            <ProductBanner
                pageTitle="Tài khoản"
                breadcrumbs={breadcrumbs}
                url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-details.jpg"
            />
            <div className="app-container">
                <form className="p-[10px] mb-[300px] 2xl:mb-[230px]">
                    <p className="text-client-text mb-[20px]">Quên mật khẩu? Vui lòng nhập tên đăng nhập hoặc địa chỉ email của bạn. Bạn sẽ nhận được liên kết tạo mật khẩu mới qua email.</p>
                    <label htmlFor="username" className="block text-[1.4rem] mb-[15px] text-client-text">Tên đăng nhập hoặc email <span className="font-[700] text-[#a00]">*</span></label>
                    <input id="username" type="text" className="block w-[49%] py-[16px] px-[32px] pr-[60px] border border-[#200707cc] bg-white text-[#000] outline-none rounded-[40px]" />
                    <button type="submit" className="mt-[30px] text-white bg-client-primary hover:bg-client-secondary py-[16px] px-[30px] cursor-pointer text-[1.5rem] font-secondary rounded-[40px] transition-default">Khôi phục</button>
                </form>
            </div>
            <FooterSub />
        </>
    )
}