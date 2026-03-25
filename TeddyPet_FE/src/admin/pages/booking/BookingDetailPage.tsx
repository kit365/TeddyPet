import { useCallback, useEffect, useMemo, useState } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  MenuItem,
  Alert,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast } from "react-toastify";
import { prefixAdmin } from "../../constants/routes";
import { UploadMultiFile } from "../../components/upload/UploadMultiFile";
import {
  getAdminBookingDetail,
  getAdminBookingPets,
  checkOutBooking,
  updateAdminBookingInternalNotes,
  previewCheckInReprice,
  confirmCheckInWithReprice,
  cancelBookingPetService,
  cancelBookingPetServiceItem,
  getAdminBookingNoShowPreview,
  markAdminBookingManualNoShow,
} from "../../api/booking.api";
import {
  getBookingStatusLabel,
  getBookingStatusColor,
  getPaymentStatusLabel,
  getPaymentStatusColor,
  getBookingTypeLabel,
  getPaymentMethodLabel,
} from "./constants";
import type {
  BookingResponse,
  AdminCheckInRepricePetInput,
  AdminCheckInRepricePreviewResponse,
  AdminCheckOutConfirmPetInput,
  AdminCheckOutOvertimeInput,
  AdminBookingNoShowPreviewResponse,
} from "../../../types/booking.type";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);
const formatDateTime = (v?: string) => (v ? new Date(v).toLocaleString("vi-VN") : "—");

const getServiceStatusLabel = (status: string, isRoom?: boolean): string => {
  const s = (status ?? "").toUpperCase();
  switch (s) {
    case "COMPLETED": return "Hoàn thành";
    case "IN_PROGRESS": return isRoom ? "Chờ thực hiện" : "Đang xử lý";
    case "PENDING":
    case "WAITING_STAFF": return isRoom ? "Chưa bắt đầu" : "Chờ thực hiện";
    case "PET_IN_HOTEL": return "Đã vào Hotel";
    case "CANCELLED": return "Đã hủy";
    default: return status;
  }
};

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => (
  <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2.5 }}>
    <Typography sx={{ color: "text.secondary", minWidth: 180, fontWeight: 600, fontSize: "0.9062rem" }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: "1rem", color: "text.primary", fontWeight: 500 }}>
      {value !== undefined && value !== null && value !== "" ? String(value) : "—"}
    </Typography>
  </Stack>
);

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
            width: 56,
            height: 56,
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

