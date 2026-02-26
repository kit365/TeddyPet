import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Toolbar from '@mui/material/Toolbar';
import { SortAscendingIcon, SortDescendingIcon, UnsortedIcon, EditIcon, DeleteIcon, GoLiveIcon } from '../../../../assets/icons';
import { DATA_GRID_LOCALE_VN } from '../../../service/configs/localeText.config';
import { dataGridCardStyles, dataGridContainerStyles, dataGridStyles } from '../../../service/configs/styles.config';
import { useStaffProfiles, useDeactivateStaff, useReactivateStaff } from '../../hooks/useStaffProfile';
import { useNavigate } from 'react-router-dom';
import { prefixAdmin } from '../../../../constants/routes';
import { toast } from 'react-toastify';
import type { IStaffProfile } from '../../../../api/staffProfile.api';
import { GridActionsCell, GridActionsCellItem } from '@mui/x-data-grid';

const GENDER_LABELS: Record<string, string> = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' };

const RenderStaffActionsCell = (params: { row: IStaffProfile }) => {
    const navigate = useNavigate();
    const { mutate: deactivate } = useDeactivateStaff();
    const { mutate: reactivate } = useReactivateStaff();
    const { staffId, userId, active } = params.row;

    const handleEdit = () => navigate(`/${prefixAdmin}/staff/profile/edit/${staffId}`);
    const handleDeactivate = () => {
        if (window.confirm('Bạn có chắc muốn ngừng hoạt động nhân viên này?')) {
            deactivate(staffId, {
                onSuccess: (res: { success?: boolean; message?: string }) => {
                    if (res?.success) toast.success('Đã ngừng hoạt động');
                    else toast.error((res as any)?.message ?? 'Có lỗi');
                },
            });
        }
    };

    const handleReactivate = () => {
        if (window.confirm('Bạn có chắc muốn kích hoạt lại nhân viên này?')) {
            reactivate(staffId, {
                onSuccess: (res: { success?: boolean; message?: string }) => {
                    if (res?.success) toast.success('Đã kích hoạt lại');
                    else toast.error((res as any)?.message ?? 'Có lỗi');
                },
            });
        }
    };

    return (
        <GridActionsCell>
            <GridActionsCellItem icon={<EditIcon />} label="Sửa" showInMenu onClick={handleEdit} />
            {userId && active && (
                <GridActionsCellItem
                    icon={<DeleteIcon />}
                    label="Ngừng HĐ"
                    showInMenu
                    sx={{ '& .MuiTypography-root': { color: '#FF5630' } }}
                    onClick={handleDeactivate}
                />
            )}
            {userId && !active && (
                <GridActionsCellItem icon={<GoLiveIcon />} label="Kích hoạt lại" showInMenu onClick={handleReactivate} />
            )}
        </GridActionsCell>
    );
};

const staffColumns: GridColDef<IStaffProfile>[] = [
    { field: 'staffId', headerName: 'ID', width: 80 },
    { field: 'fullName', headerName: 'Họ tên', flex: 1, minWidth: 160 },
    { field: 'email', headerName: 'Email', width: 180, valueGetter: (v: string) => v ?? '—' },
    { field: 'phoneNumber', headerName: 'SĐT', width: 120, valueGetter: (v: string) => v ?? '—' },
    { field: 'positionName', headerName: 'Chức vụ', width: 140, valueGetter: (v: string) => v ?? '—' },
    {
        field: 'gender',
        headerName: 'Giới tính',
        width: 100,
        valueGetter: (v: string) => GENDER_LABELS[v] ?? v ?? '—',
    },
    {
        field: 'userId',
        headerName: 'Tài khoản',
        width: 120,
        valueGetter: (_, row) => (row.userId ? 'Đã cấp' : 'Chưa cấp'),
    },
    {
        field: 'active',
        headerName: 'Hoạt động',
        width: 100,
        valueGetter: (v: boolean) => (v ? 'Có' : 'Không'),
    },
    {
        field: 'actions',
        headerName: '',
        width: 80,
        sortable: false,
        renderCell: (params) => <RenderStaffActionsCell row={params.row} />,
    },
];

export const StaffProfileList = () => {
    const { data: profiles = [], isLoading } = useStaffProfiles();

    return (
        <Card elevation={0} sx={dataGridCardStyles}>
            <div style={dataGridContainerStyles}>
                <DataGrid
                    rows={profiles}
                    getRowId={(row) => row.staffId}
                    showToolbar
                    loading={isLoading}
                    columns={staffColumns}
                    density="comfortable"
                    slots={{
                        toolbar: () => <Toolbar sx={{ minHeight: 'auto', py: 1, px: 2 }} />,
                        columnSortedAscendingIcon: SortAscendingIcon,
                        columnSortedDescendingIcon: SortDescendingIcon,
                        columnUnsortedIcon: UnsortedIcon,
                        noRowsOverlay: () => (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                {isLoading ? <CircularProgress size={32} /> : <span className="text-[1.8rem]">Không có dữ liệu</span>}
                            </Box>
                        ),
                    }}
                    localeText={DATA_GRID_LOCALE_VN}
                    pagination
                    pageSizeOptions={[5, 10, 20, { value: -1, label: 'Tất cả' }]}
                    initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
                    getRowHeight={() => 'auto'}
                    checkboxSelection
                    disableRowSelectionOnClick
                    sx={dataGridStyles}
                />
            </div>
        </Card>
    );
};
