import { useMemo, useState } from 'react';
import { Box, Button, MenuItem, TextField } from '@mui/material';
import { ListHeader } from '../../../components/ui/ListHeader';
import { prefixAdmin } from '../../../constants/routes';
import { useStaffProfiles } from '../hooks/useStaffProfile';
import { useContractsByStaffId, useDeleteContract } from '../hooks/useContract';
import { DataGrid, GridActionsCell, GridActionsCellItem, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import { dataGridCardStyles, dataGridContainerStyles, dataGridStyles } from '../../service/configs/styles.config';
import { DATA_GRID_LOCALE_VN } from '../../service/configs/localeText.config';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import type { IContract } from '../../../api/contract.api';
import { EditIcon, DeleteIcon, EyeIcon } from '../../../assets/icons';

export const ContractListPage = () => {
    const [staffId, setStaffId] = useState<number | ''>('');
    const { data: profiles = [] } = useStaffProfiles();
    const { data: contracts = [], isLoading } = useContractsByStaffId(staffId || null);
    const { mutate: deleteContract } = useDeleteContract();
    const navigate = useNavigate();

    const contractsWithStaffName = useMemo(
        () =>
            contracts.map((c) => {
                const staff = profiles.find((p) => p.staffId === c.staffId);
                return {
                    ...c,
                    employeeName: staff?.fullName ?? `Nhân viên #${c.staffId}`,
                };
            }),
        [contracts, profiles]
    );

    const handleDelete = (row: IContract) => {
        if (!window.confirm(`Bạn có chắc muốn xóa hợp đồng #${row.contractId}?`)) return;
        deleteContract(row.contractId, {
            onSuccess: (res: any) => {
                if (res?.success) toast.success(res.message ?? 'Đã xóa hợp đồng');
                else toast.error(res?.message ?? 'Có lỗi');
            },
            onError: (err: any) => {
                const msg = err?.response?.data?.message ?? err?.message ?? 'Có lỗi xảy ra';
                toast.error(msg);
            },
        });
    };

    const RenderContractStatusCell = (params: GridRenderCellParams<IContract>) => {
        const status = params.row.status;
        const isActive = status === 'ACTIVE';
        const label = isActive ? 'Hoạt động' : status ?? 'Tạm dừng';
        const bg = isActive ? '#00B8D929' : '#EF444429';
        const text = isActive ? '#006C9C' : '#B91C1C';

        return (
            <span
                className="inline-flex items-center justify-center leading-1.5 min-w-[2.4rem] h-[2.4rem] text-[1.2rem] px-[6px] font-[700] rounded-[6px]"
                style={{ backgroundColor: bg, color: text }}
            >
                {label}
            </span>
        );
    };

    const RenderContractActionsCell = (params: { row: IContract }) => {
        const { row } = params;

        return (
            <GridActionsCell>
                <GridActionsCellItem
                    icon={<EyeIcon />}
                    label="Xem chi tiết"
                    showInMenu
                    onClick={() => {
                        navigate(`/${prefixAdmin}/staff/contract/detail/${row.contractId}`);
                    }}
                />
                <GridActionsCellItem
                    icon={<EditIcon />}
                    label="Sửa"
                    showInMenu
                    onClick={() => navigate(`/${prefixAdmin}/staff/contract/edit/${row.contractId}`)}
                />
                <GridActionsCellItem
                    icon={<DeleteIcon />}
                    label="Xóa"
                    showInMenu
                    sx={{ '& .MuiTypography-root': { color: '#FF5630' } }}
                    onClick={() => handleDelete(row)}
                />
            </GridActionsCell>
        );
    };

    const columns: GridColDef<IContract>[] = [
        {
            field: 'contractId',
            headerName: 'ID',
            width: 80,
        },
        {
            field: 'staffId',
            headerName: 'ID NV',
            width: 80,
        },
        {
            field: 'baseSalary',
            headerName: 'Lương cơ bản',
            minWidth: 140,
            flex: 1,
            valueGetter: (v: number) => (v != null ? Number(v).toLocaleString('vi-VN') : '—'),
        },
        {
            field: 'startDate',
            headerName: 'Ngày bắt đầu',
            minWidth: 140,
            flex: 1,
        },
        {
            field: 'endDate',
            headerName: 'Ngày kết thúc',
            minWidth: 140,
            flex: 1,
            valueGetter: (v: string) => v ?? '—',
        },
        {
            field: 'status',
            headerName: 'Trạng thái',
            width: 120,
            renderCell: RenderContractStatusCell,
        },
        {
            field: 'actions',
            headerName: '',
            type: 'actions',
            width: 80,
            sortable: false,
            renderCell: (params) => <RenderContractActionsCell row={params.row} />,
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
            <Box sx={{ px: '40px', mt: 3, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
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
                        rows={contractsWithStaffName}
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
