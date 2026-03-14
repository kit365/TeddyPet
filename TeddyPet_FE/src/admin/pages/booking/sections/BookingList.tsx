import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { DataGrid } from "@mui/x-data-grid";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Badge from "@mui/material/Badge";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import PaymentsIcon from "@mui/icons-material/Payments";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import PetsIcon from "@mui/icons-material/Pets";
import InfoIcon from "@mui/icons-material/Info";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import NotesIcon from "@mui/icons-material/Notes";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import ScaleIcon from "@mui/icons-material/Scale";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import StoreIcon from "@mui/icons-material/Store";
import HotelIcon from "@mui/icons-material/Hotel";
import SpaIcon from "@mui/icons-material/Spa";
import NightlightIcon from "@mui/icons-material/Nightlight";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import {
  dataGridCardStyles,
  dataGridContainerStyles,
  dataGridStyles,
} from "../../product/configs/styles.config";
import { useDataGridLocale } from "../../../hooks/useDataGridLocale";
import { getBookingColumns } from "../configs/column.config";
import { BOOKING_STATUS_OPTIONS, getBookingSourceLabel, type BookingStatusFilter } from "../constants";
import { prefixAdmin } from "../../../constants/routes";
import { 
  approveOrRejectAdminCancelRequest, 
  getAdminBookings, 
  confirmFullPayment,
  getAdminBookingPets 
} from "../../../api/booking.api";
import { getBankInformationByBookingCode, type BookingBankInformationResponse } from "../../../../api/bank.api";
import type { BookingResponse, BookingPetResponse } from "../../../../types/booking.type";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

const formatDateTimeFull = (value?: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDepositStatusLabel = (status?: string) => {
  if (!status) return "—";
  switch (status.toUpperCase()) {
    case "PENDING":
      return "Chưa thanh toán cọc";
    case "PAID":
      return "Đã thanh toán cọc";
    case "EXPIRED":
      return "Cọc đã hết hạn";
    case "CANCELLED":
      return "Cọc đã huỷ";
    default:
      return status;
  }
};

const CustomNoRowsOverlay = () => (
  <Stack height="100%" alignItems="center" justifyContent="center">
    <div className="w-[100px] h-[100px] mb-[20px]">
      <img
        src="https://img.icons8.com/fluency/200/nothing-found.png"
        alt="No data"
        className="w-full h-full object-contain filter grayscale opacity-60"
      />
    </div>
    <Typography variant="body1" sx={{ fontSize: "0.9375rem", fontWeight: 500, color: "text.secondary" }}>
      Không tìm thấy đặt lịch nào
    </Typography>
  </Stack>
);

/** Chuẩn hóa item từ API (BigDecimal → number, LocalDateTime → string) để grid/calendar dùng. */
const normalizeBooking = (b: Record<string, unknown>): BookingResponse => ({
  ...b,
  id: String(b.id ?? ""),
  bookingCode: String(b.bookingCode ?? ""),
  customerName: String(b.customerName ?? ""),
  customerEmail: String(b.customerEmail ?? ""),
  customerPhone: String(b.customerPhone ?? ""),
  customerAddress: b.customerAddress != null ? String(b.customerAddress) : undefined,
  source: b.source != null ? String(b.source) : undefined,
  bookingType: String(b.bookingType ?? ""),
  totalAmount: Number(b.totalAmount ?? 0),
  paidAmount: Number(b.paidAmount ?? 0),
  remainingAmount: Number(b.remainingAmount ?? 0),
  depositAmount: Number((b as any).depositAmount ?? 0),
  // Cột "Đã cọc" hiển thị deposit_amount từ bảng booking_deposits (BE trả qua depositAmount)
  deposit: Number((b as any).depositAmount ?? b.deposit ?? 0),
  depositPaid: b.depositPaid != null ? Boolean(b.depositPaid) : undefined,
  depositId: b.depositId != null ? Number(b.depositId) : undefined,
  depositExpiresAt: b.depositExpiresAt != null ? String(b.depositExpiresAt) : undefined,
  paymentStatus: String(b.paymentStatus ?? "PENDING"),
  paymentMethod: b.paymentMethod != null ? String(b.paymentMethod) : undefined,
  status: String(b.status ?? "PENDING"),
  cancelRequested: b.cancelRequested != null ? Boolean(b.cancelRequested) : undefined,
  cancelledReason: b.cancelledReason != null ? String(b.cancelledReason) : undefined,
  internalNotes: b.internalNotes != null ? String(b.internalNotes) : undefined,
  bookingCheckInDate: b.bookingCheckInDate != null ? String(b.bookingCheckInDate) : undefined,
  bookingCheckOutDate: b.bookingCheckOutDate != null ? String(b.bookingCheckOutDate) : undefined,
  cancelledAt: b.cancelledAt != null ? String(b.cancelledAt) : undefined,
  cancelledBy: b.cancelledBy != null ? String(b.cancelledBy) : undefined,
  createdAt: b.createdAt != null ? String(b.createdAt) : "",
  createdBy: b.createdBy != null ? String(b.createdBy) : undefined,
  updatedAt: b.updatedAt != null ? String(b.updatedAt) : "",
  updatedBy: b.updatedBy != null ? String(b.updatedBy) : undefined,
  petName: b.petName != null ? String(b.petName) : undefined,
} as BookingResponse);

// --- Helper Components for Detailed Payment Dialog ---
const SectionHeader = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
    {React.cloneElement(icon as React.ReactElement, { sx: { fontSize: "1.1rem", color: "#637381" } } as any)}
    <Typography variant="subtitle2" sx={{ color: "#637381", textTransform: "uppercase", fontWeight: 800, letterSpacing: 1, fontSize: "0.75rem" }}>
      {title}
    </Typography>
  </Stack>
);

