import { useMemo, useState, useCallback } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { Box, Button, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { CalendarOff, CalendarX2, Clock3, Hourglass, UserMinus, Lock, Clock, Calendar, Check } from 'lucide-react';
import { ListHeader } from '../../../components/ui/ListHeader';
import { prefixAdmin } from '../../../constants/routes';
import {
    useAvailableShifts,
    useRegisterForShift,
    useMyShifts,
    useMyRegistrations,
    useRequestLeave,
    useUndoLeave,
    useCancelMyRegistration,
} from '../hooks/useWorkShift';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import type { IAvailableShiftForStaff, IWorkShiftRegistration, IWorkShift } from '../../../api/workShift.api';
import { getWorkShiftById } from '../../../api/workShift.api';
import { getMyStaffProfile } from '../../../api/staffProfile.api';
import { toast } from 'react-toastify';

dayjs.locale('vi');

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const ROW_LABELS = ['Sáng', 'Chiều'];

/** Tuần tiếp theo: từ Thứ 2 00:00 đến Chủ nhật 23:59 */
function getNextWeekRange() {
    const today = dayjs();
    const dayOfWeek = today.day();
    const daysUntilNextMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 7 : 8 - dayOfWeek;
    const nextMonday = today.add(daysUntilNextMonday, 'day').startOf('day');
    const nextSunday = nextMonday.add(6, 'day').endOf('day');
    return { start: nextMonday.toISOString(), end: nextSunday.toISOString() };
}

/** Lấy chỉ số cột ngày (0=T2, 6=CN) từ ISO date string */
function getDayIndex(iso: string): number {
    const d = dayjs(iso).day(); // 0=CN, 1=T2, ...
    return d === 0 ? 6 : d - 1;
}

/** 0 = sáng (giờ bắt đầu < 12), 1 = chiều */
function getSlotIndex(iso: string): number {
    const hour = dayjs(iso).hour();
    return hour >= 12 ? 1 : 0;
}

/** Format giờ ngắn cho ô thời khóa biểu */
function formatTimeRange(start: string, end: string): string {
    return `${dayjs(start).format('HH:mm')} - ${dayjs(end).format('HH:mm')}`;
}

export const WorkShiftStaffPage = () => {
    const { start: from, end: to } = useMemo(() => getNextWeekRange(), []);

    const { data: myProfileRes } = useQuery({
        queryKey: ['my-staff-profile'],
        queryFn: getMyStaffProfile,
        select: (res) => res.data,
    });
    const myProfile = myProfileRes ?? undefined;
    const isFullTime = myProfile?.employmentType === 'FULL_TIME';

    const { data: availableShifts = [], isLoading: loadingAvailable } = useAvailableShifts(from, to);
    const { data: myShifts = [] } = useMyShifts(from, to);
    const { data: myRegistrationsRaw = [] } = useMyRegistrations(from, to);
    const myRegistrations = myRegistrationsRaw as IWorkShiftRegistration[];
    const { mutate: registerForShift, isPending: registering } = useRegisterForShift();
    const { mutate: requestLeave, isPending: leaving } = useRequestLeave();
    const { mutate: undoLeave, isPending: undoingLeave } = useUndoLeave();
    const { mutate: cancelMyRegistration, isPending: cancelling } = useCancelMyRegistration();
    const [isHistoryMode, setIsHistoryMode] = useState(false);
    const [registeredShiftIds, setRegisteredShiftIds] = useState<Set<number>>(() => new Set());
    const [cancelledShiftIds, setCancelledShiftIds] = useState<Set<number>>(() => new Set());
    const [leaveRequestedShiftIds, setLeaveRequestedShiftIds] = useState<Set<number>>(() => new Set());

    const myShiftIds = useMemo(() => new Set(myShifts.map((s) => s.shiftId)), [myShifts]);
    const myPendingRegistrationShiftIds = useMemo(
        () => new Set(myRegistrations.filter((r) => r.status === 'PENDING').map((r) => r.workShiftId)),
        [myRegistrations]
    );
    const myOnLeaveShiftIds = useMemo(
        () => new Set(myRegistrations.filter((r) => r.status === 'ON_LEAVE').map((r) => r.workShiftId)),
        [myRegistrations]
    );
    const myPendingLeaveShiftIds = useMemo(
        () => new Set(myRegistrations.filter((r) => r.status === 'PENDING_LEAVE').map((r) => r.workShiftId)),
        [myRegistrations]
    );
    const leaveShiftIds = useMemo(() => {
        const s = new Set<number>(leaveRequestedShiftIds);
        for (const id of myOnLeaveShiftIds) s.add(id);
        for (const id of myPendingLeaveShiftIds) s.add(id);
        return s;
    }, [myOnLeaveShiftIds, myPendingLeaveShiftIds, leaveRequestedShiftIds]);
    /** 'PENDING_LEAVE' = Chờ duyệt, 'ON_LEAVE' = Đã được duyệt nghỉ */
    const leaveStatusByShiftId = useMemo(() => {
        const m: Record<number, 'PENDING_LEAVE' | 'ON_LEAVE'> = {};
        for (const r of myRegistrations) {
            if (r.status === 'PENDING_LEAVE' || r.status === 'ON_LEAVE') m[r.workShiftId] = r.status;
        }
        return m;
    }, [myRegistrations]);
    const isRegistered = useCallback(
        (shiftId: number) =>
            myShiftIds.has(shiftId) ||
            myPendingRegistrationShiftIds.has(shiftId) ||
            registeredShiftIds.has(shiftId),
        [myShiftIds, myPendingRegistrationShiftIds, registeredShiftIds]
    );

    const isCancelled = useCallback((shiftId: number) => cancelledShiftIds.has(shiftId), [cancelledShiftIds]);

    /** Part-time: chỉ hiện Đăng ký khi còn slot cho đúng vai trò (ON_LEAVE = trống) */
    const canRegisterForShift = useCallback(
        (shift: IAvailableShiftForStaff) => {
            if (!myProfile?.positionId) return false;
            const slot = shift.roleSlots?.find((r) => r.positionId === myProfile.positionId);
            return slot != null && slot.available > 0;
        },
        [myProfile?.positionId]
    );

    /** Lưới 2x7: grid[slotIndex][dayIndex] = IAvailableShiftForStaff | null (chỉ tuần chứa from) */
    const timetableGrid = useMemo(() => {
        const grid: (IAvailableShiftForStaff | null)[][] = [
            [null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null],
        ];
        const weekStart = dayjs(from).startOf('day');
        const weekEnd = weekStart.add(7, 'day');
        for (const shift of availableShifts) {
            const shiftDay = dayjs(shift.startTime);
            if (shiftDay.isBefore(weekStart) || !shiftDay.isBefore(weekEnd)) continue;
            const dayIndex = getDayIndex(shift.startTime);
            const slotIndex = getSlotIndex(shift.startTime);
            if (dayIndex >= 0 && dayIndex <= 6 && slotIndex >= 0 && slotIndex <= 1) {
                grid[slotIndex][dayIndex] = shift;
            }
        }
        return grid;
    }, [availableShifts, from]);

    /** History mode: load shift details by workShiftId */
    const historyShiftIds = useMemo(() => {
        const s = new Set<number>();
        for (const r of myRegistrations) s.add(r.workShiftId);
        return Array.from(s);
    }, [myRegistrations]);

    const historyShiftQueries = useQueries({
        queries: historyShiftIds.map((id) => ({
            queryKey: ['work-shift', id],
            queryFn: async () => {
                const res = await getWorkShiftById(id);
                return res.data as IWorkShift;
            },
            enabled: isHistoryMode && historyShiftIds.length > 0,
        })),
    });

    const historyShiftById = useMemo(() => {
        const m: Record<number, IWorkShift> = {};
        historyShiftIds.forEach((id, idx) => {
            const data = historyShiftQueries[idx]?.data;
            if (data) m[id] = data;
        });
        return m;
    }, [historyShiftIds, historyShiftQueries]);

    const historyGrid = useMemo(() => {
        const grid: IWorkShiftRegistration[][][] = Array.from({ length: 2 }, () => Array.from({ length: 7 }, () => []));
        for (const r of myRegistrations) {
            const shift = historyShiftById[r.workShiftId];
            if (!shift) continue;
            const dayIndex = getDayIndex(shift.startTime);
            const slotIndex = getSlotIndex(shift.startTime);
            if (dayIndex < 0 || dayIndex > 6 || slotIndex < 0 || slotIndex > 1) continue;
            grid[slotIndex][dayIndex].push(r);
        }
        return grid;
    }, [myRegistrations, historyShiftById]);

    const getHistoryCard = (reg: IWorkShiftRegistration) => {
        const shift = historyShiftById[reg.workShiftId];
        const timeLabel = shift ? formatTimeRange(shift.startTime, shift.endTime) : '—';
        const roleLabel = reg.roleAtRegistrationName ?? '—';

        const shiftCancelled = shift?.status === 'CANCELLED';
        const adminLocked = shift != null && shift.status !== 'OPEN' && shift.status !== 'CANCELLED';
        if (shiftCancelled) {
            return {
                wrap: 'bg-gray-50 border-gray-200 opacity-70 grayscale',
                badge: 'bg-gray-800 text-white',
                badgeText: 'Ca đã bị hủy',
                badgeIcon: null as any,
                strike: true,
                cancelled: true,
                adminLocked: false,
                timeLabel,
                roleLabel,
            };
        }

        const isPartTime = (reg.workType ?? '').toUpperCase() === 'PART_TIME' || myProfile?.employmentType === 'PART_TIME';
        if (isPartTime) {
            if (reg.status === 'APPROVED') {
                return {
                    wrap: 'bg-emerald-50 border-emerald-200',
                    badge: 'bg-emerald-100 text-emerald-700',
                    badgeText: 'Đã duyệt đăng ký',
                    badgeIcon: null as any,
                    strike: false,
                cancelled: false,
                    adminLocked,
                    timeLabel,
                    roleLabel,
                };
            }
            if (reg.status === 'REJECTED') {
                return {
                    wrap: 'bg-red-50 border-red-200',
                    badge: 'bg-red-100 text-red-700',
                    badgeText: 'Từ chối đăng ký',
                    badgeIcon: null as any,
                    strike: false,
                cancelled: false,
                    adminLocked,
                    timeLabel,
                    roleLabel,
                };
            }
            return {
                wrap: 'bg-amber-50 border-amber-200',
                badge: 'bg-amber-100 text-amber-700',
                badgeText: 'Chờ duyệt đăng ký',
                badgeIcon: null as any,
                strike: false,
                cancelled: false,
                adminLocked,
                timeLabel,
                roleLabel,
            };
        }

        // Full-time leave statuses
        if (reg.status === 'ON_LEAVE') {
            return {
                wrap: 'bg-amber-50 border-amber-200',
                badge: 'bg-amber-100 text-amber-700',
                badgeText: 'Đã duyệt nghỉ',
                badgeIcon: Check,
                strike: false,
                cancelled: false,
                adminLocked,
                timeLabel,
                roleLabel,
            };
        }
        const leaveDecision = String(reg.leaveDecision ?? '').toUpperCase();
        if (reg.status === 'PENDING_LEAVE' && leaveDecision === 'REJECTED_LEAVE') {
            return {
                wrap: 'bg-rose-50 border-rose-200',
                badge: 'bg-rose-100 text-rose-700',
                badgeText: 'Từ chối nghỉ',
                badgeIcon: null as any,
                strike: false,
                cancelled: false,
                adminLocked,
                timeLabel,
                roleLabel,
            };
        }
        return {
            wrap: 'bg-amber-50 border-amber-200',
            badge: 'bg-amber-100 text-amber-700',
            badgeText: 'Chờ duyệt nghỉ',
            badgeIcon: null as any,
            strike: false,
            cancelled: false,
            adminLocked,
            timeLabel,
            roleLabel,
        };
    };

    const handleRegister = (shiftId: number) => {
        registerForShift(shiftId, {
            onSuccess: (res: any) => {
                if (res?.success) {
                    setRegisteredShiftIds((prev) => new Set(prev).add(shiftId));
                    setCancelledShiftIds((prev) => {
                        const s = new Set(prev);
                        s.delete(shiftId);
                        return s;
                    });
                    toast.success(res.message ?? 'Đăng ký ca thành công. Chờ admin duyệt.');
                } else toast.error(res?.message ?? 'Đăng ký thất bại');
            },
            onError: (err: any) => {
                const message = err?.response?.data?.message ?? err?.message ?? 'Đăng ký ca thất bại.';
                toast.error(message);
                if (typeof message === 'string' && message.includes('đã đăng ký')) {
                    setRegisteredShiftIds((prev) => new Set(prev).add(shiftId));
                }
            },
        });
    };

    const handleRequestLeave = (shiftId: number) => {
        requestLeave(shiftId, {
            onSuccess: (res) => {
                if (res?.success) {
                    setLeaveRequestedShiftIds((prev) => new Set(prev).add(shiftId));
                    toast.success(res.message ?? 'Đã gửi xin nghỉ.');
                }
            },
            onError: (err: any) => {
                const msg = err?.response?.data?.message ?? err?.message ?? 'Xin nghỉ thất bại.';
                toast.error(msg);
                // Nếu backend báo đã xin nghỉ trước đó thì cũng cập nhật UI cho đồng bộ
                if (typeof msg === 'string' && msg.toLowerCase().includes('xin nghỉ')) {
                    setLeaveRequestedShiftIds((prev) => new Set(prev).add(shiftId));
                }
            },
        });
    };

    const handleUndoLeave = (shiftId: number) => {
        undoLeave(shiftId, {
            onSuccess: (res) => {
                if (res?.success) {
                    setLeaveRequestedShiftIds((prev) => {
                        const s = new Set(prev);
                        s.delete(shiftId);
                        return s;
                    });
                    toast.success(res.message ?? 'Đã hoàn tác xin nghỉ.');
                }
            },
            onError: (err: any) => {
                const msg = err?.response?.data?.message ?? err?.message ?? 'Hoàn tác xin nghỉ thất bại.';
                toast.error(msg);
            },
        });
    };

    const handleCancelRegistration = (shiftId: number) => {
        cancelMyRegistration(shiftId, {
            onSuccess: (res: any) => {
                if (res?.success) {
                    setCancelledShiftIds((prev) => new Set(prev).add(shiftId));
                    setRegisteredShiftIds((prev) => {
                        const s = new Set(prev);
                        s.delete(shiftId);
                        return s;
                    });
                    toast.success(res.message ?? 'Đã hoàn tác đăng ký.');
                } else toast.error(res?.message ?? 'Hoàn tác thất bại');
            },
            onError: (err: any) => {
                toast.error(err?.response?.data?.message ?? err?.message ?? 'Hoàn tác đăng ký thất bại.');
            },
        });
    };

    return (
        <>
            <ListHeader
                title="Đăng ký ca làm việc"
                breadcrumbItems={[
                    { label: 'Trang chủ', to: '/' },
                    { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                    { label: 'Ca làm việc' },
                ]}
            />
            <Box sx={{ px: { xs: 2, sm: 3, md: '40px' }, pb: 3, mt: 3 }}>
                {/* Thời khóa biểu: Ca trống có thể đăng ký */}
                <Box sx={{ mb: 4 }}>
                    <div className="flex justify-end">
                        <div className="inline-flex items-center p-1 bg-gray-100 rounded-lg mb-4">
                            <button
                                type="button"
                                onClick={() => setIsHistoryMode(false)}
                                className={[
                                    'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
                                    !isHistoryMode
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50',
                                ].join(' ')}
                            >
                                Đăng ký
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsHistoryMode(true)}
                                className={[
                                    'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
                                    isHistoryMode
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50',
                                ].join(' ')}
                            >
                                Lịch sử
                            </button>
                        </div>
                    </div>

                    {!isHistoryMode ? (
                        <>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
                        Ca trống có thể đăng ký
                    </Typography>
                    <div className="max-w-[1200px] rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        {/* Header */}
                        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="grid grid-cols-[160px_1fr] items-center gap-4">
                                <div className="uppercase text-xs font-semibold tracking-[0.08em] text-slate-500">
                                    Buổi / Ngày
                                </div>
                                <div className="grid grid-cols-7 gap-4">
                                    {DAY_LABELS.map((label) => (
                                        <div
                                            key={label}
                                            className="text-center uppercase text-xs font-semibold tracking-[0.08em] text-slate-500"
                                        >
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="px-4 py-4 space-y-4">
                            {ROW_LABELS.map((rowLabel, slotIndex) => (
                                <div
                                    key={rowLabel}
                                    className={[
                                        'grid grid-cols-[160px_1fr] gap-4 items-start rounded-xl p-3',
                                        slotIndex === 0 ? 'bg-blue-50/40' : 'bg-indigo-50/40',
                                    ].join(' ')}
                                >
                                    {/* Row header with AM/PM pill */}
                                    <div className="flex items-center text-sm font-semibold text-slate-700">
                                        <span className="text-sm font-semibold text-slate-600">{rowLabel}</span>
                                    </div>

                                    {/* Cells */}
                                    <div className="grid grid-cols-7 gap-4">
                                        {DAY_LABELS.map((_, dayIndex) => {
                                            const shift = timetableGrid[slotIndex]?.[dayIndex];

                                            if (loadingAvailable) {
                                                return (
                                                    <div
                                                        key={dayIndex}
                                                        className="flex h-[120px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500"
                                                    >
                                                        Đang tải...
                                                    </div>
                                                );
                                            }

                                            if (!shift) {
                                                return (
                                                    <div key={dayIndex} className="h-[120px] flex items-center justify-center">
                                                        <div className="flex h-full w-full items-center justify-center rounded-xl border border-gray-100 bg-gray-100/50 opacity-60 text-xs font-medium text-gray-400">
                                                            —
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // Check if it's full-time and not working this shift
                                            const isFullTimeAndNotWorking = isFullTime && !leaveShiftIds.has(shift.shiftId) && !myShiftIds.has(shift.shiftId) && !myPendingRegistrationShiftIds.has(shift.shiftId);

                                            if (isFullTimeAndNotWorking) {
                                                return (
                                                    <div key={dayIndex} className="h-[120px] flex items-center justify-center">
                                                        <div className="flex h-full w-full items-center justify-center rounded-xl border border-gray-100 bg-gray-100/50 opacity-60 text-xs font-medium text-gray-400">
                                                            —
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            let cardBorderClass = 'border-slate-200';
                                            let cardBgClass = 'bg-white/80';

                                            // Part-time specific visual states
                                            if (isFullTime) {
                                                // Full-time: nếu ca đang ở trạng thái xin nghỉ / chờ duyệt nghỉ thì cả khung chuyển sang tone vàng nhạt
                                                if (leaveShiftIds.has(shift.shiftId)) {
                                                    cardBorderClass = 'border-amber-200';
                                                    cardBgClass = 'bg-amber-50/70';
                                                }
                                            } else {
                                                // Part-time specific visual states
                                                if (isRegistered(shift.shiftId) && !isCancelled(shift.shiftId)) {
                                                    // Đã đăng ký (chờ duyệt)
                                                    cardBorderClass = 'border-amber-200 bg-amber-50/70 block';
                                                    cardBgClass = ''; // using block classes directly on border for full card highlight
                                                } else if (canRegisterForShift(shift)) {
                                                    cardBorderClass = 'border-2 border-dashed border-blue-200/60';
                                                    cardBgClass = 'bg-white hover:bg-blue-50/50';
                                                } else {
                                                    // Hết slot / Không thể đăng ký
                                                    cardBorderClass = 'border-gray-100';
                                                    cardBgClass = 'bg-gray-100/50 opacity-60';
                                                }
                                            }

                                            return (
                                                <div key={dayIndex} className="h-[120px]">
                                                    <div
                                                        className={`group flex h-full flex-col rounded-2xl border px-3 py-2.5 shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-md ${cardBorderClass} ${cardBgClass}`}
                                                    >
                                                        {/* Time row */}
                                                        <div className="flex items-center justify-center gap-2">
                                                            <span className="inline-flex items-center justify-center rounded-md bg-gray-100 p-1">
                                                                <Clock3 className="h-4 w-4 text-slate-500" />
                                                            </span>
                                                            <p className="text-sm font-bold text-gray-900">
                                                                {formatTimeRange(shift.startTime, shift.endTime)}
                                                            </p>
                                                        </div>

                                                        {/* Dynamic status + actions */}
                                                        <div className="mt-3 mt-auto">
                                                            {isFullTime && leaveShiftIds.has(shift.shiftId) ? (
                                                                leaveStatusByShiftId[shift.shiftId] === 'ON_LEAVE' ? (
                                                                    <button
                                                                        type="button"
                                                                        disabled
                                                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 cursor-default"
                                                                    >
                                                                        <CalendarOff className="h-3.5 w-3.5" />
                                                                        Đã duyệt nghỉ
                                                                    </button>
                                                                ) : (
                                                                <button
                                                                    type="button"
                                                                    disabled={undoingLeave || leaving}
                                                                    onClick={() => handleUndoLeave(shift.shiftId)}
                                                                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                    <Hourglass className="h-3.5 w-3.5" />
                                                                    Chờ duyệt
                                                                </button>
                                                                )
                                                            ) : isFullTime && myShiftIds.has(shift.shiftId) ? (
                                                                <button
                                                                    type="button"
                                                                    disabled={leaving || undoingLeave}
                                                                    onClick={() => handleRequestLeave(shift.shiftId)}
                                                                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                    <UserMinus className="h-3.5 w-3.5" />
                                                                    Xin nghỉ
                                                                </button>
                                                            ) : isFullTime && myPendingRegistrationShiftIds.has(shift.shiftId) ? (
                                                                <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                                                                    <Hourglass className="h-3.5 w-3.5" />
                                                                    Chờ duyệt
                                                                </div>
                                                            ) : isRegistered(shift.shiftId) && !isCancelled(shift.shiftId) ? (
                                                                <button
                                                                    type="button"
                                                                    disabled={cancelling || registering}
                                                                    onClick={() => handleCancelRegistration(shift.shiftId)}
                                                                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                                    title="Nhấn để hoàn tác đăng ký"
                                                                >
                                                                    <Hourglass className="h-3.5 w-3.5" />
                                                                    Chờ duyệt
                                                                </button>
                                                            ) : !canRegisterForShift(shift) ? (
                                                                <p className="text-[0.5rem] text-gray-400">Đã đủ người</p>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    disabled={registering}
                                                                    onClick={() => handleRegister(shift.shiftId)}
                                                                    className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                    Đăng ký ca
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {availableShifts.length === 0 && !loadingAvailable && (
                            <div className="border-t border-slate-100 px-6 py-4 text-center text-sm text-slate-500">
                                Không có ca trống trong khoảng thời gian đã chọn.
                            </div>
                        )}
                    </div>
                        </>
                    ) : (
                        <>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
                                Lịch sử đăng ký ca
                            </Typography>
                            <div className="max-w-[1200px] rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                {/* Header (same layout as Register view) */}
                                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="grid grid-cols-[160px_1fr] items-center gap-4">
                                        <div className="uppercase text-xs font-semibold tracking-[0.08em] text-slate-500">
                                            Buổi / Ngày
                                        </div>
                                        <div className="grid grid-cols-7 gap-4">
                                            {DAY_LABELS.map((label) => (
                                                <div
                                                    key={label}
                                                    className="text-center uppercase text-xs font-semibold tracking-[0.08em] text-slate-500"
                                                >
                                                    {label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Body (same rows/cells) */}
                                <div className="px-4 py-4 space-y-4">
                                    {ROW_LABELS.map((rowLabel, slotIndex) => (
                                        <div
                                            key={rowLabel}
                                            className={[
                                                'grid grid-cols-[160px_1fr] gap-4 items-start rounded-xl p-3',
                                                slotIndex === 0 ? 'bg-blue-50/40' : 'bg-indigo-50/40',
                                            ].join(' ')}
                                        >
                                            <div className="flex items-center text-sm font-semibold text-slate-700">
                                                <span className="text-sm font-semibold text-slate-600">{rowLabel}</span>
                                            </div>

                                            <div className="grid grid-cols-7 gap-4">
                                                {DAY_LABELS.map((_, dayIndex) => {
                                                    const regs = historyGrid[slotIndex]?.[dayIndex] ?? [];

                                                    if (historyShiftQueries.some((q) => q.isLoading)) {
                                                        return (
                                                            <div
                                                                key={dayIndex}
                                                                className="flex h-[120px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500"
                                                            >
                                                                Đang tải...
                                                            </div>
                                                        );
                                                    }

                                                    if (!regs.length) {
                                                        return (
                                                            <div
                                                                key={dayIndex}
                                                                className="h-full w-full rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/30 flex items-center justify-center text-xs text-gray-400 min-h-[140px]"
                                                            >
                                                                —
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div key={dayIndex} className="flex flex-col gap-3 min-h-[140px]">
                                                            {regs.map((reg) => {
                                                                const card = getHistoryCard(reg);
                                                                const BadgeIcon = card.badgeIcon;
                                                                return (
                                                                    <div
                                                                        key={reg.registrationId}
                                                                        className={[
                                                                            'w-full p-3 rounded-xl border flex flex-col gap-2 relative overflow-hidden transition-all',
                                                                            card.wrap,
                                                                        ].join(' ')}
                                                                    >
                                                                        {card.cancelled ? (
                                                                            <div className="absolute top-2 right-2 bg-gray-800 text-white px-2 py-1 rounded text-xs font-bold w-fit">
                                                                                {card.badgeText}
                                                                            </div>
                                                                        ) : card.adminLocked ? (
                                                                            <div className="absolute top-2 right-2 bg-slate-900 text-white px-2 py-1 rounded text-xs font-bold w-fit">
                                                                                Admin đã khóa
                                                                            </div>
                                                                        ) : null}
                                                                        <div
                                                                            className={[
                                                                                'text-sm font-semibold text-gray-900',
                                                                                card.strike ? 'line-through' : '',
                                                                            ].join(' ')}
                                                                        >
                                                                            {card.timeLabel}
                                                                        </div>
                                                                        <div className="text-xs text-gray-600">{card.roleLabel}</div>
                                                                        {!card.cancelled ? (
                                                                            <div
                                                                                className={[
                                                                                    'px-2 py-1 rounded text-xs font-bold w-fit',
                                                                                    card.badge,
                                                                                    BadgeIcon ? 'flex items-center gap-1' : '',
                                                                                ].join(' ')}
                                                                            >
                                                                                {BadgeIcon ? <BadgeIcon className="w-3.5 h-3.5" /> : null}
                                                                                {card.badgeText}
                                                                            </div>
                                                                        ) : null}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </Box>
            </Box>
        </>
    );
};
