import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import type { ApiResponse } from '../config/type';
import type {
    BookingResponse,
    BookingPetResponse,
    BookingPetServiceResponse,
    BookingPetServiceItemResponse,
    BookingPaymentTransactionResponse,
    CreateBookingPaymentTransactionRequest,
    BookingTransactionItemResponse,
    AdminCheckInRepricePreviewRequest,
    AdminCheckInRepricePreviewResponse,
  AdminCheckOutConfirmRequest,
} from '../../types/booking.type';

const BASE_URL = '/api/admin/bookings';

const withAuth = () => ({
    headers: {
        Authorization: `Bearer ${Cookies.get('tokenAdmin')}`,
    },
});

export const getAdminBookings = async (): Promise<ApiResponse<BookingResponse[]>> => {
    const response = await apiApp.get(BASE_URL, withAuth());
    return response.data;
};

export const getAdminBookingDetail = async (id: string | number): Promise<ApiResponse<BookingResponse>> => {
    const response = await apiApp.get(`${BASE_URL}/${id}`, withAuth());
    return response.data;
};

export const getAdminBookingPets = async (bookingId: string | number): Promise<ApiResponse<BookingPetResponse[]>> => {
    const response = await apiApp.get(`${BASE_URL}/${bookingId}/pets`, withAuth());
    return response.data;
};

export const getAdminBookingPetDetail = async (
    bookingId: string | number,
    petId: string | number
): Promise<ApiResponse<BookingPetResponse>> => {
    const response = await apiApp.get(`${BASE_URL}/${bookingId}/pets/${petId}`, withAuth());
    return response.data;
};

export const getAdminBookingPetServiceDetail = async (
    bookingId: string | number,
    petId: string | number,
    serviceId: string | number
): Promise<ApiResponse<BookingPetServiceResponse>> => {
    const response = await apiApp.get(
        `${BASE_URL}/${bookingId}/pets/${petId}/services/${serviceId}`,
        withAuth()
    );
    return response.data;
};

export interface AddChargeItemRequest {
    itemServiceId: number;
    chargeReason?: string | null;
    chargeEvidence?: string | null;
    chargedBy: string;
}

export const addAdminChargeItem = async (
    bookingId: string | number,
    petId: string | number,
    bookingPetServiceId: string | number,
    body: AddChargeItemRequest
): Promise<ApiResponse<BookingPetServiceItemResponse>> => {
    const response = await apiApp.post(
        `${BASE_URL}/${bookingId}/pets/${petId}/services/${bookingPetServiceId}/items`,
        body,
        withAuth()
    );
    return response.data;
};

export interface ApproveChargeItemRequest {
    chargeApprovedBy: string;
}

export const approveAdminChargeItem = async (
    bookingId: string | number,
    petId: string | number,
    bookingPetServiceId: string | number,
    itemId: string | number,
    body: ApproveChargeItemRequest
): Promise<ApiResponse<BookingPetServiceItemResponse>> => {
    const response = await apiApp.patch(
        `${BASE_URL}/${bookingId}/pets/${petId}/services/${bookingPetServiceId}/items/${itemId}/approve`,
        body,
        withAuth()
    );
    return response.data;
};

export interface ApproveCancelRequest {
    approved: boolean;
    staffNotes?: string;
    refundProof?: string;
}

export const approveOrRejectAdminCancelRequest = async (
    bookingId: string | number,
    body: ApproveCancelRequest
): Promise<ApiResponse<BookingResponse>> => {
    const response = await apiApp.patch(`${BASE_URL}/${bookingId}/cancel-request`, body, withAuth());
    return response.data;
};

export interface ConfirmBookingReadyPet {
    petId: number;
    petType: string;
    weightAtBooking: number;
}

export interface ConfirmBookingReadyRequest {
    pets: ConfirmBookingReadyPet[];
}

export const confirmAdminBookingReady = async (
    bookingId: string | number,
    body: ConfirmBookingReadyRequest
): Promise<ApiResponse<BookingResponse>> => {
    const response = await apiApp.patch(`${BASE_URL}/${bookingId}/confirm-ready`, body, withAuth());
    return response.data;
};

