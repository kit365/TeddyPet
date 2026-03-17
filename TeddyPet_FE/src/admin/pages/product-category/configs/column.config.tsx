import { GridColDef } from "@mui/x-data-grid";
import {
    RenderActionsCell,
    RenderTitleCell,
    RenderStatusCell,
    RenderCreatedAtCell
} from '../utils/render-cells';
// import { IProductCategory } from "./types";

export const columnsConfig: GridColDef<any>[] = [
    {
        field: "name",
        headerName: "Tên danh mục",
        flex: 1,
        minWidth: 250,
        hideable: false,
        renderCell: RenderTitleCell,
    },
    {
        field: "parentName",
        headerName: "Danh mục cha",
        width: 200,
        renderCell: (params) => <span>{params.value || '—'}</span>,
    },
    {
        field: "createdAt",
        headerName: "Thời gian tạo",
        width: 180,
        filterable: true,
        type: "dateTime",
        valueGetter: (value) => value ? new Date(value) : null,
        renderCell: (params) => <RenderCreatedAtCell value={params.value} />,
    },
    {
        field: "isActive",
        headerName: "Trạng thái",
        width: 140,
        renderCell: RenderStatusCell,
    },
    {
        field: "view",
        headerName: "Lượt xem",
        width: 100,
    },
    {
        field: 'actions',
        headerName: '',
        width: 80,
        sortable: false,
        filterable: false,
        align: 'right',
        headerAlign: 'right',
        renderCell: RenderActionsCell,
    },
];

export const columnsInitialState = {
    pagination: {
        paginationModel: { page: 0, pageSize: 10 },
    },
};
