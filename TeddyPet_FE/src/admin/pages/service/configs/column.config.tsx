import { GridColDef } from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import dayjs from 'dayjs';
import {
    RenderServiceTitleCell,
    RenderComboTitleCell,
    RenderCreatedAtCell,
    RenderStatusCell,
    RenderServiceActionsCell,
    RenderComboActionsCell,
} from '../utils/render-cells';
import type { IService, IServiceCombo, CategoryInfoMap } from './types';

const HEX6 = /^#[0-9A-Fa-f]{6}$/;

function getContrastText(hexColor: string): string {
    // Returns black/white depending on luminance for readability.
    if (!HEX6.test(hexColor)) return '#1C252E';
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    // Relative luminance (sRGB)
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance > 0.6 ? '#1C252E' : '#FFFFFF';
}

export const getServiceColumns = (
    categoryInfoMap: CategoryInfoMap,
    opts?: { showAddonColumn?: boolean; hideCategoryColumn?: boolean }
): GridColDef<IService & { categoryName?: string }>[] => [
        ...(opts?.showAddonColumn
            ? ([
                {
                    field: 'isAddon',
                    headerName: 'Add-on',
                    width: 110,
                    valueGetter: (value: boolean | undefined) => (value ? 'Add-on' : '—'),
                },
            ] as GridColDef<IService & { categoryName?: string }>[])
            : []),
        {
            field: 'serviceName',
            headerName: 'Tên dịch vụ',
            flex: 1,
            minWidth: 200,
            hideable: false,
            renderCell: RenderServiceTitleCell,
        },
        {
            field: 'code',
            headerName: 'Mã',
            flex: 0.6,
            minWidth: 140,
        },
        ...(opts?.hideCategoryColumn
            ? []
            : [
                {
                    field: 'serviceCategoryId',
                    headerName: 'Danh mục',
                    width: 260,
                    valueGetter: (_, row) => categoryInfoMap[row.serviceCategoryId]?.name ?? `#${row.serviceCategoryId}`,
                    renderCell: (params) => {
                        const catId = params.row.serviceCategoryId;
                        const info = categoryInfoMap[catId];
                        const name = info?.name ?? `#${catId}`;
                        const color = info?.colorCode && HEX6.test(info.colorCode) ? info.colorCode : null;
                        const textColor = color ? getContrastText(color) : '#1C252E';
                        return (
                            <Box
                                title={color ? `${name} (${color})` : name}
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    px: 1.25,
                                    py: 0.75,
                                    borderRadius: 999,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: color ? color : 'background.paper',
                                    color: textColor,
                                    fontWeight: 700,
                                    lineHeight: 1,
                                    maxWidth: '100%',
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 999,
                                        bgcolor: textColor,
                                        opacity: color ? 0.35 : 0.15,
                                        flexShrink: 0,
                                    }}
                                />
                                <Box
                                    component="span"
                                    sx={{
                                        display: 'inline-block',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: 190,
                                    }}
                                >
                                    {name}
                                </Box>
                            </Box>
                        );
                    },
                },
            ] as GridColDef<IService & { categoryName?: string }>[]),
        {
            field: 'duration',
            headerName: 'Thời lượng (phút)',
            flex: 0.4,
            minWidth: 100,
        },
        {
            field: 'basePrice',
            headerName: 'Giá gốc',
            flex: 0.5,
            minWidth: 110,
            valueGetter: (value: number | undefined) => value != null ? `${Number(value).toLocaleString('vi-VN')} đ` : '—',
        },
        {
            field: 'createdAt',
            headerName: 'Thời gian tạo',
            flex: 0.7,
            minWidth: 140,
            type: 'dateTime',
            valueGetter: (value: string) => (value ? new Date(value) : null),
            renderCell: (params) => <RenderCreatedAtCell value={params.value} />,
        },
        {
            field: 'isActive',
            headerName: 'Trạng thái',
            flex: 0.5,
            minWidth: 100,
            renderCell: RenderStatusCell,
        },
        {
            field: 'actions',
            headerName: '',
            width: 80,
            sortable: false,
            filterable: false,
            align: 'right',
            renderCell: RenderServiceActionsCell,
        },
    ];

export const serviceColumnsInitialState = {
    pagination: { paginationModel: { page: 0, pageSize: 10 } },
    sorting: { sortModel: [{ field: 'createdAt', sort: 'desc' as const }] },
};

export const getServiceComboColumns = (): GridColDef<IServiceCombo>[] => [
    {
        field: 'comboName',
        headerName: 'Tên gói',
        flex: 1,
        minWidth: 200,
        hideable: false,
        renderCell: RenderComboTitleCell,
    },
    {
        field: 'code',
        headerName: 'Mã',
        width: 120,
    },
    {
        field: 'slug',
        headerName: 'Slug',
        width: 160,
        valueGetter: (value: string | undefined) => value ?? '—',
    },
    {
        field: 'comboPrice',
        headerName: 'Giá gói',
        width: 120,
        valueGetter: (value: number | undefined) => value != null ? `${Number(value).toLocaleString('vi-VN')} đ` : '—',
    },
    {
        field: 'originalPrice',
        headerName: 'Giá gốc',
        width: 120,
        valueGetter: (value: number | undefined) => value != null ? `${Number(value).toLocaleString('vi-VN')} đ` : '—',
    },
    {
        field: 'validFrom',
        headerName: 'Từ ngày',
        width: 120,
        valueGetter: (value: string | undefined) => (value ? dayjs(value).format('DD/MM/YYYY') : '—'),
    },
    {
        field: 'validTo',
        headerName: 'Đến ngày',
        width: 120,
        valueGetter: (value: string | undefined) => (value ? dayjs(value).format('DD/MM/YYYY') : '—'),
    },
    {
        field: 'isPopular',
        headerName: 'Nổi bật',
        width: 100,
        valueGetter: (value: boolean | undefined) => (value ? 'Có' : 'Không'),
    },
    {
        field: 'isActive',
        headerName: 'Trạng thái',
        width: 120,
        renderCell: RenderStatusCell,
    },
    {
        field: 'actions',
        headerName: '',
        width: 80,
        sortable: false,
        filterable: false,
        align: 'right',
        renderCell: RenderComboActionsCell,
    },
];

export const serviceComboColumnsInitialState = {
    pagination: { paginationModel: { page: 0, pageSize: 10 } },
};
