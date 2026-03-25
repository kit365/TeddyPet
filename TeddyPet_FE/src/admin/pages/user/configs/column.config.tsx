import { GridColDef } from "@mui/x-data-grid";
import {
    RenderActionsCell,
    RenderTitleCell,
    RenderStatusCell,
    RenderCreatedAtCell
} from '../utils/render-cells';
import { mountGridCell } from '../../../utils/muiDataGridRenderCell';

export const columnsConfig: GridColDef<any>[] = [
    {
        field: "name",
        headerName: "Tên thương hiệu",
        flex: 1,
        minWidth: 200,
        hideable: false,
        renderCell: mountGridCell(RenderTitleCell),
    },
    {
        field: "websiteUrl",
        headerName: "Website",
        width: 200,
        renderCell: (params) => {
            const url = params.value;
            return url ? (
                <a href={url} target="_blank" rel="noreferrer" style={{ color: '#006C9C', textDecoration: 'underline' }}>
                    {url}
                </a>
            ) : (
                <span style={{ color: '#919EAB' }}>--</span>
            );
        }
    },
    {
        field: "createdAt",
        headerName: "Thời gian tạo",
        width: 160,
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
        field: 'actions',
        headerName: '',
        width: 80,
        sortable: false,
        filterable: false,
        align: 'right',
        renderCell: mountGridCell(RenderActionsCell),
    },
];

export const columnsInitialState = {
    pagination: {
        paginationModel: { page: 0, pageSize: 10 },
    },
};
