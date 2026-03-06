import { useState, useEffect, useMemo } from 'react';
import { Box, Button, Stack, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { ListHeader } from '../../../components/ui/ListHeader';
import { prefixAdmin } from '../../../constants/routes';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateOpenShift, useCreateOpenShiftsBatch, useUpdateOpenShift, useCancelOpenShift, useDeleteAllWorkShifts, useShiftsForAdmin, useRegistrationsForShift, useShiftRoleConfigs, useSetShiftRoleConfigs, useApproveRegistration, useSetRegistrationOnLeave, useRejectLeaveRequest, useFinalizeShiftApprovals } from '../hooks/useWorkShift';
import { toast } from 'react-toastify';
import type { IWorkShift, IWorkShiftRegistration, IOpenShiftRequest, IAvailableShiftForStaff } from '../../../api/workShift.api';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import Cookies from 'js-cookie';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../../../api/auth.api';
import { getStaffPositions } from '../../../api/staffPosition.api';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import type { IShiftRoleConfigItemRequest } from '../../../api/workShift.api';

const STATUS_LABELS: Record<string, string> = { OPEN: 'Trống', ASSIGNED: 'Đã khóa', COMPLETED: 'Hoàn thành', CANCELLED: 'Hủy' };
const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const ROW_LABELS = ['Sáng', 'Chiều'];

/** Định mức mặc định: nếu tên chức vụ chứa từ khóa thì dùng số slot tương ứng (ca chưa có config; admin có thể sửa và lưu) */
const DEFAULT_QUOTA_MATCHES: { key: string; slots: number }[] = [
    { key: 'Thu ngân', slots: 1 },
    { key: 'Spa', slots: 2 },
    { key: 'Chăm sóc', slots: 1 },
];

function getDefaultQuotaForPositionName(positionName: string): number {
    const name = (positionName ?? '').trim();
    for (const { key, slots } of DEFAULT_QUOTA_MATCHES) {
        if (name.includes(key)) return slots;
    }
    return 0;
}

/** Chỉ số cột ngày (0=T2, 6=CN) từ ISO */
function getDayIndex(iso: string): number {
    const d = dayjs(iso).day();
    return d === 0 ? 6 : d - 1;
}
/** 0 = sáng, 1 = chiều */
function getSlotIndex(iso: string): number {
    return dayjs(iso).hour() >= 12 ? 1 : 0;
}
function formatTimeRange(start: string, end: string): string {
    return `${dayjs(start).format('HH:mm')} - ${dayjs(end).format('HH:mm')}`;
}

/** Lấy thông báo lỗi từ response 4xx/5xx (backend trả ApiResponse với field message) */
function getErrorMessage(err: any, fallback: string): string {
    const data = err?.response?.data;
    if (data != null) {
        const msg = data.message ?? data.error ?? data.msg;
        if (typeof msg === 'string' && msg.trim()) return msg.trim();
    }
    if (typeof err?.message === 'string' && err.message.trim()) return err.message.trim();
    return fallback;
}

/** Tuần tiếp theo: từ Thứ 2 00:00 đến Chủ nhật 23:59 */
function getNextWeekRange() {
    const today = dayjs();
    const dayOfWeek = today.day(); // 0 = Chủ nhật, 1 = Thứ 2, ...
    const daysUntilNextMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 7 : 8 - dayOfWeek;
    const nextMonday = today.add(daysUntilNextMonday, 'day').startOf('day');
    const nextSunday = nextMonday.add(6, 'day').endOf('day');
    return { start: nextMonday.toISOString(), end: nextSunday.toISOString() };
}

/** Tạo danh sách ca theo mẫu tuần chuẩn: cả tuần (T2–CN), sáng 8h–12h, chiều 13h–17h (giờ VN +07:00) */
function buildStandardWeekSlots(nextMonday: dayjs.Dayjs): IOpenShiftRequest[] {
    const slots: IOpenShiftRequest[] = [];
    const tz = '+07:00';
    for (let i = 0; i < 7; i++) {
        const d = nextMonday.add(i, 'day').format('YYYY-MM-DD');
        slots.push(
            { startTime: `${d}T08:00:00${tz}`, endTime: `${d}T12:00:00${tz}` },
            { startTime: `${d}T13:00:00${tz}`, endTime: `${d}T17:00:00${tz}` }
        );
    }
    return slots;
}

