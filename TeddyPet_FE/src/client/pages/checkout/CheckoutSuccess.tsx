import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Cookies from "js-cookie";
import { FooterSub } from "../../components/layouts/FooterSub";
import { ProductBanner } from "../product/sections/ProductBanner";
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneEnabledOutlinedIcon from '@mui/icons-material/PhoneEnabledOutlined';
import EditLocationAltOutlinedIcon from '@mui/icons-material/EditLocationAltOutlined';
import { getMyOrderByCode, lookupGuestOrder } from "../../../api/order.api";
import { OrderResponse } from "../../../types/order.type";
import { toast } from "react-toastify";

const breadcrumbs = [
    { label: "Trang chủ", to: "/" },
    { label: "Thanh toán", to: "/checkout" },
    { label: "Thanh toán thành công", to: "#" },
];

export const CheckSuccessPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const orderCode = searchParams.get("orderCode");
    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (orderCode) {
            fetchOrderDetails();
        }
    }, [orderCode]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const email = searchParams.get("email");
            let response;

            if (email) {
                // Tra cứu cho khách vãng lai
                response = await lookupGuestOrder(orderCode!, email);
            } else {
                // Tra cứu cho user đã đăng nhập
                response = await getMyOrderByCode(orderCode!);
            }

            if (response.success) {
                setOrder(response.data);
                // Clean up URL parameters only if email is present (guest checkout)
                // We keep orderCode for potential refresh but hide email
                if (email) {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete("email");
                    setSearchParams(newParams, { replace: true });
                }
            } else {
                toast.error(response.message || "Không thể tải thông tin đơn hàng");
            }
        } catch (error: any) {
            console.error("Lỗi lấy chi tiết đơn hàng:", error);
            // Nếu là khách vãng lai thì getMyOrderByCode có thể fail do chưa login
            toast.error("Không thể tải thông tin đơn hàng. Vui lòng kiểm tra lại mã đơn.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-client-primary"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <h2 className="text-[2.4rem] font-bold text-client-secondary">Không tìm thấy đơn hàng</h2>
                <Link to="/" className="text-client-primary hover:underline text-[1.6rem]">Quay lại trang chủ</Link>
            </div>
        );
    }

    return (
        <>
            <ProductBanner
                pageTitle="Đặt hàng thành công"
                breadcrumbs={breadcrumbs}
                url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-listing.jpg"
                className="bg-top"
            />
            <div className="app-container pb-[150px] 2xl:pb-[100px] relative mt-[50px]">
                <div className="border-l-[5px] w-full mb-[30px] border-l-[#3db44c] bg-white px-[30px] py-[20px] text-client-text shadow-[0_0_3px_#10293726] text-[1.6rem]">
                    Cảm ơn bạn. Đơn hàng của bạn đã được nhận.
                </div>

                <div className="mb-[48px] grid grid-cols-4 border border-[#10293726] p-[25px] bg-white rounded-[8px]">
                    <div className="text-[1.4rem] text-client-text text-center border-r border-dashed border-[#cfc8d8] px-[12px] my-[10px]">
                        <div className="text-gray-500 mb-1">Số đơn hàng:</div>
                        <div className="text-[1.8rem] font-bold text-client-secondary">{order.orderCode}</div>
                    </div>
                    <div className="text-[1.4rem] text-client-text text-center border-r border-dashed border-[#cfc8d8] px-[12px] my-[10px]">
                        <div className="text-gray-500 mb-1">Ngày:</div>
                        <div className="text-[1.8rem] font-bold text-client-secondary">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '---'}
                        </div>
                    </div>
                    <div className="text-[1.4rem] text-client-text text-center border-r border-dashed border-[#cfc8d8] px-[12px] my-[10px]">
                        <div className="text-gray-500 mb-1">Tổng cộng:</div>
                        <div className="text-[1.8rem] font-bold text-client-primary">
                            {(order.finalAmount || 0).toLocaleString()}đ
                        </div>
                    </div>
                    <div className="text-[1.4rem] text-client-text text-center px-[12px] my-[10px]">
                        <div className="text-gray-500 mb-1">Thanh toán:</div>
                        <div className="text-[1.8rem] font-bold text-client-secondary">
                            {order.payments?.[0]?.paymentMethod === 'CASH' ? 'Tiền mặt' : order.payments?.[0]?.paymentMethod || 'Chưa xác định'}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-[40px] mb-[50px]">
                    <div className="lg:col-span-2">
                        <section className="bg-white border-[1px] border-[#eee] rounded-[12px] overflow-hidden shadow-sm">
                            <div className="bg-gray-50 px-[30px] py-[20px] border-b border-[#eee]">
                                <h2 className="text-[2rem] text-client-secondary font-bold">Chi tiết đơn hàng</h2>
                            </div>
                            <div className="p-[30px]">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-[1.6rem] text-gray-500 border-b border-[#eee]">
                                            <th className="text-left py-[15px] font-medium">Sản phẩm</th>
                                            <th className="text-right py-[15px] font-medium">Tổng</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[1.5rem]">
                                        {order.orderItems?.map((item, index) => (
                                            <tr key={index} className="border-b border-[#f9f9f9] last:border-none">
                                                <td className="py-[20px]">
                                                    <div className="flex items-center gap-[15px]">
                                                        {item.imageUrl && (
                                                            <img src={item.imageUrl} alt={item.productName} className="w-[60px] h-[60px] object-cover rounded-[8px]" />
                                                        )}
                                                        <div>
                                                            <div className="font-bold text-client-secondary">{item.productName} ({item.variantName})</div>
                                                            <div className="text-gray-400 mt-1">x {item.quantity}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-right font-bold text-client-secondary">
                                                    {(item.totalPrice || 0).toLocaleString()}đ
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="text-[1.6rem]">
                                        <tr>
                                            <td className="text-left py-[15px] border-t border-[#eee] text-gray-500">Tạm tính:</td>
                                            <td className="text-right py-[15px] border-t border-[#eee] font-bold text-client-secondary">{(order.subtotal || 0).toLocaleString()}đ</td>
                                        </tr>
                                        {(order.discountAmount || 0) > 0 && (
                                            <tr>
                                                <td className="text-left py-[15px] text-gray-500">Giảm giá:</td>
                                                <td className="text-right py-[15px] font-bold text-red-500">-{(order.discountAmount || 0).toLocaleString()}đ</td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td className="text-left py-[15px] text-gray-500">Phí vận chuyển:</td>
                                            <td className="text-right py-[15px] font-bold text-client-secondary">
                                                {order.shippingFee && order.shippingFee > 0 ? `${order.shippingFee.toLocaleString()}đ` : 'Liên hệ sau'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-left py-[20px] border-t border-[#eee] text-[1.8rem] font-bold text-client-secondary">Tổng cộng:</td>
                                            <td className="text-right py-[20px] border-t border-[#eee] text-[2.2rem] font-bold text-client-primary">{(order.finalAmount || 0).toLocaleString()}đ</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </section>
                    </div>

                    <div className="lg:col-span-1">
                        <section className="bg-white border-[1px] border-[#eee] rounded-[12px] p-[30px] shadow-sm flex flex-col gap-6">
                            <h2 className="text-[2rem] font-bold text-client-secondary border-b border-[#eee] pb-[15px]">Thông tin nhận hàng</h2>
                            <div className="space-y-6">
                                <div className="flex items-start gap-[15px]">
                                    <div className="w-[40px] h-[40px] bg-client-primary/10 rounded-full flex items-center justify-center shrink-0">
                                        <EmailOutlinedIcon className="text-client-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[1.4rem] text-gray-400">Người nhận</span>
                                        <p className="text-[1.6rem] font-bold text-client-secondary">{order.shippingName}</p>
                                        <p className="text-[1.4rem] text-gray-500">{order.user?.email || order.guestEmail}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-[15px]">
                                    <div className="w-[40px] h-[40px] bg-client-primary/10 rounded-full flex items-center justify-center shrink-0">
                                        <PhoneEnabledOutlinedIcon className="text-client-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[1.4rem] text-gray-400">Số điện thoại</span>
                                        <p className="text-[1.6rem] font-bold text-client-secondary">{order.shippingPhone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-[15px]">
                                    <div className="w-[40px] h-[40px] bg-client-primary/10 rounded-full flex items-center justify-center shrink-0">
                                        <EditLocationAltOutlinedIcon className="text-client-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[1.4rem] text-gray-400">Địa chỉ giao hàng</span>
                                        <p className="text-[1.6rem] font-bold text-client-secondary leading-relaxed">{order.shippingAddress}</p>
                                    </div>
                                </div>
                                {order.notes && (
                                    <div className="bg-yellow-50 p-[15px] rounded-[8px] border-l-4 border-yellow-400">
                                        <span className="text-[1.4rem] font-bold text-yellow-800">Ghi chú:</span>
                                        <p className="text-[1.4rem] text-yellow-700 mt-1 italic">"{order.notes}"</p>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 pt-6 border-t border-[#eee]">
                                <button
                                    onClick={() => {
                                        if (Cookies.get("token")) {
                                            navigate(`/dashboard/orders/${order.id}`);
                                        } else {
                                            const emailParam = order.guestEmail || (order.user?.email ? order.user.email : "");
                                            navigate(`/tra-cuu-don-hang?code=${order.orderCode}${emailParam ? `&email=${emailParam}` : ''}`);
                                        }
                                    }}
                                    className="w-full py-[15px] bg-client-secondary hover:bg-client-primary text-white text-center rounded-[8px] font-bold text-[1.4rem] transition-all block"
                                >
                                    {Cookies.get("token") ? "VỀ ĐƠN HÀNG CỦA TÔI" : "TRA CỨU ĐƠN HÀNG"}
                                </button>
                                <Link to="/shop" className="w-full mt-3 text-center text-client-primary font-bold text-[1.4rem] hover:underline block">
                                    TIẾP TỤC MUA SẮM
                                </Link>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
            <FooterSub />
        </>
    );
};