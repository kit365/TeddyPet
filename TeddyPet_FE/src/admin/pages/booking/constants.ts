import type {
  BookingStatus,
  PaymentStatus,
} from "../../../types/booking.type";

export type BookingStatusFilter = BookingStatus | "ALL";

export const BOOKING_STATUS_OPTIONS: { label: string; value: BookingStatusFilter; color: string }[] = [
  { label: "Tất cả", value: "ALL", color: "" },
  { label: "Chờ xác nhận", value: "PENDING", color: "#B76E00" },
  { label: "Đã xác nhận", value: "CONFIRMED", color: "#006C9C" },
  { label: "Sẵn sàng", value: "READY", color: "#7c3aed" },
  { label: "Đang thực hiện", value: "IN_PROGRESS", color: "#229A16" },
  { label: "Hoàn thành", value: "COMPLETED", color: "#05A845" },
  { label: "Đã hủy", value: "CANCELLED", color: "#B71D18" },
];

export const BOOKING_SERVICE_LABELS: Record<string, string> = {
  HOTEL_DOG: "Khách sạn cho chó",
  HOTEL_CAT: "Khách sạn cho mèo",
  SPA_CARE: "Spa & Chăm sóc thú cưng",
};

export const PAYMENT_STATUS_OPTIONS: { label: string; value: PaymentStatus; color: string }[] = [
  { label: "Chờ thanh toán", value: "PENDING", color: "#B76E00" },
  { label: "Thanh toán một phần", value: "PARTIAL", color: "#006C9C" },
  { label: "Đã thanh toán", value: "PAID", color: "#05A845" },
  { label: "Đã hoàn tiền", value: "REFUNDED", color: "#637381" },
];

/** Chỉ CASH và BANK_TRANSFER cho booking (theo enum backend) */
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
};

export const PAYMENT_METHOD_COLORS: Record<string, string> = {
  BANK_TRANSFER: "#1976d2",
  CASH: "#2e7d32",
};

export const BOOKING_SOURCE_LABELS: Record<string, string> = {
  WEB: "Web",
  MOBILE: "Mobile",
  STORE: "Trực tiếp",
};

export const BOOKING_SOURCE_COLORS: Record<string, string> = {
  WEB: "#1890ff",
  MOBILE: "#52c41a",
  STORE: "#722ed1",
};

export const getBookingStatusLabel = (status: BookingStatus): string => {
  const found = BOOKING_STATUS_OPTIONS.find((o) => o.value === status);
  return found ? found.label : status;
};

export const getBookingStatusColor = (status: BookingStatus): string => {
  const found = BOOKING_STATUS_OPTIONS.find((o) => o.value === status);
  return found ? found.color : "#637381";
};

export const getPaymentStatusLabel = (status: PaymentStatus): string => {
  const found = PAYMENT_STATUS_OPTIONS.find((o) => o.value === status);
  return found ? found.label : status;
};

export const getPaymentStatusColor = (status: PaymentStatus): string => {
  const found = PAYMENT_STATUS_OPTIONS.find((o) => o.value === status);
  return found ? found.color : "#637381";
};

export const getBookingTypeLabel = (type: string): string =>
  BOOKING_SERVICE_LABELS[type] ?? type;

/** Chỉ hỗ trợ Tiền mặt và Chuyển khoản; giá trị khác hiển thị "—". */
export const getPaymentMethodLabel = (method?: string): string =>
  method ? (PAYMENT_METHOD_LABELS[method] ?? "—") : "—";

export const getPaymentMethodColor = (method?: string): string =>
  method ? (PAYMENT_METHOD_COLORS[method] ?? "#637381") : "#637381";

export const getBookingSourceLabel = (source?: string): string =>
  source ? (BOOKING_SOURCE_LABELS[source.toUpperCase()] ?? source) : "—";

export const getBookingSourceColor = (source?: string): string =>
  source ? (BOOKING_SOURCE_COLORS[source.toUpperCase()] ?? "#637381") : "#637381";
