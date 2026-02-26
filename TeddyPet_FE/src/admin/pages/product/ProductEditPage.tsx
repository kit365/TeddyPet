import { Autocomplete, Box, createTheme, FormControl, InputLabel, MenuItem, OutlinedInput, Select, SelectChangeEvent, Stack, TextField, ThemeProvider, useTheme, Button, CircularProgress } from "@mui/material"
import { useTranslation } from "react-i18next";
import { useProductTags, useProductAgeRanges, useCountries, useBrands, useProductDetail, useUpdateProduct } from "./hooks/useProduct";
import { Breadcrumb } from "../../components/ui/Breadcrumb"
import { Title } from "../../components/ui/Title"
import { useState, useEffect } from "react"
import { Tiptap } from "../../components/layouts/titap/Tiptap"
import { UploadFiles } from "../../components/ui/UploadFiles"
import { CollapsibleCard } from "../../components/ui/CollapsibleCard"
import { prefixAdmin } from "../../constants/routes";
import { CategoryMultiTreeSelect } from "../../components/ui/CategoryMultiTreeSelect";
import { useNestedProductCategories } from "../product-category/hooks/useProductCategory";
import { ProductVariants } from "./components/ProductVariants";
import { useProductAttributes } from "../product-attribute/hooks/useProductAttribute";
import { toast } from "react-toastify";
import { ProductVariant as Variant, APIProduct } from "../../../types/products.type";
import { CustomFile } from "../../../types/common.type";
import { useParams, useNavigate } from "react-router-dom";
import Barcode from 'react-barcode';

