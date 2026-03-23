import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import Tooltip from "@mui/material/Tooltip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Autocomplete from "@mui/material/Autocomplete";
import Checkbox from "@mui/material/Checkbox";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import IconButton from "@mui/material/IconButton";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import SettingsApplicationsIcon from "@mui/icons-material/SettingsApplications";
import HistoryIcon from "@mui/icons-material/History";
import AddIcon from "@mui/icons-material/Add";
import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import { CollapsibleCard } from "../../components/ui/CollapsibleCard";
import type { NoShowConfig, NoShowServiceSummary } from "../../../types/noShowConfig.type";
import {
  createAdminNoShowConfig,
  getAdminNoShowConfigById,
  updateAdminNoShowConfig,
  deleteAdminNoShowConfig,
  type UpsertNoShowConfigPayload,
} from "../../api/noShowConfig.api";
import { getServices } from "../../api/service.api";
import type { IService } from "../service/configs/types";
import { toast } from "react-toastify";

type ServiceRoomFilter = "all" | "required" | "not_required";

/** Chỉ UI: nhập theo phút hoặc giờ — API vẫn lưu `lateCheckinMinutes`. */
type LateCheckinUnit = "minutes" | "hours";

const defaultForm = (): UpsertNoShowConfigPayload => ({
  name: "Cấu hình No-Show mới",
  gracePeriodMinutes: 15,
  autoMarkNoShow: true,
  penaltyAmount: 0,
  allowLateCheckin: false,
  lateCheckinMinutes: 30,
  isActive: true,
  serviceIds: [],
});

