import { ProductBanner } from "../product/sections/ProductBanner";
import { Link } from "react-router-dom";
import { Sidebar } from "./sections/Sidebar";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useOrders } from "../../hooks/useOrders";

export const OrderHistoryPage = () => {
    const { orders, loading } = useOrders();

    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Tài khoản", to: "/dashboard/profile" },
        { label: "Lịch sử đơn hàng", to: "/dashboard/orders" },
    ];

    return (
        <>
            <ProductBanner
                pageTitle="Lịch sử đơn hàng"
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
                            Lịch sử đơn hàng
                        </h3>

                        <div className="border border-[#eee] rounded-[12px] overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#F9F9F9] border-b border-[#eee]">
                                    <tr>
                                        <th className="p-[20px] text-[1.6rem] font-[600] text-client-secondary">Mã đơn hàng</th>
                                        <th className="p-[20px] text-[1.6rem] font-[600] text-client-secondary">Ngày</th>
                                        <th className="p-[20px] text-[1.6rem] font-[600] text-client-secondary">Trạng thái</th>
                                        <th className="p-[20px] text-[1.6rem] font-[600] text-client-secondary">Tổng</th>
                                        <th className="p-[20px] text-[1.6rem] font-[600] text-client-secondary">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#eee]">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="p-[40px] text-center text-[1.6rem] text-[#7d7b7b]">Đang tải dữ liệu...</td>
                                        </tr>
                                    ) : orders.length > 0 ? (
                                        orders.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-[20px] text-[1.5rem] text-client-secondary font-bold">#{order.orderCode}</td>
                                                <td className="p-[20px] text-[1.5rem] text-[#7d7b7b]">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</td>
                                                <td className="p-[20px]">
                                                    <StatusBadge status={order.status} />
                                                </td>
                                                <td className="p-[20px] text-[1.5rem] text-[#7d7b7b] font-[500]">{order.finalAmount.toLocaleString("vi-VN")}đ</td>
                                                <td className="p-[20px]">
                                                    <div className="flex flex-col gap-[8px]">
                                                        <Link
                                                            to={`/dashboard/order/detail/${order.id}`}
                                                            className="flex items-center gap-[6px] text-[1.4rem] text-[#7d7b7b] hover:text-client-primary transition-default"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-[1.8rem] h-[1.8rem]">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.644C3.412 8.1 7.288 5 12 5c4.711 0 8.58 3.1 9.964 6.678a1.012 1.012 0 0 1 0 .644C20.58 15.9 16.711 19 12 19c-4.712 0-8.58-3.1-9.964-6.678Z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                            </svg>
                                                            Xem chi tiết
                                                        </Link>
                                                        {order.status === "COMPLETED" && (
                                                            <Link
                                                                to={`/dashboard/order/detail/${order.id}`}
                                                                className="flex items-center gap-[6px] text-[1.4rem] text-[#7d7b7b] hover:text-client-primary transition-default"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-[1.8rem] h-[1.8rem]">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                                                                </svg>
                                                                Đánh giá
                                                            </Link>
                                                        )}
                                                        {order.status === "PENDING" && (
                                                            <button className="flex items-center gap-[6px] text-[1.4rem] text-[#7d7b7b] hover:text-[#ff0000] transition-default">
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-[1.8rem] h-[1.8rem]">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                                </svg>
                                                                Hủy đơn
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="p-[40px] text-center text-[1.6rem] text-[#7d7b7b]">Bạn chưa có đơn hàng nào.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
