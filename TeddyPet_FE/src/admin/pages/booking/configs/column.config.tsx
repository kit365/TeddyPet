import React from "react";
import type { GridColDef } from "@mui/x-data-grid";
import { Typography, Chip, Box, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
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

export const getBookingColumns = (
  onViewDetail: (row: BookingResponse) => void,
  onEdit?: (row: BookingResponse) => void,
  onRequestRefund?: (row: BookingResponse) => void,
  onRequestCancel?: (row: BookingResponse) => void,
  onDelete?: (row: BookingResponse) => void
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
    field: "customerName",
    headerName: "Khách hàng",
    minWidth: 92,
    flex: 0.55,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => (
      <Typography sx={{ fontWeight: 600, fontSize: "0.9062rem", color: "#1C252E", width: "100%", textAlign: "center" }}>{params.value}</Typography>
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
        <Typography sx={{ fontSize: "0.9062rem", color: "#1C252E", width: "100%", textAlign: "center", whiteSpace: "nowrap" }}>
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
              fontSize: "0.75rem",
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
    headerName: "Thao tác nhé",
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

      const handleRequestRefund = () => {
        handleClose();
        onRequestRefund?.(params.row as BookingResponse);
      };

      const handleRequestCancel = () => {
        handleClose();
        onRequestCancel?.(params.row as BookingResponse);
      };

      const handleDelete = () => {
        handleClose();
        onDelete?.(params.row as BookingResponse);
      };

      return (
        <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
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
                <VisibilityIcon sx={{ fontSize: "1rem", color: "#1C252E" }} />
              </ListItemIcon>
              <ListItemText 
                primary="Xem chi tiết" 
                primaryTypographyProps={{ fontSize: "0.875rem", color: "#1C252E" }}
              />
            </MenuItem>
            <MenuItem onClick={handleEdit}>
              <ListItemIcon>
                <EditIcon sx={{ fontSize: "1rem", color: "#1C252E" }} />
              </ListItemIcon>
              <ListItemText 
                primary="Chỉnh sửa" 
                primaryTypographyProps={{ fontSize: "0.875rem", color: "#1C252E" }}
              />
            </MenuItem>
            <MenuItem onClick={handleRequestRefund}>
              <ListItemIcon>
                <RefreshIcon sx={{ fontSize: "1rem", color: "#1C252E" }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box component="span">Yêu cầu hoàn tiền</Box>
                    {(params.row as BookingResponse).cancelRequested === true && (
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#ef4444" }} />
                    )}
                  </Box>
                }
                primaryTypographyProps={{ fontSize: "0.875rem", color: "#1C252E" }}
              />
            </MenuItem>
            <MenuItem onClick={handleRequestCancel}>
              <ListItemIcon>
                <CancelOutlinedIcon sx={{ fontSize: "1rem", color: "#ef4444" }} />
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
                primaryTypographyProps={{ fontSize: "0.875rem", color: "#1C252E" }}
              />
            </MenuItem>
            <MenuItem onClick={handleDelete}>
              <ListItemIcon>
                <DeleteIcon sx={{ fontSize: "1rem", color: "#dc2626" }} />
              </ListItemIcon>
              <ListItemText 
                primary="Xóa" 
                primaryTypographyProps={{ fontSize: "0.875rem", color: "#dc2626" }}
              />
            </MenuItem>
          </Menu>
        </Box>
      );
    },
  },
];
