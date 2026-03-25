import { apiApp } from "./index";
import type { ApiResponse } from "../types/common.type";
import type { CreateBookingRequest } from "./booking.api";

export type CreateBookingDepositIntentResponse = ApiResponse<{
    depositId: number;
    expiresAt: string;
    bookingId: number;
    bookingCode: string;
}>;

export type ConfirmBookingDepositResponse = ApiResponse<{
    bookingCode: string;
}>;

export type CreateBookingDepositPayosUrlResponse = ApiResponse<{
    depositId: number;
    payosOrderCode: number;
    checkoutUrl: string;
    expiresAt: string;
    bookingId: number;
    bookingCode: string;
}>;

export const createBookingDepositIntent = async (
    payload: CreateBookingRequest
): Promise<CreateBookingDepositIntentResponse> => {
    const response = await apiApp.post<CreateBookingDepositIntentResponse>(
        "/api/bookings/deposit-intent",
        payload
    );
    return response.data;
};

export const confirmBookingDeposit = async (
    depositId: number,
    paymentMethod?: string
): Promise<ConfirmBookingDepositResponse> => {
    const url = paymentMethod
        ? `/api/bookings/deposit-intent/${depositId}/confirm?paymentMethod=${paymentMethod}`
        : `/api/bookings/deposit-intent/${depositId}/confirm`;
    const response = await apiApp.post<ConfirmBookingDepositResponse>(url, {});
    return response.data;
};

export const createBookingDepositPayosUrl = async (
    depositId: number,
    returnUrl?: string
): Promise<CreateBookingDepositPayosUrlResponse> => {
    const response = await apiApp.post<CreateBookingDepositPayosUrlResponse>(
        `/api/bookings/deposit-intent/${depositId}/payos`,
        null,
        { params: returnUrl ? { returnUrl } : undefined }
    );
    return response.data;
};


