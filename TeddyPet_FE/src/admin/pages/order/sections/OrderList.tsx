import {
    DataGrid,
} from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import { SortAscendingIcon, SortDescendingIcon, UnsortedIcon } from '../../../assets/icons';
import { getOrderColumns } from '../configs/column.config';
import { useDataGridLocale } from '../../../hooks/useDataGridLocale';
import { useOrders } from '../hooks/useOrders';
import {
    dataGridCardStyles,
    dataGridContainerStyles,
    columnsPanelStyles,
    filterPanelStyles,
    dataGridStyles,
} from '../../product/configs/styles.config';
import { Stack, Typography, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const CustomNoRowsOverlay = () => {
    return (
        <Stack height="100%" alignItems="center" justifyContent="center">
            <div className="w-[100px] h-[100px] mb-[20px]">
                <img
                    src="https://img.icons8.com/fluency/200/nothing-found.png"
                    alt="No data"
                    className="w-full h-full object-contain filter grayscale opacity-60"
                />
            </div>
            <Typography variant="body1" sx={{ fontSize: '1.5rem', fontWeight: 500, color: 'text.secondary' }}>
                Không tìm thấy đơn hàng nào
            </Typography>
        </Stack>
    );
}

export const OrderList = () => {
    const {
        orders,
        loading,
        totalElements,
        page,
        setPage,
        pageSize,
        setPageSize,
        keyword,
        setKeyword
    } = useOrders();

    const columns = getOrderColumns();
    const localeText = useDataGridLocale();

    return (
        <Card
            elevation={0}
            sx={dataGridCardStyles}
        >
            <Stack direction="row" spacing={2} sx={{ p: 2, alignItems: 'center' }}>
                <TextField
                    size="small"
                    placeholder="Tìm theo mã đơn, khách hàng, SĐT..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    sx={{ width: 350 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: 'text.secondary', fontSize: '2rem' }} />
                            </InputAdornment>
                        ),
                    }}
                />
            </Stack>

            <div style={dataGridContainerStyles}>
                <DataGrid
                    loading={loading}
                    rows={orders}
                    columns={columns}
                    density="comfortable"
                    rowCount={totalElements}
                    paginationMode="server"
                    paginationModel={{ page, pageSize }}
                    onPaginationModelChange={(model) => {
                        setPage(model.page);
                        setPageSize(model.pageSize);
                    }}
                    showCellVerticalBorder={false}
                    showColumnVerticalBorder={false}
                    slots={{
                        columnSortedAscendingIcon: SortAscendingIcon,
                        columnSortedDescendingIcon: SortDescendingIcon,
                        columnUnsortedIcon: UnsortedIcon,
                        noRowsOverlay: CustomNoRowsOverlay
                    }}
                    slotProps={{
                        columnsPanel: {
                            sx: columnsPanelStyles,
                        },
                        filterPanel: {
                            sx: filterPanelStyles,
                        },
                    }}
                    localeText={localeText}
                    pageSizeOptions={[5, 10, 25, 50]}
                    getRowHeight={() => 'auto'}
                    checkboxSelection
                    disableRowSelectionOnClick
                    sx={dataGridStyles}
                />
            </div>
        </Card>
    )
}
