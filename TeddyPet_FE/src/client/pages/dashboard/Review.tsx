import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ProductBanner } from "../product/sections/ProductBanner";
import { Sidebar } from "./sections/Sidebar";
import StarIcon from "@mui/icons-material/Star";
import { getMyFeedbacks, FeedbackResponse } from "../../../api/feedback.api";

export const ReviewPage = () => {
    const [feedbacks, setFeedbacks] = useState<FeedbackResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeedbacks = async () => {
            try {
                const res = await getMyFeedbacks();
                if (res.success && res.data) {
                    setFeedbacks(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch feedbacks", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFeedbacks();
    }, []);

    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Tài khoản", to: "/dashboard/profile" },
        { label: "Đánh giá của tôi", to: `/dashboard/review` },
    ];

    return (
        <>
            <ProductBanner
                pageTitle="Đánh giá của tôi"
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
                            Đánh giá của tôi
                        </h3>

                        {loading ? (
                            <div className="text-center py-[50px] text-[1.8rem]">Đang tải đánh giá...</div>
                        ) : feedbacks.length === 0 ? (
                            <div className="p-[50px] border border-[#eee] rounded-[10px] flex flex-col items-center justify-center text-center space-y-[20px]">
                                <div className="w-[100px] h-[100px] bg-gray-50 rounded-full flex items-center justify-center">
                                    <span className="text-[4rem]">✍️</span>
                                </div>
                                <div className="space-y-[5px]">
                                    <p className="text-[1.8rem] font-[600] text-client-secondary tracking-tight">Chưa có đánh giá nào</p>
                                    <p className="text-[1.5rem] text-[#7d7b7b]">Bạn chưa thực hiện đánh giá cho sản phẩm nào.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-[20px]">
                                {feedbacks.map((fb) => (
                                    <div key={fb.id} className="border border-[#eee] p-[20px] rounded-[10px] flex">
                                        <img
                                            className="w-[70px] h-[70px] rounded-full overflow-hidden border-[3px] shadow-[0px_7px_29px_0px_#64646f33] border-white object-cover"
                                            src={fb.productImage || "https://placeholder.com/150"}
                                            alt={fb.productName}
                                        />
                                        <div className="pl-[25px] w-full">
                                            <h5 className="text-[1.7rem] flex justify-between items-center font-[600] text-client-secondary hover:text-client-primary transition-default">
                                                <Link to={`/product/detail/${fb.productSlug}`}>{fb.productName}</Link>
                                                <span className="flex items-center gap-[2px]">
                                                    {[...Array(5)].map((_, i) => (
                                                        <StarIcon
                                                            key={i}
                                                            sx={{
                                                                fontSize: "2rem !important",
                                                                color: i < fb.rating ? "#F9A61C !important" : "#ccc !important",
                                                            }}
                                                        />
                                                    ))}
                                                </span>
                                            </h5>
                                            <div className="flex items-center gap-3">
                                                <p className="text-[1.3rem] text-client-secondary mt-[2px] mb-[13px]">{new Date(fb.createdAt).toLocaleDateString("vi-VN")}</p>
                                                {fb.variantName && <p className="text-[1.2rem] text-client-primary bg-client-primary/5 px-3 py-1 rounded-full mb-2">Phân loại: {fb.variantName}</p>}
                                            </div>
                                            <p className="text-[#7d7b7b] text-[1.4rem] italic">"{fb.comment}"</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
