import { useState, useEffect, useMemo } from 'react';
import { Box, Button, Stack, Typography, Grid, Paper, Chip, alpha } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { ListHeader } from '../../../components/ui/ListHeader';
import { prefixAdmin } from '../../../constants/routes';
import { useQueryClient } from '@tanstack/react-query';
import { 
    useCreateOpenShift, 
    useCreateOpenShiftsBatch, 
    useUpdateOpenShift, 
    useCancelOpenShift, 
    useDeleteAllWorkShifts, 
    useShiftsForAdmin, 
    useRegistrationsForShift, 
    useShiftRoleConfigs, 
    useSetShiftRoleConfigs, 
    useApproveRegistration, 
    useSetRegistrationOnLeave, 
    useRejectLeaveRequest, 
    useFinalizeShiftApprovals, 
    useCancelAdminRegistration, 
    useAssignableBookingPetServices, 
    useAssignBookingPetServiceToShift, 
    useUnassignBookingPetService 
} from '../hooks/useWorkShift';
import { toast } from 'react-toastify';
import type { IWorkShift, IWorkShiftRegistration, IOpenShiftRequest, IAvailableShiftForStaff, IWorkShiftBookingPetServiceItem } from '../../../api/workShift.api';
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
import { AlertTriangle, CalendarClock, UserPlus } from 'lucide-react';
import type { IShiftRoleConfigItemRequest } from '../../../api/workShift.api';
import DashboardCard from '../../../components/dashboard/DashboardCard';
import { Icon } from '@iconify/react';

/** Số cột ngày trên lưới (= số ngày tối đa trong khoảng Từ–Đến). */
const VIEW_DAY_COUNT = 7;

/** Cột trạng thái xếp ca: dịch vụ cần phòng → hiển thị thời điểm check-in booking; không thì khung giờ đã xếp ca. */
function renderBookingPetServiceShiftStatusChip(item: IWorkShiftBookingPetServiceItem) {
    if (item.serviceRequiresRoom) {
        if (item.bookingCheckInDate) {
            return (
                <Tooltip title="Dịch vụ phòng: lấy theo thời điểm check-in booking">
                    <Chip
                        size="small"
                        variant="outlined"
                        color="primary"
                        label={dayjs(item.bookingCheckInDate).format('DD/MM/YYYY HH:mm')}
                        sx={{ fontWeight: 700, fontSize: '11px' }}
                    />
                </Tooltip>
            );
        }
        return (
            <Chip
                size="small"
                variant="outlined"
                color="warning"
                label="Chưa check-in"
                sx={{ fontWeight: 700, fontSize: '11px' }}
            />
        );
    }
    if (item.scheduledStartTime && item.scheduledEndTime) {
        return (
            <Chip
                size="small"
                variant="outlined"
                color="success"
                label={`${dayjs(item.scheduledStartTime).format('HH:mm')} - ${dayjs(item.scheduledEndTime).format('HH:mm')}`}
                sx={{ fontWeight: 700, fontSize: '11px' }}
            />
        );
    }
    return <Chip size="small" variant="outlined" color="default" label="Chưa xếp" sx={{ fontWeight: 700, fontSize: '11px' }} />;
}

/** Nhãn thứ theo lịch JS: 0=CN, 1=T2, …, 6=T7 */
const VN_WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const;

function vnWeekdayShort(d: dayjs.Dayjs): string {
    return VN_WEEKDAY_SHORT[d.day()];
}

const ROW_LABELS = ['Sáng', 'Chiều'];

function getInitials(name: string): string {
    const parts = (name ?? '').trim().split(/\s+/);
    if (!parts.length) return 'NV';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}





function makeCellKeyFromStartTime(startTime: string): string {
    const dateKey = dayjs(startTime).format('YYYY-MM-DD');
    const slotIndex = getSlotIndex(startTime);
    return `${dateKey}-${slotIndex}`;
}

/** Rule định mức mặc định theo thứ & buổi cho 3 nhóm vai trò:
 * - NV_BH: Nhân viên bán hàng / thu ngân
 * - NV_SP: Nhân viên spa
 * - NV_CS: Nhân viên chăm sóc
 *
 * Thứ tự cột: 0=T2, 1=T3, 2=T4, 3=T5, 4=T6, 5=T7, 6=CN
 * slotIndex: 0 = sáng, 1 = chiều
 */
interface BaseQuotaTemplate {
    NV_BH: number;
    NV_SP: number;
    NV_CS: number;
}

function getBaseQuotaTemplate(dayIndex: number, slotIndex: number): BaseQuotaTemplate {
    const isWeekday = dayIndex >= 0 && dayIndex <= 3; // T2–T5
    const isFriday = dayIndex === 4; // T6
    const isWeekend = dayIndex === 5 || dayIndex === 6; // T7, CN

    if (isWeekday || (isFriday && slotIndex === 0)) {
        // T2–T5 (sáng & chiều) + T6 (sáng)
        return { NV_BH: 1, NV_SP: 1, NV_CS: 1 };
    }

    if (isFriday && slotIndex === 1) {
        // T6 (chiều)
        return { NV_BH: 1, NV_SP: 1, NV_CS: 2 };
    }

    if (isWeekend && slotIndex === 0) {
        // T7, CN (sáng)
        return { NV_BH: 1, NV_SP: 2, NV_CS: 1 };
    }

    // T7, CN (chiều)
    return { NV_BH: 1, NV_SP: 2, NV_CS: 2 };
}

