import {
  Drawer,
  Typography,
  Box,
  IconButton,
  Stack,
  Chip,
  Divider,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PetsIcon from "@mui/icons-material/Pets";
import NotesIcon from "@mui/icons-material/Notes";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PaymentIcon from "@mui/icons-material/Payment";
import CancelIcon from "@mui/icons-material/Cancel";
import type { BookingResponse } from "../../../../types/booking.type";
import {
  getBookingStatusLabel,
  getBookingStatusColor,
  getPaymentStatusLabel,
  getPaymentStatusColor,
  getBookingTypeLabel,
  getPaymentMethodLabel,
} from "../constants";

interface BookingDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  booking: BookingResponse | null;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
const formatDateTime = (value: string) =>
  value ? new Date(value).toLocaleString("vi-VN") : "—";

const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | number | null;
}) => (
  <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
    <Icon sx={{ color: "text.secondary", fontSize: "2rem", mt: 0.3 }} />
    <Box>
      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block" }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "1.4rem", color: "text.primary" }}>
        {value !== undefined && value !== null && value !== "" ? String(value) : "—"}
      </Typography>
    </Box>
  </Stack>
);

export const BookingDetailDrawer = ({ open, onClose, booking }: BookingDetailDrawerProps) => {
  const theme = useTheme();

  if (!booking) return null;

  const statusColor = getBookingStatusColor(booking.status);
  const paymentColor = getPaymentStatusColor(booking.paymentStatus);
  const serviceLabel = getBookingTypeLabel(booking.bookingType);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 440 },
          borderLeft: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <Box sx={{ p: 3, height: "100%", overflow: "auto" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.8rem", color: "#1C252E" }}>
            Chi tiết đặt lịch
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
          <Chip
            label={getBookingStatusLabel(booking.status)}
            size="medium"
            sx={{
              fontWeight: 700,
              fontSize: "1.25rem",
              bgcolor: `${statusColor}18`,
              color: statusColor,
              border: `1px solid ${statusColor}`,
            }}
          />
          <Chip
            label={getPaymentStatusLabel(booking.paymentStatus)}
            size="medium"
            sx={{
              fontWeight: 700,
              fontSize: "1.25rem",
              bgcolor: `${paymentColor}18`,
              color: paymentColor,
              border: `1px solid ${paymentColor}`,
            }}
          />
        </Stack>

        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1C252E", mb: 1.5 }}>
          {booking.bookingCode}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <InfoRow icon={PersonIcon} label="Khách hàng" value={booking.customerName} />
        <InfoRow icon={EmailIcon} label="Email" value={booking.customerEmail} />
        <InfoRow icon={PhoneIcon} label="Số điện thoại" value={booking.customerPhone} />
        <InfoRow icon={LocationOnIcon} label="Địa chỉ" value={booking.customerAddress} />

        <Divider sx={{ my: 2 }} />


        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
          <PetsIcon sx={{ color: "text.secondary", fontSize: "2rem", mt: 0.3 }} />
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block" }}>
              Loại dịch vụ
            </Typography>
            <Typography sx={{ fontSize: "1.4rem", color: "text.primary" }}>{serviceLabel}</Typography>
          </Box>
        </Stack>
        {booking.petName && (
          <InfoRow icon={PetsIcon} label="Thú cưng" value={booking.petName} />
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, display: "block", mb: 1 }}>
          Thanh toán
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
          <AttachMoneyIcon sx={{ color: "text.secondary", fontSize: "2rem", mt: 0.3 }} />
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block" }}>Tổng tiền</Typography>
            <Typography sx={{ fontSize: "1.4rem", fontWeight: 700 }}>{formatCurrency(booking.totalAmount)}</Typography>
          </Box>
        </Stack>
        <InfoRow icon={AttachMoneyIcon} label="Đã thanh toán" value={formatCurrency(booking.paidAmount)} />
        <InfoRow icon={AttachMoneyIcon} label="Còn lại" value={formatCurrency(booking.remainingAmount)} />
        {booking.deposit > 0 && (
          <InfoRow icon={AttachMoneyIcon} label="Tiền cọc" value={formatCurrency(booking.deposit)} />
        )}
        <InfoRow icon={PaymentIcon} label="Hình thức" value={getPaymentMethodLabel(booking.paymentMethod)} />

        {booking.internalNotes && (
          <>
            <Divider sx={{ my: 2 }} />
            <InfoRow icon={NotesIcon} label="Ghi chú nội bộ" value={booking.internalNotes} />
          </>
        )}

        {booking.status === "CANCELLED" && (booking.cancelledAt || booking.cancelledBy) && (
          <>
            <Divider sx={{ my: 2 }} />
            <InfoRow icon={CancelIcon} label="Hủy lúc" value={booking.cancelledAt ? formatDateTime(booking.cancelledAt) : "—"} />
            <InfoRow icon={CancelIcon} label="Hủy bởi" value={booking.cancelledBy} />
          </>
        )}

        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Tạo lúc: {formatDateTime(booking.createdAt)}
          {booking.createdBy && ` · ${booking.createdBy}`}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
          Cập nhật: {formatDateTime(booking.updatedAt)}
          {booking.updatedBy && ` · ${booking.updatedBy}`}
        </Typography>
      </Box>
    </Drawer>
  );
};
