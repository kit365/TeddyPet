import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const PaymentCallbackPage = () => {
    const location = useLocation();

    useEffect(() => {
        // Gửi message cho trang cha (OrderDetailPage) để đóng modal
        if (window.opener) {
            // Trường hợp mở tab mới (hiếm khi dùng modal nhưng đề phòng)
            window.opener.postMessage({ type: "PAYMENT_POPUP_CLOSE", query: location.search }, "*");
            window.close();
        } else if (window.parent !== window.self) {
            // Trường hợp iframe (modal hiện tại)
            window.parent.postMessage({ type: "PAYMENT_POPUP_CLOSE", query: location.search }, "*");
        } else {
            // Nếu vô tình truy cập trực tiếp thì redirect về trang chủ/đơn hàng
            window.location.href = "/dashboard/orders";
        }
    }, [location.search]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white p-4 text-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-client-primary/10 border-t-client-primary rounded-full animate-spin"></div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1 uppercase">Đang xử lý kết quả...</h3>
                    <p className="text-sm text-slate-500">Hệ thống đang đồng bộ trạng thái thanh toán. Vui lòng không đóng trình duyệt.</p>
                </div>
            </div>
        </div>
    );
};
