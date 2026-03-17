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
import Popover from '@mui/material/Popover';
import Divider from '@mui/material/Divider';
import { useRef } from 'react';

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
            <Typography variant="body1" sx={{ fontSize: '0.9375rem', fontWeight: 500, color: 'text.secondary' }}>
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

    // Filter popover
    const filterBtnRef = useRef<HTMLButtonElement>(null);
    const [filterOpen, setFilterOpen] = useState(false);

    // Staged filter state (local buffer)
    const [localCategory, setLocalCategory] = useState<number[]>([]);
    const [localBrand, setLocalBrand] = useState<number[]>([]);
    const [localStock, setLocalStock] = useState<string[]>([]);
    const [localPetType, setLocalPetType] = useState<string[]>([]);

    const handleOpenFilter = () => {
        setLocalCategory(filters.category || []);
        setLocalBrand(filters.brand || []);
        setLocalStock(filters.stock || []);
        setLocalPetType(filters.petTypes || []);
        setFilterOpen(true);
    };

    const handleApplyFilter = () => {
        setCategoryFilter(localCategory);
        setBrandFilter(localBrand);
        setStockFilter(localStock);
        setPetTypeFilter(localPetType);
        setFilterOpen(false);
    };

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
                            fontSize: '0.9375rem',
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
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{ px: 3, py: 2.5 }}
                >
                    {/* Search Field */}
                    <TextField
                        size="small"
                        placeholder="Tìm theo tên sản phẩm, mã SKU..."
                        value={filters.search}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        sx={{
                            flex: 1,
                            maxWidth: 450,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '14px',
                                bgcolor: 'white',
                                height: '44px',
                                border: '1px solid rgba(145, 158, 171, 0.24)',
                                transition: 'all 0.2s ease',
                                '& fieldset': { border: 'none' },
                                '&:hover': {
                                    bgcolor: '#F9FAFB',
                                    borderColor: 'rgba(145, 158, 171, 0.44)',
                                },
                                '&.Mui-focused': {
                                    bgcolor: 'white',
                                    boxShadow: '0 0 0 3px rgba(28, 37, 46, 0.05)',
                                    borderColor: '#1C252E',
                                },
                                fontSize: '0.9375rem',
                            },
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start" sx={{ mr: 1 }}>
                                    <SearchIcon sx={{ color: '#637381', fontSize: '1.25rem' }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Box sx={{ flex: 1 }} />

                    {/* Action Buttons Group */}
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        {isFiltered && (
                            <Button
                                color="error"
                                onClick={clearFilters}
                                startIcon={<RestartAltIcon />}
                                sx={{
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    fontSize: '0.8125rem',
                                    borderRadius: '10px',
                                    px: 2,
                                    height: '40px',
                                    bgcolor: 'rgba(255, 86, 48, 0.08)',
                                    color: '#FF5630',
                                    '&:hover': {
                                        bgcolor: 'rgba(255, 86, 48, 0.16)'
                                    }
                                }}
                            >
                                Xóa bộ lọc
                            </Button>
                        )}

                        <Button
                            ref={filterBtnRef}
                            onClick={handleOpenFilter}
                            startIcon={<FilterListIcon sx={{ fontSize: '1.15rem !important' }} />}
                            sx={{
                                height: '44px',
                                px: 2,
                                borderRadius: '14px',
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                                color: '#1C252E',
                                border: '1.5px solid rgba(145, 158, 171, 0.32)',
                                background: 'white',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    bgcolor: 'rgba(145, 158, 171, 0.05)',
                                    borderColor: '#1C252E',
                                },
                            }}
                        >
                            Bộ lọc {`(${products.length})`}
                        </Button>
                    </Stack>
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
                                fontSize: '0.875rem'
                            },
                            '& .MuiDataGrid-cell': {
                                borderBottom: '1px dashed rgba(145, 158, 171, 0.2)',
                                fontSize: '0.875rem'
                            }
                        }}
                    />
                </Box>
            </Card>

            {/* ── Filter Popover ── */}
            <Popover
                open={filterOpen}
                anchorEl={filterBtnRef.current}
                onClose={() => setFilterOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 1,
                            borderRadius: '16px',
                            minWidth: 320,
                            boxShadow: '0 12px 24px -4px rgba(145,158,171,0.12), 0 0 2px 0 rgba(145,158,171,0.2)',
                            p: 2.5,
                        },
                    },
                }}
            >
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: '#1C252E' }}>
                        Bộ lọc nâng cao
                    </Typography>
                </Stack>

                <Divider sx={{ mb: 2 }} />

                <Stack gap={2.5}>
                    <Box>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 900, color: '#919EAB', textTransform: 'uppercase', mb: 1, letterSpacing: 1 }}>
                            Danh mục
                        </Typography>
                        <SelectMulti
                            label="Danh mục"
                            fullWidth
                            options={categoryOptions}
                            value={localCategory.map(String)}
                            onChange={(val) => setLocalCategory(val.map(Number))}
                        />
                    </Box>

                    <Box>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 900, color: '#919EAB', textTransform: 'uppercase', mb: 1, letterSpacing: 1 }}>
                            Thương hiệu
                        </Typography>
                        <SelectMulti
                            label="Thương hiệu"
                            fullWidth
                            options={brandOptions}
                            value={localBrand.map(String)}
                            onChange={(val) => setLocalBrand(val.map(Number))}
                            searchable
                        />
                    </Box>

                    <Box>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 900, color: '#919EAB', textTransform: 'uppercase', mb: 1, letterSpacing: 1 }}>
                            Tình trạng kho
                        </Typography>
                        <SelectMulti
                            label="Tình trạng kho"
                            fullWidth
                            options={STOCK_STATUS_OPTIONS}
                            value={localStock}
                            onChange={setLocalStock}
                        />
                    </Box>

                    <Box>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 900, color: '#919EAB', textTransform: 'uppercase', mb: 1, letterSpacing: 1 }}>
                            Loại thú cưng
                        </Typography>
                        <SelectMulti
                            label="Loại thú cưng"
                            fullWidth
                            options={PET_TYPE_OPTIONS}
                            value={localPetType}
                            onChange={setLocalPetType}
                        />
                    </Box>
                </Stack>

                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleApplyFilter}
                    sx={{
                        mt: 4,
                        height: '48px',
                        borderRadius: '14px',
                        textTransform: 'none',
                        fontWeight: 900,
                        fontSize: '0.9375rem',
                        bgcolor: '#1C252E',
                        color: 'white',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                        '&:hover': { 
                            bgcolor: '#454F5B',
                            boxShadow: '0 12px 20px rgba(0,0,0,0.2)',
                        },
                    }}
                >
                    Áp dụng
                </Button>
            </Popover>
        </Box>
    )
}