import { useState, useMemo, useEffect } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Toolbar from '@mui/material/Toolbar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { SortAscendingIcon, SortDescendingIcon, UnsortedIcon, EditIcon, DeleteIcon } from '../../../assets/icons';
import { DATA_GRID_LOCALE_VN } from '../../service/configs/localeText.config';
import { dataGridCardStyles, dataGridContainerStyles, dataGridStyles } from '../../service/configs/styles.config';
import { useRooms, useDeleteRoom } from '../hooks/useRoom';
import { useRoomTypes } from '../hooks/useRoomType';
import { useNavigate } from 'react-router-dom';
import { prefixAdmin } from '../../../constants/routes';
import { toast } from 'react-toastify';
import type { IRoom } from '../../../api/room.api';
import { RenderStatusCell } from '../../service/utils/render-cells';
import { GridActionsCell, GridActionsCellItem } from '@mui/x-data-grid';
import LockIcon from '@mui/icons-material/Lock';
import { EyeIcon } from '../../../assets/icons';
import { RoomBlockingDialog } from './RoomBlockingDialog';

const STATUS_LABELS: Record<string, string> = {
    AVAILABLE: 'Sẵn sàng',
    OCCUPIED: 'Đang có khách',
    CLEANING: 'Đang dọn dẹp',
    MAINTENANCE: 'Đang bảo trì',
    BLOCKED: 'Bị khóa (tạm ngưng)',
    OUT_OF_SERVICE: 'Ngưng hoạt động',
};

const RenderRoomActionsCell = (params: { row: IRoom; onOpenBlocking: (room: IRoom) => void }) => {
    const navigate = useNavigate();
    const { mutate: deleteRoom } = useDeleteRoom();
    const { row, onOpenBlocking } = params;
    const { roomId, roomNumber } = row;

    const handleView = () => navigate(`/${prefixAdmin}/room/edit/${roomId}`);
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
    const handleLock = () => onOpenBlocking(row);

    return (
        <GridActionsCell>
            <GridActionsCellItem icon={<EyeIcon />} label="Xem chi tiết" showInMenu onClick={handleView} />
            <GridActionsCellItem icon={<EditIcon />} label="Sửa" showInMenu onClick={handleEdit} />
            <GridActionsCellItem icon={<LockIcon fontSize="small" />} label="Khóa phòng" showInMenu onClick={handleLock} />
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

const getBookableLabel = (status: string) => (status === 'AVAILABLE' ? 'Có' : 'Không');

const roomColumnsBase = (onOpenBlocking: (room: IRoom) => void): GridColDef<IRoom>[] => [
    { field: 'roomNumber', headerName: 'Mã phòng', width: 120 },
    { field: 'roomName', headerName: 'Tên phòng', flex: 1, minWidth: 140, valueGetter: (_, row) => row.roomName ?? '—' },
    {
        field: 'roomTypeName',
        headerName: 'Loại phòng',
        width: 160,
        valueGetter: (_, row) => row.roomTypeName ?? '—',
    },
    {
        field: 'status',
        headerName: 'Trạng thái',
        width: 130,
        valueGetter: (_, row) => STATUS_LABELS[row.status] ?? row.status,
    },
    {
        field: 'bookable',
        headerName: 'Có thể đặt',
        width: 110,
        valueGetter: (_, row) => getBookableLabel(row.status),
    },
    { field: 'isActive', headerName: 'Hoạt động', width: 100, renderCell: RenderStatusCell },
    {
        field: 'actions',
        headerName: 'Thao tác',
        width: 90,
        sortable: false,
        renderCell: (params) => <RenderRoomActionsCell row={params.row} onOpenBlocking={onOpenBlocking} />,
    },
];

const roomColumns = (onOpenBlocking: (room: IRoom) => void, hideRoomType: boolean): GridColDef<IRoom>[] => {
    const cols = roomColumnsBase(onOpenBlocking);
    if (hideRoomType) return cols.filter((c) => c.field !== 'roomTypeName');
    return cols;
};

export const RoomList = ({ searchQuery = '', onSearchChange }: { searchQuery?: string; onSearchChange?: (v: string) => void }) => {
    const { data: rooms = [], isLoading } = useRooms();
    const { data: roomTypes = [] } = useRoomTypes();
    const [tabIndex, setTabIndex] = useState(0);
    const [blockingDialog, setBlockingDialog] = useState<{ open: boolean; room: IRoom | null }>({ open: false, room: null });

    const searchTrim = (searchQuery ?? '').trim();
    useEffect(() => {
        if (searchTrim) setTabIndex(0);
    }, [searchTrim]);

    const filteredRows = useMemo(() => {
        let list = rooms;
        if (tabIndex > 0 && roomTypes[tabIndex - 1]) {
            const typeId = roomTypes[tabIndex - 1].roomTypeId;
            list = list.filter((r) => r.roomTypeId === typeId);
        }
        if (searchTrim) {
            const q = searchTrim.toLowerCase();
            list = list.filter(
                (r) =>
                    (r.roomName ?? '').toLowerCase().includes(q) ||
                    (r.roomTypeName ?? '').toLowerCase().includes(q)
            );
        }
        return list;
    }, [rooms, tabIndex, roomTypes, searchTrim]);

    const hideRoomTypeColumn = tabIndex > 0 && !searchTrim;
    const handleOpenBlocking = (room: IRoom) => setBlockingDialog({ open: true, room });
    const handleCloseBlocking = () => setBlockingDialog((p) => ({ ...p, open: false, room: null }));

    return (
        <>
            <Card elevation={0} sx={dataGridCardStyles}>
                <Tabs
                    value={searchTrim ? 0 : tabIndex}
                    onChange={(_, v) => setTabIndex(v)}
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        px: 2,
                        pt: 1,
                        '& .MuiTab-root': { fontSize: '1.5rem', fontWeight: 600, textTransform: 'none', minHeight: 48 },
                    }}
                >
                    <Tab label="Tất cả" value={0} />
                    {roomTypes.map((rt, i) => (
                        <Tab key={rt.roomTypeId} label={rt.typeName ?? `Loại ${rt.roomTypeId}`} value={i + 1} />
                    ))}
                </Tabs>
                <div style={dataGridContainerStyles}>
                    <DataGrid
                        rows={filteredRows}
                        getRowId={(row) => row.roomId}
                        showToolbar
                        loading={isLoading}
                        columns={roomColumns(handleOpenBlocking, hideRoomTypeColumn)}
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
            {blockingDialog.room && (
                <RoomBlockingDialog
                    open={blockingDialog.open}
                    onClose={handleCloseBlocking}
                    roomId={blockingDialog.room.roomId}
                    roomNumber={blockingDialog.room.roomNumber ?? `#${blockingDialog.room.roomId}`}
                />
            )}
        </>
    );
};