/** Định mức mặc định cho 1 chức vụ cụ thể, dựa trên tên chức vụ + thứ & buổi của ca. */
function getDefaultQuotaForPositionName(positionName: string, dayIndex?: number | null, slotIndex?: number | null): number {
    const name = (positionName ?? '').trim().toLowerCase();
    if (dayIndex == null || slotIndex == null) {
        // Không xác định được thứ/buổi → không tự gán định mức.
        return 0;
    }

    const base = getBaseQuotaTemplate(dayIndex, slotIndex);

    if (name.includes('bán hàng') || name.includes('thu ngân')) {
        // NV_BH
        return base.NV_BH;
    }
    if (name.includes('spa')) {
        // NV_SP
        return base.NV_SP;
    }
    if (name.includes('chăm sóc')) {
        // NV_CS
        return base.NV_CS;
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
    return `${dayjs(start).format('HH:mm')}-${dayjs(end).format('HH:mm')}`;
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

const getRegistrationStatusUI = (r: IWorkShiftRegistration) => {
    if (r.status === 'PENDING') return { label: 'Chờ duyệt', badgeClass: 'bg-blue-100 text-blue-700 border border-blue-200' };
    if (r.status === 'APPROVED') return { label: 'Đã duyệt', badgeClass: 'bg-emerald-100 text-emerald-700 border border-emerald-200' };
    if (r.status === 'PENDING_LEAVE') {
        if (r.leaveDecision === 'APPROVED_LEAVE') return { label: 'Sẽ nghỉ', badgeClass: 'bg-amber-100 text-amber-700 border border-amber-200' };
        if (r.leaveDecision === 'REJECTED_LEAVE') return { label: 'Sẽ làm', badgeClass: 'bg-amber-100 text-amber-700 border border-amber-200' };
        return { label: 'Xin nghỉ chờ duyệt', badgeClass: 'bg-amber-100 text-amber-700 border border-amber-200' };
    }
    if (r.status === 'ON_LEAVE') return { label: 'Đã nghỉ', badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200' };
    if (r.status === 'REJECTED') return { label: 'Từ chối', badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200' };
    return { label: 'Từ chối', badgeClass: 'bg-rose-100 text-rose-700 border border-rose-200' };
};

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
        queryFn: () => getMe(),
        enabled: !!tokenAdmin,
    });
    const isAdminRole = (meRes as any)?.data?.role === 'ADMIN' || (meRes as any)?.data?.role === 'SUPER_ADMIN';

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
    const [recentlyDeletedCells, setRecentlyDeletedCells] = useState<string[]>([]);

    const queryClient = useQueryClient();
    const { data: shifts = [], isLoading } = useShiftsForAdmin(from, to);

    /** Dịch khoảng Từ–Đến ±7 ngày (xem tuần trước / tuần sau). */
    const shiftDateRangeByWeek = (deltaWeeks: number) => {
        if (!from || !to) return;
        setFrom(dayjs(from).add(deltaWeeks * 7, 'day').toISOString());
        setTo(dayjs(to).add(deltaWeeks * 7, 'day').toISOString());
    };
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
    const { mutate: cancelAssignment } = useCancelAdminRegistration();
    const { data: bookingPetServicePool } = useAssignableBookingPetServices(from, to);
    const { mutate: assignBookingPetService, isPending: assigningBookingPetService } = useAssignBookingPetServiceToShift();
    const { mutate: unassignBookingPetService, isPending: unassigningBookingPetService } = useUnassignBookingPetService();

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

    const selectedShift = useMemo(
        () => (shifts as IWorkShift[]).find((s: IWorkShift) => s.shiftId === selectedShiftId) ?? null,
        [shifts, selectedShiftId]
    );

    const selectedShiftDayIndex = selectedShift ? getDayIndex(selectedShift.startTime) : null;
    const selectedShiftSlotIndex = selectedShift ? getSlotIndex(selectedShift.startTime) : null;

    /** Đồng bộ ô nhập định mức khi mở panel ca hoặc khi roleConfigs/positions thay đổi. Chỉ setState khi giá trị thực sự đổi để tránh loop (roleConfigs/positions có thể là ref mới mỗi render). */
    useEffect(() => {
        if (!selectedShiftId || positions.length === 0) {
            setRoleConfigSlots((prev) => (Object.keys(prev).length === 0 ? prev : {}));
            return;
        }
        const initial: Record<number, number> = {};
        for (const p of positions) {
            const cfg = roleConfigs.find((c: { positionId: number }) => c.positionId === p.id);
            const defaultByRole = getDefaultQuotaForPositionName(
                p.name as string,
                selectedShiftDayIndex,
                selectedShiftSlotIndex
            );
            initial[p.id] = cfg?.maxSlots ?? defaultByRole ?? 0;
        }
        setRoleConfigSlots((prev) => {
            const prevKeys = Object.keys(prev).sort();
            const nextKeys = Object.keys(initial).sort();
            if (prevKeys.length !== nextKeys.length) return initial;
            if (prevKeys.every((k) => prev[Number(k)] === initial[Number(k)])) return prev;
            return initial;
        });
    }, [selectedShiftId, roleConfigs, positions, selectedShiftDayIndex, selectedShiftSlotIndex]);

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
        if (r.status !== 'PENDING' && r.status !== 'REJECTED') return false;
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

    const handleCancelAssignment = (registrationId: number) => {
        if (!selectedShiftId) return;
        cancelAssignment(
            { shiftId: selectedShiftId, registrationId },
            {
                onSuccess: (res: any) => {
                    if (res?.success !== false) {
                        toast.success('Đã hủy xếp ca.');
                        queryClient.invalidateQueries({
                            queryKey: ['work-shift-registrations', selectedShiftId],
                        });
                    } else toast.error(res?.message ?? 'Có lỗi');
                },
                onError: (err: any) =>
                    toast.error(err?.response?.data?.message ?? err?.message ?? 'Lỗi khi hủy xếp ca'),
            }
        );
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
        const targetShift = (shifts as IWorkShift[]).find((s: IWorkShift) => s.shiftId === shiftId);
        const cellKey = targetShift ? makeCellKeyFromStartTime(targetShift.startTime) : null;

        cancelShift(shiftId, {
            onSuccess: (res: any) => {
                if (res?.success !== false) {
                    toast.success(res?.message ?? 'Đã hủy ca trống');
                    setDeleteConfirmShiftId(null);
                    queryClient.invalidateQueries({ queryKey: ['admin-shifts', from, to] });
                    if (cellKey) {
                        setRecentlyDeletedCells((prev) => (prev.includes(cellKey) ? prev : [...prev, cellKey]));
                    }
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

    /** Mốc cuối cho ô Đến: đúng 7 ngày lịch kể từ 00:00 của ngày Từ (Từ + 6 ngày, hết ngày). */
    const maxToDateTime = useMemo(() => {
        if (!from) return null;
        return dayjs(from).startOf('day').add(VIEW_DAY_COUNT - 1, 'day').endOf('day');
    }, [from]);

    /** Tiêu đề cột: thứ + ngày DD/MM theo lần lượt từ ngày Từ */
    const timetableColumnHeaders = useMemo(() => {
        if (!from) return [];
        const start = dayjs(from).startOf('day');
        return Array.from({ length: VIEW_DAY_COUNT }, (_, i) => {
            const d = start.add(i, 'day');
            return {
                key: d.format('YYYY-MM-DD'),
                weekday: vnWeekdayShort(d),
                dateStr: d.format('DD/MM'),
            };
        });
    }, [from]);

    /** Lưới thời khóa biểu: grid[slotIndex][dayOffset] = IWorkShift | null; cột = ngày liên tiếp từ Từ */
    const timetableGrid = useMemo(() => {
        const grid: (IWorkShift | null)[][] = [
            [null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null],
        ];
        const weekStart = dayjs(from).startOf('day');
        const weekEnd = weekStart.add(VIEW_DAY_COUNT, 'day');
        for (const shift of shifts) {
            const shiftDay = dayjs(shift.startTime).startOf('day');
            if (shiftDay.isBefore(weekStart) || !shiftDay.isBefore(weekEnd)) continue;
            const dayOffset = shiftDay.diff(weekStart, 'day');
            const slotIndex = getSlotIndex(shift.startTime);
            if (dayOffset >= 0 && dayOffset < VIEW_DAY_COUNT && slotIndex >= 0 && slotIndex <= 1) {
                grid[slotIndex][dayOffset] = shift;
            }
        }
        return grid;
    }, [shifts, from]);

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'contents' }}>
                <ListHeader
                title="Ca làm việc (Admin)"
                breadcrumbItems={[
                    { label: 'Trang chủ', to: '/' },
                    { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                    { label: 'Ca làm việc' },
                ]}
            />
            <Box sx={{ px: { xs: 2, sm: 3, md: 5 }, py: 3, bgcolor: 'background.default' }}>
                {/* Header & Global Actions */}
                <DashboardCard sx={{ mb: 2, p: 2.5 }}>
                    <Stack
                        direction={{ xs: 'column', lg: 'row' }}
                        spacing={3}
                        alignItems={{ xs: 'stretch', lg: 'center' }}
                        justifyContent="space-between"
                    >
                        {/* Date Navigation & Selection */}
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <IconButton
                                onClick={() => shiftDateRangeByWeek(-1)}
                                disabled={!from || !to}
                                sx={{ 
                                    bgcolor: alpha('#919EAB', 0.08),
                                    borderRadius: '12px',
                                    color: 'text.secondary', 
                                    '&:hover': { bgcolor: alpha('#919EAB', 0.16) } 
                                }}
                            >
                                <Icon icon="eva:chevron-left-fill" width={24} />
                            </IconButton>

                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mx: 0.5 }}>
                                <DateTimePicker
                                    label="Từ ngày"
                                    value={from ? dayjs(from) : null}
                                    onChange={(d) => {
                                        const nextFrom = d?.toISOString() ?? '';
                                        setFrom(nextFrom);
                                        if (!nextFrom) return;
                                        const maxT = dayjs(nextFrom).startOf('day').add(VIEW_DAY_COUNT - 1, 'day').endOf('day');
                                        if (to && dayjs(to).isAfter(maxT)) {
                                            setTo(maxT.toISOString());
                                        }
                                    }}
                                    slotProps={{
                                        textField: {
                                            size: 'small',
                                            sx: { 
                                                width: 230,
                                                '& .MuiOutlinedInput-root': { 
                                                    borderRadius: '12px',
                                                    '&:hover': { bgcolor: alpha('#919EAB', 0.04) },
                                                    '&.Mui-focused': { boxShadow: (theme) => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}` }
                                                }
                                            }
                                        } as any,
                                    }}
                                />
                                <Box sx={{ color: 'text.disabled', fontWeight: 700 }}>—</Box>
                                <DateTimePicker
                                    label="Đến ngày"
                                    value={to ? dayjs(to) : null}
                                    onChange={(d) => {
                                        if (!d) {
                                            setTo('');
                                            return;
                                        }
                                        let v = d;
                                        if (from) {
                                            const minT = dayjs(from);
                                            const maxT = dayjs(from).startOf('day').add(VIEW_DAY_COUNT - 1, 'day').endOf('day');
                                            if (v.isAfter(maxT)) v = maxT;
                                            if (v.isBefore(minT)) v = minT;
                                        }
                                        setTo(v.toISOString());
                                    }}
                                    minDateTime={from ? dayjs(from) : undefined}
                                    maxDateTime={maxToDateTime ?? undefined}
                                    slotProps={{
                                        textField: {
                                            size: 'small',
                                            sx: { 
                                                width: 230,
                                                '& .MuiOutlinedInput-root': { 
                                                    borderRadius: '12px',
                                                    '&:hover': { bgcolor: alpha('#919EAB', 0.04) },
                                                    '&.Mui-focused': { boxShadow: (theme) => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}` }
                                                }
                                            },
                                            helperText: undefined,
                                        } as any,
                                    }}
                                />
                            </Stack>

                            <IconButton
                                onClick={() => shiftDateRangeByWeek(1)}
                                disabled={!from || !to}
                                sx={{ 
                                    bgcolor: alpha('#919EAB', 0.08),
                                    borderRadius: '12px',
                                    color: 'text.secondary', 
                                    '&:hover': { bgcolor: alpha('#919EAB', 0.16) } 
                                }}
                            >
                                <Icon icon="eva:chevron-right-fill" width={24} />
                            </IconButton>
                        </Stack>
                        {/* Global Actions */}
                        {isAdminRole && (
                            <Stack direction="row" spacing={1.5}>
                                <Button
                                    variant="outlined"
                                    color="info"
                                    startIcon={<Icon icon="solar:magic-stick-3-bold-duotone" width={20} />}
                                    onClick={handleAutoGenerate}
                                    disabled={creatingBatch}
                                    sx={{ borderRadius: '10px', height: 48, px: 2.5, fontWeight: 700 }}
                                >
                                    Tạo ca tự động
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<Icon icon="solar:add-circle-bold-duotone" width={20} />}
                                    onClick={() => setShowCreate(true)}
                                    sx={{ 
                                        borderRadius: '10px', 
                                        height: 48, 
                                        px: 2.5, 
                                        fontWeight: 700,
                                        bgcolor: 'text.primary',
                                        color: 'background.paper',
                                        '&:hover': { bgcolor: 'grey.800' }
                                    }}
                                >
                                    Tạo ca trống
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<Icon icon="solar:trash-bin-trash-bold-duotone" width={20} />}
                                    onClick={() => setDeleteAllConfirmOpen(true)}
                                    sx={{ borderRadius: '10px', height: 48, px: 2.5, fontWeight: 700 }}
                                >
                                    Xóa tất cả ca
                                </Button>
                            </Stack>
                        )}
                    </Stack>

                    {/* Quick Create Form (Inside Header Card) */}
                    {isAdminRole && showCreate && (
                        <Box sx={{ mt: 3, pt: 3, borderTop: (theme) => `dashed 1px ${theme.palette.divider}` }}>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Icon icon="solar:pen-new-square-bold-duotone" width={20} />
                                Tạo ca làm việc mới
                            </Typography>
                            
                            <Grid container spacing={2} alignItems="center">
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <DateTimePicker
                                        label="Giờ bắt đầu"
                                        value={createStart ? dayjs(createStart) : null}
                                        onChange={(d) => setCreateStart(d?.toISOString() ?? '')}
                                        minDateTime={dayjs(nextWeek.start)}
                                        maxDateTime={dayjs(nextWeek.end)}
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                sx: { '& .MuiOutlinedInput-root': { borderRadius: '10px' } }
                                            } as any,
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <DateTimePicker
                                        label="Giờ kết thúc"
                                        value={createEnd ? dayjs(createEnd) : null}
                                        onChange={(d) => setCreateEnd(d?.toISOString() ?? '')}
                                        minDateTime={dayjs(nextWeek.start)}
                                        maxDateTime={dayjs(nextWeek.end)}
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                sx: { '& .MuiOutlinedInput-root': { borderRadius: '10px' } }
                                            } as any,
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Stack direction="row" spacing={1}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            onClick={handleCreate}
                                            disabled={creating}
                                            sx={{ borderRadius: '10px', height: 44, fontWeight: 700 }}
                                        >
                                            {creating ? 'Đang tạo...' : 'Xác nhận tạo'}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="inherit"
                                            onClick={() => setShowCreate(false)}
                                            sx={{ borderRadius: '10px', height: 44, px: 3 }}
                                        >
                                            Hủy
                                        </Button>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </DashboardCard>

                {/* Timetable Section */}
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: 'text.primary' }}>
                    Ca làm trong tuần
                </Typography>

                <DashboardCard sx={{ overflow: 'hidden', border: (theme) => `1px solid ${theme.palette.divider}` }}>
                    <Box sx={{ minWidth: 1000 }}>
                        {/* Header Row */}
                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: '100px repeat(7, 1fr)',
                            bgcolor: 'background.neutral',
                            borderBottom: (theme) => `1px solid ${theme.palette.divider}`
                        }}>
                            <Box sx={{ p: 2, textAlign: 'center', fontWeight: 700, borderRight: (theme) => `1px solid ${theme.palette.divider}` }}>
                                Buổi
                            </Box>
                            {timetableColumnHeaders.map((col) => (
                                <Box key={col.key} sx={{ p: 2, textAlign: 'center', borderRight: (theme) => `1px solid ${theme.palette.divider}`, '&:last-of-type': { borderRight: 0 } }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{col.weekday}</Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{col.dateStr}</Typography>
                                </Box>
                            ))}
                        </Box>

                        {/* Body Rows */}
                        {ROW_LABELS.map((rowLabel, slotIndex) => (
                            <Box key={rowLabel} sx={{ 
                                display: 'grid', 
                                gridTemplateColumns: '100px repeat(7, 1fr)',
                                borderBottom: slotIndex === 0 ? (theme) => `1px solid ${theme.palette.divider}` : 0
                            }}>
                                {/* Label Column */}
                                <Box sx={{ 
                                    p: 2, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    bgcolor: 'background.neutral',
                                    fontWeight: 700,
                                    borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                                    color: 'text.secondary',
                                    fontSize: '0.875rem'
                                }}>
                                    {rowLabel}
                                </Box>

                                {/* Day Columns */}
                                {timetableColumnHeaders.map((col, dayIndex) => {
                                    const cellDate = col.key;
                                    const cellKey = `${cellDate}-${slotIndex}`;
                                    const shift = timetableGrid[slotIndex]?.[dayIndex];

                                    if (isLoading) {
                                        return (
                                            <Box key={cellKey} sx={{ p: 1, height: 125, borderRight: (theme) => `1px solid ${theme.palette.divider}`, '&:last-of-type': { borderRight: 0 } }}>
                                                <Stack sx={{ height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Box sx={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid', borderColor: 'primary.main', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                                                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                                                </Stack>
                                            </Box>
                                        );
                                    }

                                    if (!shift) {
                                        const tz = '+07:00';
                                        const startTimeDefault = slotIndex === 0 ? `${cellDate}T08:00:00${tz}` : `${cellDate}T13:00:00${tz}`;
                                        const endTimeDefault = slotIndex === 0 ? `${cellDate}T12:00:00${tz}` : `${cellDate}T17:00:00${tz}`;
                                        const isRecentlyDeleted = recentlyDeletedCells.includes(cellKey);

                                        return (
                                            <Box key={cellKey} sx={{ p: 1, height: 125, borderRight: (theme) => `1px solid ${theme.palette.divider}`, '&:last-of-type': { borderRight: 0 } }}>
                                                <Button
                                                    fullWidth
                                                    onClick={() => {
                                                        createShift(
                                                            { startTime: startTimeDefault, endTime: endTimeDefault },
                                                            {
                                                                onSuccess: (res: any) => {
                                                                    if (res?.success) {
                                                                        const newShift = res?.data;
                                                                        if (newShift) {
                                                                            queryClient.setQueryData(
                                                                                ['admin-shifts', from, to],
                                                                                (prev: unknown) =>
                                                                                    Array.isArray(prev) ? [...prev, newShift] : [newShift]
                                                                            );
                                                                        }
                                                                        toast.success(
                                                                            isRecentlyDeleted
                                                                                ? 'Khôi phục ca thành công'
                                                                                : res.message ?? 'Tạo ca trống thành công'
                                                                        );
                                                                        if (isRecentlyDeleted) {
                                                                            setRecentlyDeletedCells((prev) => prev.filter((k) => k !== cellKey));
                                                                        }
                                                                        queryClient.invalidateQueries({ queryKey: ['admin-shifts', from, to] });
                                                                    } else {
                                                                        toast.error(res?.message ?? 'Không tạo được ca');
                                                                    }
                                                                },
                                                                onError: (err: any) => {
                                                                    toast.error(
                                                                        err?.response?.data?.message ?? err?.message ?? 'Tạo ca thất bại'
                                                                    );
                                                                },
                                                            }
                                                        );
                                                    }}
                                                    sx={{ 
                                                        height: '100%', 
                                                        borderRadius: '12px', 
                                                        border: '2px dashed', 
                                                        borderColor: 'divider',
                                                        bgcolor: alpha('#919EAB', 0.04),
                                                        transition: 'all 0.2s',
                                                        '&:hover': { bgcolor: alpha('#919EAB', 0.08), borderColor: 'text.disabled' }
                                                    }}
                                                >
                                                    <Icon icon="solar:add-circle-linear" width={24} style={{ color: 'var(--palette-text-disabled)' }} />
                                                </Button>
                                            </Box>
                                        );
                                    }

                                    const isOpen = shift.status === 'OPEN';
                                    const statusColor = isOpen ? 'error' : 'success';
                                    const statusLabel = isOpen ? 'Đang tuyển' : 'Đã khóa';
                                    
                                    return (
                                        <Box key={shift.shiftId} sx={{ p: 1, height: 125, borderRight: (theme) => `1px solid ${theme.palette.divider}`, '&:last-of-type': { borderRight: 0 } }}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 1.5,
                                                    height: '100%',
                                                    borderRadius: '12px',
                                                    position: 'relative',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'space-between',
                                                    bgcolor: 'background.paper',
                                                    border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    '&:hover': {
                                                        boxShadow: (theme) => theme.shadows?.[12] ?? '0 12px 24px -4px rgba(145, 158, 171, 0.12)',
                                                        transform: 'translateY(-2px)',
                                                        borderColor: (theme) => theme.palette[statusColor].main
                                                    }
                                                }}
                                            >
                                                {/* Card Actions (Hover only) */}
                                                {isOpen && (
                                                    <Stack 
                                                        direction="row" 
                                                        spacing={0.5} 
                                                        sx={{ 
                                                            position: 'absolute', 
                                                            top: 8, 
                                                            right: 8, 
                                                            opacity: 0, 
                                                            transition: 'opacity 0.2s',
                                                            '.MuiPaper-root:hover &': { opacity: 1 }
                                                        }}
                                                    >
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={(e) => { e.stopPropagation(); openEditDialog(shift); }}
                                                            sx={{ bgcolor: 'background.paper', boxShadow: (theme) => theme.shadows?.[8] }}
                                                        >
                                                            <Icon icon="solar:pen-bold" width={14} />
                                                        </IconButton>
                                                        <IconButton 
                                                            size="small" 
                                                            color="error"
                                                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmShiftId(shift.shiftId); }}
                                                            sx={{ bgcolor: 'background.paper', boxShadow: (theme) => theme.shadows?.[8] }}
                                                        >
                                                            <Icon icon="solar:trash-bin-trash-bold" width={14} />
                                                        </IconButton>
                                                    </Stack>
                                                )}

                                                <Box>
                                                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                                                        <Icon icon="solar:clock-circle-bold-duotone" width={16} style={{ color: 'var(--palette-text-disabled)' }} />
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                                            {formatTimeRange(shift.startTime, shift.endTime)}
                                                        </Typography>
                                                    </Stack>

                                                    <Chip 
                                                        label={statusLabel} 
                                                        size="small" 
                                                        color={statusColor}
                                                        variant="outlined"
                                                        sx={{ 
                                                            height: 20, 
                                                            fontSize: '10px', 
                                                            fontWeight: 800,
                                                            borderRadius: '6px'
                                                        }} 
                                                    />
                                                </Box>

                                                <Stack spacing={1} sx={{ mt: 'auto' }}>
                                                    <Button
                                                        fullWidth
                                                        size="small"
                                                        variant="text"
                                                        onClick={() => setSelectedShiftId(shift.shiftId)}
                                                        endIcon={<Icon icon="eva:arrow-forward-fill" />}
                                                        sx={{ 
                                                            justifyContent: 'space-between', 
                                                            px: 0, 
                                                            fontSize: '11px', 
                                                            fontWeight: 700,
                                                            '&:hover': { bgcolor: 'transparent', color: 'primary.main' }
                                                        }}
                                                    >
                                                        Xem chi tiết
                                                    </Button>
                                                </Stack>
                                            </Paper>
                                        </Box>
                                    );
                                })}
                            </Box>
                        ))}
                    </Box>
                </DashboardCard>
            </Box>

            <Box sx={{ mt: 2 }}>
                <Grid container spacing={3}>
                    {/* Booking Service In Week */}
                    <Grid size={{ xs: 12, lg: 6 }}>
                        <DashboardCard sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    Danh sách booking dịch vụ trong tuần
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                    Điều kiện: đặt online — đã cọc và đã xác nhận; đặt tại quầy (Walk-in) hoặc loại trống — chỉ cần đã check-in (không bắt cọc).
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                                    &quot;Trong tuần&quot; = theo <strong>actualCheckInDate</strong> (ngày check-in thực tế trên từng booking_pet_service, ghi khi xác nhận check-in); nếu chưa có thì fallback ngày đặt / dự kiến. Ngày này nằm trong khoảng <strong>Từ — Đến</strong>.
                                </Typography>
                            </Box>

                            <Box sx={{ overflowX: 'auto', flex: 1 }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                                    <thead style={{ backgroundColor: alpha('#919EAB', 0.08) }}>
                                        <tr>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700, borderRadius: '8px 0 0 8px' }}>Booking</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700 }}>Dịch vụ</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700 }}>Trạng thái xếp ca</th>
                                            <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 700, borderRadius: '0 8px 8px 0' }}>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {((bookingPetServicePool?.inWeek ?? []) as IWorkShiftBookingPetServiceItem[]).length === 0 ? (
                                            <tr>
                                                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'text.secondary', fontSize: '14px' }}>Không có booking trong tuần này.</td>
                                            </tr>
                                        ) : (
                                            ((bookingPetServicePool?.inWeek ?? []) as IWorkShiftBookingPetServiceItem[]).map((item) => (
                                                <tr key={item.bookingPetServiceId} style={{ borderBottom: `1px dashed ${alpha('#919EAB', 0.2)}` }}>
                                                    <td style={{ padding: '12px' }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.bookingCode}</Typography>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{item.customerName || '-'}</Typography>
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.serviceName || '-'}</Typography>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{item.petName || '-'}</Typography>
                                                    </td>
                                                    <td style={{ padding: '12px' }}>{renderBookingPetServiceShiftStatusChip(item)}</td>
                                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                            <Tooltip title="Thêm vào ca đã chọn">
                                                                <IconButton 
                                                                    size="small" 
                                                                    color="primary"
                                                                    disabled={!selectedShiftId || assigningBookingPetService}
                                                                    onClick={() => {
                                                                        assignBookingPetService(
                                                                            { shiftId: selectedShiftId!, bookingPetServiceId: item.bookingPetServiceId },
                                                                            { onSuccess: (res: any) => res?.success !== false ? toast.success('Đã thêm vào ca.') : toast.error(res?.message ?? 'Lỗi.') }
                                                                        );
                                                                    }}
                                                                >
                                                                    <Icon icon="solar:add-circle-bold-duotone" width={20} />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Gỡ khỏi ca">
                                                                <IconButton 
                                                                    size="small" 
                                                                    color="error"
                                                                    disabled={unassigningBookingPetService}
                                                                    onClick={() => {
                                                                        unassignBookingPetService(item.bookingPetServiceId, {
                                                                            onSuccess: (res: any) => res?.success !== false ? toast.success('Đã gỡ khỏi ca.') : toast.error(res?.message ?? 'Lỗi.')
                                                                        });
                                                                    }}
                                                                >
                                                                    <Icon icon="solar:minus-circle-bold-duotone" width={20} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Stack>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </Box>
                        </DashboardCard>
                    </Grid>

                    {/* Waiting List */}
                    <Grid size={{ xs: 12, lg: 6 }}>
                        <DashboardCard sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    Danh sách đợi xếp lịch (Tuần khác)
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Đủ điều kiện nhưng <strong>actualCheckInDate</strong> (hoặc ngày fallback) <strong>ngoài</strong> khoảng Từ — Đến.
                                </Typography>
                            </Box>

                            <Box sx={{ overflowX: 'auto', flex: 1 }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                                    <thead style={{ backgroundColor: alpha('#919EAB', 0.08) }}>
                                        <tr>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700, borderRadius: '8px 0 0 8px' }}>Booking</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700 }}>Khách / Thú cưng</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700 }}>Dịch vụ</th>
                                            <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 700, borderRadius: '0 8px 8px 0' }}>Ngày (check-in DV)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {((bookingPetServicePool?.waiting ?? []) as IWorkShiftBookingPetServiceItem[]).length === 0 ? (
                                            <tr>
                                                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'text.secondary', fontSize: '14px' }}>Không có booking chờ xếp lịch.</td>
                                            </tr>
                                        ) : (
                                            ((bookingPetServicePool?.waiting ?? []) as IWorkShiftBookingPetServiceItem[]).map((item) => (
                                                <tr key={item.bookingPetServiceId} style={{ borderBottom: `1px dashed ${alpha('#919EAB', 0.2)}` }}>
                                                    <td style={{ padding: '12px' }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.bookingCode}</Typography>
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        <Typography variant="body2">{item.customerName || '-'} / {item.petName || '-'}</Typography>
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        <Typography variant="body2">{item.serviceName || '-'}</Typography>
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{item.bookingDateFrom ? dayjs(item.bookingDateFrom).format('DD/MM/YYYY') : '-'}</Typography>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </Box>
                        </DashboardCard>
                    </Grid>
                </Grid>
            </Box>

            <Box sx={{ px: { xs: 2, sm: 3, lg: 4 } }}>
                {/* Dialog xem đăng ký ca – popup giữa trang */}
                <Dialog
                    open={selectedShiftId !== null}
                    onClose={() => setSelectedShiftId(null)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: 3,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: '0 18px 48px rgba(15, 23, 42, 0.18)',
                        },
                    }}
                >
                    <DialogTitle
                        sx={{
                            pb: 0.75,
                            pt: 2,
                            fontWeight: 800,
                            fontSize: '1.1rem',
                            position: 'relative',
                            pr: 6,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'rgba(248,250,252,0.8)',
                        }}
                    >
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: -0.2 }}>
                                Chi tiết đăng ký ca {selectedShiftId != null ? `#${selectedShiftId}` : ''}
                            </Typography>
                            <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', mt: 0.25 }}>
                                Quản lý định mức theo vai trò và duyệt đăng ký nhân viên.
                            </Typography>
                        </Box>
                        <IconButton aria-label="Đóng" onClick={() => setSelectedShiftId(null)} sx={{ position: 'absolute', right: 8, top: 8 }} size="small">
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers sx={{ px: 2.5, py: 2 }}>
                        {selectedShiftId && (() => {
                            const rawList = (registrations ?? []) as IWorkShiftRegistration[];
                            const registrationList = [...rawList].sort((a, b) => {
                                const order = (s: string) => {
                                    if (s === 'PENDING') return 0;
                                    if (s === 'PENDING_LEAVE') return 1;
                                    return 2;
                                };
                                return order(a.status) - order(b.status);
                            });
                            const isInitialRegLoading = regLoading && registrationList.length === 0;
                            return (
                                <>
                                {/* Section: Định mức theo vai trò */}
                                <Typography className="text-base font-semibold text-gray-800 mb-1.5">
                                    Định mức theo vai trò
                                </Typography>
                                <Box sx={{ mb: 2.5 }}>
                                    {positions.length === 0 ? (
                                        <Typography className="text-sm text-gray-500">
                                            Chưa có chức vụ.
                                        </Typography>
                                    ) : (
                                        <Stack spacing={1}>
                                            {positions.map((p: { id: number; name: string }) => {
                                                const maxSlots = roleConfigSlots[p.id] ?? 0;
                                                const participatingCount = displayParticipatingCountByRoleName[p.name] ?? 0;
                                                const isOverCapacity = maxSlots > 0 && participatingCount > maxSlots;
                                                const isFull = maxSlots > 0 && participatingCount >= maxSlots;
                                                
                                                const badgeLabel = isOverCapacity 
                                                    ? `${participatingCount}/${maxSlots} - Vượt định mức`
                                                    : isFull ? 'Đủ' : `${participatingCount}/${maxSlots || 0}`;
                                                
                                                const badgeClass = isOverCapacity
                                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                                    : isFull
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-amber-100 text-amber-700';
                                                return (
                                                    <div
                                                        key={p.id}
                                                        className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-3 shadow-sm"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="text-base font-semibold text-gray-900">{p.name}</span>
                                                            <span className="text-sm text-gray-500">
                                                                Định mức tối đa:&nbsp;
                                                                <span className="font-semibold text-gray-800">
                                                                    {maxSlots} người
                                                                </span>
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {isEditingQuota ? (
                                                                <TextField
                                                                    type="number"
                                                                    size="small"
                                                                    inputProps={{ min: 0, max: 99, style: { fontSize: '0.9rem' } }}
                                                                    value={roleConfigSlots[p.id] ?? 0}
                                                                    onChange={(e) => {
                                                                        const v = parseInt(e.target.value, 10);
                                                                        setRoleConfigSlots((prev) => ({
                                                                            ...prev,
                                                                            [p.id]: isNaN(v) ? 0 : Math.max(0, v),
                                                                        }));
                                                                    }}
                                                                    sx={{ width: 72, '& .MuiInputBase-input': { fontSize: '0.9rem' } }}
                                                                />
                                                            ) : (
                                                                <div className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
                                                                    {maxSlots} người
                                                                </div>
                                                            )}

                                                            {maxSlots > 0 && (
                                                                <span
                                                                    className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium ${badgeClass}`}
                                                                >
                                                                    {badgeLabel}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </Stack>
                                    )}
                                    <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" sx={{ mt: 2 }} useFlexGap>
                                        {isEditingQuota ? (
                                            <>
                                                <Button
                                                    size="medium"
                                                    variant="contained"
                                                    onClick={handleSaveRoleConfigs}
                                                    disabled={savingRoleConfigs || positions.length === 0}
                                                    sx={{ fontSize: '0.9rem', borderRadius: 1.5, textTransform: 'none' }}
                                                >
                                                    Lưu định mức
                                                </Button>
                                                <Button
                                                    size="medium"
                                                    variant="outlined"
                                                    onClick={() => setIsEditingQuota(false)}
                                                    sx={{
                                                        fontSize: '0.9rem',
                                                        borderRadius: 1.5,
                                                        textTransform: 'none',
                                                        borderColor: 'rgba(148,163,184,0.6)',
                                                        color: 'text.primary',
                                                    }}
                                                >
                                                    Hủy
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                size="medium"
                                                variant="outlined"
                                                onClick={() => setIsEditingQuota(true)}
                                                disabled={positions.length === 0 || selectedShiftStatus === 'ASSIGNED'}
                                                sx={{
                                                    fontSize: '0.9rem',
                                                    borderRadius: 1.5,
                                                    textTransform: 'none',
                                                    borderColor: 'rgba(148,163,184,0.6)',
                                                    color: 'text.primary',
                                                    bgcolor: 'white',
                                                    '&:hover': { bgcolor: 'rgba(248,250,252,1)' },
                                                }}
                                            >
                                                Sửa định mức
                                            </Button>
                                        )}
                                        {selectedShiftStatus === 'OPEN' && (
                                            <Tooltip title={!canFinalizeShift ? 'Số lượng người trong ca chưa đủ.' : ''}>
                                                <span>
                                                    <Button
                                                        size="medium"
                                                    variant="contained"
                                                    color="inherit"
                                                        disabled={finalizing || !canFinalizeShift}
                                                        sx={{
                                                        fontSize: '0.9rem',
                                                        borderRadius: 999,
                                                        textTransform: 'none',
                                                        px: 2.75,
                                                        py: 0.9,
                                                        bgcolor: 'rgba(79,70,229,1)', // indigo-600
                                                        color: '#ffffff',
                                                        boxShadow: '0 10px 25px rgba(15,23,42,0.20)',
                                                        '&:hover': {
                                                            bgcolor: 'rgba(67,56,202,1)', // indigo-700
                                                            boxShadow: '0 14px 30px rgba(15,23,42,0.25)',
                                                        },
                                                        '&.Mui-disabled': {
                                                            bgcolor: 'rgba(229,231,235,1)', // gray-200
                                                            color: 'rgba(148,163,184,1)', // slate-400
                                                            boxShadow: 'none',
                                                        },
                                                        }}
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
                                                        Khóa ca
                                                    </Button>
                                                </span>
                                            </Tooltip>
                                        )}
                                    </Stack>
                                    {selectedShiftStatus === 'OPEN' && !canFinalizeShift && (
                                        <Box className="mt-2 flex items-center gap-2 rounded-md border-l-4 border-amber-500 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                                            <span className="leading-snug">
                                                Số lượng người trong ca chưa đủ. Thêm người hoặc điều chỉnh lại định mức trước khi khóa ca.
                                            </span>
                                        </Box>
                                    )}
                                </Box>

                                <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, mt: 1 }} />

                                {/* Section: Danh sách nhân viên */}
                                <Typography className="text-base font-semibold text-gray-800 mb-1.5">
                                    Nhân viên trong ca
                                </Typography>
                                {isInitialRegLoading ? (
                                    <Typography className="text-sm text-gray-500">
                                        Đang tải...
                                    </Typography>
                                ) : registrationList.length === 0 ? (
                                    <Typography className="text-sm text-gray-500">
                                        Chưa có đăng ký.
                                    </Typography>
                                ) : (
                                    <Stack spacing={1.5}>
                                        {registrationList.map((r) => {
                                            const { label: sLabel, badgeClass: sClass } = getRegistrationStatusUI(r);
                                            const initials = getInitials(r.staffFullName);

                                            return (
                                                <div
                                                    key={r.registrationId}
                                                    className="flex items-center justify-between gap-4 rounded-md border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                                                >
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
                                                            {initials}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-base font-semibold text-gray-900 truncate">
                                                                {r.staffFullName}
                                                            </div>
                                                            <div className="mt-1 flex flex-col items-start gap-1 text-sm">
                                                                <span
                                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium border ${
                                                                        r.workType === 'FULL_TIME'
                                                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                                            : 'bg-purple-50 text-purple-700 border-purple-200'
                                                                    }`}
                                                                >
                                                                    {r.workType === 'FULL_TIME' ? 'Full-time' : 'Part-time'}
                                                                </span>
                                                                {r.roleAtRegistrationName && (
                                                                    <span className="text-sm text-gray-500">
                                                                        {r.roleAtRegistrationName}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-auto">
                                                        <div className="flex items-center gap-3">
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${sClass}`}
                                                            >
                                                                {sLabel}
                                                            </span>

                                                            {(r.status === 'PENDING' || r.status === 'APPROVED' || r.status === 'REJECTED') && selectedShiftStatus === 'OPEN' && (
                                                                <div className="flex items-center gap-2">
                                                                    <Tooltip title={r.status !== 'APPROVED' && !canApproveRegistration(r) ? 'Đã đủ định mức' : ''}>
                                                                        <span>
                                                                            <Button
                                                                                size="small"
                                                                                variant={r.status === 'APPROVED' ? 'contained' : 'outlined'}
                                                                                color="success"
                                                                                onClick={() => handleApprove(r.registrationId)}
                                                                                disabled={r.status !== 'APPROVED' && !canApproveRegistration(r)}
                                                                                sx={{
                                                                                    minHeight: 32,
                                                                                    height: 32,
                                                                                    minWidth: 64,
                                                                                    px: 2,
                                                                                    py: 1,
                                                                                    fontSize: '0.8125rem',
                                                                                    fontWeight: 500,
                                                                                    textTransform: 'none',
                                                                                    borderRadius: '8px',
                                                                                }}
                                                                            >
                                                                                Duyệt làm
                                                                            </Button>
                                                                        </span>
                                                                    </Tooltip>
                                                                    <Button
                                                                        size="small"
                                                                        variant={r.status === 'REJECTED' ? 'contained' : 'outlined'}
                                                                        color="error"
                                                                        onClick={() => handleCancelAssignment(r.registrationId)}
                                                                        sx={{
                                                                            minHeight: 32,
                                                                            height: 32,
                                                                            minWidth: 64,
                                                                            px: 2,
                                                                            py: 1,
                                                                            fontSize: '0.8125rem',
                                                                            fontWeight: 500,
                                                                            textTransform: 'none',
                                                                            borderRadius: '8px',
                                                                        }}
                                                                    >
                                                                        Từ chối
                                                                    </Button>
                                                                </div>
                                                            )}

                                                            {r.status === 'PENDING_LEAVE' && selectedShiftStatus === 'OPEN' && (
                                                                <>
                                                                <Button
                                                                    size="small"
                                                                    variant={r.leaveDecision === 'APPROVED_LEAVE' ? 'contained' : 'outlined'}
                                                                    color="success"
                                                                    disabled={settingOnLeave || rejectingLeave}
                                                                    sx={{
                                                                        minHeight: 32,
                                                                        height: 32,
                                                                        minWidth: 64,
                                                                        px: 2,
                                                                        py: 1,
                                                                        fontSize: '0.8125rem',
                                                                        fontWeight: 500,
                                                                        textTransform: 'none',
                                                                        borderRadius: '8px',
                                                                    }}
                                                                    onClick={() => {
                                                                        if (!selectedShiftId) return;
                                                                        const regId = r.registrationId;
                                                                        setOnLeave(
                                                                            { shiftId: selectedShiftId, registrationId: regId },
                                                                            {
                                                                                onSuccess: (res: any) => {
                                                                                    if (res?.success !== false) {
                                                                                        toast.success('Đã duyệt nghỉ');
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
                                                                                    } else toast.error(res?.message ?? 'Có lỗi');
                                                                                },
                                                                                onError: (err: any) =>
                                                                                    toast.error(
                                                                                        err?.response?.data?.message ?? err?.message ?? 'Lỗi'
                                                                                    ),
                                                                            }
                                                                        );
                                                                    }}
                                                                >
                                                                    Duyệt nghỉ
                                                                </Button>
                                                                <Button
                                                                    size="small"
                                                                    variant={r.leaveDecision === 'REJECTED_LEAVE' ? 'contained' : 'outlined'}
                                                                    color="error"
                                                                    disabled={settingOnLeave || rejectingLeave}
                                                                    sx={{
                                                                        minHeight: 32,
                                                                        height: 32,
                                                                        minWidth: 64,
                                                                        px: 2,
                                                                        py: 1,
                                                                        fontSize: '0.8125rem',
                                                                        fontWeight: 500,
                                                                        textTransform: 'none',
                                                                        borderRadius: '8px',
                                                                    }}
                                                                    onClick={() => {
                                                                        if (!selectedShiftId) return;
                                                                        rejectLeave(
                                                                            { shiftId: selectedShiftId, registrationId: r.registrationId },
                                                                            {
                                                                                onSuccess: (res: any) => {
                                                                                    if (res?.success) {
                                                                                        toast.success('Đã từ chối duyệt nghỉ');
                                                                                        queryClient.invalidateQueries({
                                                                                            queryKey: ['work-shift-registrations', selectedShiftId],
                                                                                        });
                                                                                    } else toast.error(res?.message ?? 'Có lỗi');
                                                                                },
                                                                                onError: (err: any) =>
                                                                                    toast.error(
                                                                                        err?.response?.data?.message ?? err?.message ?? 'Lỗi'
                                                                                    ),
                                                                            }
                                                                        );
                                                                    }}
                                                                >
                                                                    Từ chối
                                                                </Button>
                                                            </>
                                                            )}
                                                        </div>


                                                        {(r.status === 'PENDING_LEAVE' || r.status === 'ON_LEAVE') && r.leaveReason && (
                                                            <p className="text-sm text-gray-500 italic text-right max-w-[250px] truncate">
                                                                Lý do xin nghỉ: {r.leaveReason}
                                                            </p>
                                                        )}
                                                    </div>

                                                </div>
                                            );
                                        })}
                                        {positions.map((p: { id: number; name: string }) => {
                                            const maxSlots = roleConfigSlots[p.id] ?? 0;
                                            const occupied = occupiedCountByRoleName[p.name] ?? 0;
                                            const remaining = Math.max(0, maxSlots - occupied);
                                            if (remaining === 0) return null;
                                            return (
                                                <div
                                                    key={`empty-${p.id}`}
                                                    className="flex items-center gap-3 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-500 justify-center"
                                                >
                                                    <UserPlus className="h-4 w-4 text-slate-400" />
                                                    <span>
                                                        [Trống] {remaining} suất {p.name} — Part-time có thể đăng ký bù.
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </Stack>
                                )}
                            </>
                            );
                        })()}
                    </DialogContent>
                </Dialog>

                {/* Dialog chỉnh sửa ca trống */}
                <Dialog
                    open={!!editShift}
                    onClose={() => setEditShift(null)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: 4,
                            border: '1px solid',
                            borderColor: 'grey.100',
                            boxShadow: '0 25px 60px rgba(15,23,42,0.45)',
                            backgroundColor: 'white',
                            overflow: 'hidden',
                        },
                    }}
                    slotProps={{
                        backdrop: {
                            sx: {
                                backdropFilter: 'blur(6px)',
                                backgroundColor: 'rgba(15,23,42,0.4)',
                            },
                        },
                    }}
                >
                    <DialogTitle sx={{ p: 0, borderBottom: 'none' }}>
                        <Box className="flex items-start gap-4 px-6 pt-6 pb-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                <CalendarClock className="h-6 w-6" />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Cập nhật ca trống #{editShift?.shiftId}
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Chỉnh sửa giờ trong tuần tiếp theo
                                </p>
                            </div>
                        </Box>
                    </DialogTitle>
                    <DialogContent sx={{ px: 6, pb: 2, pt: 0 }}>
                        <Box className="flex flex-col space-y-5 pt-2">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Giờ bắt đầu
                                </label>
                                <DateTimePicker
                                    value={editStart ? dayjs(editStart) : null}
                                    onChange={(d) => setEditStart(d?.toISOString() ?? '')}
                                    minDateTime={dayjs(nextWeek.start)}
                                    maxDateTime={dayjs(nextWeek.end)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            placeholder: 'Chọn giờ bắt đầu',
                                            sx: {
                                                '& .MuiOutlinedInput-root': {
                                                    backgroundColor: '#f9fafb',
                                                    borderRadius: '0.75rem',
                                                    transition: 'all 0.2s ease',
                                                    '& fieldset': {
                                                        borderColor: '#e5e7eb',
                                                    },
                                                    '&:hover fieldset': {
                                                        borderColor: '#bfdbfe',
                                                    },
                                                    '&.Mui-focused': {
                                                        backgroundColor: '#ffffff',
                                                        boxShadow: '0 0 0 2px rgba(37,99,235,0.15)',
                                                        '& fieldset': {
                                                            borderColor: '#2563eb',
                                                        },
                                                    },
                                                },
                                                '& .MuiInputBase-input': {
                                                    fontSize: '0.875rem',
                                                    paddingTop: '10px',
                                                    paddingBottom: '10px',
                                                },
                                            },
                                        },
                                        openPickerButton: {
                                            sx: {
                                                color: 'rgb(148 163 184)',
                                            },
                                        },
                                    }}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Giờ kết thúc
                                </label>
                                <DateTimePicker
                                    value={editEnd ? dayjs(editEnd) : null}
                                    onChange={(d) => setEditEnd(d?.toISOString() ?? '')}
                                    minDateTime={dayjs(nextWeek.start)}
                                    maxDateTime={dayjs(nextWeek.end)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            placeholder: 'Chọn giờ kết thúc',
                                            sx: {
                                                '& .MuiOutlinedInput-root': {
                                                    backgroundColor: '#f9fafb',
                                                    borderRadius: '0.75rem',
                                                    transition: 'all 0.2s ease',
                                                    '& fieldset': {
                                                        borderColor: '#e5e7eb',
                                                    },
                                                    '&:hover fieldset': {
                                                        borderColor: '#bfdbfe',
                                                    },
                                                    '&.Mui-focused': {
                                                        backgroundColor: '#ffffff',
                                                        boxShadow: '0 0 0 2px rgba(37,99,235,0.15)',
                                                        '& fieldset': {
                                                            borderColor: '#2563eb',
                                                        },
                                                    },
                                                },
                                                '& .MuiInputBase-input': {
                                                    fontSize: '0.875rem',
                                                    paddingTop: '10px',
                                                    paddingBottom: '10px',
                                                },
                                            },
                                        },
                                        openPickerButton: {
                                            sx: {
                                                color: 'rgb(148 163 184)',
                                            },
                                        },
                                    }}
                                />
                            </div>
                        </Box>
                    </DialogContent>
                    <DialogActions
                        sx={{
                            px: 6,
                            py: 4,
                            mt: 1,
                            borderTop: '1px solid',
                            borderColor: 'rgba(243,244,246,1)',
                        }}
                        className="flex justify-end gap-3"
                    >
                        <Button
                            onClick={() => setEditShift(null)}
                            variant="outlined"
                            sx={{
                                px: 2.5,
                                py: 0.75,
                                fontSize: '0.875rem',
                                textTransform: 'none',
                                borderRadius: 2,
                                borderColor: 'rgba(209,213,219,1)',
                                color: 'rgba(75,85,99,1)',
                                backgroundColor: 'white',
                                '&:hover': {
                                    backgroundColor: 'rgba(249,250,251,1)',
                                    borderColor: 'rgba(156,163,175,1)',
                                    color: 'rgba(17,24,39,1)',
                                },
                            }}
                        >
                            HỦY
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleUpdateShift}
                            disabled={updating}
                            sx={{
                                px: 2.75,
                                py: 0.75,
                                fontSize: '0.875rem',
                                textTransform: 'none',
                                borderRadius: 2,
                                boxShadow: 'none',
                                backgroundColor: 'rgba(248,250,252,1)', // slate-50
                                color: 'rgba(37,99,235,1)', // blue-600
                                border: '1px solid rgba(226,232,240,1)', // slate-200
                                '&:hover': {
                                    backgroundColor: 'rgba(241,245,249,1)', // slate-100
                                    borderColor: 'rgba(203,213,225,1)', // slate-300
                                },
                                '&.Mui-disabled': {
                                    backgroundColor: 'rgba(248,250,252,1)',
                                    color: 'rgba(148,163,184,1)', // slate-400
                                    borderColor: 'rgba(226,232,240,1)',
                                    boxShadow: 'none',
                                },
                            }}
                        >
                            CẬP NHẬT
                        </Button>
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
        </Box>
        </LocalizationProvider>
    );
};
