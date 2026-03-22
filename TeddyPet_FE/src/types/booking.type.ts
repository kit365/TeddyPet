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
  /** Số giờ phải đặt trước (advance booking) – dùng để chặn đặt quá sát giờ, đặc biệt với dịch vụ cần phòng. */
  advanceBookingHours?: number;
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

// ===== Admin check-in repricing (preview/confirm) =====

export interface AdminCheckInRepricePetInput {
  petId: number;
  confirmedPetType: string;
  confirmedWeight: number;
  /**
   * Thông tin nhận thực tế (dùng ở bước confirm check-in).
   * `arrivalPhotos/belongingPhotos` là mảng URL ảnh (FE upload nhiều ảnh).
   */
  arrivalCondition?: string;
  arrivalPhotos?: string[];
  belongingPhotos?: string[];
}

export interface AdminCheckInRepricePreviewRequest {
  pets: AdminCheckInRepricePetInput[];
}

export interface AdminCheckInRepricePreviewResponse {
  oldTotal: number;
  newTotal: number;
  paidAmount: number;
  oldRemaining: number;
  newRemaining: number;
  petDiffs: Array<{
    petId: number;
    petName?: string | null;
    oldPetType?: string | null;
    newPetType?: string | null;
    oldWeight?: number | null;
    newWeight?: number | null;
  }>;
  serviceDiffs: Array<{
    petId: number;
    petName?: string | null;
    bookingPetServiceId: number;
    serviceId: number;
    serviceName?: string | null;
    requiresRoom: boolean;
    numberOfNights?: number | null;
    oldUnitPrice: number;
    newUnitPrice: number;
    oldSubtotal: number;
    newSubtotal: number;
    delta: number;
  }>;
  itemDiffs: Array<{
    petId: number;
    petName?: string | null;
    bookingPetServiceId: number;
    itemId: number;
    itemServiceId: number;
    itemServiceName?: string | null;
    itemType: string;
    oldUnitPrice: number;
    newUnitPrice: number;
    oldSubtotal: number;
    newSubtotal: number;
    delta: number;
  }>;
}

// ===== Admin check-out confirm (departure status + photos) =====
export interface AdminCheckOutConfirmPetInput {
  petId: number;
  departureCondition?: string;
  departurePhotos?: string[];
}

export interface AdminCheckOutConfirmRequest {
  pets: AdminCheckOutConfirmPetInput[];
}

/** Giao dịch thanh toán hóa đơn (từng lần thu tiền) */
export interface BookingPaymentTransactionResponse {
  id: number;
  bookingId: number;
  transactionType: string;
  amount: number;
  paymentMethod: string;
  transactionReference?: string | null;
  paidBy?: string | null;
  paidByName?: string | null;
  paidAt: string;
  receivedBy?: string | null;
  status: string;
  createdAt: string;
}

/** Request thêm một giao dịch thanh toán */
export interface CreateBookingPaymentTransactionRequest {
  transactionType: string;
  amount: number;
  paymentMethod: string;
  transactionReference?: string | null;
  paidBy?: string | null;
  paidByName?: string | null;
  paidAt: string; // ISO datetime
  receivedBy?: string | null;
  status?: string;
  note?: string | null;
}

/** Một dòng trong danh sách giao dịch chi tiết (cọc + thanh toán hóa đơn) */
export interface BookingTransactionItemResponse {
  transactionType: "DEPOSIT" | "INVOICE_PAYMENT";
  id: number;
  amount: number;
  paymentMethod: string;
  paidAt: string;
  status: string;
  label: string;
  transactionReference?: string | null;
  paidByName?: string | null;
  note?: string | null;
}

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
  isActive?: boolean;
  cancelledReason?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
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
  assignedStaffIds?: number[];
  assignedStaffNames?: string;
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
  isOverCheckOutDue?: boolean;
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
  creditToRefund?: number;
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
  depositAmount?: number;
  /** Ngày gửi (khách chọn khi tạo booking) */
  bookingDateFrom?: string;
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
  assignedStaffIds?: number[];
  assignedStaffNames?: string;
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
  cancelRequested?: boolean;
  cancelledReason?: string | null;
}