const InfoItem = ({ icon, label, value, bold, wrap }: { icon?: React.ReactNode, label: string, value?: string, bold?: boolean, wrap?: boolean }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      {icon} {label}:
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: bold ? 800 : 600, color: "#1C252E", wordBreak: wrap ? "break-word" : "normal" }}>
      {value || "—"}
    </Typography>
  </Box>
);

const DetailInfo = ({ icon, label, value }: { icon?: React.ReactNode, label: string, value?: string }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
    <Stack direction="row" spacing={0.5} alignItems="center">
      {icon && React.cloneElement(icon as React.ReactElement, { sx: { fontSize: "0.9rem", color: "#637381" } } as any)}
      <Typography variant="body2" fontWeight={700} color="#1C252E">{value || "—"}</Typography>
    </Stack>
  </Box>
);

const SummaryRow = ({ icon, label, value, color, fontSize }: { icon?: React.ReactNode, label: string, value: string, color?: string, fontSize?: string }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center">
    <Stack direction="row" alignItems="center" spacing={0.5}>
      {icon}
      <Typography variant="body2" color={color || "text.secondary"} sx={{ fontSize }}>{label}:</Typography>
    </Stack>
    <Typography variant="body2" sx={{ fontWeight: 800, color: color || "#1C252E", fontSize }}>{value}</Typography>
  </Stack>
);

const EmptyState = ({ icon, message }: { icon: React.ReactNode, message: string }) => (
  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 8, gap: 1, bgcolor: "#F4F6F8", borderRadius: "20px", mt: 2 }}>
    {React.cloneElement(icon as React.ReactElement, { sx: { fontSize: "2rem", color: "#919EAB" } } as any)}
    <Typography variant="body2" color="text.secondary">{message}</Typography>
  </Box>
);

