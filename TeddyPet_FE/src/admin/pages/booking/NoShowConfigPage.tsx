import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import { CollapsibleCard } from "../../components/ui/CollapsibleCard";
import type { NoShowConfig } from "../../../types/noShowConfig.type";
import { getAdminNoShowConfig, upsertAdminNoShowConfig, type UpsertNoShowConfigPayload } from "../../api/noShowConfig.api";

export const NoShowConfigPage = () => {
  const [config, setConfig] = useState<NoShowConfig | null>(null);
  const [form, setForm] = useState<UpsertNoShowConfigPayload>({
    gracePeriodMinutes: 15,
    autoMarkNoShow: true,
    forfeitDeposit: true,
    penaltyAmount: 0,
    allowLateCheckin: false,
    lateCheckinMinutes: 30,
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await getAdminNoShowConfig();
      const data = res.data as NoShowConfig | null;
      if (data) {
        setConfig(data);
        setForm({
          gracePeriodMinutes: Number(data.gracePeriodMinutes ?? 0),
          autoMarkNoShow: !!data.autoMarkNoShow,
          forfeitDeposit: !!data.forfeitDeposit,
          penaltyAmount: Number(data.penaltyAmount ?? 0),
          allowLateCheckin: !!data.allowLateCheckin,
          lateCheckinMinutes: Number(data.lateCheckinMinutes ?? 0),
          isActive: data.isActive,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: UpsertNoShowConfigPayload = {
        ...form,
        gracePeriodMinutes: Number(form.gracePeriodMinutes ?? 0),
        penaltyAmount: Number(form.penaltyAmount ?? 0),
        lateCheckinMinutes: Number(form.lateCheckinMinutes ?? 0),
      };
      const res = await upsertAdminNoShowConfig(payload);
      const data = res.data as NoShowConfig;
      setConfig(data);
      setForm({
        gracePeriodMinutes: Number(data.gracePeriodMinutes ?? 0),
        autoMarkNoShow: !!data.autoMarkNoShow,
        forfeitDeposit: !!data.forfeitDeposit,
        penaltyAmount: Number(data.penaltyAmount ?? 0),
        allowLateCheckin: !!data.allowLateCheckin,
        lateCheckinMinutes: Number(data.lateCheckinMinutes ?? 0),
        isActive: data.isActive,
      });
      alert("Lưu cấu hình No-Show thành công.");
    } catch (e) {
      console.error(e);
      alert("Lưu cấu hình No-Show thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const [expandedBase, setExpandedBase] = useState(true);
  const [expandedAdvanced, setExpandedAdvanced] = useState(true);

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

      <Stack sx={{ margin: { xs: "0px", md: "0px 80px" }, gap: "40px" }}>
        <CollapsibleCard
          title="Cấu hình cơ bản"
          subheader="Thiết lập thời gian chờ và tự động đánh dấu No-Show"
          expanded={expandedBase}
          onToggle={() => setExpandedBase(!expandedBase)}
        >
          <Stack p="24px" gap="24px">
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: "24px 16px" }}>
              <TextField
                label="Thời gian chờ (phút)"
                type="number"
                value={form.gracePeriodMinutes}
                onChange={(e) => setForm((f) => ({ ...f, gracePeriodMinutes: Number(e.target.value) }))}
                helperText="Ví dụ: 15 phút. Sau thời gian này khách chưa đến sẽ bị coi là No-Show."
                inputProps={{ min: 0 }}
                fullWidth
              />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!form.autoMarkNoShow}
                      onChange={(_, v) => setForm((f) => ({ ...f, autoMarkNoShow: v }))}
                    />
                  }
                  label="Tự động đánh dấu No-Show"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!form.forfeitDeposit}
                      onChange={(_, v) => setForm((f) => ({ ...f, forfeitDeposit: v }))}
                    />
                  }
                  label="Tịch thu cọc khi No-Show"
                />
              </Box>
            </Box>
          </Stack>
        </CollapsibleCard>

        <CollapsibleCard
          title="Cài đặt nâng cao"
          subheader="Mức phạt và cho phép check-in muộn"
          expanded={expandedAdvanced}
          onToggle={() => setExpandedAdvanced(!expandedAdvanced)}
        >
          <Stack p="24px" gap="24px">
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: "24px 16px" }}>
              <TextField
                label="Mức phạt thêm (VND)"
                type="number"
                value={form.penaltyAmount}
                onChange={(e) => setForm((f) => ({ ...f, penaltyAmount: Number(e.target.value) }))}
                helperText="Tiền phạt thêm ngoài tiền cọc bị giữ (nếu có)."
                inputProps={{ min: 0 }}
                fullWidth
              />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!form.allowLateCheckin}
                      onChange={(_, v) => setForm((f) => ({ ...f, allowLateCheckin: v }))}
                    />
                  }
                  label="Cho phép Check-in muộn"
                />
                {form.allowLateCheckin && (
                  <TextField
                    label="Thời gian cho phép Check-in muộn (phút)"
                    type="number"
                    value={form.lateCheckinMinutes}
                    onChange={(e) => setForm((f) => ({ ...f, lateCheckinMinutes: Number(e.target.value) }))}
                    helperText="Ví dụ: 30 phút. Chỉ áp dụng khi cho phép check-in muộn."
                    inputProps={{ min: 0 }}
                    fullWidth
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
            </Box>
          </Stack>
        </CollapsibleCard>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={!!form.isActive}
                  onChange={(_, v) => setForm((f) => ({ ...f, isActive: v }))}
                />
              }
              label={
                <Typography sx={{ fontWeight: 600, color: form.isActive ? "primary.main" : "text.secondary" }}>
                  {form.isActive ? "Đang kích hoạt No-Show" : "Đang tạm dừng No-Show"}
                </Typography>
              }
            />
            {config && (
              <Typography sx={{ fontSize: "0.8125rem", color: "#637381", ml: 1 }}>
                Cập nhật lần cuối: {config.updatedAt ? new Date(config.updatedAt).toLocaleString("vi-VN") : "—"}
              </Typography>
            )}
          </Box>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || loading}
            sx={{
              background: "#1C252E",
              minHeight: "3rem",
              fontWeight: 700,
              fontSize: "0.875rem",
              padding: "8px 24px",
              borderRadius: "8px",
              textTransform: "none",
              "&:hover": { background: "#454F5B" },
            }}
          >
            {saving ? "Đang lưu..." : "Lưu cấu hình"}
          </Button>
        </Box>
      </Stack>
    </div>
  );
};

