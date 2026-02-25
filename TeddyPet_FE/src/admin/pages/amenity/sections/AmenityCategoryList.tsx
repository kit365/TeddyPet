import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Toolbar from '@mui/material/Toolbar';
import { SortAscendingIcon, SortDescendingIcon, UnsortedIcon } from '../../../assets/icons';
import { DATA_GRID_LOCALE_VN } from '../../service/configs/localeText.config';
import { dataGridCardStyles, dataGridContainerStyles, dataGridStyles } from '../../service/configs/styles.config';
import { useAmenityCategoriesAdmin, useDeleteAmenityCategory } from '../hooks/useAmenityCategory';
import { useNavigate } from 'react-router-dom';
import { prefixAdmin } from '../../../constants/routes';
import { toast } from 'react-toastify';
import { GridActionsCell, GridActionsCellItem } from '@mui/x-data-grid';
import { EditIcon, DeleteIcon } from '../../../assets/icons';
import { RenderStatusCell } from '../../service/utils/render-cells';
import type { IAmenityCategory } from '../../../api/amenity.api';

const RenderCategoryActionsCell = (params: { row: IAmenityCategory }) => {
    const navigate = useNavigate();
    const { mutate: deleteCat } = useDeleteAmenityCategory();
    const { id, categoryName } = params.row;

    const handleEdit = () => navigate(`/${prefixAdmin}/amenity-category/edit/${id}`);
    const handleDelete = () => {
        if (window.confirm(`Bạn có chắc muốn xóa danh mục "${categoryName}"?`)) {
            deleteCat(id, {
                onSuccess: (res: { success?: boolean; message?: string }) => {
                    if (res?.success) toast.success('Đã xóa danh mục');
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

const columns: GridColDef<IAmenityCategory>[] = [
    { field: 'categoryName', headerName: 'Tên danh mục', flex: 1, minWidth: 180 },
    { field: 'description', headerName: 'Mô tả', width: 200, valueGetter: (_, row) => row.description ?? '—' },
    { field: 'displayOrder', headerName: 'Thứ tự', width: 90, type: 'number' },
    { field: 'icon', headerName: 'Icon', width: 100, valueGetter: (_, row) => row.icon ?? '—' },
    { field: 'isActive', headerName: 'Trạng thái', width: 110, renderCell: RenderStatusCell },
    { field: 'actions', headerName: 'Thao tác', width: 90, sortable: false, renderCell: (params) => <RenderCategoryActionsCell row={params.row} /> },
];

export const AmenityCategoryList = () => {
    const { data: categories = [], isLoading } = useAmenityCategoriesAdmin();

    return (
        <Card elevation={0} sx={dataGridCardStyles}>
            <div style={dataGridContainerStyles}>
                <DataGrid
                    rows={categories}
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