export const BookingList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<BookingStatusFilter>("ALL");
  const [keyword, setKeyword] = useState("");

  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedRefundBooking, setSelectedRefundBooking] = useState<BookingResponse | null>(null);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedCancelBooking, setSelectedCancelBooking] = useState<BookingResponse | null>(null);
  const [cancelActionLoading, setCancelActionLoading] = useState(false);
  const [cancelActionError, setCancelActionError] = useState<string | null>(null);
  const [cancelBankInfo, setCancelBankInfo] = useState<BookingBankInformationResponse["data"] | null>(null);
  const [depositStatus, setDepositStatus] = useState<string | null>(null);
  const [staffNotes, setStaffNotes] = useState("");
  const [refundProof, setRefundProof] = useState<string | null>(null);
  const [refundProofFileName, setRefundProofFileName] = useState("");

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPaymentBooking, setSelectedPaymentBooking] = useState<BookingResponse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);
  const [paymentActionError, setPaymentActionError] = useState<string | null>(null);
  
  const [detailedPets, setDetailedPets] = useState<BookingPetResponse[]>([]);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const isCancelRequested = (row?: BookingResponse | null) => {
    if (!row) return false;
    return row.cancelRequested === true;
  };

  const handleConfirmPayment = async () => {
    if (!selectedPaymentBooking) return;
    setPaymentActionLoading(true);
    setPaymentActionError(null);
    try {
      await confirmFullPayment(selectedPaymentBooking.id, {
        paymentMethod,
        notes: paymentNotes.trim() || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      setPaymentDialogOpen(false);
      setSelectedPaymentBooking(null);
    } catch (e) {
      console.error(e);
      setPaymentActionError("Không thể xác nhận thanh toán.");
    } finally {
      setPaymentActionLoading(false);
    }
  };

  // Fetch detailed info when opening payment dialog
  useEffect(() => {
    if (paymentDialogOpen && selectedPaymentBooking) {
      setIsFetchingDetails(true);
      getAdminBookingPets(selectedPaymentBooking.id)
        .then((res) => {
          setDetailedPets(res.data || []);
        })
        .catch((err) => {
          console.error("Failed to fetch booking details:", err);
        })
        .finally(() => {
          setIsFetchingDetails(false);
        });
    } else {
      setDetailedPets([]);
    }
  }, [paymentDialogOpen, selectedPaymentBooking?.id]);

  // Load bank information & reset fields when mở popup duyệt hủy đơn
  useEffect(() => {
    if (!cancelDialogOpen || !selectedCancelBooking) {
      setCancelBankInfo(null);
      setDepositStatus(null);
      setStaffNotes("");
      setRefundProof(null);
      setRefundProofFileName("");
      return;
    }
    
    // Load bank information
    getBankInformationByBookingCode(selectedCancelBooking.bookingCode)
      .then((res) => {
        setCancelBankInfo(res.data ?? null);
      })
      .catch(() => {
        setCancelBankInfo(null);
      });

    // Determine deposit status based on booking info
    if (selectedCancelBooking.depositPaid === true) {
      setDepositStatus("PAID");
    } else if (selectedCancelBooking.depositExpiresAt) {
      const expiresAt = new Date(selectedCancelBooking.depositExpiresAt);
      if (expiresAt < new Date()) {
        setDepositStatus("EXPIRED");
      } else {
        setDepositStatus("PENDING");
      }
    } else {
      setDepositStatus("PENDING");
    }
  }, [cancelDialogOpen, selectedCancelBooking?.bookingCode]);

  const handleRefundProofFileChange = (file: File | null) => {
    if (!file) {
      setRefundProof(null);
      setRefundProofFileName("");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = typeof reader.result === "string" ? reader.result : "";
      setRefundProof(base64);
      setRefundProofFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const { data: apiData, isLoading } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: getAdminBookings,
    select: (res: any) => {
      const list = res?.data;
      if (!Array.isArray(list)) return [];
      return list.map((b: any) => normalizeBooking(b as unknown as Record<string, unknown>));
    },
  });

  const bookings = apiData ?? [];

  const filteredRows = useMemo(() => {
    let list = bookings;
    if (status !== "ALL") {
      list = list.filter((b) => b.status === status);
    }
    if (keyword.trim()) {
      const k = keyword.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.bookingCode.toLowerCase().includes(k) ||
          b.customerName.toLowerCase().includes(k) ||
          (b.customerPhone && b.customerPhone.toLowerCase().includes(k))
      );
    }
    return list;
  }, [bookings, status, keyword]);

  const pendingCount = useMemo(
    () => bookings.filter((b) => b.status === "PENDING").length,
    [bookings]
  );

  const columns = useMemo(
    () =>
      getBookingColumns(
        (row) => navigate(`/${prefixAdmin}/booking/detail/${row.id}`),
        (row) => navigate(`/${prefixAdmin}/booking/edit/${row.id}`),
        (row) => {
          setSelectedCancelBooking(row);
          setCancelDialogOpen(true);
          setCancelActionError(null);
        },
        (row) => {
          setSelectedPaymentBooking(row);
          setPaymentDialogOpen(true);
          setPaymentActionError(null);
          setPaymentMethod("CASH");
          setPaymentNotes("");
        },
        (row) => {
          // TODO: Implement delete functionality with confirmation
          console.log("Delete booking:", row.id);
        }
      ),
    [navigate]
  );

  const localeText = useDataGridLocale();

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setStatus(newValue as BookingStatusFilter);
  };

  return (
    <>
      <Card
        elevation={0}
        sx={{
          ...dataGridCardStyles,
          background: "white",
          border: "1px solid rgba(145, 158, 171, 0.2)",
          boxShadow: "0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)",
          borderRadius: "24px",
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        <Tabs
          value={status}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            px: 2,
            pt: 0.5,
            borderBottom: "1px solid rgba(145, 158, 171, 0.1)",
            "& .MuiTab-root": {
              fontSize: "0.8125rem",
              fontWeight: 700,
              textTransform: "none",
              minWidth: 70,
              py: 1.5,
              color: "#637381",
              "&.Mui-selected": { color: "#1C252E" },
            },
            "& .MuiTabs-indicator": { height: 3, bgcolor: "#1C252E" },
          }}
        >
          {BOOKING_STATUS_OPTIONS.map((opt) => (
            <Tab
              key={opt.value}
              value={opt.value}
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  {opt.label}
                  {opt.value === "PENDING" && pendingCount > 0 && (
                    <Badge
                      badgeContent={pendingCount}
                      color="error"
                      sx={{
                        ml: 1.5,
                        "& .MuiBadge-badge": {
                          fontSize: "0.625rem",
                          height: 18,
                          minWidth: 18,
                          position: "static",
                          transform: "none",
                        },
                      }}
                    />
                  )}
                </Stack>
              }
            />
          ))}
        </Tabs>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{ p: 2, alignItems: { md: "center" }, justifyContent: "space-between" }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#1C252E", fontSize: "1rem" }}>
              {status === "ALL" ? "Tất cả đặt lịch" : BOOKING_STATUS_OPTIONS.find((o) => o.value === status)?.label}
              <Box component="span" sx={{ ml: 1, color: "text.secondary", fontWeight: 500 }}>
                ({filteredRows.length})
              </Box>
            </Typography>
          </Stack>

          <TextField
            size="small"
            placeholder="Tìm mã đơn, tên khách, SĐT..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            sx={{
              width: { xs: "100%", md: 280 },
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                bgcolor: "#F4F6F8",
                "& fieldset": { border: "none" },
                "&:hover fieldset": { border: "none" },
                "&.Mui-focused fieldset": { border: "1px solid #1C252E" },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "text.secondary", fontSize: "1.125rem" }} />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        <div style={{ ...dataGridContainerStyles, padding: "0 16px 16px", minWidth: 0 }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            getRowId={(row) => row.id}
            loading={isLoading}
            localeText={localeText}
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10, page: 0 } },
            }}
            showCellVerticalBorder={false}
            showColumnVerticalBorder={false}
            density="compact"
            sx={{
              ...dataGridStyles,
              border: "none",
              "& .MuiDataGrid-columnHeader": {
                bgcolor: "#F4F6F8",
                color: "#637381",
                fontWeight: 700,
                fontSize: "0.9062rem",
                alignItems: "center",
                justifyContent: "center",
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "1px dashed rgba(145, 158, 171, 0.2)",
                fontSize: "0.9062rem",
                alignItems: "center",
                justifyContent: "center",
                display: "flex",
              },
            }}
            slots={{
              noRowsOverlay: CustomNoRowsOverlay,
            }}
            autoHeight
          />
        </div>
      </Card>

      <Dialog
        open={paymentDialogOpen}
        onClose={() => {
          if (paymentActionLoading) return;
          setPaymentDialogOpen(false);
          setSelectedPaymentBooking(null);
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "32px",
            boxShadow: "0 24px 72px -12px rgba(0, 0, 0, 0.24)",
            overflow: "hidden",
            maxWidth: "1400px", // Ultra-wide
            width: "95%"
          }
        }}
      >
        <DialogTitle sx={{ py: 3, px: 4, bgcolor: "#F8F9FA", borderBottom: "1px solid #E1F0FF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ p: 1.5, bgcolor: "#006C9C", borderRadius: "14px", display: "flex", boxShadow: "0 8px 16px rgba(0, 108, 156, 0.24)" }}>
              <ReceiptLongIcon sx={{ color: "white", fontSize: "1.8rem" }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: "#1C252E", letterSpacing: -0.5 }}>
                Xác nhận thanh toán
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">Mã booking:</Typography>
                <Chip 
                  label={selectedPaymentBooking?.bookingCode} 
                  size="small" 
                  sx={{ bgcolor: "#E1F0FF", color: "#006C9C", fontWeight: 800, borderRadius: "6px" }} 
                />
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 12, my: "auto" }} />
                <Typography variant="caption" sx={{ bgcolor: "#F4F6F8", px: 1, py: 0.2, borderRadius: "4px", color: "text.secondary", fontWeight: 600 }}>
                  {formatDateTimeFull(selectedPaymentBooking?.createdAt)}
                </Typography>
              </Stack>
            </Box>
          </Stack>
          
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: 1 }}>
              Trạng thái đơn
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip 
                label={selectedPaymentBooking?.status} 
                color="info" 
                size="small" 
                sx={{ fontWeight: 800, borderRadius: "8px" }} 
              />
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {paymentActionError && (
            <Alert severity="error" sx={{ m: 4, mb: 0, borderRadius: "12px" }}>
              {paymentActionError}
            </Alert>
          )}

          <Grid container sx={{ minHeight: "500px" }}>
            {/* Column 1: Booking & Customer Info (3.5 units) */}
            <Grid size={{ xs: 12, md: 3.5 }} sx={{ p: 4, borderRight: "1px solid #F1F3F4" }}>
              <Stack spacing={4}>
                <Box>
                  <SectionHeader icon={<PersonIcon />} title="Thông tin khách hàng" />
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "#F8F9FA", borderRadius: "16px", mt: 2 }}>
                    <Stack spacing={2}>
                      <InfoItem label="Tên khách hàng" value={selectedPaymentBooking?.customerName} bold />
                      <InfoItem icon={<PhoneIcon sx={{ fontSize: "1rem" }} />} label="Số điện thoại" value={selectedPaymentBooking?.customerPhone} />
                      <InfoItem icon={<EmailIcon sx={{ fontSize: "1rem" }} />} label="Email" value={selectedPaymentBooking?.customerEmail} />
                      <InfoItem icon={<LocationOnIcon sx={{ fontSize: "1rem" }} />} label="Địa chỉ" value={selectedPaymentBooking?.customerAddress || "—"} wrap />
                    </Stack>
                  </Paper>
                </Box>

                <Box>
                  <SectionHeader icon={<CalendarMonthIcon />} title="Thông tin đặt lịch" />
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "#FDFDFD", border: "1px dashed #919EAB", borderRadius: "16px", mt: 2 }}>
                    <Stack spacing={2}>
                      <InfoItem label="Loại đặt lịch" value={selectedPaymentBooking?.bookingType} />
                      <InfoItem label="Nguồn đến" value={selectedPaymentBooking?.source ? getBookingSourceLabel(selectedPaymentBooking.source) : "—"} />
                      <Divider />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Thời gian check-in:</Typography>
                        <Typography variant="body2" fontWeight={700} color="#006C9C">
                          {formatDateTimeFull(selectedPaymentBooking?.bookingCheckInDate) || "—"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Thời gian check-out:</Typography>
                        <Typography variant="body2" fontWeight={700} color="#006C9C">
                          {formatDateTimeFull(selectedPaymentBooking?.bookingCheckOutDate) || "—"}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Box>

                {selectedPaymentBooking?.internalNotes && (
                  <Box>
                    <SectionHeader icon={<NotesIcon />} title="Ghi chú hệ thống" />
                    <Typography variant="body2" sx={{ mt: 1, p: 2, bgcolor: "#FFF7CD", borderRadius: "12px", color: "#7A4100", fontStyle: "italic" }}>
                      "{selectedPaymentBooking.internalNotes}"
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Grid>

            {/* Column 2: Detailed Pet & Service List (5 units) */}
            <Grid size={{ xs: 12, md: 5 }} sx={{ p: 4, bgcolor: "#FBFBFC", overflowY: "auto", maxHeight: "700px" }}>
              <SectionHeader icon={<PetsIcon />} title="Chi tiết dịch vụ theo từng thú cưng" />
              
              {isFetchingDetails ? (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10, gap: 2 }}>
                  <CircularProgress size={40} thickness={5} sx={{ color: "#006C9C" }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>Đang tải chi tiết dịch vụ...</Typography>
                </Box>
              ) : detailedPets.length > 0 ? (
                <Stack spacing={3} sx={{ mt: 3 }}>
                  {detailedPets.map((pet) => (
                    <Box key={pet.id} sx={{ p: 3, bgcolor: "white", borderRadius: "20px", border: "1px solid #F1F3F4", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{ p: 1, bgcolor: "#FFF5E1", borderRadius: "10px", display: "flex" }}>
                            <PetsIcon sx={{ color: "#FFAB00", fontSize: "1.2rem" }} />
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.2 }}>{pet.petName}</Typography>
                            <Typography variant="caption" color="text.secondary">{pet.petType}</Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={1}>
                          <Chip label={`${pet.weightAtBooking || 0}kg`} icon={<ScaleIcon sx={{ fontSize: "0.9rem !important" }} />} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                        </Stack>
                      </Stack>

                      {(pet.healthIssues || pet.petConditionNotes || pet.arrivalCondition) && (
                        <Box sx={{ mb: 2.5, p: 1.5, bgcolor: "#F4F6F8", borderRadius: "12px" }}>
                          {pet.healthIssues && (
                            <Typography variant="caption" display="block" color="error.main" sx={{ display: "flex", alignItems: "center", gap: 0.5, fontWeight: 700 }}>
                              <LocalHospitalIcon sx={{ fontSize: "0.85rem" }} /> Sức khỏe: {pet.healthIssues}
                            </Typography>
                          )}
                          {pet.arrivalCondition && (
                            <Typography variant="caption" display="block" sx={{ mt: 0.5, color: "text.secondary" }}>
                              Tình trạng khi nhận: <b>{pet.arrivalCondition}</b>
                            </Typography>
                          )}
                        </Box>
                      )}

                      <Typography variant="caption" sx={{ color: "#919EAB", textTransform: "uppercase", fontWeight: 800, letterSpacing: 1, mb: 1, display: "block" }}>
                        Danh sách dịch vụ
                      </Typography>
                      
                      <Stack spacing={2}>
                        {pet.services?.map((svc) => (
                          <Box key={svc.id} sx={{ p: 2.5, border: "1px solid #F1F3F4", borderRadius: "18px", bgcolor: svc.isRequiredRoom ? "#F8FAFF" : "#F8FFF9", "&:hover": { borderColor: "#006C9C", bgcolor: "white" }, transition: "all 0.3s" }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Box sx={{ p: 1, bgcolor: svc.isRequiredRoom ? "#E1F0FF" : "#E1FFED", borderRadius: "12px", display: "flex" }}>
                                  {svc.isRequiredRoom ? <HotelIcon sx={{ color: "#006C9C", fontSize: "1.2rem" }} /> : <SpaIcon sx={{ color: "#00A76F", fontSize: "1.2rem" }} />}
                                </Box>
                                <Box>
                                  <Typography variant="subtitle2" fontWeight={800} color="#1C252E">{svc.serviceName}</Typography>
                                  <Chip 
                                    label={svc.isRequiredRoom ? "Dịch vụ Hotel" : "Dịch vụ Spa/Chăm sóc"} 
                                    size="small" 
                                    sx={{ 
                                      height: 20, 
                                      fontSize: "0.65rem", 
                                      fontWeight: 800, 
                                      bgcolor: svc.isRequiredRoom ? "rgba(0, 108, 156, 0.1)" : "rgba(0, 167, 111, 0.1)",
                                      color: svc.isRequiredRoom ? "#006C9C" : "#00A76F"
                                    }} 
                                  />
                                </Box>
                              </Stack>
                              <Typography variant="body1" fontWeight={900} color="#1C252E">
                                {formatCurrency(svc.subtotal || 0)}
                              </Typography>
                            </Stack>

                            <Grid container spacing={2} sx={{ mt: 0.5 }}>
                              {svc.isRequiredRoom ? (
                                <>
                                  <Grid size={{ xs: 6 }}>
                                    <DetailInfo label="Check-in dự kiến" value={formatDateTimeFull(svc.estimatedCheckInDate)} />
                                  </Grid>
                                  <Grid size={{ xs: 6 }}>
                                    <DetailInfo label="Check-out dự kiến" value={formatDateTimeFull(svc.estimatedCheckOutDate)} />
                                  </Grid>
                                  <Grid size={{ xs: 6 }}>
                                    <DetailInfo label="Phòng được gán" value={svc.roomId ? `Phòng #${svc.roomId}` : "Chưa có phòng"} icon={<MeetingRoomIcon sx={{ fontSize: "1rem" }} />} />
                                  </Grid>
                                  <Grid size={{ xs: 6 }}>
                                    <DetailInfo label="Thời gian lưu trú" value={`${svc.numberOfNights || 0} đêm`} icon={<NightlightIcon sx={{ fontSize: "1rem" }} />} />
                                  </Grid>
                                  <Grid size={{ xs: 12 }}>
                                    <DetailInfo label="Nhân viên phụ trách" value={svc.assignedStaffName || (svc.assignedStaffId ? `#${svc.assignedStaffId}` : "Chưa gán nhân viên")} icon={<AssignmentIndIcon sx={{ fontSize: "1rem" }} />} />
                                  </Grid>
                                </>
                              ) : (
                                <>
                                  <Grid size={{ xs: 6 }}>
                                    <DetailInfo label="Ca làm việc / Slot" value={svc.timeSlotId ? `Slot #${svc.timeSlotId}` : "N/A"} icon={<AccessTimeIcon sx={{ fontSize: "1rem" }} />} />
                                  </Grid>
                                  <Grid size={{ xs: 6 }}>
                                    <DetailInfo label="Thời gian bắt đầu" value={formatDateTimeFull(svc.scheduledStartTime)} />
                                  </Grid>
                                  <Grid size={{ xs: 12 }}>
                                    <DetailInfo label="Nhân viên phụ trách" value={svc.assignedStaffName || (svc.assignedStaffId ? `#${svc.assignedStaffId}` : "Chưa gán nhân viên")} icon={<AssignmentIndIcon sx={{ fontSize: "1rem" }} />} />
                                  </Grid>
                                </>
                              )}
                            </Grid>
                            
                            {svc.items && svc.items.length > 0 && (
                              <Box sx={{ mt: 2, pt: 2, borderTop: "1px dashed #E1F0FF" }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: "#637381", mb: 1, display: "block" }}>
                                  PHỤ PHÍ & DỊCH VỤ THÊM
                                </Typography>
                                <Stack spacing={1}>
                                  {svc.items.map(item => (
                                    <Box key={item.id} sx={{ display: "flex", justifyContent: "space-between", bgcolor: "#FBFBFC", p: 1, borderRadius: "8px" }}>
                                      <Box>
                                        <Typography variant="caption" color="#006C9C" fontWeight={700}>+ {item.itemServiceName}</Typography>
                                        {item.chargeReason && <Typography variant="caption" display="block" color="text.secondary" fontStyle="italic">Lý do: {item.chargeReason}</Typography>}
                                      </Box>
                                      <Typography variant="caption" fontWeight={800}>{formatCurrency(Number(item.chargeEvidence || 0))}</Typography>
                                    </Box>
                                  ))}
                                </Stack>
                              </Box>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <EmptyState icon={<StoreIcon />} message="Chưa có thông tin dịch vụ chi tiết" />
              )}
            </Grid>

            {/* Column 3: Payment & Final Summary (3.5 units) */}
            <Grid size={{ xs: 12, md: 3.5 }} sx={{ p: 4, bgcolor: "white" }}>
              <Stack spacing={4}>
                <Box sx={{ 
                  p: 3, 
                  bgcolor: "#F4FBFA", 
                  borderRadius: "24px", 
                  border: "1px solid #D1E9FF",
                  position: "relative",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0, right: 0,
                    width: "80px", height: "80px",
                    bgcolor: "rgba(0, 167, 111, 0.05)",
                    borderRadius: "0 0 0 80px"
                  }
                }}>
                  <Typography variant="subtitle2" sx={{ mb: 2.5, color: "#1C252E", fontWeight: 900 }}>
                    TỔNG KẾT THANH TOÁN
                  </Typography>
                  
                  <Stack spacing={2}>
                    <SummaryRow label="Tổng cộng dịch vụ" value={formatCurrency(selectedPaymentBooking?.totalAmount || 0)} />
                    <SummaryRow label="Đã thanh toán cọc" value={`- ${formatCurrency(selectedPaymentBooking?.paidAmount || 0)}`} color="#00A76F" icon={<CheckCircleIcon sx={{ fontSize: "1rem" }} />} />
                    
                    <Divider sx={{ borderStyle: "dashed", my: 1 }} />

                    <Box sx={{ py: 1 }}>
                      <Typography variant="caption" color="error.main" fontWeight={800} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                        CÒN LẠI CẦN THU
                      </Typography>
                      <Typography variant="h3" color="error.main" sx={{ fontWeight: 950, letterSpacing: -1, mt: 0.5 }}>
                        {formatCurrency(selectedPaymentBooking?.remainingAmount || 0)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: "#637381" }}>Hình thức thanh toán</Typography>
                    <TextField
                      select
                      fullWidth
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      SelectProps={{
                        native: true,
                        sx: { "& .MuiSelect-select": { py: 1.5 } },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "10px",
                          bgcolor: "#F9FAFB",
                          fontSize: "0.9375rem",
                          fontWeight: 500,
                          "& fieldset": { borderColor: "#E0E0E0" },
                          "&:hover fieldset": { borderColor: "#919EAB" },
                          "&.Mui-focused fieldset": { borderWidth: "1px", borderColor: "primary.main" },
                        },
                      }}
                    >
                      <option value="CASH">Tiền mặt (Cash)</option>
                      <option value="BANK_TRANSFER">Chuyển khoản (Bank)</option>
                    </TextField>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: "#637381" }}>Ghi chú thu ngân</Typography>
                    <TextField
                      multiline
                      rows={3}
                      fullWidth
                      placeholder="Ghi chú về tiền mặt, số bill..."
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "14px", bgcolor: "#F9FAFB" } }}
                    />
                  </Box>
                </Stack>

                <Box sx={{ p: 2, bgcolor: "#E1F0FF", borderRadius: "16px", border: "1px solid #B4D7FA" }}>
                  <Stack direction="row" spacing={1.5}>
                    <InfoIcon sx={{ color: "#006C9C", fontSize: "1.2rem" }} />
                    <Typography variant="caption" sx={{ color: "#003450", fontWeight: 600, lineHeight: 1.4 }}>
                      Việc xác nhận thanh toán này sẽ đánh dấu đơn hàng đã được thu đủ tiền và sẵn sàng lưu trữ hồ sơ.
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 4, py: 3, borderTop: "1px solid #F1F3F4", justifyContent: "space-between" }}>
          <Button 
            onClick={() => setPaymentDialogOpen(false)} 
            disabled={paymentActionLoading}
            variant="text"
            sx={{ 
              px: 3, 
              borderRadius: "12px", 
              textTransform: "none", 
              fontWeight: 700, 
              color: "#637381"
            }}
          >
            Đóng
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmPayment}
            startIcon={paymentActionLoading ? <CircularProgress size={20} color="inherit" /> : <PaymentsIcon />}
            disabled={paymentActionLoading}
            sx={{ 
              px: 5, 
              py: 1.5, 
              borderRadius: "14px", 
              textTransform: "none", 
              fontWeight: 900,
              fontSize: "1rem",
              bgcolor: "#00A76F",
              boxShadow: "0 12px 24px -6px rgba(0, 167, 111, 0.32)",
              "&:hover": { bgcolor: "#007B55", boxShadow: "none" }
            }}
          >
            {paymentActionLoading ? "Đang xử lý..." : "Xác nhận và Hoàn tất"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={refundDialogOpen}
        onClose={() => {
          setRefundDialogOpen(false);
          setSelectedRefundBooking(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: "1.6rem", fontWeight: 800 }}>
          Yêu cầu hoàn tiền
        </DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ fontSize: "1.35rem", color: "text.secondary", mb: 1 }}>
            Booking: <b>{selectedRefundBooking?.bookingCode ?? "—"}</b>
          </Typography>
          <Typography sx={{ fontSize: "1.35rem", color: "text.secondary", mb: 2 }}>
            Khách hàng: <b>{selectedRefundBooking?.customerName ?? "—"}</b>
          </Typography>

          <Alert severity="info" sx={{ fontSize: "1.3rem" }}>
            Hiện tại thao tác <b>yêu cầu hoàn tiền</b> chỉ mang tính chất hiển thị thông tin.
            Nếu booking không ở trạng thái phù hợp, hệ thống sẽ không cho xác nhận tại đây.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setRefundDialogOpen(false);
              setSelectedRefundBooking(null);
            }}
            sx={{ textTransform: "none", fontSize: "1.35rem", fontWeight: 800 }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={cancelDialogOpen}
        onClose={() => {
          if (cancelActionLoading) return;
          setCancelDialogOpen(false);
          setSelectedCancelBooking(null);
          setCancelActionError(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: "1.6rem", fontWeight: 800 }}>
          Duyệt yêu cầu hủy đơn
        </DialogTitle>
        <DialogContent dividers>
          {cancelActionError && (
            <Alert severity="error" sx={{ mb: 2, fontSize: "1.35rem" }}>
              {cancelActionError}
            </Alert>
          )}
          <Typography sx={{ fontSize: "1.35rem", color: "text.secondary", mb: 1 }}>
            Booking: <b>{selectedCancelBooking?.bookingCode ?? "—"}</b>
          </Typography>
          <Typography sx={{ fontSize: "1.35rem", color: "text.secondary", mb: 2 }}>
            Khách hàng: <b>{selectedCancelBooking?.customerName ?? "—"}</b>
          </Typography>

          <Typography sx={{ fontSize: "1.35rem", fontWeight: 700, mb: 1 }}>
            Lý do hủy
          </Typography>
          <Box
            sx={{
              p: 1.5,
              bgcolor: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: "12px",
              mb: 1,
            }}
          >
            <Typography sx={{ fontSize: "1.35rem", color: "#9a3412", whiteSpace: "pre-wrap" }}>
              {selectedCancelBooking?.cancelledReason ?? "—"}
            </Typography>
          </Box>

          <Typography sx={{ fontSize: "1.25rem", color: "text.secondary", mb: 2 }}>
            Trạng thái hiện tại:{" "}
            <b>{getDepositStatusLabel(depositStatus || undefined)}</b>
          </Typography>

          <Box sx={{ mt: 1 }}>
            <Typography sx={{ fontSize: "1.35rem", fontWeight: 700, mb: 1 }}>
              Thông tin ngân hàng khách cung cấp
            </Typography>
            {cancelBankInfo ? (
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "12px",
                  mb: 2,
                }}
              >
                <Typography sx={{ fontSize: "1.3rem", mb: 0.5 }}>
                  Ngân hàng: <b>{cancelBankInfo.bankName}</b> ({cancelBankInfo.bankCode})
                </Typography>
                <Typography sx={{ fontSize: "1.3rem", mb: 0.5 }}>
                  Số tài khoản: <b>{cancelBankInfo.accountNumber}</b>
                </Typography>
                <Typography sx={{ fontSize: "1.3rem" }}>
                  Chủ TK: <b>{cancelBankInfo.accountHolderName}</b>
                </Typography>
              </Box>
            ) : (
              <Typography sx={{ fontSize: "1.25rem", color: "text.secondary", mb: 2 }}>
                Không tìm thấy thông tin ngân hàng cho booking này.
              </Typography>
            )}
          </Box>

          <Box sx={{ mt: 1 }}>
            <Typography sx={{ fontSize: "1.35rem", fontWeight: 700, mb: 1 }}>
              Ghi chú nội bộ
            </Typography>
            <TextField
              multiline
              minRows={3}
              fullWidth
              value={staffNotes}
              onChange={(e) => setStaffNotes(e.target.value)}
              placeholder="Ghi chú cho việc hoàn tiền / hủy đơn (chỉ nội bộ nhìn thấy)..."
              sx={{ "& .MuiInputBase-root": { fontSize: "1.35rem" } }}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontSize: "1.35rem", fontWeight: 700, mb: 1 }}>
              Bằng chứng hoàn tiền (ảnh chuyển khoản)
            </Typography>
            <Button
              variant="outlined"
              component="label"
              sx={{ textTransform: "none", fontSize: "1.3rem" }}
            >
              Chọn ảnh
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => handleRefundProofFileChange(e.target.files?.[0] ?? null)}
              />
            </Button>
            {refundProofFileName && (
              <Typography sx={{ mt: 0.5, fontSize: "1.25rem", color: "text.secondary" }}>
                Đã chọn: {refundProofFileName}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              if (cancelActionLoading) return;
              setCancelDialogOpen(false);
              setSelectedCancelBooking(null);
              setCancelActionError(null);
            }}
            sx={{ textTransform: "none", fontSize: "1.35rem", fontWeight: 700 }}
          >
            Đóng
          </Button>
          <Button
            color="error"
            variant="outlined"
            disabled={
              cancelActionLoading ||
              !isCancelRequested(selectedCancelBooking)
            }
            onClick={async () => {
              if (!selectedCancelBooking) return;
              setCancelActionLoading(true);
              setCancelActionError(null);
              try {
                await approveOrRejectAdminCancelRequest(selectedCancelBooking.id, { approved: false });
                await queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
                setCancelDialogOpen(false);
                setSelectedCancelBooking(null);
              } catch (e) {
                console.error(e);
                setCancelActionError("Không thể từ chối yêu cầu hủy đơn.");
              } finally {
                setCancelActionLoading(false);
              }
            }}
            sx={{ textTransform: "none", fontSize: "1.35rem", fontWeight: 800, borderRadius: "10px" }}
          >
            Từ chối
          </Button>
          <Button
            color="success"
            variant="contained"
            disabled={
              cancelActionLoading ||
              !isCancelRequested(selectedCancelBooking)
            }
            onClick={async () => {
              if (!selectedCancelBooking) return;
              if (selectedCancelBooking.status !== "PENDING") {
                setCancelActionError("Chỉ có thể hủy đơn khi trạng thái là PENDING.");
                return;
              }
              setCancelActionLoading(true);
              setCancelActionError(null);
              try {
                await approveOrRejectAdminCancelRequest(selectedCancelBooking.id, {
                  approved: true,
                  staffNotes: staffNotes.trim() || undefined,
                  refundProof: refundProof || undefined,
                });
                await queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
                setCancelDialogOpen(false);
                setSelectedCancelBooking(null);
              } catch (e) {
                console.error(e);
                setCancelActionError("Không thể duyệt yêu cầu hủy đơn.");
              } finally {
                setCancelActionLoading(false);
              }
            }}
            sx={{ textTransform: "none", fontSize: "1.35rem", fontWeight: 800, borderRadius: "10px" }}
          >
            Duyệt
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
