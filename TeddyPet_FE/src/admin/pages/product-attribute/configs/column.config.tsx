import { Box, Link } from "@mui/material";
import { GridActionsCell, GridActionsCellItem, GridRenderCellParams, GridColDef } from "@mui/x-data-grid";
import { DeleteIcon, EditIcon, EyeIcon } from "../../../assets/icons/index";
import { COLORS } from "./constants";
import { useDeleteProductAttribute } from "../hooks/useProductAttribute";
import { useNavigate } from "react-router-dom";
import { prefixAdmin } from "../../../constants/routes";
import { toast } from "react-toastify";
import Chip from '@mui/material/Chip';


// Render Tên thuộc tính
export const RenderNameCell = (params: GridRenderCellParams) => {
    const { name, attributeId } = params.row;
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                py: "16px",
                gap: "16px",
                width: "100%",
            }}>
            <Link
                href={`/${prefixAdmin}/product-attribute/edit/${attributeId}`}
                className="attribute-name"
                onClick={(e) => {
                    e.preventDefault();
                    navigate(`/${prefixAdmin}/product-attribute/edit/${attributeId}`);
                }}
                underline="hover"
                sx={{
                    color: COLORS.primary,
                    fontWeight: 600,
                    fontSize: '1.4rem',
                    transition: 'color 0.2s',
                }}
            >
                {name}
            </Link>
        </Box>
    );
};

// Render Loại hiển thị - Simple text
export const RenderDisplayTypeCell = (params: GridRenderCellParams) => {
    const displayType = params.value;

    // Map display type to Vietnamese label
    const labelMap: Record<string, string> = {
        'TEXT': 'text',
        'SELECT': 'select',
        'CHECKBOX': 'checkbox',
        'RADIO': 'radio',
        'MULTI_SELECT': 'multi_select',
        'COLOR': 'color',
    };

    return (
        <span
            style={{
                fontSize: '1.4rem',
                color: '#637381',
            }}
        >
            {labelMap[displayType] || displayType}
        </span>
    );
};

// Render Giá trị (values) - Unified blue color
export const RenderValuesCell = (params: GridRenderCellParams) => {
    const values = params.value || [];

    return (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', py: 1 }}>
            {values.slice(0, 5).map((v: any) => (
                <Chip
                    key={v.valueId}
                    label={v.value}
                    size="small"
                    sx={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        height: '24px',
                        borderRadius: '6px',
                        background: '#00B8D929',
                        color: '#006C9C',
                        border: 'none'
                    }}
                />
            ))}
            {values.length > 5 && (
                <Chip
                    label={`+${values.length - 5}`}
                    size="small"
                    sx={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        height: '24px',
                        borderRadius: '6px',
                        background: '#00B8D929',
                        color: '#006C9C',
                    }}
                />
            )}
        </Box>
    );
};

// Actions
export const RenderActionsCell = (params: GridRenderCellParams) => {
    const navigate = useNavigate();
    const { mutate: deleteAttribute } = useDeleteProductAttribute();
    const attributeId = params.row.attributeId;

    const handleEdit = () => {
        navigate(`/${prefixAdmin}/product-attribute/edit/${attributeId}`);
    };

    const handleDelete = () => {
        if (window.confirm("Bạn có chắc chắn muốn xóa thuộc tính này?")) {
            deleteAttribute(attributeId, {
                onSuccess: (res: any) => {
                    if (res.success) {
                        toast.success("Xóa thuộc tính thành công");
                    } else {
                        toast.error(res.message);
                    }
                }
            });
        }
    };

    return (
        <GridActionsCell {...params}>
            <GridActionsCellItem
                icon={<EyeIcon />}
                label="Chi tiết"
                showInMenu
                {...({
                    sx: {
                        '& .MuiTypography-root': {
                            fontSize: '1.3rem',
                            fontWeight: "600"
                        },
                    },
                } as any)}
                onClick={() => navigate(`/${prefixAdmin}/product-attribute/detail/${attributeId}`)}
            />
            <GridActionsCellItem
                icon={<EditIcon />}
                label="Chỉnh sửa"
                showInMenu
                {...({
                    sx: {
                        '& .MuiTypography-root': {
                            fontSize: '1.3rem',
                            fontWeight: "600"
                        },
                    },
                } as any)}
                onClick={handleEdit}
            />
            <GridActionsCellItem
                icon={<DeleteIcon />}
                label="Xóa"
                showInMenu
                {...({
                    sx: {
                        '& .MuiTypography-root': {
                            fontSize: '1.3rem',
                            fontWeight: "600",
                            color: "#FF5630"
                        },
                    },
                } as any)}
                onClick={handleDelete}
            />
        </GridActionsCell>
    );
};

// Column configs
export const columnsConfig: GridColDef<any>[] = [
    {
        field: "displayOrder",
        headerName: "STT",
        width: 70,
        align: 'center',
        headerAlign: 'center',
    },
    {
        field: "name",
        headerName: "Tên thuộc tính",
        flex: 1,
        minWidth: 180,
        hideable: false,
        renderCell: RenderNameCell,
    },
    {
        field: "displayType",
        headerName: "Kiểu hiển thị",
        width: 150,
        renderCell: RenderDisplayTypeCell,
    },
    {
        field: "values",
        headerName: "Danh sách lựa chọn",
        flex: 2,
        minWidth: 350,
        renderCell: RenderValuesCell,
    },
    {
        field: 'actions',
        headerName: 'Hành động',
        width: 100,
        sortable: false,
        filterable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: RenderActionsCell,
    },
];

export const columnsInitialState = {
    pagination: {
        paginationModel: { page: 0, pageSize: 10 },
    },
};
