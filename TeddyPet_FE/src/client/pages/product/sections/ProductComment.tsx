import StarIcon from "@mui/icons-material/Star";
import { FeedbackResponse } from "../../../../api/feedback.api";
import { Check } from "iconoir-react";

interface ProductCommentProps {
    feedbacks: FeedbackResponse[];
}

export const ProductComment = ({ feedbacks }: ProductCommentProps) => {
    return (
        <div className="pb-[100px]">
            <div className="app-container">
                <h2 className="text-[3.5rem] 2xl:text-[2.8rem] font-secondary text-client-secondary mb-[30px]">Đánh giá của khách hàng ({feedbacks.length})</h2>
                <ul className="space-y-[30px]">
                    {feedbacks.length === 0 ? (
                        <p className="py-[30px] text-client-text text-[1.8rem]">Chưa có đánh giá nào cho sản phẩm này.</p>
                    ) : (
                        feedbacks.map((fb) => (
                            <li key={fb.id} className="py-[30px] border-b border-[#10293726] flex justify-between">
                                <div className="flex flex-1">
                                    <div className="w-[6rem] h-[6rem] rounded-[10px] border border-[#e1dde7] overflow-hidden flex-shrink-0">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${fb.userName || fb.guestName || 'G'}&background=random`}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="ml-[20px] flex-1 pr-[20px]">
                                        <div className="flex items-center mb-[5px] gap-[10px]">
                                            <strong className="font-secondary text-[1.8rem] text-client-secondary">
                                                {fb.userName || fb.guestName || "Khách hàng"}
                                            </strong>
                                            {fb.isPurchased && (
                                                <span className="flex items-center gap-1 text-[#27ae60] text-[1.2rem] font-bold bg-[#e8f8f0] px-[10px] py-[3px] rounded-full border border-[#27ae6033]">
                                                    <Check className="w-[1.4rem] h-[1.4rem]" strokeWidth={3} />
                                                    Đã mua hàng
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center mb-[10px] text-client-text text-[1.4rem] opacity-70">
                                            <span>{new Date(fb.createdAt).toLocaleDateString("vi-VN")}</span>
                                            {fb.variantName && (
                                                <>
                                                    <span className="mx-[10px]">|</span>
                                                    <span className="text-client-primary font-medium">Phân loại: {fb.variantName}</span>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-client-text leading-[1.8] text-[1.6rem] whitespace-pre-wrap">{fb.comment}</p>

                                        {/* Admin Reply */}
                                        {fb.replyComment && (
                                            <div className="mt-[20px] bg-[#f8f9fa] p-[20px] rounded-[15px] border-l-[4px] border-client-primary relative">
                                                <div className="flex items-center gap-[10px] mb-[10px]">
                                                    <div className="w-[3.5rem] h-[3.5rem] rounded-full bg-client-primary flex items-center justify-center text-white">
                                                        <span className="text-[1.2rem] font-bold">TP</span>
                                                    </div>
                                                    <div>
                                                        <strong className="text-client-secondary text-[1.5rem] font-secondary">TeddyPet Phản hồi</strong>
                                                        {fb.repliedAt && (
                                                            <span className="text-[1.2rem] text-client-text opacity-60 ml-[10px]">
                                                                {new Date(fb.repliedAt).toLocaleDateString("vi-VN")}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-client-text text-[1.5rem] leading-[1.6] italic">
                                                    {fb.replyComment}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    {[...Array(5)].map((_, i) => (
                                        <StarIcon
                                            key={i}
                                            sx={{
                                                fontSize: "2rem !important",
                                                color: i < fb.rating ? "#ffbb00 !important" : "#ccc !important",
                                            }}
                                        />
                                    ))}
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
};