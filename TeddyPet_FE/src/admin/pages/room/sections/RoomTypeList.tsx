import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Toolbar from '@mui/material/Toolbar';
import { SortAscendingIcon, SortDescendingIcon, UnsortedIcon, EditIcon, DeleteIcon } from '../../../assets/icons';
import { DATA_GRID_LOCALE_VN } from '../../service/configs/localeText.config';
import { dataGridCardStyles, dataGridContainerStyles, dataGridStyles } from '../../service/configs/styles.config';
import { useRoomTypes } from '../hooks/useRoomType';
import { useDeleteRoomType } from '../hooks/useRoomType';
import { useNavigate } from 'react-router-dom';
import { prefixAdmin } from '../../../constants/routes';
import { toast } from 'react-toastify';
import type { IRoomType } from '../../../api/room.api';
import { RenderStatusCell, RenderCreatedAtCell } from '../../service/utils/render-cells';
import { GridActionsCell } from '@mui/x-data-grid';

const RenderRoomTypeActionsCell = (params: { row: IRoomType }) => {
    const navigate = useNavigate();
    const { mutate: deleteRoomType } = useDeleteRoomType();
    const { roomTypeId } = params.row;

    const handleEdit = () => navigate(`/${prefixAdmin}/room-type/edit/${roomTypeId}`);
    const handleDelete = () => {
        if (window.confirm('Bạn có chắc muốn xóa loại phòng này?')) {
            deleteRoomType(roomTypeId, {
                onSuccess: (res: { success?: boolean; message?: string }) => {
                    if (res?.success) toast.success('Đã xóa loại phòng');
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

const roomTypeColumns: GridColDef<IRoomType>[] = [
    { field: 'typeName', headerName: 'Tên loại phòng', flex: 1, minWidth: 180 },
    {
        field: 'serviceName',
        headerName: 'Dịch vụ',
        width: 160,
        valueGetter: (_, row) => row.serviceName ?? '—',
    },
    {
        field: 'basePricePerNight',
        headerName: 'Giá đêm',
        width: 120,
        valueGetter: (v: number | null | undefined) => (v != null ? Number(v).toLocaleString('vi-VN') : '—'),
    },
    { field: 'displayOrder', headerName: 'Thứ tự', width: 90 },
    {
        field: 'createdAt',
        headerName: 'Thời gian tạo',
        width: 160,
        valueGetter: (v: string) => (v ? new Date(v) : null),
        renderCell: (params) => <RenderCreatedAtCell value={params.value} />,
    },
    { field: 'isActive', headerName: 'Trạng thái', width: 120, renderCell: RenderStatusCell },
    {
        field: 'actions',
        headerName: '',
        width: 80,
        sortable: false,
        renderCell: (params) => <RenderRoomTypeActionsCell row={params.row} />,
    },
];

export const RoomTypeList = () => {
    const { data: roomTypes = [], isLoading } = useRoomTypes();

    return (
        <Card elevation={0} sx={dataGridCardStyles}>
            <div style={dataGridContainerStyles}>
                <DataGrid
                    rows={roomTypes}
                    getRowId={(row) => row.roomTypeId}
                    showToolbar
                    loading={isLoading}
                    columns={roomTypeColumns}
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
