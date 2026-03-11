import StarIcon from "@mui/icons-material/Star";
import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useOrders } from "../../hooks/useOrders";
import { DashboardLayout } from "./sections/DashboardLayout";

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
        <DashboardLayout pageTitle="Tổng quan" breadcrumbs={breadcrumbs}>
            <div className="grid grid-cols-4 gap-6 mb-12">
                <div className="bg-[#0aa84812] p-8 rounded-[2rem] flex items-center shadow-sm border border-emerald-50">
                    <div className="w-20 h-20 bg-[#05A845] text-white rounded-2xl flex items-center justify-center mr-6">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"></path>
                        </svg>
                    </div>
                    <div>
                        <span className="text-[3rem] font-bold text-slate-800 block leading-none">{stats.total}</span>
                        <span className="text-[#7d7b7b] font-medium text-[1.4rem] uppercase tracking-wider mt-1 block">Đơn hàng</span>
                    </div>
                </div>
                <div className="bg-[#66aaee1f] p-8 rounded-[2rem] flex items-center shadow-sm border border-blue-50">
                    <div className="w-20 h-20 bg-[#0088ff] text-white rounded-2xl flex items-center justify-center mr-6">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"></path>
                        </svg>
                    </div>
                    <div>
                        <span className="text-[3rem] font-bold text-slate-800 block leading-none">{stats.completed}</span>
                        <span className="text-[#7d7b7b] font-medium text-[1.4rem] uppercase tracking-wider mt-1 block">Hoàn tất</span>
                    </div>
                </div>
                <div className="bg-[#ffa5001c] p-8 rounded-[2rem] flex items-center shadow-sm border border-orange-50">
                    <div className="w-20 h-20 bg-[#ffa500] text-white rounded-2xl flex items-center justify-center mr-6">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"></path>
                        </svg>
                    </div>
                    <div>
                        <span className="text-[3rem] font-bold text-slate-800 block leading-none">{stats.pending}</span>
                        <span className="text-[#7d7b7b] font-medium text-[1.4rem] uppercase tracking-wider mt-1 block">Chờ xử lý</span>
                    </div>
                </div>
                <div className="bg-[#ff000012] p-8 rounded-[2rem] flex items-center shadow-sm border border-red-50">
                    <div className="w-20 h-20 bg-[#DB4437] text-white rounded-2xl flex items-center justify-center mr-6">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"></path>
                        </svg>
                    </div>
                    <div>
                        <span className="text-[3rem] font-bold text-slate-800 block leading-none">{stats.cancelled}</span>
                        <span className="text-[#7d7b7b] font-medium text-[1.4rem] uppercase tracking-wider mt-1 block">Đã hủy</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-8">
                <div className="w-3/5">
                    <h3 className="text-[2.2rem] text-slate-800 font-black italic tracking-tight mb-6">Đơn hàng gần đây</h3>
                    <div className="border border-slate-100 rounded-[2.5rem] overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="p-6 text-[1.4rem] font-black uppercase tracking-widest text-slate-400">Mã đơn</th>
                                    <th className="p-6 text-[1.4rem] font-black uppercase tracking-widest text-slate-400">Ngày đặt</th>
                                    <th className="p-6 text-[1.4rem] font-black uppercase tracking-widest text-slate-400">Trạng thái</th>
                                    <th className="p-6 text-[1.4rem] font-black uppercase tracking-widest text-slate-400 text-right">Tổng tiền</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="p-6 text-[1.5rem] font-bold text-client-primary">
                                            <Link to={`/dashboard/orders/${order.id}`} className="hover:underline">
                                                #{order.orderCode}
                                            </Link>
                                        </td>
                                        <td className="p-6 text-[1.4rem] text-slate-500 font-medium">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</td>
                                        <td className="p-6 whitespace-nowrap">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="p-6 text-[1.5rem] text-slate-800 font-bold text-right">
                                            {order.finalAmount.toLocaleString("vi-VN")}đ
                                        </td>
                                    </tr>
                                ))}
                                {recentOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center text-slate-400 italic text-[1.6rem]">Chưa có đơn hàng nào</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="flex-1">
                    <h3 className="text-[2.2rem] text-slate-800 font-black italic tracking-tight mb-6">Đánh giá của bạn</h3>
                    <div className="border border-slate-100 rounded-[2.5rem] p-8 bg-white shadow-sm h-fit">
                        <ul className="divide-y divide-slate-100">
                            {recentReviews.map((review, idx) => (
                                <li key={idx} className={`${idx === 0 ? "pb-6" : "py-6"}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-[1.6rem] font-bold text-slate-800">{review.title}</h4>
                                        <div className="flex items-center gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <StarIcon
                                                    key={i}
                                                    sx={{
                                                        fontSize: "1.8rem !important",
                                                        color: i < review.rating ? "#F9A61C !important" : "#E2E8F0 !important",
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-[1.2rem] text-slate-400 font-medium mb-3">{review.date}</p>
                                    <p className="text-slate-500 text-[1.4rem] line-clamp-2 leading-relaxed italic">
                                        "{review.content}"
                                    </p>
                                </li>
                            ))}
                        </ul>
                        <Link to="/dashboard/review" className="mt-6 block text-center text-[1.2rem] font-black uppercase tracking-widest text-client-primary hover:text-client-secondary">
                            Xem tất cả đánh giá
                        </Link>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
