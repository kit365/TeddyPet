import { useState, useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { SortAscendingIcon, SortDescendingIcon, UnsortedIcon } from '../../../assets/icons';
import { useDataGridLocale } from '../../../hooks/useDataGridLocale';
import { useTranslation } from 'react-i18next';
import { useProductCategoryColumns } from '../hooks/useProductCategoryColumns';
import { columnsInitialState } from '../configs/column.config';
import {
    dataGridCardStyles,
    dataGridStyles,
} from '../configs/styles.config';
import { useProductCategories } from '../hooks/useProductCategory';
import { ProductCategoryFilterProvider, type ParentFilterValue } from '../context/ProductCategoryFilterContext';
import { useRef } from 'react';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Search } from '../../../components/ui/Search';
import { SelectMulti } from '../../../components/ui/SelectMulti';
import { STATUS_OPTIONS } from '../configs/constants';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

export const ProductCategoryList = () => {
    const { t } = useTranslation();
    const { data: categories = [], isLoading } = useProductCategories();
    const [parentFilter, setParentFilter] = useState<ParentFilterValue>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    
    // Filter Popover state
    const filterBtnRef = useRef<HTMLButtonElement>(null);
    const [filterOpen, setFilterOpen] = useState(false);

    const allCategories = useMemo(
        () =>
            (categories as any[]).filter(
                (c) =>
                    c != null &&
                    c.categoryId != null &&
                    typeof c.name === 'string' &&
                    c.name.trim() !== ''
            ),
        [categories]
    );

    const parentOptions = useMemo(() => {
        const map = new Map<number, string>();
        allCategories.forEach((c) => {
            if (c.parentId != null && c.parentName != null && !map.has(c.parentId)) {
                map.set(c.parentId, c.parentName);
            }
        });
        return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
    }, [allCategories]);

    const rows = useMemo(() => {
        return allCategories.filter((c) => {
            const matchesParent = parentFilter === 'all' || c.parentId === parentFilter;
            const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter.length === 0 || statusFilter.includes(c.isActive ? 'active' : 'inactive');
            return matchesParent && matchesSearch && matchesStatus;
        });
    }, [allCategories, parentFilter, searchQuery, statusFilter]);

    const isFiltered = parentFilter !== 'all' || searchQuery !== '' || statusFilter.length > 0;

    const showParentColumn = parentFilter === 'all';
    const columns = useProductCategoryColumns(showParentColumn);
    const localeText = useDataGridLocale();

    const filterContextValue = useMemo(
        () => ({
            parentFilter,
            setParentFilter,
            parentOptions,
        }),
        [parentFilter, parentOptions]
    );

    return (
        <Box sx={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
            <ProductCategoryFilterProvider value={filterContextValue}>
                <Card elevation={0} sx={{ 
                    ...dataGridCardStyles, 
                    flex: 'none',
                    background: 'white',
                    border: '1px solid rgba(145, 158, 171, 0.2)',
                }}>
                    {/* Custom Toolbar */}
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ px: 3, py: 2.5 }}>
                        <Box sx={{ flex: 1, maxWidth: 450 }}>
                            <Search 
                                maxWidth="100%" 
                                placeholder="Tìm kiếm danh mục..." 
                                value={searchQuery}
                                onChange={setSearchQuery}
                            />
                        </Box>
                        
                        <Box sx={{ flex: 1 }} />

                        <Stack direction="row" spacing={1.5} alignItems="center">
                            {isFiltered && (
                                <Button
                                    color="error"
                                    onClick={() => {
                                        setParentFilter('all');
                                        setSearchQuery('');
                                        setStatusFilter([]);
                                    }}
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
                                        '&:hover': { bgcolor: 'rgba(255, 86, 48, 0.16)' }
                                    }}
                                >
                                    Xóa bộ lọc
                                </Button>
                            )}

                            <Button
                                ref={filterBtnRef}
                                onClick={() => setFilterOpen(true)}
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
                                Bộ lọc {statusFilter.length > 0 || parentFilter !== 'all' ? `(${statusFilter.length + (parentFilter !== 'all' ? 1 : 0)})` : ''}
                            </Button>
                        </Stack>
                    </Stack>

                    <Box sx={{ width: '100%', minWidth: 0 }}>
                        <DataGrid
                            autoHeight
                            rows={rows}
                            getRowId={(row) => row.categoryId}
                            loading={isLoading}
                            columns={columns}
                            density="comfortable"
                            slots={{
                                columnSortedAscendingIcon: SortAscendingIcon,
                                columnSortedDescendingIcon: SortDescendingIcon,
                                columnUnsortedIcon: UnsortedIcon,
                                noRowsOverlay: () => (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                        {isLoading ? <CircularProgress size={32} /> : <span className="text-[1.125rem]">{t('admin.common.no_data')}</span>}
                                    </Box>
                                ),
                            }}
                            localeText={localeText}
                            pagination
                            pageSizeOptions={[5, 10, 20, { value: -1, label: t('admin.common.tabs.all') }]}
                            initialState={columnsInitialState}
                            getRowHeight={() => 'auto'}
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
            </ProductCategoryFilterProvider>

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
                            minWidth: 300,
                            boxShadow: '0 12px 24px -4px rgba(145,158,171,0.12), 0 0 2px 0 rgba(145,158,171,0.2)',
                            p: 2.5,
                        },
                    },
                }}
            >
                <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: '#1C252E', mb: 2 }}>
                    Bộ lọc nâng cao
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack gap={2.5}>
                    <Box>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 900, color: '#919EAB', textTransform: 'uppercase', mb: 1, letterSpacing: 1 }}>
                            Danh mục cha
                        </Typography>
                        <FormControl fullWidth size="small">
                            <Select
                                value={parentFilter === "all" ? "all" : String(parentFilter)}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setParentFilter(v === "all" ? "all" : Number(v));
                                }}
                                sx={{ 
                                    height: '44px',
                                    fontSize: "0.875rem", 
                                    borderRadius: "12px",
                                }}
                            >
                                <MenuItem value="all">Tất cả</MenuItem>
                                {parentOptions.map(({ id, label }) => (
                                    <MenuItem key={id} value={String(id)} sx={{ fontSize: '0.875rem' }}>
                                        {label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    <Box>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 900, color: '#919EAB', textTransform: 'uppercase', mb: 1, letterSpacing: 1 }}>
                            Trạng thái
                        </Typography>
                        <SelectMulti
                            label="Trạng thái"
                            fullWidth
                            options={STATUS_OPTIONS}
                            value={statusFilter}
                            onChange={setStatusFilter}
                        />
                    </Box>
                </Stack>
                <Button
                    fullWidth
                    variant="contained"
                    onClick={() => setFilterOpen(false)}
                    sx={{
                        mt: 4,
                        height: '44px',
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.9375rem',
                        bgcolor: '#1C252E',
                        '&:hover': { bgcolor: '#454F5B' },
                    }}
                >
                    Áp dụng
                </Button>
            </Popover>
        </Box>
    );
};