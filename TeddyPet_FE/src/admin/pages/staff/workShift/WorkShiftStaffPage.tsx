import { useMemo, useState, useCallback } from 'react';
import { Box, Button, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { ListHeader } from '../../../components/ui/ListHeader';
import { prefixAdmin } from '../../../constants/routes';
import { useAvailableShifts, useRegisterForShift, useMyShifts } from '../hooks/useWorkShift';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import type { IWorkShift } from '../../../api/workShift.api';
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

    const { data: availableShifts = [], isLoading: loadingAvailable } = useAvailableShifts(from, to);
    const { data: myShifts = [], isLoading: loadingMy } = useMyShifts(from, to);
    const { mutate: registerForShift, isPending: registering } = useRegisterForShift();
    const [registeredShiftIds, setRegisteredShiftIds] = useState<Set<number>>(() => new Set());

    const myShiftIds = useMemo(() => new Set(myShifts.map((s) => s.shiftId)), [myShifts]);
    const isRegistered = useCallback(
        (shiftId: number) => myShiftIds.has(shiftId) || registeredShiftIds.has(shiftId),
        [myShiftIds, registeredShiftIds]
    );

    /** Lưới 2x7: grid[slotIndex][dayIndex] = IWorkShift | null (chỉ tuần chứa from) */
    const timetableGrid = useMemo(() => {
        const grid: (IWorkShift | null)[][] = [
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

    return (
        <>
            <ListHeader
                title="Đăng ký ca làm việc"
                breadcrumbItems={[
                    { label: 'Trang chủ', to: '/' },
                    { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                    { label: 'Đăng ký ca' },
                ]}
            />
            <Box sx={{ px: { xs: 2, sm: 3, md: '40px' }, pb: 3 }}>
                {/* Thời khóa biểu: Ca trống có thể đăng ký */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
                        Ca trống có thể đăng ký
                    </Typography>
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
                                    <TableCell sx={{ width: 160, py: 2.5, fontWeight: 700, fontSize: '1.125rem', borderColor: 'rgba(255,255,255,0.2)' }}>
                                        Buổi / Ngày
                                    </TableCell>
                                    {DAY_LABELS.map((label, i) => (
                                        <TableCell key={i} align="center" sx={{ py: 2.5, fontWeight: 700, fontSize: '1.125rem', borderColor: 'rgba(255,255,255,0.2)' }}>
                                            {label}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ROW_LABELS.map((rowLabel, slotIndex) => (
                                    <TableRow key={slotIndex} sx={{ bgcolor: slotIndex === 0 ? 'background.paper' : 'grey.50' }}>
                                        <TableCell sx={{ width: 160, py: 2.5, fontWeight: 600, fontSize: '1.125rem', color: 'text.secondary' }}>
                                            {rowLabel}
                                        </TableCell>
                                        {DAY_LABELS.map((_, dayIndex) => {
                                            const shift = timetableGrid[slotIndex]?.[dayIndex];
                                            return (
                                                <TableCell key={dayIndex} align="center" sx={{ py: 2.5, minWidth: 130 }}>
                                                    {loadingAvailable ? (
                                                        <Typography sx={{ fontSize: '1.0625rem' }} color="text.secondary">Đang tải...</Typography>
                                                    ) : shift ? (
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.25 }}>
                                                            <Typography sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
                                                                {formatTimeRange(shift.startTime, shift.endTime)}
                                                            </Typography>
                                                            {isRegistered(shift.shiftId) ? (
                                                                <Typography
                                                                    component="span"
                                                                    sx={{
                                                                        fontSize: '1rem',
                                                                        fontWeight: 600,
                                                                        color: 'success.main',
                                                                        py: 0.75,
                                                                        px: 1.5,
                                                                    }}
                                                                >
                                                                    Đã đăng ký
                                                                </Typography>
                                                            ) : (
                                                                <Button
                                                                    size="medium"
                                                                    variant="contained"
                                                                    disableElevation
                                                                    disabled={registering}
                                                                    onClick={() => handleRegister(shift.shiftId)}
                                                                    sx={{ fontSize: '1rem', py: 0.75, px: 1.5 }}
                                                                >
                                                                    Đăng ký ca
                                                                </Button>
                                                            )}
                                                        </Box>
                                                    ) : (
                                                        <Typography sx={{ fontSize: '1.0625rem' }} color="text.disabled">—</Typography>
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {availableShifts.length === 0 && !loadingAvailable && (
                            <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary', fontSize: '1.0625rem' }}>
                                Không có ca trống trong khoảng thời gian đã chọn.
                            </Box>
                        )}
                    </TableContainer>
                </Box>

                {/* Ca của tôi */}
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
                        Ca của tôi (đã được phân bổ)
                    </Typography>
                    <Box
                        sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        }}
                    >
                        {loadingMy ? (
                            <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary', fontSize: '1.0625rem' }}>Đang tải...</Box>
                        ) : myShifts.length === 0 ? (
                            <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary', fontSize: '1.0625rem' }}>
                                Bạn chưa có ca nào được phân bổ trong khoảng thời gian này.
                            </Box>
                        ) : (
                            <TableContainer>
                            <Table size="medium">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                                        <TableCell sx={{ fontWeight: 600, fontSize: '1.0625rem', py: 1.5 }}>Ngày</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: '1.0625rem', py: 1.5 }}>Giờ</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: '1.0625rem', py: 1.5 }}>Trạng thái</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {myShifts.map((s) => (
                                        <TableRow key={s.shiftId}>
                                            <TableCell sx={{ fontSize: '1.0625rem', py: 1.5 }}>{dayjs(s.startTime).locale('vi').format('dddd DD/MM/YYYY')}</TableCell>
                                            <TableCell sx={{ fontSize: '1.0625rem', py: 1.5 }}>{formatTimeRange(s.startTime, s.endTime)}</TableCell>
                                            <TableCell sx={{ fontSize: '1.0625rem', py: 1.5 }}>
                                                {s.status === 'OPEN' ? 'Trống' : s.status === 'ASSIGNED' ? 'Đã gán' : s.status === 'COMPLETED' ? 'Hoàn thành' : s.status}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            </TableContainer>
                        )}
                    </Box>
                </Box>
            </Box>
        </>
    );
};
