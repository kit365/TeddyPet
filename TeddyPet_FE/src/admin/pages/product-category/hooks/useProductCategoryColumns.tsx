import { useTranslation } from 'react-i18next';
import { GridColDef } from '@mui/x-data-grid';
import { useMemo } from 'react';
import {
    RenderActionsCell,
    RenderStatusCell,
    RenderCategoryImageCell,
    RenderCategoryNameCell,
    RenderCategoryTypeCell,
    RenderSuitablePetTypesCell,
} from '../utils/render-cells';

/** Cột danh sách: Ảnh, Tên, categoryType, suitablePetTypes, Trạng thái; tùy chọn thêm cột Danh mục cha (tab Tất cả). */
export const useProductCategoryColumns = (showParentColumn: boolean = false) => {
    const { t } = useTranslation();

    const columns: GridColDef<any>[] = useMemo(() => {
        const cols: GridColDef<any>[] = [
            {
                field: 'imageUrl',
                headerName: 'Ảnh danh mục',
                width: 120,
                minWidth: 120,
                sortable: false,
                resizable: false,
                renderCell: RenderCategoryImageCell,
            },
            {
                field: 'name',
                headerName: t('admin.product_category.fields.name') || 'Tên danh mục',
                flex: 2,
                minWidth: 220,
                hideable: false,
                resizable: false,
                renderCell: RenderCategoryNameCell,
            },
            {
                field: 'categoryType',
                headerName: 'Loại danh mục',
                flex: 1,
                minWidth: 160,
                resizable: false,
                renderCell: RenderCategoryTypeCell,
            },
            {
                field: 'suitablePetTypes',
                headerName: 'Thú cưng phù hợp',
                flex: 1,
                minWidth: 180,
                resizable: false,
                renderCell: RenderSuitablePetTypesCell,
            },
            {
                field: 'isActive',
                headerName: t('admin.common.status') || 'Trạng thái',
                width: 130,
                minWidth: 130,
                resizable: false,
                renderCell: RenderStatusCell,
            },
        ];
        if (showParentColumn) {
            cols.push({
                field: 'parentName',
                headerName: t('admin.product_category.fields.parent') || 'Danh mục cha',
                flex: 1,
                minWidth: 180,
                resizable: false,
            });
        }
        cols.push({
            field: 'actions',
            headerName: '',
            width: 64,
            minWidth: 64,
            sortable: false,
            filterable: false,
            align: 'right',
            resizable: false,
            renderCell: RenderActionsCell,
        });
        return cols;
    }, [t, showParentColumn]);

    return columns;
};
