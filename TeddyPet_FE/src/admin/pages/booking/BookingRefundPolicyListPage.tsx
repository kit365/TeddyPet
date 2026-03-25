import { useEffect, useState } from "react";
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
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import type { BookingDepositRefundPolicy } from "../../../types/bookingRefundPolicy.type";
import {
  createAdminBookingDepositRefundPolicy,
  deleteAdminBookingDepositRefundPolicy,
  getAdminBookingDepositRefundPolicies,
  updateAdminBookingDepositRefundPolicyById,
  type UpsertBookingDepositRefundPolicyPayload,
} from "../../api/bookingRefundPolicy.api";

export const BookingRefundPolicyListPage = () => {
  const [rows, setRows] = useState<BookingDepositRefundPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<BookingDepositRefundPolicy | null>(null);

  const blankForm: UpsertBookingDepositRefundPolicyPayload = {
    policyName: "",
    description: "",
    depositPercentage: 25,
    fullRefundHours: 48,
    fullRefundPercentage: 100,
    partialRefundHours: 24,
    partialRefundPercentage: 50,
    noRefundHours: 12,
    noRefundPercentage: 0,
    noShowRefundPercentage: 0,
    noShowPenalty: 0,
    allowForceMajeure: true,
    forceMajeureRefundPercentage: 100,
    forceMajeureRequiresEvidence: true,
    isDefault: false,
    displayOrder: 0,
    highlightText: "",
    isActive: true,
  };

  const [form, setForm] = useState<UpsertBookingDepositRefundPolicyPayload>(blankForm);

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

  useEffect(() => {
    fetchPolicies();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(blankForm);
    setDialogOpen(true);
  };

  const openEdit = (row: BookingDepositRefundPolicy) => {
    setEditing(row);
    setForm({
      policyName: row.policyName ?? "",
      description: row.description ?? "",
      depositPercentage: row.depositPercentage ?? 0,
      fullRefundHours: row.fullRefundHours ?? 0,
      fullRefundPercentage: row.fullRefundPercentage ?? 0,
      partialRefundHours: row.partialRefundHours ?? 0,
      partialRefundPercentage: row.partialRefundPercentage ?? 0,
      noRefundHours: row.noRefundHours ?? 0,
      noRefundPercentage: row.noRefundPercentage ?? 0,
      noShowRefundPercentage: row.noShowRefundPercentage ?? 0,
      noShowPenalty: row.noShowPenalty ?? 0,
      allowForceMajeure: !!row.allowForceMajeure,
      forceMajeureRefundPercentage: row.forceMajeureRefundPercentage ?? 0,
      forceMajeureRequiresEvidence: !!row.forceMajeureRequiresEvidence,
      isDefault: !!row.isDefault,
      displayOrder: row.displayOrder ?? 0,
      highlightText: row.highlightText ?? "",
      isActive: !!row.isActive,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (row: BookingDepositRefundPolicy) => {
    const ok = window.confirm(`Xóa chính sách "${row.policyName}"?`);
    if (!ok) return;
    setSaving(true);
    try {
      await deleteAdminBookingDepositRefundPolicy(row.id);
      await fetchPolicies();
    } catch (e) {
      console.error(e);
      alert("Xóa thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!form.policyName?.trim()) {
      alert("Vui lòng nhập Tên chính sách.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateAdminBookingDepositRefundPolicyById(editing.id, {
          ...form,
          policyName: form.policyName.trim(),
        });
      } else {
        await createAdminBookingDepositRefundPolicy({
          ...form,
          policyName: form.policyName.trim(),
        });
      }
      setDialogOpen(false);
      setEditing(null);
      await fetchPolicies();
    } catch (e) {
      console.error(e);
      alert("Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", minWidth: 70, flex: 0.4 },
    {
      field: "policyName",
      headerName: "Tên chính sách",
      minWidth: 200,
      flex: 1.4,
      renderCell: (p) => (
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.9375rem" }}>{p.value}</Typography>
          {p.row.highlightText && (
            <Typography sx={{ fontSize: "0.875rem", color: "#9f1239", mt: 0.3 }}>
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3, fontSize: "0.875rem" }}>
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
        <Typography sx={{ fontSize: "0.875rem" }}>
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
          <Chip label="Mặc định" size="small" color="primary" sx={{ fontSize: "0.75rem", fontWeight: 700 }} />
        ) : null,
    },
    {
      field: "isActive",
      headerName: "Trạng thái",
      minWidth: 120,
      flex: 0.5,
      renderCell: (p) => (
        <Chip
          label={p.row.isDefault ? "Đang dùng" : p.value ? "Hoạt động" : "Không hoạt động"}
          size="small"
          sx={{
            fontSize: "0.75rem",
            fontWeight: 700,
            bgcolor: p.row.isDefault ? "#dcfce7" : p.value ? "#e0f2fe" : "#fee2e2",
            color: p.row.isDefault ? "#166534" : p.value ? "#075985" : "#b91c1c",
          }}
        />
      ),
    },
    {
      field: "actions",
      headerName: "Thao tác",
      minWidth: 120,
      flex: 0.6,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (p) => (
        <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5, width: "100%" }}>
          <IconButton size="small" onClick={() => openEdit(p.row as BookingDepositRefundPolicy)} title="Chỉnh sửa">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete(p.row as BookingDepositRefundPolicy)} title="Xóa" disabled={saving}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
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
        <Box sx={{ mb: 2, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.125rem", mb: 0.5 }}>
            Danh sách chính sách hoàn cọc
          </Typography>
            <Typography sx={{ fontSize: "0.875rem", color: "#6b7280" }}>
            Các chính sách này được dùng cho logic giữ chỗ và hoàn lại tiền cọc.
          </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.875rem", borderRadius: "10px", px: 2.5, py: 1.1 }}
          >
            Thêm chính sách
          </Button>
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
            "& .MuiDataGrid-columnHeader": { fontSize: "0.875rem", fontWeight: 800 },
            "& .MuiDataGrid-cell": { fontSize: "0.875rem" },
            "& .MuiDataGrid-row": { alignItems: "center" },
          }}
        />
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1rem" }}>
          {editing ? "Chỉnh sửa chính sách hoàn cọc" : "Thêm chính sách hoàn cọc"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Tên chính sách"
              value={form.policyName}
              onChange={(e) => setForm((f) => ({ ...f, policyName: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Highlight (hiển thị nổi bật)"
              value={form.highlightText ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, highlightText: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Mô tả"
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              fullWidth
              multiline
              rows={2}
            />

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
              <TextField
                label="Tỷ lệ cọc (%)"
                type="number"
                value={form.depositPercentage}
                onChange={(e) => setForm((f) => ({ ...f, depositPercentage: Number(e.target.value) }))}
                inputProps={{ min: 0 }}
              />
              <TextField
                label="Thứ tự hiển thị"
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))}
              />
              <Box />
            </Box>

            <Typography sx={{ fontWeight: 800, fontSize: "0.9375rem", mt: 1 }}>Mốc hoàn cọc</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
              <TextField
                label="<= (giờ) hoàn 100%"
                type="number"
                value={form.fullRefundHours}
                onChange={(e) => setForm((f) => ({ ...f, fullRefundHours: Number(e.target.value) }))}
                inputProps={{ min: 0 }}
              />
              <TextField
                label="Hoàn 100% (%)"
                type="number"
                value={form.fullRefundPercentage}
                onChange={(e) => setForm((f) => ({ ...f, fullRefundPercentage: Number(e.target.value) }))}
                inputProps={{ min: 0 }}
              />
              <Box />

              <TextField
                label="<= (giờ) hoàn một phần"
                type="number"
                value={form.partialRefundHours}
                onChange={(e) => setForm((f) => ({ ...f, partialRefundHours: Number(e.target.value) }))}
                inputProps={{ min: 0 }}
              />
              <TextField
                label="Hoàn một phần (%)"
                type="number"
                value={form.partialRefundPercentage}
                onChange={(e) => setForm((f) => ({ ...f, partialRefundPercentage: Number(e.target.value) }))}
                inputProps={{ min: 0 }}
              />
              <Box />

              <TextField
                label="<= (giờ) không hoàn"
                type="number"
                value={form.noRefundHours}
                onChange={(e) => setForm((f) => ({ ...f, noRefundHours: Number(e.target.value) }))}
                inputProps={{ min: 0 }}
              />
              <TextField
                label="Không hoàn (%)"
                type="number"
                value={form.noRefundPercentage}
                onChange={(e) => setForm((f) => ({ ...f, noRefundPercentage: Number(e.target.value) }))}
                inputProps={{ min: 0 }}
              />
              <Box />
            </Box>

            <Typography sx={{ fontWeight: 800, fontSize: "0.9375rem", mt: 1 }}>Không đến</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>
              <TextField
                label="Hoàn (%) khi không đến"
                type="number"
                value={form.noShowRefundPercentage}
                onChange={(e) => setForm((f) => ({ ...f, noShowRefundPercentage: Number(e.target.value) }))}
                inputProps={{ min: 0 }}
              />
              <TextField
                label="Phạt (VND) khi không đến"
                type="number"
                value={form.noShowPenalty}
                onChange={(e) => setForm((f) => ({ ...f, noShowPenalty: Number(e.target.value) }))}
                inputProps={{ min: 0 }}
              />
            </Box>

            <Typography sx={{ fontWeight: 800, fontSize: "0.9375rem", mt: 1 }}>Bất khả kháng</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!form.allowForceMajeure}
                    onChange={(_, v) => setForm((f) => ({ ...f, allowForceMajeure: v }))}
                  />
                }
                label="Cho phép bất khả kháng"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={!!form.forceMajeureRequiresEvidence}
                    onChange={(_, v) => setForm((f) => ({ ...f, forceMajeureRequiresEvidence: v }))}
                  />
                }
                label="Yêu cầu minh chứng"
              />
              <TextField
                label="Hoàn (%) bất khả kháng"
                type="number"
                value={form.forceMajeureRefundPercentage}
                onChange={(e) => setForm((f) => ({ ...f, forceMajeureRefundPercentage: Number(e.target.value) }))}
                inputProps={{ min: 0 }}
              />
              <Box />
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch checked={!!form.isDefault} onChange={(_, v) => setForm((f) => ({ ...f, isDefault: v }))} />
                }
                label="Đặt làm mặc định (Đang dùng)"
              />
              <FormControlLabel
                control={
                  <Switch checked={!!form.isActive} onChange={(_, v) => setForm((f) => ({ ...f, isActive: v }))} />
                }
                label="Hoạt động"
              />
            </Box>
            <Typography sx={{ fontSize: "0.8125rem", color: "#6b7280" }}>
              Lưu ý: Khi chọn “Đặt làm mặc định”, hệ thống sẽ tự bỏ mặc định của bản ghi trước đó và đảm bảo bản ghi mặc định luôn ở trạng thái hoạt động.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving} sx={{ textTransform: "none" }}>
            Hủy
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ textTransform: "none", fontWeight: 800 }}>
            {saving ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

