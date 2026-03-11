import { Autocomplete, Box, createTheme, FormControl, InputLabel, MenuItem, OutlinedInput, Select, Stack, TextField, ThemeProvider, useTheme, Button, CircularProgress, Chip, Typography } from "@mui/material"
import { useTranslation } from "react-i18next";
import { useProductDetail } from "./hooks/useProduct";
import { Breadcrumb } from "../../components/ui/Breadcrumb"
import { Title } from "../../components/ui/Title"
import { prefixAdmin } from "../../constants/routes";
import { CollapsibleCard } from "../../components/ui/CollapsibleCard"
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";

export const ProductDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [expandedDetail, setExpandedDetail] = useState(true);
    const [expandedVariants, setExpandedVariants] = useState(true);
    const [expandedExtra, setExpandedExtra] = useState(true);

    const { data: product, isLoading: isProductLoading } = useProductDetail(id);

    if (isProductLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (!product) {
        return (
            <Box p={3}>
                <Typography variant="h5">Không tìm thấy sản phẩm</Typography>
                <Button onClick={() => navigate(`/${prefixAdmin}/product/list`)}>Quay lại danh sách</Button>
            </Box>
        );
    }

    const outerTheme = useTheme();
    const localTheme = createTheme(outerTheme, {
        components: {
            MuiCard: {
                styleOverrides: {
                    root: {
                        backgroundImage: "none !important",
                        backdropFilter: "none !important",
                        backgroundColor: "#fff !important",
                        boxShadow: "0 0 2px 0 #919eab33, 0 12px 24px -4px #919eab1f",
                        borderRadius: "16px",
                        color: "#1C252E",
                    },
                }
            },
        }
    });

    return (
        <ThemeProvider theme={localTheme}>
            <Box sx={{ pb: 5 }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 4 }}>
                    <Box>
                        <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 1 }}>
                            <Title title={product.name} />
                            <Chip
                                label={product.status}
                                variant="soft"
                                color={product.status === "ACTIVE" ? "success" : "default"}
                                sx={{ fontWeight: "700", fontSize: "1.2rem", borderRadius: "8px" }}
                            />
                        </Stack>
                        <Breadcrumb
                            items={[
                                { label: t('admin.dashboard'), to: "/" },
                                { label: t('admin.product.title.list'), to: `/${prefixAdmin}/product/list` },
                                { label: t('admin.common.details') || "Chi tiết" }
                            ]}
                        />
                    </Box>
                    <Button
                        variant="contained"
                        onClick={() => navigate(`/${prefixAdmin}/product/edit/${id}`)}
                        startIcon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>}
                        sx={{
                            background: '#1C252E',
                            fontWeight: 700,
                            fontSize: "1.4rem",
                            padding: "10px 20px",
                            borderRadius: "10px",
                            textTransform: "none",
                            boxShadow: "0 8px 16px 0 rgba(28, 37, 46, 0.24)",
                            "&:hover": {
                                background: "#454F5B",
                                boxShadow: "none"
                            }
                        }}
                    >
                        {t('admin.common.edit') || "Chỉnh sửa sản phẩm"}
                    </Button>
                </Stack>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: "32px" }}>
                    {/* LEFT COLUMN */}
                    <Stack gap="32px">
                        <CollapsibleCard
                            title={t('admin.common.details')}
                            expanded={expandedDetail}
                            onToggle={() => setExpandedDetail(!expandedDetail)}
                        >
                            <Stack p="32px" gap="24px">
                                <Box>
                                    <Typography variant="overline" sx={{ color: "text.disabled", mb: 1, display: "block" }}>Tên sản phẩm</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: "#1C252E" }}>{product.name}</Typography>
                                </Box>

                                <Box>
                                    <Typography variant="overline" sx={{ color: "text.disabled", mb: 1, display: "block" }}>Mô tả chi tiết</Typography>
                                    <Box
                                        sx={{
                                            p: 2.5,
                                            bgcolor: "#F4F6F8",
                                            borderRadius: "12px",
                                            fontSize: "1.5rem",
                                            lineHeight: 1.6,
                                            color: "#454F5B",
                                            "& p": { mb: 1 }
                                        }}
                                        dangerouslySetInnerHTML={{ __html: product.description || "<i>Không có mô tả</i>" }}
                                    />
                                </Box>

                                <Box>
                                    <Typography variant="overline" sx={{ color: "text.disabled", mb: 2, display: "block" }}>Hình ảnh sản phẩm</Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                                        {product.images?.map((img: any, idx: number) => (
                                            <Box
                                                key={idx}
                                                component="img"
                                                src={img.imageUrl}
                                                sx={{
                                                    width: 140,
                                                    height: 140,
                                                    borderRadius: "16px",
                                                    objectFit: "cover",
                                                    border: "2px solid #F4F6F8",
                                                    transition: "transform 0.2s",
                                                    "&:hover": { transform: "scale(1.05)" }
                                                }}
                                            />
                                        ))}
                                        {(!product.images || product.images.length === 0) && (
                                            <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>Chưa có hình ảnh</Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Stack>
                        </CollapsibleCard>

                        <CollapsibleCard
                            title="Biến thể sản phẩm"
                            subheader={product.productType === "SIMPLE" ? "Loại: Sản phẩm đơn" : "Loại: Sản phẩm nhiều biến thể"}
                            expanded={expandedVariants}
                            onToggle={() => setExpandedVariants(!expandedVariants)}
                        >
                            <Box p="24px">
                                {product.variants?.map((v: any, idx: number) => (
                                    <Box
                                        key={idx}
                                        sx={{
                                            p: 2.5,
                                            mb: 2,
                                            border: "1px solid #919eab29",
                                            borderRadius: "12px",
                                            display: "flex",
                                            gap: 3,
                                            alignItems: "center",
                                            transition: "background-color 0.2s",
                                            "&:hover": { bgcolor: "#F9FAFB" }
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src={v.featuredImageUrl || product.images?.[0]?.imageUrl || "https://placehold.co/64x64"}
                                            sx={{ width: 80, height: 80, borderRadius: "10px", objectFit: "cover" }}
                                        />
                                        <Box flex={1}>
                                            <Typography sx={{ fontWeight: 700, fontSize: "1.6rem", color: "#1C252E" }}>{v.name || "Biến thể mặc định"}</Typography>
                                            <Typography variant="body2" color="text.disabled" sx={{ mb: 1 }}>SKU: {v.sku || "N/A"}</Typography>
                                            <Stack direction="row" gap={1} flexWrap="wrap">
                                                {v.attributes?.map((attr: any, i: number) => (
                                                    <Chip
                                                        key={i}
                                                        label={`${attr.attributeName}: ${attr.value}`}
                                                        size="small"
                                                        sx={{ bgcolor: "#F4F6F8", fontWeight: 600, fontSize: "1.1rem" }}
                                                    />
                                                ))}
                                            </Stack>
                                        </Box>
                                        <Box textAlign="right">
                                            <Typography sx={{ fontWeight: 800, fontSize: "1.8rem", color: "#FF5630" }}>
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.salePrice || v.price)}
                                            </Typography>
                                            {v.salePrice && (
                                                <Typography sx={{ textDecoration: "line-through", color: "text.disabled", fontSize: "1.3rem" }}>
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.price)}
                                                </Typography>
                                            )}
                                            <Chip
                                                label={`Kho: ${v.stockQuantity}`}
                                                size="small"
                                                color={v.stockQuantity > 10 ? "success" : v.stockQuantity > 0 ? "warning" : "error"}
                                                sx={{ mt: 1, height: "24px", fontWeight: 700 }}
                                            />
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </CollapsibleCard>
                    </Stack>

                    {/* RIGHT COLUMN */}
                    <Stack gap="32px">
                        <CollapsibleCard
                            title="Thông tin phân loại"
                            expanded={expandedExtra}
                            onToggle={() => setExpandedExtra(!expandedExtra)}
                        >
                            <Stack p="24px" gap="24px">
                                <Box>
                                    <Typography variant="overline" sx={{ color: "text.disabled", mb: 1, display: "block" }}>Thương hiệu & Xuất xứ</Typography>
                                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                                        <Typography sx={{ color: "text.secondary" }}>Thương hiệu:</Typography>
                                        <Typography sx={{ fontWeight: 600 }}>{product.brand?.name || "N/A"}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography sx={{ color: "text.secondary" }}>Xuất xứ:</Typography>
                                        <Typography sx={{ fontWeight: 600 }}>{product.origin || "N/A"}</Typography>
                                    </Stack>
                                </Box>

                                <Box>
                                    <Typography variant="overline" sx={{ color: "text.disabled", mb: 1, display: "block" }}>Danh mục</Typography>
                                    <Stack direction="row" gap={1} flexWrap="wrap">
                                        {product.categories?.map((c: any, i: number) => (
                                            <Chip key={i} label={c.name} sx={{ bgcolor: "#E9FCD4", color: "#229A16", fontWeight: 700 }} />
                                        ))}
                                        {(!product.categories || product.categories.length === 0) && <Typography variant="body2" color="text.secondary">Chưa thuộc danh mục nào</Typography>}
                                    </Stack>
                                </Box>

                                <Box>
                                    <Typography variant="overline" sx={{ color: "text.disabled", mb: 1, display: "block" }}>Thẻ (Tags)</Typography>
                                    <Stack direction="row" gap={1} flexWrap="wrap">
                                        {product.tags?.map((t: any, i: number) => (
                                            <Chip key={i} label={t.name} variant="soft" sx={{ bgcolor: "rgba(0, 184, 217, 0.16)", color: "#006C9C", fontWeight: 700 }} />
                                        ))}
                                        {(!product.tags || product.tags.length === 0) && <Typography variant="body2" color="text.secondary">Chưa có thẻ</Typography>}
                                    </Stack>
                                </Box>

                                <Box>
                                    <Typography variant="overline" sx={{ color: "text.disabled", mb: 1, display: "block" }}>Mã vạch (Barcode)</Typography>
                                    <Typography sx={{ fontFamily: "monospace", fontSize: "1.4rem", p: 1, bgcolor: "#F4F6F8", borderRadius: "4px", textAlign: "center" }}>
                                        {product.barcode || "N/A"}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CollapsibleCard>

                        <CollapsibleCard title="Cấu hình kỹ thuật">
                            <Stack p="24px" gap="20px">
                                <Box>
                                    <Typography variant="overline" sx={{ color: "text.disabled", mb: 1, display: "block" }}>Vật liệu</Typography>
                                    <Typography variant="body2">{product.material || "Thông tin đang được cập nhật..."}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="overline" sx={{ color: "text.disabled", mb: 1, display: "block" }}>Phù hợp cho</Typography>
                                    <Stack direction="row" gap={1} flexWrap="wrap">
                                        {product.petTypes?.map((pt: string, i: number) => (
                                            <Chip key={i} label={pt} size="small" variant="outlined" />
                                        ))}
                                    </Stack>
                                </Box>
                            </Stack>
                        </CollapsibleCard>
                    </Stack>
                </Box>
            </Box>
        </ThemeProvider>
    )
}
