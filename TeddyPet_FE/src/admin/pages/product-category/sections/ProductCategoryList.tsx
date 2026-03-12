import { useState, useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { SortAscendingIcon, SortDescendingIcon, UnsortedIcon } from '../../../assets/icons';
import { ProductCategoryToolbar } from './ProductCategoryToolbar';
import { useDataGridLocale } from '../../../hooks/useDataGridLocale';
import { useTranslation } from 'react-i18next';
import { useProductCategoryColumns } from '../hooks/useProductCategoryColumns';
import { columnsInitialState } from '../configs/column.config';
import {
    dataGridCardStyles,
    dataGridContainerStyles,
    dataGridStyles,
} from '../configs/styles.config';
import { useProductCategories } from '../hooks/useProductCategory';
import { ProductCategoryFilterProvider, type ParentFilterValue } from '../context/ProductCategoryFilterContext';

export const ProductCategoryList = () => {
    const { t } = useTranslation();
    const { data: categories = [], isLoading } = useProductCategories();
    const [parentFilter, setParentFilter] = useState<ParentFilterValue>('all');

    const childCategories = useMemo(
        () =>
            (categories as any[]).filter(
                (c) =>
                    c != null &&
                    c.parentId != null &&
                    c.categoryId != null &&
                    typeof c.name === 'string' &&
                    c.name.trim() !== ''
            ),
        [categories]
    );

    const parentOptions = useMemo(() => {
        const map = new Map<number, string>();
        childCategories.forEach((c) => {
            if (c.parentId != null && c.parentName != null && !map.has(c.parentId)) {
                map.set(c.parentId, c.parentName);
            }
        });
        return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
    }, [childCategories]);

    const rows = useMemo(() => {
        if (parentFilter === 'all') return childCategories;
        return childCategories.filter((c) => c.parentId === parentFilter);
    }, [childCategories, parentFilter]);

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
                <Card elevation={0} sx={{ ...dataGridCardStyles, flex: 'none' }}>
                    <Box sx={{ width: '100%', minWidth: 0 }}>
                        <DataGrid
                            autoHeight
                            rows={rows}
                            getRowId={(row) => row.categoryId}
                            showToolbar
                            loading={isLoading}
                            columns={columns}
                            density="comfortable"
                            slots={{
                                toolbar: ProductCategoryToolbar,
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
                            sx={[{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto' }, dataGridStyles]}
                        />
                    </Box>
                </Card>
            </ProductCategoryFilterProvider>
        </Box>
    );
};