import {
    DataGrid,
    GridColDef,
} from '@mui/x-data-grid';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SortAscendingIcon, SortDescendingIcon, UnsortedIcon } from '../../../assets/icons';
import { columnsInitialState } from '../configs/column.config';
import { useDataGridLocale } from '../../../hooks/useDataGridLocale';
import { useSettings } from '../hooks/useSettings';
import { useProducts } from '../hooks/useProducts';
import { useProductColumns } from '../hooks/useProductColumns';
import {
    dataGridCardStyles,
    dataGridContainerStyles,
    columnsPanelStyles,
    filterPanelStyles,
    dataGridStyles,
} from '../configs/styles.config';
import { Stack, Typography, Box, Tabs, Tab, TextField, InputAdornment, Card } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const STATUS_OPTIONS = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Đang bán', value: 'active' },
    { label: 'Tạm ẩn', value: 'inactive' },
    { label: 'Bản nháp', value: 'draft' },
];

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
                Không tìm thấy sản phẩm nào
            </Typography>
        </Stack>
    );
}

export const ProductList = () => {
    const { t } = useTranslation();
    const { settings } = useSettings();
    const {
        products,
        loading,
        filters,
        setStatusFilter,
        setSearchFilter
    } = useProducts();
    const columns = useProductColumns();
    const localeText = useDataGridLocale();

    const [currentTab, setCurrentTab] = useState('all');

    const handleTabChange = (_: any, newValue: string) => {
        setCurrentTab(newValue);
        if (newValue === 'all') {
            setStatusFilter([]);
        } else {
            setStatusFilter([newValue]);
        }
    };

    return (
        <Box sx={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
            <Card
                elevation={0}
                sx={{
                    ...dataGridCardStyles,
                    background: 'white',
                    border: '1px solid rgba(145, 158, 171, 0.2)',
                    // Reset flex if we want autoHeight
                    flex: 'none',
                }}
            >
                <Tabs
                    value={currentTab}
                    onChange={handleTabChange}
                    sx={{
                        px: 3,
                        pt: 1,
                        borderBottom: '1px solid rgba(145, 158, 171, 0.1)',
                        '& .MuiTab-root': {
                            fontSize: '1.4rem',
                            fontWeight: 700,
                            textTransform: 'none',
                            minWidth: 100,
                            py: 1.5,
                            color: '#637381',
                            '&.Mui-selected': { color: '#1C252E' }
                        },
                        '& .MuiTabs-indicator': {
                            height: 3,
                            bgcolor: '#1C252E'
                        }
                    }}
                >
                    {STATUS_OPTIONS.map((opt) => (
                        <Tab key={opt.value} value={opt.value} label={opt.label} />
                    ))}
                </Tabs>

                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    sx={{
                        p: 2,
                        alignItems: { md: 'center' },
                        justifyContent: 'space-between',
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ bgcolor: 'rgba(0, 167, 111, 0.1)', p: 1, borderRadius: '8px', display: 'flex' }}>
                            <SearchIcon sx={{ color: '#00A76F', fontSize: '2.2rem' }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1C252E', fontSize: '1.8rem' }}>
                            Danh sách sản phẩm
                            <Box component="span" sx={{ ml: 1, color: 'text.secondary', fontWeight: 500 }}>
                                ({products.length})
                            </Box>
                        </Typography>
                    </Stack>

                    <TextField
                        size="small"
                        placeholder="Tìm tên sản phẩm, danh mục..."
                        value={filters.search}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        sx={{
                            width: { xs: '100%', md: 400 },
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                bgcolor: '#F4F6F8',
                                '& fieldset': { border: 'none' },
                                '&:hover fieldset': { border: 'none' },
                                '&.Mui-focused fieldset': { border: '1px solid #1C252E' }
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.8rem' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Stack>

                <Box sx={{ width: '100%', minWidth: 0 }}>
                    <DataGrid
                        autoHeight
                        loading={loading}
                        rows={products}
                        columns={columns}
                        density={settings.density}
                        showCellVerticalBorder={false}
                        showColumnVerticalBorder={false}
                        slots={{
                            columnSortedAscendingIcon: SortAscendingIcon,
                            columnSortedDescendingIcon: SortDescendingIcon,
                            columnUnsortedIcon: UnsortedIcon,
                            noRowsOverlay: CustomNoRowsOverlay
                        }}
                        slotProps={{
                            columnsManagement: {
                                getTogglableColumns: (columns: GridColDef[]) =>
                                    columns.filter(col => col.field !== '__check__' && col.field !== 'actions')
                                        .map(col => col.field),
                            },
                            columnsPanel: {
                                sx: columnsPanelStyles,
                            },
                            filterPanel: {
                                sx: filterPanelStyles,
                            },
                        }}
                        localeText={localeText}
                        pagination
                        getRowHeight={() => 'auto'}
                        getEstimatedRowHeight={() => 100}
                        pageSizeOptions={[5, 10, 20, { value: -1, label: t("admin.common.tabs.all") }]}
                        initialState={columnsInitialState}
                        checkboxSelection
                        disableRowSelectionOnClick
                        sx={{
                            ...dataGridStyles,
                            border: 'none',
                            '& .MuiDataGrid-columnHeader': {
                                bgcolor: '#F4F6F8',
                                color: '#637381',
                                fontWeight: 700
                            },
                            '& .MuiDataGrid-cell': {
                                borderBottom: '1px dashed rgba(145, 158, 171, 0.2)'
                            }
                        }}
                    />
                </Box>
            </Card>
        </Box>
    )
}