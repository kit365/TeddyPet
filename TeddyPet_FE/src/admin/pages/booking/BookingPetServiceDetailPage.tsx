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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { prefixAdmin } from "../../constants/routes";
import {
  getAdminBookingPetServiceDetail,
  addAdminChargeItem,
  approveAdminChargeItem,
  type AddChargeItemRequest,
} from "../../api/booking.api";
import { getServices } from "../../api/service.api";
import type { IService } from "../service/configs/types";
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
    <Typography sx={{ color: "text.secondary", minWidth: 200, fontWeight: 600, fontSize: "0.875rem" }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: "0.9375rem", color: "text.primary", fontWeight: 500 }}>
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
  const [addChargeOpen, setAddChargeOpen] = useState(false);
  const [approveItemId, setApproveItemId] = useState<number | null>(null);
  const [chargeForm, setChargeForm] = useState<AddChargeItemRequest>({
    itemServiceId: 0,
    chargeReason: "",
    chargeEvidence: "",
    chargedBy: "",
  });
  const [approveName, setApproveName] = useState("");
  const [chargeSubmitting, setChargeSubmitting] = useState(false);
  const [servicesList, setServicesList] = useState<IService[]>([]);

  const fetchService = async () => {
    if (!id || !petId || !serviceId) return;
    setLoading(true);
    try {
      const res = await getAdminBookingPetServiceDetail(id, petId, serviceId);
      const data = res.data;
      if (data) {
        setService(data);
        const petsRes = await import("../../api/booking.api").then((m) => m.getAdminBookingPets(id));
        const pets = petsRes.data ?? [];
        const pet = pets.find((p) => String(p.id) === petId);
        if (pet) setPetName(pet.petName ?? "");
        const bookingRes = await import("../../api/booking.api").then((m) => m.getAdminBookingDetail(id));
        setBookingCode(bookingRes.data?.bookingCode ?? "");
      } else setService(null);
    } catch {
      setService(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchService();
  }, [id, petId, serviceId]);

  useEffect(() => {
    getServices()
      .then((r) => setServicesList(r.data ?? []))
      .catch(() => setServicesList([]));
  }, []);

  const chargeServices = servicesList.filter((s) => s.isAdditionalCharge === true);

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
              fontSize: "0.8125rem",
              "&:hover": { bgcolor: "transparent", color: "#1C252E" },
            }}
          >
            Trở lại
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#1C252E" }}>
            {service.serviceName ?? `Dịch vụ #${service.id}`} · {petName} · {bookingCode}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          {service.isRequiredRoom && service.isOverCheckOutDue ? (
            <Chip size="small" label="Quá hạn trả phòng" color="warning" sx={{ fontWeight: 700 }} />
          ) : null}
          {service.status && (
            <Chip
              label={service.status}
              sx={{
                fontWeight: 700,
                fontSize: "0.8125rem",
                bgcolor: "#00a76f18",
                color: "#00A76F",
                border: "1px solid #00A76F",
                borderRadius: "8px",
              }}
            />
          )}
        </Stack>
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
            <Typography sx={{ fontWeight: 800, fontSize: "1rem", mb: 3, color: "#1C252E" }}>
              Nhân sự & Phòng
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
              <Box>
                <InfoRow
                  label="Nhân viên phụ trách"
                  value={service.assignedStaffNames || (service.assignedStaffIds?.length ? service.assignedStaffIds.map((id) => `#${id}`).join(", ") : "—")}
                />
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
            <Typography sx={{ fontWeight: 800, fontSize: "1rem", mb: 3, color: "#1C252E" }}>
              Thời gian
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
              <Box>
                <InfoRow label="Check-in dự kiến" value={formatDate(service.estimatedCheckInDate)} />
                <InfoRow label="Check-out dự kiến" value={formatDate(service.estimatedCheckOutDate)} />
                <InfoRow label="Số đêm" value={service.numberOfNights} />
                <InfoRow label="Bắt đầu dự kiến" value={formatDateTime(service.scheduledStartTime)} />
                <InfoRow label="Kết thúc dự kiến" value={formatDateTime(service.scheduledEndTime)} />
              </Box>
              <Box>
                <InfoRow label="Check-in thực tế" value={formatDate(service.actualCheckInDate)} />
                <InfoRow label="Check-out thực tế" value={formatDate(service.actualCheckOutDate)} />
                {service.isRequiredRoom ? (
                  <InfoRow
                    label="Quá hạn trả phòng"
                    value={service.isOverCheckOutDue ? "Có" : "Không"}
                  />
                ) : null}
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
            <Typography sx={{ fontWeight: 800, fontSize: "1rem", mb: 3, color: "#1C252E" }}>
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
            <Typography sx={{ fontWeight: 800, fontSize: "1rem", mb: 3, color: "#1C252E" }}>
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
            <Typography sx={{ fontWeight: 800, fontSize: "1rem", mb: 3, color: "#1C252E" }}>
              Ghi chú & Đánh giá
            </Typography>
            <InfoRow label="Ghi chú nhân viên" value={service.staffNotes} />
            <InfoRow label="Đánh giá khách" value={service.customerRating} />
            <InfoRow label="Nhận xét khách" value={service.customerReview} />
          </Card>

          {/* Card 6: Dịch vụ add-on / Additional charge */}
          <Card
            sx={{
              p: 4,
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              border: "1px solid rgba(145, 158, 171, 0.12)",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "#1C252E" }}>
                Dịch vụ add-on / Additional charge
              </Typography>
              {chargeServices.length > 0 && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setChargeForm({
                      itemServiceId: chargeServices[0]?.serviceId ?? 0,
                      chargeReason: "",
                      chargeEvidence: "",
                      chargedBy: "",
                    });
                    setAddChargeOpen(true);
                  }}
                  sx={{ bgcolor: "#00A76F", "&:hover": { bgcolor: "#007B55" } }}
                >
                  Thêm additional charge
                </Button>
              )}
            </Box>
            {(!service.items || service.items.length === 0) && (
              <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
                Chưa có dịch vụ add-on hoặc additional charge.
              </Typography>
            )}
            {service.items && service.items.length > 0 && (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Dịch vụ</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Loại</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Lý do charge</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Charge bởi</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Khách xác nhận</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {service.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.itemServiceName ?? `#${item.itemServiceId}`}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.itemType}
                          size="small"
                          color={item.itemType === "CHARGE" ? "warning" : "default"}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>{item.chargeReason ?? "—"}</TableCell>
                      <TableCell>{item.chargedBy ?? "—"}</TableCell>
                      <TableCell>
                        {item.chargeApprovedBy ? (
                          <>
                            {item.chargeApprovedBy}
                            {item.chargeApprovedAt && (
                              <Typography variant="caption" display="block" sx={{ color: "text.secondary" }}>
                                {formatDateTime(item.chargeApprovedAt)}
                              </Typography>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {item.itemType === "CHARGE" && !item.chargeApprovedAt && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => {
                              setApproveItemId(item.id);
                              setApproveName("");
                            }}
                          >
                            Xác nhận khách đồng ý
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </Stack>
      </Box>

      {/* Modal: Thêm additional charge */}
      <Dialog open={addChargeOpen} onClose={() => setAddChargeOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm additional charge</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Dịch vụ charge"
              required
              fullWidth
              value={chargeForm.itemServiceId || ""}
              onChange={(e) => setChargeForm((p) => ({ ...p, itemServiceId: Number(e.target.value) }))}
            >
              {chargeServices.map((s) => (
                <MenuItem key={s.serviceId} value={s.serviceId}>
                  {s.serviceName}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Lý do charge"
              fullWidth
              multiline
              rows={2}
              value={chargeForm.chargeReason ?? ""}
              onChange={(e) => setChargeForm((p) => ({ ...p, chargeReason: e.target.value }))}
            />
            <TextField
              label="Bằng chứng (link ảnh/video, không bắt buộc)"
              fullWidth
              value={chargeForm.chargeEvidence ?? ""}
              onChange={(e) => setChargeForm((p) => ({ ...p, chargeEvidence: e.target.value }))}
            />
            <TextField
              label="Charge bởi (tên nhân viên)"
              required
              fullWidth
              value={chargeForm.chargedBy ?? ""}
              onChange={(e) => setChargeForm((p) => ({ ...p, chargedBy: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddChargeOpen(false)}>Hủy</Button>
          <Button
            variant="contained"
            disabled={chargeSubmitting || !chargeForm.chargedBy?.trim() || !chargeForm.itemServiceId}
            onClick={async () => {
              if (!id || !petId || !serviceId) return;
              setChargeSubmitting(true);
              try {
                await addAdminChargeItem(id, petId, serviceId, {
                  itemServiceId: chargeForm.itemServiceId,
                  chargeReason: chargeForm.chargeReason?.trim() || null,
                  chargeEvidence: chargeForm.chargeEvidence?.trim() || null,
                  chargedBy: chargeForm.chargedBy!.trim(),
                });
                setAddChargeOpen(false);
                fetchService();
              } finally {
                setChargeSubmitting(false);
              }
            }}
          >
            Thêm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Xác nhận khách đồng ý */}
      <Dialog open={approveItemId != null} onClose={() => setApproveItemId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Xác nhận khách hàng đồng ý charge</DialogTitle>
        <DialogContent>
          <TextField
            label="Tên khách hàng xác nhận"
            required
            fullWidth
            value={approveName}
            onChange={(e) => setApproveName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveItemId(null)}>Hủy</Button>
          <Button
            variant="contained"
            disabled={!approveName.trim()}
            onClick={async () => {
              if (!id || !petId || !serviceId || approveItemId == null) return;
              try {
                await approveAdminChargeItem(id, petId, serviceId, approveItemId, {
                  chargeApprovedBy: approveName.trim(),
                });
                setApproveItemId(null);
                setApproveName("");
                fetchService();
              } catch {}
            }}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
