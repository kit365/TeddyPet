import { useState, useEffect, useMemo } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { ListHeader } from '../../../components/ui/ListHeader';
import { prefixAdmin } from '../../../constants/routes';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateOpenShift, useCreateOpenShiftsBatch, useUpdateOpenShift, useCancelOpenShift, useDeleteAllWorkShifts, useShiftsForAdmin, useRegistrationsForShift, useShiftRoleConfigs, useSetShiftRoleConfigs, useApproveRegistration, useSetRegistrationOnLeave, useRejectLeaveRequest, useFinalizeShiftApprovals, useCancelAdminRegistration, useAssignableBookingPetServices, useAssignBookingPetServiceToShift, useUnassignBookingPetService } from '../hooks/useWorkShift';
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
import { AlertTriangle, CalendarClock, Pencil, Trash2, UserPlus } from 'lucide-react';
import type { IShiftRoleConfigItemRequest } from '../../../api/workShift.api';
const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
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
            <div className="px-4 sm:px-6 lg:px-8 mt-3 mb-6 max-w-full overflow-hidden">
                {/* Top Bar: 1 hàng — Từ, Đến, 3 nút (gọn để cùng nằm một hàng, không tràn) */}
                <div className="flex flex-row w-full flex-wrap items-end justify-between gap-3 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-end gap-3 flex-nowrap min-w-0">
                        <div className="min-w-[140px] sm:min-w-[180px]">
                            <DateTimePicker
                                label="Từ"
                                value={from ? dayjs(from) : null}
                                onChange={(d) => setFrom(d?.toISOString() ?? '')}
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        InputProps: { className: 'h-9 rounded-md bg-white' },
                                        className: 'w-full',
                                    } as any,
                                }}
                            />
                        </div>
                        <div className="min-w-[140px] sm:min-w-[180px]">
                            <DateTimePicker
                                label="Đến"
                                value={to ? dayjs(to) : null}
                                onChange={(d) => setTo(d?.toISOString() ?? '')}
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        InputProps: { className: 'h-9 rounded-md bg-white' },
                                        className: 'w-full',
                                    } as any,
                                }}
                            />
                        </div>
                    </div>

                    {isAdminRole && (
                        <div className="flex items-center gap-2 flex-nowrap shrink-0">
                            <button
                                type="button"
                                onClick={handleAutoGenerate}
                                disabled={creatingBatch}
                                className="h-9 shrink-0 inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-slate-100 disabled:opacity-60 disabled:pointer-events-none whitespace-nowrap"
                            >
                                Tạo ca tự động
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCreate(true)}
                                className="h-9 shrink-0 inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
                            >
                                Tạo ca trống
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeleteAllConfirmOpen(true)}
                                className="h-9 shrink-0 inline-flex items-center justify-center rounded-md border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 whitespace-nowrap"
                            >
                                Xóa tất cả ca
                            </button>
                        </div>
                    )}
                </div>

                {isAdminRole && showCreate && (
                    <div className="mt-4 max-w-[560px] rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-3">
                            <div className="text-base font-semibold text-slate-900">Tạo ca trống (thủ công)</div>
                            <div className="text-sm text-slate-500">Chỉ tạo ca trống cho tuần tiếp theo</div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <DateTimePicker
                                label="Giờ bắt đầu"
                                value={createStart ? dayjs(createStart) : null}
                                onChange={(d) => setCreateStart(d?.toISOString() ?? '')}
                                minDateTime={dayjs(nextWeek.start)}
                                maxDateTime={dayjs(nextWeek.end)}
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        InputProps: { className: 'h-10 rounded-md bg-white' },
                                        className: 'w-full',
                                    } as any,
                                }}
                            />
                            <DateTimePicker
                                label="Giờ kết thúc"
                                value={createEnd ? dayjs(createEnd) : null}
                                onChange={(d) => setCreateEnd(d?.toISOString() ?? '')}
                                minDateTime={dayjs(nextWeek.start)}
                                maxDateTime={dayjs(nextWeek.end)}
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        InputProps: { className: 'h-10 rounded-md bg-white' },
                                        className: 'w-full',
                                    } as any,
                                }}
                            />
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleCreate}
                                disabled={creating}
                                className="h-10 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:pointer-events-none"
                            >
                                Tạo ca
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCreate(false)}
                                className="h-10 inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Thời khóa biểu ca làm */}
            <div className="px-4 sm:px-6 lg:px-8 mb-6 max-w-full">
                <div className="mb-2">
                    <div className="text-base font-semibold text-gray-900">Ca làm trong tuần</div>
                </div>

                <div className="mt-4 w-full rounded-md border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <table className="w-full table-fixed border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="w-24 p-3 text-sm font-semibold text-gray-700 text-center border-r border-gray-200">
                                    Buổi
                                </th>
                                {DAY_LABELS.map((label) => (
                                    <th
                                        key={label}
                                        className="p-3 text-sm font-semibold text-gray-700 text-center border-r border-gray-200 last:border-r-0"
                                    >
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {ROW_LABELS.map((rowLabel, slotIndex) => (
                                <tr key={rowLabel} className="border-b border-gray-200 last:border-b-0">
                                    <td className="w-24 p-3 text-sm font-semibold text-gray-700 text-center bg-gray-50/50 border-r border-gray-200 align-middle">
                                        {rowLabel}
                                    </td>
                                    {DAY_LABELS.map((_, dayIndex) => {
                                    const weekStart = dayjs(from).startOf('day');
                                    const cellDate = weekStart.add(dayIndex, 'day').format('YYYY-MM-DD');
                                    const cellKey = `${cellDate}-${slotIndex}`;
                                    const shift = timetableGrid[slotIndex]?.[dayIndex];

                                        if (isLoading) {
                                            return (
                                                <td
                                                    key={dayIndex}
                                                    className="h-[152px] w-auto min-w-0 border-r border-gray-200 text-sm text-gray-500 p-[5px] text-center align-top last:border-r-0"
                                                >
                                                    <div className="h-full w-full flex items-center justify-center">
                                                        Đang tải...
                                                    </div>
                                                </td>
                                            );
                                        }

                                        // Không có ca trong ô này → placeholder rất nhẹ
                                        if (!shift) {
                                        const tz = '+07:00';
                                        const startTimeDefault =
                                            slotIndex === 0
                                                ? `${cellDate}T08:00:00${tz}`
                                                : `${cellDate}T13:00:00${tz}`;
                                        const endTimeDefault =
                                            slotIndex === 0
                                                ? `${cellDate}T12:00:00${tz}`
                                                : `${cellDate}T17:00:00${tz}`;

                                        const isRecentlyDeleted = recentlyDeletedCells.includes(cellKey);

                                        return (
                                            <td
                                                key={dayIndex}
                                                className="h-[152px] w-auto min-w-0 border-r border-gray-200 p-[5px] align-top last:border-r-0"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (!isRecentlyDeleted) return;
                                                        createShift(
                                                            { startTime: startTimeDefault, endTime: endTimeDefault },
                                                            {
                                                                onSuccess: (res: any) => {
                                                                    if (res?.success) {
                                                                        toast.success(res?.message ?? 'Đã tạo lại ca mặc định');
                                                                        setRecentlyDeletedCells((prev) =>
                                                                            prev.filter((k) => k !== cellKey)
                                                                        );
                                                                        queryClient.invalidateQueries({
                                                                            queryKey: ['admin-shifts', from, to],
                                                                        });
                                                                    } else toast.error(res?.message ?? 'Có lỗi');
                                                                },
                                                                onError: (err: any) => {
                                                                    toast.error(
                                                                        getErrorMessage(err, 'Tạo lại ca mặc định thất bại')
                                                                    );
                                                                },
                                                            }
                                                        );
                                                    }}
                                                    className="h-full w-full flex items-center justify-center rounded-none"
                                                >
                                                    <div className="h-full w-full rounded-md border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center text-sm text-gray-500 hover:bg-gray-50 min-h-0">
                                                        <span className="text-2xl font-semibold">+</span>
                                                    </div>
                                                </button>
                                            </td>
                                        );
                                    }

                                    const isOpen = shift.status === 'OPEN';
                                    const statusLabel = isOpen ? 'Trống' : 'Đã khóa';
                                    const borderClasses = isOpen
                                        ? 'border border-red-100/80 border-l-2 border-l-red-400 hover:border-red-200'
                                        : 'border border-gray-100/80 border-l-2 border-l-gray-400 hover:border-gray-200';
                                    const dotClass = isOpen ? 'bg-red-500' : 'bg-gray-500';
                                    const textClass = isOpen ? 'text-red-600' : 'text-gray-600';

                                    return (
                                        <td
                                            key={dayIndex}
                                            className="h-[152px] w-auto min-w-0 border-r border-gray-200 p-[5px] align-top last:border-r-0"
                                        >
                                            <div
                                                className={[
                                                    'group relative flex h-full w-full min-w-0 flex-col overflow-hidden rounded-md bg-white shadow-sm transition-all hover:shadow-md px-1 pt-0.5 pb-0.5',
                                                    borderClasses,
                                                ].join(' ')}
                                            >
                                                {/* Nút Sửa trên, Xóa dưới - góc trên phải */}
                                                {isOpen && (
                                                    <div className="absolute top-1 right-1 z-10 flex flex-col items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditDialog(shift)}
                                                            title="Sửa ca"
                                                            className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                                        >
                                                            <Pencil className="h-1.5 w-1.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteConfirmShiftId(shift.shiftId)}
                                                            title="Xóa ca"
                                                            className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border border-slate-200 bg-white text-slate-400 shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                                        >
                                                            <Trash2 className="h-1.5 w-1.5" />
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Nội dung: khung giờ + trạng thái */}
                                                <div className="flex min-h-0 flex-1 flex-col items-stretch justify-between gap-1.5 overflow-hidden text-left">
                                                    <div className="flex shrink-0 flex-col gap-0 min-w-0">
                                                        {/* Khung giờ - to hơn, đậm hơn, cách cạnh trên ~10px */}
                                                        <div className="flex shrink-0 items-center justify-start overflow-visible min-w-0 mt-2">
                                                            <span className="text-sm tracking-tight font-extrabold text-gray-900 whitespace-nowrap leading-tight">
                                                                {formatTimeRange(shift.startTime, shift.endTime)}
                                                            </span>
                                                        </div>
                                                        {/* Chấm + Trống/Đã khóa - hạ xuống một chút */}
                                                        <div className={`flex shrink-0 items-center justify-start gap-0.5 text-[9px] font-medium leading-none mt-2 ${textClass}`}>
                                                            <span className={`h-1 w-1 shrink-0 rounded-full ${dotClass}`} />
                                                            <span className="truncate">{statusLabel}</span>
                                                        </div>
                                                    </div>

                                                    {/* Chi tiết - cách đáy card khoảng 10px */}
                                                    <div className="flex w-full shrink-0 justify-center mt-2 mb-2.5">
                                                        <button
                                                            type="button"
                                                            title="Xem chi tiết"
                                                            onClick={() => setSelectedShiftId(shift.shiftId)}
                                                            className="flex shrink-0 items-center justify-center py-0 text-[11px] font-medium leading-none text-blue-600 transition-colors hover:text-blue-700 bg-transparent border-0 cursor-pointer"
                                                        >
                                                            <span className="truncate">Xem chi tiết -&gt;</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    );
                                })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 mb-6 max-w-full">
                <div className="mb-2">
                    <div className="text-base font-semibold text-gray-900">Danh sách booking dịch vụ để xếp ca</div>
                    <div className="text-sm text-gray-500">
                        Điều kiện: booking đã thanh toán cọc và trạng thái đã xác nhận.
                    </div>
                </div>

                <div className="mt-3 rounded-md border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <table className="w-full table-fixed border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Booking</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Khách / Thú cưng</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Dịch vụ</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Ngày booking</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Đang xếp ca</th>
                                <th className="p-3 text-right text-sm font-semibold text-gray-700">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {((bookingPetServicePool?.inWeek ?? []) as IWorkShiftBookingPetServiceItem[]).length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-4 text-sm text-gray-500 text-center">Không có booking_pet_service trong tuần này.</td>
                                </tr>
                            ) : (
                                ((bookingPetServicePool?.inWeek ?? []) as IWorkShiftBookingPetServiceItem[]).map((item) => (
                                    <tr key={item.bookingPetServiceId} className="border-b border-gray-100 last:border-b-0">
                                        <td className="p-3 text-sm font-semibold text-gray-800">{item.bookingCode}</td>
                                        <td className="p-3 text-sm text-gray-700">{item.customerName || '-'} / {item.petName || '-'}</td>
                                        <td className="p-3 text-sm text-gray-700">{item.serviceName || '-'}</td>
                                        <td className="p-3 text-sm text-gray-700">{item.bookingDateFrom ? dayjs(item.bookingDateFrom).format('DD/MM/YYYY') : '-'}</td>
                                        <td className="p-3 text-sm text-gray-700">
                                            {item.scheduledStartTime && item.scheduledEndTime
                                                ? `${dayjs(item.scheduledStartTime).format('ddd DD/MM HH:mm')} - ${dayjs(item.scheduledEndTime).format('HH:mm')}`
                                                : 'Chưa xếp'}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    disabled={!selectedShiftId || assigningBookingPetService}
                                                    onClick={() => {
                                                        if (!selectedShiftId) {
                                                            toast.error('Vui lòng chọn một ca trong tuần trước khi thêm.');
                                                            return;
                                                        }
                                                        assignBookingPetService(
                                                            { shiftId: selectedShiftId, bookingPetServiceId: item.bookingPetServiceId },
                                                            {
                                                                onSuccess: (res: any) => {
                                                                    if (res?.success !== false) {
                                                                        toast.success('Đã thêm booking_pet_service vào ca.');
                                                                    } else {
                                                                        toast.error(res?.message ?? 'Có lỗi khi thêm vào ca.');
                                                                    }
                                                                },
                                                                onError: (err: any) =>
                                                                    toast.error(err?.response?.data?.message ?? err?.message ?? 'Thêm vào ca thất bại'),
                                                            }
                                                        );
                                                    }}
                                                    className="h-8 rounded-md border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Thêm vào ca đã chọn
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={unassigningBookingPetService}
                                                    onClick={() => {
                                                        unassignBookingPetService(item.bookingPetServiceId, {
                                                            onSuccess: (res: any) => {
                                                                if (res?.success !== false) {
                                                                    toast.success('Đã đưa booking_pet_service về danh sách.');
                                                                } else {
                                                                    toast.error(res?.message ?? 'Có lỗi khi đưa về danh sách.');
                                                                }
                                                            },
                                                            onError: (err: any) =>
                                                                toast.error(err?.response?.data?.message ?? err?.message ?? 'Thao tác thất bại'),
                                                        });
                                                    }}
                                                    className="h-8 rounded-md border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Đưa xuống danh sách
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 mb-6 max-w-full">
                <div className="mb-2">
                    <div className="text-base font-semibold text-gray-900">Danh sách đợi xếp lịch ca làm</div>
                    <div className="text-sm text-gray-500">
                        Booking có ngày đặt không thuộc tuần đang tạo ca.
                    </div>
                </div>
                <div className="mt-3 rounded-md border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <table className="w-full table-fixed border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Booking</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Khách / Thú cưng</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Dịch vụ</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Ngày booking</th>
                            </tr>
                        </thead>
                        <tbody>
                            {((bookingPetServicePool?.waiting ?? []) as IWorkShiftBookingPetServiceItem[]).length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-4 text-sm text-gray-500 text-center">Không có booking_pet_service chờ xếp lịch.</td>
                                </tr>
                            ) : (
                                ((bookingPetServicePool?.waiting ?? []) as IWorkShiftBookingPetServiceItem[]).map((item) => (
                                    <tr key={item.bookingPetServiceId} className="border-b border-gray-100 last:border-b-0">
                                        <td className="p-3 text-sm font-semibold text-gray-800">{item.bookingCode}</td>
                                        <td className="p-3 text-sm text-gray-700">{item.customerName || '-'} / {item.petName || '-'}</td>
                                        <td className="p-3 text-sm text-gray-700">{item.serviceName || '-'}</td>
                                        <td className="p-3 text-sm text-gray-700">{item.bookingDateFrom ? dayjs(item.bookingDateFrom).format('DD/MM/YYYY') : '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
        </LocalizationProvider>
    );
};
