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
    useAssignedBookingPetServicesForShift,
    useAssignBookingPetServiceToShift, 
    useUnassignBookingPetService 
} from '../hooks/useWorkShift';
import { toast } from 'react-toastify';
import type {
    IWorkShift,
    IWorkShiftRegistration,
    IOpenShiftRequest,
    IAvailableShiftForStaff,
    IWorkShiftBookingPetServiceItem,
    IWorkShiftAssignedBookingPetServiceItem,
} from '../../../api/workShift.api';
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
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import { AlertTriangle, CalendarClock, UserPlus } from 'lucide-react';
import { getAssignOptionsForBookingPetService, type IShiftRoleConfigItemRequest } from '../../../api/workShift.api';
import DashboardCard from '../../../components/dashboard/DashboardCard';
import { Icon } from '@iconify/react';

/** Số cột ngày trên lưới (= số ngày tối đa trong khoảng Từ–Đến). */
const VIEW_DAY_COUNT = 7;

/** Đã xếp nhân viên vào ca (booking_pet_service_staff) — khác với chỉ có khung giờ từ đặt lịch. */
function isWorkShiftStaffAssigned(item: IWorkShiftBookingPetServiceItem): boolean {
    return !!(item.assignedStaffNames && String(item.assignedStaffNames).trim());
}

