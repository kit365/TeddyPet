import { apiApp } from "./index";
import type { ApiResponse } from "../types/common.type";
import type { BookingPetForm, BookingPetServiceForm } from "../types/booking.type";
import type { BookingStep1FormData } from "../client/pages/booking/Booking";

export interface CreateBookingPetServicePayload {
    serviceId: number;
    requiresRoom: boolean;
    /** Dịch vụ lưu trú: ngày nhận / trả và phòng */
    checkInDate?: string | null;
    checkOutDate?: string | null;
    roomId?: number | null;
    /** Dịch vụ không yêu cầu phòng: label khung giờ */
    sessionSlotLabel?: string | null;
}

export interface CreateBookingPetPayload {
    petName: string;
    petType: string;
    weightAtBooking?: number | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    petConditionNotes?: string | null;
    /** Mỗi phần tử tương ứng một booking_pet_service (cùng booking_id và booking_pet_id ở BE) */
    services: CreateBookingPetServicePayload[];
}

export interface CreateBookingRequest {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress?: string | null;
    note?: string | null;
    /** Ví dụ: HOTEL_DOG | HOTEL_CAT | SPA_CARE. Tạm thời gửi SPA_CARE. */
    bookingType: string;
    /** Danh sách thú cưng + dịch vụ; BE sẽ map sang BookingPet + BookingPetService */
    pets: CreateBookingPetPayload[];
}

export type CreateBookingResponse = ApiResponse<{
    bookingCode: string;
}>;

export const createBookingFromClient = async (
    payload: CreateBookingRequest
): Promise<CreateBookingResponse> => {
    const response = await apiApp.post<CreateBookingResponse>("/api/bookings", payload);
    return response.data;
};

export const buildCreateBookingPayload = (
    customer: BookingStep1FormData,
    pets: BookingPetForm[]
): CreateBookingRequest => {
    const bookingPets: CreateBookingPetPayload[] = pets
        .map((pet) => {
            const services: CreateBookingPetServicePayload[] = (pet.services ?? [])
                .filter((svc: BookingPetServiceForm) => svc.serviceId != null)
                .map((svc): CreateBookingPetServicePayload => {
                    const requiresRoom = !!svc.selectedRoomId;
                    if (requiresRoom) {
                        return {
                            serviceId: svc.serviceId as number,
                            requiresRoom: true,
                            checkInDate: svc.checkInDate || null,
                            checkOutDate: svc.checkOutDate || null,
                            roomId: svc.selectedRoomId ?? null,
                        };
                    }
                    return {
                        serviceId: svc.serviceId as number,
                        requiresRoom: false,
                        checkInDate: svc.checkInDate || null,
                        sessionSlotLabel: svc.sessionSlot || null,
                    };
                });

            if (services.length === 0) return null;

            return {
                petName: pet.petName.trim() || "Thú cưng",
                petType: pet.petType,
                weightAtBooking: pet.weight ? Number(pet.weight) || null : null,
                emergencyContactName: pet.emergencyContactName ?? null,
                emergencyContactPhone: pet.emergencyContactPhone ?? null,
                petConditionNotes: pet.notes ?? null,
                services,
            } satisfies CreateBookingPetPayload;
        })
        .filter((p): p is CreateBookingPetPayload => p !== null);

    return {
        customerName: customer.fullName,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerAddress: customer.address || null,
        note: customer.message || null,
        bookingType: "SPA_CARE",
        pets: bookingPets,
    };
};

