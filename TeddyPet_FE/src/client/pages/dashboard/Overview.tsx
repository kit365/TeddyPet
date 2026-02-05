import StarIcon from "@mui/icons-material/Star";
import { ProductBanner } from "../product/sections/ProductBanner";
import { Sidebar } from "./sections/Sidebar";
import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useOrders } from "../../hooks/useOrders";

export const OverviewPage = () => {
    const { orders } = useOrders();
    const recentOrders = orders.slice(0, 5);

    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Tài khoản", to: "/dashboard/profile" },
        { label: "Tổng quan", to: "/dashboard/overview" },
    ];

    const recentReviews = [
        { title: "Denim 2 Quarter Pant", date: "05 January 2025", rating: 5, content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Delectus exercitationem accusantium obcaecati quos voluptate..." },
        { title: "Half Sleeve Tops For Women", date: "03 April 2025", rating: 4, content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Delectus exercitationem accusantium obcaecati quos..." },
        { title: "Cherry Fabric Western Tops", date: "10 March 2025", rating: 5, content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Delectus exercitationem accusantium obcaecati quos voluptate..." },
    ];

    const stats = {
        total: orders.length,
        completed: orders.filter(o => o.status === 'COMPLETED').length,
        pending: orders.filter(o => o.status === 'PENDING').length,
        cancelled: orders.filter(o => o.status === 'CANCELLED').length,
    };

    return (
        <>
            <ProductBanner
                pageTitle="Tổng quan"
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
                        <div className="grid grid-cols-3">
                            <div className="px-[12px]">
                                <div className="bg-[#0aa84812] p-[20px] mb-[25px] rounded-[8px] ml-[25px] flex items-center">
                                    <div className="w-[75px] h-[75px] mr-[30px] bg-[#05A845] text-white rounded-[8px] flex items-center justify-center ml-[-40px]">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-[4rem]">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"></path>
                                        </svg>
                                    </div>
                                    <h3 className="text-[3.2rem] font-[600]">
                                        {stats.total}
                                        <span className="text-[#7d7b7b] font-[400] text-[1.6rem] block">Tổng đơn hàng</span>
                                    </h3>
                                </div>
                            </div>
                            <div className="px-[12px]">
                                <div className="bg-[#66aaee1f] p-[20px] mb-[25px] rounded-[8px] ml-[25px] flex items-center">
                                    <div className="w-[75px] h-[75px] mr-[30px] bg-[#6ae] text-white rounded-[8px] flex items-center justify-center ml-[-40px]">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-[4rem]">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"></path>
                                        </svg>
                                    </div>
                                    <h3 className="text-[3.2rem] font-[600]">
                                        {stats.completed}
                                        <span className="text-[#7d7b7b] font-[400] text-[1.6rem] block">Đơn hàng hoàn tất</span>
                                    </h3>
                                </div>
                            </div>
                            <div className="px-[12px]">
                                <div className="bg-[#ffa5001c] p-[20px] mb-[25px] rounded-[8px] ml-[25px] flex items-center">
                                    <div className="w-[75px] h-[75px] mr-[30px] bg-[#ffa500] text-white rounded-[8px] flex items-center justify-center ml-[-40px]">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-[4rem]">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"></path>
                                        </svg>
                                    </div>
                                    <h3 className="text-[3.2rem] font-[600]">
                                        {stats.pending}
                                        <span className="text-[#7d7b7b] font-[400] text-[1.6rem] block">Đơn hàng chờ xử lý</span>
                                    </h3>
                                </div>
                            </div>
                            <div className="px-[12px]">
                                <div className="bg-[#ff000012] p-[20px] mb-[25px] rounded-[8px] ml-[25px] flex items-center">
                                    <div className="w-[75px] h-[75px] mr-[30px] bg-[#DB4437] text-white rounded-[8px] flex items-center justify-center ml-[-40px]">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-[4rem]">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"></path>
                                        </svg>
                                    </div>
                                    <h3 className="text-[3.2rem] font-[600]">
                                        {stats.cancelled}
                                        <span className="text-[#7d7b7b] font-[400] text-[1.6rem] block">Đơn hàng đã hủy</span>
                                    </h3>
                                </div>
                            </div>
                        </div>

                        <div className="mt-[25px] flex">
                            <div className="w-[58.3%] px-[12px]">
                                <h3 className="text-[2.1rem] text-client-secondary font-[600] mb-[15px]">Đơn hàng gần đây</h3>
                                <div className="border border-[#eee] rounded-[12px] overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-[#F9F9F9] border-b border-[#eee]">
                                            <tr>
                                                <th className="p-[20px] text-[1.6rem] font-[600] text-client-secondary">Mã</th>
                                                <th className="p-[20px] text-[1.6rem] font-[600] text-client-secondary">Ngày</th>
                                                <th className="p-[20px] text-[1.6rem] font-[600] text-client-secondary">Trạng thái</th>
                                                <th className="p-[20px] text-[1.6rem] font-[600] text-client-secondary">Tổng</th>
                                                <th className="p-[20px] text-[1.6rem] font-[600] text-client-secondary">Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#eee]">
                                            {recentOrders.map((order) => (
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
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {recentOrders.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="p-[30px] text-center text-[#7d7b7b] text-[1.5rem]">Không có đơn hàng nào</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="flex-1 px-[12px]">
                                <h3 className="text-[2.1rem] text-client-secondary font-[600] mb-[15px]">Đánh giá gần đây</h3>
                                <div className="border border-[#eee] rounded-[12px] p-[20px] bg-white">
                                    <ul className="divide-y divide-[#eee]">
                                        {recentReviews.map((review, idx) => (
                                            <li key={idx} className={`${idx === 0 ? "pb-[20px]" : "py-[20px]"}`}>
                                                <div className="flex justify-between items-start mb-[5px]">
                                                    <h4 className="text-[1.7rem] font-[600] text-client-secondary">{review.title}</h4>
                                                    <div className="flex items-center gap-[2px]">
                                                        {[...Array(5)].map((_, i) => (
                                                            <StarIcon
                                                                key={i}
                                                                sx={{
                                                                    fontSize: "2rem !important",
                                                                    color: i < review.rating ? "#F9A61C !important" : "#ccc !important",
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-[1.3rem] text-client-secondary mb-[10px]">{review.date}</p>
                                                <p className="text-[#7d7b7b] text-[1.4rem] line-clamp-2 leading-relaxed">
                                                    {review.content}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
