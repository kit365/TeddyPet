import {
  Drawer,
  Typography,
  Box,
  IconButton,
  Stack,
  Divider,
  useTheme,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { BookingPetServiceResponse } from "../../../../types/booking.type";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);
const formatDate = (v?: string) => (v ? new Date(v).toLocaleDateString("vi-VN") : "—");
const formatDateTime = (v?: string) => (v ? new Date(v).toLocaleString("vi-VN") : "—");
const parsePhotoUrls = (value?: string | null): string[] => {
  if (!value) return [];
  const s = String(value).trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed.map((x) => String(x)).filter(Boolean);
  } catch {
    // fallback for legacy single URL
  }
  return [s];
};

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) => (
  <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
    <Box sx={{ minWidth: 200 }}>
      <Typography sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.875rem", display: "block", mb: 0.5 }}>
        {label}
      </Typography>
      <Box sx={{ fontSize: "0.9688rem", color: "text.primary", fontWeight: 500 }}>
        {value !== undefined && value !== null && value !== "" ? value : "—"}
      </Box>
    </Box>
  </Stack>
);

const PhotoThumbnails = ({ photos }: { photos: string[] }) => {
  if (!photos.length) return <Typography sx={{ fontSize: "0.9688rem", color: "text.primary", fontWeight: 500 }}>—</Typography>;
  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
      {photos.map((url, idx) => (
        <Box
          key={`${url}-${idx}`}
          component="img"
          src={url}
          alt={`Ảnh ${idx + 1}`}
          sx={{
            width: 56,
            height: 56,
            borderRadius: "10px",
            objectFit: "cover",
            border: "1px solid rgba(145, 158, 171, 0.22)",
            backgroundColor: "white",
          }}
        />
      ))}
    </Box>
  );
};

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
  const isRoomRequired = service.isRequiredRoom === true;
  const slotDisplay =
    service.timeSlotId != null
      ? String(service.timeSlotId)
      : service.scheduledStartTime && service.scheduledEndTime
        ? `${new Date(service.scheduledStartTime).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })} - ${new Date(service.scheduledEndTime).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}`
        : "—";

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
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.125rem", color: "#1C252E" }}>
            Chi tiết dịch vụ
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1C252E" }}>
            {service.serviceName || `Dịch vụ #${service.id}`}
            {petName && ` · ${petName}`}
          </Typography>
          {service.isRequiredRoom && service.isOverCheckOutDue ? (
            <Chip size="small" label="Quá hạn trả phòng" color="warning" sx={{ fontWeight: 700 }} />
          ) : null}
        </Stack>
        <Divider sx={{ my: 2 }} />

        <InfoRow
          label="Nhân viên phụ trách"
          value={service.assignedStaffNames || (service.assignedStaffIds?.length ? service.assignedStaffIds.map((id) => `#${id}`).join(", ") : "—")}
        />
        {isRoomRequired ? <InfoRow label="Phòng" value={service.roomId} /> : null}
        <InfoRow label="Slot giờ" value={slotDisplay} />

        <Divider sx={{ my: 2 }} />
        <InfoRow label="Check-in dự kiến" value={formatDate(service.estimatedCheckInDate)} />
        <InfoRow label="Check-out dự kiến" value={formatDate(service.estimatedCheckOutDate)} />
        <InfoRow label="Check-in thực tế" value={formatDate(service.actualCheckInDate)} />
        <InfoRow label="Check-out thực tế" value={formatDate(service.actualCheckOutDate)} />
        {service.isRequiredRoom ? (
          <InfoRow
            label="Quá hạn trả phòng"
            value={service.isOverCheckOutDue ? "Có" : "Không"}
          />
        ) : null}
        {isRoomRequired ? <InfoRow label="Số đêm" value={service.numberOfNights} /> : null}
        <InfoRow label="Bắt đầu dự kiến" value={formatDateTime(service.scheduledStartTime)} />
        <InfoRow label="Kết thúc dự kiến" value={formatDateTime(service.scheduledEndTime)} />
        <InfoRow label="Bắt đầu thực tế" value={formatDateTime(service.actualStartTime)} />
        <InfoRow label="Kết thúc thực tế" value={formatDateTime(service.actualEndTime)} />

        <Divider sx={{ my: 2 }} />
        {isRoomRequired ? <InfoRow label="Đơn giá" value={service.unitPrice != null ? formatCurrency(service.unitPrice) : "—"} /> : null}
        <InfoRow label="Thành tiền" value={service.subtotal != null ? formatCurrency(service.subtotal) : "—"} />
        <InfoRow label="Trạng thái" value={service.status} />

        <Divider sx={{ my: 2 }} />
        <InfoRow label="Ảnh trước" value={<PhotoThumbnails photos={parsePhotoUrls(service.beforePhotos)} />} />
        <InfoRow label="Ảnh trong" value={<PhotoThumbnails photos={parsePhotoUrls(service.duringPhotos)} />} />
        <InfoRow label="Ảnh sau" value={<PhotoThumbnails photos={parsePhotoUrls(service.afterPhotos)} />} />
        <InfoRow label="Video" value={<PhotoThumbnails photos={parsePhotoUrls(service.videos)} />} />

        <Divider sx={{ my: 2 }} />
        <InfoRow label="Ghi chú nhân viên" value={service.staffNotes} />
        <InfoRow label="Đánh giá khách" value={service.customerRating} />
        <InfoRow label="Nhận xét khách" value={service.customerReview} />
      </Box>
    </Drawer>
  );
};
