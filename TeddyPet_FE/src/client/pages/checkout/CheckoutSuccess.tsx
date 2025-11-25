import { FooterSub } from "../../components/layouts/FooterSub";
import { ProductBanner } from "../product/sections/ProductBanner"
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneEnabledOutlinedIcon from '@mui/icons-material/PhoneEnabledOutlined';
import EditLocationAltOutlinedIcon from '@mui/icons-material/EditLocationAltOutlined';

const breadcrumbs = [
    { label: "Trang chủ", to: "/" },
    { label: "Thanh toán", to: "/thanh-toan" },
];

export const CheckSuccessPage = () => {
    return (
        <>
            <ProductBanner
                pageTitle="Thanh toán"
                breadcrumbs={breadcrumbs}
                url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-listing.jpg"
                className="bg-top"
            />
            <div className="app-container pb-[150px] 2xl:pb-[100px] relative">
                <div className="border-l-[5px] w-full mb-[30px] border-l-[#3db44c] bg-white px-[30px] py-[20px] text-client-text shadow-[0_0_3px_#10293726]">Cảm ơn bạn. Đơn hàng của bạn đã được nhận.</div>
                <div className="mb-[48px] grid grid-cols-4 border border-[#10293726] p-[25px]">
                    <div className="text-[1.4rem] text-client-text text-center border-r border-dashed border-[#cfc8d8] px-[12px] my-[10px]">
                        <div className="">Số đơn hàng:</div>
                        <div className="mt-[8px] font-bold">2262</div>
                    </div>
                    <div className="text-[1.4rem] text-client-text text-center border-r border-dashed border-[#cfc8d8] px-[12px] my-[10px]">
                        <div className="">Ngày:</div>
                        <div className="mt-[8px] font-bold">26/10/2025</div>
                    </div>
                    <div className="text-[1.4rem] text-client-text text-center border-r border-dashed border-[#cfc8d8] px-[12px] my-[10px]">
                        <div className="">Tổng cộng:</div>
                        <div className="mt-[8px] font-bold">209.000đ</div>
                    </div>
                    <div className="text-[1.4rem] text-client-text text-center px-[12px] my-[10px]">
                        <div className="">Phương thức thanh toán:</div>
                        <div className="mt-[8px] font-bold">Thanh toán khi nhận hàng</div>
                    </div>
                </div>
                <div className="mb-[50px]">
                    <p className="text-client-text mb-[12px]">Thanh toán bằng tiền mặt khi nhận hàng.</p>
                    <section className="border-[2px] border-[#10293726] mb-[50px] p-[60px]">
                        <h2 className="text-[1.8rem] text-client-secondary font-secondary mb-[20px]">Chi tiết đơn hàng</h2>
                        <table className="w-full">
                            <thead className="w-full">
                                <tr>
                                    <th className="w-[66%] text-left py-[20px] border-b border-[#d7d7d7]">Sản phẩm:</th>
                                    <th className="w-[34%] text-right py-[20px] border-b border-[#d7d7d7]">Tổng</th>
                                </tr>
                            </thead>
                            <tbody className="w-full">
                                <tr>
                                    <td className="w-[66%] text-left py-[20px] border-b border-[#d7d7d7] font-[600]">Thẻ tên thú cưng - Nhỏ x 2</td>
                                    <td className="w-[34%] text-right py-[20px] border-b border-[#d7d7d7]">136.000đ</td>
                                </tr>
                                <tr>
                                    <td className="w-[66%] text-left py-[20px] border-b border-[#d7d7d7] font-[600]">Thẻ tên thú cưng - Lớn x 1</td>
                                    <td className="w-[34%] text-right py-[20px] border-b border-[#d7d7d7]">73.000đ</td>
                                </tr>
                            </tbody>
                            <tfoot className="w-full">
                                <tr>
                                    <td className="w-[66%] text-left py-[20px] border-b border-[#d7d7d7] font-[600]">Tạm tính:</td>
                                    <td className="w-[34%] text-right py-[20px] border-b border-[#d7d7d7]">209.000đ</td>
                                </tr>
                                <tr>
                                    <td className="w-[66%] text-left py-[20px] border-b border-[#d7d7d7] font-[600]">Tổng cộng:</td>
                                    <td className="w-[34%] text-right py-[20px] border-b border-[#d7d7d7]">209.000đ</td>
                                </tr>
                                <tr>
                                    <td className="w-[66%] text-left py-[20px] font-[600]">Phương thức thanh toán:</td>
                                    <td className="w-[34%] text-right py-[20px]">Thanh toán khi nhận hàng</td>
                                </tr>
                            </tfoot>
                        </table>
                    </section>
                    <section className="border-[2px] border-dashed border-[#10293726] p-[20px]">
                        <h2 className="text-[1.8rem] font-secondary mb-[20px]">Địa chỉ thanh toán</h2>
                        <div className="text-client-text flex flex-col gap-[10px]">
                            <div className="flex items-center">
                                <EmailOutlinedIcon style={{
                                    fontSize: "2rem"
                                }} />
                                <p className="ml-[10px]">buianh09dung@gmail.com</p>
                            </div>
                            <div className="flex items-center">
                                <PhoneEnabledOutlinedIcon style={{
                                    fontSize: "2rem"
                                }} />
                                <p className="ml-[10px]">0346587796</p>
                            </div>
                            <div className="flex items-center">
                                <EditLocationAltOutlinedIcon style={{
                                    fontSize: "2rem"
                                }} />
                                <p className="ml-[10px]">12 Phạm Văn Đồng, Phường Tân, Sơn Hoà</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
            <FooterSub />
        </>
    )
}