export const WorkShiftAdminPage = () => {
    const tokenAdmin = Cookies.get('tokenAdmin');
    const { data: meRes } = useQuery({
        queryKey: ['me-admin', tokenAdmin],
        queryFn: getMe,
        enabled: !!tokenAdmin,
    });
    const isAdminRole = meRes?.data?.role === 'ADMIN';

    const nextWeek = getNextWeekRange();
    const [from, setFrom] = useState<string>(nextWeek.start);
    const [to, setTo] = useState<string>(nextWeek.end);
    const [createStart, setCreateStart] = useState<string>('');
    const [createEnd, setCreateEnd] = useState<string>('');
    const [showCreate, setShowCreate] = useState(false);
    const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
    const [editShift, setEditShift] = useState<{ shiftId: number; startTime: string; endTime: string } | null>(null);
    const [editStart, setEditStart] = useState<string>('');
    const [editEnd, setEditEnd] = useState<string>('');
    const [deleteConfirmShiftId, setDeleteConfirmShiftId] = useState<number | null>(null);
    const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
    /** Định mức theo vai trò: positionId -> maxSlots (chỉ dùng khi selectedShiftId đang mở) */
    const [roleConfigSlots, setRoleConfigSlots] = useState<Record<number, number>>({});
    /** Chế độ chỉnh sửa định mức: false = read-only, true = cho phép sửa và hiện "Lưu định mức" */
    const [isEditingQuota, setIsEditingQuota] = useState(false);

    const queryClient = useQueryClient();
    const { data: shifts = [], isLoading } = useShiftsForAdmin(from, to);
    const { data: registrations = [], isLoading: regLoading } = useRegistrationsForShift(selectedShiftId);
    const { data: roleConfigs = [] } = useShiftRoleConfigs(selectedShiftId);
    const { data: positionsData } = useQuery({
        queryKey: ['staff-positions'],
        queryFn: async () => {
            const res = await getStaffPositions();
            const data = res?.data;
            return Array.isArray(data) ? data : [];
        },
    });
    const positions = Array.isArray(positionsData) ? positionsData : [];
    const { mutate: setRoleConfigs, isPending: savingRoleConfigs } = useSetShiftRoleConfigs();
    const { mutate: createShift, isPending: creating, isError: createError, error: createErrorObj, reset: resetCreateMutation } = useCreateOpenShift();
    const { mutate: createBatch, isPending: creatingBatch, isError: batchError, error: batchErrorObj, reset: resetBatchMutation } = useCreateOpenShiftsBatch();
    const { mutate: updateShift, isPending: updating } = useUpdateOpenShift();
    const { mutate: cancelShift, isPending: cancelling } = useCancelOpenShift();
    const { mutate: deleteAllShifts, isPending: deletingAll } = useDeleteAllWorkShifts();
    const { mutate: approve } = useApproveRegistration();
    const { mutate: setOnLeave, isPending: settingOnLeave } = useSetRegistrationOnLeave();
    const { mutate: rejectLeave, isPending: rejectingLeave } = useRejectLeaveRequest();
    const { mutate: finalizeApprovals, isPending: finalizing } = useFinalizeShiftApprovals();

    // Hiển thị lỗi từ mutation (đảm bảo toast hiện khi backend trả 400, kể cả khi onError không chạy)
    useEffect(() => {
        if (createError && createErrorObj) {
            toast.error(getErrorMessage(createErrorObj, 'Tạo ca thất bại'));
            resetCreateMutation();
        }
    }, [createError, createErrorObj, resetCreateMutation]);

    useEffect(() => {
        if (batchError && batchErrorObj) {
            toast.error(getErrorMessage(batchErrorObj, 'Tạo ca thất bại'));
            resetBatchMutation();
        }
    }, [batchError, batchErrorObj, resetBatchMutation]);

    /** Đồng bộ ô nhập định mức khi mở panel ca hoặc khi roleConfigs/positions thay đổi. Chỉ setState khi giá trị thực sự đổi để tránh loop (roleConfigs/positions có thể là ref mới mỗi render). */
    useEffect(() => {
        if (!selectedShiftId || positions.length === 0) {
            setRoleConfigSlots((prev) => (Object.keys(prev).length === 0 ? prev : {}));
            return;
        }
        const initial: Record<number, number> = {};
        for (const p of positions) {
            const cfg = roleConfigs.find((c: { positionId: number }) => c.positionId === p.id);
            const defaultByRole = getDefaultQuotaForPositionName(p.name as string);
            initial[p.id] = cfg?.maxSlots ?? defaultByRole ?? 0;
        }
        setRoleConfigSlots((prev) => {
            const prevKeys = Object.keys(prev).sort();
            const nextKeys = Object.keys(initial).sort();
            if (prevKeys.length !== nextKeys.length) return initial;
            if (prevKeys.every((k) => prev[Number(k)] === initial[Number(k)])) return prev;
            return initial;
        });
    }, [selectedShiftId, roleConfigs, positions]);

    /** Khi mở/đổi ca khác: luôn về chế độ read-only */
    useEffect(() => {
        setIsEditingQuota(false);
    }, [selectedShiftId]);

    /** Số nhân viên đã duyệt (APPROVED) theo tên vai trò – hiển thị "Đã duyệt: X/Y"; trước khi Duyệt lần cuối thì = 0. */
    const approvedCountByRoleName = useMemo(() => {
        const m: Record<string, number> = {};
        for (const r of registrations as IWorkShiftRegistration[]) {
            if (r.status !== 'APPROVED') continue;
            const name = (r.roleAtRegistrationName ?? '').trim();
            m[name] = (m[name] ?? 0) + 1;
        }
        return m;
    }, [registrations]);

    /** Số chỗ đã chiếm (APPROVED + PENDING + PENDING_LEAVE) theo vai trò – Xin nghỉ chờ duyệt vẫn giữ slot đến khi admin duyệt/từ chối. */
    const occupiedCountByRoleName = useMemo(() => {
        const m: Record<string, number> = {};
        for (const r of registrations as IWorkShiftRegistration[]) {
            if (r.status !== 'APPROVED' && r.status !== 'PENDING' && r.status !== 'PENDING_LEAVE') continue;
            const name = (r.roleAtRegistrationName ?? '').trim();
            m[name] = (m[name] ?? 0) + 1;
        }
        return m;
    }, [registrations]);

    /** Số người xin nghỉ còn đang “giữ” suất theo vai trò: PENDING_LEAVE và chưa được duyệt nghỉ (leaveDecision !== APPROVED_LEAVE). Đã duyệt nghỉ thì suất trống → part-time có thể được duyệt. */
    const pendingLeaveCountByRoleName = useMemo(() => {
        const m: Record<string, number> = {};
        for (const r of registrations as IWorkShiftRegistration[]) {
            if (r.status !== 'PENDING_LEAVE') continue;
            if (String(r.leaveDecision ?? '').toUpperCase() === 'APPROVED_LEAVE') continue;
            const name = (r.roleAtRegistrationName ?? '').trim();
            m[name] = (m[name] ?? 0) + 1;
        }
        return m;
    }, [registrations]);

    /** Số người tham gia ca hiển thị: chỉ tính Đã xếp ca (APPROVED) + Xin nghỉ mà admin đã chọn Từ chối nghỉ. Chờ duyệt (PENDING) chưa tính cho đến khi admin bấm Duyệt. */
    const displayParticipatingCountByRoleName = useMemo(() => {
        const m: Record<string, number> = {};
        for (const r of registrations as IWorkShiftRegistration[]) {
            const isConfirmedParticipating =
                r.status === 'APPROVED' ||
                (r.status === 'PENDING_LEAVE' && r.leaveDecision === 'REJECTED_LEAVE');
            if (!isConfirmedParticipating) continue;
            const name = (r.roleAtRegistrationName ?? '').trim();
            m[name] = (m[name] ?? 0) + 1;
        }
        return m;
    }, [registrations]);

    /** Đủ người theo định mức mới được Duyệt lần cuối: dùng cùng số đang hiển thị (đã xếp ca + đã chọn Từ chối nghỉ). Chờ duyệt chưa tính → phải Duyệt part-time trước khi được Duyệt lần cuối. */
    const canFinalizeShift = useMemo(() => {
        for (const p of positions as { id: number; name: string }[]) {
            const maxSlots = roleConfigSlots[p.id] ?? 0;
            if (maxSlots < 1) continue;
            const count = displayParticipatingCountByRoleName[p.name] ?? 0;
            if (count < maxSlots) return false;
        }
        return true;
    }, [positions, roleConfigSlots, displayParticipatingCountByRoleName]);

    /**
     * Kiểm tra đăng ký r có được phép bấm "Duyệt" không.
     * Slot bị chiếm bởi: APPROVED + PENDING_LEAVE chưa duyệt nghỉ (đã duyệt nghỉ thì suất trống, part-time được duyệt).
     */
    const canApproveRegistration = (r: IWorkShiftRegistration): boolean => {
        if (r.status !== 'PENDING') return false;
        const roleName = (r.roleAtRegistrationName ?? '').trim();
        if (!roleName) return true;
        const position = positions.find((p: { name: string }) => (p.name as string) === roleName);
        if (!position) return true;
        const maxSlots = roleConfigSlots[position.id as number] ?? 0;
        if (maxSlots < 1) return true;
        const approvedCount = approvedCountByRoleName[roleName] ?? 0;
        const pendingLeaveCount = pendingLeaveCountByRoleName[roleName] ?? 0;
        return approvedCount + pendingLeaveCount < maxSlots;
    };

    const handleSaveRoleConfigs = () => {
        if (!selectedShiftId) return;
        const configs: IShiftRoleConfigItemRequest[] = Object.entries(roleConfigSlots)
            .filter(([, slots]) => slots >= 1)
            .map(([positionId, maxSlots]) => ({ positionId: Number(positionId), maxSlots }));
        setRoleConfigs(
            { shiftId: selectedShiftId, configs },
            {
                onSuccess: (res: any) => {
                    if (res?.success) {
                        toast.success(res?.message ?? 'Đã cập nhật định mức theo vai trò');
                        setIsEditingQuota(false);
                    } else toast.error(res?.message ?? 'Có lỗi');
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.message ?? err?.message ?? 'Cập nhật định mức thất bại');
                },
            }
        );
    };

    const handleCreate = () => {
        if (!createStart || !createEnd) {
            toast.error('Chọn giờ bắt đầu và kết thúc');
            return;
        }
        createShift(
            { startTime: createStart, endTime: createEnd },
            {
                onSuccess: (res: any) => {
                    if (res?.success) {
                        const newShift = res?.data;
                        if (newShift) {
                            queryClient.setQueryData(
                                ['admin-shifts', from, to],
                                (prev: unknown) => (Array.isArray(prev) ? [...prev, newShift] : [newShift])
                            );
                        }
                        toast.success(res.message ?? 'Tạo ca trống thành công');
                        setShowCreate(false);
                        setCreateStart('');
                        setCreateEnd('');
                    } else {
                        toast.error(res?.message ?? 'Có lỗi');
                    }
                },
                onError: () => { /* Lỗi hiển thị qua useEffect khi mutation.isError */ },
            }
        );
    };

    const handleAutoGenerate = () => {
        const nextMonday = dayjs(nextWeek.start);
        const slots = buildStandardWeekSlots(nextMonday);
        createBatch(slots, {
            onSuccess: (res: any) => {
                if (res?.success) {
                    const count = res?.data?.length ?? slots.length;
                    toast.success(res?.message ?? `Đã tạo ${count} ca trống. Bạn có thể Sửa/Xóa từng ca cho ngày đặc biệt (vd: Tết).`);
                    queryClient.invalidateQueries({ queryKey: ['admin-shifts', from, to] });
                } else toast.error(res?.message ?? 'Có lỗi');
            },
            onError: () => { /* Lỗi hiển thị qua useEffect khi batch mutation.isError */ },
        });
    };

    const handleApprove = (registrationId: number) => {
        if (!selectedShiftId) return;
        approve(
            { shiftId: selectedShiftId, registrationId },
            {
                onSuccess: (res: any) => {
                    if (res?.success) {
                        toast.success('Đã duyệt đăng ký');
                        queryClient.invalidateQueries({ queryKey: ['work-shift-registrations', selectedShiftId] });
                    } else toast.error(res?.message ?? 'Có lỗi');
                },
                onError: (err: any) => {
                    const msg = err?.response?.data?.message ?? err?.message ?? 'Duyệt thất bại. Ca có thể đã đủ định mức cho vị trí này.';
                    toast.error(msg);
                },
            }
        );
    };

    const openEditDialog = (row: IWorkShift | IAvailableShiftForStaff) => {
        setEditShift(row);
        setEditStart(row.startTime ?? '');
        setEditEnd(row.endTime ?? '');
    };

    const handleUpdateShift = () => {
        if (!editShift || !editStart || !editEnd) {
            toast.error('Chọn giờ bắt đầu và kết thúc');
            return;
        }
        updateShift(
            { shiftId: editShift.shiftId, data: { startTime: editStart, endTime: editEnd } },
            {
                onSuccess: (res: any) => {
                    if (res?.success) {
                        toast.success(res.message ?? 'Cập nhật ca trống thành công');
                        setEditShift(null);
                        queryClient.invalidateQueries({ queryKey: ['admin-shifts', from, to] });
                    } else toast.error(res?.message ?? 'Có lỗi');
                },
                onError: (err: any) => {
                    toast.error(getErrorMessage(err, 'Cập nhật thất bại'));
                },
            }
        );
    };

    const handleCancelShift = (shiftId: number) => {
        cancelShift(shiftId, {
            onSuccess: (res: any) => {
                if (res?.success !== false) {
                    toast.success(res?.message ?? 'Đã hủy ca trống');
                    setDeleteConfirmShiftId(null);
                    queryClient.invalidateQueries({ queryKey: ['admin-shifts', from, to] });
                } else toast.error(res?.message ?? 'Có lỗi');
            },
            onError: (err: any) => {
                toast.error(getErrorMessage(err, 'Hủy ca thất bại'));
            },
        });
    };

    /** Trạng thái ca đang xem trong modal (OPEN = còn duyệt lần cuối được, ASSIGNED = đã khóa) */
    const selectedShiftStatus = useMemo(
        () => (shifts as IWorkShift[]).find((s: IWorkShift) => s.shiftId === selectedShiftId)?.status ?? null,
        [shifts, selectedShiftId]
    );

    /** Lưới thời khóa biểu: grid[slotIndex][dayIndex] = IWorkShift | null */
    const timetableGrid = useMemo(() => {
        const grid: (IWorkShift | null)[][] = [
            [null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null],
        ];
        const weekStart = dayjs(from).startOf('day');
        const weekEnd = weekStart.add(7, 'day');
        for (const shift of shifts) {
            const shiftDay = dayjs(shift.startTime);
            if (shiftDay.isBefore(weekStart) || !shiftDay.isBefore(weekEnd)) continue;
            const dayIndex = getDayIndex(shift.startTime);
            const slotIndex = getSlotIndex(shift.startTime);
            if (dayIndex >= 0 && dayIndex <= 6 && slotIndex >= 0 && slotIndex <= 1) {
                grid[slotIndex][dayIndex] = shift;
            }
        }
        return grid;
    }, [shifts, from]);

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <ListHeader
                title="Ca làm việc (Admin)"
                breadcrumbItems={[
                    { label: 'Trang chủ', to: '/' },
                    { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                    { label: 'Ca làm việc' },
                ]}
            />
            <Box sx={{ px: '40px', mb: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                    <DateTimePicker label="Từ" value={from ? dayjs(from) : null} onChange={(d) => setFrom(d?.toISOString() ?? '')} slotProps={{ textField: { size: 'small' } }} />
                    <DateTimePicker label="Đến" value={to ? dayjs(to) : null} onChange={(d) => setTo(d?.toISOString() ?? '')} slotProps={{ textField: { size: 'small' } }} />
                    {isAdminRole && (
                        <>
                            <Button variant="contained" color="primary" onClick={handleAutoGenerate} disabled={creatingBatch}>
                                Tạo ca tự động (tuần chuẩn)
                            </Button>
                            <Button variant="outlined" onClick={() => setShowCreate(true)}>Tạo ca trống (thủ công)</Button>
                            <Button variant="outlined" color="error" onClick={() => setDeleteAllConfirmOpen(true)}>Xóa tất cả ca</Button>
                        </>
                    )}
                </Stack>
                {isAdminRole && (
                    <Box sx={{ mt: 1, color: 'text.secondary', fontSize: '0.8rem' }}>
                        Tuần chuẩn: cả tuần (T2–CN), sáng 8h–12h, chiều 13h–17h. Sau khi tạo có thể <strong>Sửa</strong> hoặc <strong>Xóa</strong> từng ca cho ngày đặc biệt (vd: Tết đóng cửa sớm/trễ).
                    </Box>
                )}

                {isAdminRole && showCreate && (
                    <Box sx={{ mt: 2, p: 2, border: '1px solid #919eab33', borderRadius: 2, maxWidth: 400 }}>
                        <Box sx={{ mb: 1, color: 'text.secondary', fontSize: '0.875rem' }}>Chỉ tạo ca trống cho tuần tiếp theo</Box>
                        <DateTimePicker label="Giờ bắt đầu" value={createStart ? dayjs(createStart) : null} onChange={(d) => setCreateStart(d?.toISOString() ?? '')} minDateTime={dayjs(nextWeek.start)} maxDateTime={dayjs(nextWeek.end)} slotProps={{ textField: { fullWidth: true } }} />
                        <Box sx={{ mt: 2 }}>
                            <DateTimePicker label="Giờ kết thúc" value={createEnd ? dayjs(createEnd) : null} onChange={(d) => setCreateEnd(d?.toISOString() ?? '')} minDateTime={dayjs(nextWeek.start)} maxDateTime={dayjs(nextWeek.end)} slotProps={{ textField: { fullWidth: true } }} />
                        </Box>
                        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                            <Button variant="contained" onClick={handleCreate} disabled={creating}>Tạo</Button>
                            <Button variant="outlined" onClick={() => setShowCreate(false)}>Hủy</Button>
                        </Stack>
                    </Box>
                )}
            </Box>

            {/* Thời khóa biểu ca làm */}
            <Box sx={{ px: '40px', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Ca làm trong tuần</Typography>
                <TableContainer
                    sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        maxWidth: 1200,
                    }}
                >
                    <Table sx={{ tableLayout: 'fixed', minWidth: 700 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                                <TableCell sx={{ width: 160, py: 2, fontWeight: 700, fontSize: '1.0625rem', borderColor: 'rgba(255,255,255,0.2)' }}>
                                    Buổi / Ngày
                                </TableCell>
                                {DAY_LABELS.map((label, i) => (
                                    <TableCell key={i} align="center" sx={{ py: 2, fontWeight: 700, fontSize: '1.0625rem', borderColor: 'rgba(255,255,255,0.2)' }}>
                                        {label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {ROW_LABELS.map((rowLabel, slotIndex) => (
                                <TableRow key={slotIndex} sx={{ bgcolor: slotIndex === 0 ? 'background.paper' : 'grey.50' }}>
                                    <TableCell sx={{ width: 160, py: 2, fontWeight: 600, fontSize: '1rem', color: 'text.secondary' }}>
                                        {rowLabel}
                                    </TableCell>
                                    {DAY_LABELS.map((_, dayIndex) => {
                                        const shift = timetableGrid[slotIndex]?.[dayIndex];
                                        return (
                                            <TableCell key={dayIndex} align="center" sx={{ py: 2, minWidth: 130 }}>
                                                {isLoading ? (
                                                    <Typography sx={{ fontSize: '1rem' }} color="text.secondary">Đang tải...</Typography>
                                                ) : shift ? (
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                                        <Typography sx={{ fontWeight: 500, fontSize: '1rem' }}>
                                                            {formatTimeRange(shift.startTime, shift.endTime)}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.9375rem' }} color="text.secondary">
                                                            {STATUS_LABELS[shift.status] ?? shift.status}
                                                        </Typography>
                                                        <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
                                                            {shift.status === 'OPEN' && (
                                                                <>
                                                                    <Button size="small" variant="outlined" sx={{ px: 1.5, fontSize: '0.9375rem' }} onClick={() => openEditDialog(shift)}>Sửa</Button>
                                                                    <Button size="small" color="error" variant="outlined" sx={{ px: 1.5, fontSize: '0.9375rem' }} onClick={() => setDeleteConfirmShiftId(shift.shiftId)}>Xóa</Button>
                                                                </>
                                                            )}
                                                            <Button size="small" variant="contained" disableElevation sx={{ px: 1.5, fontSize: '0.9375rem' }} onClick={() => setSelectedShiftId(shift.shiftId)}>Xem đăng ký</Button>
                                                        </Stack>
                                                    </Box>
                                                ) : (
                                                    <Typography sx={{ fontSize: '1rem' }} color="text.disabled">—</Typography>
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Box sx={{ px: '40px' }}>
                {/* Dialog xem đăng ký ca – popup giữa trang */}
                <Dialog
                    open={selectedShiftId !== null}
                    onClose={() => setSelectedShiftId(null)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 2, overflow: 'hidden' } }}
                >
                    <DialogTitle sx={{ pb: 0, fontWeight: 600, fontSize: '1.25rem', position: 'relative', pr: 5 }}>
                        <span>Đăng ký ca {selectedShiftId != null ? `#${selectedShiftId}` : ''}</span>
                        <IconButton aria-label="Đóng" onClick={() => setSelectedShiftId(null)} sx={{ position: 'absolute', right: 8, top: 8 }} size="small">
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers sx={{ px: 2.5, py: 2 }}>
                        {selectedShiftId && (
                            <>
                                {/* Section: Định mức theo vai trò */}
                                <Typography sx={{ fontWeight: 600, mb: 1.5, fontSize: '1.0625rem' }}>
                                    Định mức theo vai trò
                                </Typography>
                                <Box sx={{ mb: 2.5 }}>
                                    {positions.length === 0 ? (
                                        <Typography sx={{ fontSize: '1rem' }} color="text.secondary">Chưa có chức vụ.</Typography>
                                    ) : (
                                        <Stack spacing={1.25}>
                                            {positions.map((p: { id: number; name: string }) => {
                                                const maxSlots = roleConfigSlots[p.id] ?? 0;
                                                // Hiển thị: chỉ tính Đã xếp ca + đã chọn Từ chối nghỉ. Chờ duyệt (part-time chưa duyệt) chưa cộng.
                                                const participatingCount = displayParticipatingCountByRoleName[p.name] ?? 0;
                                                const isFull = maxSlots > 0 && participatingCount >= maxSlots;
                                                return (
                                                    <Stack key={p.id} direction="row" alignItems="center" spacing={2} sx={{ py: 0.75 }}>
                                                        <Typography sx={{ minWidth: 220, fontSize: '1rem' }}>{p.name}</Typography>
                                                        {isEditingQuota ? (
                                                            <TextField
                                                                type="number"
                                                                size="small"
                                                                inputProps={{ min: 0, max: 99, style: { fontSize: '1rem' } }}
                                                                value={roleConfigSlots[p.id] ?? 0}
                                                                onChange={(e) => {
                                                                    const v = parseInt(e.target.value, 10);
                                                                    setRoleConfigSlots((prev) => ({ ...prev, [p.id]: isNaN(v) ? 0 : Math.max(0, v) }));
                                                                }}
                                                                sx={{ width: 72, '& .MuiInputBase-input': { fontSize: '1rem' } }}
                                                            />
                                                        ) : (
                                                            <Box sx={{ minWidth: 52, py: 0.75, px: 1.25, borderRadius: 1, bgcolor: isFull ? 'action.selected' : 'grey.100', fontSize: '1rem', fontWeight: 600 }}>
                                                                {maxSlots}
                                                            </Box>
                                                        )}
                                                        <Typography sx={{ fontSize: '1rem' }} color="text.secondary">người</Typography>
                                                        {maxSlots > 0 && (
                                                            <Typography sx={{ fontSize: '1rem', color: isFull ? 'success.main' : 'text.secondary', fontWeight: isFull ? 600 : 500 }}>
                                                                {isFull ? 'Đủ' : `${participatingCount}/${maxSlots}`}
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                );
                                            })}
                                        </Stack>
                                    )}
                                    <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" sx={{ mt: 2 }} useFlexGap>
                                        {isEditingQuota ? (
                                            <>
                                                <Button size="medium" variant="contained" onClick={handleSaveRoleConfigs} disabled={savingRoleConfigs || positions.length === 0} sx={{ fontSize: '0.9375rem' }}>Lưu định mức</Button>
                                                <Button size="medium" variant="outlined" onClick={() => setIsEditingQuota(false)} sx={{ fontSize: '0.9375rem' }}>Hủy</Button>
                                            </>
                                        ) : (
                                            <Button size="medium" variant="outlined" onClick={() => setIsEditingQuota(true)} disabled={positions.length === 0 || selectedShiftStatus === 'ASSIGNED'} sx={{ fontSize: '0.9375rem' }}>Sửa định mức</Button>
                                        )}
                                        {selectedShiftStatus === 'OPEN' && (
                                            <Tooltip title={!canFinalizeShift ? 'Số lượng người trong ca chưa đủ.' : ''}>
                                                <span>
                                                    <Button
                                                        size="medium"
                                                        variant="contained"
                                                        color="primary"
                                                        disabled={finalizing || !canFinalizeShift}
                                                        sx={{ fontSize: '0.9375rem' }}
                                                        onClick={() => {
                                                            if (!selectedShiftId) return;
                                                            if (!canFinalizeShift) {
                                                                toast.error('Số lượng người trong ca chưa đủ. Thêm người hoặc sửa định mức.');
                                                                return;
                                                            }
                                                            finalizeApprovals(selectedShiftId, {
                                                                onSuccess: (res: any) => {
                                                                    if (res?.success) toast.success(res?.message ?? 'Đã khóa ca.');
                                                                    else toast.error(res?.message ?? 'Có lỗi');
                                                                },
                                                                onError: (err: any) => toast.error(err?.response?.data?.message ?? err?.message ?? 'Duyệt lần cuối thất bại'),
                                                            });
                                                        }}
                                                    >
                                                        Duyệt lần cuối (khóa ca)
                                                    </Button>
                                                </span>
                                            </Tooltip>
                                        )}
                                    </Stack>
                                    {selectedShiftStatus === 'OPEN' && !canFinalizeShift && (
                                        <Typography sx={{ display: 'block', mt: 1, color: 'error.main', fontSize: '0.9375rem', fontWeight: 500 }}>
                                            Số lượng người trong ca chưa đủ. Thêm người hoặc sửa định mức.
                                        </Typography>
                                    )}
                                </Box>

                                <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, mt: 1 }} />

                                {/* Section: Danh sách nhân viên */}
                                <Typography sx={{ fontWeight: 600, mb: 1.5, fontSize: '1.0625rem' }}>
                                    Nhân viên trong ca
                                </Typography>
                                {regLoading ? (
                                    <Typography sx={{ fontSize: '1rem' }} color="text.secondary">Đang tải...</Typography>
                                ) : (registrations as IWorkShiftRegistration[]).length === 0 ? (
                                    <Typography sx={{ fontSize: '1rem' }} color="text.secondary">Chưa có đăng ký.</Typography>
                                ) : (
                                    <Stack spacing={1.25}>
                                        {(registrations as IWorkShiftRegistration[]).map((r) => {
                                            const statusLabel = r.status === 'PENDING' ? 'Chờ duyệt' : r.status === 'APPROVED' ? 'Đã xếp ca' : r.status === 'PENDING_LEAVE'
                                                ? (r.leaveDecision === 'APPROVED_LEAVE' ? 'Sẽ nghỉ' : r.leaveDecision === 'REJECTED_LEAVE' ? 'Sẽ làm' : 'Xin nghỉ chờ duyệt')
                                                : r.status === 'ON_LEAVE' ? 'Đã nghỉ' : 'Từ chối';
                                            const statusColor = r.status === 'APPROVED' ? 'success.main' : r.status === 'ON_LEAVE' ? 'warning.main' : r.status === 'PENDING_LEAVE' ? 'info.main' : r.status === 'REJECTED' ? 'error.main' : 'text.secondary';
                                            return (
                                                <Box
                                                    key={r.registrationId}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        gap: 2,
                                                        p: 1.5,
                                                        borderRadius: 1.5,
                                                        bgcolor: 'grey.50',
                                                        border: '1px solid',
                                                        borderColor: 'divider',
                                                    }}
                                                >
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography sx={{ fontWeight: 600, fontSize: '1.0625rem' }}>{r.staffFullName}</Typography>
                                                        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" sx={{ mt: 0.25 }}>
                                                            <Typography sx={{ fontSize: '0.9375rem' }} color="primary.main">
                                                                {r.workType === 'FULL_TIME' ? 'Full-time' : 'Part-time'}
                                                            </Typography>
                                                            {r.roleAtRegistrationName && (
                                                                <Typography sx={{ fontSize: '0.9375rem' }} color="text.secondary">· {r.roleAtRegistrationName}</Typography>
                                                            )}
                                                            <Typography sx={{ fontSize: '0.9375rem', color: statusColor, fontWeight: 500 }}>{statusLabel}</Typography>
                                                        </Stack>
                                                    </Box>
                                                    <Stack direction="row" spacing={1} flexShrink={0}>
                                                        {r.status === 'PENDING' && selectedShiftStatus === 'OPEN' && (
                                                            <Tooltip title={!canApproveRegistration(r) ? 'Đã đủ định mức' : ''}>
                                                                <span>
                                                                    <Button size="medium" variant="contained" onClick={() => handleApprove(r.registrationId)} disabled={!canApproveRegistration(r)} sx={{ fontSize: '0.9375rem' }}>Duyệt</Button>
                                                                </span>
                                                            </Tooltip>
                                                        )}
                                                        {r.status === 'PENDING_LEAVE' && selectedShiftStatus === 'OPEN' && (
                                                            <>
                                                                <Button
                                                                    size="medium"
                                                                    variant={r.leaveDecision === 'APPROVED_LEAVE' ? 'contained' : 'outlined'}
                                                                    color="primary"
                                                                    disabled={settingOnLeave || rejectingLeave}
                                                                    sx={{ fontSize: '0.9375rem' }}
                                                                    onClick={() => {
                                                                        if (!selectedShiftId) return;
                                                                        const regId = r.registrationId;
                                                                        setOnLeave({ shiftId: selectedShiftId, registrationId: regId }, {
                                                                            onSuccess: (res: any) => {
                                                                                if (res?.success !== false) {
                                                                                    toast.success('Đã ghi nhận.');
                                                                                    // Cập nhật cache ngay để nút Duyệt part-time bật (leaveDecision = APPROVED_LEAVE → suất trống).
                                                                                    queryClient.setQueryData(
                                                                                        ['work-shift-registrations', selectedShiftId],
                                                                                        (prev: IWorkShiftRegistration[] | undefined) => {
                                                                                            const list = Array.isArray(prev) ? prev : [];
                                                                                            return list.map((reg) =>
                                                                                                reg.registrationId === regId
                                                                                                    ? { ...reg, leaveDecision: 'APPROVED_LEAVE' as const }
                                                                                                    : reg
                                                                                            );
                                                                                        }
                                                                                    );
                                                                                    queryClient.invalidateQueries({ queryKey: ['work-shift-registrations', selectedShiftId] });
                                                                                } else toast.error(res?.message ?? 'Có lỗi');
                                                                            },
                                                                            onError: (err: any) => toast.error(err?.response?.data?.message ?? err?.message ?? 'Lỗi'),
                                                                        });
                                                                    }}
                                                                >Duyệt nghỉ</Button>
                                                                <Button
                                                                    size="medium"
                                                                    variant={r.leaveDecision === 'REJECTED_LEAVE' ? 'contained' : 'outlined'}
                                                                    color={r.leaveDecision === 'REJECTED_LEAVE' ? 'secondary' : 'inherit'}
                                                                    disabled={settingOnLeave || rejectingLeave}
                                                                    sx={{ fontSize: '0.9375rem' }}
                                                                    onClick={() => {
                                                                        if (!selectedShiftId) return;
                                                                        rejectLeave({ shiftId: selectedShiftId, registrationId: r.registrationId }, {
                                                                            onSuccess: (res: any) => {
                                                                                if (res?.success) { toast.success('Đã ghi nhận.'); queryClient.invalidateQueries({ queryKey: ['work-shift-registrations', selectedShiftId] }); }
                                                                                else toast.error(res?.message ?? 'Có lỗi');
                                                                            },
                                                                            onError: (err: any) => toast.error(err?.response?.data?.message ?? err?.message ?? 'Lỗi'),
                                                                        });
                                                                    }}
                                                                >Từ chối</Button>
                                                            </>
                                                        )}
                                                    </Stack>
                                                </Box>
                                            );
                                        })}
                                        {positions.map((p: { id: number; name: string }) => {
                                            const maxSlots = roleConfigSlots[p.id] ?? 0;
                                            const occupied = occupiedCountByRoleName[p.name] ?? 0;
                                            const remaining = Math.max(0, maxSlots - occupied);
                                            if (remaining === 0) return null;
                                            return (
                                                <Box key={`empty-${p.id}`} sx={{ py: 1.25, px: 1.5, borderRadius: 1, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'divider' }}>
                                                    <Typography sx={{ fontSize: '1rem' }} color="text.secondary">
                                                        [Trống] {remaining} suất {p.name} — Part-time có thể đăng ký bù.
                                                    </Typography>
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                )}
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Dialog chỉnh sửa ca trống */}
                <Dialog open={!!editShift} onClose={() => setEditShift(null)} maxWidth="sm" fullWidth>
                    <DialogTitle>Cập nhật ca trống #{editShift?.shiftId}</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>Chỉnh sửa giờ trong tuần tiếp theo</Box>
                            <DateTimePicker
                                label="Giờ bắt đầu"
                                value={editStart ? dayjs(editStart) : null}
                                onChange={(d) => setEditStart(d?.toISOString() ?? '')}
                                minDateTime={dayjs(nextWeek.start)}
                                maxDateTime={dayjs(nextWeek.end)}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                            <DateTimePicker
                                label="Giờ kết thúc"
                                value={editEnd ? dayjs(editEnd) : null}
                                onChange={(d) => setEditEnd(d?.toISOString() ?? '')}
                                minDateTime={dayjs(nextWeek.start)}
                                maxDateTime={dayjs(nextWeek.end)}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditShift(null)}>Hủy</Button>
                        <Button variant="contained" onClick={handleUpdateShift} disabled={updating}>Cập nhật</Button>
                    </DialogActions>
                </Dialog>

                {/* Dialog xác nhận xóa ca trống */}
                <Dialog open={deleteConfirmShiftId !== null} onClose={() => setDeleteConfirmShiftId(null)}>
                    <DialogTitle>Xác nhận hủy ca</DialogTitle>
                    <DialogContent>
                        Bạn có chắc muốn hủy ca trống #{deleteConfirmShiftId}? Ca sẽ bị xóa khỏi danh sách.
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteConfirmShiftId(null)}>Không</Button>
                        <Button color="error" variant="contained" onClick={() => deleteConfirmShiftId != null && handleCancelShift(deleteConfirmShiftId)} disabled={cancelling}>
                            Hủy ca
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={deleteAllConfirmOpen} onClose={() => !deletingAll && setDeleteAllConfirmOpen(false)}>
                    <DialogTitle>Xóa tất cả ca làm</DialogTitle>
                    <DialogContent>
                        Bạn có chắc muốn xóa toàn bộ ca làm? Tất cả đăng ký và định mức theo vai trò cũng sẽ bị xóa. Không thể hoàn tác.
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteAllConfirmOpen(false)} disabled={deletingAll}>Không</Button>
                        <Button color="error" variant="contained" onClick={() => deleteAllShifts(undefined, { onSuccess: () => { toast.success('Đã xóa tất cả ca làm.'); setDeleteAllConfirmOpen(false); setSelectedShiftId(null); }, onError: (err: any) => toast.error(err?.response?.data?.message ?? err?.message ?? 'Xóa thất bại') })} disabled={deletingAll}>
                            Xóa tất cả
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </LocalizationProvider>
    );
};
