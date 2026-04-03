import { useMemo, useState } from 'react';
import { Box, MenuItem, Select } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { getStaffPositions } from '../../../api/staffPosition.api';
import { getStaffProfiles } from '../../../api/staffProfile.api';
import {
    createFixedSchedule,
    deleteFixedSchedule,
    getFixedSchedulesByStaffId,
    type IStaffFixedSchedule,
    type IStaffFixedScheduleRequest,
} from '../../../api/staffFixedSchedule.api';
import { ListHeader } from '../../../components/ui/ListHeader';
import { prefixAdmin } from '../../../constants/routes';
import { ApiResponse } from '../../../config/type';

const DAY_LABELS: Record<number, string> = {
    1: 'Thu 2',
    2: 'Thu 3',
    3: 'Thu 4',
    4: 'Thu 5',
    5: 'Thu 6',
    6: 'Thu 7',
    7: 'Chu nhat',
};

const DAYS = [1, 2, 3, 4, 5, 6, 7];
const DAY_SHORT_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const SLOT_OPTIONS = [
    { label: 'Sang', value: 0 },
    { label: 'Chieu', value: 1 },
];
const DAY_PRESETS = [
    { label: 'T2-T6', values: [1, 2, 3, 4, 5] },
    { label: 'Cuoi tuan', values: [6, 7] },
    { label: 'Ca tuan', values: [1, 2, 3, 4, 5, 6, 7] },
];

const selectSx = {
    '& .MuiSelect-select': {
        backgroundColor: '#F9FAFB',
        borderRadius: '0.75rem',
        paddingTop: '10px',
        paddingBottom: '10px',
    },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#93C5FD' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
};

type ProfileItem = {
    staffId?: number;
    id?: number;
    fullName: string;
    employmentType?: string;
};

function getShortPositionLabel(fullName: string) {
    const raw = (fullName ?? '').trim();
    const text = raw.toLowerCase();
    if (!text) return '-';
    if (text.includes('thu ngan') || text.includes('thu ngan') || text.includes('ban hang')) return 'Thu ngan';
    if (text.includes('spa')) return 'Spa';
    if (text.includes('cham soc')) return 'Cham soc';
    if (text.includes('tu van')) return 'Tu van';
    if (text.includes('ky thuat')) return 'Ky thuat';
    return raw.length > 10 ? `${raw.slice(0, 9)}...` : raw;
}

function uniq(values: number[]) {
    return Array.from(new Set(values)).sort((a, b) => a - b);
}

