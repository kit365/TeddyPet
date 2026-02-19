/** Service category from API (client booking) */
export interface ServiceCategoryClient {
    categoryId: number;
    categoryName: string;
    slug: string;
    pricingModel?: string; // "per_day" | "per_session"
    description?: string;
    serviceType?: string;
    colorCode?: string;
    isActive: boolean;
}

/** Service from API (client booking) */
export interface ServiceClient {
    serviceId: number;
    serviceCategoryId: number;
    serviceName: string;
    code: string;
    duration: number; // minutes
    basePrice?: number;
    priceUnit?: string;
    suitablePetTypes?: string[];
    isActive: boolean;
}

/** One pet in booking form */
export interface BookingPetForm {
    id: string;
    petName: string;
    petType: string; // dog | cat | other
    weight?: string;
    notes?: string;
    /** Selected service id */
    serviceId: number | null;
    /** Category pricing model for selected service */
    pricingModel: "per_day" | "per_session" | null;
    /** per_day: drop-off and pick-up dates */
    dateFrom: string;
    dateTo: string;
    /** per_session: selected date and time slot */
    sessionDate: string;
    sessionSlot: string; // e.g. "08:00"
}
