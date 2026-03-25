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
                        }}
                        sx={{
                            color: COLORS.primary,
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            transition: 'color 0.2s',
                        }}
                    >
                        {product}
                    </Link>
                }
                secondary={
                    <Box component="span" sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                        <Box component="span" sx={{ color: '#919EAB', fontSize: "0.8125rem" }}>{category}</Box>
                        {params.row.petTypes && params.row.petTypes.length > 0 && (
                            <>
                                <Box component="span" sx={{ color: '#919EAB', fontSize: "0.8125rem" }}>•</Box>
                                <Box component="span" sx={{ color: '#00B8D9', fontSize: "0.8125rem", fontWeight: 600 }}>
                                    {params.row.petTypes.map((t: string) => t === 'DOG' ? 'Chó' : (t === 'CAT' ? 'Mèo' : 'Khác')).join(', ')}
                                </Box>
                            </>
                        )}
                    </Box>
                }
                slotProps={{
                    primary: {
                        component: 'span',
                        variant: 'body1',
                        noWrap: true,
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
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', fontSize: '0.875rem', color: COLORS.secondary }}>
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
                    fontSize: "0.9375rem",
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
                    fontSize: "0.8125rem",
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
                fontSize: "0.75rem",
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
interface RenderStatusCellProps extends GridRenderCellParams {
}

export const RenderStatusCell = (params: RenderStatusCellProps) => {
    const { t } = useTranslation();
    const status = (params.value as string || params.row?.status as string || '')?.toUpperCase();

    let label = t("admin.product.status.draft") || "BẢN NHÁP";
    let bg = "#919EAB29";
    let text = "#637381";

    if (status === "ACTIVE") {
        label = t("admin.product.status.active") || "HOẠT ĐỘNG";
        bg = "rgba(17, 141, 87, 0.16)";
        text = "#118D57";
    } else if (status === "DRAFT") {
        label = t("admin.product.status.draft") || "BẢN NHÁP";
        bg = "rgba(183, 110, 0, 0.16)";
        text = "#B76E00";
    } else if (status === "HIDDEN" || status === "INACTIVE") {
        label = t("admin.product.status.inactive") || "TẠM ẨN";
        bg = "rgba(183, 29, 24, 0.16)";
        text = "#B71D18";
    } else {
        label = status;
    }

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Box
                component="span"
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '24px',
                    lineHeight: '24px',
                    px: '8px',
                    minWidth: '50px',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: text,
                    bgcolor: bg,
                    textTransform: 'uppercase'
                }}
            >
                {label}
            </Box>
        </Box>
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
        <span style={{ color: color, fontWeight: 600, fontSize: '0.875rem' }}>
            {label}
        </span>
    );
}

// Product Type
export const RenderProductTypeCell = (params: GridRenderCellParams) => {
    const type = (params.row.productType as string)?.toUpperCase();

    // You might want icons here
    return (
        <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#637381' }}>
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
                            fontSize: '0.8125rem',
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
                            fontSize: '0.8125rem',
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
                            fontSize: '0.8125rem',
                            fontWeight: "600",
                            color: "#FF5630"
                        },
                    },
                } as any)}
            />
        </GridActionsCell>
    );
}