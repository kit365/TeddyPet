import { useState, useMemo } from "react";
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
import type { BookingResponse } from "../../../../types/booking.type";

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

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedCancelBooking, setSelectedCancelBooking] = useState<BookingResponse | null>(null);
  const [cancelActionLoading, setCancelActionLoading] = useState(false);
  const [cancelActionError, setCancelActionError] = useState<string | null>(null);

  const isCancelRequested = (row?: BookingResponse | null) => {
    if (!row) return false;
    return row.cancelRequested === true;
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
          // TODO: Implement refund request functionality
          console.log("Request refund for booking:", row.id);
        },
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

          <Typography sx={{ fontSize: "1.25rem", color: "text.secondary" }}>
            Trạng thái hiện tại:{" "}
            <b>{String(selectedCancelBooking?.status ?? "").toUpperCase() || "—"}</b>
          </Typography>
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
              setCancelActionLoading(true);
              setCancelActionError(null);
              try {
                await approveOrRejectAdminCancelRequest(selectedCancelBooking.id, { approved: true });
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
