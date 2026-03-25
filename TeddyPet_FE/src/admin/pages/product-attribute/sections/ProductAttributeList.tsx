import { DataGrid } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { SortAscendingIcon, SortDescendingIcon, UnsortedIcon } from '../../../assets/icons';
import { useDataGridLocale } from '../../../hooks/useDataGridLocale';
import { useTranslation } from 'react-i18next';
import { columnsConfig, columnsInitialState } from '../configs/column.config';
import {
    dataGridCardStyles,
    dataGridStyles
} from '../configs/styles.config';
import { useProductAttributes, useDisplayTypes } from '../hooks/useProductAttribute';
import { Search } from '../../../components/ui/Search';
import { SelectMulti } from '../../../components/ui/SelectMulti';
import { useState, useMemo, useRef } from 'react';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

export const ProductAttributeList = () => {
    const { t } = useTranslation();
    const { data: attributes = [], isLoading } = useProductAttributes();
    const { data: displayTypes = [] } = useDisplayTypes();
    const localeText = useDataGridLocale();

    const [searchQuery, setSearchQuery] = useState('');
    const [displayTypeFilter, setDisplayTypeFilter] = useState<string[]>([]);
    
    // Filter Popover state
    const filterBtnRef = useRef<HTMLButtonElement>(null);
    const [filterOpen, setFilterOpen] = useState(false);

    const displayTypeOptions = useMemo(() => {
        return displayTypes.map((dt: any) => ({
            label: dt.label || dt.name || dt,
            value: dt.value || dt
        }));
    }, [displayTypes]);

    const rows = useMemo(() => {
        return attributes.filter((a: any) => {
            const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDisplayType = displayTypeFilter.length === 0 || displayTypeFilter.includes(a.displayType);
            return matchesSearch && matchesDisplayType;
        });
    }, [attributes, searchQuery, displayTypeFilter]);

    const isFiltered = searchQuery !== '' || displayTypeFilter.length > 0;

    return (
        <Box sx={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
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
                            placeholder="Tìm kiếm thuộc tính..." 
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
                                    setSearchQuery('');
                                    setDisplayTypeFilter([]);
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
                            Bộ lọc {displayTypeFilter.length > 0 ? `(${displayTypeFilter.length})` : ''}
                        </Button>
                    </Stack>
                </Stack>

                <Box sx={{ width: '100%', minWidth: 0 }}>
                    <DataGrid
                        autoHeight
                        rows={rows}
                        getRowId={(row) => row.attributeId}
                        loading={isLoading}
                        columns={columnsConfig}
                        density="comfortable"
                        slots={{
                            columnSortedAscendingIcon: SortAscendingIcon,
                            columnSortedDescendingIcon: SortDescendingIcon,
                            columnUnsortedIcon: UnsortedIcon,
                            noRowsOverlay: () => (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    {isLoading ? <CircularProgress size={32} /> : <span className='text-[1.125rem]'>{t("admin.common.no_data")}</span>}
                                </Box>
                            )
                        }}
                        localeText={localeText}
                        pagination
                        pageSizeOptions={[5, 10, 20, { value: -1, label: t("admin.common.tabs.all") }]}
                        initialState={columnsInitialState}
                        getRowHeight={() => 'auto'}
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
                            minWidth: 280,
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
                            Kiểu hiển thị
                        </Typography>
                        <SelectMulti
                            label="Kiểu hiển thị"
                            fullWidth
                            options={displayTypeOptions}
                            value={displayTypeFilter}
                            onChange={setDisplayTypeFilter}
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
    )
}
