import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { getFeedbackTokenDetails, getOrderFeedbackDetails, submitFeedback, FeedbackTokenItem } from "../../api/feedback.api";
import { ProductBanner } from "./product/sections/ProductBanner";
import { FooterSub } from "../components/layouts/FooterSub";

export const FeedbackPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const orderId = searchParams.get("orderId");
    const email = searchParams.get("email");
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [orderInfo, setOrderInfo] = useState<{ customerName: string; customerEmail: string; items: FeedbackTokenItem[] } | null>(null);
    const [feedbacks, setFeedbacks] = useState<{ [key: string]: { rating: number; comment: string; submitted: boolean } }>({});
    const [hoverRatings, setHoverRatings] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        const fetchDetails = async () => {
            if (!token && !orderId) {
                toast.error("Thông tin đánh giá không hợp lệ.");
                navigate("/");
                return;
            }

            try {
                let res;
                if (token) {
                    res = await getFeedbackTokenDetails(token);
                } else if (orderId) {
                    res = await getOrderFeedbackDetails(orderId, email || undefined);
                }

                if (res && res.data) {
                    setOrderInfo(res.data);
                    // Initialize state for each item
                    // Initialize state for each item with existing data if any
                    const initialFeedbacks: any = {};
                    res.data.items.forEach((item) => {
                        const key = `${item.productId}-${item.variantId || 'none'}`;
                        initialFeedbacks[key] = {
                            rating: item.rating || 5,
                            comment: item.comment || "",
                            submitted: item.isSubmitted || false
                        };
                    });
                    setFeedbacks(initialFeedbacks);
                }
            } catch (error: any) {
                toast.error(error.response?.data?.message || "Không thể tải thông tin đơn hàng.");
                navigate("/");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [token, orderId, navigate]);

    const handleRatingChange = (key: string, rating: number) => {
        setFeedbacks(prev => ({
            ...prev,
            [key]: { ...prev[key], rating }
        }));
    };

    const handleCommentChange = (key: string, comment: string) => {
        setFeedbacks(prev => ({
            ...prev,
            [key]: { ...prev[key], comment }
        }));
    };

    const handleSubmit = async (item: FeedbackTokenItem) => {
        const key = `${item.productId}-${item.variantId || 'none'}`;
        const feedback = feedbacks[key];

        if (!feedback.comment.trim()) {
            toast.warn("Vui lòng nhập bình luận.");
            return;
        }

        try {
            await submitFeedback({
                token: token || undefined,
                orderId: orderId || undefined,
                productId: item.productId,
                variantId: item.variantId,
                rating: feedback.rating,
                comment: feedback.comment
            });
            toast.success(`Đã gửi đánh giá cho ${item.productName}`);
            setFeedbacks(prev => ({
                ...prev,
                [key]: { ...prev[key], submitted: true }
            }));
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Gửi đánh giá thất bại.");
        }
    };

    const allSubmitted = Object.values(feedbacks).length > 0 && Object.values(feedbacks).every(f => f.submitted);

    useEffect(() => {
        if (!loading && orderInfo && allSubmitted) {
            const timer = setTimeout(() => {
                navigate(orderId ? "/dashboard/review" : "/");
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [allSubmitted, navigate, orderId, loading, orderInfo]);

    if (loading) return <div className="p-20 text-center text-3xl font-secondary">Đang tải thông tin...</div>;
    if (!orderInfo) return <div className="p-20 text-center text-3xl font-secondary">Không tìm thấy thông tin đơn hàng.</div>;

    return (
        <>
            <ProductBanner
                pageTitle="Đánh giá sản phẩm"
                breadcrumbs={[
                    { label: "Trang chủ", to: "/" },
                    { label: "Đánh giá", to: "#" }
                ]}
                url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-details.jpg"
            />

            <section className="py-[100px] bg-white">
                <div className="app-container max-w-[900px]">
                    <div className="mb-[50px] text-center">
                        <h2 className="text-[3.5rem] font-secondary text-client-secondary mb-[15px]">Chào {orderInfo.customerName}!</h2>
                        <p className="text-[1.8rem] text-client-text">Cảm ơn bạn đã tin tưởng TeddyPet. Hãy chia sẻ trải nghiệm của bạn về các sản phẩm đã mua nhé.</p>
                    </div>

                    {allSubmitted ? (
                        <div className="text-center py-[50px] bg-[#f9f9f9] rounded-[30px] border border-dashed border-client-primary">
                            <h3 className="text-[2.5rem] font-secondary text-client-primary mb-[10px]">Cảm ơn bạn đã đánh giá!</h3>
                            <p className="text-[1.6rem] text-client-text mb-[30px]">Ý kiến của bạn giúp TeddyPet ngày càng hoàn thiện hơn.</p>
                            <button
                                onClick={() => navigate(orderId ? "/dashboard/review" : "/")}
                                className="bg-client-primary text-white font-secondary px-[40px] py-[15px] rounded-[40px] hover:bg-client-secondary transition-default"
                            >
                                {orderId ? "Xem đánh giá của tôi" : "Quay lại trang chủ"}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-[40px]">
                            {orderInfo.items.map((item, idx) => {
                                const key = `${item.productId}-${item.variantId || 'none'}`;
                                const state = feedbacks[key];

                                return (
                                    <div key={idx} className="bg-white border border-[#d7d7d7] rounded-[25px] p-[30px] shadow-sm flex gap-[30px]">
                                        <div className="w-[150px] h-[150px] rounded-[15px] overflow-hidden border border-[#eee] flex-shrink-0">
                                            <img src={item.imageUrl || "https://placeholder.com/150"} alt={item.productName} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-[2.2rem] font-secondary text-client-secondary mb-[5px]">{item.productName}</h4>
                                            {item.variantName && <p className="text-client-primary mb-[15px] text-[1.4rem]">Phân loại: {item.variantName}</p>}

                                            <div className="flex items-center gap-1 mb-[20px]">
                                                {[...Array(5)].map((_, i) => {
                                                    const starIdx = i + 1;
                                                    const hover = hoverRatings[key] || 0;
                                                    const active = starIdx <= (hover || state.rating);
                                                    return (
                                                        <div
                                                            key={i}
                                                            className={`${state.submitted ? 'cursor-default' : 'cursor-pointer'}`}
                                                            onMouseEnter={() => !state.submitted && setHoverRatings(prev => ({ ...prev, [key]: starIdx }))}
                                                            onMouseLeave={() => !state.submitted && setHoverRatings(prev => ({ ...prev, [key]: 0 }))}
                                                            onClick={() => !state.submitted && handleRatingChange(key, starIdx)}
                                                        >
                                                            {active ?
                                                                <StarIcon sx={{ fontSize: "3rem", color: "#FF6262" }} /> :
                                                                <StarBorderIcon sx={{ fontSize: "3rem", color: "#ccc" }} />
                                                            }
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="mb-[20px]">
                                                <textarea
                                                    className={`w-full border border-[#d7d7d7] rounded-[15px] p-[15px] outline-none transition-default min-h-[100px] text-[1.6rem] ${state.submitted ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'focus:border-client-primary'}`}
                                                    placeholder="Hãy chia sẻ điều bạn thích nhất về sản phẩm này nhé..."
                                                    value={state.comment}
                                                    onChange={(e) => !state.submitted && handleCommentChange(key, e.target.value)}
                                                    readOnly={state.submitted}
                                                />
                                            </div>

                                            {state.submitted ? (
                                                <div className="inline-flex items-center gap-2 text-emerald-600 font-bold text-[1.4rem] bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                                    BẠN ĐÃ ĐÁNH GIÁ SẢN PHẨM NÀY
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleSubmit(item)}
                                                    className="bg-client-secondary text-white font-secondary px-[30px] py-[12px] rounded-[30px] hover:bg-client-primary transition-default text-[1.6rem]"
                                                >
                                                    Gửi đánh giá
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            <FooterSub />
        </>
    );
};
