import { InfoCircle, WarningCircle, Bank, RefreshDouble } from "iconoir-react";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getMyBankInformation, getBanks } from "../../../../api/bank.api";
import type { BankOption } from "../../../../types/bank.type";
import { toast } from "react-toastify";

export interface RefundHistoryItem {
    id: number;
    status: string;
    adminDecisionNote?: string | null;
    processedAt?: string | null;
    createdAt: string;
    customerReason?: string;
    adminEvidenceUrls?: string[];
}

interface RefundRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string, bankInfoId?: number, guestBank?: any) => void;
    onUpdate?: (refundId: number, data: { reason?: string; bankInformationId?: number; bankCode?: string; accountNumber?: string; accountHolderName?: string; evidenceUrls?: string[] }) => void;
    isSubmitting: boolean;
    orderCode: string;
    isLoggedIn: boolean;
    initialRefundRequest?: any;
    /** Lịch sử yêu cầu hoàn tiền (để hiển thị lý do từ chối / cần bổ sung) */
    refundHistory?: RefundHistoryItem[];
}

const refundReasons = [
    "Tôi đổi ý, không muốn mua nữa",
    "Tôi muốn thay đổi sản phẩm khác",
    "Tôi tìm được giá rẻ hơn",
    "Thời gian giao hàng quá lâu",
    "Tôi đặt nhầm số lượng",
    "Lý do khác"
];

