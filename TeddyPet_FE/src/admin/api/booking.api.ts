import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import type { ApiResponse } from '../config/type';
import type { BookingResponse, BookingPetResponse, BookingPetServiceResponse } from '../../types/booking.type';

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


