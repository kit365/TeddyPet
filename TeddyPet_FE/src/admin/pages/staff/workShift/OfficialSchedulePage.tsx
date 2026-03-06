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
    const shiftIds = useMemo(() => (shifts as IWorkShift[]).map((s) => s.shiftId), [shifts]);

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
            const weekShifts = (shifts as IWorkShift[]).filter((s) => {
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
    }, [from, to, shifts, registrationsByShiftId]);
    const loading = shiftsLoading || registrationQueries.some((q) => q.isLoading);

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
            <Box sx={{ px: '40px', mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Chọn khoảng thời gian để xem lịch (mặc định: tuần hiện tại; có thể tìm tuần sau hoặc các tuần trước).
                </Typography>
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
                        onClick={() => {
                            const r = getDefaultRange();
                            setFrom(r.start);
                            setTo(r.end);
                        }}
                    >
                        Về tuần hiện tại
                    </Button>
                </Stack>
            </Box>

            <Box sx={{ px: '40px', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Bảng tổng hợp ca trong tuần
                </Typography>
                {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
                        <CircularProgress />
                    </Box>
                ) : shifts.length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                        Chưa có lịch chính thức
                    </Typography>
                ) : (
                    <Stack spacing={3}>
                        {weeksWithMatrices.map(({ label, slotBlocks, columnLabels, columnDates }, weekIndex) => (
                            <Box key={weekIndex}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                                    Tuần {label}
                                </Typography>
                                <TableContainer
                                    sx={{
                                        maxHeight: 520,
                                        border: '1px solid',
                                        borderColor: 'grey.200',
                                        borderRadius: 2,
                                        overflowX: 'auto',
                                        overflowY: 'auto',
                                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
                                    }}
                                >
                                    <Table
                                        size="small"
                                        stickyHeader
                                        sx={{
                                            tableLayout: 'auto',
                                            minWidth: 160 + 7 * 200,
                                            borderCollapse: 'separate',
                                            borderSpacing: 0,
                                        }}
                                    >
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                                <TableCell
                                                    className="text-base font-bold text-gray-900"
                                                    sx={{
                                                        width: 160,
                                                        borderColor: 'grey.200',
                                                        py: 1.75,
                                                        px: 2.25,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.04em',
                                                    }}
                                                >
                                                    Buổi / Ngày
                                                </TableCell>
                                                {columnLabels.map((colLabel, i) => (
                                                    <TableCell
                                                        key={i}
                                                        align="center"
                                                        className="text-base font-bold text-gray-900"
                                                        sx={{
                                                            borderColor: 'grey.200',
                                                            py: 1.75,
                                                            px: 2.25,
                                                            minWidth: 200,
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
                                                    <TableRow
                                                        sx={{
                                                            bgcolor: 'grey.100',
                                                            '& td': { borderBottom: '1px solid', borderColor: 'grey.200' },
                                                        }}
                                                    >
                                                        <TableCell
                                                            className="text-lg font-bold text-gray-900"
                                                            sx={{
                                                                width: 160,
                                                                py: 1.1,
                                                                px: 2.25,
                                                                borderColor: 'grey.200',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            {block.slotLabel}
                                                        </TableCell>
                                                        {columnLabels.map((_, dayIndex) => (
                                                            <TableCell
                                                                key={dayIndex}
                                                                align="center"
                                                                className="text-base font-semibold text-gray-800"
                                                                sx={{
                                                                    borderColor: 'grey.200',
                                                                    py: 1.1,
                                                                    px: 2.25,
                                                                    minWidth: 200,
                                                                    verticalAlign: 'middle',
                                                                }}
                                                            >
                                                                <Typography component="div" className="text-base font-semibold text-gray-800">
                                                                    {block.timeRangeByDay?.[dayIndex] ?? '—'}
                                                                </Typography>
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                    {block.roleRows.map((roleRow, roleIndex) => (
                                                        <TableRow
                                                            key={`${blockIndex}-${roleRow.roleName}-${roleIndex}`}
                                                            sx={{
                                                                bgcolor: 'background.paper',
                                                            '& td': { borderBottom: '1px solid', borderColor: 'grey.200' },
                                                            }}
                                                        >
                                                            <TableCell
                                                                sx={{
                                                                    width: 160,
                                                                    verticalAlign: 'top',
                                                                    borderColor: 'grey.200',
                                                                py: 1.5,
                                                                px: 2.25,
                                                                }}
                                                            >
                                                                <Typography
                                                                    component="div"
                                                                    className="text-sm font-semibold text-gray-700"
                                                                    sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}
                                                                >
                                                                    {roleRow.roleName === '—' ? 'Chức vụ khác' : roleRow.roleName}
                                                                </Typography>
                                                            </TableCell>
                                                            {roleRow.cellsByDay.map((names, dayIndex) => (
                                                                <TableCell
                                                                    key={dayIndex}
                                                                    align="left"
                                                                    sx={{
                                                                        verticalAlign: 'top',
                                                                        borderColor: 'grey.200',
                                                                        py: 1.5,
                                                                        px: 2.25,
                                                                        minWidth: 200,
                                                                    }}
                                                                >
                                                                    {names.length === 0 ? (
                                                                        <Typography variant="body2" color="text.disabled">
                                                                            —
                                                                        </Typography>
                                                                    ) : (
                                                                        <Box
                                                                            className="rounded-lg border border-gray-200 p-3"
                                                                            style={{ backgroundColor: getRoleBadgeStyle(roleRow.roleName).bg }}
                                                                        >
                                                                            <Typography
                                                                                component="div"
                                                                                className="text-[13px] font-bold uppercase tracking-wide"
                                                                                style={{ color: getRoleBadgeStyle(roleRow.roleName).text }}
                                                                            >
                                                                                {roleRow.roleName === '—' ? 'Chức vụ khác' : roleRow.roleName}
                                                                            </Typography>
                                                                            <Box className="mt-2 flex flex-col gap-1">
                                                                                {names.map((name, i) => (
                                                                                    <Typography key={i} component="div" className="text-sm font-medium text-gray-800 leading-snug">
                                                                                        • {name}
                                                                                    </Typography>
                                                                                ))}
                                                                            </Box>
                                                                        </Box>
                                                                    )}
                                                                </TableCell>
                                                            ))}
                                                        </TableRow>
                                                    ))}
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