export const RefundRequestModal = ({ isOpen, onClose, onConfirm, onUpdate, isSubmitting, orderCode, isLoggedIn, initialRefundRequest, refundHistory = [] }: RefundRequestModalProps) => {
    const [reason, setReason] = useState(initialRefundRequest?.customerReason || '');
    const [isCustomReason, setIsCustomReason] = useState(false);
    const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
    const [myBanks, setMyBanks] = useState<any[]>([]);
    const [allBanks, setAllBanks] = useState<BankOption[]>([]);
    const [isLoadingBanks, setIsLoadingBanks] = useState(false);

    // Guest bank info fields
    const [guestBankCode, setGuestBankCode] = useState(initialRefundRequest?.bankCode || '');
    const [guestAccountNumber, setGuestAccountNumber] = useState(initialRefundRequest?.accountNumber || '');
    const [guestAccountHolderName, setGuestAccountHolderName] = useState(initialRefundRequest?.accountHolderName || '');
    /** Logged-in user có thể chọn "nhập tài khoản mới" thay vì chọn từ danh sách */
    const [useManualBank, setUseManualBank] = useState(false);
    const [step, setStep] = useState<1 | 2 | 3>(1);

    const selectedBankDisplay = useMemo(() => {
        if (isLoggedIn && !useManualBank && selectedBankId) {
            return myBanks.find(b => b.id === selectedBankId);
        }
        if (guestBankCode && guestAccountNumber) {
            const bankName = allBanks.find(b => b.bankCode === guestBankCode)?.bankName || guestBankCode;
            return {
                bankName,
                accountNumber: guestAccountNumber,
                accountHolderName: guestAccountHolderName
            };
        }
        return null;
    }, [isLoggedIn, useManualBank, selectedBankId, myBanks, guestBankCode, guestAccountNumber, guestAccountHolderName, allBanks]);

    useEffect(() => {
        if (isOpen) {
            fetchBanks();
            if (isLoggedIn) {
                fetchMyBanks();
            }

            if (initialRefundRequest) {
                setReason(initialRefundRequest.customerReason || '');
                setGuestBankCode(initialRefundRequest.bankCode || '');
                setGuestAccountNumber(initialRefundRequest.accountNumber || '');
                setGuestAccountHolderName(initialRefundRequest.accountHolderName || '');
                if (initialRefundRequest.bankInformationId != null) {
                    setSelectedBankId(initialRefundRequest.bankInformationId);
                }
                if (initialRefundRequest.bankCode && initialRefundRequest.accountNumber) {
                    setUseManualBank(true);
                }
                if (initialRefundRequest.customerReason && !refundReasons.includes(initialRefundRequest.customerReason)) {
                    setIsCustomReason(true);
                }
            } else {
                setUseManualBank(false);
            }
        }
    }, [isOpen, isLoggedIn, initialRefundRequest]);

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
                if (res.data.length === 0) {
                    setUseManualBank(true);
                } else {
                    const defaultBank = res.data.find((b: any) => b.isDefault);
                    if (defaultBank) {
                        setSelectedBankId(defaultBank.id);
                    } else {
                        setSelectedBankId(res.data[0].id);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch my banks", error);
            setUseManualBank(true);
        } finally {
            setIsLoadingBanks(false);
        }
    };

    const hasValidGuestBank = Boolean(guestBankCode?.trim() && guestAccountNumber?.trim() && guestAccountHolderName?.trim());

    const handleNextStep = () => {
        if (step === 1) {
            if (!reason.trim()) {
                toast.error("Vui lòng chọn hoặc nhập lý do hoàn tiền");
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (isLoggedIn) {
                if (useManualBank) {
                    if (!hasValidGuestBank) {
                        toast.error("Vui lòng nhập đầy đủ thông tin ngân hàng nhận hoàn tiền");
                        return;
                    }
                } else {
                    if (!selectedBankId) {
                        toast.error("Vui lòng chọn tài khoản ngân hàng để nhận hoàn tiền");
                        return;
                    }
                }
            } else {
                if (!hasValidGuestBank) {
                    toast.error("Vui lòng nhập đầy đủ thông tin ngân hàng");
                    return;
                }
            }
            setStep(3);
        }
    };

    const handleBackStep = () => {
        if (step > 1) {
            setStep((prev) => (prev - 1) as 1 | 2 | 3);
        } else {
            onClose();
        }
    };

    const handleConfirm = () => {
        if (initialRefundRequest && onUpdate) {
            if (isLoggedIn) {
                if (useManualBank) {
                    onUpdate(initialRefundRequest.id, {
                        reason: reason.trim(),
                        bankCode: guestBankCode,
                        accountNumber: guestAccountNumber,
                        accountHolderName: guestAccountHolderName
                    });
                } else {
                    onUpdate(initialRefundRequest.id, {
                        reason: reason.trim(),
                        bankInformationId: selectedBankId!
                    });
                }
            } else {
                onUpdate(initialRefundRequest.id, {
                    reason: reason.trim(),
                    bankCode: guestBankCode,
                    accountNumber: guestAccountNumber,
                    accountHolderName: guestAccountHolderName
                });
            }
        } else {
            if (isLoggedIn) {
                if (useManualBank || myBanks.length === 0) {
                    onConfirm(reason, undefined, {
                        bankCode: guestBankCode,
                        accountNumber: guestAccountNumber,
                        accountHolderName: guestAccountHolderName
                    });
                } else {
                    onConfirm(reason, selectedBankId!);
                }
            } else {
                onConfirm(reason, undefined, {
                    bankCode: guestBankCode,
                    accountNumber: guestAccountNumber,
                    accountHolderName: guestAccountHolderName
                });
            }
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
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[4px]" 
                        onClick={!isSubmitting ? onClose : undefined}
                    ></motion.div>
                    
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        className="bg-white rounded-[24px] max-w-[600px] w-full relative z-10 shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex flex-col items-center text-center mt-8 mb-8 relative">
                            <motion.div 
                                initial={{ rotate: -10, scale: 0.8 }}
                                animate={{ rotate: 3, scale: 1 }}
                                className="w-14 h-14 bg-[#FFF5D1] text-[#FFAB00] rounded-2xl flex items-center justify-center mb-4 shadow-inner border border-[#FFE27D]"
                            >
                                <RefreshDouble width={28} height={28} strokeWidth={2.5} />
                            </motion.div>
                            <h3 className="text-[18px] font-bold text-slate-800 leading-tight uppercase">YÊU CẦU HOÀN TIỀN?</h3>
                            <p className="mt-[2px] text-[13px] text-slate-500 max-w-[280px] leading-relaxed mx-auto">Vui lòng kiểm tra kỹ thông tin hoàn tiền để chúng mình hỗ trợ bạn nhanh nhất nhé! <br /> Mã đơn: <strong className="text-slate-700">#{orderCode}</strong></p>
                        </div>

                        <div className="px-[32px] py-[16px] max-h-[60vh] overflow-y-auto custom-scrollbar flex flex-col gap-[16px]">
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className="space-y-5"
                                    >
                                        {/* Phản hồi admin */}
                                        {refundHistory.filter(r => r.status === "REJECTED" || r.status === "ACTION_REQUIRED").length > 0 && (
                                            <section className="space-y-2">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2 px-1">
                                                    <WarningCircle width={12} height={12} className="text-amber-500" />
                                                    Phản hồi từ TeddyPet
                                                </p>
                                                <div className="space-y-2">
                                                    {refundHistory
                                                        .filter(r => r.status === "REJECTED" || r.status === "ACTION_REQUIRED")
                                                        .map((r) => (
                                                            <div
                                                                key={r.id}
                                                                className={`rounded-xl border p-3 text-left ${
                                                                    r.status === "REJECTED"
                                                                        ? "border-red-100 bg-red-50/20"
                                                                        : "border-amber-100 bg-amber-50/20"
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between mb-1.5">
                                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                                                        r.status === "REJECTED" ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                                                                    }`}>
                                                                        {r.status === "REJECTED" ? "Từ chối" : "Cần bổ sung"}
                                                                    </span>
                                                                    <span className="text-[9px] font-bold text-slate-400">
                                                                        {r.processedAt
                                                                            ? new Date(r.processedAt).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
                                                                            : new Date(r.createdAt).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                                {r.adminDecisionNote && (
                                                                    <p className="text-[11px] font-bold text-slate-700 leading-snug italic">
                                                                        "{r.adminDecisionNote}"
                                                                    </p>
                                                                )}
                                                                {r.adminEvidenceUrls && r.adminEvidenceUrls.length > 0 && (
                                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                                        {r.adminEvidenceUrls.map((url, i) => (
                                                                            <a
                                                                                key={i}
                                                                                href={url}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 shadow-sm hover:scale-105 transition-all"
                                                                            >
                                                                                <img src={url} alt="Bằng chứng từ admin" className="w-full h-full object-cover" />
                                                                            </a>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                </div>
                                            </section>
                                        )}

                                        {/* Reasons */}
                                        <section>
                                            <p className="text-[14px] font-bold text-[#637381] mb-[12px]">
                                                Lý do hoàn tiền
                                            </p>
                                            <div className="grid grid-cols-2 md:grid-cols-1 gap-[12px]">
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
                                                            className={`w-full p-[16px] rounded-[12px] text-left transition-colors border flex items-start gap-[12px] ${
                                                                r === "Lý do khác" ? "col-span-2 md:col-span-1" : ""
                                                            } ${isSelected
                                                                ? 'border-[#00AB55] bg-[#F0FDF4]'
                                                                : 'border-[#E5E8EB] bg-white hover:border-[#C4CDD5] hover:bg-[#F9FAFB]'
                                                                }`}
                                                        >
                                                            <div className={`shrink-0 w-[20px] h-[20px] rounded-full border-[2px] flex items-center justify-center transition-colors mt-[2px] ${isSelected ? 'border-[#00AB55] bg-[#00AB55]' : 'border-[#DFE3E8] bg-white group-hover:border-[#919EAB]'}`}>
                                                                {isSelected && <div className="w-[8px] h-[8px] bg-white rounded-full"></div>}
                                                            </div>
                                                            <span className={`flex-1 text-[14px] font-bold leading-snug ${isSelected ? 'text-[#1C252E]' : 'text-[#637381]'}`}>{r}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <AnimatePresence>
                                                {isCustomReason && (
                                                    <motion.div 
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="mt-[12px] overflow-hidden"
                                                    >
                                                        <textarea
                                                            value={reason}
                                                            onChange={(e) => setReason(e.target.value)}
                                                            placeholder="Chia sẻ lý do cụ thể với chúng mình..."
                                                            className="w-full h-20 p-[14px] border border-[#DFE3E8] rounded-[12px] text-[14px] font-medium text-[#1C252E] focus:border-[#00AB55] focus:bg-white focus:outline-none transition-all resize-none bg-white placeholder:text-[#919EAB] custom-scrollbar"
                                                            maxLength={500}
                                                            autoFocus
                                                        />
                                                        <div className="flex justify-between mt-2 px-1">
                                                            <span className="text-[12px] font-medium text-slate-400 italic">Vui lòng nhập lý do hợp lệ ❤️</span>
                                                            <span className="text-[12px] font-medium text-slate-400">{reason.length}/500</span>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </section>

                                    </motion.div>
                                )}
                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="space-y-5"
                                    >
                                        {/* Bank */}
                                        <section className="mb-[8px]">
                                            <div className="mb-[12px]">
                                                <p className="text-[14px] font-bold text-[#637381] mb-[4px]">
                                                    Tài khoản nhận tiền
                                                </p>
                                                <p className="text-[13px] text-[#919EAB]">Vui lòng kiểm tra kỹ STK/Chủ thẻ.</p>
                                            </div>
                                            {isLoggedIn ? (
                                                isLoadingBanks ? (
                                                    <div className="py-[24px] flex justify-center">
                                                        <div className="w-[24px] h-[24px] border-[2px] border-[#E5E8EB] border-t-[#00AB55] rounded-full animate-spin"></div>
                                                    </div>
                                                ) : myBanks.length > 0 && !useManualBank ? (
                                                    <div className="flex flex-col gap-[8px]">
                                                        {myBanks.map((bank) => (
                                                            <button
                                                                key={bank.id}
                                                                onClick={() => setSelectedBankId(bank.id)}
                                                                className={`w-full p-[16px] rounded-[12px] border flex items-center gap-[12px] transition-colors ${selectedBankId === bank.id ? 'border-[#00AB55] bg-[#F0FDF4]' : 'border-[#E5E8EB] bg-white hover:border-[#C4CDD5] hover:bg-[#F9FAFB]'}`}
                                                            >
                                                                <div className={`shrink-0 w-[20px] h-[20px] rounded-full border-[2px] flex items-center justify-center transition-colors ${selectedBankId === bank.id ? 'border-[#00AB55] bg-[#00AB55]' : 'border-[#DFE3E8] bg-white'}`}>
                                                                    {selectedBankId === bank.id && <div className="w-[8px] h-[8px] bg-white rounded-full"></div>}
                                                                </div>
                                                                <div className={`shrink-0 w-[36px] h-[36px] rounded-[8px] flex items-center justify-center font-bold text-[13px] uppercase ${selectedBankId === bank.id ? 'bg-[#00AB55] text-white' : 'bg-[#1C252E] text-white'}`}>
                                                                    {bank.bankName?.substring(0, 2) || (bank.accountHolderName?.substring(0, 2))}
                                                                </div>
                                                                <div className="text-left flex-1 min-w-0 leading-snug">
                                                                    <div className={`text-[14px] font-bold uppercase truncate ${selectedBankId === bank.id ? 'text-[#00AB55]' : 'text-[#1C252E]'}`}>{bank.bankName}</div>
                                                                    <div className="text-[13px] text-[#637381] truncate">{bank.accountNumber} - <span className="font-semibold uppercase">{bank.accountHolderName}</span></div>
                                                                </div>
                                                            </button>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={() => setUseManualBank(true)}
                                                            className="w-full py-[14px] rounded-[12px] border border-dashed border-[#DFE3E8] text-[#637381] text-[14px] font-bold hover:border-[#919EAB] hover:text-[#1C252E] hover:bg-[#F9FAFB] transition-colors flex items-center justify-center gap-[8px]"
                                                        >
                                                            + Nhập tài khoản khác
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-[12px]">
                                                        {myBanks.length > 0 && (
                                                            <button onClick={() => setUseManualBank(false)} className="text-[13px] font-bold text-[#637381] hover:text-[#1C252E] transition-colors self-start">
                                                               ← Quay lại tài khoản đã lưu
                                                            </button>
                                                        )}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                                                            <div className="sm:col-span-2">
                                                                <label className="block mb-1.5 text-[11px] font-black text-slate-800 uppercase tracking-widest">Ngân hàng *</label>
                                                                <select 
                                                                    value={guestBankCode}
                                                                    onChange={(e) => setGuestBankCode(e.target.value)}
                                                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] font-bold text-slate-800 outline-none focus:border-client-primary focus:bg-white transition-all appearance-none cursor-pointer"
                                                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 16px center', backgroundRepeat: 'no-repeat', backgroundSize: '16px' }}
                                                                >
                                                                    <option value="">— Chọn ngân hàng —</option>
                                                                    {allBanks.map(b => (
                                                                        <option key={b.bankCode} value={b.bankCode}>{b.bankName}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block mb-1.5 text-[11px] font-black text-slate-800 uppercase tracking-widest">Số tài khoản *</label>
                                                                <input 
                                                                    type="text"
                                                                    value={guestAccountNumber}
                                                                    onChange={(e) => setGuestAccountNumber(e.target.value)}
                                                                    placeholder="VD: 0123456789"
                                                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] font-bold text-slate-800 outline-none focus:border-client-primary focus:bg-white transition-all tracking-wider"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block mb-1.5 text-[11px] font-black text-slate-800 uppercase tracking-widest">Chủ tài khoản *</label>
                                                                <input 
                                                                    type="text"
                                                                    value={guestAccountHolderName}
                                                                    onChange={(e) => setGuestAccountHolderName(e.target.value.toUpperCase())}
                                                                    placeholder="VD: NGUYEN VAN A"
                                                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] font-bold text-slate-800 outline-none focus:border-client-primary focus:bg-white transition-all uppercase"
                                                                />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                                                    <div className="sm:col-span-2">
                                                        <label className="block mb-1.5 text-[11px] font-black text-slate-800 uppercase tracking-widest">Ngân hàng *</label>
                                                        <select value={guestBankCode} onChange={(e) => setGuestBankCode(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] font-bold text-slate-800 outline-none focus:border-client-primary focus:bg-white transition-all appearance-none cursor-pointer" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 16px center', backgroundRepeat: 'no-repeat', backgroundSize: '16px' }}>
                                                            <option value="">— Chọn ngân hàng —</option>
                                                            {allBanks.map(b => (<option key={b.bankCode} value={b.bankCode}>{b.bankName}</option>))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block mb-1.5 text-[11px] font-black text-slate-800 uppercase tracking-widest">Số tài khoản *</label>
                                                        <input type="text" value={guestAccountNumber} onChange={(e) => setGuestAccountNumber(e.target.value)} placeholder="VD: 0123456789" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] font-bold text-slate-800 outline-none focus:border-client-primary focus:bg-white transition-all tracking-wider" />
                                                    </div>
                                                    <div>
                                                        <label className="block mb-1.5 text-[11px] font-black text-slate-800 uppercase tracking-widest">Chủ tài khoản *</label>
                                                        <input type="text" value={guestAccountHolderName} onChange={(e) => setGuestAccountHolderName(e.target.value.toUpperCase())} placeholder="VD: NGUYEN VAN A" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] font-bold text-slate-800 outline-none focus:border-client-primary focus:bg-white transition-all uppercase" />
                                                    </div>
                                                </div>
                                            )}
                                        </section>
                                    </motion.div>
                                )}
                                {step === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="py-2 space-y-5"
                                    >
                                        <div className="text-center mb-[16px]">
                                            <div className="w-[48px] h-[48px] bg-[#FFF7ED] text-[#FFAB00] rounded-full flex items-center justify-center mx-auto mb-[12px] border border-[#FED7AA]">
                                                <Bank width={24} height={24} />
                                            </div>
                                            <h4 className="text-[16px] font-bold text-[#1C252E] leading-tight">Xác nhận thông tin</h4>
                                            <p className="text-[13px] text-[#919EAB] mt-[4px]">Vui lòng kiểm tra lại tài khoản nhận tiền.</p>
                                        </div>

                                        <div className="flex flex-col md:flex-row gap-[16px] mb-[16px]">
                                            <div className="flex-1 p-[16px] bg-[#F0FDF4] border border-[#bbf7d0] rounded-[12px] relative shadow-sm">
                                                <div className="mb-2">
                                                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Tài khoản nhận</span>
                                                </div>
                                                <p className="text-[13px] mb-[4px] text-[#1C252E] flex items-center justify-between">
                                                    <span className="text-slate-500">Ngân hàng:</span> 
                                                    <strong className="font-bold text-[#00AB55] uppercase">{selectedBankDisplay?.bankName || selectedBankDisplay?.bankCode}</strong>
                                                </p>
                                                <div className="h-px w-full bg-[#bbf7d0]/50 my-2"></div>
                                                <p className="text-[13px] mb-[4px] text-[#1C252E] flex items-center justify-between">
                                                    <span className="text-slate-500">Số tài khoản:</span> 
                                                    <strong className="font-bold text-[15px]">{selectedBankDisplay?.accountNumber}</strong>
                                                </p>
                                                <div className="h-px w-full bg-[#bbf7d0]/50 my-2"></div>
                                                <p className="text-[13px] text-[#1C252E] flex items-center justify-between">
                                                    <span className="text-slate-500">Chủ TK:</span> 
                                                    <strong className="font-bold uppercase tracking-wide">{selectedBankDisplay?.accountHolderName}</strong>
                                                </p>
                                            </div>
                                            {(() => {
                                                const bin = selectedBankDisplay?.bankCode;
                                                const qrUrl = bin && selectedBankDisplay?.accountNumber && selectedBankDisplay?.accountHolderName
                                                    ? `https://img.vietqr.io/image/${bin}-${selectedBankDisplay.accountNumber}-compact2.png?accountName=${encodeURIComponent(selectedBankDisplay.accountHolderName)}`
                                                    : null;

                                                return qrUrl ? (
                                                    <div className="w-full md:w-[120px] h-[120px] p-[4px] bg-white border border-[#E5E8EB] rounded-[12px] flex items-center justify-center overflow-hidden shadow-sm">
                                                        <img src={qrUrl} alt="VietQR" className="w-full h-full object-contain mix-blend-multiply" />
                                                    </div>
                                                ) : (
                                                    <div className="w-full md:w-[120px] h-[120px] p-[8px] bg-white border border-[#E5E8EB] rounded-[12px] flex items-center justify-center">
                                                        <div className="text-[10px] font-bold text-[#637381] text-center">Chưa có<br/>VietQR</div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <div className="p-[12px] bg-[#FFF4E5] rounded-[12px] border border-[#FFAB00] text-[13px] font-semibold text-[#B76E00] flex gap-[8px] items-start">
                                            <InfoCircle width={16} height={16} className="shrink-0 mt-[2px]" />
                                            <p>TeddyPet không hỗ trợ nếu bạn cung cấp sai thông tin ngân hàng.</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex gap-[16px] relative px-[32px] pb-[32px]">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleBackStep}
                                disabled={isSubmitting}
                                className="flex-1 py-[12px] bg-transparent text-[#637381] rounded-[12px] text-[14px] font-bold hover:bg-[#F4F6F8] hover:border-[#C4CDD5] border border-[#E5E8EB] transition-colors disabled:opacity-50 appearance-none flex items-center justify-center"
                            >
                                {step === 1 ? 'Đóng' : 'Quay lại'}
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={step === 3 ? handleConfirm : handleNextStep}
                                disabled={isSubmitting || (step === 1 && !reason.trim() && !isCustomReason)}
                                className="flex-[1.2] py-[12px] bg-[#00AB55] text-white rounded-[12px] text-[14px] font-bold hover:bg-[#007B55] transition-colors disabled:opacity-50 disabled:bg-[#E5E8EB] disabled:text-[#919EAB] flex items-center justify-center gap-2 appearance-none shadow-[0_8px_16px_rgba(0,171,85,0.24)] hover:shadow-[0_12px_20px_rgba(0,171,85,0.32)] disabled:shadow-none"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-[20px] h-[20px] border-[2px] border-current border-t-transparent rounded-full animate-spin"></div>
                                        <span>Đang xử lý</span>
                                    </>
                                ) : (
                                    <span>{step === 3 ? 'Gửi yêu cầu' : 'Tiếp tục'}</span>
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E2E8F0;
                    border-radius: 10px;
                }
                @keyframes scaleIn {
                    from { transform: scale(0); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scaleIn {
                    animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
            `}</style>
        </AnimatePresence>
    );
};
