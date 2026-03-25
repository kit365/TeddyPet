import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Toolbar from '@mui/material/Toolbar';
import { SortAscendingIcon, SortDescendingIcon, UnsortedIcon, EditIcon, DeleteIcon } from '../../../../assets/icons';
import { DATA_GRID_LOCALE_VN } from '../../../service/configs/localeText.config';
import { dataGridCardStyles, dataGridContainerStyles, dataGridStyles } from '../../../service/configs/styles.config';
import { useStaffPositions, useDeleteStaffPosition } from '../hooks/useStaffPosition';
import { useNavigate } from 'react-router-dom';
import { prefixAdmin } from '../../../../constants/routes';
import { toast } from 'react-toastify';
import type { IStaffPosition } from '../../../../api/staffPosition.api';
import { GridActionsCell, GridActionsCellItem } from '@mui/x-data-grid';

const RenderPositionActionsCell = (params: { row: IStaffPosition }) => {
    const navigate = useNavigate();
    const { mutate: deletePosition } = useDeleteStaffPosition();
    const { id } = params.row;

    const handleEdit = () => navigate(`/${prefixAdmin}/staff/position/edit/${id}`);
    const handleDelete = () => {
        if (window.confirm('Bạn có chắc muốn xóa chức vụ này?')) {
            deletePosition(id, {
                onSuccess: (res: { success?: boolean; message?: string }) => {
                    if (res?.success) toast.success('Đã xóa chức vụ');
                    else toast.error((res as any)?.message ?? 'Có lỗi');
                },
            });
        }
    };

    return (
        <GridActionsCell>
            <GridActionsCellItem icon={<EditIcon />} label="Sửa" showInMenu onClick={handleEdit} />
            <GridActionsCellItem
                icon={<DeleteIcon />}
                label="Xóa"
                showInMenu
                sx={{ '& .MuiTypography-root': { color: '#FF5630' } }}
                onClick={handleDelete}
            />
        </GridActionsCell>
    );
};

const RenderPositionStatusCell = (params: GridRenderCellParams<IStaffPosition>) => {
    const isActive = params.row.active;
    const label = isActive ? 'Hoạt động' : 'Tạm dừng';
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

const positionColumns: GridColDef<IStaffPosition>[] = [
    { field: 'id', headerName: 'ID', width: 80, type: 'number' },
    { field: 'code', headerName: 'Mã', width: 140 },
    { field: 'name', headerName: 'Tên chức vụ', flex: 1, minWidth: 180 },
    { field: 'description', headerName: 'Mô tả', flex: 1, minWidth: 200, valueGetter: (v: string) => v ?? '—' },
    { field: 'active', headerName: 'Trạng thái', width: 120, renderCell: RenderPositionStatusCell },
    {
        field: 'actions',
        headerName: '',
        width: 80,
        sortable: false,
        renderCell: (params) => <RenderPositionActionsCell row={params.row} />,
    },
];

export const StaffPositionList = () => {
    const { data: positions = [], isLoading } = useStaffPositions();

    return (
        <Card
            elevation={0}
            sx={{
                ...dataGridCardStyles,
                height: 'auto',
            }}
        >
            <div style={dataGridContainerStyles}>
                <DataGrid
                    rows={positions}
                    getRowId={(row) => row.id}
                    showToolbar
                    loading={isLoading}
                    columns={positionColumns}
                    density="comfortable"
                    autoHeight
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
                        sorting: { sortModel: [{ field: 'id', sort: 'asc' }] },
                        columns: { columnOrder: ['id', 'code', 'name', 'description', 'active', 'actions'] },
                    }}
                    getRowHeight={() => 'auto'}
                    disableRowSelectionOnClick
                    sx={{
                        ...dataGridStyles,
                        '&.MuiDataGrid-root': {
                            ...dataGridStyles['&.MuiDataGrid-root'],
                            overflow: 'hidden',
                        },
                    }}
                />
            </div>
        </Card>
    );
};
