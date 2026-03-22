import { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography, Stack, Chip, Paper, alpha } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { CalendarClock, Check, Clock3 } from 'lucide-react';
import { Icon } from '@iconify/react';
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
import DashboardCard from '../../../components/dashboard/DashboardCard';

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
    // Removed unused isFullTime

    const { data: availableShifts = [], isLoading: loadingAvailable } = useAvailableShifts(from, to);
    const { data: myShifts = [] } = useMyShifts(from, to);
    const { data: myRegistrationsRaw = [] } = useMyRegistrations(from, to);
    const myRegistrations = myRegistrationsRaw as IWorkShiftRegistration[];
    const { mutate: registerForShift, isPending: registering } = useRegisterForShift();
    const { mutate: requestLeave, isPending: leaving } = useRequestLeave();
    const { mutate: undoLeave } = useUndoLeave();
    const { mutate: cancelMyRegistration } = useCancelMyRegistration();
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
    /** 'PENDING_LEAVE' = Chờ duyệt, 'ON_LEAVE' = Đã được duyệt nghỉ */
    const leaveStatusByShiftId = useMemo(() => {
        const m: Record<number, 'PENDING_LEAVE' | 'ON_LEAVE'> = {};
        for (const r of myRegistrations) {
            if (r.status === 'PENDING_LEAVE' || r.status === 'ON_LEAVE') m[r.workShiftId] = r.status;
        }
        return m;
    }, [myRegistrations]);

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
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'contents' }}>
                <ListHeader
                    title="Đăng ký làm việc (Staff)"
                    titleSx={{ fontSize: '1.25rem', fontWeight: 800 }}
                    breadcrumbItems={[
                        { label: 'Trang chủ', to: '/' },
                        { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                        { label: 'Ca làm việc' },
                    ]}
                />
                
                <Box sx={{ px: { xs: 2, sm: 3, md: 5 }, py: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
                    {/* Welcome/Info Card */}
                    <DashboardCard sx={{ mb: 4, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.dark', color: 'common.white' }}>
                        <Stack spacing={0.5}>
                            <Typography variant="h5" sx={{ fontWeight: 800 }}>Xin chào, {myProfile?.fullName || 'nhân viên'}!</Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                Bạn đang xem lịch làm việc cho tuần: <Box component="span" sx={{ fontWeight: 700 }}>{dayjs(from).format('DD/MM')} - {dayjs(to).format('DD/MM/YYYY')}</Box>
                            </Typography>
                        </Stack>
                        <Box sx={{ p: 1.5, borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.1)' }}>
                            <CalendarClock size={32} />
                        </Box>
                    </DashboardCard>

                    {/* Main Timetable */}
                    <Box sx={{ mb: 4 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <Icon icon="solar:calendar-date-bold-duotone" width={24} style={{ color: 'var(--palette-primary-main)' }} />
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>Lịch làm việc trong tuần</Typography>
                        </Stack>

                        <DashboardCard sx={{ overflow: 'hidden', border: (theme) => `1px solid ${theme.palette.divider}` }}>
                            <Box sx={{ minWidth: 900 }}>
                                {/* Table Header Row */}
                                <Box sx={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: '100px repeat(7, 1fr)',
                                    bgcolor: 'background.neutral',
                                    borderBottom: (theme) => `1px solid ${theme.palette.divider}`
                                }}>
                                    <Box sx={{ p: 2, textAlign: 'center', fontWeight: 700, borderRight: (theme) => `1px solid ${theme.palette.divider}` }}>
                                        Buổi
                                    </Box>
                                    {DAY_LABELS.map((label, idx) => {
                                        const date = dayjs(from).add(idx, 'day');
                                        return (
                                            <Box key={label} sx={{ p: 2, textAlign: 'center', borderRight: idx < 6 ? (theme) => `1px solid ${theme.palette.divider}` : 0 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{label}</Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{date.format('DD/MM')}</Typography>
                                            </Box>
                                        );
                                    })}
                                </Box>

                                {/* Table Body Rows */}
                                <Box sx={{ p: 0 }}>
                                    {ROW_LABELS.map((rowLabel, slotIndex) => (
                                        <Box key={rowLabel} sx={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: '100px repeat(7, 1fr)',
                                            borderBottom: slotIndex === 0 ? (theme) => `1px solid ${theme.palette.divider}` : 0
                                        }}>
                                            {/* Row Slot Index Label */}
                                            <Box sx={{ 
                                                p: 2, 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                bgcolor: 'background.neutral',
                                                fontWeight: 700,
                                                borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                                                color: 'text.secondary'
                                            }}>
                                                {rowLabel}
                                            </Box>

                                            {/* Data Cells */}
                                            {DAY_LABELS.map((_, dayIndex) => {
                                                const shift = timetableGrid[slotIndex]?.[dayIndex];
                                                const cellKey = `slot-${slotIndex}-day-${dayIndex}`;

                                                if (loadingAvailable) {
                                                    return (
                                                        <Box key={cellKey} sx={{ p: 1, minHeight: 140, borderRight: dayIndex < 6 ? (theme) => `1px solid ${theme.palette.divider}` : 0 }}>
                                                            <Stack sx={{ height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                                                <Box className="animate-pulse" sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'action.hover' }} />
                                                            </Stack>
                                                        </Box>
                                                    );
                                                }

                                                if (!shift) {
                                                    return (
                                                        <Box key={cellKey} sx={{ p: 1, minHeight: 140, borderRight: dayIndex < 6 ? (theme) => `1px solid ${theme.palette.divider}` : 0, bgcolor: alpha('#919EAB', 0.04) }}>
                                                            <Stack sx={{ height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                                                <Typography variant="caption" sx={{ color: 'text.disabled' }}>—</Typography>
                                                            </Stack>
                                                        </Box>
                                                    );
                                                }

                                                const isWorking = myShiftIds.has(shift.shiftId);
                                                const regStatus = leaveStatusByShiftId[shift.shiftId]; // 'PENDING_LEAVE' | 'ON_LEAVE'
                                                const isPendingReg = myPendingRegistrationShiftIds.has(shift.shiftId) || registeredShiftIds.has(shift.shiftId);
                                                const isCancelledReg = cancelledShiftIds.has(shift.shiftId);
                                                
                                                // Styles based on state
                                                let cellBg = 'background.paper';
                                                let cellBorder = alpha('#919EAB', 0.2);
                                                
                                                if (isWorking) {
                                                    cellBg = alpha('#00A76F', 0.08);
                                                    cellBorder = alpha('#00A76F', 0.16);
                                                } else if (isPendingReg && !isCancelledReg) {
                                                    cellBg = alpha('#FFAB00', 0.08);
                                                    cellBorder = alpha('#FFAB00', 0.16);
                                                }

                                                if (regStatus === 'ON_LEAVE') {
                                                    cellBg = alpha('#FF5630', 0.04);
                                                    cellBorder = alpha('#FF5630', 0.08);
                                                }

                                                return (
                                                    <Box key={shift.shiftId} sx={{ p: 1, minHeight: 140, borderRight: dayIndex < 6 ? (theme) => `1px solid ${theme.palette.divider}` : 0 }}>
                                                        <Paper
                                                            elevation={0}
                                                            sx={{
                                                                p: 1.5,
                                                                height: '100%',
                                                                borderRadius: '12px',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                justifyContent: 'space-between',
                                                                bgcolor: cellBg,
                                                                border: `1px solid ${cellBorder}`,
                                                                transition: 'transform 0.2s',
                                                                '&:hover': { transform: 'translateY(-2px)' }
                                                            }}
                                                        >
                                                            <Box>
                                                                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                                                                    <Clock3 size={14} style={{ color: 'var(--palette-text-disabled)' }} />
                                                                    <Typography variant="caption" sx={{ fontWeight: 800 }}>
                                                                        {formatTimeRange(shift.startTime, shift.endTime)}
                                                                    </Typography>
                                                                </Stack>
                                                                
                                                                {isWorking && regStatus !== 'ON_LEAVE' && (
                                                                    <Chip label="Đang làm" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '10px', fontWeight: 800 }} />
                                                                )}
                                                                {isWorking && regStatus === 'ON_LEAVE' && (
                                                                    <Chip label="Đã duyệt nghỉ" size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: '10px', fontWeight: 800 }} />
                                                                )}
                                                                {isPendingReg && !isCancelledReg && (
                                                                    <Chip label="Chờ duyệt" size="small" color="warning" variant="outlined" sx={{ height: 20, fontSize: '10px', fontWeight: 800 }} />
                                                                )}
                                                            </Box>

                                                            <Box sx={{ mt: 'auto', pt: 1 }}>
                                                                {isWorking && regStatus !== 'ON_LEAVE' && (
                                                                    <Button 
                                                                        fullWidth 
                                                                        size="small" 
                                                                        variant="contained" 
                                                                        color="error" 
                                                                        onClick={() => openLeaveDialog(shift.shiftId)}
                                                                        disabled={regStatus === 'PENDING_LEAVE'}
                                                                        sx={{ fontSize: '10px', fontWeight: 700 }}
                                                                    >
                                                                        {regStatus === 'PENDING_LEAVE' ? 'Đang gửi...' : 'Xin nghỉ'}
                                                                    </Button>
                                                                )}
                                                                {isWorking && regStatus === 'PENDING_LEAVE' && (
                                                                    <Button 
                                                                        fullWidth 
                                                                        size="small" 
                                                                        variant="outlined" 
                                                                        color="warning" 
                                                                        onClick={() => handleUndoLeave(shift.shiftId)}
                                                                        sx={{ fontSize: '10px', fontWeight: 700 }}
                                                                    >
                                                                        Hủy xin nghỉ
                                                                    </Button>
                                                                )}
                                                                {!isWorking && isPendingReg && !isCancelledReg && (
                                                                    <Button 
                                                                        fullWidth 
                                                                        size="small" 
                                                                        variant="outlined" 
                                                                        color="inherit" 
                                                                        onClick={() => handleCancelRegistration(shift.shiftId)}
                                                                        sx={{ fontSize: '10px', fontWeight: 700 }}
                                                                    >
                                                                        Hoàn tác
                                                                    </Button>
                                                                )}
                                                                {!isWorking && !isPendingReg && canRegisterForShift(shift) && (
                                                                    <Button 
                                                                        fullWidth 
                                                                        size="small" 
                                                                        variant="contained" 
                                                                        color="primary" 
                                                                        onClick={() => handleRegister(shift)}
                                                                        sx={{ fontSize: '10px', fontWeight: 700 }}
                                                                    >
                                                                        Đăng ký
                                                                    </Button>
                                                                )}
                                                                {!isWorking && !isPendingReg && !canRegisterForShift(shift) && (
                                                                    <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center', display: 'block' }}>Hết slot</Typography>
                                                                )}
                                                            </Box>
                                                        </Paper>
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </DashboardCard>
                    </Box>

                    {availableShifts.length === 0 && !loadingAvailable && (
                        <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                            <Typography variant="body2">Không có ca trống trong khoảng thời gian này.</Typography>
                        </Box>
                    )}
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
                                            className={`flex w-full items-center justify-between rounded-md border-2 px-4 py-3 text-left transition-all h-20 ${
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
        </LocalizationProvider>
    );
};
