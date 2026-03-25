export type EmployeeRole = "CARE" | "SPA";

export type EmployeeGlobalStatus = "READY" | "BUSY" | "OFF";

export interface EmployeeUser {
    id: number | string;
    fullName: string;
    avatarUrl?: string | null;
    positionName?: string | null;
    role: EmployeeRole;
    employmentType: "FULL_TIME" | "PART_TIME";
    todayCheckedIn: boolean;
    globalStatus: EmployeeGlobalStatus;
}

export type TaskBaseStatus = "PENDING" | "WAITING_STAFF" | "IN_PROGRESS" | "COMPLETED" | "PET_IN_HOTEL";

export interface BaseTask {
    id: number | string;
    title: string;
    description?: string | null;
    status: TaskBaseStatus;
    createdAt: string;
    scheduledStart?: string | null;
    scheduledEnd?: string | null;
    startedAt?: string | null;
    finishedAt?: string | null;
    /** Từ booking sau khi xếp ca & check-in */
    bookingCode?: string;
    /** Mở chi tiết: booking/detail/:bookingId/pet/:bookingPetId/service/:id (id = booking_pet_service) */
    bookingId?: number;
    bookingPetId?: number;
    customerName?: string;
    /**
     * Booking đã check-in tại lễ tân — chỉ khi true thì được bấm "Bắt đầu" xử lý dịch vụ.
     */
    bookingCheckedIn?: boolean;
    /** Từ BE: dịch vụ gắn phòng — chỉ "Bắt đầu", không "Hoàn thành" trên dashboard. */
    serviceRequiresRoom?: boolean;
    hasBeforePhotos?: boolean;
    hasDuringPhotos?: boolean;
    hasAfterPhotos?: boolean;
    beforePhotos?: string[];
    duringPhotos?: string[];
    afterPhotos?: string[];
}

export interface CareTask extends BaseTask {
    type: "CARE";
    cageNumber: string;
    petName: string;
    petSpecies: string;
    notes?: string | null;
}

export interface SpaTask extends BaseTask {
    type: "SPA";
    petName: string;
    petSpecies: string;
    serviceType: "SHOWER" | "HAIRCUT" | "NAIL" | "COMBO";
    bookingTime: string;
    durationMinutes: number;
}

export type EmployeeTask = CareTask | SpaTask;

