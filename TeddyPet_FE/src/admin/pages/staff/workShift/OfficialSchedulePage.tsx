import { useState, useMemo, Fragment } from 'react';
import { Box, Button, Stack, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Tooltip } from '@mui/material';
import { ListHeader } from '../../../components/ui/ListHeader';
import { prefixAdmin } from '../../../constants/routes';
import { useQueries } from '@tanstack/react-query';
import { useShiftsForAdmin } from '../hooks/useWorkShift';
import { getRegistrationsForShift } from '../../../api/workShift.api';
import type { IWorkShift, IWorkShiftRegistration } from '../../../api/workShift.api';
import type { SummaryMatrix, SlotBlockData } from './workShiftSummaryUtils';
import { buildMatrixByRole, getRoleBadgeStyle, groupShiftsForSummary, buildSummaryMatrix } from './workShiftSummaryUtils';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

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
            staleTime: 2 * 60 * 1000, // 2 phút: vào lại trang dùng cache, không load lại
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
    const loading =
        (shiftsLoading && finalizedShifts.length === 0) ||
        (shiftIds.length > 0 && registrationQueries.some((q) => q.isLoading) && registrationQueries.every((q) => q.data === undefined));

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
                <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    flexWrap="wrap"
                    sx={{
                        '& .MuiInputBase-root': { borderRadius: 1, minHeight: 32, '& .MuiInputBase-input': { py: 0.75 } },
                        '& .MuiButton-root': {
                            minHeight: 32,
                            height: 32,
                            minWidth: 32,
                            px: 1.5,
                            py: 0.75,
                            fontSize: '0.8125rem',
                            textTransform: 'none',
                            borderRadius: 1,
                        },
                    }}
                >
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
                    <Button variant="outlined" size="small" onClick={() => shiftWeek(-1)} sx={{ minWidth: 32 }}>
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
                        sx={{ minWidth: 'auto', px: 1.5 }}
                    >
                        Về tuần hiện tại
                    </Button>
                    <Button variant="outlined" size="small" onClick={() => shiftWeek(1)} sx={{ minWidth: 32 }}>
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
                    <Typography className="py-4 text-center text-sm text-gray-500">
                        Chưa có dữ liệu.
                    </Typography>
                ) : (
                    <Stack spacing={3}>
                        {weeksWithMatrices.map(({ label, slotBlocks, columnLabels, columnDates }, weekIndex) => (
                            <Box key={weekIndex}>
                                <Typography className="text-base font-semibold text-gray-800 mb-1">
                                    Tuần {label}
                                </Typography>
                                <TableContainer
                                    className="w-full rounded-md border border-gray-200 shadow-sm"
                                    sx={{
                                        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
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
                                            <TableRow sx={{ bgcolor: 'rgb(249 250 251)' }}>
                                                {columnLabels.map((colLabel, i) => (
                                                    <TableCell
                                                        key={i}
                                                        align="center"
                                                        className="p-3 text-sm font-semibold text-gray-800 border-gray-200"
                                                        sx={{ borderColor: 'rgb(229 231 235)' }}
                                                    >
                                                        <Box className="text-sm font-semibold text-gray-800">{colLabel}</Box>
                                                        <Box className="text-xs font-medium text-gray-600 mt-0.5">
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
                                                            className="p-3 text-sm font-semibold text-gray-800 border-gray-200"
                                                            sx={{ borderColor: 'rgb(229 231 235)' }}
                                                        >
                                                            <Box className="flex items-center justify-center">
                                                                <Typography component="div" className="text-sm font-semibold text-gray-800 text-center break-words">
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
                                                                    className="p-3 text-sm border-gray-200 align-top"
                                                                    sx={{ borderColor: 'rgb(229 231 235)' }}
                                                                >
                                                                    <Box className="flex flex-col gap-1.5">
                                                                        <Box
                                                                            className="w-full text-center text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg mb-1.5 shadow-sm truncate"
                                                                            sx={{
                                                                                fontSize: '0.75rem',
                                                                                height: 32,
                                                                                minHeight: 32,
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                py: 1,
                                                                                boxSizing: 'border-box',
                                                                            }}
                                                                        >
                                                                            {timeLabel || '\u00A0'}
                                                                        </Box>

                                                                        {!hasAny ? (
                                                                            <Typography
                                                                                variant="body2"
                                                                                color="text.disabled"
                                                                                className="text-[10px]"
                                                                                sx={{ fontSize: '0.625rem' }}
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
                                                                                            className="rounded border border-slate-200 p-1.5 shadow-sm min-w-0"
                                                                                            style={{ backgroundColor: style.bg }}
                                                                                        >
                                                                                            <Typography
                                                                                                component="div"
                                                                                                className="font-semibold uppercase tracking-wide break-words"
                                                                                                style={{ color: style.text, fontSize: '10px' }}
                                                                                                sx={{ wordBreak: 'break-word' }}
                                                                                            >
                                                                                                {roleRow.roleName === '—'
                                                                                                    ? 'Chức vụ khác'
                                                                                                    : roleRow.roleName}
                                                                                            </Typography>
                                                                                            <Box className="mt-0.5 space-y-0">
                                                                                                {names.map((name, i) => (
                                                                                                <Tooltip key={i} title={name} placement="top" arrow enterDelay={300}>
                                                                                                    <Typography
                                                                                                        component="div"
                                                                                                        className="text-slate-800 leading-snug truncate"
                                                                                                        sx={{ fontSize: '0.6875rem' }}
                                                                                                    >
                                                                                                        • {name}
                                                                                                    </Typography>
                                                                                                </Tooltip>
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
