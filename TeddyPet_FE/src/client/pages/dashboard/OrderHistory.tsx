import { ProductBanner } from "../product/sections/ProductBanner";
import { Link } from "react-router-dom";
import { Sidebar } from "./sections/Sidebar";

export const OrderHistoryPage = () => {
    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Tài khoản", to: "/dashboard/profile" },
        { label: "Lịch sử đơn hàng", to: "/dashboard/orders" },
    ];

    const orders = [
        { id: "#75HJFDYD4", date: "July 16, 2023", status: "Hoàn thành", amount: "200.000đ", statusColor: "text-[#05A845]" },
        { id: "#75HJF6WER", date: "June 23, 2023", status: "Đang xử lý", amount: "60.000đ", statusColor: "text-[#007BFF]" },
        { id: "#75HJF457G", date: "Aug 18, 2023", status: "Hoàn thành", amount: "180.000đ", statusColor: "text-[#05A845]" },
        { id: "#75HJF5FKI", date: "June 22, 2023", status: "Hoàn thành", amount: "140.000đ", statusColor: "text-[#05A845]" },
        { id: "#75HJF47O7", date: "Jan 12, 2023", status: "Đã hủy", amount: "80.000đ", statusColor: "text-[#ff0000]" },
        { id: "#75HJF458Y", date: "May 14, 2023", status: "Đã hủy", amount: "240.000đ", statusColor: "text-[#ff0000]" },
        { id: "#75HJFKJGT3", date: "June 23, 2023", status: "Đang xử lý", amount: "200.000đ", statusColor: "text-[#007BFF]" },
        { id: "#75HJFKK92", date: "April 10, 2023", status: "Hoàn thành", amount: "320.000đ", statusColor: "text-[#05A845]" },
        { id: "#75HJFLL11", date: "March 05, 2023", status: "Hoàn thành", amount: "150.000đ", statusColor: "text-[#05A845]" },
        { id: "#75HJFMM44", date: "Feb 18, 2023", status: "Hoàn thành", amount: "90.000đ", statusColor: "text-[#05A845]" },
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
                                    {orders.map((order, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-[20px] text-[1.5rem] text-[#7d7b7b]">{order.id}</td>
                                            <td className="p-[20px] text-[1.5rem] text-[#7d7b7b]">{order.date}</td>
                                            <td className={`p-[20px] text-[1.5rem] font-[500] ${order.statusColor}`}>{order.status}</td>
                                            <td className="p-[20px] text-[1.5rem] text-[#7d7b7b] font-[500]">{order.amount}</td>
                                            <td className="p-[20px]">
                                                <div className="flex flex-col gap-[8px]">
                                                    <Link
                                                        to={`/dashboard/order/invoice/${order.id.replace('#', '')}`}
                                                        className="flex items-center gap-[6px] text-[1.4rem] text-[#7d7b7b] hover:text-client-primary transition-default"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-[1.8rem] h-[1.8rem]">
                                                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.644C3.412 8.1 7.288 5 12 5c4.711 0 8.58 3.1 9.964 6.678a1.012 1.012 0 0 1 0 .644C20.58 15.9 16.711 19 12 19c-4.712 0-8.58-3.1-9.964-6.678Z" />
                                                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                        </svg>
                                                        Xem
                                                    </Link>
                                                    {order.status === "Hoàn thành" && (
                                                        <Link
                                                            to={`/dashboard/order/detail/${order.id.replace('#', '')}`}
                                                            className="flex items-center gap-[6px] text-[1.4rem] text-[#7d7b7b] hover:text-client-primary transition-default"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-[1.8rem] h-[1.8rem]">
                                                                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                                                            </svg>
                                                            Đánh giá
                                                        </Link>
                                                    )}
                                                    {order.status === "Đang xử lý" && (
                                                        <button className="flex items-center gap-[6px] text-[1.4rem] text-[#7d7b7b] hover:text-[#ff0000] transition-default">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-[1.8rem] h-[1.8rem]">
                                                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                            </svg>
                                                            Hủy đơn
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
