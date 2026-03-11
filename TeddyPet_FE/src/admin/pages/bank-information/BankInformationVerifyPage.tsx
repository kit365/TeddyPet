import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DataGrid } from "@mui/x-data-grid";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import { apiApp } from "../../../api";
import Cookies from "js-cookie";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

type BankInfoRow = {
  id: number;
  userId?: string | null;
  bookingId?: number | null;
  accountNumber: string;
  accountHolderName: string;
  bankCode: string;
  bankName: string;
  isVerify: boolean;
  isDefault: boolean;
  note?: string | null;
  createdAt?: string;
};

const withAuth = () => ({
  headers: { Authorization: `Bearer ${Cookies.get("tokenAdmin")}` },
});

async function getAdminBankInfos(verified: "all" | "verified" | "unverified"): Promise<any> {
  const params =
    verified === "all"
      ? {}
      : { verified: verified === "verified" ? "true" : "false" };
  const res = await apiApp.get("/api/bank-information/admin", {
    ...withAuth(),
    params,
  });
  return res.data;
}

async function verifyBankInfo(id: number, isVerify: boolean): Promise<any> {
  const res = await apiApp.patch(`/api/bank-information/${id}/verify`, { isVerify }, withAuth());
  return res.data;
}

export const BankInformationVerifyPage = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<BankInfoRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [filter, setFilter] = useState<"all" | "verified" | "unverified">(
    "unverified"
  );

  const { data: apiData = [], isLoading } = useQuery({
    queryKey: ["admin-bank-information", filter],
    queryFn: () => getAdminBankInfos(filter),
    select: (res) => {
      const list = res?.data;
      if (!Array.isArray(list)) return [];
      return list.map((b: any) => ({
        ...b,
        id: Number(b.id),
        isVerify: Boolean(b.isVerify),
        isDefault: Boolean(b.isDefault),
      })) as BankInfoRow[];
    },
  });

  const rows = apiData as BankInfoRow[];

  const totalCount = rows.length;
  const verifiedCount = useMemo(
    () => rows.filter((r) => r.isVerify).length,
    [rows]
  );
  const unverifiedCount = useMemo(
    () => rows.filter((r) => !r.isVerify).length,
    [rows]
  );

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", minWidth: 70, flex: 0.25, align: "center", headerAlign: "center" },
      { field: "bankName", headerName: "Ngân hàng", minWidth: 140, flex: 0.6 },
      { field: "accountNumber", headerName: "Số TK", minWidth: 130, flex: 0.55 },
      { field: "accountHolderName", headerName: "Chủ TK", minWidth: 160, flex: 0.7 },
      {
        field: "isVerify",
        headerName: "Xác thực",
        minWidth: 120,
        flex: 0.5,
        align: "center",
        headerAlign: "center",
        renderCell: (p: any) => (
          <Chip
            label={p.value ? "Đã xác thực" : "Chưa xác thực"}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: "1.15rem",
              bgcolor: p.value ? "#dcfce7" : "#fffbeb",
              color: p.value ? "#166534" : "#b45309",
              border: `1px solid ${p.value ? "#bbf7d0" : "#fde68a"}`,
            }}
          />
        ),
      },
      {
        field: "action",
        headerName: "Thao tác",
        minWidth: 140,
        flex: 0.6,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => (
          <Button
            size="small"
            variant="outlined"
            sx={{ textTransform: "none", fontSize: "1.25rem", fontWeight: 700, borderRadius: "10px" }}
            onClick={() => {
              setSelected(p.row as BankInfoRow);
              setOpen(true);
              setError(null);
            }}
          >
            Xem / Verify
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div className="flex flex-col gap-8">
      <ListHeader
        title="Xác thực tài khoản ngân hàng"
        breadcrumbItems={[
          { label: "Dashboard", to: `/${prefixAdmin}` },
          { label: "Bank Information" },
        ]}
      />

      <Card sx={{ p: 2, borderRadius: "18px" }}>
        <Box sx={{ mb: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: "1.6rem" }}>
            Danh sách bank info (ưu tiên tạo từ Profile)
          </Typography>
        </Box>
        <Tabs
          value={filter}
          onChange={(_, v) => setFilter(v)}
          sx={{
            mb: 1,
            "& .MuiTab-root": {
              fontSize: "1.3rem",
              textTransform: "none",
              fontWeight: 700,
              minHeight: 40,
            },
            "& .MuiTabs-indicator": { height: 3, bgcolor: "#1C252E" },
          }}
        >
          <Tab value="all" label={`Tất cả (${totalCount})`} />
          <Tab value="unverified" label={`Chưa xác thực (${unverifiedCount})`} />
          <Tab value="verified" label={`Đã xác thực (${verifiedCount})`} />
        </Tabs>
        <DataGrid
          rows={rows}
          columns={columns as any}
          getRowId={(r) => r.id}
          loading={isLoading}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeader": { fontSize: "1.35rem", fontWeight: 800 },
            "& .MuiDataGrid-cell": { fontSize: "1.35rem" },
          }}
        />
      </Card>

      <Dialog open={open} onClose={() => (!saving ? setOpen(false) : null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: "1.6rem", fontWeight: 900 }}>Xác thực Bank Information</DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2, fontSize: "1.35rem" }}>
              {error}
            </Alert>
          )}
          <Typography sx={{ fontSize: "1.35rem", mb: 1 }}>
            Ngân hàng: <b>{selected?.bankName}</b> ({selected?.bankCode})
          </Typography>
          <Typography sx={{ fontSize: "1.35rem", mb: 1 }}>
            Số TK: <b>{selected?.accountNumber}</b>
          </Typography>
          <Typography sx={{ fontSize: "1.35rem", mb: 1 }}>
            Chủ TK: <b>{selected?.accountHolderName}</b>
          </Typography>
          {selected?.note ? (
            <Typography sx={{ fontSize: "1.35rem", mb: 1 }}>
              Ghi chú: <span>{selected.note}</span>
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpen(false)}
            disabled={saving}
            sx={{ textTransform: "none", fontSize: "1.3rem", fontWeight: 700 }}
          >
            Đóng
          </Button>
          <Button
            variant="outlined"
            color="warning"
            disabled={saving || !selected}
            onClick={async () => {
              if (!selected) return;
              try {
                setSaving(true);
                await verifyBankInfo(selected.id, false);
                await queryClient.invalidateQueries({
                  queryKey: ["admin-bank-information"],
                });
                setOpen(false);
              } catch (e) {
                console.error(e);
                setError("Không thể hủy xác thực.");
              } finally {
                setSaving(false);
              }
            }}
            sx={{ textTransform: "none", fontSize: "1.3rem", fontWeight: 800, borderRadius: "10px" }}
          >
            Unverify
          </Button>
          <Button
            variant="contained"
            color="success"
            disabled={saving || !selected}
            onClick={async () => {
              if (!selected) return;
              try {
                setSaving(true);
                await verifyBankInfo(selected.id, true);
                await queryClient.invalidateQueries({
                  queryKey: ["admin-bank-information"],
                });
                setOpen(false);
              } catch (e) {
                console.error(e);
                setError("Không thể xác thực.");
              } finally {
                setSaving(false);
              }
            }}
            sx={{ textTransform: "none", fontSize: "1.3rem", fontWeight: 800, borderRadius: "10px" }}
          >
            Verify
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

