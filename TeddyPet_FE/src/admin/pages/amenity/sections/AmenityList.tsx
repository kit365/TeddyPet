import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Toolbar from '@mui/material/Toolbar';
import { SortAscendingIcon, SortDescendingIcon, UnsortedIcon } from '../../../assets/icons';
import { DATA_GRID_LOCALE_VN } from '../../service/configs/localeText.config';
import { dataGridCardStyles, dataGridContainerStyles, dataGridStyles } from '../../service/configs/styles.config';
import { useAmenitiesAdmin, useDeleteAmenity } from '../hooks/useAmenity';
import { useNavigate } from 'react-router-dom';
import { prefixAdmin } from '../../../constants/routes';
import { toast } from 'react-toastify';
import { GridActionsCell, GridActionsCellItem } from '@mui/x-data-grid';
import { EditIcon, DeleteIcon } from '../../../assets/icons';
import { RenderStatusCell } from '../../service/utils/render-cells';
import type { IAmenity } from '../../../api/amenity.api';

const RenderAmenityActionsCell = (params: { row: IAmenity }) => {
    const navigate = useNavigate();
    const { mutate: deleteAmenity } = useDeleteAmenity();
    const { id, description } = params.row;

    const handleEdit = () => navigate(`/${prefixAdmin}/amenity/edit/${id}`);
    const handleDelete = () => {
        if (window.confirm(`Bạn có chắc muốn xóa tiện nghi "${description ?? id}"?`)) {
            deleteAmenity(id, {
                onSuccess: (res: { success?: boolean; message?: string }) => {
                    if (res?.success) toast.success('Đã xóa tiện nghi');
                    else toast.error((res as { message?: string })?.message ?? 'Có lỗi');
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

const columns: GridColDef<IAmenity>[] = [
    { field: 'description', headerName: 'Mô tả / Tên', flex: 1, minWidth: 180, valueGetter: (_, row) => row.description ?? '—' },
    { field: 'categoryName', headerName: 'Danh mục', width: 160 },
    { field: 'displayOrder', headerName: 'Thứ tự', width: 90, type: 'number' },
    { field: 'icon', headerName: 'Icon', width: 100, valueGetter: (_, row) => row.icon ?? '—' },
    { field: 'isActive', headerName: 'Trạng thái', width: 110, renderCell: RenderStatusCell },
    { field: 'actions', headerName: 'Thao tác', width: 90, sortable: false, renderCell: (params) => <RenderAmenityActionsCell row={params.row} /> },
];

export const AmenityList = () => {
    const { data: amenities = [], isLoading } = useAmenitiesAdmin();

    return (
        <Card elevation={0} sx={dataGridCardStyles}>
            <div style={dataGridContainerStyles}>
                <DataGrid
                    rows={amenities}
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
