import { Avatar, Box, Link, ListItemText } from "@mui/material";
import { GridActionsCell, GridActionsCellItem, GridRenderCellParams } from "@mui/x-data-grid";
import { DeleteIcon, EditIcon, EyeIcon } from "../../../assets/icons/index";
import { COLORS } from "../configs/constants";
import { useDeleteProductCategory } from "../hooks/useProductCategory";
import { useNavigate } from "react-router-dom";
import { prefixAdmin } from "../../../constants/routes";
import { toast } from "react-toastify";
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');
interface RenderCreatedAtCellProps {
    value: Date | null | any;
}

// Ảnh danh mục (chỉ hình)
export const RenderCategoryImageCell = (params: GridRenderCellParams) => {
    const { name, imageUrl, altImage } = params.row;
    return (
        <Avatar
            alt={altImage || name}
            src={imageUrl}
            variant="rounded"
            sx={{
                width: 48,
                height: 48,
                borderRadius: '10px',
                backgroundColor: '#F4F6F8',
            }}
        />
    );
};

// Tên danh mục (chỉ tên, link) — rút gọn, tránh tràn cột
export const RenderCategoryNameCell = (params: GridRenderCellParams) => {
    const { name, categoryId } = params.row;
    const navigate = useNavigate();
    const displayName = name || '—';
    return (
        <Link
            href={`/${prefixAdmin}/product-category/edit/${categoryId}`}
            onClick={(e) => {
                e.preventDefault();
                navigate(`/${prefixAdmin}/product-category/edit/${categoryId}`);
            }}
            underline="hover"
            title={displayName}
            sx={{
                color: COLORS.primary,
                fontWeight: 600,
                fontSize: '1.4rem',
                transition: 'color 0.2s',
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
            }}
        >
            {displayName}
        </Link>
    );
};

/** Label cho categoryType (ProductCategoryTypeEnum) */
const CATEGORY_TYPE_LABELS: Record<string, string> = {
    FOOD: 'Thức ăn',
    ACCESSORY: 'Phụ kiện',
    TOY: 'Đồ chơi',
    HYGIENE: 'Vệ sinh',
    GROOMING: 'Chăm sóc lông',
    BEDDING: 'Chỗ nằm',
    OTHER: 'Khác',
};

export const RenderCategoryTypeCell = (params: GridRenderCellParams) => {
    const v = params.row.categoryType;
    const label = v ? (CATEGORY_TYPE_LABELS[v] ?? v) : '—';
    return <span style={{ fontSize: '1.35rem', color: COLORS.primary }}>{label}</span>;
};

/** suitablePetTypes: DOG, CAT, OTHER -> hiển thị */
const PET_TYPE_LABELS: Record<string, string> = {
    DOG: 'Chó',
    CAT: 'Mèo',
    OTHER: 'Khác',
};

export const RenderSuitablePetTypesCell = (params: GridRenderCellParams) => {
    const arr = params.row.suitablePetTypes;
    if (!arr || !Array.isArray(arr) || arr.length === 0) return <span style={{ fontSize: '1.35rem', color: '#637381' }}>—</span>;
    const labels = arr.map((t: string) => PET_TYPE_LABELS[t] ?? t);
    return <span style={{ fontSize: '1.35rem', color: COLORS.primary }}>{labels.join(', ')}</span>;
};

// Sản phẩm (giữ cho tương thích nếu dùng ở chỗ khác)
export const RenderTitleCell = (params: GridRenderCellParams) => {
    const { name, imageUrl, altImage, categoryId } = params.row;
    const navigate = useNavigate();
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', py: '16px', gap: '16px', width: '100%' }}>
            <Avatar alt={altImage || name} src={imageUrl} variant="rounded" sx={{ width: 64, height: 64, borderRadius: '12px', backgroundColor: '#F4F6F8' }} />
            <ListItemText
                primary={
                    <Link href={`/${prefixAdmin}/product-category/edit/${categoryId}`} className="product-title" onClick={(e) => { e.preventDefault(); navigate(`/${prefixAdmin}/product-category/edit/${categoryId}`); }} underline="hover" sx={{ color: COLORS.primary, fontWeight: 600, fontSize: '1.3rem', transition: 'color 0.2s' }}>
                        {name}
                    </Link>
                }
                slotProps={{ primary: { component: 'span', variant: 'body1', noWrap: true } }}
                sx={{ m: 0 }}
            />
        </Box>
    );
}

// Thời gian tạo
export const RenderCreatedAtCell = ({ value }: RenderCreatedAtCellProps) => {
    if (!value) return null;
    const dateObj = dayjs(value);
    if (!dateObj.isValid()) return null;

    // Định dạng: 16 thg 01, 2026
    const formattedDate = dateObj.format('DD MMM, YYYY');

    // Định dạng: 10:17 SA/CH (hoặc am/pm tùy bạn)
    const formattedTime = dateObj.format('hh:mm A');

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: "4px"
            }}>

            <span
                style={{
                    fontSize: "1.4rem",
                    color: COLORS.primary,
                    transition: 'color 0.2s',
                    textTransform: 'capitalize'
                }}>
                {formattedDate}
            </span>

            <Box
                className="date-text"
                component='span'
                sx={{
                    fontSize: "1.2rem",
                    color: COLORS.secondary,
                    textTransform: 'lowercase'
                }}
            >
                {formattedTime}
            </Box>
        </Box >
    );
}


// Status
export const RenderStatusCell = (params: GridRenderCellParams) => {
    const isActive = params.row.isActive;

    let label = "Hoạt động";
    let bg = "#00B8D929";
    let text = "#006C9C";

    if (isActive) {
        label = "Hoạt động";
        bg = "#00B8D929";
        text = "#006C9C";
    } else {
        label = "Tạm dừng";
        bg = "#EF444429";
        text = "#B91C1C";
    }

    return (
        <span
            className="inline-flex items-center justify-center leading-1.5 min-w-[2.4rem] h-[2.4rem] text-[1.2rem] px-[6px] font-[700] rounded-[6px]"
            style={{
                backgroundColor: bg,
                color: text,
            }}
        >
            {label}
        </span>
    );
}

// Actions
export const RenderActionsCell = (params: GridRenderCellParams) => {
    const navigate = useNavigate();
    const { mutate: deleteCategory } = useDeleteProductCategory();
    const categoryId = params.row.categoryId;

    const handleEdit = () => {
        navigate(`/${prefixAdmin}/product-category/edit/${categoryId}`);
    };

    const handleDelete = () => {
        if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
            deleteCategory(categoryId, {
                onSuccess: (res: any) => {
                    if (res.success) {
                        toast.success("Xóa danh mục thành công");
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
                onClick={() => navigate(`/${prefixAdmin}/product-category/detail/${categoryId}`)}
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
}