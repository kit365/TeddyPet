import { Avatar, Box, LinearProgress, Link, ListItemText } from "@mui/material";
import { GridActionsCell, GridActionsCellItem, GridRenderCellParams } from "@mui/x-data-grid";
import { DeleteIcon, EditIcon, EyeIcon } from "../../../assets/icons/index";
import { COLORS } from "../configs/constants";
import { useTranslation } from "react-i18next";

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
                        href={`/dashboard/product/${params.row.id}`}
                        className="product-title"
                        underline="hover"
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
export const RenderCreatedAtCell = () => {
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
                }}>
                29 Dec 2025
            </span>

            <Box
                className="date-text"
                component='span'
                sx={{
                    fontSize: "1.2rem",
                    color: COLORS.secondary
                }}
            >
                11:02 pm
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
    const status = params.row.status;

    let label = t("admin.product.status.draft");
    let bg = "#919EAB29";
    let text = "#1c252e";

    if (status === "active") {
        label = t("admin.product.status.active");
        bg = "#00B8D929";
        text = "#006C9C";
    } else if (status === "inactive") {
        label = t("admin.product.status.inactive");
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
    const { t } = useTranslation();
    return (
        <GridActionsCell {...params}>
            <GridActionsCellItem
                icon={<EyeIcon />}
                label={t("admin.common.details")}
                showInMenu
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