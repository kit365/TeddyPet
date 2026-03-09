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
    depositId: number
): Promise<ConfirmBookingDepositResponse> => {
    const response = await apiApp.post<ConfirmBookingDepositResponse>(
        `/api/bookings/deposit-intent/${depositId}/confirm`,
        {}
    );
    return response.data;
};


