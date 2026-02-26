import { useState } from 'react';
import { Box, Button, Stack, TextField } from '@mui/material';
import { ListHeader } from '../../../components/ui/ListHeader';
import { prefixAdmin } from '../../../constants/routes';
import { useCreateOpenShift, useAvailableShifts, useRegistrationsForShift, useApproveRegistration } from '../hooks/useWorkShift';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import { dataGridCardStyles, dataGridContainerStyles, dataGridStyles } from '../../service/configs/styles.config';
import { DATA_GRID_LOCALE_VN } from '../../service/configs/localeText.config';
import { toast } from 'react-toastify';
import type { IWorkShift, IWorkShiftRegistration } from '../../../api/workShift.api';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const STATUS_LABELS: Record<string, string> = { OPEN: 'Trống', ASSIGNED: 'Đã gán', COMPLETED: 'Hoàn thành', CANCELLED: 'Hủy' };

export const WorkShiftAdminPage = () => {
    const [from, setFrom] = useState<string>(dayjs().startOf('month').toISOString());
    const [to, setTo] = useState<string>(dayjs().endOf('month').toISOString());
    const [createStart, setCreateStart] = useState<string>('');
    const [createEnd, setCreateEnd] = useState<string>('');
    const [showCreate, setShowCreate] = useState(false);
    const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);

    const { data: shifts = [], isLoading } = useAvailableShifts(from, to);
    const { data: registrations = [], isLoading: regLoading } = useRegistrationsForShift(selectedShiftId);
    const { mutate: createShift, isPending: creating } = useCreateOpenShift();
    const { mutate: approve } = useApproveRegistration();

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
                        toast.success(res.message ?? 'Tạo ca trống thành công');
                        setShowCreate(false);
                        setCreateStart('');
                        setCreateEnd('');
                    } else toast.error(res?.message ?? 'Có lỗi');
                },
            }
        );
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

    const columns: GridColDef<IWorkShift>[] = [
        { field: 'shiftId', headerName: 'ID', width: 80 },
        { field: 'startTime', headerName: 'Bắt đầu', width: 160, valueGetter: (v: string) => (v ? new Date(v).toLocaleString('vi-VN') : '—') },
        { field: 'endTime', headerName: 'Kết thúc', width: 160, valueGetter: (v: string) => (v ? new Date(v).toLocaleString('vi-VN') : '—') },
        { field: 'status', headerName: 'Trạng thái', width: 120, valueGetter: (v: string) => STATUS_LABELS[v] ?? v },
        { field: 'staffFullName', headerName: 'Nhân viên', width: 160, valueGetter: (_, row) => row.staffFullName ?? '—' },
        {
            field: 'actions',
            headerName: '',
            width: 120,
            sortable: false,
            renderCell: (params) => (
                <Button size="small" onClick={() => setSelectedShiftId(params.row.shiftId)}>
                    Xem đăng ký
                </Button>
            ),
        },
    ];

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
                    <Button variant="contained" onClick={() => setShowCreate(true)}>Tạo ca trống</Button>
                </Stack>

                {showCreate && (
                    <Box sx={{ mt: 2, p: 2, border: '1px solid #919eab33', borderRadius: 2, maxWidth: 400 }}>
                        <DateTimePicker label="Giờ bắt đầu" value={createStart ? dayjs(createStart) : null} onChange={(d) => setCreateStart(d?.toISOString() ?? '')} slotProps={{ textField: { fullWidth: true } }} />
                        <Box sx={{ mt: 2 }}>
                            <DateTimePicker label="Giờ kết thúc" value={createEnd ? dayjs(createEnd) : null} onChange={(d) => setCreateEnd(d?.toISOString() ?? '')} slotProps={{ textField: { fullWidth: true } }} />
                        </Box>
                        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                            <Button variant="contained" onClick={handleCreate} disabled={creating}>Tạo</Button>
                            <Button variant="outlined" onClick={() => setShowCreate(false)}>Hủy</Button>
                        </Stack>
                    </Box>
                )}
            </Box>

            <Box sx={{ px: '40px', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Card elevation={0} sx={{ ...dataGridCardStyles, flex: 1, minWidth: 400 }}>
                    <div style={dataGridContainerStyles}>
                        <DataGrid
                            rows={shifts}
                            getRowId={(row) => row.shiftId}
                            loading={isLoading}
                            columns={columns}
                            localeText={DATA_GRID_LOCALE_VN}
                            pagination
                            pageSizeOptions={[5, 10]}
                            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                            sx={dataGridStyles}
                        />
                    </div>
                </Card>
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
            </Box>
        </LocalizationProvider>
    );
};
