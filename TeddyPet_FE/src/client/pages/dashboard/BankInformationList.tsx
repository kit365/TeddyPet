import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { CreditCard, Pencil, QrCode, X, Info, Search, ChevronDown, Plus, BadgeCheck } from "lucide-react";
import { DashboardLayout } from "./sections/DashboardLayout";
import { useAuthStore } from "../../../stores/useAuthStore";
import {
  createMyBankInformation,
  getMyBankInformation,
  setMyDefaultBankInformation,
  updateMyBankInformation,
} from "../../../api/bank.api";
import { getVietQRBanks, type VietQRBank } from "../../../api/vietqr.api";
import type { BankInformationPayload } from "../../../types/bank.type";

type MyBankItem = {
  id: number;
  accountNumber: string;
  accountHolderName: string;
  bankCode: string;
  bankName: string;
  isVerify: boolean;
  isDefault: boolean;
  note?: string | null;
};

export const BankInformationListPage = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [banks, setBanks] = useState<MyBankItem[]>([]);
  const [vietQRBanks, setVietQRBanks] = useState<VietQRBank[]>([]);
  
  const [openForm, setOpenForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MyBankItem | null>(null);
  const [qrData, setQrData] = useState<MyBankItem | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BankInformationPayload>({
    accountNumber: "",
    accountHolderName: "",
    bankCode: "",
    note: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const breadcrumbs = [
    { label: "Trang chủ", to: "/" },
    { label: "Tài khoản", to: "/dashboard/profile" },
    { label: "Tài khoản ngân hàng", to: `/dashboard/bank-information` },
  ];

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [myRes, vqrRes] = await Promise.all([
        getMyBankInformation(),
        getVietQRBanks()
      ]);
      setBanks((myRes.data ?? []) as any);
      setVietQRBanks(vqrRes);
    } catch (e: any) {
      toast.error(e?.message ?? "Không thể tải thông tin ngân hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const sorted = useMemo(() => {
    return [...banks].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  }, [banks]);

  const filteredBanks = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return vietQRBanks;
    return vietQRBanks.filter(
      (b) =>
        b.shortName.toLowerCase().includes(term) ||
        b.code.toLowerCase().includes(term) ||
        b.name.toLowerCase().includes(term)
    );
  }, [searchTerm, vietQRBanks]);

  const selectedBank = useMemo(() => {
    return vietQRBanks.find(b => b.shortName.toLowerCase() === form.bankCode.toLowerCase() || b.code.toLowerCase() === form.bankCode.toLowerCase());
  }, [form.bankCode, vietQRBanks]);

  const handleEdit = (item: MyBankItem) => {
    setEditingItem(item);
    setForm({
      accountNumber: item.accountNumber,
      accountHolderName: item.accountHolderName.toUpperCase(),
      bankCode: item.bankCode,
      note: item.note || "",
    });
    setSearchTerm("");
    setShowAutocomplete(false);
    setOpenForm(true);
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setForm({
      accountNumber: "",
      accountHolderName: "",
      bankCode: "",
      note: "",
    });
    setSearchTerm("");
    setShowAutocomplete(false);
    setOpenForm(true);
  };

  if (!user) {
    return (
      <DashboardLayout pageTitle="Tài khoản" breadcrumbs={breadcrumbs}>
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-6">
          <div className="w-24 h-24 bg-sky-50 rounded-full flex items-center justify-center text-sky-600 animate-pulse">
            <CreditCard width={48} height={48} />
          </div>
          <div className="text-center">
            <p className="text-[2rem] font-black text-slate-800 tracking-tight">Vui lòng đăng nhập</p>
            <p className="text-slate-400 mt-2 font-medium">Bạn cần đăng nhập để quản lý tài khoản ngân hàng.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Tài khoản ngân hàng" breadcrumbs={breadcrumbs}>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[1.5rem] font-bold text-slate-800">
            Tài khoản ngân hàng
          </h1>
          <p className="text-[0.875rem] text-slate-500 font-medium mt-1 uppercase tracking-widest">
            Dùng cho hoàn tiền/đối soát khi cần
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-client-primary text-white rounded-xl font-bold text-sm hover:bg-client-secondary hover:shadow-md transition-all shadow-sm"
        >
          <Plus size={14} />
          Thêm tài khoản
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-[1.6rem] font-bold text-slate-300">Đang tải danh sách...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          {sorted.map((item) => (
            <div
              key={item.id}
              className={`group flex items-start w-full p-[16px] rounded-[12px] text-left transition-colors border relative ${item.isDefault ? 'border-[#00AB55] bg-[#F0FDF4] shadow-sm' : 'border-[#E5E8EB] bg-white hover:border-[#C4CDD5] hover:bg-[#F9FAFB]'}`}
            >
              <div className="flex items-start gap-[14px] w-full pr-[70px]">
                <div 
                  className="pt-[2px] cursor-pointer shrink-0" 
                  onClick={async () => {
                    if (!item.isDefault) {
                      try {
                        await setMyDefaultBankInformation(item.id, true);
                        toast.success("Đã đặt làm mặc định.");
                        fetchAll();
                      } catch (e: any) {
                        toast.error(e?.message ?? "Không thể đặt mặc định.");
                      }
                    }
                  }}
                >
                  <div className={`w-[20px] h-[20px] rounded-full border-[2px] flex items-center justify-center transition-colors ${item.isDefault ? 'border-[#00AB55]' : 'border-[#DFE3E8]'}`}>
                    {item.isDefault && (
                      <div className="w-[10px] h-[10px] rounded-full bg-[#00AB55]" />
                    )}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 leading-snug">
                  <div className="flex flex-wrap items-center gap-[6px] mb-[6px]">
                    <div className={`text-[15px] font-bold uppercase truncate ${item.isDefault ? 'text-[#00AB55]' : 'text-[#1C252E]'}`}>
                      {item.bankName} ({item.bankCode})
                    </div>
                    {item.isDefault && (
                      <span className="bg-[#00AB55]/10 text-[#00AB55] text-[10px] font-black px-2 py-[2px] rounded-full uppercase tracking-widest leading-none">
                        Mặc định
                      </span>
                    )}
                  </div>
                  
                  <div className="text-[13px] text-[#637381] truncate mb-[2px]">
                    <span className="font-semibold text-slate-800">Số TK:</span> {item.accountNumber} <span className="mx-1.5 text-[#E5E8EB]">|</span> <span className="font-semibold text-slate-800">Chủ TK:</span> <span className="font-semibold uppercase truncate">{item.accountHolderName}</span>
                  </div>
                  {item.note && (
                    <div className="text-[12px] text-[#919EAB] italic leading-relaxed truncate">
                      Ghi chú: {item.note}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="absolute right-[12px] top-[12px] flex items-center gap-1 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
                <button 
                  onClick={() => setQrData(item)}
                  className="p-1.5 text-[#637381] hover:text-[#00AB55] hover:bg-[#00AB55]/10 rounded-md transition-colors bg-white md:bg-transparent"
                  title="Hiện mã QR"
                >
                  <QrCode size={18} />
                </button>
                <button 
                  onClick={() => handleEdit(item)}
                  className="p-1.5 text-[#637381] hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors bg-white md:bg-transparent"
                  title="Chỉnh sửa"
                >
                  <Pencil size={18} />
                </button>
              </div>
            </div>
          ))}

          {sorted.length === 0 && (
            <div className="col-span-2 py-20 flex flex-col items-center gap-6 opacity-50">
              <CreditCard className="w-24 h-24 text-slate-300" />
              <p className="text-[1.8rem] font-bold text-slate-400">Bạn chưa lưu tài khoản ngân hàng nào.</p>
            </div>
          )}
        </div>
      )}

      {/* Form Modal (Create / Edit) */}
      {openForm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[720px] rounded-[18px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-[1.125rem] font-bold text-slate-900">
                  {editingItem ? "Chỉnh sửa tài khoản" : "Thêm tài khoản ngân hàng"}
                </div>
                <div className="text-[0.875rem] text-slate-500 mt-1 font-medium">
                  {editingItem ? "Cập nhật thông tin tài khoản của bạn." : "Vui lòng nhập chính xác để quá trình hoàn tiền diễn ra thuận lợi."}
                </div>
              </div>
              <button 
                onClick={() => setOpenForm(false)}
                className="p-2 hover:bg-white/50 rounded-full transition-colors text-[#9a3412]"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-[0.875rem] font-black text-slate-800 uppercase tracking-widest">Số tài khoản *</label>
                  <input
                    value={form.accountNumber}
                    onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))}
                    className="w-full rounded-[12px] border border-slate-200 bg-white px-4 py-2.5 text-[0.95rem] outline-none focus:border-client-primary transition-all"
                    placeholder="0123456789"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-[0.875rem] font-black text-slate-800 uppercase tracking-widest">Chủ tài khoản *</label>
                  <input
                    value={form.accountHolderName}
                    onChange={(e) => setForm((p) => ({ ...p, accountHolderName: e.target.value }))}
                    className="w-full rounded-[12px] border border-slate-200 bg-white px-4 py-2.5 text-[0.95rem] outline-none focus:border-client-primary transition-all"
                    placeholder="NGUYEN VAN A"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[0.875rem] font-black text-slate-800 uppercase tracking-widest">Ngân hàng *</label>
                <div className="relative">
                  <div 
                    className={`flex items-center justify-between w-full rounded-[12px] border border-slate-200 bg-white px-4 py-2.5 text-[0.95rem] cursor-pointer hover:border-client-primary transition-all ${showAutocomplete ? 'ring-2 ring-client-primary/20 border-client-primary' : ''}`}
                    onClick={() => setShowAutocomplete(!showAutocomplete)}
                  >
                    <div className="flex items-center gap-3 truncate">
                      {selectedBank ? (
                        <>
                          <img src={selectedBank.logo} alt={selectedBank.shortName} className="w-8 h-8 object-contain rounded-md" />
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="font-bold text-slate-800 shrink-0">{selectedBank.shortName}</span>
                            <span className="text-slate-400 font-medium truncate">— {selectedBank.name}</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-400">— Chọn ngân hàng —</span>
                      )}
                    </div>
                    <ChevronDown className={`shrink-0 text-slate-400 transition-transform ${showAutocomplete ? 'rotate-180' : ''}`} size={20} />
                  </div>

                  {showAutocomplete && (
                    <>
                      {/* Backdrop to close on click outside */}
                      <div className="fixed inset-0 z-[999]" onClick={() => setShowAutocomplete(false)} />
                      
                      <div className="absolute left-0 right-0 mt-2 z-[1000] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden flex flex-col max-h-[360px] animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-3 border-b border-slate-50 sticky top-0 bg-white z-10">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                              autoFocus
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              placeholder="Tìm tên, mã hoặc viết tắt..."
                              className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-[0.9rem] outline-none focus:ring-2 focus:ring-client-primary/10 transition-all"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto flex-1 py-1 scrollbar-hide">
                          {filteredBanks.length > 0 ? (
                            filteredBanks.map((b) => (
                              <div 
                                key={b.id}
                                className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-all hover:bg-slate-50 ${form.bankCode === b.shortName || form.bankCode === b.code ? 'bg-client-primary/5' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setForm(p => ({ ...p, bankCode: b.shortName, bankName: b.name }));
                                  setShowAutocomplete(false);
                                  setSearchTerm("");
                                }}
                              >
                                <img src={b.logo} alt={b.shortName} className="w-10 h-10 object-contain bg-white rounded-lg p-1 border border-slate-100" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-800 text-[0.95rem]">{b.shortName}</span>
                                    {b.transferSupported === 1 && (
                                      <span className="bg-emerald-50 text-emerald-600 text-[0.55rem] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">Nhanh 24/7</span>
                                    )}
                                  </div>
                                  <p className="text-[0.8rem] text-slate-400 truncate font-medium">{b.name}</p>
                                </div>
                                {(form.bankCode === b.shortName || form.bankCode === b.code) && (
                                  <BadgeCheck size={18} className="text-client-primary" />
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="py-10 text-center space-y-2">
                              <Info className="mx-auto text-slate-300" size={32} />
                              <p className="text-slate-400 font-medium italic">Không tìm thấy ngân hàng nào.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[0.875rem] font-black text-slate-800 uppercase tracking-widest">Ghi chú</label>
                <textarea
                  rows={3}
                  value={form.note ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                  className="w-full rounded-[12px] border border-slate-200 bg-white px-4 py-2.5 text-[0.95rem] outline-none focus:border-client-primary transition-all"
                />
              </div>



              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpenForm(false)}
                  className="rounded-[12px] border border-slate-200 bg-white px-6 py-2.5 text-[0.9rem] font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    const payload: BankInformationPayload = {
                      accountNumber: form.accountNumber.trim(),
                      accountHolderName: form.accountHolderName.trim(),
                      bankCode: form.bankCode.trim(),
                      note: (form.note ?? "").toString().trim() || null,
                    };
                    if (!payload.accountNumber || !payload.accountHolderName || !payload.bankCode) {
                      toast.error("Vui lòng nhập đủ số TK, chủ TK và ngân hàng.");
                      return;
                    }
                    try {
                      setSaving(true);
                      if (editingItem) {
                        await updateMyBankInformation(editingItem.id, payload);
                        toast.success("Đã cập nhật tài khoản ngân hàng.");
                      } else {
                        await createMyBankInformation(payload);
                        toast.success("Đã thêm tài khoản ngân hàng.");
                      }
                      setOpenForm(false);
                      fetchAll();
                    } catch (e: any) {
                      toast.error(e?.message ?? "Không thể lưu tài khoản.");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="rounded-[12px] bg-client-primary px-6 py-2.5 text-[0.9rem] font-bold text-white hover:bg-client-secondary disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-client-primary/20 transition-all active:scale-95"
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrData && (
        <QRModal 
          item={qrData} 
          banks={vietQRBanks} 
          onClose={() => setQrData(null)} 
        />
      )}
    </DashboardLayout>
  );
};

const QRModal = ({ item, banks, onClose }: { item: MyBankItem; banks: VietQRBank[]; onClose: () => void }) => {
  const bin = useMemo(() => {
    // Tìm BIN dựa trên bankCode (ví dụ: VCB, MBB...)
    // VietnamBankEnum: VCB -> MBB
    // VietQR: shortName (VCB, MB...), code (Vietcombank, MBBank...)
    // Thường shortName trùng với bankCode của hệ thống
    const found = banks.find(b => 
      b.shortName.toLowerCase() === item.bankCode.toLowerCase() || 
      b.code.toLowerCase() === item.bankCode.toLowerCase()
    );
    return found?.bin || "";
  }, [item.bankCode, banks]);

  const qrUrl = bin 
    ? `https://img.vietqr.io/image/${bin}-${item.accountNumber}-compact2.png?accountName=${encodeURIComponent(item.accountHolderName)}`
    : null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[420px] bg-white rounded-[24px] overflow-hidden shadow-2xl">
        <div className="bg-client-primary p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <QrCode size={24} />
            <h4 className="text-[1.1rem] font-black uppercase tracking-tight">Mã QR Thanh toán</h4>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-8 flex flex-col items-center">
          {qrUrl ? (
            <>
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 mb-6 shadow-inner">
                <img 
                  src={qrUrl} 
                  alt="VietQR" 
                  className="w-full aspect-square object-contain rounded-xl"
                  onLoad={() => console.log("QR Loaded")}
                />
              </div>
              <div className="text-center space-y-2">
                <p className="text-[1.2rem] font-bold text-slate-800">{item.bankName}</p>
                <p className="text-slate-500 font-medium">Số TK: <span className="text-slate-800 font-bold">{item.accountNumber}</span></p>
                <p className="text-slate-500 font-medium">Chủ TK: <span className="text-slate-800 font-bold uppercase">{item.accountHolderName}</span></p>
              </div>
            </>
          ) : (
            <div className="py-20 text-center">
              <Info className="mx-auto text-amber-500 mb-4" size={48} />
              <p className="text-slate-500 font-medium italic">Không thể khởi tạo mã QR cho ngân hàng này.</p>
            </div>
          )}
          
          <button 
            onClick={onClose}
            className="mt-8 w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

