import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  Typography,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { prefixAdmin } from "../../constants/routes";
import { getAdminBookingDetail, getAdminBookingPetDetail } from "../../api/booking.api";
import type { BookingPetResponse } from "../../../types/booking.type";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);
const formatDateTime = (v?: string) => (v ? new Date(v).toLocaleString("vi-VN") : "—");

const isFoodBrought = (v?: boolean | string) => {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v === "true" || v === "1";
  return v;
};

const parsePhotoUrls = (value?: string | null): string[] => {
  if (!value) return [];
  const s = String(value).trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) {
      return parsed.map((x) => String(x)).filter(Boolean);
    }
  } catch {
    // Backward compatibility: old data might be a single URL string.
  }
  return [s];
};

const PhotoThumbnails = ({ photos }: { photos: string[] }) => {
  const max = 8;
  const shown = photos.slice(0, max);
  const remaining = photos.length - shown.length;

  if (!shown.length) {
    return (
      <Typography sx={{ fontSize: "0.9375rem", color: "text.primary", fontWeight: 500 }}>—</Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
      {shown.map((url, idx) => (
        <Box
          key={`${url}-${idx}`}
          component="img"
          src={url}
          alt={`Ảnh ${idx + 1}`}
          sx={{
            width: 64,
            height: 64,
            borderRadius: "10px",
            objectFit: "cover",
            border: "1px solid rgba(145, 158, 171, 0.22)",
            backgroundColor: "white",
          }}
        />
      ))}
      {remaining > 0 ? (
        <Typography sx={{ ml: 0.5, fontWeight: 700, fontSize: "0.85rem", color: "text.secondary" }}>
          +{remaining} ảnh
        </Typography>
      ) : null}
    </Box>
  );
};

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => (
  <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
    <Typography sx={{ color: "text.secondary", minWidth: 160, fontWeight: 600, fontSize: "0.875rem" }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: "0.9375rem", color: "text.primary", fontWeight: 500 }}>
      {value !== undefined && value !== null && value !== "" ? String(value) : "—"}
    </Typography>
  </Stack>
);

