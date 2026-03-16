import { useMemo, useState } from 'react';
import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import Toolbar from '@mui/material/Toolbar';
import CircularProgress from '@mui/material/CircularProgress';
import { ListHeader } from '../../../components/ui/ListHeader';
import { prefixAdmin } from '../../../constants/routes';
import { useStaffProfiles } from '../hooks/useStaffProfile';
import { useContractsByStaffId, useDeleteContract } from '../hooks/useContract';
import { DataGrid, GridActionsCell, GridActionsCellItem, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import { dataGridCardStyles, dataGridContainerStyles, dataGridStyles } from '../../service/configs/styles.config';
import { DATA_GRID_LOCALE_VN } from '../../service/configs/localeText.config';
import { SortAscendingIcon, SortDescendingIcon, UnsortedIcon } from '../../../assets/icons';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
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
                className="inline-flex items-center justify-center leading-1.5 min-w-[1.5rem] h-[1.5rem] text-[0.75rem] px-[6px] font-[700] rounded-[6px]"
                style={{ backgroundColor: bg, color: text }}
            >
                {label}
            </span>
        );
    };

    const RenderContractActionsCell = (params: GridRenderCellParams<IContract>) => {
        const { row } = params;

        return (
            <GridActionsCell {...params}>
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
            renderCell: (params) => <RenderContractActionsCell {...params} />,
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
                action={
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <TextField
                            select
                            label="Chọn nhân viên"
                            value={staffId}
                            onChange={(e) => setStaffId(e.target.value ? Number(e.target.value) : '')}
                            size="small"
                            sx={{ minWidth: 280, '& .MuiInputBase-root': { minHeight: 40 } }}
                        >
                            <MenuItem value="">— Tất cả —</MenuItem>
                            {profiles.map((p) => (
                                <MenuItem key={p.staffId} value={p.staffId}>
                                    {p.fullName} (ID: {p.staffId})
                                </MenuItem>
                            ))}
                        </TextField>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate(`/${prefixAdmin}/staff/contract/create`)}
                            sx={{
                                backgroundColor: '#1C252E',
                                minHeight: '40px',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                                px: 2.5,
                                borderRadius: '10px',
                                textTransform: 'none',
                                boxShadow: '0 8px 16px 0 rgba(28, 37, 46, 0.24)',
                                color: '#ffffff',
                                '&:hover': {
                                    backgroundColor: '#454F5B',
                                    boxShadow: 'none',
                                },
                            }}
                        >
                            Thêm hợp đồng
                        </Button>
                    </Stack>
                }
            />
            <Box sx={{ px: '40px', mt: 3 }}>
                <Card elevation={0} sx={dataGridCardStyles}>
                    <div style={dataGridContainerStyles}>
                        <DataGrid
                            rows={contractsWithStaffName}
                            getRowId={(row) => row.contractId}
                            showToolbar
                            loading={isLoading}
                            columns={columns}
                            density="comfortable"
                            slots={{
                                toolbar: () => <Toolbar sx={{ minHeight: 'auto', py: 1, px: 2 }} />,
                                columnSortedAscendingIcon: SortAscendingIcon,
                                columnSortedDescendingIcon: SortDescendingIcon,
                                columnUnsortedIcon: UnsortedIcon,
                                noRowsOverlay: () => (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                        {isLoading ? <CircularProgress size={32} /> : <span className="text-[1.125rem]">Không có dữ liệu</span>}
                                    </Box>
                                ),
                            }}
                            localeText={DATA_GRID_LOCALE_VN}
                            pagination
                            pageSizeOptions={[5, 10, 20, { value: -1, label: 'Tất cả' }]}
                            initialState={{
                                pagination: { paginationModel: { page: 0, pageSize: 10 } },
                                sorting: { sortModel: [{ field: 'contractId', sort: 'asc' }] },
                            }}
                            getRowHeight={() => 'auto'}
                            disableRowSelectionOnClick
                            sx={dataGridStyles}
                        />
                    </div>
                </Card>
            </Box>
        </>
    );
};
