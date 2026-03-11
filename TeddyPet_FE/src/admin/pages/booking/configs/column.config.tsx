import type { GridColDef } from "@mui/x-data-grid";
import { Typography, Chip, Box } from "@mui/material";
import {
  getBookingStatusLabel,
  getBookingStatusColor,
  getPaymentStatusLabel,
  getPaymentStatusColor,
  getPaymentMethodLabel,
  getPaymentMethodColor,
} from "../constants";
import type { BookingResponse } from "../../../../types/booking.type";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
/** Định dạng ngắn cho cột thời gian: dd/MM HH:mm */
const formatDateTimeShort = (value?: string) =>
  value ? new Date(value).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

export const getBookingColumns = (onViewDetail: (row: BookingResponse) => void): GridColDef[] => [
  {
    field: "bookingCode",
    headerName: "Mã đặt lịch",
    minWidth: 88,
    flex: 0.55,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => (
      <Typography
        component="span"
        sx={{
          fontWeight: 700,
          fontSize: "1.45rem",
          color: "#1C252E",
          cursor: "pointer",
          width: "100%",
          textAlign: "center",
          display: "block",
          "&:hover": { color: "#00A76F" },
        }}
        onClick={(e) => {
          e.stopPropagation();
          onViewDetail(params.row as BookingResponse);
        }}
      >
        {params.value}
      </Typography>
    ),
  },
  {
    field: "customerName",
    headerName: "Khách hàng",
    minWidth: 92,
    flex: 0.55,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => (
      <Typography sx={{ fontWeight: 600, fontSize: "1.45rem", color: "#1C252E", width: "100%", textAlign: "center" }}>{params.value}</Typography>
    ),
  },

  {
    field: "bookingStartDate",
    headerName: "Thời gian",
    minWidth: 128,
    flex: 0.7,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => {
      const start = params.value as string;
      const end = (params.row as BookingResponse).bookingEndDate;
      return (
        <Typography sx={{ fontSize: "1.45rem", color: "#1C252E", width: "100%", textAlign: "center", whiteSpace: "nowrap" }}>
          {formatDateTimeShort(start)} → {formatDateTimeShort(end)}
        </Typography>
      );
    },
  },
  {
    field: "totalAmount",
    headerName: "Tổng",
    minWidth: 80,
    flex: 0.45,
    type: "number",
    align: "center",
    headerAlign: "center",
    renderCell: (params) => (
      <Typography sx={{ fontSize: "1.45rem", fontWeight: 600, color: "#1C252E", width: "100%", textAlign: "center" }}>
        {formatCurrency(Number(params.value ?? 0))}
      </Typography>
    ),
  },
  {
    field: "deposit",
    headerName: "Đã cọc",
    minWidth: 80,
    flex: 0.45,
    type: "number",
    align: "center",
    headerAlign: "center",
    renderCell: (params) => (
      <Typography sx={{ fontSize: "1.45rem", fontWeight: 500, color: "#1C252E", width: "100%", textAlign: "center" }}>
        {formatCurrency(Number(params.value ?? 0))}
      </Typography>
    ),
  },
  {
    field: "depositPaid",
    headerName: "TT Cọc",
    minWidth: 100,
    flex: 0.5,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => {
      const isPaid = params.row.depositPaid === true;
      return (
        <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <Chip
            label={isPaid ? "Đã TT cọc" : "Chưa TT cọc"}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: "1.2rem",
              bgcolor: isPaid ? "#dcfce7" : "#ffe4e6",
              color: isPaid ? "#166534" : "#9f1239",
              border: `1px solid ${isPaid ? "#bbf7d0" : "#fecdd3"}`,
            }}
          />
        </Box>
      );
    },
  },
  {
    field: "remainingAmount",
    headerName: "Còn",
    minWidth: 70,
    flex: 0.4,
    type: "number",
    align: "center",
    headerAlign: "center",
    renderCell: (params) => (
      <Typography sx={{ fontSize: "1.45rem", fontWeight: 500, color: "#1C252E", width: "100%", textAlign: "center" }}>
        {formatCurrency(Number(params.value ?? 0))}
      </Typography>
    ),
  },
  {
    field: "paymentStatus",
    headerName: "TT thanh toán",
    minWidth: 92,
    flex: 0.5,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => {
      const status = params.value as string;
      const row = params.row as BookingResponse;
      const isPartial = status === "PENDING" && (row.deposit ?? 0) > 0;

      const label = isPartial ? "Thanh toán một phần" : getPaymentStatusLabel(status as any);
      const color = isPartial ? "#006C9C" : getPaymentStatusColor(status as any); // #006C9C is defined in constants for PARTIAL
      return (
        <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <Chip
            label={label}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: "1.2rem",
              bgcolor: color ? `${color}18` : "#f0f0f0",
              color: color || "#637381",
              border: `1px solid ${color || "#e0e0e0"}`,
            }}
          />
        </Box>
      );
    },
  },
  {
    field: "paymentMethod",
    headerName: "Hình thức",
    minWidth: 82,
    flex: 0.42,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => {
      const method = (params.row as BookingResponse).paymentMethod;
      const label = getPaymentMethodLabel(method);
      const color = getPaymentMethodColor(method);
      if (!label || label === "—") return <Box sx={{ width: "100%", textAlign: "center" }}>—</Box>;
      return (
        <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <Chip
            label={label}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: "1.2rem",
              bgcolor: color ? `${color}18` : "#f0f0f0",
              color: color || "#637381",
              border: `1px solid ${color || "#e0e0e0"}`,
            }}
          />
        </Box>
      );
    },
  },
  {
    field: "status",
    headerName: "Trạng thái",
    minWidth: 88,
    flex: 0.45,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => {
      const status = params.value as string;
      const color = getBookingStatusColor(status as any);
      return (
        <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <Chip
            label={getBookingStatusLabel(status as any)}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: "1.2rem",
              bgcolor: color ? `${color}18` : "#f0f0f0",
              color: color || "#637381",
              border: `1px solid ${color || "#e0e0e0"}`,
            }}
          />
        </Box>
      );
    },
  },
];
