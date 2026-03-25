import { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, Calendar, Check, Clock, Send, X } from 'lucide-react';
import type { IWorkShift } from '../../../api/workShift.api';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { useQueries, useQuery } from '@tanstack/react-query';
import { getMyStaffProfile, type IStaffProfile } from '../../../api/staffProfile.api';
import { getStaffProfiles } from '../../../api/staffProfile.api';
import { getStaffSkillsByStaffId, type IStaffSkill } from '../../../api/staffSkill.api';
import { getShiftsByStaffAndDateRange, type IWorkShift as IWorkShiftApi } from '../../../api/workShift.api';
import { toast } from 'react-toastify';

dayjs.locale('vi');

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

interface SwapShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentShift: IWorkShift | null;
}

function getSlotNameFromStartTime(startTime: string): 'Ca Sáng' | 'Ca Chiều' {
    const match = startTime.match(/T(\d{2})/);
    const hour = match ? parseInt(match[1], 10) : dayjs(startTime).hour();
    return hour >= 12 ? 'Ca Chiều' : 'Ca Sáng';
}

function getDayIndexMon0(iso: string): number {
    const d = dayjs(iso).day(); // 0=Sun..6=Sat
    return d === 0 ? 6 : d - 1; // Mon=0..Sun=6
}

