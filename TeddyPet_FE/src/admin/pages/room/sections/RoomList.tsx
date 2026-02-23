import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Toolbar from '@mui/material/Toolbar';
import { SortAscendingIcon, SortDescendingIcon, UnsortedIcon, EditIcon, DeleteIcon } from '../../../assets/icons';
import { DATA_GRID_LOCALE_VN } from '../../service/configs/localeText.config';
import { dataGridCardStyles, dataGridContainerStyles, dataGridStyles } from '../../service/configs/styles.config';
import { useRooms } from '../hooks/useRoom';
import { useDeleteRoom } from '../hooks/useRoom';
import { useNavigate } from 'react-router-dom';
import { prefixAdmin } from '../../../constants/routes';
import { toast } from 'react-toastify';
import type { IRoom } from '../../../api/room.api';
import { RenderStatusCell, RenderCreatedAtCell } from '../../service/utils/render-cells';
import { GridActionsCell, GridActionsCellItem } from '@mui/x-data-grid';

const STATUS_LABELS: Record<string, string> = {
    AVAILABLE: 'Trống',
    OCCUPIED: 'Đang dùng',
    CLEANING: 'Đang dọn',
    MAINTENANCE: 'Bảo trì',
    OUT_OF_SERVICE: 'Ngừng phục vụ',
};

const RenderRoomActionsCell = (params: { row: IRoom }) => {
    const navigate = useNavigate();
    const { mutate: deleteRoom } = useDeleteRoom();
    const { roomId } = params.row;

    const handleEdit = () => navigate(`/${prefixAdmin}/room/edit/${roomId}`);
    const handleDelete = () => {
        if (window.confirm('Bạn có chắc muốn xóa phòng này?')) {
            deleteRoom(roomId, {
                onSuccess: (res: { success?: boolean; message?: string }) => {
                    if (res?.success) toast.success('Đã xóa phòng');
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

const roomColumns: GridColDef<IRoom>[] = [
    { field: 'roomNumber', headerName: 'Mã phòng', width: 120 },
    { field: 'roomName', headerName: 'Tên phòng', flex: 1, minWidth: 140 },
    {
        field: 'roomTypeName',
        headerName: 'Loại phòng',
        width: 160,
        valueGetter: (_, row) => row.roomTypeName ?? '—',
    },
    { field: 'building', headerName: 'Tòa nhà', width: 120, valueGetter: (v: string) => v ?? '—' },
    { field: 'floor', headerName: 'Tầng', width: 80, valueGetter: (v: string) => v ?? '—' },
    {
        field: 'status',
        headerName: 'Trạng thái',
        width: 120,
        valueGetter: (v: string) => STATUS_LABELS[v] ?? v,
    },
    {
        field: 'isAvailableForBooking',
        headerName: 'Có thể đặt',
        width: 110,
        renderCell: (params) => (params.value ? 'Có' : 'Không'),
    },
    {
        field: 'createdAt',
        headerName: 'Thời gian tạo',
        width: 160,
        valueGetter: (v: string) => (v ? new Date(v) : null),
        renderCell: (params) => <RenderCreatedAtCell value={params.value} />,
    },
    { field: 'isActive', headerName: 'Hoạt động', width: 100, renderCell: RenderStatusCell },
    {
        field: 'actions',
        headerName: '',
        width: 80,
        sortable: false,
        renderCell: (params) => <RenderRoomActionsCell row={params.row} />,
    },
];

export const RoomList = () => {
    const { data: rooms = [], isLoading } = useRooms();

    return (
        <Card elevation={0} sx={dataGridCardStyles}>
            <div style={dataGridContainerStyles}>
                <DataGrid
                    rows={rooms}
                    getRowId={(row) => row.roomId}
                    showToolbar
                    loading={isLoading}
                    columns={roomColumns}
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
