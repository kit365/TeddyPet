import { apiApp } from ".";
import type { ApiResponse } from "../types/common.type";
import Cookies from "js-cookie";

const BASE_URL = '/api';

const withAuth = () => ({
    headers: { Authorization: `Bearer ${Cookies.get('token')}` }
});

const withAdminAuth = () => {
    const token = Cookies.get('tokenAdmin');
    if (!token) {
        return {};
    }
    return { headers: { Authorization: `Bearer ${token}` } };
};

// TYPES — khớp BookingRefundResponse (BE)
export interface BookingRefundResponse {
    id: number;
    status: string;
    requestedAmount: number;
    currency?: string;
    customerReason?: string;
    evidenceUrls?: string;
    adminDecisionNote?: string | null;
    processedBy?: string | null;
    refundTransactionId?: string | null;
    adminEvidenceUrls?: string[];
    createdAt?: string;
    processedAt?: string | null;
    refundCompletedAt?: string | null;
}

export interface BookingRefundRequest {
    requestedAmount: number;
    reason: string;
    bankInformationId?: number | null;
    evidenceUrls?: string[];
}

export interface AdminHandleBookingRefundRequest {
    approved: boolean;
    adminNote?: string;
    refundTransactionId?: string;
    adminEvidenceUrls?: string[];
}

// CLIENT APIs — khớp BookingRefundClientController
export const createBookingRefundRequest = async (bookingId: number, data: BookingRefundRequest): Promise<ApiResponse<BookingRefundResponse>> => {
    const res = await apiApp.post(`${BASE_URL}/booking-refunds/${bookingId}`, data, withAuth());
    return res.data;
};

export const getBookingRefundRequests = async (bookingId: number): Promise<ApiResponse<BookingRefundResponse[]>> => {
    const res = await apiApp.get(`${BASE_URL}/booking-refunds/booking/${bookingId}`, withAuth());
    return res.data;
};

/** Lịch sử hoàn tiền theo mã đặt lịch — public (không cần JWT), dùng trên màn chi tiết đơn tra cứu bằng mã. */
export const getBookingRefundRequestsByBookingCode = async (
    bookingCode: string
): Promise<ApiResponse<BookingRefundResponse[]>> => {
    const res = await apiApp.get(`${BASE_URL}/bookings/code/${encodeURIComponent(bookingCode)}/refunds`);
    return res.data;
};

// ADMIN APIs — khớp BookingRefundAdminController
export const handleBookingRefundRequest = async (refundId: number, data: AdminHandleBookingRefundRequest): Promise<ApiResponse<BookingRefundResponse>> => {
    const res = await apiApp.put(`${BASE_URL}/admin/booking-refunds/${refundId}/handle`, data, withAdminAuth());
    return res.data;
};

export const getAdminBookingRefundRequests = async (bookingId: number | string): Promise<ApiResponse<BookingRefundResponse[]>> => {
    const res = await apiApp.get(`${BASE_URL}/admin/booking-refunds/booking/${bookingId}`, withAdminAuth());
    return res.data;
};
