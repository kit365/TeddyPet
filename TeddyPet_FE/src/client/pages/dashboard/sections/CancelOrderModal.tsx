import { XmarkCircle, WarningCircle, InfoCircle } from "iconoir-react";
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
                        className="bg-white rounded-3xl p-6 max-w-sm w-full relative z-10 shadow-2xl border border-white/60 overflow-hidden"
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
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-tight">Hủy đơn hàng?</h3>
                            <p className="mt-1 text-[10px] font-bold text-slate-400 max-w-[220px] leading-relaxed">TeddyPet rất tiếc khi bạn muốn hủy đơn. Vui lòng cho chúng mình biết lý do nhé! 🐾</p>
                        </div>

                        {/* Reasons */}
                        <div className="mb-6 relative max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2 px-1">
                                <InfoCircle width={12} height={12} />
                                Lựa chọn lý do hủy:
                            </p>
                            <div className="space-y-1.5 px-0.5">
                                {quickReasons.map((reason, index) => {
                                    const isSelected = (reason === "Lý do khác" && isCustomReason) || cancelReason === reason;
                                    return (
                                        <motion.button
                                            key={index}
                                            whileHover={{ x: isSelected ? 0 : 4 }}
                                            whileTap={{ scale: 0.98 }}
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
                                            className={`w-full px-3 py-2.5 rounded-xl text-left transition-all border-2 flex items-center gap-2.5 ${isSelected
                                                ? 'border-rose-400 bg-rose-50 shadow-[0_4px_12px_-4px_rgba(244,63,94,0.1)]'
                                                : 'border-slate-50 hover:border-slate-100 bg-slate-50/20'
                                                }`}
                                        >
                                            <div className={`shrink-0 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                                                ? 'border-rose-500 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                                                : 'border-slate-200 bg-white'
                                                }`}>
                                                {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                            </div>
                                            <span className={`text-[12px] font-bold leading-tight tracking-tight ${isSelected ? 'text-rose-600' : 'text-slate-600'}`}>
                                                {reason}
                                            </span>
                                        </motion.button>
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
                                            className="w-full h-20 p-3 border-2 border-slate-100 rounded-xl text-[12px] font-bold text-slate-700 focus:border-rose-200 focus:bg-white focus:outline-none transition-all resize-none bg-slate-50/50 placeholder:text-slate-300 custom-scrollbar shadow-inner"
                                            maxLength={500}
                                            autoFocus
                                        />
                                        <div className="flex justify-between mt-2 px-1">
                                            <span className="text-[9px] font-bold text-slate-300 italic">Vui lòng nhập lý do hợp lệ ❤️</span>
                                            <span className="text-[9px] font-bold text-slate-300">{cancelReason.length}/500</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex gap-3 relative">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                disabled={isCancelling}
                                className="flex-1 h-10 bg-slate-100 text-slate-500 rounded-xl text-[11px] font-black hover:bg-slate-200 hover:text-slate-600 transition-all uppercase tracking-[0.1em] disabled:opacity-50"
                            >
                                Đóng
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleConfirm}
                                disabled={isCancelling || !cancelReason.trim() || (isCustomReason && cancelReason.length < 5)}
                                className="flex-[1.5] h-10 bg-rose-500 text-white rounded-xl text-[11px] font-black hover:bg-rose-600 shadow-lg shadow-rose-200/50 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 uppercase tracking-[0.1em] border-b-4 border-rose-700/20"
                            >
                                {isCancelling ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-[2px] border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Đang xử lý</span>
                                    </>
                                ) : (
                                    <>
                                        <WarningCircle width={16} height={16} />
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
