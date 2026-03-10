import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { SortAscendingIcon, SortDescendingIcon, UnsortedIcon, EditIcon, DeleteIcon, GoLiveIcon } from '../../../../assets/icons';

/** Wraps Data Grid sort icons so React doesn't receive the non-DOM `sortingOrder` prop on the underlying element. */
function SortIconWrapper({
    Icon,
    ...props
}: { Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> } & Record<string, unknown>) {
    const { sortingOrder: _omit, ...rest } = props;
    return <Icon {...(rest as React.SVGProps<SVGSVGElement>)} />;
}
import { DATA_GRID_LOCALE_VN } from '../../../service/configs/localeText.config';
import { dataGridCardStyles, dataGridContainerStyles, dataGridStyles } from '../../../service/configs/styles.config';
import { useStaffProfiles, useDeactivateStaff, useReactivateStaff } from '../../hooks/useStaffProfile';
import { useNavigate } from 'react-router-dom';
import { prefixAdmin } from '../../../../constants/routes';
import { toast } from 'react-toastify';
import type { IStaffProfile } from '../../../../api/staffProfile.api';
import { GridActionsCell, GridActionsCellItem, GridRenderCellParams } from '@mui/x-data-grid';

const GENDER_LABELS: Record<string, string> = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' };
const EMPLOYMENT_TYPE_LABELS: Record<string, string> = { PART_TIME: 'Bán thời gian', FULL_TIME: 'Toàn thời gian' };

const RenderStaffActionsCell = (params: GridRenderCellParams<IStaffProfile>) => {
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
        <GridActionsCell {...params}>
            <GridActionsCellItem icon={<EditIcon />} label="Sửa" showInMenu onClick={handleEdit} />
            {userId && active && (
                <GridActionsCellItem
                    icon={<DeleteIcon />}
                    label={<span style={{ color: '#FF5630' }}>Ngừng HĐ</span>}
                    showInMenu
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
    { field: 'staffId', headerName: 'ID', width: 64, flex: 0 },
    { field: 'fullName', headerName: 'Họ tên', minWidth: 100, flex: 1 },
    { field: 'email', headerName: 'Email', minWidth: 120, width: 140, flex: 0, valueGetter: (v: string) => v ?? '—' },
    { field: 'phoneNumber', headerName: 'SĐT', width: 100, flex: 0, valueGetter: (v: string) => v ?? '—' },
    {
        field: 'positionName',
        headerName: 'Chức vụ',
        headerClassName: 'column-header-position',
        minWidth: 90,
        flex: 1,
        valueGetter: (v: string) => v ?? '—',
        renderCell: (params) => {
            const text = (params.value as string) ?? '—';
            return (
                <Tooltip title={text} enterDelay={300}>
                    <Typography
                        sx={{
                            fontSize: '1.4rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
                        }}
                    >
                        {text}
                    </Typography>
                </Tooltip>
            );
        },
    },
    {
        field: 'employmentType',
        headerName: 'Loại hình',
        width: 105,
        flex: 0,
        valueGetter: (v: string) => (v ? EMPLOYMENT_TYPE_LABELS[v] ?? v : '—'),
        renderCell: (params) => {
            const raw = params.value as string | undefined;
            if (!raw) return <span className="text-xs text-gray-400">—</span>;
            const isFullTime = raw.includes('Toàn thời gian');
            const baseClasses =
                'inline-flex items-center rounded-full px-2.5 py-0.5 font-medium border whitespace-nowrap';
            const fullClasses = `${baseClasses} bg-blue-50 text-blue-700 border-blue-200`;
            const partClasses = `${baseClasses} bg-purple-50 text-purple-700 border-purple-200`;
            return (
                <span
                    className={isFullTime ? fullClasses : partClasses}
                    style={{ fontSize: '1.3rem', whiteSpace: 'nowrap' }}
                >
                    {raw}
                </span>
            );
        },
    },
    {
        field: 'gender',
        headerName: 'Giới tính',
        width: 80,
        flex: 0,
        valueGetter: (v: string) => GENDER_LABELS[v] ?? v ?? '—',
    },
    {
        field: 'userId',
        headerName: 'Tài khoản',
        width: 95,
        flex: 0,
        valueGetter: (_, row) => (row.userId ? 'Đã cấp' : 'Chưa cấp'),
        renderCell: (params) => {
            const row = params.row as IStaffProfile;
            if (row.userId) {
                return (
                    <button
                        type="button"
                        className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[1.3rem] font-medium text-emerald-700 whitespace-nowrap"
                    >
                        Đã cấp
                    </button>
                );
            }
            return <span className="text-[1.3rem] text-gray-400 whitespace-nowrap">Chưa cấp</span>;
        },
    },
    {
        field: 'active',
        headerName: 'Trạng thái',
        width: 105,
        flex: 0,
        valueGetter: (v: boolean) => (v ? 'Hoạt động' : 'Ngừng HĐ'),
        renderCell: (params) => {
            const isActive = Boolean((params.row as IStaffProfile).active);
            const label = isActive ? 'Hoạt động' : 'Ngừng HĐ';
            const bg = isActive ? '#00B8D929' : '#EF444429';
            const text = isActive ? '#006C9C' : '#B91C1C';

            return (
                <span
                    className="inline-flex items-center justify-center leading-1.5 min-w-[2.4rem] h-[2.4rem] text-[1.2rem] px-[6px] font-[700] rounded-[6px] whitespace-nowrap"
                    style={{ backgroundColor: bg, color: text }}
                >
                    {label}
                </span>
            );
        },
    },
    {
        field: 'actions',
        headerName: '',
        width: 72,
        flex: 0,
        sortable: false,
        renderCell: (params) => <RenderStaffActionsCell {...params} />,
    },
];

export const StaffProfileList = () => {
    const { data: profiles = [], isLoading } = useStaffProfiles();

    return (
        <Card elevation={0} sx={dataGridCardStyles}>
            <Box
                sx={{
                    ...dataGridContainerStyles,
                    maxWidth: '100%',
                    minWidth: 0,
                }}
            >
                <DataGrid
                    rows={profiles}
                    getRowId={(row) => row.staffId}
                    showToolbar
                    loading={isLoading}
                    columns={staffColumns}
                    density="comfortable"
                    slots={{
                        toolbar: () => <Toolbar sx={{ minHeight: 'auto', py: 1, px: 2 }} />,
                        columnSortedAscendingIcon: (props) => <SortIconWrapper Icon={SortAscendingIcon} {...props} />,
                        columnSortedDescendingIcon: (props) => <SortIconWrapper Icon={SortDescendingIcon} {...props} />,
                        columnUnsortedIcon: (props) => <SortIconWrapper Icon={UnsortedIcon} {...props} />,
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
                    disableRowSelectionOnClick
                    sx={{
                        ...dataGridStyles,
                        '&.MuiDataGrid-root': { overflow: 'hidden' },
                        '& .MuiDataGrid-virtualScroller': { overflowX: 'hidden' },
                        '& .MuiDataGrid-main': { minWidth: 0 },
                        '& .MuiDataGrid-columnHeader.column-header-position': { fontSize: '1.4rem' },
                    }}
                />
            </Box>
        </Card>
    );
};
