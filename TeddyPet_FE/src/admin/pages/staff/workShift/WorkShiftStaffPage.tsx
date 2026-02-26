import { useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { ListHeader } from '../../../components/ui/ListHeader';
import { prefixAdmin } from '../../../constants/routes';
import { useAvailableShifts, useRegisterForShift, useMyShifts } from '../hooks/useWorkShift';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import { dataGridCardStyles, dataGridContainerStyles, dataGridStyles } from '../../service/configs/styles.config';
import { DATA_GRID_LOCALE_VN } from '../../service/configs/localeText.config';
import { toast } from 'react-toastify';
import type { IWorkShift } from '../../../api/workShift.api';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const STATUS_LABELS: Record<string, string> = { OPEN: 'Trống', ASSIGNED: 'Đã gán', COMPLETED: 'Hoàn thành', CANCELLED: 'Hủy' };

export const WorkShiftStaffPage = () => {
    const [from, setFrom] = useState<string>(dayjs().startOf('month').toISOString());
    const [to, setTo] = useState<string>(dayjs().endOf('month').toISOString());

    const { data: availableShifts = [], isLoading: loadingAvailable } = useAvailableShifts(from, to);
    const { data: myShifts = [], isLoading: loadingMy } = useMyShifts(from, to);
    const { mutate: registerForShift, isPending: registering } = useRegisterForShift();

    const handleRegister = (shiftId: number) => {
        registerForShift(shiftId, {
            onSuccess: (res: any) => {
                if (res?.success) {
                    toast.success(res.message ?? 'Đăng ký ca thành công. Chờ admin duyệt.');
                } else toast.error(res?.message ?? 'Đăng ký thất bại');
            },
        });
    };

    const availableColumns: GridColDef<IWorkShift>[] = [
        { field: 'shiftId', headerName: 'ID', width: 80 },
        { field: 'startTime', headerName: 'Bắt đầu', width: 180, valueGetter: (v: string) => (v ? new Date(v).toLocaleString('vi-VN') : '—') },
        { field: 'endTime', headerName: 'Kết thúc', width: 180, valueGetter: (v: string) => (v ? new Date(v).toLocaleString('vi-VN') : '—') },
        { field: 'status', headerName: 'Trạng thái', width: 120, valueGetter: (v: string) => STATUS_LABELS[v] ?? v },
        {
            field: 'actions',
            headerName: '',
            width: 120,
            sortable: false,
            renderCell: (params) => (
                <Button
                    size="small"
                    variant="contained"
                    disabled={registering}
                    onClick={() => handleRegister(params.row.shiftId)}
                >
                    Đăng ký ca
                </Button>
            ),
        },
    ];

    const myShiftColumns: GridColDef<IWorkShift>[] = [
        { field: 'shiftId', headerName: 'ID', width: 80 },
        { field: 'startTime', headerName: 'Bắt đầu', width: 180, valueGetter: (v: string) => (v ? new Date(v).toLocaleString('vi-VN') : '—') },
        { field: 'endTime', headerName: 'Kết thúc', width: 180, valueGetter: (v: string) => (v ? new Date(v).toLocaleString('vi-VN') : '—') },
        { field: 'status', headerName: 'Trạng thái', width: 120, valueGetter: (v: string) => STATUS_LABELS[v] ?? v },
    ];

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <ListHeader
                title="Đăng ký ca làm việc"
                breadcrumbItems={[
                    { label: 'Trang chủ', to: '/' },
                    { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                    { label: 'Đăng ký ca' },
                ]}
            />
            <Box sx={{ px: '40px', mb: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                    <DateTimePicker
                        label="Từ"
                        value={from ? dayjs(from) : null}
                        onChange={(d) => setFrom(d?.toISOString() ?? '')}
                        slotProps={{ textField: { size: 'small' } }}
                    />
                    <DateTimePicker
                        label="Đến"
                        value={to ? dayjs(to) : null}
                        onChange={(d) => setTo(d?.toISOString() ?? '')}
                        slotProps={{ textField: { size: 'small' } }}
                    />
                </Stack>
            </Box>

            <Box sx={{ px: '40px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                    <Box sx={{ fontWeight: 600, mb: 1, fontSize: '1.5rem' }}>Ca trống có thể đăng ký</Box>
                    <Card elevation={0} sx={dataGridCardStyles}>
                        <div style={dataGridContainerStyles}>
                            <DataGrid
                                rows={availableShifts}
                                getRowId={(row) => row.shiftId}
                                loading={loadingAvailable}
                                columns={availableColumns}
                                localeText={DATA_GRID_LOCALE_VN}
                                pagination
                                pageSizeOptions={[5, 10]}
                                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                                sx={dataGridStyles}
                            />
                        </div>
                    </Card>
                    {availableShifts.length === 0 && !loadingAvailable && (
                        <Box sx={{ color: 'text.secondary', py: 2 }}>Không có ca trống trong khoảng thời gian đã chọn.</Box>
                    )}
                </Box>

                <Box>
                    <Box sx={{ fontWeight: 600, mb: 1, fontSize: '1.5rem' }}>Ca của tôi (đã được phân bổ)</Box>
                    <Card elevation={0} sx={dataGridCardStyles}>
                        <div style={dataGridContainerStyles}>
                            <DataGrid
                                rows={myShifts}
                                getRowId={(row) => row.shiftId}
                                loading={loadingMy}
                                columns={myShiftColumns}
                                localeText={DATA_GRID_LOCALE_VN}
                                pagination
                                pageSizeOptions={[5, 10]}
                                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                                sx={dataGridStyles}
                            />
                        </div>
                    </Card>
                    {myShifts.length === 0 && !loadingMy && (
                        <Box sx={{ color: 'text.secondary', py: 2 }}>Bạn chưa có ca nào được phân bổ trong khoảng thời gian này.</Box>
                    )}
                </Box>
            </Box>
        </LocalizationProvider>
    );
};
