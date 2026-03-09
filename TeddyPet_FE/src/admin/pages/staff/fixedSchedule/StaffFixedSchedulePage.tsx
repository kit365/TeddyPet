import { useMemo, useState } from 'react';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import { ListHeader } from '../../../components/ui/ListHeader';
import { prefixAdmin } from '../../../constants/routes';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStaffProfiles } from '../../../api/staffProfile.api';
import { getStaffPositions } from '../../../api/staffPosition.api';
import {
    getFixedSchedulesByStaffId,
    createFixedSchedule,
    deleteFixedSchedule,
    type IStaffFixedSchedule,
    type IStaffFixedScheduleRequest,
} from '../../../api/staffFixedSchedule.api';
import { ApiResponse } from '../../../config/type';
import { toast } from 'react-toastify';
import { Plus, Trash2 } from 'lucide-react';

const DAY_LABELS: Record<number, string> = {
    1: 'Thứ 2',
    2: 'Thứ 3',
    3: 'Thứ 4',
    4: 'Thứ 5',
    5: 'Thứ 6',
    6: 'Thứ 7',
    7: 'Chủ nhật',
};

const DAY_SHORT_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const StaffFixedSchedulePage = () => {
    const [selectedStaffId, setSelectedStaffId] = useState<number | ''>('');
    const [formPositionId, setFormPositionId] = useState<number | ''>('');
    const [formDayOfWeek, setFormDayOfWeek] = useState<number>(1);
    const [formIsAfternoon, setFormIsAfternoon] = useState(false);

    const queryClient = useQueryClient();

    const { data: profilesRes } = useQuery({
        queryKey: ['staff-profiles'],
        queryFn: getStaffProfiles,
        select: (res: ApiResponse<any>) => res.data ?? [],
    });
    type ProfileItem = { staffId?: number; id?: number; fullName: string; employmentType?: string };
    const profiles = (profilesRes ?? []) as ProfileItem[];
    const fullTimeProfiles = profiles.filter((p) => p.employmentType === 'FULL_TIME');
    const getStaffId = (p: ProfileItem) => (typeof p.staffId === 'number' ? p.staffId : p.id) as number | undefined;

    const { data: positionsRes } = useQuery({
        queryKey: ['staff-positions'],
        queryFn: getStaffPositions,
        select: (res: ApiResponse<any>) => res.data ?? [],
    });
    const positions = (positionsRes ?? []) as { id: number; name: string }[];

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
        for (const s of schedules) {
            const dayIdx = (Number(s.dayOfWeek) || 1) - 1;
            const slotIdx = s.isAfternoon ? 1 : 0;
            if (dayIdx < 0 || dayIdx > 6 || slotIdx < 0 || slotIdx > 1) continue;
            matrix[slotIdx][dayIdx].push(s);
        }
        return matrix;
    }, [schedules]);

    const createMutation = useMutation({
        mutationFn: (body: IStaffFixedScheduleRequest) => createFixedSchedule(body),
        onSuccess: (res) => {
            if (res?.success) {
                toast.success(res?.message ?? 'Đã thêm lịch cố định.');
                queryClient.invalidateQueries({ queryKey: ['staff-fixed-schedules', selectedStaffId] });
                setFormPositionId('');
                setFormDayOfWeek(1);
                setFormIsAfternoon(false);
            } else toast.error(res?.message ?? 'Thất bại');
        },
        onError: (err: any) => {
            const status = err?.response?.status;
            const data = err?.response?.data;
            const msg =
                (typeof data?.message === 'string' && data.message) ||
                (typeof data?.error === 'string' && data.error) ||
                (typeof err?.message === 'string' && err.message) ||
                '';
            if (status === 400) {
                toast.error('Dữ liệu đã tồn tại.', { autoClose: 5000 });
            } else {
                toast.error(msg || 'Thêm lịch cố định thất bại', { autoClose: 5000 });
            }
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (scheduleId: number) => deleteFixedSchedule(scheduleId),
        onSuccess: (res) => {
            if (res?.success) {
                toast.success(res?.message ?? 'Đã xóa lịch cố định.');
                queryClient.invalidateQueries({ queryKey: ['staff-fixed-schedules', selectedStaffId] });
            } else toast.error(res?.message ?? 'Xóa thất bại');
        },
        onError: (err: any) => toast.error(err?.response?.data?.message ?? err?.message ?? 'Xóa lịch cố định thất bại'),
    });

    const handleAdd = () => {
        if (typeof selectedStaffId !== 'number' || selectedStaffId <= 0) {
            toast.warning('Chọn nhân viên.');
            return;
        }
        if (typeof formPositionId !== 'number' || formPositionId <= 0) {
            toast.warning('Chọn chức vụ.');
            return;
        }
        const posId = Number(formPositionId);
        const day = Number(formDayOfWeek);
        const afternoon = Boolean(formIsAfternoon);
        const isDuplicate = schedules.some(
            (s) =>
                Number(s.positionId) === posId &&
                Number(s.dayOfWeek) === day &&
                Boolean(s.isAfternoon) === afternoon
        );
        if (isDuplicate) {
            toast.error('Dữ liệu đã tồn tại.', { autoClose: 5000 });
            return;
        }
        createMutation.mutate({
            staffId: selectedStaffId,
            positionId: formPositionId,
            dayOfWeek: formDayOfWeek,
            isAfternoon: formIsAfternoon,
        });
    };

    return (
        <>
            <ListHeader
                title="Lịch cố định Full-time"
                breadcrumbItems={[
                    { label: 'Trang chủ', to: '/' },
                    { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                    { label: 'Lịch cố định' },
                ]}
            />
            <Box sx={{ px: { xs: 2, sm: 3, md: '40px' }, pb: 3, mt: 3 }}>
                <Box className="space-y-6">
                    <Box className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all">
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="block text-base md:text-lg font-semibold text-gray-700 mb-1.5">
                                    Nhân viên (Full-time)
                                </label>
                                <div className="relative">
                                    <Select
                                        fullWidth
                                        size="small"
                                        value={selectedStaffId}
                                        displayEmpty
                                        onChange={(e) =>
                                            setSelectedStaffId(e.target.value === '' ? '' : Number(e.target.value))
                                        }
                                        sx={{
                                            '& .MuiSelect-select': {
                                                backgroundColor: '#F9FAFB',
                                                borderRadius: '0.75rem',
                                                paddingTop: '10px',
                                                paddingBottom: '10px',
                                            },
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#E5E7EB',
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#93C5FD',
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#3B82F6',
                                            },
                                        }}
                                    >
                                        <MenuItem value="">— Chọn nhân viên —</MenuItem>
                                        {fullTimeProfiles.map((p) => {
                                            const sid = getStaffId(p);
                                            if (sid == null || sid <= 0) return null;
                                            return (
                                                <MenuItem key={sid} value={sid}>
                                                    {p.fullName}
                                                </MenuItem>
                                            );
                                        })}
                                        {fullTimeProfiles.length === 0 && (
                                            <MenuItem value="" disabled>
                                                Chưa có nhân viên Full-time
                                            </MenuItem>
                                        )}
                                    </Select>
                                </div>
                            </div>

                            {selectedStaffId && (
                                <div className="mt-2 space-y-4">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-base md:text-lg font-semibold text-gray-800">
                                            Thêm slot lịch cố định
                                        </h3>
                                        <p className="text-xs text-gray-400">
                                            Cấu hình nhanh các ca làm lặp lại
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormControl size="small" fullWidth>
                                            <InputLabel>Chức vụ</InputLabel>
                                            <Select
                                                value={formPositionId}
                                                label="Chức vụ"
                                                onChange={(e) =>
                                                    setFormPositionId(
                                                        e.target.value === '' ? '' : Number(e.target.value),
                                                    )
                                                }
                                                sx={{
                                                    '& .MuiSelect-select': {
                                                        backgroundColor: '#F9FAFB',
                                                        borderRadius: '0.75rem',
                                                        paddingTop: '10px',
                                                        paddingBottom: '10px',
                                                    },
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#E5E7EB',
                                                    },
                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#93C5FD',
                                                    },
                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#3B82F6',
                                                    },
                                                }}
                                            >
                                                <MenuItem value="">— Chọn —</MenuItem>
                                                {positions.map((p) => (
                                                    <MenuItem key={p.id} value={p.id}>
                                                        {p.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <FormControl size="small" fullWidth>
                                            <InputLabel>Thứ</InputLabel>
                                            <Select
                                                value={formDayOfWeek}
                                                label="Thứ"
                                                onChange={(e) => setFormDayOfWeek(Number(e.target.value))}
                                                sx={{
                                                    '& .MuiSelect-select': {
                                                        backgroundColor: '#F9FAFB',
                                                        borderRadius: '0.75rem',
                                                        paddingTop: '10px',
                                                        paddingBottom: '10px',
                                                    },
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#E5E7EB',
                                                    },
                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#93C5FD',
                                                    },
                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#3B82F6',
                                                    },
                                                }}
                                            >
                                                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                                                    <MenuItem key={d} value={d}>
                                                        {DAY_LABELS[d]}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <FormControl size="small" fullWidth>
                                            <InputLabel>Buổi</InputLabel>
                                            <Select
                                                value={formIsAfternoon ? 1 : 0}
                                                label="Buổi"
                                                onChange={(e) => setFormIsAfternoon(e.target.value === 1)}
                                                sx={{
                                                    '& .MuiSelect-select': {
                                                        backgroundColor: '#F9FAFB',
                                                        borderRadius: '0.75rem',
                                                        paddingTop: '10px',
                                                        paddingBottom: '10px',
                                                    },
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#E5E7EB',
                                                    },
                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#93C5FD',
                                                    },
                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#3B82F6',
                                                    },
                                                }}
                                            >
                                                <MenuItem value={0}>Sáng</MenuItem>
                                                <MenuItem value={1}>Chiều</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handleAdd}
                                            disabled={createMutation.isPending || !formPositionId}
                                            className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium shadow-sm transition-all ${
                                                createMutation.isPending || !formPositionId
                                                    ? 'bg-blue-500/60 text-white opacity-50 cursor-not-allowed'
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                            }`}
                                        >
                                            <Plus className="h-4 w-4" />
                                            {createMutation.isPending ? 'Đang thêm...' : 'Thêm'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Box>

                    {selectedStaffId && (
                        <Box className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-2">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-base md:text-lg font-semibold text-gray-800">
                                        Lịch cố định đã cấu hình
                                    </h3>
                                </div>
                            </div>

                            {loadingSchedules ? (
                                <div className="py-3 text-sm text-gray-500">Đang tải...</div>
                            ) : schedules.length === 0 ? (
                                <div className="py-3 text-sm text-gray-500">Chưa có dữ liệu.</div>
                            ) : (
                                <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full">
                                    {/* Header */}
                                    <div className="bg-gray-50/50 border-b border-gray-100">
                                        <div className="grid grid-cols-8">
                                            <div className="flex items-center justify-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-4 border-r border-gray-100">
                                                Buổi / Ngày
                                            </div>
                                            {DAY_SHORT_LABELS.map((label) => (
                                                <div
                                                    key={label}
                                                    className="flex flex-col items-center justify-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-4 border-r last:border-r-0 border-gray-100 text-center"
                                                >
                                                    <span>{label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="divide-y divide-gray-100">
                                        {[
                                            { label: 'Sáng', slotIndex: 0 },
                                            { label: 'Chiều', slotIndex: 1 },
                                        ].map(({ label, slotIndex }) => (
                                            <div
                                                key={label}
                                                className="grid grid-cols-8"
                                            >
                                                {/* Row label */}
                                                <div className="flex items-center justify-center px-4 py-6 text-base md:text-lg font-semibold text-gray-700 bg-gray-50/30 border-r border-gray-100">
                                                    {label}
                                                </div>

                                                {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                                                    const cellItems = scheduleMatrix[slotIndex][dayIdx];

                                                    return (
                                                        <div
                                                            key={dayIdx}
                                                            className="border-r border-b border-gray-100 p-3 flex flex-col justify-center gap-3 min-h-[140px]"
                                                        >
                                                            {cellItems.length === 0 ? (
                                                                <div className="flex-1 rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/30 flex items-center justify-center text-xs text-gray-400 hover:bg-gray-50 transition-colors">
                                                                    Chưa cấu hình
                                                                </div>
                                                            ) : (
                                                                cellItems.map((s) => (
                                                                    <div
                                                                        key={s.scheduleId}
                                                                        className="group relative w-full p-3 rounded-xl bg-white border border-gray-100 border-l-4 border-l-indigo-500 shadow-sm flex items-start justify-between"
                                                                    >
                                                                        <p className="text-base md:text-lg font-semibold text-gray-700 leading-snug line-clamp-3 pr-6">
                                                                            {s.positionName}
                                                                        </p>

                                                                        <button
                                                                            type="button"
                                                                            disabled={deleteMutation.isPending}
                                                                            onClick={() => {
                                                                                deleteMutation.mutate(s.scheduleId);
                                                                            }}
                                                                            className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Box>
                    )}
                </Box>
            </Box>
        </>
    );
};
