import { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { CalendarOff, Check, Clock3 } from 'lucide-react';
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
    const { data: myShifts = [] } = useMyShifts(from, to);
    const { data: myRegistrationsRaw = [] } = useMyRegistrations(from, to);
    const myRegistrations = myRegistrationsRaw as IWorkShiftRegistration[];
    const { mutate: registerForShift, isPending: registering } = useRegisterForShift();
    const { mutate: requestLeave, isPending: leaving } = useRequestLeave();
    const { mutate: undoLeave, isPending: undoingLeave } = useUndoLeave();
    const { mutate: cancelMyRegistration, isPending: cancelling } = useCancelMyRegistration();
    const [registeredShiftIds, setRegisteredShiftIds] = useState<Set<number>>(() => new Set());
    const [cancelledShiftIds, setCancelledShiftIds] = useState<Set<number>>(() => new Set());
    const [leaveRequestedShiftIds, setLeaveRequestedShiftIds] = useState<Set<number>>(() => new Set());
    /** Popup chọn chức vụ khi part-time đăng ký ca */
    const [registerModalShift, setRegisterModalShift] = useState<IAvailableShiftForStaff | null>(null);
    const [registerModalPositionId, setRegisterModalPositionId] = useState<number | null>(null);

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

    /** Part-time: hiện Đăng ký khi còn slot cho chức vụ chính hoặc chức vụ phụ */
    const canRegisterForShift = useCallback(
        (shift: IAvailableShiftForStaff) => {
            if (!shift.roleSlots?.length) return false;
            const mainSlot = myProfile?.positionId
                ? shift.roleSlots.find((r) => r.positionId === myProfile.positionId)
                : null;
            const secondarySlot =
                myProfile?.secondaryPositionId != null
                    ? shift.roleSlots.find((r) => r.positionId === myProfile.secondaryPositionId)
                    : null;
            return (mainSlot != null && mainSlot.available > 0) || (secondarySlot != null && secondarySlot.available > 0);
        },
        [myProfile?.positionId, myProfile?.secondaryPositionId]
    );

    /** Các chức vụ có thể chọn khi đăng ký ca này (còn slot và thuộc chính/phụ của nhân viên) */
    const getRegisterableSlots = useCallback(
        (shift: IAvailableShiftForStaff) => {
            if (!shift.roleSlots?.length) return [];
            const mainId = myProfile?.positionId;
            const secondaryId = myProfile?.secondaryPositionId;
            return shift.roleSlots.filter(
                (r) => r.available > 0 && (r.positionId === mainId || r.positionId === secondaryId)
            );
        },
        [myProfile?.positionId, myProfile?.secondaryPositionId]
    );

    const openRegisterModal = (shift: IAvailableShiftForStaff) => {
        const slots = getRegisterableSlots(shift);
        setRegisterModalShift(shift);
        setRegisterModalPositionId(slots.length === 1 ? slots[0].positionId : null);
    };

    const closeRegisterModal = () => {
        setRegisterModalShift(null);
        setRegisterModalPositionId(null);
    };

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

    const handleRegister = (shift: IAvailableShiftForStaff) => {
        openRegisterModal(shift);
    };

    const handleConfirmRegister = () => {
        if (!registerModalShift) return;
        const positionId = registerModalPositionId ?? undefined;
        registerForShift(
            { shiftId: registerModalShift.shiftId, positionId },
            {
                onSuccess: (res: any) => {
                    if (res?.success) {
                        const id = registerModalShift.shiftId;
                        setRegisteredShiftIds((prev) => new Set(prev).add(id));
                        setCancelledShiftIds((prev) => {
                            const s = new Set(prev);
                            s.delete(id);
                            return s;
                        });
                        toast.success(res.message ?? 'Đăng ký thành công. Chờ admin duyệt.');
                        closeRegisterModal();
                    } else toast.error(res?.message ?? 'Đăng ký thất bại');
                },
                onError: (err: any) => {
                    const message = err?.response?.data?.message ?? err?.message ?? 'Đăng ký thất bại.';
                    toast.error(message);
                    if (typeof message === 'string' && message.includes('đã đăng ký')) {
                        setRegisteredShiftIds((prev) => new Set(prev).add(registerModalShift.shiftId));
                    }
                },
            }
        );
    };

    const [leaveDialogShiftId, setLeaveDialogShiftId] = useState<number | null>(null);
    const [leaveReason, setLeaveReason] = useState('');

    const openLeaveDialog = (shiftId: number) => {
        setLeaveDialogShiftId(shiftId);
        setLeaveReason('');
    };

    const closeLeaveDialog = () => {
        setLeaveDialogShiftId(null);
        setLeaveReason('');
    };

    const handleConfirmLeave = () => {
        if (!leaveDialogShiftId) return;
        if (!leaveReason.trim()) {
            toast.warning('Vui lòng nhập lý do xin nghỉ.');
            return;
        }

        const shiftId = leaveDialogShiftId;
        requestLeave(
            { shiftId, reason: leaveReason.trim() },
            {
                onSuccess: (res) => {
                    if (res?.success) {
                        setLeaveRequestedShiftIds((prev) => new Set(prev).add(shiftId));
                        toast.success(res.message ?? 'Đã gửi xin nghỉ.');
                        closeLeaveDialog();
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
            }
        );
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
                title="Đăng ký làm việc"
                titleSx={{ fontSize: '1.125rem' }}
                breadcrumbItems={[
                    { label: 'Trang chủ', to: '/' },
                    { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                    { label: 'Ca làm việc' },
                ]}
            />
            <Box sx={{ px: { xs: 2, sm: 3, md: '40px' }, pb: 3, mt: 3, minWidth: 0, width: '100%' }}>
                {/* Thời khóa biểu: Ca trống có thể đăng ký */}
                <Box sx={{ mb: 4 }}>
                    <Typography className="text-base font-semibold text-gray-800 mb-2">
                        Ca trống có thể đăng ký
                    </Typography>
                    <div className="w-full min-w-0 overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm">
                        <div className="min-w-[720px]">
                        {/* Header */}
                        <div className="border-b border-gray-200 bg-gray-50 p-3">
                            <div className="grid grid-cols-[72px_1fr] items-center gap-2">
                                <div className="text-sm font-semibold text-gray-700">
                                    Buổi / Ngày
                                </div>
                                <div className="grid grid-cols-7 gap-2">
                                    {DAY_LABELS.map((label) => (
                                        <div
                                            key={label}
                                            className="text-center text-sm font-semibold text-gray-700"
                                        >
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-3 space-y-2">
                            {ROW_LABELS.map((rowLabel, slotIndex) => (
                                <div
                                    key={rowLabel}
                                    className={[
                                        'grid grid-cols-[72px_1fr] gap-2 items-stretch rounded-md p-3',
                                        slotIndex === 0 ? 'bg-blue-50/40' : 'bg-indigo-50/40',
                                    ].join(' ')}
                                >
                                    {/* Row header */}
                                    <div className="flex items-center text-sm font-semibold text-gray-700">
                                        <span>{rowLabel}</span>
                                    </div>

                                    {/* Cells */}
                                    <div className="grid grid-cols-7 gap-2">
                                        {DAY_LABELS.map((_, dayIndex) => {
                                            const shift = timetableGrid[slotIndex]?.[dayIndex];

                                            if (loadingAvailable) {
                                                return (
                                                    <div
                                                        key={dayIndex}
                                                        className="flex min-h-[96px] items-center justify-center rounded-md border border-gray-200 bg-white text-sm text-gray-500 p-3"
                                                    >
                                                        Đang tải...
                                                    </div>
                                                );
                                            }

                                            if (!shift) {
                                                return (
                                                    <div key={dayIndex} className="min-h-[96px] flex items-center justify-center">
                                                        <div className="flex h-full w-full min-h-[96px] items-center justify-center rounded-md border border-gray-200 bg-gray-50/50 text-sm text-gray-500">
                                                            —
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // Check if it's full-time and not working this shift
                                            const isFullTimeAndNotWorking = isFullTime && !leaveShiftIds.has(shift.shiftId) && !myShiftIds.has(shift.shiftId) && !myPendingRegistrationShiftIds.has(shift.shiftId);

                                            if (isFullTimeAndNotWorking) {
                                                return (
                                                    <div key={dayIndex} className="min-h-[96px] flex items-center justify-center">
                                                        <div className="flex h-full w-full min-h-[96px] items-center justify-center rounded-md border border-gray-200 bg-gray-50/50 text-sm text-gray-500">
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
                                                <div key={dayIndex} className="min-h-[96px]">
                                                    <div
                                                        className={`group flex h-full min-h-[96px] flex-col rounded-lg border px-2 py-1.5 shadow-sm transition-all duration-200 hover:shadow-md ${cardBorderClass} ${cardBgClass}`}
                                                    >
                                                {/* Time row - hiện đủ khung giờ, xuống dòng nếu cần */}
                                                <div className="flex flex-shrink-0 flex-wrap items-center justify-center gap-1">
                                                    <span className="inline-flex shrink-0 items-center justify-center rounded bg-gray-100 p-0.5">
                                                        <Clock3 className="h-3 w-3 text-slate-500" />
                                                    </span>
                                                    <p className="min-w-0 text-center text-[9px] font-bold leading-tight text-gray-900 break-words">
                                                                {formatTimeRange(shift.startTime, shift.endTime)}
                                                            </p>
                                                        </div>

                                                        {/* Dynamic status + actions */}
                                                        <div className="mt-1.5 flex min-h-0 flex-1 flex-col justify-end">
                                                            {isFullTime && leaveShiftIds.has(shift.shiftId) ? (
                                                                leaveStatusByShiftId[shift.shiftId] === 'ON_LEAVE' ? (
                                                                    <button
                                                                        type="button"
                                                                        disabled
                                                                        className="flex w-full items-center justify-center gap-1 rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 cursor-default"
                                                                    >
                                                                        <CalendarOff className="h-3.5 w-3.5" />
                                                                        Đã duyệt nghỉ
                                                                    </button>
                                                                ) : (
                                                                <button
                                                                    type="button"
                                                                    disabled={undoingLeave || leaving}
                                                                    onClick={() => handleUndoLeave(shift.shiftId)}
                                                                    className="flex w-full items-center justify-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
                                                                >
                                                                    Chờ duyệt
                                                                </button>
                                                                )
                                                            ) : isFullTime && myShiftIds.has(shift.shiftId) ? (
                                                                <button
                                                                    type="button"
                                                                    disabled={leaving || undoingLeave}
                                                                    onClick={() => openLeaveDialog(shift.shiftId)}
                                                                    className="flex w-full items-center justify-center gap-1 rounded border border-red-200 bg-white px-2 py-1 text-[10px] font-semibold text-red-600 shadow-sm transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
                                                                >
                                                                    Xin nghỉ
                                                                </button>
                                                            ) : isFullTime && myPendingRegistrationShiftIds.has(shift.shiftId) ? (
                                                                <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-[12px] font-semibold text-amber-700 whitespace-nowrap">
                                                                    Chờ duyệt
                                                                </div>
                                                            ) : isRegistered(shift.shiftId) && !isCancelled(shift.shiftId) ? (
                                                                <button
                                                                    type="button"
                                                                    disabled={cancelling || registering}
                                                                    onClick={() => handleCancelRegistration(shift.shiftId)}
                                                                    className="flex w-full items-center justify-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
                                                                    title="Nhấn để hoàn tác đăng ký"
                                                                >
                                                                    Chờ duyệt
                                                                </button>
                                                            ) : !canRegisterForShift(shift) ? (
                                                                <p className="flex min-h-[28px] items-center justify-center text-center text-[10px] leading-tight text-gray-400">Đã đủ người</p>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    disabled={registering}
                                                                    onClick={() => handleRegister(shift)}
                                                                    className="flex min-h-[28px] w-full items-center justify-center rounded border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-600 transition-colors hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                    Đăng ký
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
                            <div className="border-t border-gray-200 px-4 py-3 text-center text-sm text-gray-500">
                                Không có ca trống trong khoảng thời gian đã chọn.
                            </div>
                        )}
                        </div>
                    </div>
                </Box>
            </Box>

            {/* Popup chọn chức vụ khi đăng ký ca (part-time) */}
            <Dialog
                open={registerModalShift != null}
                onClose={closeRegisterModal}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
                        overflow: 'hidden',
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        pb: 1,
                        pt: 2.5,
                        px: 3,
                        fontWeight: 700,
                        fontSize: '1.125rem',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'grey.50',
                    }}
                >
                    Chọn chức vụ khi đăng ký
                </DialogTitle>
                <DialogContent sx={{ px: 3, py: 2.5 }}>
                    {registerModalShift && (
                        <>
                            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', fontSize: '0.875rem' }}>
                                <Clock3 style={{ width: 18, height: 18 }} />
                                <span>
                                    {dayjs(registerModalShift.startTime).format('dddd, DD/MM')} — {formatTimeRange(registerModalShift.startTime, registerModalShift.endTime)}
                                </span>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.8125rem' }}>
                                Chọn một chức vụ bạn sẽ làm trong ca này (admin sẽ thấy đúng vai trò trong ca):
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {getRegisterableSlots(registerModalShift).map((slot) => {
                                    const selected = registerModalPositionId === slot.positionId;
                                    return (
                                        <button
                                            key={slot.positionId}
                                            type="button"
                                            onClick={() => setRegisterModalPositionId(slot.positionId)}
                                            className={`flex w-full items-center justify-between rounded-md border-2 px-4 py-3 text-left transition-all h-10 ${
                                                selected
                                                    ? 'border-blue-500 bg-blue-50/80'
                                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className="text-sm font-semibold text-gray-800">
                                                {slot.positionName}
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <span className="text-sm text-gray-500">Còn {slot.available} slot</span>
                                                {selected && <Check className="h-5 w-5 shrink-0 text-blue-600" />}
                                            </span>
                                        </button>
                                    );
                                })}
                            </Box>
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                        onClick={closeRegisterModal}
                        variant="outlined"
                        color="inherit"
                        size="medium"
                        sx={{ height: 36, px: 2, py: 1.25, borderRadius: '12px', fontSize: '0.875rem', textTransform: 'none', fontWeight: 600 }}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirmRegister}
                        disabled={registerModalPositionId == null || registering}
                        startIcon={registering ? null : <Check style={{ width: 18, height: 18 }} />}
                        size="medium"
                        sx={{
                            height: 40,
                            px: 3,
                            py: 1.5,
                            borderRadius: '9999px',
                            fontSize: '0.875rem',
                            textTransform: 'none',
                            fontWeight: 600,
                            bgcolor: '#050816',
                            color: '#ffffff',
                            boxShadow: '0 8px 18px rgba(15,23,42,0.35)',
                            '&:hover': {
                                bgcolor: '#020617',
                                boxShadow: '0 10px 20px rgba(15,23,42,0.45)',
                            },
                            '&.Mui-disabled': {
                                bgcolor: '#0f172a',
                                color: '#e5e7eb',
                                opacity: 0.7,
                            },
                        }}
                    >
                        {registering ? 'Đang gửi...' : 'Xác nhận đăng ký'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Popup lý do xin nghỉ (Full-time) */}
            <Dialog
                open={leaveDialogShiftId != null}
                onClose={closeLeaveDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
                        overflow: 'hidden',
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        pb: 1,
                        pt: 2.5,
                        px: 3,
                        fontWeight: 700,
                        fontSize: '1.0625rem',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'grey.50',
                    }}
                >
                    Lý do xin nghỉ
                </DialogTitle>
                <DialogContent sx={{ px: 3, py: 2.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.8125rem' }}>
                        Vui lòng nhập lý do xin nghỉ cho ca này. Thông tin này sẽ được gửi tới quản lý để xem xét.
                    </Typography>
                    <textarea
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        rows={4}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="Ví dụ: Có lịch khám bệnh, việc gia đình đột xuất..."
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                        onClick={closeLeaveDialog}
                        variant="outlined"
                        color="inherit"
                        size="medium"
                        disabled={leaving}
                        sx={{
                            height: 36,
                            px: 2,
                            py: 1.25,
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            textTransform: 'none',
                            fontWeight: 600,
                        }}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirmLeave}
                        disabled={leaving}
                        size="medium"
                        sx={{
                            height: 40,
                            px: 3,
                            py: 1.5,
                            borderRadius: '9999px',
                            fontSize: '0.875rem',
                            textTransform: 'none',
                            fontWeight: 600,
                            bgcolor: '#050816',
                            color: '#ffffff',
                            boxShadow: '0 8px 18px rgba(15,23,42,0.35)',
                            '&:hover': {
                                bgcolor: '#020617',
                                boxShadow: '0 10px 20px rgba(15,23,42,0.45)',
                            },
                            '&.Mui-disabled': {
                                bgcolor: '#0f172a',
                                color: '#e5e7eb',
                                opacity: 0.7,
                            },
                        }}
                    >
                        {leaving ? 'Đang gửi...' : 'Gửi yêu cầu'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
