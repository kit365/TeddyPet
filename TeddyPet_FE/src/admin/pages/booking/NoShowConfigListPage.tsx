import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LayersIcon from "@mui/icons-material/Layers";
import UpdateIcon from "@mui/icons-material/Update";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import type { NoShowConfig } from "../../../types/noShowConfig.type";
import { deleteAdminNoShowConfig, listAdminNoShowConfigs } from "../../api/noShowConfig.api";

export const NoShowConfigListPage = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<NoShowConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<NoShowConfig | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await listAdminNoShowConfigs();
      const list = Array.isArray(res.data) ? (res.data as NoShowConfig[]) : [];
      setRows(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await deleteAdminNoShowConfig(deleteTarget.id);
      setDeleteTarget(null);
      await fetchList();
    } catch (e) {
      console.error(e);
      alert("Xóa thất bại.");
    } finally {
      setDeleting(false);
    }
  };

  const columns: GridColDef<NoShowConfig>[] = [
    {
      field: "name",
      headerName: "Tên cấu hình",
      flex: 1,
      minWidth: 220,
      renderCell: (p) => (
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ height: "100%" }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "primary.lighter",
              color: "primary.main",
              flexShrink: 0,
            }}
          >
            <SettingsSuggestIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary", lineHeight: 1.2 }}>
              {p.row.name}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.75rem", mt: 0.2 }}>
              ID: #{p.row.id}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      field: "gracePeriodMinutes",
      headerName: "Thời gian chờ",
      width: 150,
      renderCell: (p) => (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ height: "100%", color: "text.secondary" }}>
          <AccessTimeIcon sx={{ fontSize: 16, color: "text.disabled" }} />
          <Typography variant="body2">{p.row.gracePeriodMinutes} phút</Typography>
        </Stack>
      ),
    },
    {
      field: "services",
      headerName: "Dịch vụ áp dụng",
      width: 160,
      renderCell: (p) => {
        const count = p.row.linkedServiceCount ?? p.row.services?.length ?? 0;
        return (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ height: "100%" }}>
            <LayersIcon sx={{ fontSize: 16, color: "text.disabled" }} />
            <Typography variant="body2" sx={{ fontWeight: 500, color: count > 0 ? "text.primary" : "text.disabled" }}>
              {count > 0 ? `${count} dịch vụ` : "Chưa chọn"}
            </Typography>
          </Stack>
        );
      },
    },
    {
      field: "isActive",
      headerName: "Trạng thái",
      width: 130,
      renderCell: (p) => (
        <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}>
          <Chip
            size="small"
            label={p.row.isActive ? "Kích hoạt" : "Tắt"}
            variant="filled"
            sx={{
              fontWeight: 700,
              height: 24,
              borderRadius: "6px",
              ...(p.row.isActive
                ? {
                    bgcolor: "rgba(34, 197, 94, 0.16)",
                    color: "rgb(17, 141, 87)",
                  }
                : {
                    bgcolor: "rgba(145, 158, 171, 0.16)",
                    color: "rgb(99, 115, 129)",
                  }),
              "& .MuiChip-label": { px: 1 },
            }}
          />
        </Box>
      ),
    },
    {
      field: "updatedAt",
      headerName: "Cập nhật lần cuối",
      width: 200,
      renderCell: (p) => (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ height: "100%", color: "text.secondary" }}>
          <UpdateIcon sx={{ fontSize: 16, color: "text.disabled" }} />
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            {p.row.updatedAt ? new Date(p.row.updatedAt).toLocaleString("vi-VN") : "—"}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "actions",
      headerName: "Thao tác",
      width: 100,
      align: "right",
      headerAlign: "right",
      sortable: false,
      filterable: false,
      renderCell: (p) => (
        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end", width: "100%", height: "100%", alignItems: "center" }}>
          <Tooltip title="Chỉnh sửa">
            <IconButton
              size="small"
              onClick={() => navigate(`/${prefixAdmin}/booking/no-show-config/${p.row.id}`)}
              sx={{ color: "primary.main", bgcolor: "primary.lighter", "&:hover": { bgcolor: "primary.light" } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xóa">
            <IconButton size="small" color="error" onClick={() => setDeleteTarget(p.row)} sx={{ bgcolor: "error.lighter", "&:hover": { bgcolor: "error.light" } }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <ListHeader
        title="Cấu hình No-Show"
        breadcrumbItems={[
          { label: "Dashboard", to: `/${prefixAdmin}` },
          { label: "Đặt lịch", to: `/${prefixAdmin}/booking/list` },
          { label: "Cấu hình No-Show" },
        ]}
      />

      <Card sx={{ mx: { xs: 0, md: "24px" }, p: 3, boxShadow: "0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)", borderRadius: "16px" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>Danh sách cấu hình</Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
              Quản lý các bộ quy tắc đánh dấu vắng mặt và xử lý tiền cọc cho từng dịch vụ.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/${prefixAdmin}/booking/no-show-config/new`)}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "10px",
              boxShadow: "0 8px 16px 0 rgba(0, 171, 85, 0.24)",
              px: 3,
              py: 1.2,
            }}
          >
            Tạo cấu hình mới
          </Button>
        </Box>

        <Box sx={{ 
          height: 640, 
          width: "100%", 
          "& .MuiDataGrid-root": { border: "none" }, 
          "& .MuiDataGrid-columnHeaders": { bgcolor: "background.neutral", borderRadius: "8px", borderBottom: 0 }, 
          "& .MuiDataGrid-cell": { 
            borderBottom: "1px dashed rgba(145, 158, 171, 0.2)",
            display: "flex",
            alignItems: "center"
          }, 
          "& .MuiDataGrid-row:last-child .MuiDataGrid-cell": { borderBottom: 0 } 
        }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            getRowId={(r) => r.id ?? 0}
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            disableRowSelectionOnClick
            rowHeight={80}
          />
        </Box>
      </Card>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Xóa cấu hình?</DialogTitle>
        <DialogContent>
          <Typography>
            Xóa “{deleteTarget?.name}”? Các liên kết dịch vụ sẽ được gỡ. Thao tác không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button color="error" variant="contained" disabled={deleting} onClick={handleDelete}>
            {deleting ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
