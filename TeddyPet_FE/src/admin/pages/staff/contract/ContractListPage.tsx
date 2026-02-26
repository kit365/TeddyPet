import { useState } from 'react';
import { Box, Button, MenuItem, TextField } from '@mui/material';
import { ListHeader } from '../../../components/ui/ListHeader';
import { prefixAdmin } from '../../../constants/routes';
import { useStaffProfiles } from '../hooks/useStaffProfile';
import { useContractsByStaffId } from '../hooks/useContract';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import { dataGridCardStyles, dataGridContainerStyles, dataGridStyles } from '../../service/configs/styles.config';
import { DATA_GRID_LOCALE_VN } from '../../service/configs/localeText.config';
import { useNavigate } from 'react-router-dom';
import type { IContract } from '../../../api/contract.api';

export const ContractListPage = () => {
    const [staffId, setStaffId] = useState<number | ''>('');
    const { data: profiles = [] } = useStaffProfiles();
    const { data: contracts = [], isLoading } = useContractsByStaffId(staffId || null);
    const navigate = useNavigate();

    const columns: GridColDef<IContract>[] = [
        { field: 'contractId', headerName: 'ID', width: 80 },
        { field: 'staffId', headerName: 'ID NV', width: 80 },
        {
            field: 'baseSalary',
            headerName: 'Lương cơ bản',
            width: 140,
            valueGetter: (v: number) => (v != null ? Number(v).toLocaleString('vi-VN') : '—'),
        },
        { field: 'startDate', headerName: 'Ngày bắt đầu', width: 120 },
        { field: 'endDate', headerName: 'Ngày kết thúc', width: 120, valueGetter: (v: string) => v ?? '—' },
        { field: 'status', headerName: 'Trạng thái', width: 120 },
        {
            field: 'actions',
            headerName: '',
            width: 80,
            sortable: false,
            renderCell: (params) => (
                <Button size="small" onClick={() => navigate(`/${prefixAdmin}/staff/contract/edit/${params.row.contractId}`)}>
                    Sửa
                </Button>
            ),
        },
    ];

    return (
        <>
            <ListHeader
                title="Hợp đồng nhân viên"
                breadcrumbItems={[
                    { label: 'Trang chủ', to: '/' },
                    { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                    { label: 'Hợp đồng' },
                ]}
                addButtonLabel="Thêm hợp đồng"
                addButtonPath={`/${prefixAdmin}/staff/contract/create`}
            />
            <Box sx={{ px: '40px', mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                {!staffId && <Box sx={{ color: 'text.secondary' }}>Chọn nhân viên để xem hợp đồng</Box>}
                <TextField
                    select
                    label="Chọn nhân viên"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value ? Number(e.target.value) : '')}
                    sx={{ minWidth: 280 }}
                >
                    <MenuItem value="">— Tất cả —</MenuItem>
                    {profiles.map((p) => (
                        <MenuItem key={p.staffId} value={p.staffId}>
                            {p.fullName} (ID: {p.staffId})
                        </MenuItem>
                    ))}
                </TextField>
            </Box>
            <Card elevation={0} sx={dataGridCardStyles}>
                <div style={dataGridContainerStyles}>
                    <DataGrid
                        rows={contracts}
                        getRowId={(row) => row.contractId}
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