export const deleteAdminBooking = async (
    bookingId: string | number
): Promise<ApiResponse<any>> => {
    const response = await apiApp.delete(`${BASE_URL}/${bookingId}`, withAuth());
    return response.data;
};

export interface CancelAdminBookingRequest {
    reason?: string;
}

export const cancelAdminBooking = async (
    bookingId: string | number,
    body?: CancelAdminBookingRequest
): Promise<ApiResponse<BookingResponse>> => {
    const response = await apiApp.patch(`${BASE_URL}/${bookingId}/cancel`, body || {}, withAuth());
    return response.data;
};

export interface ConfirmFullPaymentRequest {
    paymentMethod: string;
    notes?: string;
}

export const confirmFullPayment = async (
    bookingId: string | number,
    body: ConfirmFullPaymentRequest
): Promise<ApiResponse<BookingResponse>> => {
    const response = await apiApp.patch(`${BASE_URL}/${bookingId}/confirm-payment`, body, withAuth());
    return response.data;
};

export const checkInBooking = async (bookingId: string | number): Promise<ApiResponse<BookingResponse>> => {
    const response = await apiApp.patch(`${BASE_URL}/${bookingId}/check-in`, {}, withAuth());
    return response.data;
};

export const previewCheckInReprice = async (
    bookingId: string | number,
    body: AdminCheckInRepricePreviewRequest
): Promise<ApiResponse<AdminCheckInRepricePreviewResponse>> => {
    const response = await apiApp.post(`${BASE_URL}/${bookingId}/check-in/reprice-preview`, body, withAuth());
    return response.data;
};

export const confirmCheckInWithReprice = async (
    bookingId: string | number,
    body: { pets: AdminCheckInRepricePreviewRequest["pets"]; staffNote?: string }
): Promise<ApiResponse<BookingResponse>> => {
    const response = await apiApp.post(`${BASE_URL}/${bookingId}/check-in/confirm`, body, withAuth());
    return response.data;
};

export const cancelBookingPetService = async (
    bookingId: string | number,
    bookingPetServiceId: string | number,
    cancelReason: string
): Promise<ApiResponse<BookingResponse>> => {
    const response = await apiApp.post(`${BASE_URL}/${bookingId}/pet-services/${bookingPetServiceId}/cancel`, { cancelReason }, withAuth());
    return response.data;
};

export const cancelBookingPetServiceItem = async (
    bookingId: string | number,
    itemId: string | number,
    cancelReason: string
): Promise<ApiResponse<BookingResponse>> => {
    const response = await apiApp.post(`${BASE_URL}/${bookingId}/pet-service-items/${itemId}/cancel`, { cancelReason }, withAuth());
    return response.data;
};

export const checkOutBooking = async (
    bookingId: string | number,
    body: AdminCheckOutConfirmRequest
): Promise<ApiResponse<BookingResponse>> => {
    const response = await apiApp.patch(`${BASE_URL}/${bookingId}/check-out`, body, withAuth());
    return response.data;
};

export const updateAdminBookingInternalNotes = async (
    bookingId: string | number,
    internalNotes: string | null
): Promise<ApiResponse<BookingResponse>> => {
    const response = await apiApp.patch(`${BASE_URL}/${bookingId}/internal-notes`, { internalNotes }, withAuth());
    return response.data;
};

export const getBookingPaymentTransactions = async (
    bookingId: string | number
): Promise<ApiResponse<BookingPaymentTransactionResponse[]>> => {
    const response = await apiApp.get(`${BASE_URL}/${bookingId}/payment-transactions`, withAuth());
    return response.data;
};

/** Danh sách giao dịch chi tiết: cọc + thanh toán hóa đơn, sắp xếp theo thời gian */
export const getBookingTransactions = async (
    bookingId: string | number
): Promise<ApiResponse<BookingTransactionItemResponse[]>> => {
    const response = await apiApp.get(`${BASE_URL}/${bookingId}/transactions`, withAuth());
    return response.data;
};

export const addBookingPaymentTransaction = async (
    bookingId: string | number,
    body: CreateBookingPaymentTransactionRequest
): Promise<ApiResponse<BookingPaymentTransactionResponse>> => {
    const response = await apiApp.post(`${BASE_URL}/${bookingId}/payment-transactions`, body, withAuth());
    return response.data;
};
