import { useState, useMemo, Fragment } from 'react';
import { Box, Button, Stack, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import { ListHeader } from '../../../components/ui/ListHeader';
import { prefixAdmin } from '../../../constants/routes';
import { useQueries } from '@tanstack/react-query';
import { useShiftsForAdmin } from '../hooks/useWorkShift';
import { getRegistrationsForShift } from '../../../api/workShift.api';
import type { IWorkShift, IWorkShiftRegistration } from '../../../api/workShift.api';
import type { SummaryMatrix, SlotBlockData } from './workShiftSummaryUtils';
import { buildMatrixByRole } from './workShiftSummaryUtils';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { groupShiftsForSummary, buildSummaryMatrix } from './workShiftSummaryUtils';

/** Màu badge theo chức vụ (pastel nền + chữ đậm). Match theo từ khóa trong tên role. */
const ROLE_BADGE_STYLES: { keyword: string; bg: string; text: string }[] = [
    { keyword: 'chăm sóc', bg: '#eff6ff', text: '#1d4ed8' },
    { keyword: 'bán hàng', bg: '#fff7ed', text: '#c2410c' },
    { keyword: 'thu ngân', bg: '#fff7ed', text: '#c2410c' },
    { keyword: 'spa', bg: '#f5f3ff', text: '#6d28d9' },
    { keyword: 'groomer', bg: '#f5f3ff', text: '#6d28d9' },
];
const DEFAULT_BADGE = { bg: '#f1f5f9', text: '#475569' };
function getRoleBadgeStyle(roleName: string): { bg: string; text: string } {
    const lower = roleName.toLowerCase();
    const found = ROLE_BADGE_STYLES.find((r) => lower.includes(r.keyword));
    return found ?? DEFAULT_BADGE;
}

/** Thứ 2 đầu tuần (0=CN, 1=T2,...) */
function getCurrentWeekMonday() {
    const today = dayjs();
    const d = today.day();
    const daysToMonday = d === 0 ? -6 : 1 - d;
    return today.add(daysToMonday, 'day').startOf('day');
}
/** Mặc định: chỉ tuần hiện tại (T2 → CN). */
function getDefaultRange() {
    const thisMonday = getCurrentWeekMonday();
    const thisSunday = thisMonday.add(6, 'day').endOf('day');
    return { start: thisMonday.toISOString(), end: thisSunday.toISOString() };
}

export const OfficialSchedulePage = () => {
    const defaultRange = getDefaultRange();
    const [from, setFrom] = useState<string>(defaultRange.start);
    const [to, setTo] = useState<string>(defaultRange.end);

    const { data: shifts = [], isLoading: shiftsLoading } = useShiftsForAdmin(from, to);
    /** Chỉ lấy các ca đã chốt/xếp đủ để đưa vào lịch chính thức. */
    const finalizedShifts = useMemo(
        () => (shifts as IWorkShift[]).filter((s) => s.status === 'ASSIGNED' || s.status === 'COMPLETED'),
        [shifts]
    );
    const shiftIds = useMemo(() => finalizedShifts.map((s) => s.shiftId), [finalizedShifts]);

    const registrationQueries = useQueries({
        queries: shiftIds.map((shiftId) => ({
            queryKey: ['work-shift-registrations-summary', shiftId],
            queryFn: async () => {
                const res = await getRegistrationsForShift(shiftId);
                return (res?.data ?? []) as IWorkShiftRegistration[];
            },
            enabled: shiftIds.length > 0,
        })),
    });

    const registrationsByShiftId = useMemo(() => {
        const map: Record<number, IWorkShiftRegistration[]> = {};
        shiftIds.forEach((id, i) => {
            const data = registrationQueries[i]?.data;
            map[id] = Array.isArray(data) ? data : [];
        });
        return map;
    }, [shiftIds, registrationQueries]);

    /** Chia khoảng [from, to] thành các tuần (T2–CN), mỗi tuần có summary matrix riêng. */
    const weeksWithMatrices = useMemo(() => {
        const fromD = dayjs(from).startOf('day');
        const toD = dayjs(to).endOf('day');
        const list: {
            label: string;
            matrix: SummaryMatrix;
            slotBlocks: SlotBlockData[];
            columnLabels: string[];
            columnDates: string[];
        }[] = [];
        let weekStart = fromD;
        while (weekStart.isBefore(toD) || weekStart.isSame(toD, 'day')) {
            const weekEnd = weekStart.add(6, 'day').endOf('day');
            const weekShifts = finalizedShifts.filter((s) => {
                const t = dayjs(s.startTime);
                return (t.isAfter(weekStart) || t.isSame(weekStart)) && (t.isBefore(weekEnd) || t.isSame(weekEnd));
            });
            const summaryData = groupShiftsForSummary(weekShifts, registrationsByShiftId);
            const matrix = buildSummaryMatrix(summaryData);
            const slotBlocks = buildMatrixByRole(matrix);
            const label = `${weekStart.format('DD/MM')} - ${weekEnd.format('DD/MM/YYYY')}`;
            list.push({ label, matrix, slotBlocks, columnLabels: matrix.columnLabels, columnDates: matrix.columnDates });
            weekStart = weekStart.add(7, 'day');
        }
        return list;
    }, [from, to, finalizedShifts, registrationsByShiftId]);
    const loading = shiftsLoading || registrationQueries.some((q) => q.isLoading);

    const shiftWeek = (direction: -1 | 1) => {
        const start = (from ? dayjs(from) : dayjs(defaultRange.start)).startOf('day');
        const newStart = start.add(7 * direction, 'day');
        const newEnd = newStart.add(6, 'day').endOf('day');
        setFrom(newStart.toISOString());
        setTo(newEnd.toISOString());
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <ListHeader
                title="Lịch chính thức"
                breadcrumbItems={[
                    { label: 'Trang chủ', to: '/' },
                    { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                    { label: 'Lịch chính thức' },
                ]}
            />
            <Box sx={{ px: '40px', mb: 2, mt: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                    <DateTimePicker
                        label="Từ ngày"
                        value={from ? dayjs(from) : null}
                        onChange={(d) => setFrom(d?.toISOString() ?? '')}
                        slotProps={{ textField: { size: 'small' } }}
                    />
                    <DateTimePicker
                        label="Đến ngày"
                        value={to ? dayjs(to) : null}
                        onChange={(d) => setTo(d?.toISOString() ?? '')}
                        slotProps={{ textField: { size: 'small' } }}
                    />
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => shiftWeek(-1)}
                    >
                        {'<'}
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                            const r = getDefaultRange();
                            setFrom(r.start);
                            setTo(r.end);
                        }}
                    >
                        Về tuần hiện tại
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => shiftWeek(1)}
                    >
                        {'>'}
                    </Button>
                </Stack>
            </Box>

            <Box sx={{ px: '40px', mb: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
                        <CircularProgress />
                    </Box>
                ) : shifts.length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                        Chưa có dữ liệu.
                    </Typography>
                ) : (
                    <Stack spacing={3}>
                        {weeksWithMatrices.map(({ label, slotBlocks, columnLabels, columnDates }, weekIndex) => (
                            <Box key={weekIndex}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                                    Tuần {label}
                                </Typography>
                                <TableContainer
                                    className="w-full"
                                    sx={{
                                        border: '1px solid',
                                        borderColor: 'grey.200',
                                        borderRadius: 2,
                                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
                                    }}
                                >
                                    <Table
                                        size="small"
                                        stickyHeader
                                        className="w-full table-fixed"
                                        sx={{
                                            tableLayout: 'fixed',
                                            width: '100%',
                                            minWidth: 0,
                                            borderCollapse: 'separate',
                                            borderSpacing: 0,
                                        }}
                                    >
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                                {columnLabels.map((colLabel, i) => (
                                                    <TableCell
                                                        key={i}
                                                        align="center"
                                                        className="text-base font-bold text-gray-900"
                                                        sx={{
                                                            borderColor: 'grey.200',
                                                            py: 1.75,
                                                            px: 2.25,
                                                        }}
                                                    >
                                                        <Box className="text-base font-bold text-gray-900">{colLabel}</Box>
                                                        <Box className="text-base font-bold text-gray-900 mt-0.5">
                                                            {columnDates[i] ?? '—'}
                                                        </Box>
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {slotBlocks.map((block, blockIndex) => (
                                                <Fragment key={blockIndex}>
                                                    {/* Hàng tiêu đề cho từng ca, chỉ hiển thị tên ca */}
                                                    <TableRow
                                                        sx={{
                                                            bgcolor: 'rgb(226 232 240)', // slate-200
                                                            '& td': {
                                                                borderBottom: '1px solid',
                                                                borderColor: 'grey.200',
                                                            },
                                                        }}
                                                    >
                                                        <TableCell
                                                            colSpan={columnLabels.length}
                                                            sx={{
                                                                py: 1.5,
                                                                px: 2,
                                                                borderColor: 'grey.200',
                                                            }}
                                                        >
                                                            <Box className="flex items-center justify-center">
                                                                <Typography
                                                                    component="div"
                                                                    className="text-sm md:text-base font-extrabold tracking-wide text-slate-800 uppercase text-center truncate"
                                                                >
                                                                    {block.slotLabel}
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>

                                                    {/* Hàng dữ liệu: một ô cho mỗi ngày, chứa các thẻ nhân viên */}
                                                    <TableRow
                                                        sx={{
                                                            bgcolor: 'background.paper',
                                                            '& td': { borderBottom: '1px solid', borderColor: 'grey.200' },
                                                        }}
                                                    >
                                                        {columnLabels.map((_, dayIndex) => {
                                                            const hasAny = block.roleRows.some(
                                                                (roleRow) => (roleRow.cellsByDay[dayIndex] ?? []).length > 0,
                                                            );
                                                            const timeLabel = block.timeRangeByDay?.[dayIndex] ?? '';

                                                            return (
                                                                <TableCell
                                                                    key={dayIndex}
                                                                    align="left"
                                                                    sx={{
                                                                        verticalAlign: 'top',
                                                                        borderColor: 'grey.200',
                                                                        py: 1.5,
                                                                        px: 2.0,
                                                                    }}
                                                                >
                                                                    <Box className="flex flex-col gap-2">
                                                                        {timeLabel && (
                                                                            <Box className="w-full text-center text-sm md:text-base font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg py-2 mb-2 shadow-sm truncate">
                                                                                {timeLabel}
                                                                            </Box>
                                                                        )}

                                                                        {!hasAny ? (
                                                                            <Typography
                                                                                variant="body2"
                                                                                color="text.disabled"
                                                                                className="text-xs"
                                                                            >
                                                                                —
                                                                            </Typography>
                                                                        ) : (
                                                                            <Box className="flex flex-col gap-2">
                                                                                {block.roleRows.map((roleRow) => {
                                                                                    const names = roleRow.cellsByDay[dayIndex] ?? [];
                                                                                    if (!names.length) return null;

                                                                                    const style = getRoleBadgeStyle(roleRow.roleName);

                                                                                    return (
                                                                                        <Box
                                                                                            key={`${roleRow.roleName}-${dayIndex}`}
                                                                                            className="rounded-md border border-slate-200 p-2 shadow-sm"
                                                                                            style={{ backgroundColor: style.bg }}
                                                                                        >
                                                                                            <Typography
                                                                                                component="div"
                                                                                                className="text-[10px] font-semibold uppercase tracking-wide break-words"
                                                                                                style={{ color: style.text }}
                                                                                            >
                                                                                                {roleRow.roleName === '—'
                                                                                                    ? 'Chức vụ khác'
                                                                                                    : roleRow.roleName}
                                                                                            </Typography>
                                                                                            <Box className="mt-1 space-y-0.5">
                                                                                                {names.map((name, i) => (
                                                                                                <Typography
                                                                                                    key={i}
                                                                                                    component="div"
                                                                                                    className="text-xs text-slate-800 leading-snug truncate"
                                                                                                >
                                                                                                    • {name}
                                                                                                </Typography>
                                                                                                ))}
                                                                                            </Box>
                                                                                        </Box>
                                                                                    );
                                                                                })}
                                                                            </Box>
                                                                        )}
                                                                    </Box>
                                                                </TableCell>
                                                            );
                                                        })}
                                                    </TableRow>
                                                </Fragment>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        ))}
                    </Stack>
                )}
            </Box>
        </LocalizationProvider>
    );
};
