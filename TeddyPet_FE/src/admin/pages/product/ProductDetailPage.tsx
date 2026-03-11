import { Box, createTheme, Stack, ThemeProvider, useTheme, Button, CircularProgress, Chip, Typography, Divider } from "@mui/material"
import { useTranslation } from "react-i18next";
import { useProductDetail } from "./hooks/useProduct";
import { Breadcrumb } from "../../components/ui/Breadcrumb"
import { Title } from "../../components/ui/Title"
import { prefixAdmin } from "../../constants/routes";
import { CollapsibleCard } from "../../components/ui/CollapsibleCard"
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Edit2 as EditIcon } from "lucide-react";

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
            <Box sx={{ margin: "0px 120px", pb: 5 }}>
                <div className="mb-[40px] gap-[16px] flex items-start justify-end">
                    <div className="mr-auto">
                        <Stack direction="row" alignItems="center" gap={2}>
                            <Title title={product.name} />
                            <Chip
                                label={product.status === "ACTIVE" ? "Hoạt động" : product.status === "DRAFT" ? "Bản nháp" : "Đã ẩn"}
                                size="small"
                                sx={{ 
                                    fontWeight: "700", 
                                    fontSize: "1.2rem", 
                                    borderRadius: "6px",
                                    bgcolor: product.status === "ACTIVE" ? "rgba(34, 197, 94, 0.16)" : "rgba(145, 158, 171, 0.16)",
                                    color: product.status === "ACTIVE" ? "rgb(17, 141, 87)" : "rgb(99, 115, 129)",
                                    height: "24px",
                                    mt: "-10px"
                                }}
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
                        startIcon={<EditIcon size={16} />}
                        sx={{
                            background: '#1C252E',
                            fontWeight: 700,
                            fontSize: "1.4rem",
                            padding: "8px 16px",
                            borderRadius: "8px",
                            textTransform: "none",
                            boxShadow: "0 8px 16px 0 rgba(28, 37, 46, 0.24)",
                            "&:hover": {
                                background: "#454F5B",
                                boxShadow: "none"
                            }
                        }}
                    >
                        {t('admin.common.edit') || "Chỉnh sửa"}
                    </Button>
                </div>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: "32px" }}>
                    {/* LEFT COLUMN */}
                    <Stack gap="32px">
                        <CollapsibleCard
                            title="Thông tin chung"
                            expanded={expandedDetail}
                            onToggle={() => setExpandedDetail(!expandedDetail)}
                        >
                            <Stack p="24px" gap="24px">
                                <Box>
                                    <Typography sx={{ color: "text.secondary", fontSize: "1.3rem", fontWeight: 600, mb: 1, textTransform: "uppercase" }}>Mô tả sản phẩm</Typography>
                                    {product.description ? (
                                        <Box
                                            sx={{
                                                fontSize: "1.5rem",
                                                lineHeight: 1.6,
                                                color: "#1C252E",
                                                "& p": { mb: 1, mt: 0 }
                                            }}
                                            dangerouslySetInnerHTML={{ __html: product.description }}
                                        />
                                    ) : (
                                        <Typography variant="body2" sx={{ color: "text.disabled", fontStyle: "italic" }}>Chưa có mô tả</Typography>
                                    )}
                                </Box>

                                <Divider sx={{ borderStyle: "dashed" }} />

                                <Box>
                                    <Typography sx={{ color: "text.secondary", fontSize: "1.3rem", fontWeight: 600, mb: 2, textTransform: "uppercase" }}>Hình ảnh ({product.images?.length || 0})</Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                                        {product.images?.map((img: any, idx: number) => (
                                            <Box
                                                key={idx}
                                                component="img"
                                                src={img.imageUrl}
                                                sx={{
                                                    width: 120,
                                                    height: 120,
                                                    borderRadius: "12px",
                                                    objectFit: "cover",
                                                    border: "1px solid rgba(145, 158, 171, 0.24)",
                                                    transition: "transform 0.2s",
                                                    "&:hover": { transform: "scale(1.05)", cursor: "pointer" }
                                                }}
                                            />
                                        ))}
                                        {(!product.images || product.images.length === 0) && (
                                            <Box sx={{ 
                                                width: 120, height: 120, borderRadius: "12px", 
                                                bgcolor: "#F4F6F8", display: "flex", alignItems: "center", 
                                                justifyContent: "center", border: "1px dashed rgba(145, 158, 171, 0.24)"
                                            }}>
                                                <Typography variant="body2" sx={{ color: "text.disabled" }}>Trống</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </Stack>
                        </CollapsibleCard>

                        <CollapsibleCard
                            title="Biến thể & Giá"
                            subheader={product.productType === "SIMPLE" ? "Loại: Sản phẩm đơn" : `Loại: ${product.variants?.length || 0} biến thể`}
                            expanded={expandedVariants}
                            onToggle={() => setExpandedVariants(!expandedVariants)}
                        >
                            <Box p="24px">
                                {product.variants?.map((v: any, idx: number) => (
                                    <Box
                                        key={idx}
                                        sx={{
                                            p: 2,
                                            mb: idx === product.variants.length - 1 ? 0 : 2,
                                            border: "1px solid rgba(145, 158, 171, 0.24)",
                                            borderRadius: "12px",
                                            display: "flex",
                                            gap: 2,
                                            alignItems: "center",
                                            transition: "border-color 0.2s",
                                            "&:hover": { borderColor: "#1C252E" }
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src={v.featuredImageUrl || product.images?.[0]?.imageUrl || "https://placehold.co/64x64"}
                                            sx={{ width: 64, height: 64, borderRadius: "8px", objectFit: "cover" }}
                                        />
                                        <Box flex={1}>
                                            <Typography sx={{ fontWeight: 600, fontSize: "1.4rem", color: "#1C252E", mb: 0.5 }}>{v.name || "Default"}</Typography>
                                            <Stack direction="row" gap={1} alignItems="center">
                                                <Typography variant="body2" color="text.secondary">SKU: {v.sku || "N/A"}</Typography>
                                                {v.attributes?.map((attr: any, i: number) => (
                                                    <Chip
                                                        key={i}
                                                        label={`${attr.value}`}
                                                        size="small"
                                                        sx={{ bgcolor: "#F4F6F8", height: "20px", fontSize: "1.1rem" }}
                                                    />
                                                ))}
                                            </Stack>
                                        </Box>
                                        <Box textAlign="right">
                                            <Stack direction="row" alignItems="center" gap={1} justifyContent="flex-end">
                                                {v.salePrice && v.salePrice > 0 ? (
                                                    <>
                                                        <Typography sx={{ textDecoration: "line-through", color: "text.disabled", fontSize: "1.3rem" }}>
                                                            {v.price.toLocaleString('vi-VN')} đ
                                                        </Typography>
                                                        <Typography sx={{ fontWeight: 700, fontSize: "1.5rem", color: "#FF5630" }}>
                                                            {v.salePrice.toLocaleString('vi-VN')} đ
                                                        </Typography>
                                                    </>
                                                ) : (
                                                    <Typography sx={{ fontWeight: 700, fontSize: "1.5rem", color: "#1C252E" }}>
                                                        {v.price?.toLocaleString('vi-VN')} đ
                                                    </Typography>
                                                )}
                                            </Stack>
                                            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                                                Tồn kho: <span style={{ fontWeight: 600, color: v.stockQuantity > 0 ? "#118D57" : "#B71D18" }}>{v.stockQuantity}</span>
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </CollapsibleCard>
                    </Stack>

                    {/* RIGHT COLUMN */}
                    <Stack gap="32px">
                        <CollapsibleCard
                            title="Tổ chức"
                            expanded={expandedExtra}
                            onToggle={() => setExpandedExtra(!expandedExtra)}
                        >
                            <Stack p="24px" gap="20px">
                                <Box>
                                    <Typography sx={{ color: "text.secondary", fontSize: "1.2rem", fontWeight: 600, mb: 0.5 }}>Thương hiệu</Typography>
                                    <Typography sx={{ fontWeight: 600, fontSize: "1.4rem", color: "#1C252E" }}>{product.brand?.name || "—"}</Typography>
                                </Box>

                                <Box>
                                    <Typography sx={{ color: "text.secondary", fontSize: "1.2rem", fontWeight: 600, mb: 0.5 }}>Xuất xứ</Typography>
                                    <Typography sx={{ fontWeight: 600, fontSize: "1.4rem", color: "#1C252E" }}>{product.origin || "—"}</Typography>
                                </Box>

                                <Divider sx={{ borderStyle: "dashed" }} />

                                <Box>
                                    <Typography sx={{ color: "text.secondary", fontSize: "1.2rem", fontWeight: 600, mb: 1 }}>Danh mục</Typography>
                                    <Stack direction="row" gap={1} flexWrap="wrap">
                                        {product.categories?.map((c: any, i: number) => (
                                            <Chip key={i} label={c.name} sx={{ bgcolor: "#F4F6F8", fontSize: "1.3rem" }} />
                                        ))}
                                        {(!product.categories || product.categories.length === 0) && <Typography variant="body2" color="text.disabled">—</Typography>}
                                    </Stack>
                                </Box>

                                <Box>
                                    <Typography sx={{ color: "text.secondary", fontSize: "1.2rem", fontWeight: 600, mb: 1 }}>Thẻ (Tags)</Typography>
                                    <Stack direction="row" gap={1} flexWrap="wrap">
                                        {product.tags?.map((t: any, i: number) => (
                                            <Chip key={i} label={t.name} size="small" sx={{ bgcolor: "rgba(0, 184, 217, 0.16)", color: "#006C9C", fontWeight: 600 }} />
                                        ))}
                                        {(!product.tags || product.tags.length === 0) && <Typography variant="body2" color="text.disabled">—</Typography>}
                                    </Stack>
                                </Box>
                                
                                <Divider sx={{ borderStyle: "dashed" }} />

                                <Box>
                                    <Typography sx={{ color: "text.secondary", fontSize: "1.2rem", fontWeight: 600, mb: 1 }}>Mã vạch (Barcode)</Typography>
                                    <Typography sx={{ fontFamily: "monospace", fontSize: "1.4rem", p: 1.5, bgcolor: "#F4F6F8", borderRadius: "8px", textAlign: "center", fontWeight: 600, letterSpacing: 1 }}>
                                        {product.barcode || "—"}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CollapsibleCard>

                        <CollapsibleCard 
                            title="Chi tiết kỹ thuật"
                            expanded={true}
                            onToggle={() => {}}
                        >
                            <Stack p="24px" gap="20px">
                                <Box>
                                    <Typography sx={{ color: "text.secondary", fontSize: "1.2rem", fontWeight: 600, mb: 0.5 }}>Vật liệu / Thành phần</Typography>
                                    <Typography sx={{ fontSize: "1.4rem", color: "#1C252E" }}>{product.material || "—"}</Typography>
                                </Box>
                                <Box>
                                    <Typography sx={{ color: "text.secondary", fontSize: "1.2rem", fontWeight: 600, mb: 1 }}>Phù hợp cho</Typography>
                                    <Stack direction="row" gap={1} flexWrap="wrap">
                                        {product.petTypes?.map((pt: string, i: number) => (
                                            <Chip key={i} label={pt === 'DOG' ? 'Chó' : pt === 'CAT' ? 'Mèo' : pt} size="small" variant="outlined" sx={{ fontWeight: 500 }} />
                                        ))}
                                        {(!product.petTypes || product.petTypes.length === 0) && <Typography variant="body2" color="text.disabled">—</Typography>}
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