export const BookingPetDetailPage = () => {
  const { id, petId } = useParams<{ id: string; petId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(undefined);
  const [pet, setPet] = useState<BookingPetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchPetDetail = async () => {
      if (id && petId) {
        setLoading(true);
        try {
          const res = await getAdminBookingDetail(id);
          const b = res.data ?? null;
          setBooking(b as any);
          const petRes = await getAdminBookingPetDetail(id, petId);
          const p = petRes.data ?? null;
          setPet(p ?? null);
        } catch (error) {
          console.error(error);
          setBooking(undefined);
          setPet(null);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchPetDetail();
  }, [id, petId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: "#1C252E" }} />
      </Box>
    );
  }

  if (!booking || !pet) {
    return (
      <Box sx={{ p: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/${prefixAdmin}/booking/detail/${id}`)}
        >
          Trở lại
        </Button>
        <Typography sx={{ mt: 2, color: "text.secondary" }}>
          Không tìm thấy thú cưng.
        </Typography>
      </Box>
    );
  }

  // Avoid conditional hooks: compute directly (no useMemo) so early returns (loading/not found)
  // won't change hook order.
  const services = pet?.services ?? [];
  const arrivalPhotos = parsePhotoUrls(pet?.arrivalPhotos);
  const departurePhotos = parsePhotoUrls(pet?.departurePhotos);
  const belongingPhotos = parsePhotoUrls(pet?.belongingPhotos);

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
            onClick={() => navigate(`/${prefixAdmin}/booking/detail/${id}`)}
            sx={{
              color: "#637381",
              fontWeight: 700,
              mb: 1,
              textTransform: "none",
              fontSize: "0.8125rem",
              "&:hover": { bgcolor: "transparent", color: "#1C252E" },
            }}
          >
            Trở lại
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#1C252E" }}>
            {pet.petName} ({pet.petType}) · {booking.bookingCode}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, md: 5 } }}>
        <Stack spacing={4}>
          {/* Card 1: Thông tin thú cưng (chỉ đọc) */}
          <Card
            sx={{
              p: 4,
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              border: "1px solid rgba(145, 158, 171, 0.12)",
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: "1rem", mb: 3, color: "#1C252E" }}>
              Thông tin thú cưng
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
              <Box>
                <InfoRow label="Tên thú cưng" value={pet.petName} />
                <InfoRow label="Loại" value={pet.petType} />
                <InfoRow label="Liên hệ khẩn cấp" value={pet.emergencyContactName} />
                <InfoRow label="SĐT khẩn cấp" value={pet.emergencyContactPhone} />
              </Box>
              <Box>
                <InfoRow label="Cân nặng khi đặt" value={pet.weightAtBooking != null ? `${pet.weightAtBooking} kg` : undefined} />
                <InfoRow label="Ghi chú tình trạng" value={pet.petConditionNotes} />
                <InfoRow label="Vấn đề sức khỏe" value={pet.healthIssues} />
              </Box>
            </Box>
          </Card>

          {/* Card 2: Tình trạng thú cưng & Hành lý */}
          <Card
            sx={{
              p: 4,
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              border: "1px solid rgba(145, 158, 171, 0.12)",
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: "1rem", mb: 2, color: "#1C252E" }}>
              Tình trạng thú cưng & Hành lý
            </Typography>
            <Typography variant="body2" sx={{ color: "#637381", mb: 3, fontSize: "0.8125rem" }}>
              Thông tin nhận/trả thực tế của thú cưng và hành lý.
            </Typography>
            <Stack spacing={2.5}>
              <InfoRow label="Tình trạng khi đến" value={pet.arrivalCondition} />
              <InfoRow label="Tình trạng khi về" value={pet.departureCondition} />

              <Box sx={{ mt: 0.5 }}>
                <Typography sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.875rem", mb: 1 }}>
                  Ảnh khi đến
                </Typography>
                <PhotoThumbnails photos={arrivalPhotos} />
              </Box>

              <Box sx={{ mt: 0.5 }}>
                <Typography sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.875rem", mb: 1 }}>
                  Ảnh khi về
                </Typography>
                <PhotoThumbnails photos={departurePhotos} />
              </Box>

              <Box sx={{ mt: 0.5 }}>
                <Typography sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.875rem", mb: 1 }}>
                  Ảnh đồ đạc mang theo
                </Typography>
                <PhotoThumbnails photos={belongingPhotos} />
              </Box>
            </Stack>
          </Card>

          {/* Card 3: Thức ăn (foodItems từ API hoặc legacy foodBrought) */}
          {(pet.foodItems && pet.foodItems.length > 0) || isFoodBrought(pet.foodBrought) ? (
            <Card
              sx={{
                p: 4,
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                border: "1px solid rgba(145, 158, 171, 0.12)",
              }}
            >
              <Typography sx={{ fontWeight: 800, fontSize: "1rem", mb: 3, color: "#1C252E" }}>
                Thức ăn
              </Typography>
              {pet.foodItems && pet.foodItems.length > 0 ? (
                pet.foodItems.map((item, idx) => (
                  <Stack key={item.id ?? idx} spacing={1} sx={{ mb: 2, p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                    <InfoRow label="Loại thức ăn" value={item.foodBroughtType ?? "—"} />
                    <InfoRow label="Nhãn hiệu" value={item.foodBrand ?? "—"} />
                    <InfoRow label="Số lượng" value={item.quantity != null ? String(item.quantity) : "—"} />
                    <InfoRow label="Hướng dẫn cho ăn" value={item.feedingInstructions ?? "—"} />
                  </Stack>
                ))
              ) : (
                <>
                  <InfoRow
                    label="Loại thức ăn mang theo"
                    value={
                      pet.foodBroughtType
                        ? Array.isArray(pet.foodBroughtType)
                          ? pet.foodBroughtType.join(", ")
                          : String(pet.foodBroughtType)
                        : "—"
                    }
                  />
                  <InfoRow label="Hướng dẫn cho ăn" value={pet.feedingInstructions} />
                </>
              )}
            </Card>
          ) : null}

          {/* Card 4: Danh sách dịch vụ (Booking_Pet_Services) */}
          <Card
            sx={{
              p: 4,
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              border: "1px solid rgba(145, 158, 171, 0.12)",
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: "1rem", mb: 3, color: "#1C252E" }}>
              Danh sách dịch vụ
            </Typography>
            {services.length === 0 ? (
              <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
                Chưa có dịch vụ.
              </Typography>
            ) : (
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem", py: 2 }}>
                      Dịch vụ
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem", py: 2 }}>
                      Thời gian
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem", py: 2 }}>
                      Trạng thái
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem", py: 2 }}>
                      Thành tiền
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem", py: 2 }} align="right">
                      Thao tác
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {services.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell sx={{ fontSize: "0.9062rem", py: 2 }}>
                        {s.serviceName ?? `#${s.id}`}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.9062rem", py: 2 }}>
                        {formatDateTime(s.scheduledStartTime)} –{" "}
                        {formatDateTime(s.scheduledEndTime)}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.9062rem", py: 2 }}>
                        {s.status ?? "—"}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.9062rem", fontWeight: 600, py: 2 }}>
                        {s.subtotal != null ? formatCurrency(s.subtotal) : "—"}
                      </TableCell>
                      <TableCell sx={{ py: 2 }} align="right">
                        <IconButton
                          size="medium"
                          onClick={() =>
                            navigate(
                              `/${prefixAdmin}/booking/detail/${id}/pet/${petId}/service/${s.id}`
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
