import type { GridColDef } from "@mui/x-data-grid";
import { Typography, Chip, Box } from "@mui/material";
import {
  getBookingStatusLabel,
  getBookingStatusColor,
  getPaymentStatusLabel,
  getPaymentStatusColor,
  getBookingTypeLabel,
  getPaymentMethodLabel,
  getPaymentMethodColor,
} from "../constants";
import type { BookingResponse } from "../../../../types/booking.type";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
const formatDate = (value: string) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "—";
const formatDateTime = (value: string) =>
  value ? new Date(value).toLocaleString("vi-VN") : "—";

export const getBookingColumns = (onViewDetail: (row: BookingResponse) => void): GridColDef[] => [
  {
    field: "bookingCode",
    headerName: "Mã đặt lịch",
    minWidth: 128,
    flex: 0.7,
    align: "left",
    headerAlign: "left",
    renderCell: (params) => (
      <Typography
        component="span"
        sx={{
          fontWeight: 700,
          fontSize: "1.5rem",
          color: "#1C252E",
          cursor: "pointer",
          width: "100%",
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
    minWidth: 140,
    flex: 0.9,
    align: "left",
    headerAlign: "left",
    renderCell: (params) => (
      <Typography sx={{ fontWeight: 600, fontSize: "1.5rem", color: "#1C252E", width: "100%" }}>{params.value}</Typography>
    ),
  },
  {
    field: "customerPhone",
    headerName: "SĐT",
    minWidth: 120,
    flex: 0.65,
    align: "left",
    headerAlign: "left",
    renderCell: (params) => (
      <Typography sx={{ fontSize: "1.5rem", fontWeight: 500, color: "#1C252E", width: "100%" }}>
        {params.value ?? "—"}
      </Typography>
    ),
  },
  {
    field: "bookingType",
    headerName: "Loại dịch vụ",
    minWidth: 140,
    flex: 0.75,
    align: "left",
    headerAlign: "left",
    renderCell: (params) => (
      <Typography sx={{ fontSize: "1.5rem", color: "#1C252E", width: "100%" }}>{getBookingTypeLabel(String(params.value ?? ""))}</Typography>
    ),
  },
  {
    field: "bookingStartDate",
    headerName: "Bắt đầu",
    minWidth: 130,
    flex: 0.7,
    align: "left",
    headerAlign: "left",
    renderCell: (params) => (
      <Typography sx={{ fontSize: "1.5rem", color: "#1C252E", width: "100%" }}>
        {formatDateTime(params.value as string)}
      </Typography>
    ),
  },
  {
    field: "bookingEndDate",
    headerName: "Kết thúc",
    minWidth: 130,
    flex: 0.7,
    align: "left",
    headerAlign: "left",
    renderCell: (params) => (
      <Typography sx={{ fontSize: "1.5rem", color: "#1C252E", width: "100%" }}>
        {params.value ? formatDateTime(params.value as string) : "—"}
      </Typography>
    ),
  },
  {
    field: "totalAmount",
    headerName: "Tổng tiền",
    minWidth: 120,
    flex: 0.7,
    type: "number",
    align: "right",
    headerAlign: "right",
    renderCell: (params) => (
      <Typography sx={{ fontSize: "1.5rem", fontWeight: 600, color: "#1C252E", width: "100%", textAlign: "right" }}>
        {formatCurrency(Number(params.value ?? 0))}
      </Typography>
    ),
  },
  {
    field: "paidAmount",
    headerName: "Đã thanh toán",
    minWidth: 130,
    flex: 0.7,
    type: "number",
    align: "right",
    headerAlign: "right",
    renderCell: (params) => (
      <Typography sx={{ fontSize: "1.5rem", fontWeight: 500, color: "#1C252E", width: "100%", textAlign: "right" }}>
        {formatCurrency(Number(params.value ?? 0))}
      </Typography>
    ),
  },
  {
    field: "remainingAmount",
    headerName: "Còn lại",
    minWidth: 115,
    flex: 0.65,
    type: "number",
    align: "right",
    headerAlign: "right",
    renderCell: (params) => (
      <Typography sx={{ fontSize: "1.5rem", fontWeight: 500, color: "#1C252E", width: "100%", textAlign: "right" }}>
        {formatCurrency(Number(params.value ?? 0))}
      </Typography>
    ),
  },
  {
    field: "paymentStatus",
    headerName: "TT thanh toán",
    minWidth: 120,
    flex: 0.7,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => {
      const status = params.value as string;
      const color = getPaymentStatusColor(status as any);
      return (
        <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <Chip
            label={getPaymentStatusLabel(status as any)}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: "1.25rem",
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
    minWidth: 110,
    flex: 0.6,
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
              fontSize: "1.25rem",
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
    minWidth: 118,
    flex: 0.7,
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
              fontSize: "1.25rem",
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
