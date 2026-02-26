import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Toolbar from '@mui/material/Toolbar';
import { SortAscendingIcon, SortDescendingIcon, UnsortedIcon, EyeIcon } from '../../../assets/icons';
import { DATA_GRID_LOCALE_VN } from '../../service/configs/localeText.config';
import { dataGridCardStyles, dataGridContainerStyles, dataGridStyles } from '../../service/configs/styles.config';
import { useEffect } from 'react';
import { useUsers } from '../hooks/useUser';
import { useNavigate } from 'react-router-dom';
import { prefixAdmin } from '../../../constants/routes';
import { toast } from 'react-toastify';
import type { IUserProfile, UserStatusEnum } from '../../../api/user.api';
import { GridActionsCell, GridActionsCellItem } from '@mui/x-data-grid';

const STATUS_LABELS: Record<UserStatusEnum, string> = {
    ACTIVE: 'Hoạt động',
    INACTIVE: 'Không hoạt động',
    LOCKED: 'Khóa',
    PENDING_VERIFICATION: 'Chờ xác thực',
};

const userColumns: GridColDef<IUserProfile>[] = [
    {
        field: 'id',
        headerName: 'ID',
        width: 100,
        valueGetter: (v: string) => (v ? String(v).slice(0, 8) + '…' : '—'),
    },
    { field: 'username', headerName: 'Tên đăng nhập', flex: 1, minWidth: 140 },
    { field: 'email', headerName: 'Email', width: 200, valueGetter: (v: string) => v ?? '—' },
    {
        field: 'fullName',
        headerName: 'Họ tên',
        width: 180,
        valueGetter: (_, row) => [row.firstName, row.lastName].filter(Boolean).join(' ') || '—',
    },
    { field: 'phoneNumber', headerName: 'SĐT', width: 120, valueGetter: (v: string) => v ?? '—' },
    { field: 'role', headerName: 'Vai trò', width: 120, valueGetter: (v: string) => v ?? '—' },
    {
        field: 'status',
        headerName: 'Trạng thái',
        width: 130,
        valueGetter: (v: UserStatusEnum) => STATUS_LABELS[v] ?? v ?? '—',
    },
];

export const UserList = () => {
    const { data: users = [], isLoading, isError } = useUsers();
    const navigate = useNavigate();

    useEffect(() => {
        if (isError) {
            toast.error('Không tải được danh sách. Đăng xuất rồi đăng nhập lại bằng tài khoản ADMIN.');
        }
    }, [isError]);

    const columns: GridColDef<IUserProfile>[] = [
        ...userColumns,
        {
            field: 'actions',
            headerName: '',
            width: 80,
            sortable: false,
            renderCell: (params) => {
                const fullName = [params.row.firstName, params.row.lastName].filter(Boolean).join(' ').trim();
                const inviteStaffPath = `/${prefixAdmin}/staff/profile/onboarding?${new URLSearchParams({
                    ...(params.row.email && { email: params.row.email }),
                    ...(fullName && { fullName }),
                    ...(params.row.phoneNumber && { phoneNumber: params.row.phoneNumber }),
                }).toString()}`;
                return (
                    <GridActionsCell>
                        <GridActionsCellItem
                            icon={<EyeIcon />}
                            label="Xem"
                            showInMenu
                            onClick={() => navigate(`/${prefixAdmin}/user/detail/${params.row.id}`)}
                        />
                        <GridActionsCellItem
                            label="Mời làm nhân viên"
                            showInMenu
                            onClick={() => navigate(inviteStaffPath)}
                        />
                    </GridActionsCell>
                );
            },
        },
    ];

    return (
        <Card elevation={0} sx={dataGridCardStyles}>
            <div style={dataGridContainerStyles}>
                <DataGrid
                    rows={users}
                    getRowId={(row) => row.id}
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
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1 }}>
                                {isLoading && <CircularProgress size={32} />}
                                {!isLoading && isError && (
                                    <span className="text-[1.8rem]" style={{ color: '#d32f2f', textAlign: 'center', maxWidth: 360 }}>
                                        Không tải được danh sách. Vui lòng đăng xuất, đăng nhập lại bằng tài khoản ADMIN (ví dụ admin@gmail.com) và thử lại.
                                    </span>
                                )}
                                {!isLoading && !isError && <span className="text-[1.8rem]">Không có dữ liệu</span>}
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
