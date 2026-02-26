import { DataGrid } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Toolbar from '@mui/material/Toolbar';
import { SortAscendingIcon, SortDescendingIcon, UnsortedIcon } from '../../../assets/icons';
import { getServiceColumns, serviceColumnsInitialState } from '../configs/column.config';
import { DATA_GRID_LOCALE_VN } from '../configs/localeText.config';
import { dataGridCardStyles, dataGridContainerStyles, dataGridStyles } from '../configs/styles.config';
import { useServices } from '../hooks/useService';
import { useServiceCategories } from '../hooks/useServiceCategory';
import { useMemo } from 'react';
import type { CategoryInfoMap } from '../configs/types';

type Props = {
    mode?: 'all' | 'addon' | 'non_addon';
    showAddonColumn?: boolean;
    categoryId?: number | null;
    hideCategoryColumn?: boolean;
};

export const ServiceList = ({ mode = 'all', showAddonColumn, categoryId = null, hideCategoryColumn }: Props) => {
    const { data: services = [], isLoading } = useServices();
    const { data: categories = [] } = useServiceCategories();

    const categoryInfoMap = useMemo(() => {
        const map: CategoryInfoMap = {};
        categories.forEach((c) => {
            map[c.categoryId] = { name: c.categoryName, colorCode: c.colorCode };
        });
        return map;
    }, [categories]);

    const columns = useMemo(
        () => getServiceColumns(categoryInfoMap, { showAddonColumn: !!showAddonColumn, hideCategoryColumn: !!hideCategoryColumn }),
        [categoryInfoMap, showAddonColumn, hideCategoryColumn]
    );

    const filtered = useMemo(() => {
        let list = services;
        if (mode === 'addon') list = list.filter((s) => !!s.isAddon);
        else if (mode === 'non_addon') list = list.filter((s) => !s.isAddon);
        if (categoryId != null) list = list.filter((s) => s.serviceCategoryId === categoryId);
        return list;
    }, [services, mode, categoryId]);

    return (
        <Card elevation={0} sx={dataGridCardStyles}>
            <div style={dataGridContainerStyles}>
                <DataGrid
                    rows={filtered}
                    getRowId={(row) => row.serviceId}
                    showToolbar
                    loading={isLoading}
                    columns={columns}
                    density="comfortable"
                    slots={{
                        toolbar: () => (
                            <Toolbar sx={{ minHeight: 'auto', py: 1, px: 2 }} />
                        ),
                        columnSortedAscendingIcon: SortAscendingIcon,
                        columnSortedDescendingIcon: SortDescendingIcon,
                        columnUnsortedIcon: UnsortedIcon,
                        noRowsOverlay: () => (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                {isLoading ? <CircularProgress size={32} /> : <span className="text-[1.8rem]">Không có dữ liệu để hiển thị</span>}
                            </Box>
                        ),
                    }}
                    localeText={DATA_GRID_LOCALE_VN}
                    pagination
                    pageSizeOptions={[5, 10, 20, { value: -1, label: 'Tất cả' }]}
                    initialState={serviceColumnsInitialState}
                    getRowHeight={() => 'auto'}
                    checkboxSelection
                    disableRowSelectionOnClick
                    sx={dataGridStyles}
                />
            </div>
        </Card>
    );
};
