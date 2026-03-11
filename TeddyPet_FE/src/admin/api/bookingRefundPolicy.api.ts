import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import type { ApiResponse } from '../config/type';
import type { BookingDepositRefundPolicy } from '../../types/bookingRefundPolicy.type';
import type { BookingResponse } from '../../types/booking.type';

const withAuth = () => ({
    headers: {
        Authorization: `Bearer ${Cookies.get('tokenAdmin')}`,
    },
});

const POLICIES_URL = '/api/admin/booking-deposit-refund-policies';
const BOOKINGS_URL = '/api/admin/bookings';

export const getAdminBookingDepositRefundPolicies = async (): Promise<ApiResponse<BookingDepositRefundPolicy[]>> => {
    const response = await apiApp.get(POLICIES_URL, withAuth());
    return response.data;
};

export const updateAdminBookingDepositRefundPolicy = async (
    bookingId: string | number,
    refundPolicyId: number
): Promise<ApiResponse<BookingResponse>> => {
    const response = await apiApp.patch(
        `${BOOKINGS_URL}/${bookingId}/deposit/refund-policy`,
        { refundPolicyId },
        withAuth()
    );
    return response.data;
};