/** Cột trạng thái: check-in / lịch đặt / đã xếp NV vào ca (xanh chỉ khi đã có NV). */
function renderBookingPetServiceShiftStatusChip(item: IWorkShiftBookingPetServiceItem) {
    const hasSlot = !!(item.scheduledStartTime && item.scheduledEndTime);
    const staffOk = isWorkShiftStaffAssigned(item);
    const slotLabel =
        hasSlot
            ? `${dayjs(item.scheduledStartTime).format('HH:mm')} - ${dayjs(item.scheduledEndTime).format('HH:mm')}`
            : '';

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
        if (hasSlot && staffOk) {
            return (
                <Tooltip title="Đã xếp nhân viên vào ca (chờ khách check-in tại lễ tân nếu cần)">
                    <Chip
                        size="small"
                        variant="outlined"
                        color="success"
                        label={slotLabel}
                        sx={{ fontWeight: 700, fontSize: '11px' }}
                    />
                </Tooltip>
            );
        }
        if (hasSlot && !staffOk) {
            return (
                <Tooltip title="Có khung giờ (từ đặt lịch / hệ thống) — chưa xếp nhân viên vào ca làm">
                    <Chip
                        size="small"
                        variant="outlined"
                        color="warning"
                        label={`${slotLabel} · chưa xếp NV`}
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
    if (hasSlot && staffOk) {
        return (
            <Tooltip title="Đã xếp nhân viên vào ca">
                <Chip
                    size="small"
                    variant="outlined"
                    color="success"
                    label={slotLabel}
                    sx={{ fontWeight: 700, fontSize: '11px' }}
                />
            </Tooltip>
        );
    }
    if (hasSlot && !staffOk) {
        return (
            <Tooltip title="Khung giờ từ đặt lịch — bấm + để xếp nhân viên vào ca">
                <Chip
                    size="small"
                    variant="outlined"
                    color="warning"
                    label={`${slotLabel} · chưa xếp NV`}
                    sx={{ fontWeight: 700, fontSize: '11px' }}
                />
            </Tooltip>
        );
    }
    return <Chip size="small" variant="outlined" color="default" label="Chưa xếp" sx={{ fontWeight: 700, fontSize: '11px' }} />;
}

/** Nhãn hiển thị loại đặt chỗ (Booking.bookingType) */
function formatBookingTypeLabel(t?: string | null): string {
    if (!t) return '—';
    const map: Record<string, string> = {
        ONLINE: 'Online',
        WALK_IN: 'Tại quầy',
        PHONE: 'Điện thoại',
        APP: 'App',
        ON_WEBSITE: 'Website',
        SPA_CARE: 'Spa care',
        HOTEL_DOG: 'Khách sạn chó',
        HOTEL_CAT: 'Khách sạn mèo',
    };
    return map[t] ?? t;
}

function formatBookingPetServiceStatusLabel(s?: string | null): string {
    if (s == null || String(s).trim() === '') return '—';
    return String(s).trim();
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

/** Ngày đặt / ngày xếp tuần để ghép ca sáng–chiều */
function resolveBookingDayForAssign(item: IWorkShiftBookingPetServiceItem): string | null {
    return item.bookingPlacedDate || item.bookingDateFrom || null;
}

/** Ca sáng (slot 0) & chiều (slot 1) trong ngày — theo danh sách ca admin */
function partitionShiftsBySlotForDay(allShifts: IWorkShift[], dayIso: string | null | undefined) {
    const empty = { morning: null as IWorkShift | null, afternoon: null as IWorkShift | null };
    if (!dayIso) return empty;
    const d = dayjs(dayIso).format('YYYY-MM-DD');
    const list = allShifts.filter((s) => dayjs(s.startTime).format('YYYY-MM-DD') === d);
    let morning: IWorkShift | null = null;
    let afternoon: IWorkShift | null = null;
    for (const s of list) {
        const si = getSlotIndex(s.startTime);
        if (si === 0 && !morning) morning = s;
        if (si === 1 && !afternoon) afternoon = s;
    }
    return { morning, afternoon };
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
    /** Ca đang chọn để xếp booking (giữ sau khi đóng popup — không gộp với trạng thái mở modal). */
    const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
    const [shiftDetailDialogOpen, setShiftDetailDialogOpen] = useState(false);
    const [editShift, setEditShift] = useState<{ shiftId: number; startTime: string; endTime: string } | null>(null);
    const [editStart, setEditStart] = useState<string>('');
    const [editEnd, setEditEnd] = useState<string>('');
    const [deleteConfirmShiftId, setDeleteConfirmShiftId] = useState<number | null>(null);
    const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
    /** Định mức theo vai trò: positionId -> maxSlots (chỉ dùng khi selectedShiftId đang mở) */
    const [roleConfigSlots, setRoleConfigSlots] = useState<Record<number, number>>({});
    /** Chế độ chỉnh sửa định mức: false = read-only, true = cho phép sửa và hiện "Lưu định mức" */
    const [isEditingQuota, setIsEditingQuota] = useState(false);
    /** Xác nhận khi đặt định mức về 0 để loại vai trò khỏi ca */
    const [pendingRemoveRole, setPendingRemoveRole] = useState<{ positionId: number; positionName: string } | null>(
        null
    );
    const [recentlyDeletedCells, setRecentlyDeletedCells] = useState<string[]>([]);
    /** Popup xếp BPS: chọn buổi → chọn NV (theo kỹ năng từ API) */
    const [assignBpsDialog, setAssignBpsDialog] = useState<{
        item: IWorkShiftBookingPetServiceItem;
        step: 'slot' | 'staff';
        shiftId?: number;
    } | null>(null);
    const [assignStaffSelection, setAssignStaffSelection] = useState<number[]>([]);

    const queryClient = useQueryClient();
    const { data: shifts = [], isLoading } = useShiftsForAdmin(from, to);

    /** Dịch khoảng Từ–Đến ±7 ngày (xem tuần trước / tuần sau). */
    const shiftDateRangeByWeek = (deltaWeeks: number) => {
        if (!from || !to) return;
        setFrom(dayjs(from).add(deltaWeeks * 7, 'day').toISOString());
        setTo(dayjs(to).add(deltaWeeks * 7, 'day').toISOString());
    };
    const { data: registrations = [], isLoading: regLoading } = useRegistrationsForShift(selectedShiftId);
    const { data: shiftAssignedBps = [], isLoading: shiftAssignedBpsLoading } =
        useAssignedBookingPetServicesForShift(shiftDetailDialogOpen ? selectedShiftId : null);
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

    const {
        data: assignOptionsPayload,
        isLoading: assignOptionsLoading,
        isError: assignOptionsIsError,
        error: assignOptionsErrObj,
    } = useQuery({
        queryKey: ['bps-assign-options', assignBpsDialog?.item?.bookingPetServiceId, assignBpsDialog?.shiftId],
        queryFn: async () => {
            const res = await getAssignOptionsForBookingPetService(
                assignBpsDialog!.item!.bookingPetServiceId,
                assignBpsDialog!.shiftId!
            );
            if (!res.success || res.data == null) {
                throw new Error(res.message || 'Không tải được danh sách nhân viên');
            }
            return res.data;
        },
        enabled: !!assignBpsDialog && assignBpsDialog.step === 'staff' && assignBpsDialog.shiftId != null,
    });

    const assignDayPartition = useMemo(() => {
        if (!assignBpsDialog) return { morning: null as IWorkShift | null, afternoon: null as IWorkShift | null };
        const day = resolveBookingDayForAssign(assignBpsDialog.item);
        return partitionShiftsBySlotForDay(shifts as IWorkShift[], day);
    }, [assignBpsDialog, shifts]);

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
        setPendingRemoveRole(null);
    }, [selectedShiftId]);

    /** Đổi tuần / xóa ca: nếu ca đã chọn không còn trong danh sách thì bỏ chọn */
    useEffect(() => {
        if (selectedShiftId == null) return;
        const exists = (shifts as IWorkShift[]).some((s: IWorkShift) => s.shiftId === selectedShiftId);
        if (!exists) {
            setSelectedShiftId(null);
            setShiftDetailDialogOpen(false);
        }
    }, [shifts, selectedShiftId]);

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

    const submitRoleConfigs = (slots: Record<number, number>) => {
        if (!selectedShiftId) return;
        const configs: IShiftRoleConfigItemRequest[] = Object.entries(slots)
            .filter(([, s]) => s >= 1)
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

    const handleSaveRoleConfigs = () => {
        submitRoleConfigs(roleConfigSlots);
    };

    /** Đặt định mức về 0: nếu trước đó ≥1 thì hỏi xác nhận loại vai trò khỏi ca (không cập nhật state cho đến khi xác nhận). */
    const handleRoleQuotaInputChange = (p: { id: number; name: string }, rawValue: string) => {
        const prev = roleConfigSlots[p.id] ?? 0;
        if (rawValue === '') {
            return;
        }
        const v = parseInt(rawValue, 10);
        if (Number.isNaN(v)) return;
        const clamped = Math.min(99, Math.max(0, v));
        if (clamped === 0 && prev >= 1) {
            setPendingRemoveRole({ positionId: p.id, positionName: p.name });
            return;
        }
        setRoleConfigSlots((prevState) => ({
            ...prevState,
            [p.id]: clamped,
        }));
    };

    const handleConfirmRemoveRoleFromShift = () => {
        if (!pendingRemoveRole) return;
        const next = { ...roleConfigSlots, [pendingRemoveRole.positionId]: 0 };
        setPendingRemoveRole(null);
        setRoleConfigSlots(next);
        submitRoleConfigs(next);
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

    const toggleAssignStaff = (staffId: number) => {
        setAssignStaffSelection((prev) =>
            prev.includes(staffId) ? prev.filter((x) => x !== staffId) : [...prev, staffId]
        );
    };

    const handleConfirmAssignBpsToShift = () => {
        const data = assignOptionsPayload;
        if (!assignBpsDialog || !data) return;
        const required = data.requiredStaffCount;
        const participating = data.participatingStaff ?? [];
        const shortage = data.shortage;
        const sel = assignStaffSelection;
        let ok = false;
        if (shortage) {
            ok = sel.length === participating.length && participating.length > 0;
        } else {
            ok = sel.length === required;
        }
        if (!ok) {
            toast.error(
                shortage
                    ? `Cần chọn đủ ${participating.length} nhân viên trong ca (thiếu so với định mức dịch vụ).`
                    : `Cần chọn đúng ${required} nhân viên.`
            );
            return;
        }
        assignBookingPetService(
            {
                shiftId: assignBpsDialog.shiftId!,
                bookingPetServiceId: assignBpsDialog.item.bookingPetServiceId,
                staffIds: sel,
            },
            {
                onSuccess: (res: any) => {
                    if (res?.success !== false) {
                        toast.success('Đã thêm vào ca.');
                        setAssignBpsDialog(null);
                        setAssignStaffSelection([]);
                    } else toast.error(res?.message ?? 'Lỗi');
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.message ?? err?.message ?? 'Xếp ca thất bại');
                },
            }
        );
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
                                                onClick={() => setSelectedShiftId(shift.shiftId)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        setSelectedShiftId(shift.shiftId);
                                                    }
                                                }}
                                                sx={{
                                                    p: 1.5,
                                                    height: '100%',
                                                    borderRadius: '12px',
                                                    position: 'relative',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'space-between',
                                                    bgcolor: 'background.paper',
                                                    cursor: 'pointer',
                                                    outline: 'none',
                                                    border: (theme) =>
                                                        selectedShiftId === shift.shiftId
                                                            ? `2px solid ${theme.palette.primary.main}`
                                                            : `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    '&:hover': {
                                                        boxShadow: (theme) => theme.shadows?.[12] ?? '0 12px 24px -4px rgba(145, 158, 171, 0.12)',
                                                        transform: 'translateY(-2px)',
                                                        borderColor: (theme) =>
                                                            selectedShiftId === shift.shiftId
                                                                ? theme.palette.primary.main
                                                                : theme.palette[statusColor].main,
                                                    },
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
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedShiftId(shift.shiftId);
                                                            setShiftDetailDialogOpen(true);
                                                        }}
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
                                    Điều kiện hiển thị: đặt online — <strong>thanh toán cọc thành công</strong>; đặt tại quầy (Walk-in) hoặc loại trống — booking chưa hủy / hoàn thành (không bắt cọc).
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                                    &quot;Trong tuần&quot; = theo <strong>actualCheckInDate</strong> trên dịch vụ → <strong>estimatedCheckInDate</strong> → ngày booking; nằm trong khoảng <strong>Từ — Đến</strong>. Nút thêm vào ca chỉ áp dụng khi dịch vụ (booking_pet_service) đang <strong>PENDING</strong> hoặc <strong>IN_PROGRESS</strong> (không bắt check-in booking).
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'primary.main', display: 'block', mt: 0.75, fontWeight: 600 }}>
                                    Bấm <strong>+</strong>: hệ thống lấy <strong>ngày đặt</strong> của booking để ghép ca sáng/chiều trên lưới, sau đó chọn nhân viên có kỹ năng phù hợp dịch vụ (ca <strong>Đang tuyển</strong> hoặc <strong>Đã khóa</strong>).
                                </Typography>
                            </Box>

                            <Box sx={{ overflowX: 'auto', flex: 1 }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                                    <thead style={{ backgroundColor: alpha('#919EAB', 0.08) }}>
                                        <tr>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700, borderRadius: '8px 0 0 8px' }}>Booking</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700 }}>Dịch vụ</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700 }}>Loại đặt</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700 }}>Ngày đặt</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700 }}>Trạng thái DV</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700 }}>Trạng thái xếp ca</th>
                                            <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 700, borderRadius: '0 8px 8px 0' }}>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {((bookingPetServicePool?.inWeek ?? []) as IWorkShiftBookingPetServiceItem[]).length === 0 ? (
                                            <tr>
                                                <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'text.secondary', fontSize: '14px' }}>Không có booking trong tuần này.</td>
                                            </tr>
                                        ) : (
                                            ((bookingPetServicePool?.inWeek ?? []) as IWorkShiftBookingPetServiceItem[]).map((item) => {
                                                const isAssignedToShift = isWorkShiftStaffAssigned(item);
                                                return (
                                                <tr key={item.bookingPetServiceId} style={{ borderBottom: `1px dashed ${alpha('#919EAB', 0.2)}` }}>
                                                    <td style={{ padding: '12px' }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.bookingCode}</Typography>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{item.customerName || '-'}</Typography>
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.serviceName || '-'}</Typography>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{item.petName || '-'}</Typography>
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                                            {formatBookingTypeLabel(item.bookingType)}
                                                        </Typography>
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                                                            {item.bookingPlacedDate ? dayjs(item.bookingPlacedDate).format('DD/MM/YYYY') : '—'}
                                                        </Typography>
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                                            {formatBookingPetServiceStatusLabel(item.bookingPetServiceStatus)}
                                                        </Typography>
                                                    </td>
                                                    <td style={{ padding: '12px' }}>{renderBookingPetServiceShiftStatusChip(item)}</td>
                                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                            {!isAssignedToShift && (
                                                            <Tooltip title={
                                                                item.canAssignToShift === false
                                                                    ? 'Chỉ thêm được khi dịch vụ (booking_pet_service) đang PENDING hoặc IN_PROGRESS'
                                                                    : 'Xếp vào ca (chọn buổi sáng/chiều theo ngày đặt, rồi chọn nhân viên)'
                                                            }>
                                                                <IconButton 
                                                                    size="small" 
                                                                    color="primary"
                                                                    disabled={assigningBookingPetService}
                                                                    onClick={() => {
                                                                        if (item.canAssignToShift === false) {
                                                                            toast.warning(
                                                                                'Đơn dịch vụ đã bị hủy hoặc hoàn thành trước đó nên không thể thêm vào ca làm được.'
                                                                            );
                                                                            return;
                                                                        }
                                                                        const day = resolveBookingDayForAssign(item);
                                                                        if (!day) {
                                                                            toast.error('Không có ngày đặt để ghép ca. Kiểm tra ngày đặt trên booking.');
                                                                            return;
                                                                        }
                                                                        setAssignStaffSelection([]);
                                                                        setAssignBpsDialog({ item, step: 'slot' });
                                                                    }}
                                                                >
                                                                    <Icon icon="solar:add-circle-bold-duotone" width={20} />
                                                                </IconButton>
                                                            </Tooltip>
                                                            )}
                                                            <Tooltip title={isAssignedToShift ? 'Gỡ khỏi ca' : 'Chưa xếp ca — không có gì để gỡ'}>
                                                                <span>
                                                                <IconButton 
                                                                    size="small" 
                                                                    color="error"
                                                                    disabled={unassigningBookingPetService || !isAssignedToShift}
                                                                    onClick={() => {
                                                                        unassignBookingPetService(item.bookingPetServiceId, {
                                                                            onSuccess: (res: any) => res?.success !== false ? toast.success('Đã gỡ khỏi ca.') : toast.error(res?.message ?? 'Lỗi.')
                                                                        });
                                                                    }}
                                                                >
                                                                    <Icon icon="solar:minus-circle-bold-duotone" width={20} />
                                                                </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                        </Stack>
                                                    </td>
                                                </tr>
                                                );
                                            })
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
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                    Cùng điều kiện lọc với bảng bên; ngày xếp tuần (actual → dự kiến → booking) <strong>ngoài</strong> khoảng Từ — Đến.
                                </Typography>
                            </Box>

                            <Box sx={{ overflowX: 'auto', flex: 1 }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                                    <thead style={{ backgroundColor: alpha('#919EAB', 0.08) }}>
                                        <tr>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700, borderRadius: '8px 0 0 8px' }}>Booking</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700 }}>Khách / Thú cưng</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700 }}>Dịch vụ</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700 }}>Loại đặt</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700 }}>Ngày đặt</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700 }}>Trạng thái DV</th>
                                            <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 700, borderRadius: '0 8px 8px 0' }}>Ngày (check-in DV)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {((bookingPetServicePool?.waiting ?? []) as IWorkShiftBookingPetServiceItem[]).length === 0 ? (
                                            <tr>
                                                <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'text.secondary', fontSize: '14px' }}>Không có booking chờ xếp lịch.</td>
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
                                                    <td style={{ padding: '12px' }}>
                                                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                                            {formatBookingTypeLabel(item.bookingType)}
                                                        </Typography>
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                                                            {item.bookingPlacedDate ? dayjs(item.bookingPlacedDate).format('DD/MM/YYYY') : '—'}
                                                        </Typography>
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                                            {formatBookingPetServiceStatusLabel(item.bookingPetServiceStatus)}
                                                        </Typography>
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

            {/* Xếp BPS: chọn buổi (theo ngày đặt) → NV có kỹ năng khớp dịch vụ */}
            <Dialog
                open={assignBpsDialog !== null}
                onClose={() => {
                    if (assigningBookingPetService) return;
                    setAssignBpsDialog(null);
                    setAssignStaffSelection([]);
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Xếp dịch vụ vào ca làm</DialogTitle>
                <DialogContent dividers>
                    {assignBpsDialog && assignBpsDialog.step === 'slot' && (
                        <Stack spacing={2}>
                            <Typography variant="body2" color="text.secondary">
                                Booking <strong>{assignBpsDialog.item.bookingCode}</strong> — {assignBpsDialog.item.serviceName}
                            </Typography>
                            <Typography variant="body2">
                                Ngày đặt:{' '}
                                <strong>
                                    {(() => {
                                        const ad = resolveBookingDayForAssign(assignBpsDialog.item);
                                        return ad ? dayjs(ad).format('DD/MM/YYYY') : '—';
                                    })()}
                                </strong>
                                . Chọn buổi ca trùng ngày này (theo lưới ca Sáng / Chiều):
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                <Button
                                    variant="contained"
                                    disabled={!assignDayPartition.morning}
                                    fullWidth
                                    onClick={() => {
                                        const s = assignDayPartition.morning;
                                        if (!s) return;
                                        setAssignStaffSelection([]);
                                        setAssignBpsDialog({ ...assignBpsDialog, step: 'staff', shiftId: s.shiftId });
                                    }}
                                >
                                    Ca sáng (08:00–12:00)
                                    {!assignDayPartition.morning ? ' — chưa có ca' : ''}
                                </Button>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    disabled={!assignDayPartition.afternoon}
                                    fullWidth
                                    onClick={() => {
                                        const s = assignDayPartition.afternoon;
                                        if (!s) return;
                                        setAssignStaffSelection([]);
                                        setAssignBpsDialog({ ...assignBpsDialog, step: 'staff', shiftId: s.shiftId });
                                    }}
                                >
                                    Ca chiều (13:00–17:00)
                                    {!assignDayPartition.afternoon ? ' — chưa có ca' : ''}
                                </Button>
                            </Stack>
                            {!assignDayPartition.morning && !assignDayPartition.afternoon && (
                                <Typography color="error" variant="body2">
                                    Không tìm thấy ca sáng/chiều cho ngày này trong khoảng Từ–Đến. Hãy tạo ca hoặc mở rộng khoảng ngày.
                                </Typography>
                            )}
                        </Stack>
                    )}
                    {assignBpsDialog && assignBpsDialog.step === 'staff' && (
                        <Stack spacing={2}>
                            <Button
                                size="small"
                                variant="text"
                                onClick={() => {
                                    setAssignBpsDialog({ item: assignBpsDialog.item, step: 'slot' });
                                    setAssignStaffSelection([]);
                                }}
                            >
                                ← Quay lại chọn buổi
                            </Button>
                            {assignOptionsLoading && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                    <CircularProgress size={32} />
                                </Box>
                            )}
                            {assignOptionsIsError && (
                                <Typography color="error">
                                    {getErrorMessage(assignOptionsErrObj as any, 'Không tải được danh sách nhân viên')}
                                </Typography>
                            )}
                            {assignOptionsPayload && !assignOptionsLoading && (
                                <>
                                    <Typography variant="body2" color="text.secondary">
                                        Ca #{assignOptionsPayload.shiftId} · Cần <strong>{assignOptionsPayload.requiredStaffCount}</strong> nhân viên
                                        {assignOptionsPayload.shortage && ' (thiếu người trong ca — chọn hết danh sách dưới)'}
                                    </Typography>
                                    <Stack spacing={0.5}>
                                        {(assignOptionsPayload.participatingStaff ?? []).map((p) => (
                                            <FormControlLabel
                                                key={p.staffId}
                                                control={
                                                    <Checkbox
                                                        checked={assignStaffSelection.includes(p.staffId)}
                                                        onChange={() => toggleAssignStaff(p.staffId)}
                                                    />
                                                }
                                                label={`${p.fullName}${p.positionName ? ` — ${p.positionName}` : ''}`}
                                            />
                                        ))}
                                    </Stack>
                                    {(assignOptionsPayload.participatingStaff ?? []).length === 0 && (
                                        <Typography color="warning.main" variant="body2">
                                            Không có nhân viên trong ca có kỹ năng phù hợp với dịch vụ này.
                                        </Typography>
                                    )}
                                </>
                            )}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setAssignBpsDialog(null);
                            setAssignStaffSelection([]);
                        }}
                        disabled={assigningBookingPetService}
                    >
                        Hủy
                    </Button>
                    {assignBpsDialog?.step === 'staff' && (
                        <Button
                            variant="contained"
                            onClick={handleConfirmAssignBpsToShift}
                            disabled={
                                assigningBookingPetService ||
                                assignOptionsLoading ||
                                !assignOptionsPayload ||
                                assignOptionsIsError
                            }
                        >
                            Xác nhận xếp ca
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            <Box sx={{ px: { xs: 2, sm: 3, lg: 4 } }}>
                {/* Dialog xem đăng ký ca – popup giữa trang */}
                <Dialog
                    open={shiftDetailDialogOpen}
                    onClose={() => setShiftDetailDialogOpen(false)}
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
                        <IconButton aria-label="Đóng" onClick={() => setShiftDetailDialogOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }} size="small">
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
                            const assignedRows = (shiftAssignedBps ?? []) as IWorkShiftAssignedBookingPetServiceItem[];
                            return (
                                <>
                                {/* Booking dịch vụ đã xếp lịch trùng khung ca */}
                                <Typography className="text-base font-semibold text-gray-800 mb-1.5">
                                    Booking dịch vụ trong ca
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                                    Dịch vụ đã gán khung giờ trùng với ca làm (và nhân viên phụ trách xử lý).
                                </Typography>
                                <Box
                                    sx={{
                                        mb: 3,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        bgcolor: 'background.paper',
                                    }}
                                >
                                    {shiftAssignedBpsLoading ? (
                                        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                                            <CircularProgress size={26} />
                                        </Box>
                                    ) : assignedRows.length === 0 ? (
                                        <Typography sx={{ p: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
                                            Chưa có booking nào được xếp lịch trùng khung giờ ca này.
                                        </Typography>
                                    ) : (
                                        <Box sx={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                                                <thead style={{ backgroundColor: 'rgba(145, 158, 171, 0.08)' }}>
                                                    <tr>
                                                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 700 }}>
                                                            Booking
                                                        </th>
                                                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 700 }}>
                                                            Dịch vụ
                                                        </th>
                                                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 700 }}>
                                                            Khung giờ
                                                        </th>
                                                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 700 }}>
                                                            NV phụ trách
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {assignedRows.map((row) => (
                                                        <tr
                                                            key={row.bookingPetServiceId}
                                                            style={{ borderTop: '1px dashed rgba(145,158,171,0.25)' }}
                                                        >
                                                            <td style={{ padding: '10px 12px', fontSize: '0.85rem' }}>
                                                                <span className="font-semibold text-gray-900">{row.bookingCode ?? '—'}</span>
                                                                {row.customerName ? (
                                                                    <span className="block text-gray-500 text-xs">{row.customerName}</span>
                                                                ) : null}
                                                            </td>
                                                            <td style={{ padding: '10px 12px', fontSize: '0.85rem' }}>
                                                                <span>{row.serviceName ?? '—'}</span>
                                                                {row.petName ? (
                                                                    <span className="block text-gray-500 text-xs">{row.petName}</span>
                                                                ) : null}
                                                            </td>
                                                            <td style={{ padding: '10px 12px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                                                {row.scheduledStartTime && row.scheduledEndTime
                                                                    ? `${dayjs(row.scheduledStartTime).format('HH:mm')} – ${dayjs(row.scheduledEndTime).format('HH:mm')}`
                                                                    : '—'}
                                                            </td>
                                                            <td style={{ padding: '10px 12px', fontSize: '0.85rem' }}>
                                                                {row.assignedStaffNames?.trim() ? row.assignedStaffNames : '—'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </Box>
                                    )}
                                </Box>

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
                                                                    onChange={(e) =>
                                                                        handleRoleQuotaInputChange(p, e.target.value)
                                                                    }
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

                {/* Xác nhận loại vai trò khỏi ca khi đặt định mức về 0 */}
                <Dialog
                    open={pendingRemoveRole !== null}
                    onClose={() => !savingRoleConfigs && setPendingRemoveRole(null)}
                >
                    <DialogTitle>Loại vai trò khỏi ca làm?</DialogTitle>
                    <DialogContent>
                        Bạn có chắc muốn loại vai trò <strong>{pendingRemoveRole?.positionName}</strong> khỏi ca này?
                        Định mức sẽ được lưu và ca sẽ không còn yêu cầu số người cho vai trò này.
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setPendingRemoveRole(null)} disabled={savingRoleConfigs}>
                            Hủy
                        </Button>
                        <Button
                            color="primary"
                            variant="contained"
                            onClick={handleConfirmRemoveRoleFromShift}
                            disabled={savingRoleConfigs}
                        >
                            Xác nhận
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
                        <Button color="error" variant="contained" onClick={() => deleteAllShifts(undefined, { onSuccess: () => { toast.success('Đã xóa tất cả ca làm.'); setDeleteAllConfirmOpen(false); setSelectedShiftId(null); setShiftDetailDialogOpen(false); }, onError: (err: any) => toast.error(err?.response?.data?.message ?? err?.message ?? 'Xóa thất bại') })} disabled={deletingAll}>
                            Xóa tất cả
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
        </LocalizationProvider>
    );
};
