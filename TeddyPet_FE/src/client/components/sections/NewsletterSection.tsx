import { useState } from "react";
import { toast } from "react-toastify";
import { subscribeNewsletter } from "../../../api/newsletter.api";

export const NewsletterSection = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email) {
            toast.warn("Vui lòng nhập email của bạn.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Email không hợp lệ.");
            return;
        }

        if (!acceptTerms) {
            toast.warn("Bạn cần đồng ý để tiếp tục.");
            return;
        }

        setLoading(true);
        try {
            const res = await subscribeNewsletter(email);
            if (res.success) {
                toast.success(res.message || "Đăng ký thành công!");
                setEmail("");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Đăng ký thất bại, vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="bg-[#FFF0F0] py-[80px] px-[20px] rounded-[30px]">
            <div className="max-w-[700px] mx-auto text-left">
                <h2 className="text-[2.5rem] font-secondary text-client-secondary mb-[20px] leading-[1.2]">
                    Nhận Thông Tin Mới Nhất
                </h2>
                <p className="text-client-text text-[1.125rem] mb-[40px] leading-[1.6] opacity-80">
                    Cập nhật tin tức sản phẩm, bí quyết chăm sóc và làm đẹp độc quyền dành cho thú cưng.
                </p>

                <form onSubmit={handleSubscribe} className="space-y-[15px]">
                    <div className="relative flex items-center">
                        <input
                            type="email"
                            placeholder="Nhập Email của bạn tại đây"
                            className="w-full bg-white border border-[#E1DDE7] rounded-[50px] py-[18px] px-[30px] pr-[150px] outline-none focus:border-client-primary transition-all text-[1rem]"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="absolute right-[5px] top-[5px] bottom-[5px] bg-client-secondary hover:bg-client-primary text-white font-secondary px-[35px] rounded-[45px] transition-all text-[1rem] font-bold disabled:opacity-50"
                        >
                            {loading ? "..." : "Đăng ký"}
                        </button>
                    </div>

                    <div className="flex items-start gap-[12px] group cursor-pointer" onClick={() => setAcceptTerms(!acceptTerms)}>
                        <div className={`mt-[4px] w-[20px] h-[20px] rounded-[4px] border-2 flex-shrink-0 flex items-center justify-center transition-all ${acceptTerms ? 'bg-client-primary border-client-primary' : 'border-[#D7D7D7] bg-white'}`}>
                            {acceptTerms && (
                                <svg className="w-[12px] h-[12px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <span className="text-client-text text-[0.9375rem] font-medium leading-[1.4] select-none group-hover:text-client-primary transition-colors">
                            Đăng ký ngay để nhận ưu đãi đặc biệt!
                        </span>
                    </div>
                </form>
            </div>
        </section>
    );
};
