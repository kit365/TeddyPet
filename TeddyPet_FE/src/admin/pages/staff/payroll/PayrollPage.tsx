import { useState } from 'react';
import { Box, Button, MenuItem, TextField } from '@mui/material';
import { ListHeader } from '../../../components/ui/ListHeader';
import { prefixAdmin } from '../../../constants/routes';
import { usePayrollByMonthYear, useRunPayroll } from '../hooks/usePayroll';
import { useStaffProfiles } from '../hooks/useStaffProfile';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import { dataGridCardStyles, dataGridContainerStyles, dataGridStyles } from '../../service/configs/styles.config';
import { DATA_GRID_LOCALE_VN } from '../../service/configs/localeText.config';
import type { ISalaryLog } from '../../../api/payroll.api';
import { toast } from 'react-toastify';

const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

export const PayrollPage = () => {
    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear);
    const [staffId, setStaffId] = useState<number | ''>('');

    const { data: profiles = [] } = useStaffProfiles();
    const { data: logs = [], isLoading } = usePayrollByMonthYear(month, year, staffId || null);
    const { mutate: runPayroll, isPending: running } = useRunPayroll();

    const handleRun = () => {
        runPayroll(
            { month, year, staffId: staffId || undefined },
            {
                onSuccess: (res: any) => {
                    if (res?.success) toast.success(res.message ?? 'Tính lương thành công');
                    else toast.error(res?.message ?? 'Có lỗi');
                },
            }
        );
    };

    const columns: GridColDef<ISalaryLog>[] = [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'staffName', headerName: 'Nhân viên', flex: 1, minWidth: 160 },
        { field: 'month', headerName: 'Tháng', width: 80 },
        { field: 'year', headerName: 'Năm', width: 80 },
        { field: 'totalMinutes', headerName: 'Tổng phút', width: 100 },
        { field: 'baseSalaryAmount', headerName: 'Lương cơ bản', width: 120, valueGetter: (v: number) => (v != null ? Number(v).toLocaleString('vi-VN') : '—') },
        { field: 'totalCommission', headerName: 'Hoa hồng', width: 120, valueGetter: (v: number) => (v != null ? Number(v).toLocaleString('vi-VN') : '—') },
        { field: 'totalDeduction', headerName: 'Khấu trừ', width: 120, valueGetter: (v: number) => (v != null ? Number(v).toLocaleString('vi-VN') : '—') },
        { field: 'finalSalary', headerName: 'Thực lĩnh', width: 120, valueGetter: (v: number) => (v != null ? Number(v).toLocaleString('vi-VN') : '—') },
        { field: 'status', headerName: 'Trạng thái', width: 100 },
    ];

    return (
        <>
            <ListHeader
                title="Lương nhân viên"
                breadcrumbItems={[
                    { label: 'Trang chủ', to: '/' },
                    { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                    { label: 'Lương' },
                ]}
            />
            <Box sx={{ px: '40px', mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <TextField select label="Tháng" value={month} onChange={(e) => setMonth(Number(e.target.value))} sx={{ minWidth: 100 }}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                </TextField>
                <TextField select label="Năm" value={year} onChange={(e) => setYear(Number(e.target.value))} sx={{ minWidth: 100 }}>
                    {[currentYear, currentYear - 1, currentYear + 1].map((y) => (
                        <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                </TextField>
                <TextField
                    select
                    label="Nhân viên"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value ? Number(e.target.value) : '')}
                    sx={{ minWidth: 200 }}
                >
                    <MenuItem value="">Tất cả</MenuItem>
                    {profiles.map((p) => (
                        <MenuItem key={p.staffId} value={p.staffId}>{p.fullName}</MenuItem>
                    ))}
                </TextField>
                <Button variant="contained" onClick={handleRun} disabled={running}>{running ? 'Đang tính...' : 'Chạy tính lương'}</Button>
            </Box>
            <Card elevation={0} sx={dataGridCardStyles}>
                <div style={dataGridContainerStyles}>
                    <DataGrid
                        rows={logs}
                        getRowId={(row) => row.id}
                        loading={isLoading}
                        columns={columns}
                        localeText={DATA_GRID_LOCALE_VN}
                        pagination
                        pageSizeOptions={[10, 20]}
                        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                        sx={dataGridStyles}
                    />
                </div>
            </Card>
        </>
    );
};
