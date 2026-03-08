import {
  Drawer,
  Typography,
  Box,
  IconButton,
  Stack,
  Divider,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { BookingPetServiceResponse } from "../../../../types/booking.type";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);
const formatDate = (v?: string) => (v ? new Date(v).toLocaleDateString("vi-VN") : "—");
const formatDateTime = (v?: string) => (v ? new Date(v).toLocaleString("vi-VN") : "—");

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => (
  <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
    <Box sx={{ minWidth: 200 }}>
      <Typography sx={{ color: "text.secondary", fontWeight: 600, fontSize: "1.4rem", display: "block", mb: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "1.55rem", color: "text.primary", fontWeight: 500 }}>
        {value !== undefined && value !== null && value !== "" ? String(value) : "—"}
      </Typography>
    </Box>
  </Stack>
);

interface BookingPetServiceDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  service: BookingPetServiceResponse | null;
  petName?: string;
}

export const BookingPetServiceDetailDrawer = ({
  open,
  onClose,
  service,
  petName,
}: BookingPetServiceDetailDrawerProps) => {
  const theme = useTheme();
  if (!service) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 460 },
          borderLeft: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <Box sx={{ p: 3, height: "100%", overflow: "auto" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.8rem", color: "#1C252E" }}>
            Chi tiết dịch vụ
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1C252E", mb: 2 }}>
          {service.serviceName || `Dịch vụ #${service.id}`}
          {petName && ` · ${petName}`}
        </Typography>
        <Divider sx={{ my: 2 }} />

        <InfoRow label="Nhân viên phụ trách" value={service.assignedStaffId} />
        <InfoRow label="Phòng" value={service.roomId} />
        <InfoRow label="Slot giờ" value={service.timeSlotId} />

        <Divider sx={{ my: 2 }} />
        <InfoRow label="Check-in dự kiến" value={formatDate(service.estimatedCheckInDate)} />
        <InfoRow label="Check-out dự kiến" value={formatDate(service.estimatedCheckOutDate)} />
        <InfoRow label="Check-in thực tế" value={formatDate(service.actualCheckInDate)} />
        <InfoRow label="Check-out thực tế" value={formatDate(service.actualCheckOutDate)} />
        <InfoRow label="Số đêm" value={service.numberOfNights} />
        <InfoRow label="Bắt đầu dự kiến" value={formatDateTime(service.scheduledStartTime)} />
        <InfoRow label="Kết thúc dự kiến" value={formatDateTime(service.scheduledEndTime)} />
        <InfoRow label="Bắt đầu thực tế" value={formatDateTime(service.actualStartTime)} />
        <InfoRow label="Kết thúc thực tế" value={formatDateTime(service.actualEndTime)} />

        <Divider sx={{ my: 2 }} />
        <InfoRow label="Đơn giá" value={service.unitPrice != null ? formatCurrency(service.unitPrice) : "—"} />
        <InfoRow label="Thành tiền" value={service.subtotal != null ? formatCurrency(service.subtotal) : "—"} />
        <InfoRow label="Trạng thái" value={service.status} />

        <Divider sx={{ my: 2 }} />
        <InfoRow label="Ảnh trước" value={service.beforePhotos ? "Đã có" : "—"} />
        <InfoRow label="Ảnh trong" value={service.duringPhotos ? "Đã có" : "—"} />
        <InfoRow label="Ảnh sau" value={service.afterPhotos ? "Đã có" : "—"} />
        <InfoRow label="Video" value={service.videos ? "Đã có" : "—"} />

        <Divider sx={{ my: 2 }} />
        <InfoRow label="Ghi chú nhân viên" value={service.staffNotes} />
        <InfoRow label="Đánh giá khách" value={service.customerRating} />
        <InfoRow label="Nhận xét khách" value={service.customerReview} />
      </Box>
    </Drawer>
  );
};
