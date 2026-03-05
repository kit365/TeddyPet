import { DataGrid } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Toolbar from '@mui/material/Toolbar';
import { SortAscendingIcon, SortDescendingIcon, UnsortedIcon } from '../../../assets/icons';
import { DATA_GRID_LOCALE_VN } from '../configs/localeText.config';
import { dataGridCardStyles, dataGridContainerStyles, dataGridStyles } from '../configs/styles.config';
import { useServiceCategories } from '../hooks/useServiceCategory';
import { GridColDef } from '@mui/x-data-grid';
import type { IServiceCategory } from '../configs/types';
import { RenderCreatedAtCell, RenderStatusCell, RenderCategoryActionsCell } from '../utils/render-cells';

const categoryColumns: GridColDef<IServiceCategory>[] = [
    { field: 'categoryName', headerName: 'Tên danh mục', flex: 1, minWidth: 200 },
    {
        field: 'colorCode',
        headerName: 'Màu',
        width: 120,
        renderCell: (params) => {
            const color = params.row.colorCode;
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                        sx={{
                            width: 24,
                            height: 24,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : 'transparent',
                        }}
                    />
                    {color ? <span style={{ fontSize: '1.2rem' }}>{color}</span> : '—'}
                </Box>
            );
        },
    },
    { field: 'serviceType', headerName: 'Loại dịch vụ', width: 140 },
    {
        field: 'createdAt',
        headerName: 'Thời gian tạo',
        width: 160,
        valueGetter: (v: string) => (v ? new Date(v) : null),
        renderCell: (params) => <RenderCreatedAtCell value={params.value} />,
    },
    { field: 'isActive', headerName: 'Trạng thái', width: 120, renderCell: RenderStatusCell },
    { field: 'actions', headerName: '', width: 80, sortable: false, renderCell: RenderCategoryActionsCell },
];

export const ServiceCategoryList = () => {
    const { data: categories = [], isLoading } = useServiceCategories();

    return (
        <Card elevation={0} sx={dataGridCardStyles}>
            <div style={dataGridContainerStyles}>
                <DataGrid
                    rows={categories}
                    getRowId={(row) => row.categoryId}
                    showToolbar
                    loading={isLoading}
                    columns={categoryColumns}
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