export const StaffFixedSchedulePage = () => {
    const [selectedStaffId, setSelectedStaffId] = useState<number | ''>('');
    const [formPositionId, setFormPositionId] = useState<number | ''>('');
    const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
    const [selectedSlots, setSelectedSlots] = useState<number[]>([0]);
    const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

    const queryClient = useQueryClient();

    const { data: profilesRes } = useQuery({
        queryKey: ['staff-profiles'],
        queryFn: getStaffProfiles,
        select: (res: ApiResponse<any>) => res.data ?? [],
    });
    const profiles = (profilesRes ?? []) as ProfileItem[];
    const fullTimeProfiles = profiles.filter((item) => item.employmentType === 'FULL_TIME');
    const getStaffId = (item: ProfileItem) =>
        (typeof item.staffId === 'number' ? item.staffId : item.id) as number | undefined;

    const { data: positionsRes } = useQuery({
        queryKey: ['staff-positions'],
        queryFn: getStaffPositions,
        select: (res: ApiResponse<any>) => res.data ?? [],
    });
    const positions = (positionsRes ?? []) as { id: number; name: string }[];
    const activePosition = useMemo(
        () => positions.find((item) => item.id === formPositionId),
        [formPositionId, positions],
    );

    const { data: schedulesRes, isLoading: loadingSchedules } = useQuery({
        queryKey: ['staff-fixed-schedules', selectedStaffId],
        queryFn: () => getFixedSchedulesByStaffId(selectedStaffId as number),
        enabled: typeof selectedStaffId === 'number' && selectedStaffId > 0,
        select: (res: ApiResponse<IStaffFixedSchedule[]>) => res.data ?? [],
    });
    const schedules = (schedulesRes ?? []) as IStaffFixedSchedule[];

    const scheduleMatrix = useMemo(() => {
        const matrix: IStaffFixedSchedule[][][] = [
            Array.from({ length: 7 }, () => []),
            Array.from({ length: 7 }, () => []),
        ];
        for (const item of schedules) {
            const dayIdx = (Number(item.dayOfWeek) || 1) - 1;
            const slotIdx = item.isAfternoon ? 1 : 0;
            if (dayIdx >= 0 && dayIdx <= 6) matrix[slotIdx][dayIdx].push(item);
        }
        return matrix;
    }, [schedules]);

    const hasDuplicate = (positionId: number, dayOfWeek: number, isAfternoon: boolean) =>
        schedules.some(
            (item) =>
                Number(item.positionId) === positionId &&
                Number(item.dayOfWeek) === dayOfWeek &&
                Boolean(item.isAfternoon) === isAfternoon,
        );

    const bulkCandidates = useMemo(() => {
        if (typeof formPositionId !== 'number' || formPositionId <= 0) return [];
        return uniq(selectedDays).flatMap((dayOfWeek) =>
            uniq(selectedSlots).map((slot) => ({
                positionId: formPositionId,
                dayOfWeek,
                isAfternoon: slot === 1,
                exists: hasDuplicate(formPositionId, dayOfWeek, slot === 1),
            })),
        );
    }, [formPositionId, schedules, selectedDays, selectedSlots]);

    const addableBulkCandidates = bulkCandidates.filter((item) => !item.exists);
    const duplicateBulkCount = bulkCandidates.length - addableBulkCandidates.length;

    const createMutation = useMutation({
        mutationFn: (body: IStaffFixedScheduleRequest) => createFixedSchedule(body),
        onSuccess: async (res) => {
            if (res?.success !== false) {
                await queryClient.invalidateQueries({ queryKey: ['staff-fixed-schedules', selectedStaffId] });
            }
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (scheduleId: number) => deleteFixedSchedule(scheduleId),
        onSuccess: async (res) => {
            if (res?.success) {
                toast.success('Da xoa lich co dinh.');
                await queryClient.invalidateQueries({ queryKey: ['staff-fixed-schedules', selectedStaffId] });
            } else {
                toast.error('Xoa that bai.');
            }
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? error?.message ?? 'Xoa lich co dinh that bai.'),
    });

    const ensureSelections = () => {
        if (typeof selectedStaffId !== 'number' || selectedStaffId <= 0) {
            toast.warning('Chon nhan vien truoc.');
            return false;
        }
        if (typeof formPositionId !== 'number' || formPositionId <= 0) {
            toast.warning('Chon chuc vu truoc.');
            return false;
        }
        return true;
    };

    const toggleDay = (day: number) => {
        setSelectedDays((prev) => (prev.includes(day) ? prev.filter((item) => item !== day) : uniq([...prev, day])));
    };

    const toggleSlot = (slot: number) => {
        setSelectedSlots((prev) =>
            prev.includes(slot) ? prev.filter((item) => item !== slot) : uniq([...prev, slot]),
        );
    };

    const handleQuickCellAdd = async (dayOfWeek: number, isAfternoon: boolean) => {
        if (!ensureSelections()) return;
        if (hasDuplicate(formPositionId as number, dayOfWeek, isAfternoon)) {
            toast.info('Ca nay da co san cho chuc vu dang chon.');
            return;
        }
        try {
            const res = await createMutation.mutateAsync({
                staffId: selectedStaffId as number,
                positionId: formPositionId as number,
                dayOfWeek,
                isAfternoon,
            });
            if (res?.success !== false) {
                toast.success(
                    `Da them ${activePosition?.name ?? 'chuc vu'} vao ${DAY_LABELS[dayOfWeek]} ${
                        isAfternoon ? 'buoi chieu' : 'buoi sang'
                    }.`,
                );
            } else {
                toast.error(res?.message ?? 'Khong the them lich co dinh.');
            }
        } catch (error: any) {
            const status = error?.response?.status;
            const message =
                error?.response?.data?.message ??
                error?.response?.data?.error ??
                error?.message ??
                'Them lich co dinh that bai.';
            toast.error(status === 400 ? 'Ca nay da ton tai.' : String(message));
        }
    };

    const handleBulkAdd = async () => {
        if (!ensureSelections()) return;
        if (selectedDays.length === 0) return toast.warning('Chon it nhat 1 ngay.');
        if (selectedSlots.length === 0) return toast.warning('Chon it nhat 1 buoi.');
        if (addableBulkCandidates.length === 0) return toast.info('Cac ca dang chon deu da ton tai.');

        setIsBulkSubmitting(true);
        try {
            const results = await Promise.allSettled(
                addableBulkCandidates.map((item) =>
                    createFixedSchedule({
                        staffId: selectedStaffId as number,
                        positionId: item.positionId,
                        dayOfWeek: item.dayOfWeek,
                        isAfternoon: item.isAfternoon,
                    }),
                ),
            );
            const successCount = results.filter(
                (item) => item.status === 'fulfilled' && item.value?.success !== false,
            ).length;
            const failedCount = results.length - successCount;
            if (successCount > 0) {
                await queryClient.invalidateQueries({ queryKey: ['staff-fixed-schedules', selectedStaffId] });
                toast.success(`Da them nhanh ${successCount} ca co dinh.`);
            }
            if (failedCount > 0) {
                toast.warning(`${failedCount} ca chua them duoc. He thong da bo qua ca loi hoac trung.`);
            }
        } finally {
            setIsBulkSubmitting(false);
        }
    };

    const currentSelectionLabel = activePosition?.name ?? 'Chua chon chuc vu';

    return (
        <>
            <ListHeader
                title="Lich co dinh Full-time"
                breadcrumbItems={[
                    { label: 'Trang chu', to: '/' },
                    { label: 'Nhan su', to: `/${prefixAdmin}/staff/profile/list` },
                    { label: 'Lich co dinh' },
                ]}
            />
            <Box sx={{ px: { xs: 2, sm: 3, md: '40px' }, pb: 3, mt: 3 }}>
                <Box className="space-y-6">
                    <Box className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <label className="mb-1.5 block text-base font-semibold text-gray-700">Nhan vien Full-time</label>
                        <Select
                            fullWidth
                            size="small"
                            value={selectedStaffId}
                            displayEmpty
                            onChange={(e) => {
                                const value = e.target.value as string | number;
                                setSelectedStaffId(value === '' ? '' : Number(value));
                            }}
                            sx={selectSx}
                        >
                            <MenuItem value="">- Chon nhan vien -</MenuItem>
                            {fullTimeProfiles.map((item) => {
                                const staffId = getStaffId(item);
                                if (staffId == null || staffId <= 0) return null;
                                return (
                                    <MenuItem key={staffId} value={staffId}>
                                        {item.fullName}
                                    </MenuItem>
                                );
                            })}
                        </Select>

                        {selectedStaffId && (
                            <div className="mt-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-sky-50 p-5">
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">Thiet ke them nhanh</h3>
                                        <p className="text-sm text-slate-600">
                                            Chon chuc vu 1 lan, chon nhieu ngay va nhieu buoi, roi them cung luc.
                                        </p>
                                    </div>
                                    <div className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-blue-100">
                                        Giam thao tac chon lap lai
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
                                    <div className="space-y-4 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">1. Chon chuc vu</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {positions.map((item) => {
                                                    const active = formPositionId === item.id;
                                                    return (
                                                        <button
                                                            key={item.id}
                                                            type="button"
                                                            onClick={() => setFormPositionId(item.id)}
                                                            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                                                active
                                                                    ? 'border-blue-600 bg-blue-600 text-white'
                                                                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50'
                                                            }`}
                                                        >
                                                            {active && <Check className="h-4 w-4" />}
                                                            <span>{item.name}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-semibold text-gray-800">2. Chon ngay</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {DAY_PRESETS.map((item) => (
                                                        <button
                                                            key={item.label}
                                                            type="button"
                                                            onClick={() => setSelectedDays(item.values)}
                                                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:bg-blue-50"
                                                        >
                                                            {item.label}
                                                        </button>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedDays([])}
                                                        className="rounded-full px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                                                    >
                                                        Xoa chon
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {DAYS.map((day) => {
                                                    const active = selectedDays.includes(day);
                                                    return (
                                                        <button
                                                            key={day}
                                                            type="button"
                                                            onClick={() => toggleDay(day)}
                                                            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                                                                active
                                                                    ? 'border-blue-600 bg-blue-600 text-white'
                                                                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50'
                                                            }`}
                                                        >
                                                            {DAY_LABELS[day]}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-semibold text-gray-800">3. Chon buoi</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedSlots([0, 1])}
                                                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:bg-blue-50"
                                                >
                                                    Ca ngay
                                                </button>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {SLOT_OPTIONS.map((item) => {
                                                    const active = selectedSlots.includes(item.value);
                                                    return (
                                                        <button
                                                            key={item.value}
                                                            type="button"
                                                            onClick={() => toggleSlot(item.value)}
                                                            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                                                                active
                                                                    ? 'border-slate-900 bg-slate-900 text-white'
                                                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            {item.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-900 p-4 text-white">
                                        <div className="space-y-3">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Tom tat</p>
                                            <div className="rounded-2xl bg-white/10 p-4">
                                                <p className="text-sm text-slate-300">Chuc vu dang chon</p>
                                                <p className="mt-1 text-lg font-semibold">{currentSelectionLabel}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="rounded-2xl bg-white/10 p-4">
                                                    <p className="text-sm text-slate-300">O da chon</p>
                                                    <p className="mt-1 text-2xl font-semibold">{bulkCandidates.length}</p>
                                                </div>
                                                <div className="rounded-2xl bg-emerald-400/15 p-4">
                                                    <p className="text-sm text-emerald-100">Co the them</p>
                                                    <p className="mt-1 text-2xl font-semibold text-emerald-200">
                                                        {addableBulkCandidates.length}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                                                {duplicateBulkCount > 0
                                                    ? `Co ${duplicateBulkCount} ca da ton tai va se duoc bo qua tu dong.`
                                                    : 'Tat ca lua chon hien tai deu co the them ngay.'}
                                            </div>
                                        </div>

                                        <div className="mt-4 space-y-2">
                                            <button
                                                type="button"
                                                onClick={handleBulkAdd}
                                                disabled={
                                                    isBulkSubmitting ||
                                                    typeof formPositionId !== 'number' ||
                                                    addableBulkCandidates.length === 0
                                                }
                                                className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition ${
                                                    isBulkSubmitting ||
                                                    typeof formPositionId !== 'number' ||
                                                    addableBulkCandidates.length === 0
                                                        ? 'cursor-not-allowed bg-white/10 text-slate-400'
                                                        : 'bg-white text-slate-900 hover:bg-slate-100'
                                                }`}
                                            >
                                                <Plus className="h-4 w-4" />
                                                <span>
                                                    {isBulkSubmitting
                                                        ? 'Dang them nhanh...'
                                                        : `Them nhanh ${addableBulkCandidates.length} ca`}
                                                </span>
                                            </button>
                                            <p className="text-xs text-slate-400">
                                                Co the giu nguyen bo chon de ap cho chuc vu khac ma khong can chon lai.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Box>

                    {selectedStaffId && (
                        <Box className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h3 className="text-base font-semibold text-gray-800">Lich co dinh da cau hinh</h3>
                                    <p className="text-sm text-gray-500">
                                        Khi da chon chuc vu, co the them nhanh truc tiep tren tung o trong bang.
                                    </p>
                                </div>
                                <div className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                                    Chuc vu hien tai: {currentSelectionLabel}
                                </div>
                            </div>

                            {loadingSchedules ? (
                                <div className="py-3 text-sm text-gray-500">Dang tai...</div>
                            ) : (
                                <div className="mt-4 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                                    <table className="w-full table-fixed border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-200 bg-gray-50">
                                                <th className="w-[10%] border-r border-gray-200 p-2 text-center text-sm font-semibold text-gray-700">
                                                    Buoi / Ngay
                                                </th>
                                                {DAY_SHORT_LABELS.map((label) => (
                                                    <th
                                                        key={label}
                                                        className="border-r border-gray-200 p-2 text-center text-sm font-semibold text-gray-700 last:border-r-0"
                                                    >
                                                        {label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[
                                                { label: 'Sang', slotIndex: 0 },
                                                { label: 'Chieu', slotIndex: 1 },
                                            ].map(({ label, slotIndex }) => (
                                                <tr key={label} className="border-b border-gray-200 last:border-b-0">
                                                    <td className="border-r border-gray-200 bg-gray-50/50 p-2 text-center text-sm font-semibold text-gray-700 align-top">
                                                        {label}
                                                    </td>
                                                    {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                                                        const dayOfWeek = dayIdx + 1;
                                                        const cellItems = scheduleMatrix[slotIndex][dayIdx];
                                                        const canQuickAdd =
                                                            typeof formPositionId === 'number' &&
                                                            !hasDuplicate(formPositionId, dayOfWeek, slotIndex === 1);

                                                        return (
                                                            <td
                                                                key={dayIdx}
                                                                className="border-r border-gray-200 p-2 align-top last:border-r-0"
                                                            >
                                                                <div className="flex min-h-[92px] flex-col gap-2">
                                                                    {cellItems.length === 0 && (
                                                                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-2 py-3 text-center text-[11px] text-slate-400">
                                                                            Chua co ca
                                                                        </div>
                                                                    )}

                                                                    {cellItems.map((item) => (
                                                                        <div
                                                                            key={item.scheduleId}
                                                                            className="group relative flex min-h-[2.5rem] items-center justify-center rounded-xl border border-gray-200 border-l-4 border-l-indigo-500 bg-white px-2 py-2 shadow-sm"
                                                                        >
                                                                            <span
                                                                                className="w-full overflow-hidden whitespace-nowrap pr-4 text-center text-[11px] font-semibold text-gray-700"
                                                                                title={item.positionName}
                                                                            >
                                                                                {getShortPositionLabel(item.positionName || '')}
                                                                            </span>
                                                                            <button
                                                                                type="button"
                                                                                disabled={deleteMutation.isPending}
                                                                                onClick={() => deleteMutation.mutate(item.scheduleId)}
                                                                                className="absolute right-1 top-1 rounded-md p-1 text-gray-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                                            >
                                                                                <Trash2 className="h-3 w-3" />
                                                                            </button>
                                                                        </div>
                                                                    ))}

                                                                    {typeof formPositionId === 'number' &&
                                                                        (canQuickAdd ? (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleQuickCellAdd(dayOfWeek, slotIndex === 1)}
                                                                                disabled={createMutation.isPending}
                                                                                className="mt-auto inline-flex items-center justify-center gap-1 rounded-xl border border-dashed border-blue-300 bg-blue-50 px-2 py-2 text-[11px] font-semibold text-blue-700 hover:border-blue-400 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                                            >
                                                                                <Plus className="h-3 w-3" />
                                                                                <span>
                                                                                    Them {getShortPositionLabel(currentSelectionLabel)}
                                                                                </span>
                                                                            </button>
                                                                        ) : (
                                                                            <div className="mt-auto rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-2 text-center text-[11px] font-semibold text-emerald-700">
                                                                                {getShortPositionLabel(currentSelectionLabel)} da co
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Box>
                    )}
                </Box>
            </Box>
        </>
    );
};
