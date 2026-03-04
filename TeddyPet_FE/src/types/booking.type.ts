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

/** Admin/API: booking status */
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

/** Admin/API: booking type (dịch vụ) */
export type BookingServiceType =
  | "HOTEL_DOG"
  | "HOTEL_CAT"
  | "SPA_CARE";

/** Admin/API: payment status */
export type PaymentStatus =
  | "PENDING"
  | "PARTIAL"
  | "PAID"
  | "REFUNDED";

/** Admin/API: payment method (booking: chỉ CASH và BANK_TRANSFER) */
export type PaymentMethod = "CASH" | "BANK_TRANSFER";

/** Admin/API: BookingPet (matches booking_pets table) */
export interface BookingPetResponse {
  id: number;
  bookingId: number;
  petProfileId?: number;
  petName: string;
  petType: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  weightAtBooking?: number;
  petConditionNotes?: string;
  healthIssues?: string;
  arrivalCondition?: string;
  departureCondition?: string;
  arrivalPhotos?: string;
  departurePhotos?: string;
  belongingPhotos?: string;
  foodBrought?: boolean | string;
  foodBroughtType?: string | string[] | null;
  feedingInstructions?: string;
  services?: BookingPetServiceResponse[];
}

/** Admin/API: BookingPetService (matches booking_pet_services table) */
export interface BookingPetServiceResponse {
  id: number;
  bookingPetId: number;
  assignedStaffId?: number;
  serviceId?: number;
  serviceComboId?: number;
  timeSlotId?: number;
  roomId?: number;
  duringPhotos?: string;
  afterPhotos?: string;
  beforePhotos?: string;
  videos?: string;
  checkInDate?: string;
  checkoutDate?: string;
  numberOfNights?: number;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  unitPrice?: number;
  subtotal?: number;
  status?: string;
  staffNotes?: string;
  customerRating?: number;
  customerReview?: string;
  serviceName?: string;
}

/** Admin/API: booking list & detail (matches Bookings table) */
export interface BookingResponse {
  id: string;
  bookingCode: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  bookingType: BookingServiceType | string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  deposit: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod | string;
  status: BookingStatus;
  internalNotes?: string;
  bookingStartDate: string; // ISO datetime
  bookingEndDate?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  createdAt: string;
  createdBy?: string;
  updatedAt: string;
  updatedBy?: string;
  /** Legacy / client form */
  petName?: string;
  /** Nested: danh sách thú cưng trong booking */
  pets?: BookingPetResponse[];
}

/** One pet in booking form */
export interface BookingPetForm {
    id: string;
    petName: string;
    petType: string; // dog | cat | other
    weight?: string;
    notes?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    foodBrought?: boolean;
  foodBroughtType?: string[];
    feedingInstructions?: string;
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
