export interface BankOption {
  bankCode: string;
  bankName: string;
}

export interface BankInformationPayload {
  accountNumber: string;
  accountHolderName: string;
  bankCode: string;
  note?: string | null;
}

