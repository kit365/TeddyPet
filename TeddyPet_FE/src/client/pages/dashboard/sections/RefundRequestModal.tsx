import { InfoCircle, CheckCircle, WarningCircle, Bank, User } from "iconoir-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getMyBankInformation, getBanks } from "../../../../api/bank.api";
import type { BankOption } from "../../../../types/bank.type";
import { toast } from "react-toastify";

interface RefundRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string, bankInfoId?: number, guestBank?: any) => void;
    isSubmitting: boolean;
    orderCode: string;
    isLoggedIn: boolean;
}

const refundReasons = [
    "Tôi đổi ý, không muốn mua nữa",
    "Tôi muốn thay đổi sản phẩm khác",
    "Tôi tìm được giá rẻ hơn",
    "Thời gian giao hàng quá lâu",
    "Tôi đặt nhầm số lượng",
    "Lý do khác"
];

export const RefundRequestModal = ({ isOpen, onClose, onConfirm, isSubmitting, orderCode, isLoggedIn }: RefundRequestModalProps) => {
    const [reason, setReason] = useState('');
    const [isCustomReason, setIsCustomReason] = useState(false);
    const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
    const [myBanks, setMyBanks] = useState<any[]>([]);
    const [allBanks, setAllBanks] = useState<BankOption[]>([]);
    const [isLoadingBanks, setIsLoadingBanks] = useState(false);

    // Guest bank info fields
    const [guestBankCode, setGuestBankCode] = useState('');
    const [guestAccountNumber, setGuestAccountNumber] = useState('');
    const [guestAccountHolderName, setGuestAccountHolderName] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchBanks();
            if (isLoggedIn) {
                fetchMyBanks();
            }
        }
    }, [isOpen, isLoggedIn]);

    const fetchBanks = async () => {
        try {
            const res = await getBanks();
            if (res.success) {
                setAllBanks(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch banks", error);
        }
    };

    const fetchMyBanks = async () => {
        setIsLoadingBanks(true);
        try {
            const res = await getMyBankInformation();
            if (res.success) {
                setMyBanks(res.data);
                const defaultBank = res.data.find((b: any) => b.isDefault);
                if (defaultBank) {
                    setSelectedBankId(defaultBank.id);
                } else if (res.data.length > 0) {
                    setSelectedBankId(res.data[0].id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch my banks", error);
        } finally {
            setIsLoadingBanks(false);
        }
    };

    const handleConfirm = () => {
        if (!reason.trim()) {
            toast.error("Vui lòng chọn hoặc nhập lý do hoàn tiền");
            return;
        }

        if (isLoggedIn) {
            if (!selectedBankId) {
                toast.error("Vui lòng chọn tài khoản ngân hàng để nhận hoàn tiền");
                return;
            }
            onConfirm(reason, selectedBankId);
        } else {
            if (!guestBankCode || !guestAccountNumber || !guestAccountHolderName) {
                toast.error("Vui lòng nhập đầy đủ thông tin ngân hàng");
                return;
            }
            onConfirm(reason, undefined, {
                bankCode: guestBankCode,
                accountNumber: guestAccountNumber,
                accountHolderName: guestAccountHolderName
            });
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[8px]" 
                        onClick={!isSubmitting ? onClose : undefined}
                    ></motion.div>
                    
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white rounded-3xl p-6 max-w-md w-full relative z-10 shadow-2xl border border-white/60 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl opacity-60 -mr-16 -mt-16"></div>
                        
                        <div className="flex flex-col items-center text-center mb-6 relative">
                            <motion.div 
                                initial={{ rotate: -10, scale: 0.8 }}
                                animate={{ rotate: 3, scale: 1 }}
                                className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4 shadow-inner border border-rose-100/50"
                            >
                                <WarningCircle width={28} height={28} />
                            </motion.div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-tight">Yêu cầu hoàn tiền</h3>
                            <p className="mt-1 text-[10px] font-bold text-slate-400 max-w-[280px] leading-relaxed">
                                Đơn hàng {orderCode} đã được thanh toán. 
                                TeddyPet sẽ kiểm tra và hoàn tiền cho bạn trong vòng 24-48h làm việc. 🐾
                            </p>
                        </div>

                        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar pb-4">
                            {/* Refund Reason Selection */}
                            <section>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <InfoCircle width={14} height={14} />
                                    Lý do hoàn tiền:
                                </p>
                                <div className="grid grid-cols-1 gap-2">
                                    {refundReasons.map((r, idx) => {
                                        const isSelected = (r === "Lý do khác" && isCustomReason) || reason === r;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    if (r === "Lý do khác") {
                                                        setIsCustomReason(true);
                                                        setReason('');
                                                    } else {
                                                        setIsCustomReason(false);
                                                        setReason(r);
                                                    }
                                                }}
                                                className={`px-3 py-2.5 rounded-xl text-left transition-all border-2 flex items-center gap-2.5 ${isSelected
                                                    ? 'border-rose-400 bg-rose-50'
                                                    : 'border-slate-50 hover:border-slate-100 bg-slate-50/20'
                                                    }`}
                                            >
                                                <div className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-rose-500 bg-rose-500' : 'border-slate-200 bg-white'}`}>
                                                    {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                                </div>
                                                <span className={`text-[12px] font-bold ${isSelected ? 'text-rose-600' : 'text-slate-600'}`}>{r}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {isCustomReason && (
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Nhập lý do cụ thể..."
                                        className="mt-2 w-full h-20 p-3 border-2 border-slate-100 rounded-xl text-[12px] font-bold text-slate-700 focus:border-rose-200 focus:outline-none transition-all resize-none bg-slate-50/50"
                                    />
                                )}
                            </section>

                            <div className="h-px bg-slate-100 mx-4"></div>

                            {/* Bank Information Selection */}
                            <section>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Bank width={14} height={14} />
                                    Thông tin nhận hoàn tiền:
                                </p>
                                
                                {isLoggedIn ? (
                                    isLoadingBanks ? (
                                        <div className="py-4 flex justify-center"><div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div></div>
                                    ) : myBanks.length > 0 ? (
                                        <div className="space-y-2">
                                            {myBanks.map((bank) => (
                                                <button
                                                    key={bank.id}
                                                    onClick={() => setSelectedBankId(bank.id)}
                                                    className={`w-full p-3 rounded-xl border-2 transition-all flex items-start gap-3 ${selectedBankId === bank.id ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-50 bg-slate-50/20'}`}
                                                >
                                                    <div className={`mt-1 shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedBankId === bank.id ? 'border-indigo-500 bg-indigo-500' : 'border-slate-200 bg-white'}`}>
                                                        {selectedBankId === bank.id && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="text-[12px] font-black text-slate-700">{bank.bankName}</div>
                                                        <div className="text-[11px] font-bold text-slate-500">{bank.accountNumber} - {bank.accountHolderName}</div>
                                                    </div>
                                                </button>
                                            ))}
                                            <p className="text-[9px] font-bold text-slate-400 italic mt-2">* Thông tin ngân hàng của bạn được bảo mật tuyệt đối.</p>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-center">
                                            <p className="text-[11px] font-bold text-orange-600">Bạn chưa lưu tài khoản ngân hàng nào. Vui lòng thêm trong phần quản lý tài khoản hoặc điền thông tin bên dưới.</p>
                                        </div>
                                    )
                                ) : (
                                    /* Manual Bank Entry for Guests */
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block px-1">Ngân hàng</label>
                                            <select 
                                                value={guestBankCode}
                                                onChange={(e) => setGuestBankCode(e.target.value)}
                                                className="w-full h-10 px-3 rounded-xl border-2 border-slate-50 bg-slate-50/50 text-[12px] font-bold text-slate-700 focus:border-indigo-200 focus:outline-none"
                                            >
                                                <option value="">Chọn ngân hàng</option>
                                                {allBanks.map(b => (
                                                    <option key={b.bankCode} value={b.bankCode}>{b.bankName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block px-1">Số tài khoản</label>
                                            <div className="relative">
                                                <input 
                                                    type="text"
                                                    value={guestAccountNumber}
                                                    onChange={(e) => setGuestAccountNumber(e.target.value)}
                                                    placeholder="VD: 12345678"
                                                    className="w-full h-10 px-3 pr-10 rounded-xl border-2 border-slate-50 bg-slate-50/50 text-[12px] font-bold text-slate-700 focus:border-indigo-200 focus:outline-none"
                                                />
                                                <Bank className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" width={16} height={16} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block px-1">Tên chủ tài khoản (Viết hoa không dấu)</label>
                                            <div className="relative">
                                                <input 
                                                    type="text"
                                                    value={guestAccountHolderName}
                                                    onChange={(e) => setGuestAccountHolderName(e.target.value.toUpperCase())}
                                                    placeholder="VD: NGUYEN VAN A"
                                                    className="w-full h-10 px-3 pr-10 rounded-xl border-2 border-slate-50 bg-slate-50/50 text-[12px] font-bold text-slate-700 focus:border-indigo-200 focus:outline-none"
                                                />
                                                <User className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" width={16} height={16} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-50">
                            <button
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="flex-1 h-11 bg-slate-100 text-slate-500 rounded-2xl text-[12px] font-black hover:bg-slate-200 transition-all uppercase tracking-wider"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isSubmitting}
                                className="flex-[1.5] h-11 bg-rose-500 text-white rounded-2xl text-[12px] font-black hover:bg-rose-600 shadow-lg shadow-rose-200/50 transition-all flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <CheckCircle width={18} height={18} />
                                        Gửi yêu cầu
                                    </>
                                )}
                            </button>
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
            `}</style>
        </AnimatePresence>
    );
};