export const ProductEditPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [expandedDetail, setExpandedDetail] = useState(true);
    const [expandedVariants, setExpandedVariants] = useState(true);
    const [expandedExtra, setExpandedExtra] = useState(true);
    const toggle = (setter: React.Dispatch<React.SetStateAction<boolean>>) =>
        () => setter(prev => !prev);

    const [selectedTags, setSelectedTags] = useState<any[]>([]);
    const { data: tagOptions = [] as any[] } = useProductTags();

    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
    const { data: productCategories = [] } = useNestedProductCategories();

    const [selectedAgeIds, setSelectedAgeIds] = useState<number[]>([]);
    const { data: ageRanges = [] } = useProductAgeRanges();

    const [files, setFiles] = useState<CustomFile[]>([]);

    // Country
    const { data: countries = [] } = useCountries();
    const [origin, setOrigin] = useState<string>("");

    const handleChangeOrigin = (event: SelectChangeEvent) => {
        setOrigin(event.target.value as string);
    };

    // Brand
    const { data: brands = [] } = useBrands();
    const [brandId, setBrandId] = useState<string | number>('');

    const handleChangeBrand = (event: SelectChangeEvent) => {
        setBrandId(event.target.value as string);
    };

    // Variants
    const [variants, setVariants] = useState<Variant[]>([]);

    // Attributes (for lookup)
    const { data: allAttributes = [] } = useProductAttributes();

    const [description, setDescription] = useState("");

    const { data: product, isLoading: isProductLoading } = useProductDetail(id);
    const updateProductMutation = useUpdateProduct();

    const [productType, setProductType] = useState<"SIMPLE" | "VARIABLE">("SIMPLE");
    const [status, setStatus] = useState<string>("DRAFT");

    // Simple Product State
    const [simplePrice, setSimplePrice] = useState<number>(0);
    const [simpleSalePrice, setSimpleSalePrice] = useState<number>(0);
    const [simpleStock, setSimpleStock] = useState<number>(0);
    const [simpleSku, setSimpleSku] = useState<string>("");
    const [barcode, setBarcode] = useState<string>("");

    // Initialize form with product data
    useEffect(() => {
        if (product) {
            setProductType(product.productType || "SIMPLE");
            setStatus(product.status || "DRAFT");
            setBarcode(product.barcode || "");

            // Fix Origin mismatch: if backend returns Name but we need Code, or vice-versa
            let originValue = product.origin || "";
            // Check if originValue matches a code in countries list
            if (originValue && countries.length > 0) {
                const isCode = countries.some((c: any) => c.code === originValue);
                if (!isCode) {
                    // Try to find by name
                    const foundCountry = countries.find((c: any) => c.name.toLowerCase() === originValue.toLowerCase());
                    if (foundCountry) {
                        originValue = foundCountry.code;
                    }
                }
            }
            setOrigin(originValue);

            setBrandId(product.brand?.id || product.brand?.brandId || "");
            setSelectedCategoryIds(product.categories?.map((c: any) => c.id || c.categoryId) || []);
            setSelectedTags(product.tags || []);
            setSelectedAgeIds(product.ageRanges?.map((a: any) => a.id || a.ageRangeId) || []);
            setDescription(product.description || "");

            // Images
            const productImages = product.images?.map((img: any) => ({
                id: img.id || img.imageId,
                name: img.altText || "image",
                preview: img.imageUrl,
                size: 0,
                type: "image/jpeg"
            })) || [];
            setFiles(productImages);

            if (product.productType === "SIMPLE" && product.variants?.length > 0) {
                const defaultVariant = product.variants[0];
                setSimplePrice(defaultVariant.price || 0);
                setSimpleSalePrice(defaultVariant.salePrice || 0);
                setSimpleStock(defaultVariant.stockQuantity || 0);
                setSimpleSku(defaultVariant.sku || "");
            } else if (product.productType === "VARIABLE") {
                const mappedVariants: Variant[] = product.variants.map((v: any) => ({
                    id: String(v.variantId || v.id),
                    variantId: v.variantId || v.id,
                    attributes: v.attributes?.map((a: any) => ({
                        name: a.attributeName,
                        value: a.value,
                        id: a.valueId || a.id
                    })) || [],
                    sku: v.sku || "",
                    originalPrice: v.price || 0,
                    price: v.salePrice || v.price || 0,
                    stock: v.stockQuantity || 0,
                    status: v.status || "ACTIVE",
                    featuredImage: v.featuredImageUrl,
                    featuredImageId: v.featuredImageId,
                    active: v.isActive !== false
                }));
                setVariants(mappedVariants);
            }
        }
    }, [product, countries]);

    const handleChangeStatus = (event: SelectChangeEvent) => {
        setStatus(event.target.value as string);
    };

    const handleChangeAge = (event: SelectChangeEvent<number[]>) => {
        const { target: { value } } = event;
        // value can be string (comma separated) or array of numbers/strings
        let newValues: number[] = [];

        if (typeof value === 'string') {
            newValues = value.split(',').filter(v => v !== "").map(Number);
        } else if (Array.isArray(value)) {
            newValues = value.map(Number);
        }

        setSelectedAgeIds(newValues);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!id) return;

        const formData = new FormData(e.currentTarget);

        const getAttributeDetail = (name: string, value: string) => {
            const attr = allAttributes.find((a: any) => a.name === name);
            const val = attr?.values?.find((v: any) => v.value === value);
            return {
                attributeId: attr?.attributeId || attr?.id,
                valueId: val?.valueId || val?.id || val?.attributeValueId
            };
        };

        let variantsPayload: any[] = [];
        let attributeIdsPayload: number[] = [];

        if (productType === "SIMPLE") {
            variantsPayload = [{
                variantId: product?.productType === "SIMPLE" ? product.variants[0]?.variantId : null,
                name: "Default",
                price: Number(simplePrice),
                salePrice: (Number(simpleSalePrice) > 0 && Number(simpleSalePrice) < Number(simplePrice)) ? Number(simpleSalePrice) : null,
                stockQuantity: Number(simpleStock),
                sku: simpleSku || undefined,
                unit: "PIECE",
                status: status,
                attributeValueIds: []
            }];
            attributeIdsPayload = [];
        } else {
            const usedAttributeIds = new Set<number>();
            variants.forEach(v => {
                v.attributes.forEach((a: any) => {
                    const detail = getAttributeDetail(a.name, a.value);
                    if (detail?.attributeId) {
                        usedAttributeIds.add(Number(detail.attributeId));
                    }
                });
            });
            attributeIdsPayload = Array.from(usedAttributeIds);

            variantsPayload = variants.map((v) => {
                const attributeValueIds = v.attributes.map((a: any) => {
                    if (!a.id) {
                        const detail = getAttributeDetail(a.name, a.value);
                        return detail?.valueId;
                    }
                    return a.id;
                }).filter((id: any) => !!id);

                return {
                    variantId: typeof v.id === 'number' || !v.id.includes('variant-') ? Number(v.id) : null,
                    price: Number(v.originalPrice),
                    salePrice: (Number(v.price) > 0 && Number(v.price) < Number(v.originalPrice)) ? Number(v.price) : 0,
                    stockQuantity: Number(v.stock),
                    unit: "PIECE",
                    featuredImageUrl: v.featuredImage,
                    status: v.status || "ACTIVE",
                    attributeValueIds: attributeValueIds
                };
            });
        }

        const finalPayload = {
            name: formData.get('name') as string,
            barcode: formData.get('barcode') as string,
            description: description,
            content: product?.content || "Nội dung chi tiết",
            origin: origin,
            material: formData.get('material') as string,
            petTypes: product?.petTypes || ["DOG"],
            brandId: Number(brandId),
            status: status,
            productType: productType,
            categoryIds: selectedCategoryIds,
            tagIds: selectedTags.map((tag: any) => tag.id || tag.tagId || tag.productTagId).filter(Boolean),
            ageRangeIds: selectedAgeIds,
            attributeIds: attributeIdsPayload,
            images: files.map((f, index) => ({
                imageId: f.id,
                imageUrl: typeof f === 'string' ? f : (f.preview || ""),
                displayOrder: index,
                altText: f.name || ""
            })),
            variants: variantsPayload
        };

        updateProductMutation.mutate({ id, data: finalPayload }, {
            onSuccess: (response) => {
                if (response.success) {
                    toast.success(response.message || "Cập nhật sản phẩm thành công!");
                    navigate(`/${prefixAdmin}/product/list`);
                } else {
                    toast.error(response.message);
                }
            },
            onError: (error: any) => {
                toast.error(error.message || "Có lỗi xảy ra khi cập nhật sản phẩm");
            }
        });
    };

    if (isProductLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                <CircularProgress />
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
                    <Title title={t('admin.product.title.edit') || "Chỉnh sửa sản phẩm"} />
                    <Breadcrumb
                        items={[
                            { label: t('admin.dashboard'), to: "/" },
                            { label: t('admin.product.title.list'), to: `/${prefixAdmin}/product/list` },
                            { label: t('admin.common.edit') || "Chỉnh sửa" }
                        ]}
                    />
                </div>
            </div>
            <ThemeProvider theme={localTheme}>
                <form onSubmit={handleSubmit}>
                    <Stack sx={{ margin: "0px 120px", gap: "40px" }}>
                        <CollapsibleCard title="Loại sản phẩm" expanded={true} onToggle={() => { }}>
                            <Stack p="24px">
                                <FormControl fullWidth>
                                    <InputLabel id="product-type-label">Loại sản phẩm</InputLabel>
                                    <Select
                                        labelId="product-type-label"
                                        value={productType}
                                        label="Loại sản phẩm"
                                        onChange={(e) => setProductType(e.target.value as any)}
                                        disabled={product?.productType !== undefined} // Prevent switching type after creation
                                    >
                                        <MenuItem value="SIMPLE">Sản phẩm đơn (Simple)</MenuItem>
                                        <MenuItem value="VARIABLE">Sản phẩm biến thể (Variable)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>
                        </CollapsibleCard>

                        <CollapsibleCard
                            title={t('admin.common.details')}
                            subheader={t('admin.common.description')}
                            expanded={expandedDetail}
                            onToggle={toggle(setExpandedDetail)}
                        >
                            <Stack p="24px" gap="24px">
                                <TextField
                                    label={t('admin.product.fields.name')}
                                    name="name"
                                    fullWidth
                                    required
                                    defaultValue={product?.name}
                                />
                                <Stack direction="row" gap={2}>
                                    <FormControl fullWidth>
                                        <InputLabel id="brand-select-label">Thương hiệu</InputLabel>
                                        <Select
                                            labelId="brand-select-label"
                                            value={typeof brandId === 'number' ? String(brandId) : brandId}
                                            label="Thương hiệu"
                                            onChange={handleChangeBrand}
                                        >
                                            {brands.map((brand: any) => (
                                                <MenuItem key={brand.id || brand.brandId} value={brand.id || brand.brandId}>
                                                    {brand.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl fullWidth>
                                        <InputLabel id="origin-select-label" >
                                            Xuất xứ
                                        </InputLabel>
                                        <Select
                                            labelId="origin-select-label"
                                            value={origin}
                                            input={<OutlinedInput label="Xuất xứ" />}
                                            onChange={handleChangeOrigin}
                                            MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                                        >
                                            {countries.map((country: any) => (
                                                <MenuItem key={country.code} value={country.code} sx={{ fontSize: '1.4rem' }}>
                                                    {country.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Stack>
                                <TextField
                                    label="Nguyên vật liệu"
                                    name="material"
                                    multiline
                                    rows={2}
                                    fullWidth
                                    defaultValue={product?.material}
                                />
                                <Tiptap value={description} onChange={setDescription} />
                                <UploadFiles
                                    files={files}
                                    onFilesChange={(newFiles) => setFiles(newFiles)}
                                />
                            </Stack>
                        </CollapsibleCard>

                        {productType === "SIMPLE" ? (
                            <CollapsibleCard
                                title="Giá & Kho hàng"
                                subheader="Thiết lập giá và số lượng tồn kho"
                                expanded={true}
                                onToggle={() => { }}
                            >
                                <Stack p="24px" gap="24px" direction="row" flexWrap="wrap">
                                    <TextField
                                        label="Giá bán gốc (VNĐ)"
                                        type="number"
                                        fullWidth
                                        required
                                        value={simplePrice}
                                        onChange={(e) => setSimplePrice(Number(e.target.value))}
                                        sx={{ flex: 1, minWidth: '200px' }}
                                    />
                                    <TextField
                                        label="Giá khuyến mãi (VNĐ)"
                                        type="number"
                                        fullWidth
                                        value={simpleSalePrice}
                                        onChange={(e) => setSimpleSalePrice(Number(e.target.value))}
                                        sx={{ flex: 1, minWidth: '200px' }}
                                    />
                                    <TextField
                                        label="Số lượng tồn kho"
                                        type="number"
                                        fullWidth
                                        required
                                        value={simpleStock}
                                        onChange={(e) => setSimpleStock(Number(e.target.value))}
                                        sx={{ flex: 1, minWidth: '200px' }}
                                    />
                                    <TextField
                                        label="SKU (Mã kho)"
                                        name="sku"
                                        fullWidth
                                        value={simpleSku}
                                        onChange={(e) => setSimpleSku(e.target.value)}
                                        sx={{ flex: 1, minWidth: '200px' }}
                                    />
                                </Stack>
                            </CollapsibleCard>
                        ) : (
                            <ProductVariants
                                expanded={expandedVariants}
                                onToggle={toggle(setExpandedVariants)}
                                variants={variants}
                                onVariantsChange={setVariants}
                                availableImages={files}
                            />
                        )}

                        <CollapsibleCard
                            title={t('admin.common.attributes')}
                            subheader={t('admin.common.description')}
                            expanded={expandedExtra}
                            onToggle={toggle(setExpandedExtra)}
                        >
                            <Stack p="24px" gap="24px">
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(2, 1fr)",
                                        gap: "24px 16px",
                                    }}
                                >
                                    <Stack direction="row" gap={2} alignItems="center">
                                        <FormControl fullWidth>
                                            <TextField
                                                label="Mã vạch (Barcode)"
                                                name="barcode"
                                                placeholder="Nhập mã vạch..."
                                                value={barcode}
                                                onChange={(e) => setBarcode(e.target.value)}
                                            />
                                        </FormControl>
                                        {barcode && barcode.length > 0 && (
                                            <Box sx={{ border: '1px solid #ccc', p: 1, borderRadius: 1, bgcolor: 'white' }}>
                                                <Barcode value={barcode} width={1} height={40} fontSize={14} />
                                            </Box>
                                        )}
                                    </Stack>
                                    <FormControl>
                                        <InputLabel id="status-select-label">Trạng thái</InputLabel>
                                        <Select
                                            labelId="status-select-label"
                                            value={status}
                                            label="Trạng thái"
                                            onChange={handleChangeStatus}
                                        >
                                            <MenuItem value="DRAFT">Nháp (Draft)</MenuItem>
                                            <MenuItem value="ACTIVE">Hoạt động (Active)</MenuItem>
                                            <MenuItem value="HIDDEN">Ẩn (Hidden)</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <TextField label={t('admin.common.position')} name="position" />
                                    <FormControl>
                                        <InputLabel id="age-select-label">Độ tuổi</InputLabel>
                                        <Select
                                            labelId="age-select-label"
                                            multiple
                                            value={selectedAgeIds}
                                            onChange={handleChangeAge}
                                            input={<OutlinedInput label="Độ tuổi" />}
                                            renderValue={(selected) => {
                                                const validSelected = selected.filter(id => id !== undefined && id !== null);
                                                if (validSelected.length === 0) return "";
                                                const names = validSelected.map(id => {
                                                    const age = ageRanges.find((a: any) => a.id === id || a.ageRangeId === id);
                                                    return age?.name || age?.label || id;
                                                });
                                                return names.join(', ');
                                            }}
                                        >
                                            {ageRanges.map((age: any) => {
                                                const ageId = age.id || age.ageRangeId;
                                                return (
                                                    <MenuItem key={ageId} value={ageId}>
                                                        {age.name || age.label}
                                                    </MenuItem>
                                                );
                                            })}
                                        </Select>
                                    </FormControl>
                                </Box>
                                <CategoryMultiTreeSelect
                                    categories={productCategories}
                                    selectedIds={selectedCategoryIds}
                                    onChange={(ids) => setSelectedCategoryIds(ids)}
                                />
                                <Autocomplete
                                    multiple
                                    options={tagOptions}
                                    getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                                    value={selectedTags}
                                    onChange={(_event, newValue) => setSelectedTags(newValue)}
                                    filterSelectedOptions
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={t('admin.product.fields.tags')}
                                            placeholder={t('admin.product.fields.tags_placeholder')}
                                        />
                                    )}
                                    sx={{
                                        '& .MuiAutocomplete-clearIndicator': { color: "#637381" },
                                        "& .MuiChip-root": {
                                            backgroundColor: "rgba(0, 184, 217, 0.16)",
                                            color: "#006C9C",
                                            fontWeight: "600"
                                        },
                                    }}
                                />
                            </Stack>
                        </CollapsibleCard>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: "16px" }}>
                            <Button
                                type="submit"
                                variant="contained"
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
                                {t('admin.common.save') || "Lưu thay đổi"}
                            </Button>
                        </Box>
                    </Stack>
                </form>
            </ThemeProvider>
        </>
    )
}