export const BookingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [checkInPets, setCheckInPets] = useState<AdminCheckInRepricePetInput[]>([]);
  const [checkInStaffNote, setCheckInStaffNote] = useState("");
  const [checkInPreview, setCheckInPreview] = useState<AdminCheckInRepricePreviewResponse | null>(null);
  const [checkInPreviewLoading, setCheckInPreviewLoading] = useState(false);
  const [checkInConfirmLoading, setCheckInConfirmLoading] = useState(false);

  const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false);
  const [checkOutPets, setCheckOutPets] = useState<AdminCheckOutConfirmPetInput[]>([]);
  const [checkOutOvertimeAdjustments, setCheckOutOvertimeAdjustments] = useState<AdminCheckOutOvertimeInput[]>([]);
  const [checkOutConfirmLoading, setCheckOutConfirmLoading] = useState(false);

  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    type: 'service' | 'item';
    id: number | null;
    label: string;
    reason: string;
  }>({
    open: false,
    type: 'service',
    id: null,
    label: '',
    reason: '',
  });

  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [noShowPreview, setNoShowPreview] = useState<AdminBookingNoShowPreviewResponse | null>(null);

  const activeLineItems = useMemo(() => {
    const services = (booking?.pets ?? []).flatMap((p) => (p.services ?? []));
    const activeServices = services.filter((s) => (s?.status ?? "").toUpperCase() !== "CANCELLED");
    const activeItems = services
      .flatMap((s) => (s.items ?? []))
      .filter((i) => i?.isActive !== false);
    return activeServices.length + activeItems.length;
  }, [booking?.pets]);

  const allActiveServicesCompleted = useMemo(() => {
    const services = (booking?.pets ?? []).flatMap((p) => p.services ?? []);
    const active = services.filter((s) => (s?.status ?? "").toUpperCase() !== "CANCELLED");
    if (active.length === 0) return false;
    return active.every((s) => (s?.status ?? "").toUpperCase() === "COMPLETED");
  }, [booking?.pets]);
  const hasAnyActiveRoomService = useMemo(() => {
    const services = (booking?.pets ?? []).flatMap((p) => p.services ?? []);
    return services.some((s) => (s?.status ?? "").toUpperCase() !== "CANCELLED" && s?.isRequiredRoom === true);
  }, [booking?.pets]);

  /** Dịch vụ không yêu cầu phòng vẫn đang IN_PROGRESS → chưa được hoàn tất check-out. */
  const hasNonRoomServiceInProgress = useMemo(() => {
    const services = (booking?.pets ?? []).flatMap((p) => p.services ?? []);
    return services.some(
      (s) =>
        (s?.status ?? "").toUpperCase() === "IN_PROGRESS" &&
        s?.isRequiredRoom !== true
    );
  }, [booking?.pets]);
  const overdueRoomServices = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (booking?.pets ?? []).flatMap((pet) =>
      (pet.services ?? [])
        .filter((service) => {
          if (!service || (service.status ?? "").toUpperCase() === "CANCELLED") return false;
          if (!service.isRequiredRoom) return false;
          if (!service.estimatedCheckOutDate) return false;
          const d = new Date(service.estimatedCheckOutDate);
          d.setHours(0, 0, 0, 0);
          return d.getTime() < today.getTime();
        })
        .map((service) => ({ pet, service }))
    );
  }, [booking?.pets]);

  const checkoutPriceRows = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayMs = 1000 * 60 * 60 * 24;

    const toMidnight = (v?: string) => {
      if (!v) return null;
      const d = new Date(v);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const nightsFromEstimated = (start?: string, end?: string) => {
      const a = toMidnight(start);
      const b = toMidnight(end);
      if (!a || !b) return 1;
      const diff = Math.floor((b.getTime() - a.getTime()) / dayMs);
      return diff >= 1 ? diff : 1;
    };

    const activeServices = (booking?.pets ?? [])
      .flatMap((p) => p.services ?? [])
      .filter((s) => s && (s.status ?? "").toUpperCase() !== "CANCELLED");

    return activeServices.map((service) => {
      const beforeSubtotal = Number(service.subtotal ?? 0);
      let afterSubtotal = beforeSubtotal;
      let delta = 0;
      let overdueNights = 0;

      const requiredRoom = service.isRequiredRoom === true;
      if (requiredRoom && service.estimatedCheckOutDate) {
        const estimatedOut = toMidnight(service.estimatedCheckOutDate);
        if (estimatedOut && estimatedOut.getTime() < today.getTime()) {
          overdueNights = Math.max(0, Math.floor((today.getTime() - estimatedOut.getTime()) / dayMs));

          const currentNights =
            Number(service.numberOfNights ?? 0) >= 1
              ? Number(service.numberOfNights)
              : nightsFromEstimated(service.estimatedCheckInDate, service.estimatedCheckOutDate);

          // Backend overtime uses unitPrice * newNights.
          const unitPriceFromSubtotal = currentNights > 0 ? beforeSubtotal / currentNights : 0;
          const unitPrice =
            Number.isFinite(unitPriceFromSubtotal) && unitPriceFromSubtotal >= 0
              ? unitPriceFromSubtotal
              : Number(service.unitPrice ?? 0);

          const newNights = currentNights + overdueNights;
          afterSubtotal = unitPrice * newNights;
          delta = afterSubtotal - beforeSubtotal;
        }
      }

      const additionalChargeItems = (service.items ?? []).filter(
        (i) => i && i.isActive !== false && String(i.itemType ?? "").toUpperCase() === "CHARGE"
      );

      return {
        serviceId: Number(service.id),
        serviceName: service.serviceName ?? "Dịch vụ",
        requiredRoom,
        status: service.status ?? "—",
        beforeSubtotal,
        afterSubtotal,
        delta,
        overdueNights,
        additionalChargeCount: additionalChargeItems.length,
      };
    });
  }, [booking?.pets]);

  const manualNoShowLines = useMemo(
    () => (noShowPreview?.lines ?? []).filter((l) => !l.autoMarkNoShow),
    [noShowPreview]
  );

  const canCancelLineItem = activeLineItems > 1;

  const openCancelDialog = (target: { type: "service" | "item"; id: number; label: string }) => {
    setCancelDialog({ open: true, type: target.type, id: target.id, label: target.label, reason: "" });
  };

  const runPreview = useCallback(
    async (pets: AdminCheckInRepricePetInput[]) => {
      if (!id) return;
      setCheckInPreviewLoading(true);
      try {
        const res = await previewCheckInReprice(id, { pets });
        setCheckInPreview(res.data as any);
      } catch (e) {
        console.error(e);
        setCheckInPreview(null);
      } finally {
        setCheckInPreviewLoading(false);
      }
    },
    [id]
  );

  const fetchBooking = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getAdminBookingDetail(id);
      const basic = (res.data ?? null) as BookingResponse | null;
      if (basic) {
        const petsRes = await getAdminBookingPets(id);
        const pets = (petsRes.data ?? []) as any[];
        setBooking({ ...basic, pets } as any);
        try {
          const ns = await getAdminBookingNoShowPreview(id);
          setNoShowPreview((ns.data as AdminBookingNoShowPreviewResponse | undefined) ?? null);
        } catch {
          setNoShowPreview(null);
        }
      } else {
        setBooking(null);
        setNoShowPreview(null);
      }
    } catch (error) {
      console.error(error);
      setBooking(null);
      setNoShowPreview(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleMarkManualNoShow = useCallback(async () => {
    if (!id) return;
    if (
      !window.confirm(
        "Xác nhận đánh dấu no-show và hủy đơn đặt lịch này? Khách sẽ nhận email thông báo."
      )
    ) {
      return;
    }
    setActionLoading(true);
    try {
      await markAdminBookingManualNoShow(id);
      toast.success("Đã hủy đơn do no-show.");
      await fetchBooking();
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || "Không thể đánh dấu no-show.");
    } finally {
      setActionLoading(false);
    }
  }, [id, fetchBooking]);

  useEffect(() => {
    if (id) fetchBooking();
    else setLoading(false);
  }, [id, fetchBooking]);

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

  const hasCheckedIn = Boolean(booking.bookingCheckInDate);
  // Some records can carry bookingCheckOutDate while status is still IN_PROGRESS.
  // Treat checkout as completed only when status is COMPLETED/CANCELLED.
  const hasCheckedOut =
    Boolean(booking.bookingCheckOutDate) &&
    ["COMPLETED", "CANCELLED"].includes((booking.status ?? "").toUpperCase());
  const checkOutDisabled =
    actionLoading ||
    (!hasAnyActiveRoomService && !allActiveServicesCompleted) ||
    hasNonRoomServiceInProgress;

  // (moved hooks above conditional returns)

  const openCheckInDialog = () => {
    if (booking?.status === "CANCELLED") return;
    const initialPets: AdminCheckInRepricePetInput[] = (booking.pets ?? []).map((p) => {
      const pType = (p.petType || "CAT").toUpperCase();
      const confirmedType = (pType === "DOG" || pType === "CAT") ? pType : "CAT";
      return {
        petId: Number(p.id),
        confirmedPetType: confirmedType,
        confirmedWeight: Number(p.weightAtBooking ?? 0),
        arrivalCondition: p.arrivalCondition ?? "",
        arrivalPhotos: parsePhotoUrls(p.arrivalPhotos),
        belongingPhotos: parsePhotoUrls(p.belongingPhotos),
      };
    });
    setCheckInPets(initialPets);
    setCheckInStaffNote("");
    setCheckInDialogOpen(true);
    setCheckInPreview(null);
    
    // Auto-preview once dialog opens to show immediate data
    runPreview(initialPets);
  };

  const setPetInput = (petId: number, patch: Partial<AdminCheckInRepricePetInput>) => {
    setCheckInPets((prev) =>
      prev.map((p) => (p.petId === petId ? { ...p, ...patch } : p))
    );
  };

  const openCheckOutDialog = () => {
    if (booking?.status === "CANCELLED") return;
    const initialPets: AdminCheckOutConfirmPetInput[] = (booking.pets ?? []).map((p) => ({
      petId: Number(p.id),
      departureCondition: p.departureCondition ?? "",
      departurePhotos: parsePhotoUrls(p.departurePhotos),
    }));
    setCheckOutPets(initialPets);
    const overtimeInit: AdminCheckOutOvertimeInput[] = overdueRoomServices.map(({ service }) => ({
      bookingPetServiceId: Number(service.id),
      note: "",
    }));
    setCheckOutOvertimeAdjustments(overtimeInit);
    setCheckOutDialogOpen(true);
  };

  const setCheckOutPetInput = (petId: number, patch: Partial<AdminCheckOutConfirmPetInput>) => {
    setCheckOutPets((prev) => prev.map((p) => (p.petId === petId ? { ...p, ...patch } : p)));
  };
  const setCheckOutOvertimeInput = (bookingPetServiceId: number, note: string) => {
    setCheckOutOvertimeAdjustments((prev) => {
      const found = prev.find((x) => x.bookingPetServiceId === bookingPetServiceId);
      if (found) {
        return prev.map((x) => (x.bookingPetServiceId === bookingPetServiceId ? { ...x, note } : x));
      }
      return [...prev, { bookingPetServiceId, note }];
    });
  };

  const handleCancelLineItem = async () => {
    if (!id || !cancelDialog.id || !cancelDialog.reason.trim()) return;
    setCancelSubmitting(true);
    try {
      if (cancelDialog.type === "service") {
        await cancelBookingPetService(id, cancelDialog.id, cancelDialog.reason);
      } else {
        await cancelBookingPetServiceItem(id, cancelDialog.id, cancelDialog.reason);
      }
      toast.success("Hủy dịch vụ thành công!");
      setCancelDialog(prev => ({ ...prev, open: false, reason: "" }));
      
      // Reload current data
      await fetchBooking();
      // Re-run preview with current pet inputs
      await runPreview(checkInPets);
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || "Không thể hủy dịch vụ");
    } finally {
      setCancelSubmitting(false);
    }
  };

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
              fontSize: "0.8125rem",
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
                fontSize: "0.75rem",
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
                fontSize: "0.75rem",
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
          {booking.status === "CANCELLED" && booking.cancelledReason && (
            <Alert 
              severity="error" 
              sx={{ 
                borderRadius: "16px",
                backgroundColor: "#fff1f0",
                color: "#b71d18",
                border: "1px solid #ffccc7",
                "& .MuiAlert-icon": { color: "#ff4d4f" },
                "& .MuiAlert-message": { fontSize: "0.9375rem", width: "100%" } 
              }}
            >
              <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Lý do hủy đơn:</Typography>
              <Typography sx={{ fontSize: "0.9375rem" }}>
                {booking.cancelledReason}
              </Typography>
            </Alert>
          )}

          {/* Card 1: Thông tin chung Booking */}
          <Card
            sx={{
              p: 4,
              borderRadius: "24px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              border: "1px solid #FFF",
            }}
          >
            <Typography sx={{ fontWeight: 900, fontSize: "1.125rem", mb: 3, color: "#1C252E" }}>
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
                <InfoRow label="Check-in" value={formatDateTime(booking.bookingCheckInDate)} />
                <InfoRow label="Check-out" value={formatDateTime(booking.bookingCheckOutDate)} />
              </Box>
              <Box>
                <InfoRow label="Tổng tiền" value={formatCurrency(booking.totalAmount)} />
                <InfoRow label="Đã thanh toán" value={formatCurrency(booking.paidAmount)} />
                <InfoRow label="Còn lại" value={formatCurrency(booking.remainingAmount)} />
                <InfoRow label="Tiền cọc" value={formatCurrency(booking.depositAmount ?? 0)} />
                <InfoRow
                  label="Hình thức thanh toán"
                  value={getPaymentMethodLabel(booking.paymentMethod)}
                />
                <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2.5 }}>
                  <Typography sx={{ color: "text.secondary", minWidth: 180, fontWeight: 600, fontSize: "0.9062rem" }}>
                    Ghi chú nội bộ
                  </Typography>
                  <Box sx={{ flex: 1, display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <Typography 
                      sx={{ 
                        fontSize: "1rem", 
                        color: "text.primary", 
                        fontWeight: 500,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word"
                      }}
                    >
                      {booking.internalNotes || "—"}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setTempNote(booking.internalNotes || "");
                        setIsEditingNote(true);
                      }}
                      sx={{ 
                        color: "primary.main",
                        p: 0.5,
                        mt: -0.5,
                        "&:hover": { bgcolor: "primary.lighter" }
                      }}
                    >
                      <EditIcon sx={{ fontSize: "1.125rem" }} />
                    </IconButton>
                  </Box>
                </Stack>
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

          {/* Actions: No-show thủ công / Check-in / Check-out — ghi nhận thời gian vào/ra (bookingCheckInDate, bookingCheckOutDate) */}
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            {!hasCheckedIn && booking.status !== "CANCELLED" && noShowPreview?.showManualNoShowButton && manualNoShowLines.length > 0 && (
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
                sx={{
                  mr: { sm: 1 },
                  p: 1.5,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "warning.light",
                  bgcolor: "rgba(255, 183, 77, 0.12)",
                  maxWidth: { xs: "100%", sm: 520 },
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "warning.dark", display: "block", mb: 0.5 }}>
                    No-show (thủ công)
                  </Typography>
                  {noShowPreview?.earliestNoShowReferenceStartOffset && manualNoShowLines.length > 1 ? (
                    <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mb: 0.75 }}>
                      Mốc hẹn sớm nhất (nhiều dịch vụ):{" "}
                      <strong>{formatDateTime(noShowPreview.earliestNoShowReferenceStartOffset)}</strong>
                    </Typography>
                  ) : null}
                  {manualNoShowLines.map((line) => (
                    <Typography key={line.bookingPetServiceId} variant="body2" sx={{ color: "text.secondary", fontSize: "0.8125rem" }}>
                      <strong>{line.serviceName}</strong>
                      {" — "}
                      Trễ hiện tại: <strong>{line.minutesLateNow}</strong> phút · Grace tối đa: <strong>{line.gracePeriodMinutes}</strong> phút
                      {line.allowLateCheckin ? ` · Cho phép muộn: ${line.lateCheckinMinutes} phút` : ""}
                    </Typography>
                  ))}
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  disabled={actionLoading}
                  sx={{ minHeight: "2.75rem", fontSize: "0.875rem", fontWeight: 600, textTransform: "none", px: 2.5, whiteSpace: "nowrap" }}
                  onClick={handleMarkManualNoShow}
                >
                  Đánh No-show
                </Button>
              </Stack>
            )}
            {!hasCheckedIn && booking.status !== "CANCELLED" && (
              <Button
                variant="outlined"
                color="primary"
                disabled={actionLoading}
                sx={{ minHeight: "2.75rem", fontSize: "0.875rem", fontWeight: 600, textTransform: "none", px: 2.5 }}
                onClick={openCheckInDialog}
              >
                {actionLoading ? "Đang xử lý..." : "Check-in"}
              </Button>
            )}
            {booking.status !== "CANCELLED" && !hasCheckedOut && (
              <Tooltip
                title={
                  hasNonRoomServiceInProgress
                    ? "Còn dịch vụ (không yêu cầu phòng) đang thực hiện — hoàn thành trước khi check-out."
                    : !hasAnyActiveRoomService && !allActiveServicesCompleted
                      ? "Booking không có dịch vụ phòng: cần hoàn thành tất cả dịch vụ không phòng trước khi check-out."
                      : ""
                }
                disableHoverListener={
                  !(hasNonRoomServiceInProgress || (!hasAnyActiveRoomService && !allActiveServicesCompleted))
                }
              >
                <span style={{ display: "inline-flex" }}>
                  <Button
                    variant="contained"
                    color="success"
                    disabled={checkOutDisabled}
                    sx={{ minHeight: "2.75rem", fontSize: "0.875rem", fontWeight: 600, textTransform: "none", px: 2.5 }}
                    onClick={() => openCheckOutDialog()}
                  >
                    {actionLoading ? "Đang xử lý..." : "Check-out"}
                  </Button>
                </span>
              </Tooltip>
            )}
          </Box>

          {/* Dialog: Check-in + xác nhận loại thú / cân nặng + preview chênh lệch giá */}
          <Dialog
            open={checkInDialogOpen}
            onClose={() => {
              if (checkInPreviewLoading || checkInConfirmLoading) return;
              setCheckInDialogOpen(false);
            }}
            maxWidth="lg"
            fullWidth
            PaperProps={{
              sx: { borderRadius: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }
            }}
          >
            <DialogTitle sx={{ fontWeight: 900, fontSize: "1.5rem", pt: 4, px: 4, color: "#1C252E", borderBottom: "1px solid #F4F6F8" }}>
              Check-in — Xác nhận & Tính lại giá
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, minHeight: "500px" }}>
                {/* Left Column: Input Form */}
                <Box sx={{ p: 4, borderRight: { lg: "1px solid #F4F6F8" } }}>
                  <Typography sx={{ fontSize: "0.9375rem", color: "text.secondary", mb: 4, lineHeight: 1.6 }}>
                    Vui lòng xác nhận lại <b>Loại thú cưng</b> và <b>Cân nặng thực tế</b> để hệ thống cập nhật lại báo giá chính xác nhất.
                  </Typography>

                  <Box sx={{ mb: 4 }}>
                    <Typography sx={{ fontWeight: 800, mb: 2, fontSize: "1rem", color: "#1C252E" }}>Thông tin thú cưng thực tế</Typography>
                    <Table size="small" sx={{ "& .MuiTableCell-root": { py: 1.5 } }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800, bgcolor: "#F8F9FA", borderRadius: "8px 0 0 8px" }}>Thú cưng</TableCell>
                          <TableCell sx={{ fontWeight: 800, bgcolor: "#F8F9FA" }}>Loại thú</TableCell>
                          <TableCell sx={{ fontWeight: 800, bgcolor: "#F8F9FA", borderRadius: "0 8px 8px 0" }}>Cân nặng (kg)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(booking.pets ?? []).map((p) => {
                          const input = checkInPets.find((x) => x.petId === Number(p.id));
                          return (
                            <TableRow key={p.id}>
                              <TableCell sx={{ fontWeight: 700 }}>{p.petName || `Pet #${p.id}`}</TableCell>
                              <TableCell>
                                <TextField
                                  select
                                  fullWidth
                                  value={input?.confirmedPetType ?? "CAT"}
                                  onChange={(e) => setPetInput(Number(p.id), { confirmedPetType: e.target.value })}
                                  size="small"
                                  sx={{ 
                                    "& .MuiOutlinedInput-root": { 
                                      borderRadius: "12px",
                                      bgcolor: "white",
                                      "& fieldset": { borderColor: "#E5E8EB" },
                                      "&:hover fieldset": { borderColor: "#919EAB" },
                                      "&.Mui-focused fieldset": { borderColor: "#00A76F" },
                                    },
                                    "& .MuiSelect-select": { py: 1, fontSize: "0.875rem", fontWeight: 600 }
                                  }}
                                >
                                  <MenuItem value="DOG" sx={{ fontSize: "0.875rem", fontWeight: 600 }}>Chó</MenuItem>
                                  <MenuItem value="CAT" sx={{ fontSize: "0.875rem", fontWeight: 600 }}>Mèo</MenuItem>
                                </TextField>
                              </TableCell>
                              <TableCell>
                                <TextField
                                  type="number"
                                  fullWidth
                                  size="small"
                                  value={input?.confirmedWeight ?? 0}
                                  onChange={(e) =>
                                    setPetInput(Number(p.id), { confirmedWeight: Number(e.target.value) })
                                  }
                                  inputProps={{ min: 0, step: 0.1 }}
                                  sx={{ 
                                    "& .MuiOutlinedInput-root": { 
                                      borderRadius: "12px",
                                      bgcolor: "white",
                                      "& fieldset": { borderColor: "#E5E8EB" },
                                      "&:hover fieldset": { borderColor: "#919EAB" },
                                      "&.Mui-focused fieldset": { borderColor: "#00A76F" },
                                    },
                                    "& input": { py: 1, fontSize: "0.875rem", fontWeight: 600 }
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Box>

                  <Box sx={{ mb: 4 }}>
                    <Typography sx={{ fontWeight: 800, mb: 1.5, fontSize: "1rem", color: "#1C252E" }}>Ghi chú nhân viên (tùy chọn)</Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      value={checkInStaffNote}
                      onChange={(e) => setCheckInStaffNote(e.target.value)}
                      placeholder="Ví dụ: Cân nặng thực tế khác so với lúc đặt..."
                      sx={{ 
                        "& .MuiOutlinedInput-root": { 
                          borderRadius: "16px",
                          bgcolor: "white",
                          "& fieldset": { borderColor: "#E5E8EB" },
                          "&.Mui-focused fieldset": { borderColor: "#00A76F" },
                        } 
                      }}
                    />
                  </Box>

                  <Box sx={{ mb: 4 }}>
                    <Typography sx={{ fontWeight: 900, mb: 2, fontSize: "0.9875rem", color: "#1C252E" }}>
                      Tình trạng khi đến & Hành lý (thực tế)
                    </Typography>
                    <Stack spacing={2}>
                      {(booking.pets ?? []).map((p) => {
                        const input = checkInPets.find((x) => x.petId === Number(p.id));
                        return (
                          <Box
                            key={p.id}
                            sx={{
                              p: 2,
                              borderRadius: "16px",
                              border: "1px solid rgba(145, 158, 171, 0.20)",
                              bgcolor: "white",
                            }}
                          >
                            <Typography sx={{ fontWeight: 900, mb: 1.5, color: "#1C252E" }}>
                              {p.petName}
                            </Typography>

                            <TextField
                              label="Tình trạng khi đến"
                              value={input?.arrivalCondition ?? ""}
                              onChange={(e) => setPetInput(Number(p.id), { arrivalCondition: e.target.value })}
                              placeholder="Nhập tình trạng khi thú cưng đến..."
                              fullWidth
                              multiline
                              rows={2}
                              size="small"
                              sx={{
                                "& .MuiInputBase-input": { fontSize: "0.9062rem" },
                                "& .MuiInputLabel-root": { fontSize: "0.875rem" },
                              }}
                            />

                            <Box sx={{ mt: 2 }}>
                              <UploadMultiFile
                                title="Ảnh khi đến"
                                compact
                                value={input?.arrivalPhotos ?? []}
                                onChange={(v) => setPetInput(Number(p.id), { arrivalPhotos: v })}
                              />
                            </Box>

                            <Box sx={{ mt: 2 }}>
                              <UploadMultiFile
                                title="Ảnh đồ đạc mang theo"
                                compact
                                value={input?.belongingPhotos ?? []}
                                onChange={(v) => setPetInput(Number(p.id), { belongingPhotos: v })}
                              />
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>

                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      variant="contained"
                      onClick={async () => {
                        if (!id) return;
                        setCheckInPreviewLoading(true);
                        try {
                          const res = await previewCheckInReprice(id, { pets: checkInPets });
                          setCheckInPreview(res.data as any);
                        } catch (e) {
                          console.error(e);
                          setCheckInPreview(null);
                        } finally {
                          setCheckInPreviewLoading(false);
                        }
                      }}
                      disabled={checkInPreviewLoading || checkInConfirmLoading}
                      sx={{ 
                        textTransform: "none", 
                        fontWeight: 900, 
                        borderRadius: "12px",
                        px: 4,
                        py: 1.5,
                        bgcolor: "#00A76F",
                        boxShadow: "0 8px 16px rgba(0, 167, 111, 0.24)",
                        "&:hover": { bgcolor: "#00784E", boxShadow: "none" }
                      }}
                    >
                      {checkInPreviewLoading ? <CircularProgress size={20} sx={{ mr: 1, color: "white" }} /> : null}
                      Kiểm tra chênh lệch giá
                    </Button>
                  </Box>
                </Box>

                {/* Right Column: Preview Result */}
                <Box sx={{ p: 4, bgcolor: "#F9FAFB", overflowY: "auto", maxHeight: "calc(100vh - 200px)" }}>
                  {!checkInPreview ? (
                    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", color: "text.secondary" }}>
                      <Box sx={{ opacity: 0.5, mb: 2 }}>
                        <VisibilityIcon sx={{ fontSize: 48 }} />
                      </Box>
                      <Typography sx={{ fontWeight: 700, mb: 1 }}>Chưa có thông tin thay đổi</Typography>
                      <Typography variant="body2">Nhấn "Kiểm tra chênh lệch giá" để xem tóm tắt và chi tiết báo giá mới.</Typography>
                    </Box>
                  ) : (
                    <>
                      <Typography sx={{ fontWeight: 900, mb: 3, fontSize: "1.125rem", color: "#1C252E" }}>Tóm tắt thay đổi</Typography>
                      
                      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 3 }}>
                        <Card sx={{ p: 2, borderRadius: "16px", boxShadow: "none", border: "1px solid #E5E8EB", bgcolor: "white" }}>
                          <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", fontWeight: 700, mb: 0.5 }}>TỔNG CŨ</Typography>
                          <Typography sx={{ fontWeight: 900, fontSize: "1.125rem", color: "#637381" }}>{formatCurrency(Number(checkInPreview.oldTotal ?? 0))}</Typography>
                        </Card>
                        <Card sx={{ p: 2, borderRadius: "16px", boxShadow: "none", bgcolor: "#F0F7FF", border: "1px solid #D0E9FF" }}>
                          <Typography sx={{ fontSize: "0.7rem", color: "#006C9C", fontWeight: 700, mb: 0.5 }}>TỔNG MỚI</Typography>
                          <Typography sx={{ fontWeight: 900, fontSize: "1.125rem", color: "#006C9C" }}>{formatCurrency(Number(checkInPreview.newTotal ?? 0))}</Typography>
                        </Card>
                        <Card sx={{ p: 2, borderRadius: "16px", boxShadow: "none", bgcolor: "#F0FFF8", border: "1px solid #B7F4D8" }}>
                          <Typography sx={{ fontSize: "0.7rem", color: "#118D57", fontWeight: 700, mb: 0.5 }}>ĐÃ THU</Typography>
                          <Typography sx={{ fontWeight: 900, fontSize: "1.125rem", color: "#118D57" }}>{formatCurrency(Number(checkInPreview.paidAmount ?? 0))}</Typography>
                        </Card>
                        {Number(checkInPreview.newRemaining ?? 0) < 0 ? (
                          <Card sx={{ p: 2, borderRadius: "16px", boxShadow: "none", bgcolor: "#F0FFF8", border: "1px solid #B7F4D8" }}>
                            <Typography sx={{ fontSize: "0.7rem", color: "#118D57", fontWeight: 700, mb: 0.5 }}>CẦN TRẢ LẠI</Typography>
                            <Typography sx={{ fontWeight: 900, fontSize: "1.125rem", color: "#118D57" }}>{formatCurrency(Math.abs(Number(checkInPreview.newRemaining)))}</Typography>
                          </Card>
                        ) : (
                          <Card sx={{ p: 2, borderRadius: "16px", boxShadow: "none", bgcolor: "#FFF5F2", border: "1px solid #FFD5CC" }}>
                            <Typography sx={{ fontSize: "0.7rem", color: "#B71D18", fontWeight: 700, mb: 0.5 }}>CÒN LẠI MỚI</Typography>
                            <Typography sx={{ fontWeight: 900, fontSize: "1.125rem", color: "#B71D18" }}>{formatCurrency(Number(checkInPreview.newRemaining ?? 0))}</Typography>
                          </Card>
                        )}
                      </Box>

                      <Divider sx={{ mb: 3, borderStyle: "dashed" }} />

                      <Box sx={{ mb: 4 }}>
                        <Typography sx={{ fontWeight: 800, mb: 2, fontSize: "0.9375rem", color: "#1C252E" }}>Thay đổi thuộc tính</Typography>
                        <Table size="small">
                          <TableBody>
                            {checkInPreview.petDiffs.map((d) => {
                              const typeChanged = d.oldPetType !== d.newPetType;
                              const weightChanged = Number(d.oldWeight) !== Number(d.newWeight);
                              
                              const formatPetType = (type?: string | null) => {
                                if (!type) return "";
                                if (type === "DOG") return "chó";
                                if (type === "CAT") return "mèo";
                                return type.toLowerCase();
                              };

                              return (
                                <TableRow key={d.petId}>
                                  <TableCell sx={{ fontWeight: 700, fontSize: "0.8125rem", py: 1.5 }}>{d.petName}</TableCell>
                                  <TableCell sx={{ py: 1.5 }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
                                        {d.oldWeight}kg {formatPetType(d.oldPetType)}
                                      </Typography>
                                      {(typeChanged || weightChanged) && (
                                        <Typography sx={{ fontSize: "0.75rem", color: "#00A76F", fontWeight: 900 }}>→</Typography>
                                      )}
                                      {(typeChanged || weightChanged) && (
                                        <Typography sx={{ fontSize: "0.8125rem", fontWeight: 700, color: "#00A76F" }}>
                                          {d.newWeight}kg {formatPetType(d.newPetType)}
                                        </Typography>
                                      )}
                                    </Stack>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </Box>

                      <Box>
                        <Typography sx={{ fontWeight: 800, mb: 2, fontSize: "0.9375rem" }}>Chênh lệch giá dịch vụ</Typography>
                        <Table size="small">
                          <TableBody>
                            {checkInPreview.serviceDiffs.map((d) => {
                              const delta = Number(d.delta ?? 0);
                              const items = (checkInPreview.itemDiffs ?? []).filter(
                                (it) => Number(it.bookingPetServiceId) === Number(d.bookingPetServiceId)
                              );

                              return [
                                <TableRow key={`svc-${d.bookingPetServiceId}`}>
                                  <TableCell sx={{ fontSize: "0.8125rem", py: 1 }}>
                                    <Typography sx={{ fontSize: "0.8125rem", fontWeight: 700 }}>
                                      {d.serviceName} ({d.petName})
                                    </Typography>
                                    <Typography sx={{ fontSize: "0.7812rem", color: "text.secondary", mt: 0.3 }}>
                                      {formatCurrency(Number(d.oldSubtotal ?? 0))} → {formatCurrency(Number(d.newSubtotal ?? 0))}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right" sx={{ py: 1, whiteSpace: "nowrap" }}>
                                    <Chip
                                      label={`${delta >= 0 ? "+" : ""}${formatCurrency(delta)}`}
                                      size="small"
                                      sx={{
                                        fontWeight: 800,
                                        fontSize: "0.7rem",
                                        height: 20,
                                        bgcolor: delta > 0 ? "#FF56301A" : delta < 0 ? "#22C55E1A" : "#919EAB1A",
                                        color: delta > 0 ? "#B71D18" : delta < 0 ? "#118D57" : "#637381",
                                        borderRadius: "6px",
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell align="right" sx={{ py: 1, whiteSpace: "nowrap" }}>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      disabled={!canCancelLineItem}
                                      onClick={() =>
                                        openCancelDialog({
                                          type: "service",
                                          id: Number(d.bookingPetServiceId),
                                          label: `${d.serviceName} (${d.petName})`,
                                        })
                                      }
                                      sx={{ textTransform: "none", fontWeight: 800, borderRadius: "10px" }}
                                    >
                                      Hủy dịch vụ
                                    </Button>
                                  </TableCell>
                                </TableRow>,
                                ...items.map((it) => {
                                  const d2 = Number(it.delta ?? 0);
                                  return (
                                    <TableRow key={`item-${it.itemId}`}>
                                      <TableCell sx={{ fontSize: "0.8125rem", py: 0.75 }}>
                                        <Typography sx={{ fontSize: "0.7812rem", fontWeight: 700 }}>
                                          └ {it.itemServiceName} ({it.itemType})
                                        </Typography>
                                        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.2 }}>
                                          {formatCurrency(Number(it.oldSubtotal ?? 0))} → {formatCurrency(Number(it.newSubtotal ?? 0))}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="right" sx={{ py: 0.75, whiteSpace: "nowrap" }}>
                                        <Chip
                                          label={`${d2 >= 0 ? "+" : ""}${formatCurrency(d2)}`}
                                          size="small"
                                          sx={{
                                            fontWeight: 800,
                                            fontSize: "0.7rem",
                                            height: 20,
                                            bgcolor: d2 > 0 ? "#FF56301A" : d2 < 0 ? "#22C55E1A" : "#919EAB1A",
                                            color: d2 > 0 ? "#B71D18" : d2 < 0 ? "#118D57" : "#637381",
                                            borderRadius: "6px",
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell align="right" sx={{ py: 0.75, whiteSpace: "nowrap" }}>
                                        <Button
                                          size="small"
                                          variant="text"
                                          disabled={!canCancelLineItem}
                                          onClick={() =>
                                            openCancelDialog({
                                              type: "item",
                                              id: Number(it.itemId),
                                              label: `${it.itemServiceName} (${it.itemType})`,
                                            })
                                          }
                                          sx={{ textTransform: "none", fontWeight: 800 }}
                                        >
                                          Hủy
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  );
                                }),
                              ];
                            })}
                          </TableBody>
                        </Table>
                        {!canCancelLineItem && (
                          <Typography sx={{ mt: 1.5, fontSize: "0.75rem", color: "text.secondary" }}>
                            Booking chỉ còn 1 dịch vụ (hoặc add-on) đang hoạt động nên không thể hủy.
                          </Typography>
                        )}
                      </Box>
                    </>
                  )}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 4, py: 3, borderTop: "1px solid #F4F6F8" }}>
              <Button
                onClick={() => setCheckInDialogOpen(false)}
                disabled={checkInPreviewLoading || checkInConfirmLoading}
                sx={{ textTransform: "none", color: "#637381", fontWeight: 700 }}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="contained"
                onClick={async () => {
                  if (!id) return;
                  setCheckInConfirmLoading(true);
                  try {
                    await confirmCheckInWithReprice(id, { pets: checkInPets, staffNote: checkInStaffNote.trim() || undefined });
                    setCheckInDialogOpen(false);
                    await fetchBooking();
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setCheckInConfirmLoading(false);
                  }
                }}
                disabled={checkInPreviewLoading || checkInConfirmLoading}
                sx={{ 
                  textTransform: "none", 
                  fontWeight: 900, 
                  px: 4, 
                  py: 1.2,
                  borderRadius: "12px",
                  bgcolor: "#1C252E",
                  "&:hover": { bgcolor: "#454F5B" }
                }}
              >
                {checkInConfirmLoading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : null}
                Hoàn tất Check-in
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dialog: Check-out cập nhật tình trạng + ảnh */}
          <Dialog
            open={checkOutDialogOpen}
            onClose={() => {
              if (checkOutConfirmLoading) return;
              setCheckOutDialogOpen(false);
            }}
            maxWidth="lg"
            fullWidth
            PaperProps={{
              sx: { borderRadius: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" },
            }}
          >
            <DialogTitle sx={{ fontWeight: 900, fontSize: "1.5rem", pt: 4, px: 4, color: "#1C252E", borderBottom: "1px solid #F4F6F8" }}>
              Check-out — Cập nhật tình trạng & ảnh
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              <Box sx={{ p: 4, bgcolor: "white", overflowY: "auto", maxHeight: "calc(100vh - 200px)" }}>
                <Typography sx={{ fontSize: "0.9375rem", color: "text.secondary", mb: 3, lineHeight: 1.6 }}>
                  Vui lòng cập nhật <b>Tình trạng khi về</b> và <b>Ảnh khi về</b>. Ảnh đồ đạc mang theo sẽ được hiển thị lại (không chỉnh sửa ở bước check-out).
                </Typography>
                {overdueRoomServices.length > 0 && (
                  <Box sx={{ mb: 3, p: 2.5, borderRadius: "14px", border: "1px solid #FED7AA", bgcolor: "#FFFBEB" }}>
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: "#9A3412", mb: 1.5 }}>
                      Dịch vụ phòng quá hạn trả — xác nhận nội dung cộng thêm số đêm
                    </Typography>
                    <Stack spacing={1.5}>
                      {overdueRoomServices.map(({ pet, service }) => {
                        const estimated = service.estimatedCheckOutDate ? new Date(service.estimatedCheckOutDate) : null;
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const beforeSubtotal = Number(service.subtotal ?? 0);

                        const dayMs = 1000 * 60 * 60 * 24;
                        const overdueNights = (() => {
                          if (!estimated) return 0;
                          estimated.setHours(0, 0, 0, 0);
                          return Math.max(0, Math.floor((today.getTime() - estimated.getTime()) / dayMs));
                        })();

                        const currentNights =
                          Number(service.numberOfNights ?? 0) >= 1
                            ? Number(service.numberOfNights)
                            : (() => {
                                if (!service.estimatedCheckInDate || !service.estimatedCheckOutDate) return 1;
                                const checkIn = new Date(service.estimatedCheckInDate);
                                const checkOut = new Date(service.estimatedCheckOutDate);
                                checkIn.setHours(0, 0, 0, 0);
                                checkOut.setHours(0, 0, 0, 0);
                                const diff = Math.floor((checkOut.getTime() - checkIn.getTime()) / dayMs);
                                return diff >= 1 ? diff : 1;
                              })();

                        const unitPrice = currentNights > 0 ? beforeSubtotal / currentNights : Number(service.unitPrice ?? 0);
                        const overtimeAmount = overdueNights * unitPrice;
                        const noteValue =
                          checkOutOvertimeAdjustments.find((x) => x.bookingPetServiceId === Number(service.id))?.note ?? "";
                        return (
                          <Box key={service.id} sx={{ p: 1.5, borderRadius: "10px", border: "1px solid #FDE68A", bgcolor: "white" }}>
                            <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#7C2D12", mb: 0.75 }}>
                              {pet.petName} — {service.serviceName ?? "Dịch vụ phòng"} (#{service.id})
                            </Typography>
                            <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary", mb: 1 }}>
                              Quá hạn {overdueNights} đêm × {formatCurrency(unitPrice)} = <strong>{formatCurrency(overtimeAmount)}</strong>
                            </Typography>
                            <TextField
                              label="Nội dung thông báo cho dòng quá hạn này"
                              value={noteValue}
                              onChange={(e) => setCheckOutOvertimeInput(Number(service.id), e.target.value)}
                              placeholder="Ví dụ: Khách lưu trú quá ngày so với dự kiến, cộng thêm số đêm quá hạn."
                              fullWidth
                              size="small"
                            />
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                )}

                <Box sx={{ mb: 3, p: 2.5, borderRadius: "14px", border: "1px solid rgba(145, 158, 171, 0.20)", bgcolor: "#FFFFFF" }}>
                  <Typography sx={{ fontSize: "0.95rem", fontWeight: 900, color: "#1C252E", mb: 1.5 }}>
                    Bảng giá dịch vụ (trước / sau check-out)
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Dịch vụ</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell align="right">Trước</TableCell>
                        <TableCell align="right">Sau</TableCell>
                        <TableCell align="right">Chênh lệch</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {checkoutPriceRows.map((row) => (
                        <TableRow key={row.serviceId}>
                          <TableCell>
                            <Typography sx={{ fontWeight: 800, color: "#1C252E", fontSize: "0.9rem" }}>{row.serviceName}</Typography>
                            {row.requiredRoom ? (
                              row.overdueNights > 0 ? (
                                <Typography sx={{ fontSize: "0.78rem", color: "#9A3412", fontWeight: 700 }}>
                                  Phát sinh quá hạn: +{row.overdueNights} đêm
                                </Typography>
                              ) : (
                                <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>Không có cộng thêm đêm</Typography>
                              )
                            ) : (
                              <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                                Additional charge hiện có: {row.additionalChargeCount}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={getServiceStatusLabel(row.status, row.requiredRoom)}
                              size="small"
                              sx={{ 
                                fontWeight: 800, 
                                fontSize: "0.7rem",
                                borderRadius: "6px",
                                bgcolor: "#919EAB1A",
                                color: "#637381"
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">{formatCurrency(row.beforeSubtotal)}</TableCell>
                          <TableCell align="right">{formatCurrency(row.afterSubtotal)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 900, color: row.delta > 0 ? "#B71D18" : "text.secondary" }}>
                            {row.delta >= 0 ? "+" : ""}
                            {formatCurrency(row.delta)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Typography sx={{ mt: 1, fontSize: "0.78rem", color: "text.secondary" }}>
                    Phần cộng thêm áp dụng cho dịch vụ yêu cầu phòng khi ngày trả dự kiến sớm hơn ngày hiện tại.
                  </Typography>
                </Box>

                <Stack spacing={2.5}>
                  {(booking.pets ?? []).map((p) => {
                    const input = checkOutPets.find((x) => x.petId === Number(p.id));
                    const belonging = parsePhotoUrls(p.belongingPhotos);
                    return (
                      <Box
                        key={p.id}
                        sx={{
                          p: 2.5,
                          borderRadius: "16px",
                          border: "1px solid rgba(145, 158, 171, 0.20)",
                          bgcolor: "#F9FAFB",
                        }}
                      >
                        <Typography sx={{ fontWeight: 900, mb: 2, color: "#1C252E" }}>
                          {p.petName}
                        </Typography>

                        <TextField
                          label="Tình trạng khi về"
                          value={input?.departureCondition ?? ""}
                          onChange={(e) => setCheckOutPetInput(Number(p.id), { departureCondition: e.target.value })}
                          placeholder="Nhập tình trạng khi thú cưng về..."
                          fullWidth
                          multiline
                          rows={2}
                          size="small"
                          sx={{
                            mb: 2,
                            "& .MuiInputBase-input": { fontSize: "0.9062rem" },
                            "& .MuiInputLabel-root": { fontSize: "0.875rem" },
                          }}
                        />

                        <UploadMultiFile
                          title="Ảnh khi về"
                          compact
                          value={input?.departurePhotos ?? []}
                          onChange={(v) => setCheckOutPetInput(Number(p.id), { departurePhotos: v })}
                        />

                        <Box sx={{ mt: 2.5 }}>
                          <Typography sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.875rem", mb: 1 }}>
                            Ảnh đồ đạc mang theo
                          </Typography>
                          <PhotoThumbnails photos={belonging} />
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 4, py: 3, borderTop: "1px solid #F4F6F8", flexWrap: "wrap", gap: 1 }}>
              <Button
                onClick={() => setCheckOutDialogOpen(false)}
                disabled={checkOutConfirmLoading}
                sx={{ textTransform: "none", color: "#637381", fontWeight: 700 }}
              >
                Hủy bỏ
              </Button>
              <Stack alignItems="flex-end" spacing={0.5} sx={{ ml: "auto" }}>
                <Button
                  variant="contained"
                  disabled={checkOutConfirmLoading || hasNonRoomServiceInProgress}
                  onClick={async () => {
                    if (!id || hasNonRoomServiceInProgress) return;
                    setCheckOutConfirmLoading(true);
                    try {
                      await checkOutBooking(id, {
                        pets: checkOutPets,
                        overtimeAdjustments: checkOutOvertimeAdjustments,
                      });
                      setCheckOutDialogOpen(false);
                      await fetchBooking();
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setCheckOutConfirmLoading(false);
                    }
                  }}
                  sx={{
                    textTransform: "none",
                    fontWeight: 900,
                    px: 4,
                    py: 1.2,
                    borderRadius: "12px",
                    bgcolor: "#1C252E",
                    "&:hover": { bgcolor: "#454F5B" },
                    ...(hasNonRoomServiceInProgress
                      ? { opacity: 0.45, filter: "grayscale(0.25)" }
                      : {}),
                  }}
                >
                  {checkOutConfirmLoading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : null}
                  Hoàn tất Check-out
                </Button>
                {hasNonRoomServiceInProgress ? (
                  <Typography variant="caption" sx={{ color: "warning.dark", fontWeight: 600, maxWidth: 360, textAlign: "right" }}>
                    Chưa có dịch vụ hoàn tất nên chưa thể checkout
                  </Typography>
                ) : null}
              </Stack>
            </DialogActions>
          </Dialog>

          <Dialog open={cancelDialog.open} onClose={() => setCancelDialog((p) => ({ ...p, open: false }))} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 900 }}>Hủy dịch vụ</DialogTitle>
            <DialogContent>
              <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mb: 1 }}>
                {cancelDialog.label}
              </Typography>
              <TextField
                label="Lý do hủy"
                value={cancelDialog.reason}
                onChange={(e) => setCancelDialog((p) => ({ ...p, reason: e.target.value }))}
                fullWidth
                multiline
                minRows={3}
                required
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                onClick={() => setCancelDialog((p) => ({ ...p, open: false }))}
                disabled={cancelSubmitting}
                sx={{ textTransform: "none", fontWeight: 800 }}
              >
                Đóng
              </Button>
              <Button
                variant="contained"
                disabled={cancelSubmitting || !cancelDialog.id || !cancelDialog.reason.trim()}
                onClick={async () => {
                  if (!id || !cancelDialog.id || !cancelDialog.reason.trim()) return;
                  setCancelSubmitting(true);
                  try {
                    if (cancelDialog.type === "service") {
                      await cancelBookingPetService(id, cancelDialog.id, cancelDialog.reason.trim());
                    } else {
                      await cancelBookingPetServiceItem(id, cancelDialog.id, cancelDialog.reason.trim());
                    }
                    setCancelDialog((p) => ({ ...p, open: false }));
                    await fetchBooking();
                    await runPreview(checkInPets);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setCancelSubmitting(false);
                  }
                }}
                sx={{ textTransform: "none", fontWeight: 900, borderRadius: "12px" }}
              >
                {cancelSubmitting ? <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} /> : null}
                Xác nhận hủy
              </Button>
            </DialogActions>
          </Dialog>

          {/* Card 2: Danh sách Booking_Pets */}
          <Card
            sx={{
              p: 4,
              borderRadius: "24px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              border: "1px solid #FFF",
            }}
          >
            <Typography sx={{ fontWeight: 900, fontSize: "1.125rem", mb: 3, color: "#1C252E" }}>
              Danh sách thú cưng
            </Typography>
            {(!booking.pets || booking.pets.length === 0) ? (
              <Typography sx={{ color: "text.secondary" }}>Chưa có thú cưng.</Typography>
            ) : (
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, fontSize: "0.9375rem", py: 2 }}>Mã booking</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: "0.9375rem", py: 2 }}>Tên thú cưng</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: "0.9375rem", py: 2 }}>Loại</TableCell>
                    {booking.pets.some(
                      (p) => (p.foodItems && p.foodItems.length > 0) || isFoodBrought(p.foodBrought)
                    ) && (
                        <>
                          <TableCell sx={{ fontWeight: 800, fontSize: "0.9375rem", py: 2 }}>Thức ăn mang theo</TableCell>
                          <TableCell sx={{ fontWeight: 800, fontSize: "0.9375rem", py: 2 }}>Hướng dẫn cho ăn</TableCell>
                        </>
                      )}
                    <TableCell sx={{ fontWeight: 800, fontSize: "0.9375rem", py: 2 }} align="right">
                      Thao tác
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {booking.pets.map((pet) => (
                    <TableRow key={pet.id}>
                      <TableCell sx={{ fontSize: "0.9375rem", py: 2 }}>{booking.bookingCode}</TableCell>
                      <TableCell sx={{ fontSize: "0.9375rem", fontWeight: 600, py: 2 }}>{pet.petName}</TableCell>
                      <TableCell sx={{ fontSize: "0.9375rem", py: 2 }}>{pet.petType}</TableCell>
                      {booking.pets!.some(
                        (p) => (p.foodItems && p.foodItems.length > 0) || isFoodBrought(p.foodBrought)
                      ) && (
                          <>
                            <TableCell sx={{ fontSize: "0.9375rem", py: 2 }}>
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
                            <TableCell sx={{ fontSize: "0.9375rem", py: 2 }}>
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
            <Typography sx={{ fontWeight: 900, fontSize: "1.125rem", mb: 3, color: "#1C252E" }}>
              Danh sách dịch vụ theo thú cưng
            </Typography>
            {allServices.length === 0 ? (
              <Typography sx={{ color: "text.secondary" }}>Chưa có dịch vụ.</Typography>
            ) : (
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, fontSize: "0.9375rem", py: 2 }}>Dịch vụ</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: "0.9375rem", py: 2 }}>Thú cưng</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: "0.9375rem", py: 2 }}>Thời gian</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: "0.9375rem", py: 2 }}>Trạng thái</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: "0.9375rem", py: 2 }}>Thành tiền</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: "0.9375rem", py: 2 }} align="right">
                      Thao tác
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allServices.map(({ service, petName, petId }) => (
                    <TableRow key={service.id}>
                      <TableCell sx={{ fontSize: "0.9375rem", fontWeight: 600, py: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                          <span>{service.serviceName ?? `#${service.id}`}</span>
                          {service.isRequiredRoom && service.isOverCheckOutDue ? (
                            <Chip
                              size="small"
                              label="Quá hạn trả phòng"
                              color="warning"
                              sx={{ fontWeight: 700, fontSize: "0.75rem" }}
                            />
                          ) : null}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.9375rem", py: 2 }}>{petName}</TableCell>
                      <TableCell sx={{ fontSize: "0.9375rem", py: 2 }}>
                        {formatDateTime(service.scheduledStartTime)} –{" "}
                        {formatDateTime(service.scheduledEndTime)}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.9375rem", py: 2 }}>{service.status ?? "—"}</TableCell>
                      <TableCell sx={{ fontSize: "0.9375rem", fontWeight: 600, py: 2 }}>
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

      {/* Modal chỉnh sửa ghi chú nội bộ */}
      <Dialog
        open={isEditingNote}
        onClose={() => !saveLoading && setIsEditingNote(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "16px", p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.25rem", pb: 1 }}>
          Cập nhật ghi chú nội bộ
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={5}
            placeholder="Nhập ghi chú nội bộ cho booking này..."
            value={tempNote}
            onChange={(e) => setTempNote(e.target.value)}
            variant="outlined"
            autoFocus
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                fontSize: "1rem"
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1, gap: 1.5 }}>
          <Button
            onClick={() => setIsEditingNote(false)}
            disabled={saveLoading}
            sx={{ fontWeight: 600, textTransform: "none", color: "text.secondary" }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={saveLoading}
            onClick={async () => {
              if (!id) return;
              setSaveLoading(true);
              try {
                await updateAdminBookingInternalNotes(id, tempNote);
                await fetchBooking();
                setIsEditingNote(false);
              } catch (error) {
                console.error("Failed to update internal notes:", error);
              } finally {
                setSaveLoading(false);
              }
            }}
            sx={{
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "10px",
              px: 3,
              boxShadow: "none",
              "&:hover": { boxShadow: "none" }
            }}
          >
            {saveLoading ? <CircularProgress size={20} color="inherit" /> : "Lưu thay đổi"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
