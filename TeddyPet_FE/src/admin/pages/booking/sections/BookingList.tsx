import { useState, useMemo, useEffect } from "react";
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
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
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
import { BOOKING_STATUS_OPTIONS, type BookingStatusFilter } from "../constants";
import { prefixAdmin } from "../../../constants/routes";
import { approveOrRejectAdminCancelRequest, getAdminBookings } from "../../../api/booking.api";
import { getBankInformationByBookingCode, type BookingBankInformationResponse } from "../../../../api/bank.api";
import type { BookingResponse } from "../../../../types/booking.type";

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
  deposit: Number(b.deposit ?? 0),
  depositPaid: b.depositPaid != null ? Boolean(b.depositPaid) : undefined,
  depositId: b.depositId != null ? Number(b.depositId) : undefined,
  depositExpiresAt: b.depositExpiresAt != null ? String(b.depositExpiresAt) : undefined,
  paymentStatus: String(b.paymentStatus ?? "PENDING"),
  paymentMethod: b.paymentMethod != null ? String(b.paymentMethod) : undefined,
  status: String(b.status ?? "PENDING"),
  cancelRequested: b.cancelRequested != null ? Boolean(b.cancelRequested) : undefined,
  cancelledReason: b.cancelledReason != null ? String(b.cancelledReason) : undefined,
  internalNotes: b.internalNotes != null ? String(b.internalNotes) : undefined,
  bookingStartDate: b.bookingStartDate != null ? String(b.bookingStartDate) : "",
  bookingEndDate: b.bookingEndDate != null ? String(b.bookingEndDate) : undefined,
  cancelledAt: b.cancelledAt != null ? String(b.cancelledAt) : undefined,
  cancelledBy: b.cancelledBy != null ? String(b.cancelledBy) : undefined,
  createdAt: b.createdAt != null ? String(b.createdAt) : "",
  createdBy: b.createdBy != null ? String(b.createdBy) : undefined,
  updatedAt: b.updatedAt != null ? String(b.updatedAt) : "",
  updatedBy: b.updatedBy != null ? String(b.updatedBy) : undefined,
  petName: b.petName != null ? String(b.petName) : undefined,
} as BookingResponse);

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

  const isCancelRequested = (row?: BookingResponse | null) => {
    if (!row) return false;
    return row.cancelRequested === true;
  };

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
    select: (res) => {
      const list = res?.data;
      if (!Array.isArray(list)) return [];
      return list.map((b) => normalizeBooking(b as unknown as Record<string, unknown>));
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
            <b>{getDepositStatusLabel(depositStatus)}</b>
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
