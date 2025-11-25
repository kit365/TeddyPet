import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const productTabsData = [
    {
        label: "Mô tả Sản phẩm",
        key: "description",
        content: `
            <p style="margin-bottom: 1.5rem;"><strong>Giới thiệu tổng quan:</strong> Lồng Vận Chuyển An Toàn 3 Trong 1 PetCare Pro là người bạn đồng hành không thể thiếu cho mọi chủ nhân thú cưng hiện đại. Chúng tôi hiểu rằng sự an toàn và thoải mái của thú cưng là ưu tiên hàng đầu, vì vậy chiếc lồng này được thiết kế để vượt qua mọi tiêu chuẩn khắt khe nhất. Sản phẩm không chỉ đáp ứng các quy định vận chuyển hàng không và đường bộ mà còn dễ dàng chuyển đổi thành một không gian riêng tư, ấm cúng tại nhà và một nơi nghỉ ngơi an toàn khi đi dã ngoại. Chất liệu nhựa ABS chịu lực cao, không độc hại, đảm bảo độ bền bỉ qua nhiều năm sử dụng, giúp bạn hoàn toàn yên tâm khi sử dụng lâu dài. Thiết kế dễ dàng tháo lắp cũng giúp việc vệ sinh trở nên đơn giản hơn bao giờ hết, duy trì môi trường sạch sẽ cho thú cưng. Ngoài ra, chúng tôi đã tích hợp hệ thống khóa chốt kim loại tự động, thiết kế chống bung, để đảm bảo thú cưng của bạn luôn ở trong lồng an toàn.</p>
            
            <ul style="margin-bottom: 1.5rem; padding-left: 20px; list-style-type: disc;">
                <li style="margin-bottom: 8px;">Hệ Thống Thông Gió 360°: Lỗ thông gió lớn ở cả bốn mặt giúp không khí lưu thông tối đa, ngăn ngừa tình trạng hầm bí và căng thẳng cho thú cưng, đặc biệt quan trọng trong các chuyến đi dài.</li>
                <li style="margin-bottom: 8px;">Cơ Chế Khóa An Toàn Tuyệt Đối: Khóa chốt kim loại tự động, thiết kế chống bung, đảm bảo thú cưng không thể tự ý mở từ bên trong, mang lại sự an tâm tuyệt đối cho chủ nhân.</li>
                <li style="margin-bottom: 8px;">Tay Cầm Ergonomic: Tay cầm được gia cố, chống trượt, giúp việc nâng và di chuyển lồng dễ dàng và chắc chắn, ngay cả khi thú cưng có trọng lượng lớn, giảm thiểu áp lực lên tay người vận chuyển.</li>
            </ul>
            
            <p><strong>Lưu ý:</strong> Vui lòng đo kích thước thú cưng (chiều dài, chiều cao) trước khi chọn size để đảm bảo sự thoải mái tối đa và chọn đúng sản phẩm phù hợp nhất với nhu cầu của bạn và thú cưng.</p>
        `
    },
    {
        label: "Giao hàng & Trả hàng",
        key: "delivery_returns",
        content: `
            <p style="margin-bottom: 1.5rem;"><strong>Chính Sách Giao Hàng:</strong> Chúng tôi cung cấp dịch vụ giao hàng tiêu chuẩn và giao hàng nhanh toàn quốc. Thời gian giao hàng dự kiến là 1-2 ngày làm việc cho khu vực nội thành (TP. HCM, Hà Nội) và 3-5 ngày làm việc cho các tỉnh thành khác. Phí giao hàng sẽ được tính toán tự động dựa trên địa chỉ và trọng lượng đơn hàng khi thanh toán. Đặc biệt, chúng tôi có chương trình miễn phí giao hàng cho tất cả các đơn hàng đạt giá trị từ 999.000₫ trở lên.</p>
            
            <p style="margin-bottom: 1.5rem;"><strong>Quy Định Đổi Trả Sản Phẩm:</strong> Khách hàng có quyền yêu cầu đổi trả hàng hóa trong vòng 7 ngày kể từ ngày nhận hàng. Điều kiện áp dụng bao gồm: Sản phẩm còn nguyên tem mác, chưa qua sử dụng, còn nguyên vẹn bao bì gốc và không bị hư hỏng do tác động từ phía người dùng. Chúng tôi cũng chấp nhận đổi trả nếu sản phẩm bị lỗi kỹ thuật (ví dụ: gãy chốt, hỏng khóa) do nhà sản xuất. Chi phí vận chuyển trả hàng sẽ do chúng tôi chi trả nếu sản phẩm có lỗi. Trong các trường hợp đổi trả khác (không phải lỗi sản xuất), chi phí vận chuyển sẽ do khách hàng chịu. Vui lòng liên hệ bộ phận chăm sóc khách hàng để được hỗ trợ thủ tục đổi trả nhanh chóng.</p>
        `
    },
    {
        label: "Thông tin Bổ sung",
        key: "additional_info",
        content: `
            <p style="margin-bottom: 1.5rem;"><strong>Thông Số Kỹ Thuật:</strong> Sản phẩm được chế tạo từ Nhựa ABS Cao cấp, không chứa BPA (chất gây hại), kết hợp với Thép không gỉ cho các bộ phận khóa và cửa. Màu sắc hiện có: Xám Titan sang trọng, Hồng Pastel dịu mát, và Xanh Navy mạnh mẽ. Trọng lượng lồng dao động từ 2.5 kg (cho Size Nhỏ) đến 5.0 kg (cho Size Lớn), dễ dàng di chuyển. Để giúp quý khách lựa chọn, lồng có sẵn trong ba kích cỡ: Nhỏ, Trung bình và Lớn. Vui lòng tham khảo bảng kích cỡ chi tiết bên dưới để chọn đúng size cho thú cưng của bạn.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 1.5rem; text-align: left;">
                <thead>
                    <tr style="background-color: #f7f7f7;">
                        <th style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">Kích cỡ</th>
                        <th style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">Dài x Rộng x Cao (cm)</th>
                        <th style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">Phù hợp cân nặng</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 12px;">Nhỏ</td>
                        <td style="border: 1px solid #ddd; padding: 12px;">50 x 30 x 30</td>
                        <td style="border: 1px solid #ddd; padding: 12px;">Dưới 5 kg</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 12px;">Trung bình</td>
                        <td style="border: 1px solid #ddd; padding: 12px;">65 x 40 x 40</td>
                        <td style="border: 1px solid #ddd; padding: 12px;">5 - 10 kg</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 12px;">Lớn</td>
                        <td style="border: 1px solid #ddd; padding: 12px;">80 x 50 x 50</td>
                        <td style="border: 1px solid #ddd; padding: 12px;">10 - 20 kg</td>
                    </tr>
                </tbody>
            </table>
            <p style="margin-top: 15px;">Để được tư vấn chi tiết hơn về thông số kỹ thuật hoặc bảng kích cỡ, vui lòng liên hệ trực tiếp với bộ phận hỗ trợ khách hàng của chúng tôi qua hotline hoặc chat trực tuyến.</p>
        `
    },
];

const contentVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};


export const ProductDesc = () => {
    const [activeTabKey, setActiveTabKey] = useState("description");

    const activeTab = productTabsData.find(tab => tab.key === activeTabKey);

    return (
        <div className="px-[30px] pt-[150px] 2xl:pt-[120px] mb-[50px]">
            <div className="app-container p-[30px] rounded-[20px] bg-[#e67e201a]">
                <ul className="flex items-center gap-[45px] border-b border-[#D7D7D7]">
                    {productTabsData.map((tab) => {
                        const isActive = tab.key === activeTabKey;
                        return (
                            <li
                                key={tab.key}
                                className={`
                                    relative 
                                    text-[2.2rem] 
                                    font-secondary 
                                    px-[10px] 
                                    pb-[20px] 
                                    cursor-pointer 
                                    transition-default
                                    tab-item
                                    ${isActive ? 'text-client-primary active' : 'text-client-secondary hover:text-client-primary'}
                                `}
                                onClick={() => setActiveTabKey(tab.key)}
                            >
                                {tab.label}
                            </li>
                        );
                    })}
                </ul>

                <div className="pt-[30px] text-[1.6rem] text-[#505050] min-h-[300px]">
                    <AnimatePresence mode="wait">
                        {activeTab && (
                            <motion.div
                                key={activeTab.key}
                                variants={contentVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                dangerouslySetInnerHTML={{ __html: activeTab.content }}
                            />
                        )}

                        {!activeTab && <p>Đang tải nội dung...</p>}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
