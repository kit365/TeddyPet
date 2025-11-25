import { useState } from "react";
import { ProductBanner } from "../product/sections/ProductBanner"
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "iconoir-react";
import { useCartStore } from "../../../stores/useCartStore";
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { FooterSub } from "../../components/layouts/FooterSub";

const breadcrumbs = [
    { label: "Trang chủ", to: "/" },
    { label: "Thanh toán", to: "/thanh-toan" },
];

export const CheckoutPage = () => {
    const navigate = useNavigate();
    const [showOrderNotes, setShowOrderNotes] = useState(false);
    const items = useCartStore((state) => state.items);
    const totalAmount = useCartStore((state) => state.totalAmount());
    const clearCart = useCartStore((state) => state.clearCart);

    const handlePlaceOrder = () => {
        clearCart();
        navigate(`/thanh-toan/thanh-cong`);
    };

    return (
        <>
            <ProductBanner
                pageTitle="Thanh toán"
                breadcrumbs={breadcrumbs}
                url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-listing.jpg"
                className="bg-top"
            />
            {items.length > 0 ? (
                <div className="app-container flex pb-[150px] 2xl:pb-[100px] relative">
                    <form className="w-[65%] bg-white rounded-[20px] overflow-hidden border border-[#D7D7D7] p-[50px]">
                        {/* Thông tin liên lạc */}
                        <h2 className="text-[2.5rem] font-secondary my-[8px]">Thông tin liên lạc</h2>
                        <p className="text-client-text mb-[20px]">Chúng tôi sẽ sử dụng email này để gửi cho bạn thông tin chi tiết và cập nhật về đơn hàng của bạn.</p>
                        <input type="email" placeholder="Địa chỉ Email" name="email" className="rounded-[40px] border border-[#D7D7D7] text-client-secondary py-[16px] px-[32px] w-full outline-none focus:border-client-primary transition-default" />
                        <p className="text-client-text mt-[10px] mb-[48px]">Bạn đang thanh toán với tư cách khách.</p>

                        {/* Địa chỉ thanh toán */}
                        <h2 className="text-[2.5rem] font-secondary my-[8px]">Địa chỉ thanh toán</h2>
                        <p className="text-client-text mt-[10px] mb-[40px]">Nhập địa chỉ thanh toán phù hợp với phương thức thanh toán của bạn.</p>
                        <input type="text" placeholder="Họ và tên" name="fullname" className="mb-[20px] rounded-[40px] border border-[#D7D7D7] text-client-secondary py-[16px] px-[32px] w-full outline-none focus:border-client-primary transition-default" />
                        <input type="text" placeholder="Địa chỉ" name="address" className="mb-[20px] rounded-[40px] border border-[#D7D7D7] text-client-secondary py-[16px] px-[32px] w-full outline-none focus:border-client-primary transition-default" />
                        <input type="text" placeholder="Số điện thoại" name="phone" className="rounded-[40px] border border-[#D7D7D7] text-client-secondary py-[16px] px-[32px] w-full outline-none focus:border-client-primary transition-default" />

                        {/* Phương thức thanh toán */}
                        <h2 className="text-[2.5rem] font-secondary my-[8px] mt-[48px]">Phương thức thanh toán</h2>
                        <div className="py-[15px] pl-[50px] pr-[20px] border border-[#D7D7D7] rounded-[10px] mb-[48px]">
                            <div className="p-[16px] text-client-text font-[500]">Thanh toán khi nhận hàng</div>
                        </div>
                        <div className="checkbox mb-[48px] cursor-pointer">
                            <input type="checkbox" id="orderNotesCheckbox" hidden checked={showOrderNotes} onChange={() => setShowOrderNotes(!showOrderNotes)} />
                            <label htmlFor="orderNotesCheckbox" className="text-client-text pl-[12px] ml-[-12px]">Thêm ghi chú vào đơn hàng của bạn</label>
                            {showOrderNotes && (
                                <div className="mb-[48px] mt-[30px] transition-all duration-300 ease-in-out">
                                    <textarea
                                        placeholder="Ghi chú về đơn hàng, ví dụ: thời gian giao hàng mong muốn, hướng dẫn đặc biệt cho shipper..."
                                        name="order_notes"
                                        rows={4}
                                        className="rounded-[40px] border border-[#D7D7D7] text-client-secondary py-[16px] px-[32px] w-full outline-none focus:border-client-primary transition-default resize-none"
                                    />
                                </div>
                            )}
                        </div>
                        {/* Hành động */}
                        <div className="pt-[48px] mb-[68px] border-t border-[#D7D7D7] text-client-text">
                            Bằng cách tiếp tục mua hàng, bạn đồng ý với Điều khoản và Điều kiện và Chính sách Bảo mật của chúng tôi
                        </div>
                        <div className="flex items-center justify-between">
                            <Link to="/gio-hang" className="flex items-center text-client-secondary font-secondary hover:text-client-primary transition-default">
                                <ArrowLeft className="text-[1rem] mr-[10px]" />
                                <span className="text-[1.6rem] font-secondary ">Trở lại giỏ hàng</span>
                            </Link>
                            <button onClick={handlePlaceOrder} className="py-[16px] px-[30px] cursor-pointer rounded-[50px] bg-client-primary hover:bg-client-secondary text-white font-[600] font-secondary transition-default">Đặt hàng</button>
                        </div>
                    </form>
                    <div className="flex-1 ml-[50px]">
                        <div className="sticky top-[0px] min-h-[100px] bg-white rounded-[20px] border border-[#D7D7D7]">
                            <p className="text-client-text font-[700] mb-[36px] px-[16px] py-[16px]">Tóm tắt đơn hàng</p>
                            <ul>
                                {items.map((item) => (
                                    <li key={item.id} className="flex mb-[30px] pb-[30px] border-b border-[#D7D7D7] px-[16px]">
                                        {/* Hình ảnh */}
                                        <div className="relative">
                                            <img src="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-2b-1000x1048.jpg" alt="" className="rounded-[10px] w-[80px] h-[83px] object-cover" />
                                            <div className="absolute top-0 right-0 translate-y-[-50%] translate-x-[50%] shadow-[0_0_0_2px_#fff] aspect-square bg-white w-[25px] px-[0.64rem] rounded-full border border-client-primary flex items-center justify-center text-[#000] min-h-[20px] min-w-[20px]">
                                                {item.quantity}
                                            </div>
                                        </div>
                                        {/* Nội dung */}
                                        <div className="pl-[24px] pr-[12px]">
                                            <div className="text-[1.4rem] font-secondary mb-[8px]">{item.title}</div>
                                            <p className="text-client-text mb-[8px]">{item.option.price.toLocaleString()}đ</p>
                                            <div className="text-client-text text-[1.4rem]"><span className="font-secondary text-client-secondary">Kích cỡ:</span> {item.option.size}</div>
                                        </div>
                                        {/* Tổng giá */}
                                        <div className="text-client-secondary ml-auto">
                                            {(item.option.price * item.quantity).toLocaleString()}đ
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <div className="p-[20px] mb-[20px] pt-0 flex justify-between border-b border-[#D7D7D7]">
                                <div className="text-client-secondary">Tạm tính</div>
                                <div>{totalAmount.toLocaleString()}đ</div>
                            </div>
                            <div className="p-[20px] pt-0 flex justify-between">
                                <div className="text-client-secondary">Tổng cộng</div>
                                <div>{totalAmount.toLocaleString()}đ</div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="app-container p-[48px] text-center pb-[100px]">
                    <ShoppingCartOutlinedIcon style={{
                        fontSize: "2rem",
                        color: "#505050"
                    }} />
                    <div className="text-client-text font-[700] mt-[16px]">Giỏ hàng của bạn hiện đang trống!</div>
                    <p className="mt-[5px] mb-[40px] text-client-text">Không thể thanh toán khi giỏ hàng của bạn trống - vui lòng xem qua cửa hàng của chúng tôi và quay lại khi bạn đã sẵn sàng đặt hàng.</p>
                    <Link to="/cua-hang" className="w-[170px] h-[190px] items-center justify-center inline-flex bg-client-primary hover:bg-client-secondary transition-default text-white px-[30px] py-[16px] rounded-[9999px]">
                        Xem cửa hàng
                    </Link>
                </div>
            )}
            <FooterSub />
        </>
    )
}