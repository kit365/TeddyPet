import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  Typography,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { prefixAdmin } from "../../constants/routes";
import { getAdminBookingDetail } from "../../api/booking.api";
import {
  getBookingStatusLabel,
  getBookingStatusColor,
  getPaymentStatusLabel,
  getPaymentStatusColor,
  getBookingTypeLabel,
  getPaymentMethodLabel,
  getPaymentMethodColor,
} from "./constants";
import type { BookingResponse } from "../../../types/booking.type";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);
const formatDateTime = (v?: string) => (v ? new Date(v).toLocaleString("vi-VN") : "—");

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => (
  <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2.5 }}>
    <Typography sx={{ color: "text.secondary", minWidth: 180, fontWeight: 600, fontSize: "1.45rem" }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: "1.6rem", color: "text.primary", fontWeight: 500 }}>
      {value !== undefined && value !== null && value !== "" ? String(value) : "—"}
    </Typography>
  </Stack>
);

const isFoodBrought = (v?: boolean | string) => {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v === "true" || v === "1";
  return v;
};

export const BookingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      if (id) {
        setLoading(true);
        try {
          const res = await getAdminBookingDetail(id);
          setBooking(res.data ?? null);
        } catch (error) {
          console.error(error);
          setBooking(null);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: "#1C252E" }} />
      </Box>
    );
  }

  if (!booking) {
    return (
      <Box sx={{ p: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/${prefixAdmin}/booking/list`)}>
          Trở lại
        </Button>
        <Typography sx={{ mt: 2, color: "text.secondary" }}>Không tìm thấy đặt lịch.</Typography>
      </Box>
    );
  }

  const statusColor = getBookingStatusColor(booking.status);
  const paymentColor = getPaymentStatusColor(booking.paymentStatus);
  const allServices = (booking.pets ?? []).flatMap((p) =>
    (p.services ?? []).map((s) => ({ service: s, petName: p.petName, petId: p.id }))
  );

  return (
    <Box sx={{ pb: 8, bgcolor: "#F4F7F9", minHeight: "100vh" }}>
      {/* Header */}
      <Box
        sx={{
          p: 3,
          mb: 4,
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
            onClick={() => navigate(`/${prefixAdmin}/booking/list`)}
            sx={{
              color: "#637381",
              fontWeight: 800,
              mb: 1,
              textTransform: "none",
              fontSize: "1.3rem",
              "&:hover": { bgcolor: "transparent", color: "#1C252E" },
            }}
          >
            Trở lại
          </Button>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Typography variant="h4" sx={{ fontWeight: 900, color: "#1C252E", letterSpacing: "-0.5px" }}>
              {booking.bookingCode}
            </Typography>
            <Chip
              label={getBookingStatusLabel(booking.status)}
              sx={{
                fontWeight: 800,
                fontSize: "1.2rem",
                bgcolor: `${statusColor}18`,
                color: statusColor,
                border: `1px solid ${statusColor}`,
                borderRadius: "8px",
              }}
            />
            <Chip
              label={getPaymentStatusLabel(booking.paymentStatus)}
              sx={{
                fontWeight: 800,
                fontSize: "1.2rem",
                bgcolor: `${paymentColor}18`,
                color: paymentColor,
                border: `1px solid ${paymentColor}`,
                borderRadius: "8px",
              }}
            />
          </Stack>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, md: 5 } }}>
        <Stack spacing={4}>
          {/* Card 1: Thông tin chung Booking */}
          <Card
            sx={{
              p: 4,
              borderRadius: "24px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              border: "1px solid #FFF",
            }}
          >
            <Typography sx={{ fontWeight: 900, fontSize: "1.8rem", mb: 3, color: "#1C252E" }}>
              Thông tin đặt lịch
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
              <Box>
                <InfoRow label="Mã đặt lịch" value={booking.bookingCode} />
                <InfoRow label="Khách hàng" value={booking.customerName} />
                <InfoRow label="Email" value={booking.customerEmail} />
                <InfoRow label="Số điện thoại" value={booking.customerPhone} />
                <InfoRow label="Địa chỉ" value={booking.customerAddress} />
                <InfoRow label="Loại dịch vụ" value={getBookingTypeLabel(booking.bookingType)} />
                <InfoRow label="Bắt đầu" value={formatDateTime(booking.bookingStartDate)} />
                <InfoRow label="Kết thúc" value={formatDateTime(booking.bookingEndDate)} />
              </Box>
              <Box>
                <InfoRow label="Tổng tiền" value={formatCurrency(booking.totalAmount)} />
                <InfoRow label="Đã thanh toán" value={formatCurrency(booking.paidAmount)} />
                <InfoRow label="Còn lại" value={formatCurrency(booking.remainingAmount)} />
                <InfoRow label="Tiền cọc" value={formatCurrency(booking.deposit)} />
                <InfoRow
                  label="Hình thức thanh toán"
                  value={getPaymentMethodLabel(booking.paymentMethod)}
                />
                <InfoRow label="Ghi chú nội bộ" value={booking.internalNotes} />
                {booking.status === "CANCELLED" && (
                  <>
                    <InfoRow label="Hủy lúc" value={formatDateTime(booking.cancelledAt)} />
                    <InfoRow label="Hủy bởi" value={booking.cancelledBy} />
                  </>
                )}
                <InfoRow label="Tạo lúc" value={formatDateTime(booking.createdAt)} />
                <InfoRow label="Tạo bởi" value={booking.createdBy} />
                <InfoRow label="Cập nhật lúc" value={formatDateTime(booking.updatedAt)} />
                <InfoRow label="Cập nhật bởi" value={booking.updatedBy} />
              </Box>
            </Box>
          </Card>

          {/* Card 2: Danh sách Booking_Pets */}
          <Card
            sx={{
              p: 4,
              borderRadius: "24px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              border: "1px solid #FFF",
            }}
          >
            <Typography sx={{ fontWeight: 900, fontSize: "1.8rem", mb: 3, color: "#1C252E" }}>
              Danh sách thú cưng
            </Typography>
            {(!booking.pets || booking.pets.length === 0) ? (
              <Typography sx={{ color: "text.secondary" }}>Chưa có thú cưng.</Typography>
            ) : (
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, fontSize: "1.5rem", py: 2 }}>Mã booking</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: "1.5rem", py: 2 }}>Tên thú cưng</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: "1.5rem", py: 2 }}>Loại</TableCell>
                    {booking.pets.some(
                      (p) => (p.foodItems && p.foodItems.length > 0) || isFoodBrought(p.foodBrought)
                    ) && (
                        <>
                          <TableCell sx={{ fontWeight: 800, fontSize: "1.5rem", py: 2 }}>Thức ăn mang theo</TableCell>
                          <TableCell sx={{ fontWeight: 800, fontSize: "1.5rem", py: 2 }}>Hướng dẫn cho ăn</TableCell>
                        </>
                      )}
                    <TableCell sx={{ fontWeight: 800, fontSize: "1.5rem", py: 2 }} align="right">
                      Thao tác
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {booking.pets.map((pet) => (
                    <TableRow key={pet.id}>
                      <TableCell sx={{ fontSize: "1.5rem", py: 2 }}>{booking.bookingCode}</TableCell>
                      <TableCell sx={{ fontSize: "1.5rem", fontWeight: 600, py: 2 }}>{pet.petName}</TableCell>
                      <TableCell sx={{ fontSize: "1.5rem", py: 2 }}>{pet.petType}</TableCell>
                      {booking.pets!.some(
                        (p) => (p.foodItems && p.foodItems.length > 0) || isFoodBrought(p.foodBrought)
                      ) && (
                          <>
                            <TableCell sx={{ fontSize: "1.5rem", py: 2 }}>
                              {pet.foodItems && pet.foodItems.length > 0
                                ? pet.foodItems.map((i) => i.foodBroughtType ?? "—").join("; ") || "—"
                                : isFoodBrought(pet.foodBrought)
                                  ? pet.foodBroughtType
                                    ? Array.isArray(pet.foodBroughtType)
                                      ? pet.foodBroughtType.join(", ")
                                      : String(pet.foodBroughtType)
                                    : "—"
                                  : "—"}
                            </TableCell>
                            <TableCell sx={{ fontSize: "1.5rem", py: 2 }}>
                              {pet.foodItems && pet.foodItems.length > 0
                                ? pet.foodItems.map((i) => i.feedingInstructions ?? "—").join("; ") || "—"
                                : isFoodBrought(pet.foodBrought)
                                  ? pet.feedingInstructions ?? "—"
                                  : "—"}
                            </TableCell>
                          </>
                        )}
                      <TableCell sx={{ py: 2 }} align="right">
                        <IconButton
                          size="medium"
                          onClick={() => navigate(`/${prefixAdmin}/booking/detail/${id}/pet/${pet.id}`)}
                          sx={{ color: "#00A76F", p: 1 }}
                          title="Xem chi tiết"
                        >
                          <VisibilityIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          {/* Card 3: Danh sách Booking_Pet_Services */}
          <Card
            sx={{
              p: 4,
              borderRadius: "24px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              border: "1px solid #FFF",
            }}
          >
            <Typography sx={{ fontWeight: 900, fontSize: "1.8rem", mb: 3, color: "#1C252E" }}>
              Danh sách dịch vụ theo thú cưng
            </Typography>
            {allServices.length === 0 ? (
              <Typography sx={{ color: "text.secondary" }}>Chưa có dịch vụ.</Typography>
            ) : (
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, fontSize: "1.5rem", py: 2 }}>Dịch vụ</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: "1.5rem", py: 2 }}>Thú cưng</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: "1.5rem", py: 2 }}>Thời gian</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: "1.5rem", py: 2 }}>Trạng thái</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: "1.5rem", py: 2 }}>Thành tiền</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: "1.5rem", py: 2 }} align="right">
                      Thao tác
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allServices.map(({ service, petName, petId }) => (
                    <TableRow key={service.id}>
                      <TableCell sx={{ fontSize: "1.5rem", fontWeight: 600, py: 2 }}>{service.serviceName ?? `#${service.id}`}</TableCell>
                      <TableCell sx={{ fontSize: "1.5rem", py: 2 }}>{petName}</TableCell>
                      <TableCell sx={{ fontSize: "1.5rem", py: 2 }}>
                        {formatDateTime(service.scheduledStartTime)} –{" "}
                        {formatDateTime(service.scheduledEndTime)}
                      </TableCell>
                      <TableCell sx={{ fontSize: "1.5rem", py: 2 }}>{service.status ?? "—"}</TableCell>
                      <TableCell sx={{ fontSize: "1.5rem", fontWeight: 600, py: 2 }}>
                        {service.subtotal != null
                          ? formatCurrency(service.subtotal)
                          : "—"}
                      </TableCell>
                      <TableCell sx={{ py: 2 }} align="right">
                        <IconButton
                          size="medium"
                          onClick={() =>
                            navigate(
                              `/${prefixAdmin}/booking/detail/${id}/pet/${petId}/service/${service.id}`
                            )
                          }
                          sx={{ color: "#00A76F", p: 1 }}
                          title="Xem chi tiết"
                        >
                          <VisibilityIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </Stack>
      </Box>

    </Box>
  );
};
