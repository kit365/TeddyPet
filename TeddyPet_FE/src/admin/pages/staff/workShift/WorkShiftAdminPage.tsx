import { useState, useEffect, useMemo } from 'react';
import { Box, Button, Stack, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { ListHeader } from '../../../components/ui/ListHeader';
import { prefixAdmin } from '../../../constants/routes';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateOpenShift, useCreateOpenShiftsBatch, useUpdateOpenShift, useCancelOpenShift, useAvailableShifts, useRegistrationsForShift, useApproveRegistration } from '../hooks/useWorkShift';
import { toast } from 'react-toastify';
import type { IWorkShift, IWorkShiftRegistration, IOpenShiftRequest } from '../../../api/workShift.api';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import Cookies from 'js-cookie';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../../../api/auth.api';

const STATUS_LABELS: Record<string, string> = { OPEN: 'Trống', ASSIGNED: 'Đã gán', COMPLETED: 'Hoàn thành', CANCELLED: 'Hủy' };
const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const ROW_LABELS = ['Sáng', 'Chiều'];

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
    const [editShift, setEditShift] = useState<IWorkShift | null>(null);
    const [editStart, setEditStart] = useState<string>('');
    const [editEnd, setEditEnd] = useState<string>('');
    const [deleteConfirmShiftId, setDeleteConfirmShiftId] = useState<number | null>(null);

    const queryClient = useQueryClient();
    const { data: shifts = [], isLoading } = useAvailableShifts(from, to);
    const { data: registrations = [], isLoading: regLoading } = useRegistrationsForShift(selectedShiftId);
    const { mutate: createShift, isPending: creating, isError: createError, error: createErrorObj, reset: resetCreateMutation } = useCreateOpenShift();
    const { mutate: createBatch, isPending: creatingBatch, isError: batchError, error: batchErrorObj, reset: resetBatchMutation } = useCreateOpenShiftsBatch();
    const { mutate: updateShift, isPending: updating } = useUpdateOpenShift();
    const { mutate: cancelShift, isPending: cancelling } = useCancelOpenShift();
    const { mutate: approve } = useApproveRegistration();

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
                                ['available-shifts', from, to],
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
                    queryClient.invalidateQueries({ queryKey: ['available-shifts', from, to] });
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
                    } else toast.error(res?.message ?? 'Có lỗi');
                },
            }
        );
    };

    const openEditDialog = (row: IWorkShift) => {
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
                        queryClient.invalidateQueries({ queryKey: ['available-shifts', from, to] });
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
                    queryClient.invalidateQueries({ queryKey: ['available-shifts', from, to] });
                } else toast.error(res?.message ?? 'Có lỗi');
            },
            onError: (err: any) => {
                toast.error(getErrorMessage(err, 'Hủy ca thất bại'));
            },
        });
    };

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
                                <TableCell sx={{ width: 160, py: 2, fontWeight: 700, fontSize: '1rem', borderColor: 'rgba(255,255,255,0.2)' }}>
                                    Buổi / Ngày
                                </TableCell>
                                {DAY_LABELS.map((label, i) => (
                                    <TableCell key={i} align="center" sx={{ py: 2, fontWeight: 700, fontSize: '1rem', borderColor: 'rgba(255,255,255,0.2)' }}>
                                        {label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {ROW_LABELS.map((rowLabel, slotIndex) => (
                                <TableRow key={slotIndex} sx={{ bgcolor: slotIndex === 0 ? 'background.paper' : 'grey.50' }}>
                                    <TableCell sx={{ width: 160, py: 2, fontWeight: 600, fontSize: '0.9375rem', color: 'text.secondary' }}>
                                        {rowLabel}
                                    </TableCell>
                                    {DAY_LABELS.map((_, dayIndex) => {
                                        const shift = timetableGrid[slotIndex]?.[dayIndex];
                                        return (
                                            <TableCell key={dayIndex} align="center" sx={{ py: 2, minWidth: 130 }}>
                                                {isLoading ? (
                                                    <Typography sx={{ fontSize: '0.875rem' }} color="text.secondary">Đang tải...</Typography>
                                                ) : shift ? (
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                                        <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                                                            {formatTimeRange(shift.startTime, shift.endTime)}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.8125rem' }} color="text.secondary">
                                                            #{shift.shiftId} · {STATUS_LABELS[shift.status] ?? shift.status}
                                                            {shift.staffFullName ? ` · ${shift.staffFullName}` : ''}
                                                        </Typography>
                                                        <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
                                                            {shift.status === 'OPEN' && (
                                                                <>
                                                                    <Button size="small" variant="outlined" sx={{ px: 1.25, fontSize: '0.8125rem' }} onClick={() => openEditDialog(shift)}>Sửa</Button>
                                                                    <Button size="small" color="error" variant="outlined" sx={{ px: 1.25, fontSize: '0.8125rem' }} onClick={() => setDeleteConfirmShiftId(shift.shiftId)}>Xóa</Button>
                                                                </>
                                                            )}
                                                            <Button size="small" variant="contained" disableElevation sx={{ px: 1.25, fontSize: '0.8125rem' }} onClick={() => setSelectedShiftId(shift.shiftId)}>Xem đăng ký</Button>
                                                        </Stack>
                                                    </Box>
                                                ) : (
                                                    <Typography sx={{ fontSize: '0.875rem' }} color="text.disabled">—</Typography>
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

            <Box sx={{ px: '40px', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {selectedShiftId && (
                    <Box sx={{ minWidth: 320, p: 2, border: '1px solid #919eab33', borderRadius: 2 }}>
                        <strong>Đăng ký ca #{selectedShiftId}</strong>
                        {regLoading ? <p>Đang tải...</p> : (
                            <Stack spacing={1} sx={{ mt: 2 }}>
                                {(registrations as IWorkShiftRegistration[]).map((r) => (
                                    <Box key={r.registrationId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{r.staffFullName} ({r.status})</span>
                                        {r.status === 'PENDING' && (
                                            <Button size="small" variant="contained" onClick={() => handleApprove(r.registrationId)}>Duyệt</Button>
                                        )}
                                    </Box>
                                ))}
                                {registrations.length === 0 && <span>Chưa có đăng ký</span>}
                            </Stack>
                        )}
                        <Button size="small" sx={{ mt: 2 }} onClick={() => setSelectedShiftId(null)}>Đóng</Button>
                    </Box>
                )}

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
            </Box>
        </LocalizationProvider>
    );
};
