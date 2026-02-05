import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ProductBanner } from "../product/sections/ProductBanner";
import { FooterSub } from "../../components/layouts/FooterSub";
import { lookupGuestOrder } from "../../../api/order.api";
import { OrderResponse } from "../../../types/order.type";
import { toast } from "react-toastify";
import { Search, Package, Calendar, Clock, MapPin, User, Mail, Phone } from "iconoir-react";

const breadcrumbs = [
    { label: "Trang chủ", to: "/" },
    { label: "Tra cứu đơn hàng", to: "#" },
];

export const OrderTrackingPage = () => {
    const location = useLocation();
    const [orderCode, setOrderCode] = useState("");
    const [email, setEmail] = useState("");
    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (location.state) {
            if (location.state.orderCode) setOrderCode(location.state.orderCode);
            if (location.state.email) setEmail(location.state.email);
        }
    }, [location.state]);

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderCode || !email) {
            toast.error("Vui lòng nhập đầy đủ mã đơn hàng và email!");
            return;
        }

        setLoading(true);
        try {
            const response = await lookupGuestOrder(orderCode.trim(), email.trim());
            if (response.success) {
                setOrder(response.data);
                toast.success("Đã tìm thấy thông tin đơn hàng!");
            } else {
                toast.error(response.message || "Không tìm thấy đơn hàng");
                setOrder(null);
            }
        } catch (error: any) {
            console.error("Lỗi tra cứu:", error);
            toast.error(error.response?.data?.message || "Không tìm thấy đơn hàng. Vui lòng kiểm tra lại thông tin.");
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'CONFIRMED': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'SHIPPING':
            case 'SHIPPED':
            case 'DELIVERING': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'DELIVERED': return 'bg-green-100 text-green-700 border-green-200';
            case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Mới đặt hàng';
            case 'CONFIRMED': return 'Đã xác nhận';
            case 'SHIPPING':
            case 'SHIPPED':
            case 'DELIVERING': return 'Đang vận chuyển';
            case 'DELIVERED': return 'Đã nhận hàng';
            case 'CANCELLED': return 'Đã hủy';
            default: return status;
        }
    };

    return (
        <div className="bg-[#fcfcfc] min-h-screen">
            <ProductBanner
                pageTitle="Tra cứu đơn hàng"
                breadcrumbs={breadcrumbs}
                url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-listing.jpg"
                className="bg-top"
            />

            <div className="app-container py-[80px]">
                <div className="max-w-[800px] mx-auto">
                    {/* Search Box */}
                    <div className="bg-white p-[40px] rounded-[30px] shadow-sm border border-[#eee] mb-[40px]">
                        <div className="text-center mb-[30px]">
                            <h2 className="text-[2.6rem] font-bold text-client-secondary mb-2 uppercase tracking-tight">Kiểm tra trạng thái</h2>
                            <p className="text-[1.5rem] text-gray-400 font-medium">Nhập thông tin đơn hàng của bạn để theo dõi hành trình</p>
                        </div>

                        <form onSubmit={handleLookup} className="space-y-[20px]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
                                <div className="space-y-2">
                                    <label className="text-[1.4rem] font-bold text-client-secondary ml-4">Mã đơn hàng *</label>
                                    <div className="relative">
                                        <div className="absolute left-[20px] top-1/2 -translate-y-1/2 text-gray-400">
                                            <Package className="w-[1.8rem] h-[1.8rem]" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="VD: ORD-240131-XXXXX"
                                            value={orderCode}
                                            onChange={(e) => setOrderCode(e.target.value)}
                                            className="w-full h-[55px] pl-[55px] pr-[20px] rounded-[40px] border border-[#eee] focus:border-client-primary outline-none transition-all text-[1.5rem] bg-gray-50/30"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[1.4rem] font-bold text-client-secondary ml-4">Email đặt hàng *</label>
                                    <div className="relative">
                                        <div className="absolute left-[20px] top-1/2 -translate-y-1/2 text-gray-400">
                                            <Mail className="w-[1.8rem] h-[1.8rem]" />
                                        </div>
                                        <input
                                            type="email"
                                            placeholder="VD: guest@gmail.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full h-[55px] pl-[55px] pr-[20px] rounded-[40px] border border-[#eee] focus:border-client-primary outline-none transition-all text-[1.5rem] bg-gray-50/30"
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-[55px] rounded-[40px] bg-client-secondary hover:bg-client-primary text-white font-bold text-[1.5rem] transition-all flex items-center justify-center gap-3 uppercase tracking-wider shadow-lg shadow-client-secondary/20"
                            >
                                {loading ? (
                                    <div className="w-[20px] h-[20px] border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Search className="w-[2rem] h-[2rem]" />
                                        TRA CỨU ĐƠN HÀNG
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Result Content */}
                    {order && (
                        <div className="animate-fadeIn space-y-[40px]">
                            {/* Order Status Summary */}
                            <div className="bg-white rounded-[30px] border border-[#eee] overflow-hidden shadow-sm">
                                <div className="flex flex-col md:flex-row items-center justify-between p-[30px] border-b border-[#eee] gap-6">
                                    <div className="flex items-center gap-[20px]">
                                        <div className="w-[60px] h-[60px] bg-client-primary/10 rounded-full flex items-center justify-center">
                                            <Package className="w-[3rem] h-[3rem] text-client-primary" />
                                        </div>
                                        <div>
                                            <div className="text-[1.4rem] text-gray-400 font-medium">Trạng thái đơn hàng</div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className={`px-[12px] py-[4px] rounded-full border text-[1.3rem] font-bold ${getStatusStyle(order.status)}`}>
                                                    {getStatusLabel(order.status)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center md:text-right">
                                        <div className="text-[1.4rem] text-gray-400 font-medium">Dự kiến giao hàng</div>
                                        <div className="text-[1.8rem] font-bold text-client-secondary mt-1">
                                            {order.createdAt ? new Date(new Date(order.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN') : 'Đang cập nhật'}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-[30px] grid grid-cols-1 md:grid-cols-3 gap-[30px]">
                                    <div className="flex items-start gap-[15px]">
                                        <Calendar className="w-[2rem] h-[2rem] text-gray-400 mt-1" />
                                        <div>
                                            <div className="text-[1.3rem] text-gray-400">Ngày đặt hàng</div>
                                            <div className="text-[1.5rem] font-bold text-client-secondary mt-1">
                                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '---'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-[15px]">
                                        <Clock className="w-[2rem] h-[2rem] text-gray-400 mt-1" />
                                        <div>
                                            <div className="text-[1.3rem] text-gray-400">Thời gian</div>
                                            <div className="text-[1.5rem] font-bold text-client-secondary mt-1">
                                                {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '---'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-[15px]">
                                        <Search className="w-[2rem] h-[2rem] text-gray-400 mt-1" />
                                        <div>
                                            <div className="text-[1.3rem] text-gray-400">Mã vận đơn</div>
                                            <div className="text-[1.5rem] font-bold text-client-primary mt-1">{order.orderCode}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-[40px]">
                                {/* Customer Info */}
                                <div className="bg-white p-[30px] rounded-[30px] border border-[#eee] shadow-sm">
                                    <h3 className="text-[1.8rem] font-bold text-client-secondary mb-[20px] flex items-center gap-3">
                                        <User className="w-[2rem] h-[2rem] text-client-primary" />
                                        Thông tin người nhận
                                    </h3>
                                    <div className="space-y-[15px]">
                                        <div className="flex items-start gap-[15px]">
                                            <User className="w-[1.6rem] h-[1.6rem] text-gray-400 mt-1 shrink-0" />
                                            <div>
                                                <div className="text-[1.2rem] text-gray-400">Họ tên</div>
                                                <div className="text-[1.4rem] font-bold text-client-secondary">{order.shippingName}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-[15px]">
                                            <Phone className="w-[1.6rem] h-[1.6rem] text-gray-400 mt-1 shrink-0" />
                                            <div>
                                                <div className="text-[1.2rem] text-gray-400">Số điện thoại</div>
                                                <div className="text-[1.4rem] font-bold text-client-secondary">{order.shippingPhone}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-[15px]">
                                            <MapPin className="w-[1.6rem] h-[1.6rem] text-gray-400 mt-1 shrink-0" />
                                            <div>
                                                <div className="text-[1.2rem] text-gray-400">Địa chỉ giao hàng</div>
                                                <div className="text-[1.4rem] font-bold text-client-secondary leading-relaxed">{order.shippingAddress}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items Summary */}
                                <div className="bg-white p-[30px] rounded-[30px] border border-[#eee] shadow-sm flex flex-col h-full">
                                    <h3 className="text-[1.8rem] font-bold text-client-secondary mb-[20px] flex items-center gap-3">
                                        <Package className="w-[2rem] h-[2rem] text-client-primary" />
                                        Tóm tắt đơn hàng
                                    </h3>
                                    <div className="flex-1 space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                        {order.orderItems?.map((item, idx) => (
                                            <div key={idx} className="flex gap-[12px] items-center">
                                                <div className="w-[50px] h-[50px] rounded-[10px] overflow-hidden border border-[#eee] shrink-0">
                                                    <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[1.3rem] font-bold text-client-secondary truncate">{item.productName}</div>
                                                    <div className="text-[1.2rem] text-gray-400">{item.variantName} x {item.quantity}</div>
                                                </div>
                                                <div className="text-[1.3rem] font-bold text-client-secondary">{(item.totalPrice * item.quantity || 0).toLocaleString()}đ</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-[#eee] space-y-2">
                                        <div className="flex justify-between text-[1.4rem] text-gray-500">
                                            <span>Tạm tính:</span>
                                            <span>{(order.subtotal || 0).toLocaleString()}đ</span>
                                        </div>
                                        <div className="flex justify-between text-[1.4rem] text-gray-500">
                                            <span>Phí ship:</span>
                                            <span>{order.shippingFee && order.shippingFee > 0 ? `${order.shippingFee.toLocaleString()}đ` : 'Liên hệ sau'}</span>
                                        </div>
                                        <div className="flex justify-between text-[1.6rem] font-bold text-client-primary mt-2">
                                            <span>Tổng số tiền:</span>
                                            <span>{(order.finalAmount || 0).toLocaleString()}đ</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!order && !loading && (
                        <div className="mt-[60px] text-center border-t border-[#eee] pt-[40px]">
                            <p className="text-[1.4rem] text-gray-400 mb-6">Mã đơn hàng được gửi kèm trong email xác nhận mua hàng của bạn.</p>
                            <div className="flex items-center justify-center gap-[40px]">
                                <div className="text-center">
                                    <div className="text-[2.2rem] font-bold text-client-primary">24/7</div>
                                    <div className="text-[1.2rem] text-gray-400 font-bold uppercase tracking-widest mt-1">Hỗ trợ</div>
                                </div>
                                <div className="w-[1px] h-[40px] bg-[#eee]"></div>
                                <div className="text-center text-client-secondary hover:text-client-primary transition-all">
                                    <div className="text-[2.2rem] font-bold">039 123 4567</div>
                                    <div className="text-[1.2rem] text-gray-400 font-bold uppercase tracking-widest mt-1">Hotline</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <FooterSub />

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.6s ease-out forwards;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #eee;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};
