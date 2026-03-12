import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import type { ApiResponse } from '../config/type';
import type {
    BookingResponse,
    BookingPetResponse,
    BookingPetServiceResponse,
    BookingPetServiceItemResponse,
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
}

export const approveOrRejectAdminCancelRequest = async (
    bookingId: string | number,
    body: ApproveCancelRequest
): Promise<ApiResponse<BookingResponse>> => {
    const response = await apiApp.patch(`${BASE_URL}/${bookingId}/cancel-request`, body, withAuth());
    return response.data;
};


