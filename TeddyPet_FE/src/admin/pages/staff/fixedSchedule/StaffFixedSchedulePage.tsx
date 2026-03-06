import { useState } from 'react';
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

const DAY_LABELS: Record<number, string> = {
    1: 'Thứ 2',
    2: 'Thứ 3',
    3: 'Thứ 4',
    4: 'Thứ 5',
    5: 'Thứ 6',
    6: 'Thứ 7',
    7: 'Chủ nhật',
};

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
            <Box sx={{ px: { xs: 2, sm: 3, md: '40px' }, pb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Cấu hình lịch cố định (thứ + buổi + chức vụ) cho nhân viên Full-time. Khi Admin tạo ca, hệ thống sẽ tự gán họ vào ca trùng lịch và số &quot;Đã duyệt&quot; sẽ tự cập nhật.
                </Typography>

                <Box sx={{ maxWidth: 560, mb: 3 }}>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Nhân viên (Full-time)</InputLabel>
                        <Select
                            value={selectedStaffId}
                            label="Nhân viên (Full-time)"
                            onChange={(e) => setSelectedStaffId(e.target.value === '' ? '' : Number(e.target.value))}
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
                                <MenuItem value="" disabled>Chưa có nhân viên Full-time</MenuItem>
                            )}
                        </Select>
                    </FormControl>

                    {selectedStaffId && (
                        <>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Thêm slot lịch cố định</Typography>
                            <Stack spacing={2}>
                                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ alignItems: 'center' }}>
                                    <FormControl size="small" sx={{ minWidth: 180, flex: '1 1 160px' }}>
                                        <InputLabel>Chức vụ</InputLabel>
                                        <Select
                                            value={formPositionId}
                                            label="Chức vụ"
                                            onChange={(e) => setFormPositionId(e.target.value === '' ? '' : Number(e.target.value))}
                                        >
                                            <MenuItem value="">— Chọn —</MenuItem>
                                            {positions.map((p) => (
                                                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <FormControl size="small" sx={{ minWidth: 140 }}>
                                        <InputLabel>Thứ</InputLabel>
                                        <Select
                                            value={formDayOfWeek}
                                            label="Thứ"
                                            onChange={(e) => setFormDayOfWeek(Number(e.target.value))}
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                                                <MenuItem key={d} value={d}>{DAY_LABELS[d]}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <FormControl size="small" sx={{ minWidth: 120 }}>
                                        <InputLabel>Buổi</InputLabel>
                                        <Select
                                            value={formIsAfternoon ? 1 : 0}
                                            label="Buổi"
                                            onChange={(e) => setFormIsAfternoon(e.target.value === 1)}
                                        >
                                            <MenuItem value={0}>Sáng</MenuItem>
                                            <MenuItem value={1}>Chiều</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Stack>
                                <Box>
                                    <Button
                                        variant="contained"
                                        onClick={handleAdd}
                                        disabled={createMutation.isPending || !formPositionId}
                                    >
                                        {createMutation.isPending ? 'Đang thêm...' : 'Thêm'}
                                    </Button>
                                </Box>
                            </Stack>
                        </>
                    )}
                </Box>

                {selectedStaffId && (
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                        <Typography variant="subtitle2" sx={{ p: 2, bgcolor: 'grey.50' }}>
                            Lịch cố định đã cấu hình
                        </Typography>
                        {loadingSchedules ? (
                            <Box sx={{ p: 2, color: 'text.secondary' }}>Đang tải...</Box>
                        ) : schedules.length === 0 ? (
                            <Box sx={{ p: 2, color: 'text.secondary' }}>Chưa có slot nào. Thêm bên trên.</Box>
                        ) : (
                            <Stack component="ul" sx={{ listStyle: 'none', m: 0, p: 2, gap: 1 }}>
                                {schedules.map((s) => (
                                    <Box
                                        key={s.scheduleId}
                                        component="li"
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 1,
                                            py: 0.75,
                                            px: 1.5,
                                            bgcolor: 'background.default',
                                            borderRadius: 1,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                        }}
                                    >
                                        <Typography variant="body2">
                                            {DAY_LABELS[s.dayOfWeek] ?? `Thứ ${s.dayOfWeek}`} · {s.isAfternoon ? 'Chiều' : 'Sáng'} · {s.positionName}
                                        </Typography>
                                        <Button
                                            size="small"
                                            color="error"
                                            variant="outlined"
                                            disabled={deleteMutation.isPending}
                                            onClick={() => {
                                                deleteMutation.mutate(s.scheduleId);
                                            }}
                                        >
                                            Xóa
                                        </Button>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </Box>
                )}
            </Box>
        </>
    );
};
