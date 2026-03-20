import { XmarkCircle, InfoCircle } from "iconoir-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CancelOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    isCancelling: boolean;
}

const quickReasons = [
    "Tôi đối ý, không muốn mua nữa",
    "Tôi muốn thay đổi sản phẩm khác",
    "Tôi tìm được giá rẻ hơn",
    "Thời gian giao hàng quá lâu",
    "Tôi đặt nhầm số lượng",
    "Lý do khác"
];

export const CancelOrderModal = ({ isOpen, onClose, onConfirm, isCancelling }: CancelOrderModalProps) => {
    const [cancelReason, setCancelReason] = useState('');
    const [isCustomReason, setIsCustomReason] = useState(false);

    const handleConfirm = () => {
        if (cancelReason.trim()) {
            onConfirm(cancelReason);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[8px]" 
                        onClick={!isCancelling ? onClose : undefined}
                    ></motion.div>
                    
                    {/* Modal Content */}
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white rounded-3xl p-7 max-w-[600px] w-full relative z-10 shadow-2xl border border-white/60 overflow-hidden"
                    >
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl opacity-60 -mr-16 -mt-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-50 rounded-full blur-3xl opacity-40 -ml-12 -mb-12"></div>

                        {/* Header */}
                        <div className="flex flex-col items-center text-center mb-8 relative">
                            <motion.div 
                                initial={{ rotate: -10, scale: 0.8 }}
                                animate={{ rotate: 3, scale: 1 }}
                                className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4 shadow-inner border border-rose-100/50"
                            >
                                <XmarkCircle width={28} height={28} />
                            </motion.div>
                            <h3 className="text-[18px] font-bold text-slate-800 leading-tight">HỦY ĐƠN HÀNG?</h3>
                            <p className="mt-[2px] text-[13px] text-slate-500 max-w-[280px] leading-relaxed mx-auto">TeddyPet rất tiếc khi bạn muốn hủy đơn. Vui lòng cho chúng mình biết lý do nhé! 🐾</p>
                        </div>

                        {/* Reasons */}
                        <div className="mb-6 relative max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                            <p className="text-[14px] font-bold text-slate-500 mb-[12px] flex items-center gap-2">
                                <InfoCircle width={16} height={16} />
                                Lựa chọn lý do hủy:
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-1 gap-[12px] px-[2px]">
                                {quickReasons.map((reason, index) => {
                                    const isSelected = (reason === "Lý do khác" && isCustomReason) || cancelReason === reason;
                                    return (
                                        <button
                                            key={index}
                                            disabled={isCancelling}
                                            onClick={() => {
                                                if (reason === "Lý do khác") {
                                                    setIsCustomReason(true);
                                                    setCancelReason('');
                                                } else {
                                                    setIsCustomReason(false);
                                                    setCancelReason(reason);
                                                }
                                            }}
                                            className={`w-full p-[16px] rounded-[12px] text-left transition-colors border flex items-start gap-[12px] disabled:opacity-50 disabled:cursor-not-allowed ${isSelected
                                                ? 'border-rose-500 bg-rose-50'
                                                : 'border-[#E5E8EB] bg-white hover:border-[#C4CDD5] hover:bg-[#F9FAFB]'
                                                }`}
                                        >
                                            <div className={`shrink-0 w-[20px] h-[20px] rounded-full border-[2px] flex items-center justify-center transition-colors mt-[2px] ${isSelected ? 'border-rose-500 bg-rose-500' : 'border-[#DFE3E8] bg-white'}`}>
                                                {isSelected && <div className="w-[8px] h-[8px] bg-white rounded-full"></div>}
                                            </div>
                                            <span className={`flex-1 text-[14px] font-bold leading-snug ${isSelected ? 'text-rose-600' : 'text-[#637381]'}`}>
                                                {reason}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Custom Textarea */}
                            <AnimatePresence>
                                {isCustomReason && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mt-3 overflow-hidden"
                                    >
                                        <textarea
                                            value={cancelReason}
                                            onChange={(e) => setCancelReason(e.target.value)}
                                            placeholder="Chia sẻ lý do cụ thể với chúng mình..."
                                            className="w-full h-20 p-3.5 border border-[#DFE3E8] rounded-[12px] text-[14px] font-medium text-[#1C252E] focus:border-rose-500 focus:bg-white focus:outline-none transition-all resize-none bg-white placeholder:text-[#919EAB] custom-scrollbar"
                                            maxLength={500}
                                            autoFocus
                                        />
                                        <div className="flex justify-between mt-2 px-1">
                                            <span className="text-[12px] font-medium text-slate-400 italic">Vui lòng nhập lý do hợp lệ ❤️</span>
                                            <span className="text-[12px] font-medium text-slate-400">{cancelReason.length}/500</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex gap-[16px] relative px-[2px] pb-[8px]">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                disabled={isCancelling}
                                className="flex-1 py-[12px] bg-transparent text-[#637381] rounded-[12px] text-[14px] font-bold hover:bg-[#F4F6F8] hover:border-[#C4CDD5] border border-[#E5E8EB] transition-colors disabled:opacity-50"
                            >
                                Đóng
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleConfirm}
                                disabled={isCancelling || !cancelReason.trim() || (isCustomReason && cancelReason.length < 5)}
                                className="flex-[1.2] py-[12px] bg-rose-500 text-white rounded-[12px] text-[14px] font-bold hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:bg-[#E5E8EB] disabled:text-[#919EAB] flex items-center justify-center gap-2"
                            >
                                {isCancelling ? (
                                    <>
                                        <div className="w-[20px] h-[20px] border-[2px] border-current border-t-transparent rounded-full animate-spin"></div>
                                        <span>Đang xử lý</span>
                                    </>
                                ) : (
                                    <>
                                        Xác nhận hủy
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #F1F5F9;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #E2E8F0;
                }
            `}</style>
        </AnimatePresence>
    );
};
