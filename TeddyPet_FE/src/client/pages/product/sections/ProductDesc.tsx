import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const contentVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};


interface ProductDescProps {
    description?: string;
}

export const ProductDesc = ({ description }: ProductDescProps) => {
    const [activeTabKey, setActiveTabKey] = useState("description");

    const productTabsData = [
        {
            label: "Mô tả Sản phẩm",
            key: "description",
            content: description || `<p>Chưa có mô tả chi tiết cho sản phẩm này.</p>`
        },
        {
            label: "Giao hàng & Trả hàng",
            key: "delivery_returns",
            content: `
                <p style="margin-bottom: 0.9375rem;"><strong>Chính Sách Giao Hàng:</strong> Chúng tôi cung cấp dịch vụ giao hàng tiêu chuẩn và giao hàng nhanh toàn quốc. Thời gian giao hàng dự kiến là 1-2 ngày làm việc cho khu vực nội thành (TP. HCM, Hà Nội) và 3-5 ngày làm việc cho các tỉnh thành khác. Phí giao hàng sẽ được tính toán tự động dựa trên địa chỉ và trọng lượng đơn hàng khi thanh toán. Đặc biệt, chúng tôi có chương trình miễn phí giao hàng cho tất cả các đơn hàng đạt giá trị từ 999.000₫ trở lên.</p>
                
                <p style="margin-bottom: 0.9375rem;"><strong>Quy Định Đổi Trả Sản Phẩm:</strong> Khách hàng có quyền yêu cầu đổi trả hàng hóa trong vòng 7 ngày kể từ ngày nhận hàng. Điều kiện áp dụng bao gồm: Sản phẩm còn nguyên tem mác, chưa qua sử dụng, còn nguyên vẹn bao bì gốc và không bị hư hỏng do tác động từ phía người dùng. Chúng tôi cũng chấp nhận đổi trả nếu sản phẩm bị lỗi kỹ thuật (ví dụ: gãy chốt, hỏng khóa) do nhà sản xuất. Chi phí vận chuyển trả hàng sẽ do chúng tôi chi trả nếu sản phẩm có lỗi. Trong các trường hợp đổi trả khác (không phải lỗi sản xuất), chi phí vận chuyển sẽ do khách hàng chịu. Vui lòng liên hệ bộ phận chăm sóc khách hàng để được hỗ trợ thủ tục đổi trả nhanh chóng.</p>
            `
        },
        {
            label: "Thông tin Bổ sung",
            key: "additional_info",
            content: `
                <p style="margin-bottom: 0.9375rem;"><strong>Thông Số Kỹ Thuật:</strong> Sản phẩm được chế tạo từ các vật liệu an toàn, không chứa chất gây hại, đảm bảo sức khỏe cho thú cưng của bạn. Quy trình sản xuất tuân thủ nghiêm ngặt các tiêu chuẩn chất lượng quốc tế.</p>
                <p>Để được tư vấn chi tiết hơn về thông số kỹ thuật hoặc bảng kích cỡ, vui lòng liên hệ trực tiếp với bộ phận hỗ trợ khách hàng của chúng tôi qua hotline hoặc chat trực tuyến.</p>
            `
        },
    ];

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
                                    text-[1.375rem] 
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

                <div className="pt-[30px] text-[1rem] text-[#505050] min-h-[300px]">
                    <AnimatePresence mode="wait">
                        {activeTab && (
                            <motion.div
                                key={activeTab.key}
                                variants={contentVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="description-content"
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