export const SwapShiftModal = ({ isOpen, onClose, currentShift }: SwapShiftModalProps) => {
    const [selectedTargetShiftId, setSelectedTargetShiftId] = useState<string>('');
    const [reason, setReason] = useState<string>('');

    const { data: myProfileRes } = useQuery({
        queryKey: ['my-staff-profile'],
        queryFn: getMyStaffProfile,
        select: (res) => res.data as IStaffProfile,
        enabled: isOpen,
    });
    const myProfile = myProfileRes ?? null;

    const myStaffId = myProfile?.staffId ?? null;
    const myPositionId = myProfile?.positionId ?? null;

    const { data: mySkillsRes } = useQuery({
        queryKey: ['my-staff-skills', myStaffId],
        queryFn: () => getStaffSkillsByStaffId(myStaffId!),
        select: (res) => (res.data ?? []) as IStaffSkill[],
        enabled: isOpen && myStaffId != null,
    });
    const mySkillIdSet = useMemo(() => new Set<number>((mySkillsRes ?? []).map((s) => s.skillId)), [mySkillsRes]);

    const { data: staffProfilesRes, isLoading: loadingProfiles } = useQuery({
        queryKey: ['staff-profiles'],
        queryFn: getStaffProfiles,
        select: (res) => (res.data ?? []) as IStaffProfile[],
        enabled: isOpen,
    });

    const weekRange = useMemo(() => {
        if (!currentShift) return null;
        const start = dayjs(currentShift.startTime).startOf('day');
        const d = start.day();
        const daysToMonday = d === 0 ? -6 : 1 - d;
        const monday = start.add(daysToMonday, 'day').startOf('day');
        const sunday = monday.add(6, 'day').endOf('day');
        return { from: monday.toISOString(), to: sunday.toISOString() };
    }, [currentShift]);

    const weekDates = useMemo(() => {
        if (!weekRange) return [];
        const monday = dayjs(weekRange.from).startOf('day');
        return Array.from({ length: 7 }, (_, i) => monday.add(i, 'day'));
    }, [weekRange]);

    const candidateProfiles = useMemo(() => {
        const list = (staffProfilesRes ?? []).filter((p) => p.active);
        // exclude self
        const notMe = myStaffId != null ? list.filter((p) => p.staffId !== myStaffId) : list;
        // small cap to avoid too many network calls
        return notMe.slice(0, 15);
    }, [staffProfilesRes, myStaffId]);

    const candidateSkillsQueries = useQueries({
        queries: candidateProfiles.map((p) => ({
            queryKey: ['staff-skills', p.staffId],
            queryFn: () => getStaffSkillsByStaffId(p.staffId),
            enabled: isOpen && candidateProfiles.length > 0,
            select: (res: any) => (res?.data ?? []) as IStaffSkill[],
        })),
    });

    const candidateShiftsQueries = useQueries({
        queries: candidateProfiles.map((p) => ({
            queryKey: ['staff-shifts', p.staffId, weekRange?.from, weekRange?.to],
            queryFn: () => getShiftsByStaffAndDateRange(p.staffId, weekRange?.from, weekRange?.to),
            enabled: isOpen && weekRange != null,
            select: (res: any) => (res?.data ?? []) as IWorkShiftApi[],
        })),
    });

    const targetShiftCards = useMemo(() => {
        if (!currentShift || !weekRange) return [];

        const currentStart = dayjs(currentShift.startTime).valueOf();
        const currentEnd = dayjs(currentShift.endTime).valueOf();
        const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) => aStart < bEnd && bStart < aEnd;

        const cards: Array<{
            id: string;
            staffId: number;
            staffName: string;
            dateLabel: string;
            timeLabel: string;
            shift: IWorkShiftApi;
        }> = [];

        candidateProfiles.forEach((p, idx) => {
            const positionMatch = myPositionId != null && p.positionId != null && p.positionId === myPositionId;

            const staffSkills = candidateSkillsQueries[idx]?.data as IStaffSkill[] | undefined;
            const hasSharedSkill =
                staffSkills != null && staffSkills.some((s) => mySkillIdSet.has(s.skillId));

            if (!positionMatch && !hasSharedSkill) return;

            const staffShifts = (candidateShiftsQueries[idx]?.data ?? []) as IWorkShiftApi[];

            // employee must be free at current shift time (so they can take your shift)
            const hasOverlapWithCurrent = staffShifts.some((s) =>
                overlaps(dayjs(s.startTime).valueOf(), dayjs(s.endTime).valueOf(), currentStart, currentEnd)
            );
            if (hasOverlapWithCurrent) return;

            // show their finalized shifts as swap targets
            const finalized = staffShifts.filter((s) => s.status === 'ASSIGNED' || s.status === 'COMPLETED');
            finalized.forEach((s) => {
                cards.push({
                    id: `${p.staffId}-${s.shiftId}`,
                    staffId: p.staffId,
                    staffName: p.fullName,
                    dateLabel: dayjs(s.startTime).format('dddd, DD/MM/YYYY'),
                    timeLabel: `${dayjs(s.startTime).format('HH:mm')} - ${dayjs(s.endTime).format('HH:mm')}`,
                    shift: s,
                });
            });
        });

        // stable ordering by date/time
        return cards.sort((a, b) => dayjs(a.shift.startTime).valueOf() - dayjs(b.shift.startTime).valueOf());
    }, [
        candidateProfiles,
        candidateSkillsQueries,
        candidateShiftsQueries,
        currentShift,
        myPositionId,
        mySkillIdSet,
        weekRange,
    ]);

    /** Build timetable grid: 2 rows (morning/afternoon) x 7 days */
    const timetable = useMemo(() => {
        const grid: (typeof targetShiftCards)[][] = [
            Array.from({ length: 7 }, () => []),
            Array.from({ length: 7 }, () => []),
        ];
        for (const card of targetShiftCards) {
            const dayIdx = getDayIndexMon0(card.shift.startTime);
            if (dayIdx < 0 || dayIdx > 6) continue;
            const slot = getSlotNameFromStartTime(card.shift.startTime) === 'Ca Sáng' ? 0 : 1;
            grid[slot][dayIdx].push(card);
        }
        // keep one per cell (UI requirement says render a card; if multiple, take earliest)
        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 7; c++) {
                grid[r][c].sort((a, b) => dayjs(a.shift.startTime).valueOf() - dayjs(b.shift.startTime).valueOf());
                grid[r][c] = grid[r][c].slice(0, 1);
            }
        }
        return grid;
    }, [targetShiftCards]);

    useEffect(() => {
        if (!isOpen) return;

        // Reset form each time open to keep flow predictable
        setSelectedTargetShiftId('');
        setReason('');
    }, [isOpen, currentShift]);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const isSubmitDisabled = !currentShift || !selectedTargetShiftId;

    const handleSubmit = () => {
        if (isSubmitDisabled) return;
        // TODO: integrate API submit swap request
        toast.success('Gửi yêu cầu đổi ca thành công');
        onClose();
    };

    const currentShiftDateLabel = currentShift
        ? dayjs(currentShift.startTime).format('dddd, DD/MM/YYYY')
        : '—';
    const currentShiftTimeLabel = currentShift
        ? `${dayjs(currentShift.startTime).format('HH:mm')} - ${dayjs(currentShift.endTime).format('HH:mm')}`
        : '—';
    const currentShiftSlot = currentShift ? getSlotNameFromStartTime(currentShift.startTime) : '—';
    const currentShiftPosition = myProfile?.positionName ?? '—';

    return (
        <div
            className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity"
            role="dialog"
            aria-modal="true"
            aria-label="Yêu cầu đổi ca"
            onMouseDown={onClose}
        >
            <div
                className="w-[98vw] max-w-7xl h-auto max-h-[90vh] flex flex-col rounded-xl bg-white shadow-2xl overflow-hidden"
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600">
                            <ArrowRightLeft className="w-4 h-4" />
                        </span>
                        <h2 className="text-lg font-bold text-gray-900">Yêu cầu đổi ca</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    {/* Part 1: Current shift info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-sm text-blue-700 font-semibold">Ca muốn đổi đi</div>
                        <div className="mt-3 space-y-2 text-sm text-slate-800">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                <span className="font-medium">{currentShiftDateLabel}</span>
                                <span className="text-slate-500">•</span>
                                <span className="text-slate-600">{currentShiftSlot}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-600" />
                                <span className="font-medium">{currentShiftTimeLabel}</span>
                            </div>
                            <div className="text-xs text-slate-500">
                                Chức vụ: <span className="text-slate-700 font-medium">{currentShiftPosition}</span>
                            </div>
                        </div>
                    </div>

                    {/* Part 2: Available shifts */}
                    <div>
                        <div className="text-sm font-semibold text-slate-700 mb-2">
                            Chọn ca của đồng nghiệp để hoán đổi
                        </div>
                        <div className="w-full rounded-lg border border-slate-200 overflow-hidden">
                            {loadingProfiles || candidateSkillsQueries.some((q) => q.isLoading) || candidateShiftsQueries.some((q) => q.isLoading) ? (
                                <div className="text-sm text-slate-500 py-3 px-3">Đang tải danh sách ca phù hợp...</div>
                            ) : targetShiftCards.length === 0 ? (
                                <div className="text-sm text-slate-500 py-3 px-3">
                                    Không tìm thấy ca phù hợp (cùng chức vụ hoặc có kỹ năng chung, và không bị trùng giờ).
                                </div>
                            ) : (
                                <table className="w-full border-collapse table-fixed text-[11px]">
                                    <thead>
                                        <tr>
                                            <th className="bg-slate-50 border border-slate-200 p-1 text-left font-semibold text-slate-600 align-top w-[96px]">
                                                Ca làm việc
                                            </th>
                                            {DAY_LABELS.map((d, idx) => (
                                                <th
                                                    key={d}
                                                    className="bg-slate-50 border border-slate-200 p-1 text-center font-semibold text-slate-600 align-top w-[calc((100%-96px)/7)]"
                                                >
                                                    <div>{d}</div>
                                                    <div className="text-[10px] text-slate-400 font-medium">
                                                        {weekDates[idx] ? weekDates[idx].format('DD/MM') : '—'}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { label: 'Ca Sáng', row: 0 },
                                            { label: 'Ca Chiều', row: 1 },
                                        ].map(({ label, row }) => (
                                            <tr key={label}>
                                                <td className="border border-slate-200 p-1 font-semibold text-slate-700 bg-white whitespace-nowrap w-[96px]">
                                                    {label}
                                                </td>
                                                {Array.from({ length: 7 }, (_, col) => {
                                                    const cell = timetable[row][col];
                                                    const item = cell?.[0];
                                                    const active = item ? selectedTargetShiftId === item.id : false;

                                                    return (
                                                        <td key={col} className="border border-slate-200 p-1 align-top w-[calc((100%-96px)/7)]">
                                                            {item ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedTargetShiftId(item.id)}
                                                                    className={[
                                                                        'w-full text-left border border-slate-200 rounded-md px-1 py-1 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all relative',
                                                                        active ? 'border-blue-600 bg-blue-100 text-blue-800' : '',
                                                                    ].join(' ')}
                                                                >
                                                                    {active && (
                                                                        <span className="absolute right-1 top-1 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-blue-600 text-white">
                                                                            <Check className="w-2.5 h-2.5" />
                                                                        </span>
                                                                    )}
                                                                    <div className="font-semibold leading-tight pr-5 whitespace-nowrap">
                                                                        {item.staffName}
                                                                    </div>
                                                                    <div className="mt-0.5 text-[10px] text-slate-500 whitespace-nowrap">
                                                                        {item.timeLabel}
                                                                    </div>
                                                                </button>
                                                            ) : (
                                                                <div className="h-full min-h-[44px] rounded-md bg-slate-50 text-slate-300 flex items-center justify-center cursor-not-allowed">
                                                                    —
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Part 3: Reason */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Lý do đổi ca</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Nhập lý do để quản lý duyệt nhanh hơn..."
                            className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none min-h-[80px]"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        disabled={isSubmitDisabled}
                        onClick={handleSubmit}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                        Gửi yêu cầu
                    </button>
                </div>
            </div>
        </div>
    );
};

