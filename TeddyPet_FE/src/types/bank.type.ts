export interface BankOption {
  bankCode: string;
  bankName: string;
}

export interface BankInformationPayload {
  accountNumber: string;
  accountHolderName: string;
  bankCode: string;
  note?: string | null;
  /** Tên ngân hàng (hiển thị/ghi log, backend có thể suy từ bankCode) */
  bankName?: string | null;
  /** Email khách để lần sau dùng cùng email order/booking thì hiển thị lại thông tin chuyển khoản */
  userEmail?: string | null;
}

