import { useState } from 'react';
import { Box, Button, MenuItem, TextField } from '@mui/material';
import { ListHeader } from '../../../components/ui/ListHeader';
import { prefixAdmin } from '../../../constants/routes';
import { useStaffProfiles } from '../hooks/useStaffProfile';
import { useStaffSkillsByStaffId } from '../hooks/useStaffSkill';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import { dataGridCardStyles, dataGridContainerStyles, dataGridStyles } from '../../service/configs/styles.config';
import { DATA_GRID_LOCALE_VN } from '../../service/configs/localeText.config';
import type { IStaffSkill } from '../../../api/staffSkill.api';

const LEVEL_LABELS: Record<string, string> = { BEGINNER: 'Mới', INTERMEDIATE: 'Trung bình', ADVANCED: 'Nâng cao', EXPERT: 'Chuyên gia' };

export const StaffSkillListPage = () => {
    const [staffId, setStaffId] = useState<number | ''>('');
    const { data: profiles = [] } = useStaffProfiles();
    const { data: staffSkills = [], isLoading } = useStaffSkillsByStaffId(staffId || null);

    const columns: GridColDef<IStaffSkill>[] = [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'skillCode', headerName: 'Mã KN', width: 120 },
        { field: 'skillName', headerName: 'Kỹ năng', flex: 1, minWidth: 160 },
        { field: 'proficiencyLevel', headerName: 'Trình độ', width: 120, valueGetter: (v: string) => LEVEL_LABELS[v] ?? v },
        { field: 'commissionRate', headerName: '% Hoa hồng', width: 120 },
        { field: 'active', headerName: 'Hoạt động', width: 100, valueGetter: (v: boolean) => (v ? 'Có' : 'Không') },
    ];

    return (
        <>
            <ListHeader
                title="Kỹ năng nhân viên"
                breadcrumbItems={[
                    { label: 'Trang chủ', to: '/' },
                    { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                    { label: 'Kỹ năng nhân viên' },
                ]}
            />
            <Box sx={{ px: '40px', mb: 2 }}>
                <TextField
                    select
                    label="Chọn nhân viên"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value ? Number(e.target.value) : '')}
                    sx={{ minWidth: 280 }}
                >
                    <MenuItem value="">— Chọn nhân viên —</MenuItem>
                    {profiles.map((p) => (
                        <MenuItem key={p.staffId} value={p.staffId}>{p.fullName} (ID: {p.staffId})</MenuItem>
                    ))}
                </TextField>
            </Box>
            <Card elevation={0} sx={dataGridCardStyles}>
                <div style={dataGridContainerStyles}>
                    <DataGrid
                        rows={staffSkills}
                        getRowId={(row) => row.id}
                        loading={isLoading}
                        columns={columns}
                        localeText={DATA_GRID_LOCALE_VN}
                        pagination
                        pageSizeOptions={[5, 10, 20]}
                        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                        sx={dataGridStyles}
                    />
                </div>
            </Card>
        </>
    );
};
