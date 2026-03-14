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
  /** BE: services.is_required_room */
  isRequiredRoom?: boolean | null;
  /** BE: services.is_addon — chỉ hiển thị trong "dịch vụ thêm" khi true */
  isAddon?: boolean | null;
  /** BE: services.is_additional_charge — dịch vụ phụ thu, không cho chọn trực tiếp ở form đặt lịch */
  isAdditionalCharge?: boolean | null;
}

/** Admin/API: booking status */
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "READY"
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

/** One item of pet food brought (pet_food_brought table) */
export interface PetFoodBroughtItemResponse {
  id?: number;
  foodBroughtType?: string | null;
  foodBrand?: string | null;
  quantity?: number | null;
  feedingInstructions?: string | null;
}

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
  /** Danh sách thức ăn mang theo (bảng pet_food_brought) */
  foodItems?: PetFoodBroughtItemResponse[];
  services?: BookingPetServiceResponse[];
}

/** Admin/API: BookingPetServiceItem (add-on / additional charge) */
export interface BookingPetServiceItemResponse {
  id: number;
  itemServiceId: number;
  itemServiceName?: string;
  itemType: string; // ADDON | CHARGE
  chargeReason?: string | null;
  chargeEvidence?: string | null;
  chargedBy?: string | null;
  chargeApprovedBy?: string | null;
  chargeApprovedAt?: string | null;
  notes?: string | null;
  staffNotes?: string | null;
}

/** Admin/API: BookingPetService (matches booking_pet_services table) */
export interface BookingPetServiceResponse {
  id: number;
  bookingPetId: number;
  assignedStaffId?: number;
  assignedStaffName?: string;
  serviceId?: number;
  serviceComboId?: number;
  timeSlotId?: number;
  roomId?: number;
  duringPhotos?: string;
  afterPhotos?: string;
  beforePhotos?: string;
  videos?: string;
  estimatedCheckInDate?: string;
  estimatedCheckOutDate?: string;
  actualCheckInDate?: string;
  actualCheckOutDate?: string;
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
  isRequiredRoom?: boolean;
  items?: BookingPetServiceItemResponse[];
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
  source?: string;
  bookingType: BookingServiceType | string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  deposit?: number;
  depositPaid?: boolean;
  depositId?: number;
  depositExpiresAt?: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod | string;
  status: BookingStatus;
  /** Client requested cancel booking (uses cancelRequested flag) */
  cancelRequested?: boolean;
  cancelledReason?: string | null;
  internalNotes?: string;
  bookingCheckInDate?: string; // ISO datetime, set by Check-in button
  bookingCheckOutDate?: string; // set by Check-out button
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

/** One food item in booking form (maps to pet_food_brought) */
export interface PetFoodBroughtItemForm {
  foodBroughtType?: string;
  foodBrand?: string | null;
  quantity?: number | null;
  feedingInstructions?: string;
}

/** One dịch vụ thêm trong form (1 booking_pet có nhiều booking_pet_services) */
export interface BookingPetServiceForm {
  id: string;
  serviceId: number | null;
  pricingModel: "per_day" | "per_session" | null;
  dateFrom: string;
  dateTo: string;
  numberOfNights?: number | null;
  roomLayoutConfigId?: number | null;
  selectedRoomTypeId?: number | null;
  selectedRoomId?: number | null;
  sessionDate: string;
  sessionSlot: string;
  /** Id khung giờ (time_slots) → gửi lên BE để tăng currentBookings */
  sessionTimeSlotId?: number | null;
  /** Label "HH:mm - HH:mm" gửi lên BE (sessionSlotLabel) */
  sessionSlotLabel?: string;
  /** Dịch vụ add-on (isAddon=true) khách chọn kèm theo → booking_pet_service_items */
  addonServiceIds?: number[];
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
  /** Danh sách thức ăn mang theo (gửi lên BE dạng foodItems) */
  foodItems?: PetFoodBroughtItemForm[];
  /** Selected service id */
  serviceId: number | null;
  /** Category pricing model for selected service */
  pricingModel: "per_day" | "per_session" | null;
  /** per_day: drop-off and pick-up dates */
  dateFrom: string;
  dateTo: string;
  /** Số đêm = (dateTo - dateFrom) khi dateTo > dateFrom */
  numberOfNights?: number | null;
  /** Room selection (only when service.isRequiredRoom === true) */
  roomLayoutConfigId?: number | null;
  selectedRoomTypeId?: number | null;
  selectedRoomId?: number | null;
  /** per_session: selected date and time slot */
  sessionDate: string;
  sessionSlot: string; // e.g. "08:00"
  /** Id khung giờ (time_slots) → gửi lên BE để tăng currentBookings */
  sessionTimeSlotId?: number | null;
  /** Label "HH:mm - HH:mm" gửi lên BE (sessionSlotLabel) */
  sessionSlotLabel?: string;
  /** Dịch vụ add-on (isAddon=true) kèm theo dịch vụ chính → booking_pet_service_items */
  addonServiceIds?: number[];
  /** Dịch vụ thêm (chỉ isAddon=true, cùng thú cưng) → nhiều booking_pet_services */
  additionalServices?: BookingPetServiceForm[];
}

// ===== CLIENT BOOKING DETAIL RESPONSE (deep mapping) =====

/** Add-on item in a pet service (booking_pet_service_items) */
export interface ClientBookingPetServiceItemDetail {
  id: number;
  itemName?: string;
  quantity?: number;
  price?: number;
  subtotal?: number;
}

/** Food item brought by customer (pet_food_brought) */
export interface ClientPetFoodBroughtDetail {
  id: number;
  foodBroughtType?: string;
  foodBrand?: string;
  quantity?: number;
  feedingInstructions?: string;
}

/** Service attached to a pet (booking_pet_services) */
export interface ClientBookingPetServiceDetail {
  id: number;
  assignedStaffId?: number;
  serviceName?: string;
  timeSlotName?: string;
  estimatedCheckInDate?: string;
  estimatedCheckOutDate?: string;
  actualCheckInDate?: string;
  actualCheckOutDate?: string;
  numberOfNights?: number;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  basePrice?: number;
  subtotal?: number;
  status?: string;
  customerRating?: number;
  customerReview?: string;
  roomId?: number;
  roomName?: string;
  displayTypeName?: string;
  roomNumber?: string;
  items?: ClientBookingPetServiceItemDetail[];
}

/** Pet in a booking (booking_pets) */
export interface ClientBookingPetDetail {
  id: number;
  petName?: string;
  petType?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  weightAtBooking?: number;
  petConditionNotes?: string;
  arrivalCondition?: string;
  departureCondition?: string;
  arrivalPhotos?: string;
  departurePhotos?: string;
  belongingPhotos?: string;
  foodBrought?: boolean;
  services?: ClientBookingPetServiceDetail[];
  foodItems?: ClientPetFoodBroughtDetail[];
}

/** Full client booking detail response (deep mapping) */
export interface ClientBookingDetailResponse {
  id: number;
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  bookingType?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  depositPaid?: boolean;
  paymentStatus: string;
  paymentMethod?: string;
  status: string;
  internalNotes?: string;
  bookingCheckInDate?: string;
  bookingCheckOutDate?: string;
  depositId?: number;
  depositExpiresAt?: string;
  createdAt?: string;
  pets?: ClientBookingPetDetail[];
}
