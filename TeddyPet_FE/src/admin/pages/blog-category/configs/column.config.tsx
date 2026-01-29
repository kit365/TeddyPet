import { GridColDef } from "@mui/x-data-grid";
import {
    RenderActionsCell,
    RenderTitleCell,
    RenderStatusCell,
    RenderCreatedAtCell
} from '../utils/render-cells';
import { IBlogCategory } from "./types";

export const columnsConfig: GridColDef<IBlogCategory>[] = [
    {
        field: "name",
        headerName: "Tên danh mục",
        flex: 1,
        minWidth: 200,
        hideable: false,
        renderCell: RenderTitleCell,
    },
    {
        field: "parentName",
        headerName: "Danh mục cha",
        width: 180,
    },
    {
        field: "createdAt",
        headerName: "Thời gian tạo",
        width: 160,
        filterable: true,
        type: "dateTime", // Chuyển sang dateTime để giữ dữ liệu giờ phút
        // ✅ Chuyển đổi string "2026-01-16T..." thành đối tượng Date
        valueGetter: (value) => value ? new Date(value) : null,
        // Truyền giá trị đã convert vào component render
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
        width: 140,
    },
    {
        field: 'actions',
        headerName: '',
        width: 80,
        sortable: false,
        filterable: false,
        align: 'right',
        renderCell: RenderActionsCell,
    },
];

export const columnsInitialState = {
    pagination: {
        paginationModel: { page: 0, pageSize: 10 },
    },
};