export const NoShowConfigDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";
  const numericId = id && !isNew ? Number(id) : undefined;

  const [config, setConfig] = useState<NoShowConfig | null>(null);
  const [form, setForm] = useState<UpsertNoShowConfigPayload>(defaultForm());
  /** Dịch vụ đã chọn (đồng bộ khi lưu qua serviceIds) */
  const [linkedServices, setLinkedServices] = useState<NoShowServiceSummary[]>([]);
  const [allServices, setAllServices] = useState<IService[]>([]);
  const [pendingServices, setPendingServices] = useState<IService[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [expandedBase, setExpandedBase] = useState(true);
  const [expandedAdvanced, setExpandedAdvanced] = useState(true);
  const [expandedServices, setExpandedServices] = useState(true);
  const [serviceRoomFilter, setServiceRoomFilter] = useState<ServiceRoomFilter>("all");
  const [lateCheckinUnit, setLateCheckinUnit] = useState<LateCheckinUnit>("minutes");

  useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await getServices();
        const list = Array.isArray(res.data) ? (res.data as IService[]) : [];
        setAllServices(list.filter((s) => s.isActive && !s.isDeleted));
      } catch (e) {
        console.error(e);
      }
    };
    loadServices();
  }, [numericId]);

  useEffect(() => {
    if (isNew || !numericId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await getAdminNoShowConfigById(numericId);
        const data = res.data as NoShowConfig;
        setConfig(data);
        setForm({
          name: data.name ?? "",
          gracePeriodMinutes: Number(data.gracePeriodMinutes ?? 0),
          autoMarkNoShow: !!data.autoMarkNoShow,
          penaltyAmount: Number(data.penaltyAmount ?? 0),
          allowLateCheckin: !!data.allowLateCheckin,
          lateCheckinMinutes: Number(data.lateCheckinMinutes ?? 0),
          isActive: data.isActive,
          serviceIds: null,
        });
        setLinkedServices(Array.isArray(data.services) ? data.services : []);
      } catch (e) {
        console.error(e);
        const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(msg || "Không tải được cấu hình.");
        navigate(`/${prefixAdmin}/booking/no-show-config`);
      } finally {
        setLoading(false);
      }
    })();
  }, [isNew, numericId, navigate]);

  const serviceIdsPayload = useMemo(() => linkedServices.map((s) => s.id), [linkedServices]);

  const availableToAdd = useMemo(() => {
    const taken = new Set(linkedServices.map((s) => s.id));
    let list = allServices.filter((s) => {
      if (s.isAddon === true || s.isAdditionalCharge === true) return false;
      if (taken.has(s.serviceId)) return false;
      const aid = s.noShowConfigId ?? null;
      if (aid == null) return true;
      if (numericId != null && aid === numericId) return false;
      return false;
    });
    if (serviceRoomFilter === "required") {
      list = list.filter((s) => s.isRequiredRoom === true);
    } else if (serviceRoomFilter === "not_required") {
      list = list.filter((s) => s.isRequiredRoom !== true);
    }
    return list;
  }, [allServices, linkedServices, numericId, serviceRoomFilter]);

  /** Bỏ tick các dịch vụ không còn trong dropdown (đã thêm vào bảng / đổi bộ lọc). */
  useEffect(() => {
    const allowed = new Set(availableToAdd.map((s) => s.serviceId));
    setPendingServices((prev) => prev.filter((p) => allowed.has(p.serviceId)));
  }, [availableToAdd]);

  const handleServiceRoomFilterChange = (e: SelectChangeEvent<ServiceRoomFilter>) => {
    setServiceRoomFilter(e.target.value as ServiceRoomFilter);
  };

  const addPendingToLinked = () => {
    if (pendingServices.length === 0) return;
    setLinkedServices((prev) => {
      const ids = new Set(prev.map((x) => x.id));
      const next = [...prev];
      for (const s of pendingServices) {
        if (!ids.has(s.serviceId)) {
          next.push({ id: s.serviceId, code: s.code, serviceName: s.serviceName });
          ids.add(s.serviceId);
        }
      }
      return next;
    });
    setPendingServices([]);
  };

  const removeService = (sid: number) => {
    setLinkedServices((prev) => prev.filter((s) => s.id !== sid));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: UpsertNoShowConfigPayload = {
        ...form,
        name: form.name.trim(),
        gracePeriodMinutes: Number(form.gracePeriodMinutes ?? 0),
        penaltyAmount: Number(form.penaltyAmount ?? 0),
        lateCheckinMinutes: Number(form.lateCheckinMinutes ?? 0),
        serviceIds: serviceIdsPayload,
      };
      if (isNew) {
        const res = await createAdminNoShowConfig(payload);
        const data = res.data as NoShowConfig;
        if (data?.id) {
          navigate(`/${prefixAdmin}/booking/no-show-config/${data.id}`, { replace: true });
        }
        toast.success("Đã tạo cấu hình No-Show.");
      } else if (numericId) {
        const res = await updateAdminNoShowConfig(numericId, payload);
        const data = res.data as NoShowConfig;
        setConfig(data);
        setLinkedServices(Array.isArray(data.services) ? data.services : []);
        toast.success("Lưu cấu hình No-Show thành công.");
      }
    } catch (e) {
      console.error(e);
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Lưu cấu hình No-Show thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!numericId || !window.confirm("Xóa cấu hình này?")) return;
    try {
      await deleteAdminNoShowConfig(numericId);
      navigate(`/${prefixAdmin}/booking/no-show-config`);
    } catch (e) {
      console.error(e);
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Xóa thất bại.");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <ListHeader
        title={isNew ? "Tạo cấu hình No-Show" : "Chi tiết cấu hình No-Show"}
        breadcrumbItems={[
          { label: "Dashboard", to: `/${prefixAdmin}` },
          { label: "Đặt lịch", to: `/${prefixAdmin}/booking/list` },
          { label: "Cấu hình No-Show", to: `/${prefixAdmin}/booking/no-show-config` },
          { label: isNew ? "Tạo mới" : config?.name ?? `#${id}` },
        ]}
      />

      <Stack sx={{ margin: { xs: 0, md: "0 48px 48px" }, gap: "24px" }}>
        <Card sx={{ p: 4, borderRadius: "16px", boxShadow: "0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)" }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "primary.lighter",
                color: "primary.main",
              }}
            >
              <SettingsApplicationsIcon />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary" }}>Thông tin cấu hình</Typography>
              <Typography variant="body2" color="text.disabled">Thiết lập các tham số cơ bản cho bộ quy tắc No-Show.</Typography>
            </Box>
          </Stack>

          <TextField
            label="Tên cấu hình"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
            required
            placeholder="Ví dụ: Quy định vắng mặt Grooming"
            helperText="Tên gợi nhớ để phân biệt các bộ quy tắc khác nhau."
            sx={{
              "& .MuiOutlinedInput-root": { borderRadius: "12px" },
              "& .MuiFormHelperText-root": { ml: 0 }
            }}
          />
        </Card>

        <CollapsibleCard
          title="Cấu hình cơ bản"
          subheader="Điều khoản về thời gian chờ và chính sách tiền cọc"
          expanded={expandedBase}
          onToggle={() => setExpandedBase(!expandedBase)}
        >
          <Stack p="24px" gap="24px">
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: "24px 48px" }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: "text.primary" }}>Thời gian chờ tối đa</Typography>
                <TextField
                  label="Số phút chờ"
                  type="number"
                  value={form.gracePeriodMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, gracePeriodMinutes: Number(e.target.value) }))}
                  helperText="Sau thời gian này khách chưa đến sẽ bị coi là No-Show."
                  inputProps={{ min: 0 }}
                  fullWidth
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" }, "& .MuiFormHelperText-root": { ml: 0 } }}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: "text.primary" }}>Quy tắc tự động</Typography>
                <Stack direction="column" spacing={0.5}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!form.autoMarkNoShow}
                        onChange={(_, v) => setForm((f) => ({ ...f, autoMarkNoShow: v }))}
                        color="success"
                      />
                    }
                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Tự động đánh dấu No-Show</Typography>}
                  />
                </Stack>
              </Box>
            </Box>
          </Stack>
        </CollapsibleCard>

        <CollapsibleCard
          title="Cài đặt nâng cao"
          subheader="Mức phạt tài chính và xử lý trường hợp đến muộn"
          expanded={expandedAdvanced}
          onToggle={() => setExpandedAdvanced(!expandedAdvanced)}
        >
          <Stack p="24px" gap="24px">
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: "24px 32px" }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Phí phạt bổ sung (nếu có)</Typography>
                <TextField
                  label="Mức phạt (VND)"
                  type="number"
                  value={form.penaltyAmount}
                  onChange={(e) => setForm((f) => ({ ...f, penaltyAmount: Number(e.target.value) }))}
                  helperText="Khoản phí cộng thêm ngoài tiền cọc bị giữ."
                  inputProps={{ min: 0 }}
                  fullWidth
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Xử lý đến muộn (Late Check-in)</Typography>
                <Stack direction="column" spacing={1}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!form.allowLateCheckin}
                        onChange={(_, v) => setForm((f) => ({ ...f, allowLateCheckin: v }))}
                        color="warning"
                      />
                    }
                    label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Cho phép Check-in muộn</Typography>}
                  />
                  {form.allowLateCheckin && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                        Chọn đơn vị Phút hoặc Giờ, nhập một trong hai ô. Hệ thống lưu dưới dạng phút.
                      </Typography>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        alignItems={{ xs: "stretch", sm: "flex-start" }}
                        sx={{ flexWrap: "wrap" }}
                      >
                        <TextField
                          label="Thời gian tối đa (phút)"
                          type="number"
                          disabled={lateCheckinUnit === "hours"}
                          value={form.lateCheckinMinutes}
                          onChange={(e) => {
                            const v = e.target.value;
                            const m = v === "" ? 0 : parseInt(v, 10);
                            setForm((f) => ({
                              ...f,
                              lateCheckinMinutes: Number.isNaN(m) ? 0 : Math.max(0, m),
                            }));
                          }}
                          placeholder="30"
                          inputProps={{ min: 0, step: 1 }}
                          sx={{
                            flex: 1,
                            minWidth: 160,
                            "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                            ...(lateCheckinUnit === "hours" && { opacity: 0.65 }),
                          }}
                        />
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            alignSelf: { xs: "center", sm: "flex-start" },
                            pt: { sm: 0.5 },
                          }}
                        >
                          <ToggleButtonGroup
                            value={lateCheckinUnit}
                            exclusive
                            onChange={(_, v: LateCheckinUnit | null) => {
                              if (v != null) setLateCheckinUnit(v);
                            }}
                            size="small"
                            color="primary"
                            aria-label="Đơn vị thời gian check-in muộn"
                            sx={{
                              height: 40,
                              "& .MuiToggleButton-root": { px: 2, textTransform: "none", fontWeight: 700 },
                            }}
                          >
                            <ToggleButton value="minutes">Phút</ToggleButton>
                            <ToggleButton value="hours">Giờ</ToggleButton>
                          </ToggleButtonGroup>
                        </Box>
                        <TextField
                          label="Thời gian tối đa (giờ)"
                          type="number"
                          disabled={lateCheckinUnit === "minutes"}
                          value={(form.lateCheckinMinutes ?? 0) / 60}
                          onChange={(e) => {
                            const v = e.target.value;
                            const h = v === "" ? 0 : parseFloat(v);
                            setForm((f) => ({
                              ...f,
                              lateCheckinMinutes: Number.isNaN(h) ? 0 : Math.max(0, Math.round(h * 60)),
                            }));
                          }}
                          placeholder="0.5"
                          inputProps={{ min: 0, step: 0.25 }}
                          sx={{
                            flex: 1,
                            minWidth: 160,
                            "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                            ...(lateCheckinUnit === "minutes" && { opacity: 0.65 }),
                          }}
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                        Thời gian tối đa khách có thể đến muộn sau khi bị tính No-Show.
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            </Box>
          </Stack>
        </CollapsibleCard>

        <CollapsibleCard
          title="Dịch vụ áp dụng"
          subheader="Gán bộ quy tắc này cho các dịch vụ cụ thể bên dưới."
          expanded={expandedServices}
          onToggle={() => setExpandedServices(!expandedServices)}
        >
          <Stack p="24px" gap="24px">
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "flex-start" }}>
              <FormControl
                sx={{
                  minWidth: { xs: "100%", sm: 220 },
                  "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                }}
              >
                <InputLabel id="no-show-service-room-filter">Loại dịch vụ</InputLabel>
                <Select
                  labelId="no-show-service-room-filter"
                  label="Loại dịch vụ"
                  value={serviceRoomFilter}
                  onChange={handleServiceRoomFilterChange}
                  disabled={loading}
                >
                  <MenuItem value="all">Tất cả loại</MenuItem>
                  <MenuItem value="required">Có phòng</MenuItem>
                  <MenuItem value="not_required">Không phòng</MenuItem>
                </Select>
              </FormControl>
              <Autocomplete
                multiple
                disableCloseOnSelect
                sx={{
                  minWidth: 280,
                  flex: 1,
                  "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                }}
                options={availableToAdd}
                value={pendingServices}
                onChange={(_, v) => setPendingServices(v)}
                isOptionEqualToValue={(a, b) => a.serviceId === b.serviceId}
                getOptionLabel={(o) => `${o.serviceName} (${o.code})`}
                filterOptions={(opts, state) => {
                  const q = state.inputValue.trim().toLowerCase();
                  if (!q) return opts;
                  return opts.filter(
                    (o) =>
                      o.serviceName.toLowerCase().includes(q) ||
                      (o.code && o.code.toLowerCase().includes(q))
                  );
                }}
                renderOption={(props, option, { selected }) => (
                  <li {...props} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Checkbox size="small" checked={selected} tabIndex={-1} sx={{ py: 0 }} />
                    <span style={{ flex: 1 }}>
                      <Typography variant="body2" component="span" sx={{ fontWeight: 500 }}>
                        {option.serviceName}
                      </Typography>{" "}
                      <Typography component="span" variant="caption" color="text.secondary">
                        ({option.code})
                      </Typography>
                    </span>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Chọn dịch vụ để thêm" placeholder="Tìm tên hoặc mã dịch vụ..." />
                )}
                disabled={loading}
                limitTags={3}
                slotProps={{ listbox: { sx: { maxHeight: 320 } } }}
              />
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addPendingToLinked}
                disabled={pendingServices.length === 0}
                sx={{
                  height: 56,
                  borderRadius: "12px",
                  px: 3,
                  fontWeight: 700,
                  textTransform: "none",
                }}
              >
                {pendingServices.length > 0 ? `Thêm ${pendingServices.length} dịch vụ` : "Thêm vào DS"}
              </Button>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", overflow: "hidden" }}>
              <Table size="medium">
                <TableHead sx={{ bgcolor: "background.neutral" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, px: 3, py: 2 }}>Mã dịch vụ</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 2 }}>Tên dịch vụ</TableCell>
                    <TableCell align="right" width={100} sx={{ fontWeight: 700, px: 3, py: 2 }}>
                      Thao tác
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {linkedServices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                        <Typography color="text.disabled" sx={{ fontStyle: "italic", fontWeight: 500 }}>
                          Chưa chọn dịch vụ nào áp dụng bộ quy tắc này.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    linkedServices.map((s) => (
                      <TableRow key={s.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                        <TableCell sx={{ px: 3, py: 1.5 }}>
                          <Typography variant="subtitle2" sx={{ color: "primary.main", fontWeight: 700 }}>{s.code}</Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.serviceName}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ px: 3, py: 1.5 }}>
                          <Tooltip title="Xóa khỏi danh sách">
                            <IconButton size="small" color="error" onClick={() => removeService(s.id)} sx={{ bgcolor: "error.lighter", "&:hover": { bgcolor: "error.light" } }}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </CollapsibleCard>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1, py: 3, flexWrap: "wrap", gap: 3, borderTop: "1px dashed rgba(145, 158, 171, 0.2)", mt: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={!!form.isActive}
                  onChange={(_, v) => setForm((f) => ({ ...f, isActive: v }))}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": { color: "#00ab55" },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#00ab55" },
                  }}
                />
              }
              label={
                <Typography sx={{ fontWeight: 800, color: form.isActive ? "#00ab55" : "text.disabled", letterSpacing: 0.5 }}>
                  {form.isActive ? "QUY TẮC ĐANG HOẠT ĐỘNG" : "QUY TẮC ĐANG TẠM DỪNG"}
                </Typography>
              }
            />
            {config?.updatedAt && (
              <Typography sx={{ fontSize: "0.75rem", color: "text.disabled", ml: 1, display: "flex", alignItems: "center", gap: 0.5, fontWeight: 500 }}>
                <HistoryIcon sx={{ fontSize: 14 }} /> Cập nhật lần cuối: {new Date(config.updatedAt).toLocaleString("vi-VN")}
              </Typography>
            )}
          </Box>

          <Stack direction="row" spacing={2}>
            {!isNew && (
              <Button
                color="error"
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
                disabled={loading}
                sx={{ borderRadius: "12px", fontWeight: 700, textTransform: "none", px: 3, height: 48, borderColor: "rgba(255, 86, 48, 0.3)", "&:hover": { borderColor: "error.main", bgcolor: "rgba(255, 86, 48, 0.08)" } }}
              >
                Xóa cấu hình
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={saving ? null : <SaveIcon />}
              onClick={handleSave}
              disabled={saving || loading}
              sx={{
                bgcolor: "#1C252E",
                minHeight: "48px",
                minWidth: "180px",
                fontWeight: 700,
                fontSize: "0.9375rem",
                px: 4,
                borderRadius: "12px",
                textTransform: "none",
                boxShadow: "0 8px 16px 0 rgba(28, 37, 46, 0.24)",
                "&:hover": { bgcolor: "#454F5B", boxShadow: "none" },
              }}
            >
              {saving ? "Đang xử lý..." : "Lưu thay đổi"}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </div>
  );
};
