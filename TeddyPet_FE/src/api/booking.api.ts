import { apiApp } from "./index";
import type { ApiResponse } from "../types/common.type";
import type { BookingPetForm, PetFoodBroughtItemForm } from "../types/booking.type";
import type { BookingStep1FormData } from "../client/pages/booking/Booking";

export interface CreateBookingPetServicePayload {
    serviceId: number;
    requiresRoom: boolean;
    /** Dịch vụ lưu trú: ngày nhận / trả và phòng */
    checkInDate?: string | null;
    checkOutDate?: string | null;
    roomId?: number | null;
    /** Dịch vụ không yêu cầu phòng: label khung giờ "HH:mm - HH:mm" */
    sessionSlotLabel?: string | null;
    /** Id khung giờ (time_slots) → BE tăng currentBookings, dùng version để kiểm soát đồng thời */
    timeSlotId?: number | null;
    /** Id dịch vụ add-on (isAddon=true) kèm theo → booking_pet_service_items */
    addonServiceIds?: number[];
}

export interface CreateBookingPetFoodItemPayload {
    foodBroughtType?: string | null;
    foodBrand?: string | null;
    quantity?: number | null;
    feedingInstructions?: string | null;
}

export interface CreateBookingPetPayload {
    petName: string;
    petType: string;
    weightAtBooking?: number | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    petConditionNotes?: string | null;
    /** Danh sách thức ăn mang theo (bảng pet_food_brought). Có thể rỗng. */
    foodItems?: CreateBookingPetFoodItemPayload[];
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

function buildPetFoodItems(pet: BookingPetForm): CreateBookingPetFoodItemPayload[] {
    if (pet.foodItems && pet.foodItems.length > 0) {
        return pet.foodItems
            .filter((item) => (item.foodBroughtType ?? "").trim() !== "")
            .map((item) => ({
                foodBroughtType: item.foodBroughtType?.trim() ?? null,
                foodBrand: item.foodBrand?.trim() || null,
                quantity: item.quantity ?? null,
                feedingInstructions: item.feedingInstructions?.trim() || null,
            }));
    }
    if (pet.foodBrought && (pet.foodBroughtType?.length || pet.feedingInstructions)) {
        return [
            {
                foodBroughtType: pet.foodBroughtType?.length ? pet.foodBroughtType.join(", ") : null,
                foodBrand: null,
                quantity: null,
                feedingInstructions: pet.feedingInstructions ?? null,
            },
        ];
    }
    return [];
}

function toPetServicePayload(svc: {
    serviceId: number | null;
    dateFrom?: string;
    dateTo?: string;
    selectedRoomId?: number | null;
    sessionSlot?: string;
    sessionDate?: string;
    sessionSlotLabel?: string;
    sessionTimeSlotId?: number | null;
    addonServiceIds?: number[];
}): CreateBookingPetServicePayload | null {
    if (svc.serviceId == null) return null;
    const requiresRoom = !!(svc.selectedRoomId != null && svc.selectedRoomId !== 0);
    const addonIds = svc.addonServiceIds?.filter((id) => id != null) ?? [];
    if (requiresRoom) {
        return {
            serviceId: svc.serviceId,
            requiresRoom: true,
            checkInDate: svc.dateFrom || null,
            checkOutDate: svc.dateTo || null,
            roomId: svc.selectedRoomId ?? null,
            addonServiceIds: addonIds.length > 0 ? addonIds : undefined,
        };
    }
    return {
        serviceId: svc.serviceId,
        requiresRoom: false,
        checkInDate: svc.sessionDate || svc.dateFrom || null,
        checkOutDate: svc.dateTo || null,
        sessionSlotLabel: svc.sessionSlotLabel ?? svc.sessionSlot ?? null,
        timeSlotId: svc.sessionTimeSlotId ?? null,
        addonServiceIds: addonIds.length > 0 ? addonIds : undefined,
    };
}

export const buildCreateBookingPayload = (
    customer: BookingStep1FormData,
    pets: BookingPetForm[]
): CreateBookingRequest => {
    const bookingPets: CreateBookingPetPayload[] = pets
        .map((pet) => {
            const mainService = toPetServicePayload({
                serviceId: pet.serviceId,
                dateFrom: pet.dateFrom,
                dateTo: pet.dateTo,
                selectedRoomId: pet.selectedRoomId,
                sessionSlot: pet.sessionSlot,
                sessionDate: pet.sessionDate,
                sessionSlotLabel: pet.sessionSlotLabel,
                sessionTimeSlotId: pet.sessionTimeSlotId,
                addonServiceIds: pet.addonServiceIds,
            });
            const additional = (pet.additionalServices ?? [])
                .filter((svc) => svc.serviceId != null)
                .map((svc) =>
                    toPetServicePayload({
                        serviceId: svc.serviceId,
                        dateFrom: svc.dateFrom,
                        dateTo: svc.dateTo,
                        selectedRoomId: svc.selectedRoomId,
                        sessionSlot: svc.sessionSlot,
                        sessionDate: svc.sessionDate,
                        sessionSlotLabel: svc.sessionSlotLabel,
                        sessionTimeSlotId: svc.sessionTimeSlotId,
                        addonServiceIds: svc.addonServiceIds,
                    })
                )
                .filter((p): p is CreateBookingPetServicePayload => p != null);

            const seen = new Set<number>();
            const services: CreateBookingPetServicePayload[] = [];
            for (const s of [mainService, ...additional]) {
                if (s && !seen.has(s.serviceId)) {
                    seen.add(s.serviceId);
                    services.push(s);
                }
            }

            if (services.length === 0) return null;

            const foodItems = buildPetFoodItems(pet);

            return {
                petName: pet.petName.trim() || "Thú cưng",
                petType: pet.petType,
                weightAtBooking: pet.weight ? Number(pet.weight) || null : null,
                emergencyContactName: pet.emergencyContactName ?? null,
                emergencyContactPhone: pet.emergencyContactPhone ?? null,
                petConditionNotes: pet.notes ?? null,
                foodItems: foodItems.length > 0 ? foodItems : undefined,
                services,
            } as CreateBookingPetPayload | null;
        })
        .filter((p): p is CreateBookingPetPayload => p !== null);

    return {
        customerName: customer.fullName,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerAddress: customer.address || null,
        note: customer.message || null,
        bookingType: "ONLINE",
        pets: bookingPets,
    };
};
