import { Avatar, Box, LinearProgress, Link, ListItemText } from "@mui/material";
import { GridActionsCell, GridActionsCellItem, GridRenderCellParams } from "@mui/x-data-grid";
import { DeleteIcon, EditIcon, EyeIcon } from "../../../assets/icons/index";
import { COLORS } from "../configs/constants";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { prefixAdmin } from "../../../constants/routes";
import { useDeleteProduct } from "../hooks/useProduct";
import { toast } from "react-toastify";

// Sản phẩm
export const RenderProductCell = (params: GridRenderCellParams) => {
    const { product, category, image } = params.row;

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                py: "16px",
                gap: "16px",
                width: "100%",
            }}>

            <Avatar
                alt={product}
                src={image}
                variant="rounded"
                sx={{
                    width: "64px",
                    height: "64px",
                    borderRadius: '12px',
                    backgroundColor: '#F4F6F8'
                }}
            />

            <ListItemText
                primary={
                    <Link
                        href={`/${prefixAdmin}/product/detail/${params.row.id}`}
                        className="product-title"
                        underline="hover"
                        onClick={(e) => {
                            e.preventDefault();
                            // Logic navigate will be handled if needed, or just let href work
                        }}
                        sx={{
                            color: COLORS.primary,
                            fontWeight: 600,
                            fontSize: '1.3rem',
                            transition: 'color 0.2s',
                        }}
                    >
                        {product}
                    </Link>
                }
                secondary={category}
                slotProps={{
                    primary: {
                        component: 'span',
                        variant: 'body1',
                        noWrap: true,
                    },
                    secondary: {
                        component: 'span',
                        variant: 'body2',
                        sx: { color: '#919EAB', fontSize: "1.3rem" }
                    }
                }}
                sx={{ m: 0 }}
            />
        </Box>
    );
}

// Thời gian tạo
export const RenderCreatedAtCell = (params: GridRenderCellParams) => {
    const rawDate = params.row.createdAt;

    if (!rawDate || isNaN(new Date(rawDate).getTime())) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', fontSize: '1.4rem', color: COLORS.secondary }}>
                N/A
            </Box>
        );
    }

    const dateObj = new Date(rawDate);
    const dateStr = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: true });

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
                py: "16px",
                gap: "4px"
            }}>
            <span
                style={{
                    fontSize: "1.4rem",
                    fontWeight: 600,
                    color: COLORS.primary,
                    transition: 'color 0.2s',
                }}>
                {dateStr}
            </span>

            <Box
                className="date-text"
                component='span'
                sx={{
                    fontSize: "1.2rem",
                    color: COLORS.secondary,
                    fontWeight: 500
                }}
            >
                {timeStr}
            </Box>
        </Box >
    );
}

// Số lượng (Stock)
export const RenderStockCell = (params: GridRenderCellParams) => {
    const { t } = useTranslation();
    const stockValue = params.row.stock;

    let label = "";
    let color = "";
    let bgColor = "";
    let percentage = 0;

    if (stockValue === 0) {
        label = t("admin.product.stock_status.out_of_stock");
        bgColor = "rgba(255, 86, 48, 0.24)";
        percentage = 0;
    } else if (stockValue > 0 && stockValue <= 20) {
        label = `${stockValue} ${t("admin.product.stock_status.low_stock")}`;
        color = "#FFAB00";
        bgColor = "rgba(255 171 0 / 24%)";
        percentage = (stockValue / 20) * 100;
    } else {
        label = `${stockValue} ${t("admin.product.stock_status.in_stock")}`;
        color = "#22C55E";
        bgColor = "rgba(34, 197, 94, 0.24)";
        percentage = 90;
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
                width: '100%',
                fontSize: "1.2rem",
                color: "#637381"
            }}
        >
            <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                    width: "80px",
                    height: "6px",
                    borderRadius: "16px",
                    marginBottom: "8px",
                    backgroundColor: bgColor,
                    "& .MuiLinearProgress-bar": {
                        backgroundColor: color,
                        borderRadius: "16px",
                    },
                }}
            />
            {label}
        </Box>
    );
}

