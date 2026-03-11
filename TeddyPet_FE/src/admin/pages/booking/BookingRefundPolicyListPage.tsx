import { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import type { BookingDepositRefundPolicy } from "../../../types/bookingRefundPolicy.type";
import { getAdminBookingDepositRefundPolicies } from "../../api/bookingRefundPolicy.api";

export const BookingRefundPolicyListPage = () => {
  const [rows, setRows] = useState<BookingDepositRefundPolicy[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPolicies = async () => {
      setLoading(true);
      try {
        const res = await getAdminBookingDepositRefundPolicies();
        const list = Array.isArray(res.data) ? (res.data as any[]) : [];
        const normalized: BookingDepositRefundPolicy[] = list.map((p) => ({
          ...p,
          id: Number(p.id),
          depositPercentage: Number(p.depositPercentage ?? 0),
          fullRefundHours: Number(p.fullRefundHours ?? 0),
          fullRefundPercentage: Number(p.fullRefundPercentage ?? 0),
          partialRefundHours: Number(p.partialRefundHours ?? 0),
          partialRefundPercentage: Number(p.partialRefundPercentage ?? 0),
          noRefundHours: Number(p.noRefundHours ?? 0),
          noRefundPercentage: Number(p.noRefundPercentage ?? 0),
          noShowRefundPercentage: Number(p.noShowRefundPercentage ?? 0),
          noShowPenalty: Number(p.noShowPenalty ?? 0),
          allowForceMajeure: Boolean(p.allowForceMajeure),
          forceMajeureRefundPercentage: Number(p.forceMajeureRefundPercentage ?? 0),
          forceMajeureRequiresEvidence: Boolean(p.forceMajeureRequiresEvidence),
          isDefault: Boolean(p.isDefault),
          displayOrder: Number(p.displayOrder ?? 0),
          isActive: Boolean(p.isActive),
        }));
        setRows(normalized);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPolicies();
  }, []);

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", minWidth: 70, flex: 0.4 },
    {
      field: "policyName",
      headerName: "Tên chính sách",
      minWidth: 200,
      flex: 1.4,
      renderCell: (p) => (
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography sx={{ fontWeight: 700, fontSize: "1.4rem" }}>{p.value}</Typography>
          {p.row.highlightText && (
            <Typography sx={{ fontSize: "1.25rem", color: "#9f1239", mt: 0.3 }}>
              {p.row.highlightText}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: "depositPercentage",
      headerName: "Tỷ lệ cọc",
      minWidth: 120,
      flex: 0.6,
      valueFormatter: (p) => `${p.value ?? 0}%`,
    },
    {
      field: "refundTiers",
      headerName: "Mốc hoàn cọc",
      minWidth: 260,
      flex: 1.2,
      sortable: false,
      filterable: false,
      renderCell: (p) => (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3, fontSize: "1.25rem" }}>
          <span>
            <b>&lt;= {p.row.fullRefundHours}h:</b> {p.row.fullRefundPercentage}%
          </span>
          <span>
            <b>&lt;= {p.row.partialRefundHours}h:</b> {p.row.partialRefundPercentage}%
          </span>
          <span>
            <b>&lt;= {p.row.noRefundHours}h:</b> {p.row.noRefundPercentage}% (không hoàn)
          </span>
        </Box>
      ),
    },
    {
      field: "noShow",
      headerName: "Không đến",
      minWidth: 150,
      flex: 0.7,
      sortable: false,
      filterable: false,
      renderCell: (p) => (
        <Typography sx={{ fontSize: "1.25rem" }}>
          Hoàn {p.row.noShowRefundPercentage}% / Phạt {p.row.noShowPenalty?.toLocaleString("vi-VN")}đ
        </Typography>
      ),
    },
    {
      field: "isDefault",
      headerName: "Mặc định",
      minWidth: 120,
      flex: 0.5,
      renderCell: (p) =>
        p.value ? (
          <Chip label="Mặc định" size="small" color="primary" sx={{ fontSize: "1.2rem", fontWeight: 700 }} />
        ) : null,
    },
    {
      field: "isActive",
      headerName: "Trạng thái",
      minWidth: 120,
      flex: 0.5,
      renderCell: (p) => (
        <Chip
          label={p.value ? "Đang dùng" : "Tạm tắt"}
          size="small"
          sx={{
            fontSize: "1.2rem",
            fontWeight: 700,
            bgcolor: p.value ? "#dcfce7" : "#fee2e2",
            color: p.value ? "#166534" : "#b91c1c",
          }}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <ListHeader
        title="Chính sách hoàn cọc"
        breadcrumbItems={[
          { label: "Dashboard", to: `/${prefixAdmin}` },
          { label: "Đặt lịch", to: `/${prefixAdmin}/booking/list` },
          { label: "Chính sách hoàn cọc" },
        ]}
      />

      <Card sx={{ p: 2.5, borderRadius: "18px" }}>
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 800, fontSize: "1.65rem", mb: 0.5 }}>
            Danh sách chính sách hoàn cọc
          </Typography>
          <Typography sx={{ fontSize: "1.3rem", color: "#6b7280" }}>
            Các chính sách này được dùng cho logic giữ chỗ và hoàn lại tiền cọc.
          </Typography>
        </Box>

        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(r) => r.id}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeader": { fontSize: "1.35rem", fontWeight: 800 },
            "& .MuiDataGrid-cell": { fontSize: "1.3rem" },
          }}
        />
      </Card>
    </div>
  );
};

