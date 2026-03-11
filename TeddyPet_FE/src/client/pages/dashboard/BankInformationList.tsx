import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { CreditCard, BadgeCheck, BadgeX } from "lucide-react";
import { DashboardLayout } from "./sections/DashboardLayout";
import { useAuthStore } from "../../../stores/useAuthStore";
import {
  createMyBankInformation,
  getBanks,
  getMyBankInformation,
  setMyDefaultBankInformation,
} from "../../../api/bank.api";
import type { BankInformationPayload, BankOption } from "../../../types/bank.type";

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
  const [bankOptions, setBankOptions] = useState<BankOption[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BankInformationPayload>({
    accountNumber: "",
    accountHolderName: "",
    bankCode: "",
    note: "",
  });

  const breadcrumbs = [
    { label: "Trang chủ", to: "/" },
    { label: "Tài khoản", to: "/dashboard/profile" },
    { label: "Tài khoản ngân hàng", to: `/dashboard/bank-information` },
  ];

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [myRes, bankRes] = await Promise.all([getMyBankInformation(), getBanks()]);
      setBanks((myRes.data ?? []) as any);
      setBankOptions(bankRes.data ?? []);
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
      <div className="flex justify-between items-end border-b border-slate-100 pb-8 mb-10">
        <div>
          <h3 className="text-[2.8rem] font-black text-slate-800 tracking-tight italic flex items-center gap-3">
            Tài khoản ngân hàng
          </h3>
          <p className="text-[1.2rem] text-slate-400 font-medium mt-1 uppercase tracking-widest">
            Dùng cho hoàn tiền/đối soát khi cần
          </p>
        </div>
        <button
          onClick={() => setOpenCreate(true)}
          className="flex items-center gap-2 bg-client-primary text-white px-8 py-3.5 rounded-2xl font-black text-[1.1rem] uppercase tracking-widest hover:bg-client-secondary transition-all shadow-xl shadow-client-primary/20"
        >
          + Thêm tài khoản
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-[1.6rem] font-bold text-slate-300">Đang tải danh sách...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-8">
          {sorted.map((item) => (
            <div
              key={item.id}
              className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-8 transition-all hover:shadow-2xl hover:shadow-client-primary/5 hover:-translate-y-1"
            >
              {item.isDefault && (
                <div className="absolute top-6 right-6 bg-emerald-50 text-emerald-600 text-[1.1rem] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-emerald-100">
                  Mặc định
                </div>
              )}
              <div className="flex items-start gap-5">
                <div className="mt-1">
                  <input
                    type="radio"
                    name="bank_default"
                    className="appearance-none w-6 h-6 border-2 border-slate-200 rounded-full checked:border-client-primary checked:border-[6px] transition-all cursor-pointer bg-white"
                    checked={item.isDefault}
                    onChange={async () => {
                      try {
                        await setMyDefaultBankInformation(item.id, true);
                        toast.success("Đã đặt làm mặc định.");
                        fetchAll();
                      } catch (e: any) {
                        toast.error(e?.message ?? "Không thể đặt mặc định.");
                      }
                    }}
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[1.8rem] text-slate-800 font-bold">
                      {item.bankName} ({item.bankCode})
                    </div>
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[1.1rem] font-black uppercase tracking-widest border ${
                        item.isVerify
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-amber-50 text-amber-700 border-amber-100"
                      }`}
                    >
                      {item.isVerify ? <BadgeCheck size={16} /> : <BadgeX size={16} />}
                      {item.isVerify ? "Đã xác thực" : "Chưa xác thực"}
                    </div>
                  </div>
                  <div className="text-[1.5rem] text-slate-500 font-medium">
                    <span className="font-black text-slate-700">Số TK:</span> {item.accountNumber}
                  </div>
                  <div className="text-[1.5rem] text-slate-500 font-medium">
                    <span className="font-black text-slate-700">Chủ TK:</span> {item.accountHolderName}
                  </div>
                  {item.note ? (
                    <div className="text-[1.4rem] text-slate-400 italic leading-relaxed">
                      Ghi chú: {item.note}
                    </div>
                  ) : null}
                </div>
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

      {openCreate && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[720px] rounded-[18px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden">
            <div className="px-6 py-5 bg-[#fff7ed] border-b border-[#fed7aa]">
              <div className="text-[1.8rem] font-black text-[#9a3412]">Thêm tài khoản ngân hàng</div>
              <div className="text-[1.25rem] text-slate-500 mt-1">
                Tài khoản do bạn tạo sẽ cần nhân viên xác thực.
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-[1.3rem] font-black text-slate-800">Số tài khoản *</label>
                  <input
                    value={form.accountNumber}
                    onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))}
                    className="w-full rounded-[12px] border border-slate-200 bg-white px-4 py-3 text-[1.4rem] outline-none focus:border-client-primary"
                    placeholder="0123456789"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-[1.3rem] font-black text-slate-800">Chủ tài khoản *</label>
                  <input
                    value={form.accountHolderName}
                    onChange={(e) => setForm((p) => ({ ...p, accountHolderName: e.target.value }))}
                    className="w-full rounded-[12px] border border-slate-200 bg-white px-4 py-3 text-[1.4rem] outline-none focus:border-client-primary"
                    placeholder="NGUYEN VAN A"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[1.3rem] font-black text-slate-800">Ngân hàng *</label>
                <select
                  value={form.bankCode}
                  onChange={(e) => setForm((p) => ({ ...p, bankCode: e.target.value }))}
                  className="w-full rounded-[12px] border border-slate-200 bg-white px-4 py-3 text-[1.4rem] outline-none focus:border-client-primary"
                >
                  <option value="">— Chọn ngân hàng —</option>
                  {bankOptions.map((b) => (
                    <option key={b.bankCode} value={b.bankCode}>
                      {b.bankCode} — {b.bankName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-[1.3rem] font-black text-slate-800">Ghi chú</label>
                <textarea
                  rows={3}
                  value={form.note ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                  className="w-full rounded-[12px] border border-slate-200 bg-white px-4 py-3 text-[1.4rem] outline-none focus:border-client-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpenCreate(false)}
                  className="rounded-[14px] border border-slate-200 bg-white px-6 py-3 text-[1.3rem] font-black text-slate-600 hover:bg-slate-50"
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
                      await createMyBankInformation(payload);
                      toast.success("Đã thêm tài khoản ngân hàng.");
                      setOpenCreate(false);
                      setForm({ accountNumber: "", accountHolderName: "", bankCode: "", note: "" });
                      fetchAll();
                    } catch (e: any) {
                      toast.error(e?.message ?? "Không thể thêm tài khoản.");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="rounded-[14px] bg-client-primary px-6 py-3 text-[1.3rem] font-black text-white hover:bg-client-secondary disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

