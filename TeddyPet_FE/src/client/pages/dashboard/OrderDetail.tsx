import { useState, useEffect } from "react";
import { ProductBanner } from "../product/sections/ProductBanner";
import { Sidebar } from "./sections/Sidebar";
import { useParams, Link } from "react-router-dom";
import { MessageText, Star, Xmark, NavArrowRight, MediaImage, CheckCircle } from "iconoir-react";
import { getMyOrderById, confirmReceived } from "../../../api/order.api";
import { OrderResponse } from "../../../types/order.type";
import { toast } from "react-toastify";
import { format } from "date-fns";

export const OrderDetailPage = () => {
    const { id } = useParams();
    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!id) return;
            try {
                const response = await getMyOrderById(id);
                if (response.data) {
                    setOrder(response.data);
                } else {
                    toast.error(response.message || "Không tìm thấy đơn hàng");
                }
            } catch (error) {
                console.error("Error fetching order:", error);
                toast.error("Lỗi khi tải thông tin đơn hàng");
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id]);

    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Tài khoản", to: "/dashboard/profile" },
        { label: `Chi tiết đơn hàng`, to: `/dashboard/order/detail/${id}` },
    ];

    const handleConfirmReceived = async () => {
        if (!id || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await confirmReceived(id);
            toast.success("Xác nhận đã nhận hàng thành công!");
            // Refresh data
            const response = await getMyOrderById(id);
            if (response.data) {
                setOrder(response.data);
            }
        } catch (error) {
            console.error("Error confirming receipt:", error);
            toast.error("Có lỗi xảy ra khi xác nhận. Vui lòng thử lại sau.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-client-primary"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <h2 className="text-2xl font-semibold">Không tìm thấy đơn hàng</h2>
                <Link to="/dashboard/orders" className="text-client-primary hover:underline">Về danh sách đơn hàng</Link>
            </div>
        );
    }

    return (
        <>
            <ProductBanner
                pageTitle={`Chi tiết đơn hàng`}
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
                        <div className="flex justify-between items-center mb-[25px]">
                            <h3 className="text-[2.4rem] font-[600] text-client-secondary">
                                Chi tiết đơn hàng
                            </h3>
                            <Link className="relative overflow-hidden group bg-client-primary rounded-[8px] px-[25px] py-[15px] font-[500] text-[1.4rem] text-white flex items-center gap-[8px] cursor-pointer" to={"/dashboard/orders"}>
                                <span className="relative z-10">Trở lại</span>
                                <div className="absolute top-0 left-0 w-full h-full bg-client-secondary transition-transform duration-500 ease-in-out transform scale-x-0 origin-left group-hover:scale-x-100"></div>
                            </Link>
                        </div>

                        <div className="">
                            <div className="border border-[#eee] rounded-[12px] w-full">
                                <div className="flex justify-between items-center p-[30px] mb-[40px]">
                                    <div className="flex items-center gap-[15px]">
                                        <img src="https://i.imgur.com/V2kwkkK.png" alt="" className="w-[150px]" />
                                    </div>
                                    <div className="">
                                        <h2 className="uppercase text-[2.2rem] text-client-secondary font-[700] mb-[15px]">Hóa đơn</h2>
                                        <p className="text-[#7d7b7b] text-[1.5rem] mb-[5px]">Mã đơn hàng: #{order.orderCode}</p>
                                        <p className="text-[#7d7b7b] text-[1.5rem] mb-[20px]">Ngày: {format(new Date(order.createdAt), "dd-MM-yyyy")}</p>
                                        <div className="flex flex-wrap gap-[10px]">
                                            <Link to={`/tracking?code=${order.orderCode}`} className="bg-client-primary hover:bg-client-secondary transition-default text-white font-[600] text-[1.4rem] py-[15px] px-[25px] rounded-[6px] cursor-pointer">
                                                Theo dõi đơn hàng
                                            </Link>
                                            {(order.status === 'DELIVERING' || order.status === 'SHIPPED') && (
                                                <button
                                                    onClick={handleConfirmReceived}
                                                    disabled={isSubmitting}
                                                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 transition-default text-white font-[600] text-[1.4rem] py-[15px] px-[25px] rounded-[6px] cursor-pointer flex items-center gap-[10px]"
                                                >
                                                    <CheckCircle className="w-[1.8rem] h-[1.8rem]" />
                                                    {isSubmitting ? "Đang xử lý..." : "Đã nhận được hàng"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {(order.status === 'DELIVERING') && (
                                    <div className="mx-[30px] mb-[30px] p-[20px] bg-blue-50 border border-blue-200 rounded-[12px] flex items-center gap-[15px]">
                                        <div className="w-[40px] h-[40px] bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                            <NavArrowRight className="text-white w-[2.4rem] h-[2.4rem]" />
                                        </div>
                                        <div>
                                            <p className="text-blue-800 font-[600] text-[1.6rem]">Đang giao hàng</p>
                                            <p className="text-blue-600 text-[1.4rem]">Shipper đang trên đường giao hàng. Vui lòng chú ý địa chỉ và số điện thoại để nhận hàng nhé!</p>
                                        </div>
                                    </div>
                                )}

                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#F9F9F9] border-y border-[#eee]">
                                            <th className="py-[15px] px-[20px] text-[1.6rem] font-[600] text-client-secondary border-r border-[#eee]">Tên sản phẩm</th>
                                            <th className="py-[15px] px-[20px] text-[1.6rem] font-[600] text-client-secondary border-r border-[#eee]">Giá</th>
                                            <th className="py-[15px] px-[20px] text-[1.6rem] font-[600] text-client-secondary border-r border-[#eee] text-center">Số lượng</th>
                                            <th className="py-[15px] px-[20px] text-[1.6rem] font-[600] text-client-secondary">Tổng cộng</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#eee] border-b border-[#eee]">
                                        {order.orderItems.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="py-[15px] px-[20px] text-[1.5rem] text-[#7d7b7b] border-r border-[#eee]">
                                                    <div className="flex items-center gap-[15px]">
                                                        <img src={item.imageUrl} alt={item.productName} className="w-[60px] h-[60px] object-cover rounded-[8px] border border-[#eee]" />
                                                        <span className="underline cursor-pointer hover:text-client-primary transition-colors">
                                                            {item.productName} - {item.variantName}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-[15px] px-[20px] text-[1.5rem] text-[#7d7b7b] border-r border-[#eee]">
                                                    {item.unitPrice.toLocaleString('vi-VN')}đ
                                                </td>
                                                <td className="py-[15px] px-[20px] text-[1.5rem] text-[#7d7b7b] border-r border-[#eee] text-center">
                                                    {item.quantity < 10 ? `0${item.quantity}` : item.quantity}
                                                </td>
                                                <td className="py-[15px] px-[20px] text-[1.5rem] text-[#7d7b7b]">
                                                    <div className="flex items-center justify-between">
                                                        <span>{(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ</span>
                                                        {order.status === 'DELIVERED' && (
                                                            <button
                                                                onClick={() => setIsModalOpen(true)}
                                                                className="flex items-center gap-[5px] transition-colors font-[500] group cursor-pointer"
                                                            >
                                                                <MessageText className="w-[1.6rem] h-[1.6rem] text-client-primary" />
                                                                <span className="text-client-secondary group-hover:text-client-primary transition-colors">Viết đánh giá</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="flex justify-between pt-[60px] px-[30px] pb-[30px]">
                                    <div>
                                        <h3 className="text-[1.8rem] font-[700] text-client-secondary mb-[15px]">Thông tin thanh toán</h3>
                                        <div className="space-y-[8px]">
                                            <p className="text-[1.5rem] text-[#7d7b7b] flex gap-[10px]"><span className="text-client-secondary font-[600] min-w-[70px]">Họ tên:</span> {order.shippingName}</p>
                                            <p className="text-[1.5rem] text-[#7d7b7b] flex gap-[10px]"><span className="text-client-secondary font-[600] min-w-[70px]">Địa chỉ:</span> {order.shippingAddress}</p>
                                            <p className="text-[1.5rem] text-[#7d7b7b] flex gap-[10px]"><span className="text-client-secondary font-[600] min-w-[70px]">SĐT:</span> {order.shippingPhone}</p>
                                        </div>
                                    </div>
                                    <div className="w-[300px] space-y-[10px]">
                                        <div className="flex justify-between text-[1.5rem]">
                                            <span className="text-client-secondary font-[600]">Tạm tính:</span>
                                            <span className="text-[#7d7b7b]">{order.subtotal.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                        <div className="flex justify-between text-[1.5rem]">
                                            <span className="text-client-secondary font-[600]">Phí vận chuyển:</span>
                                            <span className="text-[#7d7b7b]">{order.shippingFee.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                        {order.discountAmount > 0 && (
                                            <div className="flex justify-between text-[1.5rem]">
                                                <span className="text-client-secondary font-[600]">Giảm giá:</span>
                                                <span className="text-red-500">-{order.discountAmount.toLocaleString('vi-VN')}đ</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-[1.8rem] pt-[10px] border-t border-[#eee]">
                                            <span className="text-client-secondary font-[700]">Tổng cộng:</span>
                                            <span className="text-client-primary font-[700]">{order.finalAmount.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Review Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-[20px] bg-black/50 backdrop-blur-[2px]">
                    <div className="bg-white w-full max-w-[800px] rounded-[15px] shadow-[0px_20px_60px_rgba(0,0,0,0.15)] relative overflow-visible flex flex-col items-center">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute -top-[15px] -right-[15px] w-[30px] h-[30px] bg-[#E1554E] text-white flex items-center justify-center rounded-[4px] hover:bg-[#c94b45] transition-colors shadow-lg z-10 cursor-pointer"
                        >
                            <Xmark strokeWidth={3} className="w-[1.8rem] h-[1.8rem]" />
                        </button>

                        <div className="w-full p-[40px]">
                            <h2 className="text-[2.8rem] font-[700] text-[#333] mb-[25px]">Đánh giá sản phẩm</h2>
                            <div className="flex items-center gap-[15px] mb-[30px]">
                                <span className="text-[1.6rem] text-[#777] font-[500]">Đánh giá của bạn:</span>
                                <div className="flex gap-[5px]">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            className="transition-transform active:scale-90 cursor-pointer"
                                        >
                                            <Star
                                                className={`w-[2.2rem] h-[2.2rem] ${star <= rating ? "fill-orange-400 text-orange-400" : "text-gray-300"}`}
                                                strokeWidth={2}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="relative mb-[30px]">
                                <textarea
                                    placeholder="Viết đánh giá của bạn tại đây"
                                    className="w-full h-[200px] p-[20px] border border-[#ddd] rounded-[8px] text-[1.5rem] text-[#333] outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="mb-[40px]">
                                <div className="w-[70px] h-[70px] border-[2px] border-dashed border-[#ddd] rounded-[8px] flex items-center justify-center text-[#999] cursor-pointer hover:border-client-primary hover:text-client-primary transition-all">
                                    <MediaImage className="w-[2.4rem] h-[2.4rem]" strokeWidth={1.5} />
                                </div>
                            </div>

                            <button className="relative overflow-hidden group bg-client-primary rounded-[8px] px-[25px] py-[15px] font-[600] text-[1.6rem] text-white flex items-center gap-[10px] cursor-pointer transition-all">
                                <span className="relative z-10">Gửi đánh giá</span>
                                <NavArrowRight strokeWidth={3} className="relative z-10 w-[1.8rem] h-[1.8rem] transition-transform duration-300 rotate-[-45deg] group-hover:rotate-0" />
                                <div className="absolute top-0 left-0 w-full h-full bg-client-secondary transition-transform duration-500 ease-in-out transform scale-x-0 origin-left group-hover:scale-x-100"></div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
