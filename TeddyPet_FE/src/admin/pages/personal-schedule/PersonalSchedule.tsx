import { useMemo, useState, Fragment } from 'react';
import { Box, Stack, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Button } from '@mui/material';
import { ListHeader } from '../../components/ui/ListHeader';
import { prefixAdmin } from '../../constants/routes';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
import { ArrowRightLeft } from 'lucide-react';
import { useMyShifts } from '../staff/hooks/useWorkShift';
import type { IWorkShift } from '../../api/workShift.api';
import { getDayIndex, formatTimeRange } from '../staff/workShift/workShiftSummaryUtils';
import { SwapShiftModal } from './components/SwapShiftModal';

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const ROW_LABELS = ['CA SÁNG', 'CA CHIỀU'] as const;
type SlotType = 'morning' | 'afternoon';

/** Phân loại ca: startTime >= 12:00 → Ca Chiều, < 12:00 → Ca Sáng. Dùng giờ trong chuỗi (không Z) để tránh lệch timezone; có Z thì dùng dayjs. */
function getSlotTypeFromStartTime(startTime: string): SlotType {
    let hour: number;
    if (startTime.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(startTime)) {
        hour = dayjs(startTime).hour();
    } else {
        const match = startTime.match(/T(\d{2})/);
        hour = match ? parseInt(match[1], 10) : dayjs(startTime).hour();
    }
    return hour >= 12 ? 'afternoon' : 'morning';
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

function buildWeeksWithShifts(myShifts: IWorkShift[], from: string, to: string) {
    const fromD = dayjs(from).startOf('day');
    const toD = dayjs(to).endOf('day');
    const list: {
        label: string;
        columnDates: string[];
        byDay: Array<{ morningShift: IWorkShift | null; afternoonShift: IWorkShift | null }>;
    }[] = [];
    let weekStart = fromD;
    while (weekStart.isBefore(toD) || weekStart.isSame(toD, 'day')) {
        const weekEnd = weekStart.add(6, 'day').endOf('day');
        const weekShifts = myShifts.filter((s) => {
            const t = dayjs(s.startTime);
            return (t.isAfter(weekStart) || t.isSame(weekStart)) && (t.isBefore(weekEnd) || t.isSame(weekEnd));
        });
        const columnDates = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day').format('DD/MM/YYYY'));
        const byDay: Array<{ morningShift: IWorkShift | null; afternoonShift: IWorkShift | null }> = Array.from(
            { length: 7 },
            () => ({ morningShift: null, afternoonShift: null })
        );
        for (const shift of weekShifts) {
            const dayIndex = getDayIndex(shift.startTime);
            if (dayIndex < 0 || dayIndex > 6) continue;
            const slotType = getSlotTypeFromStartTime(shift.startTime);
            if (slotType === 'morning') {
                byDay[dayIndex].morningShift = shift;
            } else {
                byDay[dayIndex].afternoonShift = shift;
            }
        }
        list.push({
            label: `${weekStart.format('DD/MM')} - ${weekEnd.format('DD/MM/YYYY')}`,
            columnDates,
            byDay,
        });
        weekStart = weekStart.add(7, 'day');
    }
    return list;
}

export default function PersonalSchedule() {
    const defaultRange = getDefaultRange();
    const [from, setFrom] = useState<string>(defaultRange.start);
    const [to, setTo] = useState<string>(defaultRange.end);
    const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<IWorkShift | null>(null);

    const { data: myShiftsRaw = [], isLoading: loadingShifts } = useMyShifts(from, to);
    const allMyShifts = myShiftsRaw as IWorkShift[];

    /** Chỉ hiển thị ca đã được admin khóa (ASSIGNED hoặc COMPLETED). Ca trống (OPEN) chưa khóa thì không hiện trong lịch cá nhân. */
    const myShifts = useMemo(
        () => allMyShifts.filter((s) => s.status === 'ASSIGNED' || s.status === 'COMPLETED'),
        [allMyShifts]
    );

    /** Chia khoảng [from, to] thành các tuần; mỗi ngày phân loại morningShifts / afternoonShifts theo startTime. */
    const weeksWithShifts = useMemo(
        () => buildWeeksWithShifts(myShifts, from, to),
        [from, to, myShifts]
    );

    const loading = loadingShifts;

    const handleOpenSwapModal = (shift: IWorkShift) => {
        setSelectedShift(shift);
        setIsSwapModalOpen(true);
    };

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
                title="Lịch cá nhân"
                breadcrumbItems={[
                    { label: 'Trang chủ', to: '/' },
                    { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                    { label: 'Lịch cá nhân' },
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
                ) : myShifts.length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                        Bạn chưa có ca làm việc nào trong khoảng thời gian này.
                    </Typography>
                ) : (
                    <Stack spacing={3}>
                        {weeksWithShifts.map(({ label, columnDates, byDay }, weekIndex) => (
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
                                                {DAY_LABELS.map((colLabel, i) => (
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
                                            {ROW_LABELS.map((rowLabel, rowIndex) => (
                                                <Fragment key={rowIndex}>
                                                    <TableRow
                                                        sx={{
                                                            bgcolor: 'rgb(226 232 240)',
                                                            '& td': {
                                                                borderBottom: '1px solid',
                                                                borderColor: 'grey.200',
                                                            },
                                                        }}
                                                    >
                                                        <TableCell
                                                            colSpan={DAY_LABELS.length}
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
                                                                    {rowLabel}
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow
                                                        sx={{
                                                            bgcolor: 'background.paper',
                                                            '& td': { borderBottom: '1px solid', borderColor: 'grey.200' },
                                                        }}
                                                    >
                                                        {DAY_LABELS.map((_, dayIndex) => {
                                                            const shift =
                                                                rowIndex === 0
                                                                    ? byDay[dayIndex].morningShift
                                                                    : byDay[dayIndex].afternoonShift;
                                                            const timeLabel = shift
                                                                ? formatTimeRange(shift.startTime, shift.endTime)
                                                                : '';

                                                            return (
                                                                <TableCell
                                                                    key={dayIndex}
                                                                    align="center"
                                                                    sx={{
                                                                        verticalAlign: 'middle',
                                                                        borderColor: 'grey.200',
                                                                        py: 1.5,
                                                                        px: 2.0,
                                                                    }}
                                                                >
                                                                    {shift ? (
                                                                        <div className="flex flex-col items-center gap-1.5 p-2 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all relative group">
                                                                            <div className="text-xs font-semibold text-slate-700">
                                                                                {timeLabel}
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleOpenSwapModal(shift)}
                                                                                className="text-[10px] px-2 py-1 rounded border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 w-full flex justify-center items-center gap-1 text-slate-600 transition-colors"
                                                                            >
                                                                                <ArrowRightLeft className="w-3 h-3" />
                                                                                Đổi ca
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <Box
                                                                            sx={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                minHeight: 72,
                                                                            }}
                                                                        >
                                                                            <Typography
                                                                                variant="body2"
                                                                                color="text.disabled"
                                                                                className="text-xs"
                                                                            >
                                                                                —
                                                                            </Typography>
                                                                        </Box>
                                                                    )}
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

            <SwapShiftModal
                isOpen={isSwapModalOpen}
                onClose={() => setIsSwapModalOpen(false)}
                currentShift={selectedShift}
            />
        </LocalizationProvider>
    );
}
