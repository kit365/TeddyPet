import {
    DataGrid,
    GridColDef,
} from '@mui/x-data-grid';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SortAscendingIcon, SortDescendingIcon, UnsortedIcon } from '../../../assets/icons';
import { columnsInitialState } from '../configs/column.config';
import { useDataGridLocale } from '../../../hooks/useDataGridLocale';
import { useSettings } from '../hooks/useSettings';
import { useProducts } from '../hooks/useProducts';
import { useProductColumns } from '../hooks/useProductColumns';
import {
    dataGridCardStyles,
    columnsPanelStyles,
    filterPanelStyles,
    dataGridStyles,
} from '../configs/styles.config';
import { Stack, Typography, Box, Tabs, Tab, TextField, InputAdornment, Card, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { SelectMulti } from '../../../components/ui/SelectMulti';
import { useBrands } from '../../brand/hooks/useBrand';
import { useNestedProductCategories } from '../../product-category/hooks/useProductCategory';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

const STATUS_OPTIONS = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Đang bán', value: 'active' },
    { label: 'Tạm ẩn', value: 'hidden' },
    { label: 'Bản nháp', value: 'draft' },
];

const STOCK_STATUS_OPTIONS = [
    { label: 'Còn hàng', value: 'instock' },
    { label: 'Hết hàng', value: 'outofstock' },
    { label: 'Sắp hết hàng', value: 'lowstock' },
];

const PET_TYPE_OPTIONS = [
    { label: 'Chó', value: 'DOG' },
    { label: 'Mèo', value: 'CAT' },
    { label: 'Khác', value: 'OTHER' },
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
        setSearchFilter,
        setStockFilter,
        setCategoryFilter,
        setBrandFilter,
        setPetTypeFilter,
        clearFilters
    } = useProducts();
    const columns = useProductColumns();
    const localeText = useDataGridLocale();

    const { data: categories = [] } = useNestedProductCategories();
    const { data: brands = [] } = useBrands();

    // Map nested categories to flat options for SelectMulti with Tree Levels
    const categoryOptions = useMemo(() => {
        const flatten = (items: any[], level = 0, parentId?: string): any[] => {
            return items.reduce((acc, item) => {
                acc.push({ 
                    label: item.name, 
                    value: String(item.categoryId || item.id),
                    level: level,
                    parentId: parentId
                });
                if (item.children?.length > 0) {
                    acc.push(...flatten(item.children, level + 1, String(item.categoryId || item.id)));
                }
                return acc;
            }, []);
        };
        return flatten(categories);
    }, [categories]);

    const brandOptions = useMemo(() => {
        return (brands as any[]).map((b: any) => ({ label: b.name, value: String(b.id || b.brandId) }));
    }, [brands]);

    const [currentTab, setCurrentTab] = useState('all');

    const handleTabChange = (_: any, newValue: string) => {
        setCurrentTab(newValue);
        setStatusFilter([newValue]);
    };

    const isFiltered = !!(filters.search || filters.category?.length! > 0 || filters.brand?.length! > 0 || filters.stock?.length! > 0 || filters.petTypes?.length! > 0);

    return (
        <Box sx={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
            <Card
                elevation={0}
                sx={{
                    ...dataGridCardStyles,
                    background: 'white',
                    border: '1px solid rgba(145, 158, 171, 0.2)',
                    flex: 'none',
                    minHeight: 600, // Prevent layout jitter
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
                            fontSize: '1.5rem',
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

                {/* Filter & Search Section */}
                <Stack
                    direction={{ xs: 'column', lg: 'row' }}
                    sx={{ 
                        px: 3, 
                        py: 2.5, 
                        flexWrap: 'wrap',
                        alignItems: 'center', 
                        gap: 2, 
                        justifyContent: 'flex-start'
                    }}
                >
                    {/* Search Field */}
                    <TextField
                        size="small"
                        placeholder="Tìm theo tên sản phẩm, danh mục, thương hiệu..."
                        value={filters.search}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        sx={{
                            width: { xs: '100%', md: 400, lg: 450 },
                            flexShrink: 0,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                bgcolor: '#F4F6F8',
                                '& fieldset': { border: 'none' },
                                '&:hover fieldset': { border: 'none' },
                                '&.Mui-focused fieldset': { border: '1px solid #1C252E' },
                                fontSize: '1.5rem'
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start" sx={{ mr: 0.5 }}>
                                    <SearchIcon sx={{ color: 'text.secondary', fontSize: '2rem' }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {/* Filters Group - Now follows right after search */}
                    <Stack 
                        direction="row" 
                        spacing={1.2} 
                        sx={{ 
                            flexWrap: 'wrap',
                            gap: 1.2, 
                            alignItems: 'center',
                        }}
                    >
                        <SelectMulti
                            label="Danh mục"
                            options={categoryOptions}
                            value={filters.category?.map(String) || []}
                            onChange={(val) => setCategoryFilter(val.map(Number))}
                        />
                        <SelectMulti
                            label="Thương hiệu"
                            options={brandOptions}
                            value={filters.brand?.map(String) || []}
                            onChange={(val) => setBrandFilter(val.map(Number))}
                            searchable
                        />
                        <SelectMulti
                            label="Tình trạng kho"
                            options={STOCK_STATUS_OPTIONS}
                            value={filters.stock || []}
                            onChange={setStockFilter}
                        />
                        <SelectMulti
                            label="Loại thú cưng"
                            options={PET_TYPE_OPTIONS}
                            value={filters.petTypes || []}
                            onChange={setPetTypeFilter}
                        />

                        {isFiltered && (
                            <Button
                                color="error"
                                onClick={clearFilters}
                                startIcon={<RestartAltIcon />}
                                sx={{ 
                                    fontWeight: 700, 
                                    textTransform: 'none', 
                                    fontSize: '1.3rem', 
                                    whiteSpace: 'nowrap',
                                    borderRadius: '10px',
                                    px: 2,
                                    height: '40px',
                                    bgcolor: 'rgba(255, 86, 48, 0.08)', // Soft red background
                                    color: '#FF5630',
                                    '&:hover': {
                                        bgcolor: 'rgba(255, 86, 48, 0.16)'
                                    }
                                }}
                            >
                                Xóa bộ lọc
                            </Button>
                        )}
                    </Stack>
                </Stack>

                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ px: 3, pb: 2 }}
                >
                    <Box sx={{ 
                        bgcolor: 'rgba(0, 167, 111, 0.1)', 
                        px: 1.2,
                        py: 0.5,
                        borderRadius: '20px', 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}>
                        <FilterListIcon sx={{ color: '#00A76F', fontSize: '1.8rem' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#00A76F', fontSize: '1.4rem' }}>
                            Kết quả tìm kiếm: 
                            <Box component="span" sx={{ ml: 0.5, color: '#1C252E' }}>
                                {products.length} sản phẩm
                            </Box>
                        </Typography>
                    </Box>
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
                                fontWeight: 700,
                                fontSize: '1.4rem'
                            },
                            '& .MuiDataGrid-cell': {
                                borderBottom: '1px dashed rgba(145, 158, 171, 0.2)',
                                fontSize: '1.4rem'
                            }
                        }}
                    />
                </Box>
            </Card>
        </Box>
    )
}