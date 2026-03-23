import React from "react";
import type { GridColDef } from "@mui/x-data-grid";
import {
  Typography,
  Chip,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
} from "@mui/material";
import {
  VisibilityTwoTone,
  EditTwoTone,
  CancelTwoTone,
  PaidTwoTone,
  HistoryTwoTone,
  DeleteTwoTone,
  ReceiptLongTwoTone,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
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
/** Định dạng cho cột Thời gian đặt lịch: dd/mm - hh/mm (PM/AM) */
const formatBookingDateTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const period = date.getHours() >= 12 ? "PM" : "AM";
  return `${day}/${month} - ${hours}:${minutes} (${period})`;
};

/** Định dạng cho cột Ngày gửi: dd/mm (FE có thể nhận ISO date yyyy-MM-dd) */
const formatBookingDateOnly = (value?: string) => {
  if (!value) return "—";
  const s = value.trim();
  const datePart = s.length >= 10 ? s.slice(0, 10) : s;
  const [yyyy, mm, dd] = datePart.split("-");
  if (!yyyy || !mm || !dd) {
    // Fallback: cố parse bằng Date
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "—";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}`;
  }
  return `${dd.padStart(2, "0")}/${mm.padStart(2, "0")}`;
};

export const getBookingColumns = (
  onViewDetail: (row: BookingResponse) => void,
  onEdit?: (row: BookingResponse) => void,
  onRequestCancel?: (row: BookingResponse) => void,
  onRequestRefund?: (row: BookingResponse) => void,
  onPayment?: (row: BookingResponse) => void,
  onViewTransactionHistory?: (row: BookingResponse) => void,
  onDelete?: (row: BookingResponse) => void,
  onExportBill?: (row: BookingResponse) => void
): GridColDef[] => [
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
          fontSize: "0.9062rem",
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
    field: "bookingType",
    headerName: "Loại đặt lịch",
    minWidth: 110,
    flex: 0.55,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => {
      const type = params.value as string;
      const isWalkIn = type === "WALK_IN";
      return (
        <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <Chip
            label={isWalkIn ? "Tại quầy" : "Online"}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: "0.75rem",
              bgcolor: isWalkIn ? "#e0f2fe" : "#f0fdf4",
              color: isWalkIn ? "#0369a1" : "#15803d",
              border: `1px solid ${isWalkIn ? "#bae6fd" : "#bbf7d0"}`,
            }}
          />
        </Box>
      );
    },
  },
  {
    field: "customerName",
    headerName: "Khách hàng",
    minWidth: 92,
    flex: 0.55,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => (
      <Typography sx={{ fontWeight: 600, fontSize: "0.9062rem", color: "#1C252E", width: "100%", textAlign: "center", whiteSpace: "nowrap" }}>{params.value}</Typography>
    ),
  },
  {
    field: "createdAt",
    headerName: "Ngày đặt lịch",
    minWidth: 148,
    flex: 0.7,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => {
      const val = params.value as string | undefined;
      return (
        <Typography sx={{ fontSize: "0.9062rem", color: "#1C252E", width: "100%", textAlign: "center", whiteSpace: "nowrap" }}>
          {val ? formatBookingDateTime(val) : "—"}
        </Typography>
      );
    },
  },
  {
    field: "bookingDateFrom",
    headerName: "Ngày gửi",
    minWidth: 148,
    flex: 0.7,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => {
      const val = params.value as string | undefined;
      return (
        <Typography sx={{ fontSize: "0.9062rem", color: "#1C252E", width: "100%", textAlign: "center", whiteSpace: "nowrap" }}>
          {val ? formatBookingDateOnly(val) : "—"}
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
      <Typography sx={{ fontSize: "0.9062rem", fontWeight: 600, color: "#1C252E", width: "100%", textAlign: "center" }}>
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
      <Typography sx={{ fontSize: "0.9062rem", fontWeight: 500, color: "#1C252E", width: "100%", textAlign: "center" }}>
        {formatCurrency(Number(params.value ?? 0))}
      </Typography>
    ),
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
      <Typography sx={{ fontSize: "0.9062rem", fontWeight: 500, color: "#1C252E", width: "100%", textAlign: "center" }}>
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
              fontSize: "0.75rem",
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
              fontSize: "0.75rem",
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
              fontSize: "0.75rem",
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
    field: "actions",
    headerName: "Thao tác",
    minWidth: 80,
    flex: 0.3,
    align: "center",
    headerAlign: "center",
    sortable: false,
    filterable: false,
    renderCell: (params) => {
      const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
      const open = Boolean(anchorEl);
      
      const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
      };
      
      const handleClose = () => {
        setAnchorEl(null);
      };

      const handleViewDetail = () => {
        handleClose();
        onViewDetail(params.row as BookingResponse);
      };

      const handleEdit = () => {
        handleClose();
        onEdit?.(params.row as BookingResponse);
      };

      const handleRequestCancel = () => {
        handleClose();
        onRequestCancel?.(params.row as BookingResponse);
      };

      const handlePayment = () => {
        handleClose();
        onPayment?.(params.row as BookingResponse);
      };

      const handleRequestRefund = () => {
        handleClose();
        onRequestRefund?.(params.row as BookingResponse);
      };

      const handleTransactionHistory = () => {
        handleClose();
        onViewTransactionHistory?.(params.row as BookingResponse);
      };

      const handleDelete = () => {
        handleClose();
        onDelete?.(params.row as BookingResponse);
      };

      const handleExportBill = () => {
        handleClose();
        onExportBill?.(params.row as BookingResponse);
      };

      return (
        <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <Badge
            badgeContent={
              (params.row as BookingResponse).cancelRequested === true ? (
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#ef4444" }} />
              ) : (
                0
              )
            }
            overlap="circular"
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            <IconButton
              size="small"
              onClick={handleClick}
              sx={{
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              <MoreVertIcon sx={{ fontSize: "1.125rem", color: "#637381" }} />
            </IconButton>
          </Badge>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            PaperProps={{
              sx: {
                boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
                borderRadius: "8px",
                mt: 1,
              },
            }}
          >
            <MenuItem onClick={handleViewDetail}>
              <ListItemIcon>
                <VisibilityTwoTone sx={{ fontSize: "1.1rem", color: "#00B8D9" }} />
              </ListItemIcon>
              <ListItemText 
                primary="Xem chi tiết" 
                primaryTypographyProps={{ fontSize: "0.8125rem", color: "#1C252E", fontWeight: 500 }}
              />
            </MenuItem>
            <MenuItem onClick={handleEdit}>
              <ListItemIcon>
                <EditTwoTone sx={{ fontSize: "1.1rem", color: "#FFAB00" }} />
              </ListItemIcon>
              <ListItemText 
                primary="Chỉnh sửa" 
                primaryTypographyProps={{ fontSize: "0.8125rem", color: "#1C252E", fontWeight: 500 }}
              />
            </MenuItem>
            <MenuItem onClick={handleRequestCancel}>
              <ListItemIcon>
                <CancelTwoTone sx={{ fontSize: "1.1rem", color: "#FF5630" }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box component="span">Yêu cầu hủy đơn</Box>
                    {(params.row as BookingResponse).cancelRequested === true && (
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#ef4444" }} />
                    )}
                  </Box>
                }
                primaryTypographyProps={{ fontSize: "0.8125rem", color: "#1C252E", fontWeight: 500 }}
              />
            </MenuItem>
            
            {["PENDING", "CONFIRMED", "READY", "COMPLETED"].includes((params.row as BookingResponse).status?.toUpperCase()) && 
             (params.row as BookingResponse).paymentStatus !== "PAID" && (
              <MenuItem onClick={handlePayment}>
                <ListItemIcon>
                  <PaidTwoTone sx={{ fontSize: "1.1rem", color: "#22C55E" }} />
                </ListItemIcon>
                <ListItemText
                  primary="Thanh toán"
                  primaryTypographyProps={{ fontSize: "0.8125rem", color: "#1C252E", fontWeight: 500 }}
                />
              </MenuItem>
            )}

            {(params.row as BookingResponse).paymentStatus === "PAID" &&
              String((params.row as BookingResponse).bookingType ?? "").toUpperCase() !== "WALK_IN" && (
              <MenuItem onClick={handleRequestRefund}>
                <ListItemIcon>
                  <CancelTwoTone sx={{ fontSize: "1.1rem", color: "#FF5630" }} />
                </ListItemIcon>
                <ListItemText
                  primary="Yêu cầu hoàn tiền"
                  primaryTypographyProps={{ fontSize: "0.8125rem", color: "#1C252E", fontWeight: 500 }}
                />
              </MenuItem>
            )}

            <MenuItem onClick={handleTransactionHistory}>
              <ListItemIcon>
                <HistoryTwoTone sx={{ fontSize: "1.1rem", color: "#6366F1" }} />
              </ListItemIcon>
              <ListItemText 
                primary="Lịch sử giao dịch" 
                primaryTypographyProps={{ fontSize: "0.8125rem", color: "#1C252E", fontWeight: 500 }}
              />
            </MenuItem>

            {String((params.row as BookingResponse).status ?? "").toUpperCase() === "COMPLETED" && (
              <MenuItem onClick={handleExportBill}>
                <ListItemIcon>
                  <ReceiptLongTwoTone sx={{ fontSize: "1.1rem", color: "#006C9C" }} />
                </ListItemIcon>
                <ListItemText
                  primary="In hóa đơn"
                  primaryTypographyProps={{ fontSize: "0.8125rem", color: "#1C252E", fontWeight: 500 }}
                />
              </MenuItem>
            )}

            <MenuItem onClick={handleDelete}>
              <ListItemIcon>
                <DeleteTwoTone sx={{ fontSize: "1.1rem", color: "#B71D18" }} />
              </ListItemIcon>
              <ListItemText 
                primary="Xóa" 
                primaryTypographyProps={{ fontSize: "0.8125rem", color: "#1C252E", fontWeight: 500 }}
              />
            </MenuItem>
          </Menu>
        </Box>
      );
    },
  },
];
