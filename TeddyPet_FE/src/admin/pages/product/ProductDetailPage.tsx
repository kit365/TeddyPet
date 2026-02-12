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
        <>
            <div className="mb-[40px] gap-[16px] flex items-start justify-end">
                <div className="mr-auto">
                    <Stack direction="row" alignItems="center" gap={2}>
                        <Title title={product.name} />
                        <Chip
                            label={product.status}
                            color={product.status === "ACTIVE" ? "success" : "default"}
                            sx={{ fontWeight: "700", fontSize: "1.2rem" }}
                        />
                    </Stack>
                    <Breadcrumb
                        items={[
                            { label: t('admin.dashboard'), to: "/" },
                            { label: t('admin.product.title.list'), to: `/${prefixAdmin}/product/list` },
                            { label: t('admin.common.details') || "Chi tiết" }
                        ]}
                    />
                </div>
                <Button
                    variant="contained"
                    onClick={() => navigate(`/${prefixAdmin}/product/edit/${id}`)}
                    sx={{
                        background: '#1C252E',
                        fontWeight: 700,
                        fontSize: "1.4rem",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        textTransform: "none",
                        "&:hover": { background: "#454F5B" }
                    }}
                >
                    {t('admin.common.edit') || "Chỉnh sửa"}
                </Button>
            </div>

            <ThemeProvider theme={localTheme}>
                <Stack sx={{ margin: "0px 120px", gap: "40px" }}>
                    <CollapsibleCard
                        title={t('admin.common.details')}
                        subheader={t('admin.common.description')}
                        expanded={expandedDetail}
                        onToggle={() => setExpandedDetail(!expandedDetail)}
                    >
                        <Stack p="24px" gap="24px">
                            <TextField label={t('admin.product.fields.name')} value={product.name} fullWidth InputProps={{ readOnly: true }} />
                            <Stack direction="row" gap={2}>
                                <TextField label="Thương hiệu" value={product.brand?.name || "N/A"} fullWidth InputProps={{ readOnly: true }} />
                                <TextField label="Xuất xứ" value={product.origin || "N/A"} fullWidth InputProps={{ readOnly: true }} />
                            </Stack>
                            <TextField label="Nguyên vật liệu" value={product.material || "N/A"} multiline rows={2} fullWidth InputProps={{ readOnly: true }} />

                            <Box>
                                <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 1 }}>Mô tả chi tiết</Typography>
                                <Box sx={{ p: 2, border: "1px solid #919eab33", borderRadius: "8px", minHeight: "100px" }} dangerouslySetInnerHTML={{ __html: product.description || "<i>Không có mô tả</i>" }} />
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 1 }}>Hình ảnh</Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                                    {product.images?.map((img: any, idx: number) => (
                                        <Box
                                            key={idx}
                                            component="img"
                                            src={img.imageUrl}
                                            sx={{ width: 120, height: 120, borderRadius: "12px", objectFit: "cover", border: "1px solid #919eab29" }}
                                        />
                                    ))}
                                    {(!product.images || product.images.length === 0) && <Typography variant="body2" color="text.secondary">Chưa có hình ảnh</Typography>}
                                </Box>
                            </Box>
                        </Stack>
                    </CollapsibleCard>

                    <CollapsibleCard
                        title="Dữ liệu Biến thể"
                        subheader={product.productType === "SIMPLE" ? "Sản phẩm đơn" : "Sản phẩm nhiều biến thể"}
                        expanded={expandedVariants}
                        onToggle={() => setExpandedVariants(!expandedVariants)}
                    >
                        <Box p="24px">
                            {product.variants?.map((v: any, idx: number) => (
                                <Box key={idx} sx={{ p: 2, mb: 2, border: "1px solid #919eab29", borderRadius: "8px", display: "flex", gap: 3, alignItems: "center" }}>
                                    {v.featuredImageUrl && <Box component="img" src={v.featuredImageUrl} sx={{ width: 64, height: 64, borderRadius: "8px" }} />}
                                    <Box flex={1}>
                                        <Typography sx={{ fontWeight: 600 }}>{v.name || "Mặc định"}</Typography>
                                        <Stack direction="row" gap={1} mt={0.5}>
                                            {v.attributes?.map((attr: any, i: number) => (
                                                <Chip key={i} label={`${attr.attributeName}: ${attr.value}`} size="small" variant="outlined" />
                                            ))}
                                        </Stack>
                                    </Box>
                                    <Box textAlign="right">
                                        <Typography sx={{ fontWeight: 700, color: "#FF5630" }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.salePrice || v.price)}</Typography>
                                        {v.salePrice && <Typography sx={{ textDecoration: "line-through", color: "text.secondary", fontSize: "1.2rem" }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.price)}</Typography>}
                                        <Typography variant="body2" color="text.secondary">Tồn kho: {v.stockQuantity}</Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </CollapsibleCard>

                    <CollapsibleCard
                        title="Thông tin bổ sung"
                        expanded={expandedExtra}
                        onToggle={() => setExpandedExtra(!expandedExtra)}
                    >
                        <Stack p="24px" gap="3">
                            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 3 }}>
                                <TextField label="Mã vạch (Barcode)" value={product.barcode || "N/A"} InputProps={{ readOnly: true }} />
                                <TextField label="Loại sản phẩm" value={product.productType} InputProps={{ readOnly: true }} />
                            </Box>

                            <Box mt={3}>
                                <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 1 }}>Danh mục</Typography>
                                <Stack direction="row" gap={1} flexWrap="wrap">
                                    {product.categories?.map((c: any, i: number) => <Chip key={i} label={c.name} />)}
                                </Stack>
                            </Box>

                            <Box mt={3}>
                                <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 1 }}>Thẻ (Tags)</Typography>
                                <Stack direction="row" gap={1} flexWrap="wrap">
                                    {product.tags?.map((t: any, i: number) => <Chip key={i} label={t.name} variant="outlined" sx={{ borderColor: "#00B8D9", color: "#006C9C", bgcolor: "rgba(0, 184, 217, 0.16)" }} />)}
                                </Stack>
                            </Box>
                        </Stack>
                    </CollapsibleCard>
                </Stack>
            </ThemeProvider>
        </>
    )
}
