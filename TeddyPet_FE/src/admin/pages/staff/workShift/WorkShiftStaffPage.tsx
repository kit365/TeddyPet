import { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Button, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { CalendarOff, CalendarX2, Clock3, Hourglass, UserMinus, CheckCircle, Lock, Clock, Calendar } from 'lucide-react';
import { ListHeader } from '../../../components/ui/ListHeader';
import { prefixAdmin } from '../../../constants/routes';
import {
    useAvailableShifts,
    useRegisterForShift,
    useCancelMyRegistration,
    useMyShifts,
    useMyRegistrations,
    useRequestLeave,
    useUndoLeave,
} from '../hooks/useWorkShift';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import type { IAvailableShiftForStaff, IWorkShiftRegistration } from '../../../api/workShift.api';
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
    const { data: myShifts = [], isLoading: loadingMy } = useMyShifts(from, to);
    const { data: myRegistrationsRaw = [] } = useMyRegistrations(from, to);
    const myRegistrations = myRegistrationsRaw as IWorkShiftRegistration[];
    const { mutate: registerForShift, isPending: registering } = useRegisterForShift();
    const { mutate: cancelMyRegistration, isPending: cancelling } = useCancelMyRegistration();
    const { mutate: requestLeave, isPending: leaving } = useRequestLeave();
    const { mutate: undoLeave, isPending: undoingLeave } = useUndoLeave();
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

    /** Chỉ hiển thị "Ca của tôi" khi ca đã được admin khóa (ASSIGNED) hoặc đã hoàn thành. Ca còn OPEN sẽ không xuất hiện ở danh sách này. */
    const visibleMyShifts = useMemo(
        () => myShifts.filter((s) => s.status === 'ASSIGNED' || s.status === 'COMPLETED'),
        [myShifts]
    );

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

    const handleCancelRegistration = (shiftId: number) => {
        cancelMyRegistration(shiftId, {
            onSuccess: (res: any) => {
                if (res?.success) {
                    setRegisteredShiftIds((prev) => {
                        const s = new Set(prev);
                        s.delete(shiftId);
                        return s;
                    });
                    setCancelledShiftIds((prev) => new Set(prev).add(shiftId));
                    toast.success(res.message ?? 'Đã hủy đăng ký ca.');
                } else toast.error(res?.message ?? 'Hủy đăng ký thất bại');
            },
            onError: (err: any) => {
                const msg = err?.response?.data?.message ?? err?.message ?? 'Hủy đăng ký thất bại.';
                toast.error(msg);
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
                                                    <div
                                                        key={dayIndex}
                                                        className="flex h-[120px] items-center justify-center rounded-xl border border-gray-100 bg-gray-100/50 opacity-60 text-xs font-medium text-gray-400"
                                                    >
                                                        —
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
                                                    // Đã đăng ký (chờ duyệt) – đồng bộ với khung "Chờ duyệt"
                                                    cardBorderClass = 'border-amber-200';
                                                    cardBgClass = 'bg-amber-50/70';
                                                } else if (canRegisterForShift(shift)) {
                                                    cardBorderClass = 'border-2 border-dashed border-blue-200/60';
                                                    cardBgClass = 'bg-white hover:bg-blue-50/50';
                                                } else {
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
                                                            ) : isFullTime ? (
                                                                <p className="text-[0.8rem] text-slate-400">—</p>
                                                            ) : isRegistered(shift.shiftId) && !isCancelled(shift.shiftId) ? (
                                                                <div className="flex w-full items-center justify-center">
                                                                    <div className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                                                                        <Hourglass className="h-4 w-4" />
                                                                        <span>Chờ duyệt</span>
                                                                    </div>
                                                                </div>
                                                            ) : canRegisterForShift(shift) ? (
                                                                <button
                                                                    type="button"
                                                                    disabled={registering || cancelling}
                                                                    onClick={() => handleRegister(shift.shiftId)}
                                                                    className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                    Đăng ký ca
                                                                </button>
                                                            ) : (
                                                                <p className="text-[0.8rem] text-gray-400">Đã đủ người</p>
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
                </Box>

                {/* Ca của tôi */}
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
                        Ca của tôi (đã được phân bổ)
                    </Typography>
                    {loadingMy ? (
                        <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary', fontSize: '1.0625rem' }}>
                            Đang tải...
                        </Box>
                    ) : visibleMyShifts.length === 0 ? (
                        <Box
                            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-10"
                            sx={{
                                mt: 2,
                            }}
                        >
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white p-3 text-gray-400 shadow-sm">
                                <CalendarX2 className="h-10 w-10" />
                            </div>
                            <Typography
                                className="text-lg font-medium text-gray-600"
                                sx={{ mt: 1.5 }}
                            >
                                Bạn chưa có ca làm việc nào
                            </Typography>
                            <Typography className="mt-1 text-sm text-gray-400">
                                Khi được phân bổ ca làm việc, tất cả thông tin ca sẽ xuất hiện ở khu vực này.
                            </Typography>
                        </Box>
                    ) : (
                        <Box
                            sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                                overflow: 'hidden',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            }}
                        >
                            <TableContainer>
                            <Table size="medium">
                                <TableHead>
                                <TableRow
                                        sx={{
                                            bgcolor: 'rgba(249,250,251,0.9)', // gray-50/80
                                            '& th': {
                                                borderBottom: '1px solid rgba(243,244,246,1)', // gray-100
                                            },
                                        }}
                                    >
                                        <TableCell sx={{ fontWeight: 600, fontSize: '1.0625rem', py: 1.5 }}>Ngày</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: '1.0625rem', py: 1.5 }}>Giờ</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: '1.0625rem', py: 1.5 }}>Trạng thái</TableCell>
                                        {isFullTime && (
                                            <TableCell sx={{ fontWeight: 600, fontSize: '1.0625rem', py: 1.5 }}>Thao tác</TableCell>
                                        )}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {visibleMyShifts.map((s) => (
                                        <TableRow
                                            key={s.shiftId}
                                            sx={{
                                                '& td': {
                                                    borderBottom: '1px solid rgba(243,244,246,1)', // gray-100
                                                },
                                            }}
                                        >
                                            <TableCell sx={{ fontSize: '1.0625rem', py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Calendar className="h-4 w-4 text-slate-400" />
                                                    <span className="font-semibold text-gray-800">
                                                        {dayjs(s.startTime).locale('vi').format('dddd DD/MM/YYYY')}
                                                    </span>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '1.0625rem', py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Clock className="h-4 w-4 text-slate-400" />
                                                    <span>{formatTimeRange(s.startTime, s.endTime)}</span>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '1.0625rem', py: 1.5 }}>
                                                {(() => {
                                                    const baseStatus = leaveShiftIds.has(s.shiftId)
                                                        ? leaveStatusByShiftId[s.shiftId] === 'ON_LEAVE'
                                                            ? 'Đã duyệt nghỉ'
                                                            : 'Chờ duyệt'
                                                        : s.status === 'OPEN'
                                                            ? 'Chưa khóa'
                                                            : s.status === 'ASSIGNED'
                                                                ? 'Đã khóa'
                                                                : s.status === 'COMPLETED'
                                                                    ? 'Hoàn thành'
                                                                    : s.status === 'CANCELLED'
                                                                        ? 'Đã hủy'
                                                                        : s.status;

                                                    if (baseStatus === 'Đã khóa' && !leaveShiftIds.has(s.shiftId)) {
                                                        return (
                                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                                                                <Lock className="h-3.5 w-3.5" />
                                                                <span>Đã khóa</span>
                                                            </span>
                                                        );
                                                    }

                                                    return baseStatus;
                                                })()}
                                            </TableCell>
                                            {isFullTime && (
                                                <TableCell sx={{ fontSize: '1.0625rem', py: 1.5 }}>
                                                    {leaveShiftIds.has(s.shiftId) ? (
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="success"
                                                            disabled={undoingLeave || leaving}
                                                            onClick={() => handleUndoLeave(s.shiftId)}
                                                        >
                                                            {leaveStatusByShiftId[s.shiftId] === 'ON_LEAVE' ? 'Đã duyệt nghỉ' : 'Chờ duyệt'}
                                                        </Button>
                                                    ) : s.status === 'OPEN' ? (
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="warning"
                                                            disabled={leaving || undoingLeave}
                                                            onClick={() => handleRequestLeave(s.shiftId)}
                                                        >
                                                            Xin nghỉ
                                                        </Button>
                                                    ) : (
                                                        <Typography component="span" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                                                            Ca đã khóa
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            </TableContainer>
                        </Box>
                    )}
                </Box>
            </Box>
        </>
    );
};
