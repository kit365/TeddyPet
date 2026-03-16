import { apiApp } from "./index";
import type { ApiResponse } from "../types/common.type";
import type { BankInformationPayload, BankOption } from "../types/bank.type";

export const getBanks = async (): Promise<ApiResponse<BankOption[]>> => {
  const response = await apiApp.get("/api/banks");
  return response.data;
};

export const createGuestBankInformationByBookingCode = async (
  bookingCode: string,
  payload: BankInformationPayload
): Promise<ApiResponse<any>> => {
  const response = await apiApp.post(`/api/bank-information/booking/code/${bookingCode}`, payload);
  return response.data;
};

export type BookingBankInformationResponse = ApiResponse<{
  id: number;
  accountNumber: string;
  accountHolderName: string;
  bankCode: string;
  bankName: string;
  isVerify: boolean;
  isDefault: boolean;
  note?: string | null;
  bookingId?: number | null;
  userId?: string | null;
  userEmail?: string | null;
  createdAt?: string;
  updatedAt?: string;
} | null>;

export const getBankInformationByBookingCode = async (
  bookingCode: string
): Promise<BookingBankInformationResponse> => {
  const response = await apiApp.get(`/api/bank-information/booking/code/${bookingCode}`);
  return response.data;
};

/** Lấy thông tin chuyển khoản đã lưu theo email khách (guest) - dùng để pre-fill khi order/booking với cùng email */
export const getBankByGuestEmail = async (
  email: string
): Promise<ApiResponse<{
  id: number;
  accountNumber: string;
  accountHolderName: string;
  bankCode: string;
  bankName: string;
  isVerify: boolean;
  isDefault: boolean;
  note?: string | null;
  userEmail?: string | null;
} | null>> => {
  const response = await apiApp.get(`/api/bank-information/guest-by-email`, { params: { email: email.trim() } });
  return response.data;
};

export type OrderBankInformationResponse = ApiResponse<{
  id: number;
  accountNumber: string;
  accountHolderName: string;
  bankCode: string;
  bankName: string;
  isVerify: boolean;
  isDefault: boolean;
  note?: string | null;
  bookingId?: number | null;
  orderId?: string | null;
  accountType?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  vietqrImageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
} | null>;

/** Lấy bank info liên quan đến một order (dùng cho admin) */
export const getBankInformationByOrderId = async (
  orderId: string
): Promise<OrderBankInformationResponse> => {
  const response = await apiApp.get(`/api/bank-information/order/${orderId}`);
  return response.data;
};

export type BankInformationResponse = ApiResponse<{
  id: number;
  accountNumber: string;
  accountHolderName: string;
  bankCode: string;
  bankName: string;
  isVerify: boolean;
  isDefault: boolean;
  note?: string | null;
  bookingId?: number | null;
  userId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}[]>;

export const getMyBankInformation = async (): Promise<BankInformationResponse> => {
  const response = await apiApp.get("/api/bank-information/me");
  return response.data;
};

export const createMyBankInformation = async (
  payload: BankInformationPayload
): Promise<ApiResponse<any>> => {
  const response = await apiApp.post("/api/bank-information/me", payload);
  return response.data;
};

export const setMyDefaultBankInformation = async (
  id: number,
  isDefault: boolean
): Promise<ApiResponse<any>> => {
  const response = await apiApp.patch(`/api/bank-information/me/${id}/default`, { isDefault });
  return response.data;
};

