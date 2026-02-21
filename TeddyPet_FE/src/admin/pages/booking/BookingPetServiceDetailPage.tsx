import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  Typography,
  Stack,
  Chip,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { prefixAdmin } from "../../constants/routes";
import { getBookingById } from "./mockBookingData";
import type { BookingPetServiceResponse } from "../../../types/booking.type";

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
  <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
    <Typography sx={{ color: "text.secondary", minWidth: 200, fontWeight: 600, fontSize: "1.4rem" }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: "1.5rem", color: "text.primary", fontWeight: 500 }}>
      {value !== undefined && value !== null && value !== "" ? String(value) : "—"}
    </Typography>
  </Stack>
);

export const BookingPetServiceDetailPage = () => {
  const { id, petId, serviceId } = useParams<{ id: string; petId: string; serviceId: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<BookingPetServiceResponse | null>(null);
  const [petName, setPetName] = useState<string>("");
  const [bookingCode, setBookingCode] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && petId && serviceId) {
      const b = getBookingById(id);
      if (b) {
        setBookingCode(b.bookingCode);
        const p = b.pets?.find((x) => String(x.id) === petId);
        if (p) {
          setPetName(p.petName);
          const s = p.services?.find((x) => String(x.id) === serviceId);
          setService(s ?? null);
        } else {
          setService(null);
        }
      } else {
        setService(null);
      }
    }
    setLoading(false);
  }, [id, petId, serviceId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: "#1C252E" }} />
      </Box>
    );
  }

  if (!service) {
    return (
      <Box sx={{ p: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/${prefixAdmin}/booking/detail/${id}`)}
        >
          Trở lại
        </Button>
        <Typography sx={{ mt: 2, color: "text.secondary" }}>
          Không tìm thấy dịch vụ.
        </Typography>
      </Box>
    );
  }

  const backUrl = `/${prefixAdmin}/booking/detail/${id}/pet/${petId}`;

  return (
    <Box sx={{ pb: 8, bgcolor: "#F4F7F9", minHeight: "100vh" }}>
      {/* Header */}
      <Box
        sx={{
          p: 3,
          mb: 3,
          bgcolor: "white",
          borderBottom: "1px solid #E5E8EB",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(backUrl)}
            sx={{
              color: "#637381",
              fontWeight: 700,
              mb: 1,
              textTransform: "none",
              fontSize: "1.3rem",
              "&:hover": { bgcolor: "transparent", color: "#1C252E" },
            }}
          >
            Trở lại
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#1C252E" }}>
            {service.serviceName ?? `Dịch vụ #${service.id}`} · {petName} · {bookingCode}
          </Typography>
        </Box>
        {service.status && (
          <Chip
            label={service.status}
            sx={{
              fontWeight: 700,
              fontSize: "1.3rem",
              bgcolor: "#00a76f18",
              color: "#00A76F",
              border: "1px solid #00A76F",
              borderRadius: "8px",
            }}
          />
        )}
      </Box>

      <Box sx={{ px: { xs: 2, md: 5 } }}>
        <Stack spacing={4}>
          {/* Card 1: Thông tin nhân sự & phòng */}
          <Card
            sx={{
              p: 4,
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              border: "1px solid rgba(145, 158, 171, 0.12)",
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: "1.6rem", mb: 3, color: "#1C252E" }}>
              Nhân sự & Phòng
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
              <Box>
                <InfoRow label="Nhân viên phụ trách" value={service.assignedStaffId} />
                <InfoRow label="Phòng" value={service.roomId} />
                <InfoRow label="Slot giờ" value={service.timeSlotId} />
              </Box>
              <Box />
            </Box>
          </Card>

          {/* Card 2: Thời gian */}
          <Card
            sx={{
              p: 4,
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              border: "1px solid rgba(145, 158, 171, 0.12)",
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: "1.6rem", mb: 3, color: "#1C252E" }}>
              Thời gian
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
              <Box>
                <InfoRow label="Check-in" value={formatDate(service.checkInDate)} />
                <InfoRow label="Check-out" value={formatDate(service.checkoutDate)} />
                <InfoRow label="Số đêm" value={service.numberOfNights} />
                <InfoRow label="Bắt đầu dự kiến" value={formatDateTime(service.scheduledStartTime)} />
                <InfoRow label="Kết thúc dự kiến" value={formatDateTime(service.scheduledEndTime)} />
              </Box>
              <Box>
                <InfoRow label="Bắt đầu thực tế" value={formatDateTime(service.actualStartTime)} />
                <InfoRow label="Kết thúc thực tế" value={formatDateTime(service.actualEndTime)} />
              </Box>
            </Box>
          </Card>

          {/* Card 3: Thanh toán */}
          <Card
            sx={{
              p: 4,
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              border: "1px solid rgba(145, 158, 171, 0.12)",
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: "1.6rem", mb: 3, color: "#1C252E" }}>
              Thanh toán
            </Typography>
            <InfoRow
              label="Đơn giá"
              value={service.unitPrice != null ? formatCurrency(service.unitPrice) : "—"}
            />
            <InfoRow
              label="Thành tiền"
              value={service.subtotal != null ? formatCurrency(service.subtotal) : "—"}
            />
          </Card>

          {/* Card 4: Hình ảnh & Video */}
          <Card
            sx={{
              p: 4,
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              border: "1px solid rgba(145, 158, 171, 0.12)",
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: "1.6rem", mb: 3, color: "#1C252E" }}>
              Hình ảnh & Video
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              <InfoRow label="Ảnh trước" value={service.beforePhotos ? "Đã có" : "—"} />
              <InfoRow label="Ảnh trong" value={service.duringPhotos ? "Đã có" : "—"} />
              <InfoRow label="Ảnh sau" value={service.afterPhotos ? "Đã có" : "—"} />
              <InfoRow label="Video" value={service.videos ? "Đã có" : "—"} />
            </Box>
          </Card>

          {/* Card 5: Ghi chú & Đánh giá */}
          <Card
            sx={{
              p: 4,
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              border: "1px solid rgba(145, 158, 171, 0.12)",
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: "1.6rem", mb: 3, color: "#1C252E" }}>
              Ghi chú & Đánh giá
            </Typography>
            <InfoRow label="Ghi chú nhân viên" value={service.staffNotes} />
            <InfoRow label="Đánh giá khách" value={service.customerRating} />
            <InfoRow label="Nhận xét khách" value={service.customerReview} />
          </Card>
        </Stack>
      </Box>
    </Box>
  );
};