// Status
export const RenderStatusCell = (params: GridRenderCellParams) => {
    const { t } = useTranslation();
    const status = (params.row.status as string)?.toUpperCase();

    let label = t("admin.product.status.draft");
    let bg = "#919EAB29";
    let text = "#637381";

    if (status === "ACTIVE") {
        label = t("admin.product.status.active");
        bg = "#E1F9EB";
        text = "#00A76F";
    } else if (status === "HIDDEN" || status === "INACTIVE") {
        label = t("admin.product.status.inactive"); // or Hidden
        bg = "#FFF5F5";
        text = "#FF5630";
    }

    return (
        <span
            className="inline-flex items-center justify-center min-w-[2.4rem] h-[2.4rem] text-[1.2rem] px-[8px] font-[700] rounded-[6px]"
            style={{
                backgroundColor: bg,
                color: text,
                textTransform: 'uppercase'
            }}
        >
            {label}
        </span>
    );
}

// Stock Status
export const RenderStockStatusCell = (params: GridRenderCellParams) => {
    const { t } = useTranslation();
    const stockStatus = (params.row.stockStatus as string)?.toUpperCase();

    let label = t("admin.product.stock_status.out_of_stock");
    let color = "#FF5630";

    if (stockStatus === "IN_STOCK") {
        label = t("admin.product.stock_status.in_stock");
        color = "#22C55E";
    } else if (stockStatus === "LOW_STOCK") {
        label = t("admin.product.stock_status.low_stock");
        color = "#FFAB00";
    }

    return (
        <span style={{ color: color, fontWeight: 600, fontSize: '1.3rem' }}>
            {label}
        </span>
    );
}

// Product Type
export const RenderProductTypeCell = (params: GridRenderCellParams) => {
    const type = (params.row.productType as string)?.toUpperCase();

    // You might want icons here
    return (
        <span style={{ fontWeight: 600, fontSize: '1.3rem', color: '#637381' }}>
            {type === "SIMPLE" ? "Simple" : "Variable"}
        </span>
    );
}

// Actions
export const RenderActionsCell = (params: GridRenderCellParams) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const productId = params.row.id;
    const deleteMutation = useDeleteProduct();

    return (
        <GridActionsCell {...params}>
            <GridActionsCellItem
                icon={<EyeIcon />}
                label={t("admin.common.details")}
                showInMenu
                onClick={() => navigate(`/${prefixAdmin}/product/detail/${productId}`)}
                {...({
                    sx: {
                        '& .MuiTypography-root': {
                            fontSize: '1.3rem',
                            fontWeight: "600"
                        },
                    },
                } as any)}
            />
            <GridActionsCellItem
                icon={<EditIcon />}
                label={t("admin.common.edit")}
                showInMenu
                onClick={() => navigate(`/${prefixAdmin}/product/edit/${productId}`)}
                {...({
                    sx: {
                        '& .MuiTypography-root': {
                            fontSize: '1.3rem',
                            fontWeight: "600"
                        },
                    },
                } as any)}
            />

            <GridActionsCellItem
                icon={<DeleteIcon />}
                label={t("admin.common.delete")}
                showInMenu
                onClick={() => {
                    if (window.confirm(t("admin.common.confirm_delete"))) {
                        deleteMutation.mutate(productId, {
                            onSuccess: (res: any) => {
                                if (res.success) {
                                    toast.success(res.message || "Xóa sản phẩm thành công");
                                } else {
                                    toast.error(res.message || "Không thể xóa sản phẩm");
                                }
                            },
                            onError: () => {
                                toast.error("Có lỗi xảy ra khi xóa sản phẩm");
                            }
                        });
                    }
                }}
                {...({
                    sx: {
                        '& .MuiTypography-root': {
                            fontSize: '1.3rem',
                            fontWeight: "600",
                            color: "#FF5630"
                        },
                    },
                } as any)}
            />
        </GridActionsCell>
    );
}