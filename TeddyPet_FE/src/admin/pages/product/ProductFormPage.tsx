import { Autocomplete, Box, createTheme, FormControl, InputLabel, MenuItem, OutlinedInput, Select, SelectChangeEvent, Stack, TextField, ThemeProvider, useTheme, Button, Typography, InputAdornment, IconButton, Tooltip, Chip, CircularProgress, Divider } from "@mui/material"
import { ChevronDown as ExpandMoreIcon, RotateCw as RefreshCwIcon, Plus as PlusIcon, Edit2 as EditIcon, Trash2 as TrashIcon, Check } from "lucide-react";
import { autoGenerateSEO, generateBarcode, generateSKU } from "./utils/product-helper";
import { useTranslation } from "react-i18next";
import { useProductTags, useProductAgeRanges, useCountries, useBrands, useProductDetail, useUpdateProduct, useCreateProduct, usePetTypes, useProductStatuses, useProductTypes, useCreateProductTag, useUpdateProductTag, useDeleteProductTag, useSalesUnits } from "./hooks/useProduct";
import { useCreateBrand } from "../brand/hooks/useBrand";
import { useCreateProductCategory } from "../product-category/hooks/useProductCategory";
import { Breadcrumb } from "../../components/ui/Breadcrumb"
import { Title } from "../../components/ui/Title"
import { useState, useEffect, useMemo } from "react"
import { Tiptap } from "../../components/layouts/titap/Tiptap"
import { UploadFiles } from "../../components/ui/UploadFiles"
import { CollapsibleCard } from "../../components/ui/CollapsibleCard"
import { prefixAdmin } from "../../constants/routes";
import { CategoryMultiTreeSelect } from "../../components/ui/CategoryMultiTreeSelect";
import { useNestedProductCategories } from "../product-category/hooks/useProductCategory";
import { ProductVariants } from "./components/ProductVariants";
import { useProductAttributes } from "../product-attribute/hooks/useProductAttribute";
import { toast } from "react-toastify";
import { ProductVariant as Variant } from "../../../types/products.type";
import { CustomFile } from "../../../types/common.type";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Barcode from 'react-barcode';
import { QuickCreateDialog } from "./components/QuickCreateDialog";

const PET_TYPE_LABELS: Record<string, string> = {
    "DOG": "Chó",
    "CAT": "Mèo",
    "OTHER": "Khác"
};

const PRODUCT_STATUS_LABELS: Record<string, string> = {
    "DRAFT": "Nháp (Draft)",
    "ACTIVE": "Hoạt động (Active)",
    "HIDDEN": "Ẩn (Hidden)"
};

const AGE_RANGE_LABELS: Record<string, string> = {
    "ALL": "Tất cả độ tuổi",
    "PUPPY": "Thú cưng nhỏ (Puppy)",
    "ADULT": "Trưởng thành (Adult)",
    "SENIOR": "Thú cưng già (Senior)",
    "UNDER_1_YEAR": "Dưới 1 năm tuổi",
    "OVER_1_YEAR": " Trên 1 năm tuổi"
};

const PRODUCT_TYPE_LABELS: Record<string, string> = {
    "SIMPLE": "Sản phẩm đơn",
    "VARIABLE": "Sản phẩm có biến thể"
};

type FormMode = 'create' | 'edit' | 'view';

export const ProductFormPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    // Determine Mode from Path
    const mode: FormMode = useMemo(() => {
        if (location.pathname.includes('/create')) return 'create';
        if (location.pathname.includes('/edit/')) return 'edit';
        return 'view';
    }, [location.pathname]);

    const isReadOnly = mode === 'view';

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
        if (isReadOnly) return;
        setOrigin(event.target.value as string);
    };

    // Brand
    const { data: brands = [] } = useBrands();
    const [brandId, setBrandId] = useState<string | number>('');

    const handleChangeBrand = (event: SelectChangeEvent) => {
        if (isReadOnly) return;
        setBrandId(event.target.value as string);
    };

    // Variants
    const [variants, setVariants] = useState<Variant[]>([]);

    // Attributes (for lookup)
    const { data: allAttributes = [] } = useProductAttributes();

    const [description, setDescription] = useState("");

    const { data: product, isLoading: isProductLoading } = useProductDetail(id);
    const createProductMutation = useCreateProduct();
    const updateProductMutation = useUpdateProduct();

    const [productType, setProductType] = useState<"SIMPLE" | "VARIABLE">("SIMPLE");
    const [status, setStatus] = useState<string>("DRAFT");
    const [petTypes, setPetTypes] = useState<string[]>(["DOG"]);

    const { data: petTypeOptions = [] } = usePetTypes();
    const { data: productStatusOptions = [] } = useProductStatuses();
    const { data: productTypeOptions = [] } = useProductTypes();
    const { data: salesUnitOptions = [] } = useSalesUnits();

    // Simple Product State
    const [simplePrice, setSimplePrice] = useState<number>(0);
    const [simpleSalePrice, setSimpleSalePrice] = useState<number>(0);
    const [simpleStock, setSimpleStock] = useState<number>(0);
    const [simpleSku, setSimpleSku] = useState<string>("");
    const [simpleWeight, setSimpleWeight] = useState<number>(0);
    const [simpleUnit, setSimpleUnit] = useState<string>("PIECE");
    const [barcode, setBarcode] = useState<string>("");

    // SEO States
    const [metaTitle, setMetaTitle] = useState("");
    const [metaDescription, setMetaDescription] = useState("");

    const [openQuickBrand, setOpenQuickBrand] = useState(false);
    const [openQuickCategory, setOpenQuickCategory] = useState(false);
    const [openQuickTag, setOpenQuickTag] = useState(false);

    const createBrandMutation = useCreateBrand();
    const createCategoryMutation = useCreateProductCategory();
    const createTagMutation = useCreateProductTag();
    const updateTagMutation = useUpdateProductTag();
    const deleteTagMutation = useDeleteProductTag();

    const [editingTag, setEditingTag] = useState<any>(null);

    // Initialize/Reset form based on mode and product data
    useEffect(() => {
        if (mode === 'create') {
            resetFormStates();
        } else if (product) {
            populateForm(product);
        }
    }, [product, mode, countries]);

    const resetFormStates = () => {
        setSelectedTags([]);
        setSelectedCategoryIds([]);
        setSelectedAgeIds([]);
        setFiles([]);
        setOrigin("");
        setBrandId('');
        setVariants([]);
        setStatus("DRAFT");
        setProductType("SIMPLE");
        setPetTypes(["DOG"]);
        setMetaTitle("");
        setMetaDescription("");
        setSimplePrice(0);
        setSimpleSalePrice(0);
        setSimpleStock(0);
        setSimpleWeight(0);
        setSimpleUnit("PIECE");
        setBarcode("");
        setDescription("");
    };

    const populateForm = (p: any) => {
        setProductType(p.productType || "SIMPLE");
        setStatus(p.status || "DRAFT");
        setBarcode(p.barcode || "");

        // Fix Origin mismatch
        let originValue = p.origin || "";
        if (originValue && countries.length > 0) {
            const isCode = countries.some((c: any) => c.code === originValue);
            if (!isCode) {
                const foundCountry = countries.find((c: any) => c.name.toLowerCase() === originValue.toLowerCase());
                if (foundCountry) originValue = foundCountry.code;
            }
        }
        setOrigin(originValue);

        setBrandId(p.brand?.id || p.brand?.brandId || "");
        setSelectedCategoryIds(p.categories?.map((c: any) => c.id || c.categoryId) || []);
        setSelectedTags(p.tags || []);
        setSelectedAgeIds(p.ageRanges?.map((a: any) => a.id || a.ageRangeId) || []);
        setDescription(p.description || "");
        setPetTypes(p.petTypes || ["DOG"]);
        setMetaTitle(p.metaTitle || "");
        setMetaDescription(p.metaDescription || "");

        const productImages = p.images?.map((img: any) => ({
            id: img.id || img.imageId,
            name: img.altText || "image",
            preview: img.imageUrl,
            size: 0,
            type: "image/jpeg"
        })) || [];
        setFiles(productImages);

        if (p.productType === "SIMPLE" && p.variants?.length > 0) {
            const defaultVariant = p.variants[0];
            setSimplePrice(defaultVariant.price || 0);
            setSimpleSalePrice(defaultVariant.salePrice || 0);
            setSimpleStock(defaultVariant.stockQuantity || 0);
            setSimpleSku(defaultVariant.sku || "");
            setSimpleWeight(defaultVariant.weight || 0);
            setSimpleUnit(defaultVariant.unit || "PIECE");
        } else if (p.productType === "VARIABLE") {
            const mappedVariants: Variant[] = p.variants.map((v: any) => ({
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
                active: v.isActive !== false,
                weight: v.weight || 0,
                unit: v.unit || "PIECE"
            }));
            setVariants(mappedVariants);
        }
    };

    const handleChangeStatus = (event: SelectChangeEvent) => {
        if (isReadOnly) return;
        setStatus(event.target.value as string);
    };

    const handleChangeAge = (event: SelectChangeEvent<number[]>) => {
        if (isReadOnly) return;
        const { target: { value } } = event;
        let newValues: number[] = [];
        if (typeof value === 'string') {
            newValues = value.split(',').filter(v => v !== "").map(Number);
        } else if (Array.isArray(value)) {
            newValues = value.map(Number);
        }
        setSelectedAgeIds(newValues);
    };

    const handleChangePetTypes = (event: SelectChangeEvent<string[]>) => {
        if (isReadOnly) return;
        const { target: { value } } = event;
        setPetTypes(typeof value === 'string' ? value.split(',') : value);
    };

    const handleSaveBrand = async (data: any) => {
        try {
            const res = await createBrandMutation.mutateAsync(data);
            if (res?.success === false) {
                toast.error(res?.message || "Tạo thương hiệu thất bại");
                return;
            }
            toast.success("Đã thêm thương hiệu mới");
            setBrandId(res?.data?.id || res?.data?.brandId || res?.id || res?.brandId);
            setOpenQuickBrand(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Lỗi thêm thương hiệu");
        }
    };

    const handleSaveCategory = async (data: any) => {
        try {
            const res = await createCategoryMutation.mutateAsync(data);
            if (res?.success === false) {
                toast.error(res?.message || "Tạo danh mục thất bại");
                return;
            }
            toast.success("Đã thêm danh mục mới");
            setSelectedCategoryIds(prev => [...prev, res?.data?.id || res?.data?.categoryId || res?.id || res?.categoryId]);
            setOpenQuickCategory(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Lỗi thêm danh mục");
        }
    };

    const handleSaveTag = async (data: any) => {
        try {
            if (editingTag) {
                const res = await updateTagMutation.mutateAsync({
                    id: editingTag.id || editingTag.tagId,
                    data
                });
                if (res?.success === false) return toast.error(res?.message || "Lỗi cập nhật tag");
                
                toast.success("Đã cập nhật tag");
                setEditingTag(null);
                setSelectedTags(prev => prev.map(t => (t.id || t.tagId) === (res?.data?.id || res?.data?.tagId || res?.id || res?.tagId) ? (res?.data || res) : t));
            } else {
                const res = await createTagMutation.mutateAsync(data);
                if (res?.success === false) return toast.error(res?.message || "Lỗi thêm tag");
                
                toast.success("Đã thêm tag mới");
                setSelectedTags(prev => [...prev, res?.data || res]);
            }
            setOpenQuickTag(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Lỗi thao tác với tag");
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isReadOnly) return;

        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;

        if (!name.trim()) {
            toast.error("Vui lòng nhập tên sản phẩm");
            return;
        }

        // Strict validation for ACTIVE
        if (status === "ACTIVE") {
            if (selectedCategoryIds.length === 0) {
                toast.error("Vui lòng chọn ít nhất 1 danh mục cho sản phẩm đang hoạt động");
                return;
            }
            if (files.length === 0) {
                toast.error("Vui lòng tải lên ít nhất 1 hình ảnh cho sản phẩm đang hoạt động");
                return;
            }
            if (!brandId) {
                toast.error("Vui lòng chọn thương hiệu cho sản phẩm đang hoạt động");
                return;
            }
            if (productType === "SIMPLE" && simplePrice <= 0) {
                toast.error("Vui lòng nhập giá bán cho sản phẩm đang hoạt động");
                return;
            }
            if (productType === "VARIABLE" && variants.filter(v => v.active).length === 0) {
                toast.error("Vui lòng tạo ít nhất 1 biến thể cho sản phẩm đang hoạt động");
                return;
            }
        }

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
            const finalSku = simpleSku || generateSKU(name);
            variantsPayload = [{
                variantId: mode === 'edit' && product?.productType === "SIMPLE" ? product.variants[0]?.variantId : null,
                name: "Default",
                price: Number(simplePrice),
                salePrice: (Number(simpleSalePrice) > 0 && Number(simpleSalePrice) < Number(simplePrice)) ? Number(simpleSalePrice) : null,
                stockQuantity: Number(simpleStock),
                sku: finalSku,
                unit: simpleUnit,
                weight: Number(simpleWeight),
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
                    variantId: mode === 'edit' && (typeof v.id === 'number' || !v.id.includes('variant-')) ? Number(v.id) : null,
                    price: Number(v.originalPrice),
                    salePrice: (Number(v.price) > 0 && Number(v.price) < Number(v.originalPrice)) ? Number(v.price) : 0,
                    stockQuantity: Number(v.stock),
                    sku: v.sku || generateSKU(name, v.attributes),
                    unit: v.unit || "PIECE",
                    weight: Number(v.weight) || 0,
                    featuredImageUrl: v.featuredImage,
                    status: v.status || "ACTIVE",
                    attributeValueIds: attributeValueIds
                };
            });
        }

        // Auto-generate SEO if empty
        let finalMetaTitle = metaTitle;
        let finalMetaDescription = metaDescription;
        if (!finalMetaTitle || !finalMetaDescription) {
            const autoSEO = autoGenerateSEO(name, description);
            if (!finalMetaTitle) finalMetaTitle = autoSEO.title;
            if (!finalMetaDescription) finalMetaDescription = autoSEO.description;
        }

        const finalPayload = {
            name: name,
            barcode: barcode || (mode === 'create' ? "BARCODE-" + Date.now() : ""),
            description: description,
            metaTitle: finalMetaTitle,
            metaDescription: finalMetaDescription,
            content: product?.content || "Nội dung chi tiết",
            origin: origin,
            material: formData.get('material') as string,
            petTypes: petTypes,
            brandId: Number(brandId),
            status: status,
            productType: productType,
            categoryIds: selectedCategoryIds,
            tagIds: selectedTags.map((tag: any) => tag.id || tag.tagId || tag.productTagId).filter(Boolean),
            ageRangeIds: selectedAgeIds,
            attributeIds: attributeIdsPayload,
            images: files.map((f: any, index: number) => ({
                imageId: f.id || f.imageId,
                imageUrl: typeof f === 'string' ? f : (f.preview || ""),
                displayOrder: index,
                altText: f.name || ""
            })),
            variants: variantsPayload,
            position: 0
        };

        if (mode === 'edit') {
            updateProductMutation.mutate({ id: id!, data: finalPayload }, {
                onSuccess: (response) => {
                    if (response?.success === false) {
                        toast.error(response?.message || "Cập nhật sản phẩm thất bại");
                    } else {
                        toast.success(response?.message || "Cập nhật sản phẩm thành công!");
                        navigate(`/${prefixAdmin}/product/list`);
                    }
                },
                onError: (error: any) => {
                    toast.error(error?.response?.data?.message || "Có lỗi xảy ra khi cập nhật sản phẩm");
                }
            });
        } else {
            createProductMutation.mutate(finalPayload, {
                onSuccess: (response) => {
                    if (response?.success === false) {
                        toast.error(response?.message || "Tạo sản phẩm thất bại");
                    } else {
                        toast.success(response?.message || "Tạo sản phẩm thành công!");
                        navigate(`/${prefixAdmin}/product/list`);
                    }
                },
                onError: (error: any) => {
                    toast.error(error?.response?.data?.message || "Có lỗi xảy ra khi tạo sản phẩm");
                }
            });
        }
    };

    if (isProductLoading && mode !== 'create') {
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

    const pageTitle = mode === 'create' ? t('admin.product.title.create') : mode === 'edit' ? t('admin.product.title.edit') : product?.name || t('admin.common.details');

    return (
        <>
            <div className="mb-[40px] gap-[16px] flex items-start justify-end">
                <div className="mr-auto">
                    <Title title={pageTitle} />
                    <Breadcrumb
                        items={[
                            { label: t('admin.dashboard'), to: "/" },
                            { label: t('admin.product.title.list'), to: `/${prefixAdmin}/product/list` },
                            { label: mode === 'create' ? t('admin.common.create') : mode === 'edit' ? t('admin.common.edit') : t('admin.common.details') }
                        ]}
                    />
                </div>
                {mode === 'view' && (
                    <Button
                        variant="contained"
                        onClick={() => navigate(`/${prefixAdmin}/product/edit/${id}`)}
                        startIcon={<EditIcon size={16} />}
                        sx={{
                            background: '#1C252E',
                            fontWeight: 700,
                            borderRadius: "8px",
                            textTransform: "none",
                            py: 1.2, px: 3,
                            boxShadow: "0 8px 16px 0 rgba(28, 37, 46, 0.24)",
                            "&:hover": { background: "#454F5B" }
                        }}
                    >
                        {t('admin.common.edit')}
                    </Button>
                )}
                {mode !== 'view' && (
                  <Stack direction="row" spacing={2}>
                     <Button 
                        variant="outlined" 
                        onClick={() => navigate(mode === 'edit' ? `/${prefixAdmin}/product/detail/${id}` : `/${prefixAdmin}/product/list`)}
                        sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700 }}
                     >
                        Hủy
                     </Button>
                     <Button 
                        form="product-form"
                        type="submit"
                        variant="contained" 
                        startIcon={<Check size={18}/>}
                        sx={{ 
                            borderRadius: "8px", 
                            textTransform: "none", 
                            fontWeight: 700,
                            bgcolor: '#1C252E', 
                            '&:hover': { bgcolor: '#454F5B' } 
                        }}
                     >
                        {mode === 'create' ? t('admin.common.create') : "Lưu thay đổi"}
                     </Button>
                  </Stack>
                )}
            </div>

            <ThemeProvider theme={localTheme}>
                <form id="product-form" onSubmit={handleSubmit}>
                    <Stack sx={{ margin: { xs: "0px 20px", lg: "0px 120px" }, gap: "40px", pb: 5 }}>
                        
                        {/* 1. PRODUCT TYPE */}
                        {mode === 'create' && (
                             <CollapsibleCard title="Loại sản phẩm" expanded={true} onToggle={() => { }}>
                                <Stack p="24px">
                                    <FormControl fullWidth>
                                        <InputLabel id="product-type-label">Loại sản phẩm</InputLabel>
                                        <Select
                                            labelId="product-type-label"
                                            value={productType}
                                            label="Loại sản phẩm"
                                            onChange={(e) => setProductType(e.target.value as any)}
                                            disabled={isReadOnly}
                                        >
                                            {productTypeOptions.map((type) => (
                                                <MenuItem key={type} value={type}>
                                                    {PRODUCT_TYPE_LABELS[type] || type}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Stack>
                            </CollapsibleCard>
                        )}

                        {/* 2. GENERAL DETAILS */}
                        <CollapsibleCard
                            title={t('admin.common.details')}
                            subheader={t('admin.common.description')}
                            expanded={expandedDetail}
                            onToggle={toggle(setExpandedDetail)}
                        >
                            <Stack p="24px" gap="24px">
                                <Stack direction={{ xs: "column", md: "row" }} gap={2}>
                                    <TextField
                                        label={t('admin.product.fields.name')}
                                        name="name"
                                        fullWidth
                                        required
                                        sx={{ flex: 2 }}
                                        defaultValue={product?.name}
                                        InputProps={{ readOnly: isReadOnly }}
                                    />
                                    <Stack direction="row" gap={2} alignItems="center" sx={{ flex: 2 }}>
                                        <TextField
                                            label="Mã vạch (Barcode)"
                                            name="barcode"
                                            placeholder="Mã vạch..."
                                            fullWidth
                                            value={barcode}
                                            onChange={(e) => setBarcode(e.target.value)}
                                            InputProps={{
                                                readOnly: isReadOnly,
                                                endAdornment: !isReadOnly && (
                                                    <InputAdornment position="end">
                                                        <Tooltip title="Tạo mã vạch ngẫu nhiên">
                                                            <IconButton onClick={() => setBarcode(generateBarcode())} color="primary">
                                                                <RefreshCwIcon size={20} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                        {barcode && (
                                            <Box sx={{ border: '1px solid #eee', p: 0.5, borderRadius: 1, bgcolor: 'white' }}>
                                                <Barcode value={barcode} width={1} height={40} fontSize={12} />
                                            </Box>
                                        )}
                                    </Stack>
                                    <FormControl sx={{ flex: 1 }}>
                                        <InputLabel>Trạng thái</InputLabel>
                                        <Select
                                            value={status}
                                            label="Trạng thái"
                                            onChange={handleChangeStatus}
                                            disabled={isReadOnly}
                                        >
                                            {productStatusOptions.map((s) => (
                                                <MenuItem key={s} value={s}>
                                                    {PRODUCT_STATUS_LABELS[s] || s}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Stack>

                                <Stack direction={{ xs: "column", md: "row" }} gap={2}>
                                    <Stack direction="row" gap={1} sx={{ flex: 1 }}>
                                        <FormControl fullWidth>
                                            <InputLabel>Thương hiệu</InputLabel>
                                            <Select
                                                value={typeof brandId === 'number' ? String(brandId) : brandId}
                                                label="Thương hiệu"
                                                onChange={handleChangeBrand}
                                                disabled={isReadOnly}
                                            >
                                                {brands.map((brand: any) => (
                                                    <MenuItem key={brand.id || brand.brandId} value={brand.id || brand.brandId}>
                                                        {brand.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        {!isReadOnly && (
                                            <IconButton onClick={() => setOpenQuickBrand(true)} sx={{ bgcolor: "#F4F6F8", borderRadius: "8px", width: 48, height: 48 }}>
                                                <PlusIcon size={20} />
                                            </IconButton>
                                        )}
                                    </Stack>

                                    <FormControl fullWidth sx={{ flex: 1 }}>
                                        <InputLabel>Xuất xứ</InputLabel>
                                        <Select
                                            value={origin}
                                            label="Xuất xứ"
                                            onChange={handleChangeOrigin}
                                            disabled={isReadOnly}
                                            MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                                        >
                                            {countries.map((country: any) => (
                                                <MenuItem key={country.code} value={country.code}>
                                                    {country.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Stack>

                                <Stack direction={{ xs: "column", md: "row" }} gap={2}>
                                    <FormControl fullWidth>
                                        <InputLabel>Dành cho giống (Species)</InputLabel>
                                        <Select
                                            multiple
                                            value={petTypes}
                                            onChange={handleChangePetTypes}
                                            input={<OutlinedInput label="Dành cho giống (Species)" />}
                                            renderValue={(selected) => selected.map(val => PET_TYPE_LABELS[val] || val).join(', ')}
                                            disabled={isReadOnly}
                                        >
                                            {petTypeOptions.map((type) => (
                                                <MenuItem key={type} value={type}>
                                                    {PET_TYPE_LABELS[type] || type}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <TextField 
                                        label="Nguyên vật liệu" 
                                        name="material" 
                                        fullWidth 
                                        defaultValue={product?.material}
                                        InputProps={{ readOnly: isReadOnly }}
                                    />
                                </Stack>

                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Mô tả sản phẩm</Typography>
                                    {!isReadOnly ? (
                                        <Tiptap value={description} onChange={setDescription} />
                                    ) : (
                                        <Box 
                                            sx={{ p: 2, border: '1px solid #eee', borderRadius: '8px', minHeight: '100px' }}
                                            dangerouslySetInnerHTML={{ __html: description || "<i>Chưa có mô tả</i>" }}
                                        />
                                    )}
                                </Box>

                                <UploadFiles
                                    files={files}
                                    onFilesChange={setFiles}
                                    folder="products"
                                    disabled={isReadOnly}
                                />
                            </Stack>
                        </CollapsibleCard>

                        {/* 3. PRICING & INVENTORY (SIMPLE) OR VARIANTS (VARIABLE) */}
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
                                        required
                                        value={simplePrice === 0 ? "" : simplePrice.toLocaleString("vi-VN")}
                                        onChange={(e) => setSimplePrice(Number(e.target.value.replace(/\D/g, "")))}
                                        sx={{ flex: 1, minWidth: '200px' }}
                                        InputProps={{ readOnly: isReadOnly }}
                                    />
                                    <TextField
                                        label="Giá khuyến mãi (VNĐ)"
                                        value={simpleSalePrice === 0 ? "" : simpleSalePrice.toLocaleString("vi-VN")}
                                        onChange={(e) => setSimpleSalePrice(Number(e.target.value.replace(/\D/g, "")))}
                                        sx={{ flex: 1, minWidth: '200px' }}
                                        InputProps={{ readOnly: isReadOnly }}
                                        helperText={!isReadOnly && "Nhập 0 nếu không có giảm giá"}
                                    />
                                    <TextField
                                        label="Số lượng tồn kho"
                                        required
                                        value={simpleStock === 0 ? "" : simpleStock.toLocaleString("vi-VN")}
                                        onChange={(e) => setSimpleStock(Number(e.target.value.replace(/\D/g, "")))}
                                        sx={{ flex: 1, minWidth: '200px' }}
                                        InputProps={{ readOnly: isReadOnly }}
                                    />
                                    <TextField
                                        label="Trọng lượng (gram)"
                                        value={simpleWeight === 0 ? "" : simpleWeight.toLocaleString("vi-VN")}
                                        onChange={(e) => setSimpleWeight(Number(e.target.value.replace(/\D/g, "")))}
                                        sx={{ flex: 1, minWidth: '200px' }}
                                        InputProps={{ readOnly: isReadOnly }}
                                    />
                                    <FormControl sx={{ flex: 1, minWidth: '200px' }}>
                                        <InputLabel>Đơn vị</InputLabel>
                                        <Select
                                            value={simpleUnit}
                                            label="Đơn vị"
                                            onChange={(e) => setSimpleUnit(e.target.value)}
                                            disabled={isReadOnly}
                                        >
                                            {salesUnitOptions.map((opt) => (
                                                <MenuItem key={opt.code} value={opt.code}>{opt.label}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Stack>
                            </CollapsibleCard>
                        ) : (
                            <ProductVariants
                                expanded={expandedVariants}
                                onToggle={toggle(setExpandedVariants)}
                                variants={variants}
                                onVariantsChange={setVariants}
                                availableImages={files}
                                readOnly={isReadOnly}
                            />
                        )}

                        {/* 4. ATTRIBUTES / CATEGORIES / TAGS */}
                        <CollapsibleCard
                            title="Tổ chức"
                            subheader="Phân loại, Độ tuổi và Gắn thẻ"
                            expanded={expandedExtra}
                            onToggle={toggle(setExpandedExtra)}
                        >
                            <Stack p="24px" gap="24px">
                                <FormControl fullWidth>
                                    <InputLabel>Độ tuổi</InputLabel>
                                    <Select
                                        multiple
                                        value={selectedAgeIds}
                                        onChange={handleChangeAge}
                                        input={<OutlinedInput label="Độ tuổi" />}
                                        disabled={isReadOnly}
                                        renderValue={(selected) => {
                                            const names = selected.map(id => {
                                                const age = ageRanges.find((a: any) => (a.id || a.ageRangeId) === id);
                                                return age?.name || id;
                                            });
                                            return names.join(', ');
                                        }}
                                    >
                                        {ageRanges.map((age: any) => (
                                            <MenuItem key={age.id || age.ageRangeId} value={age.id || age.ageRangeId}>
                                                {AGE_RANGE_LABELS[age.name] || age.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                    <Box sx={{ flex: 1 }}>
                                        <CategoryMultiTreeSelect
                                            categories={productCategories}
                                            selectedIds={selectedCategoryIds}
                                            onChange={setSelectedCategoryIds}
                                            disabled={isReadOnly}
                                        />
                                    </Box>
                                    {!isReadOnly && (
                                        <IconButton onClick={() => setOpenQuickCategory(true)} sx={{ bgcolor: "#F4F6F8", borderRadius: "8px", width: 40, height: 40, mt: 0.5 }}>
                                            <PlusIcon size={20} />
                                        </IconButton>
                                    )}
                                </Stack>

                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                    <Autocomplete
                                        fullWidth
                                        multiple
                                        options={tagOptions}
                                        getOptionLabel={(option) => option.name || ""}
                                        value={selectedTags}
                                        onChange={(_, val) => !isReadOnly && setSelectedTags(val)}
                                        readOnly={isReadOnly}
                                        renderInput={(params) => <TextField {...params} label="Gắn thẻ (Tags)" />}
                                        renderTags={(value, getTagProps) =>
                                            value.map((option, index) => {
                                                const { key, ...chipProps } = getTagProps({ index });
                                                return (
                                                    <Chip
                                                        key={key}
                                                        {...chipProps}
                                                        label={option.name}
                                                        size="small"
                                                        sx={{ bgcolor: `${option.color || '#00B8D9'}22`, color: option.color || '#00B8D9', fontWeight: 700 }}
                                                    />
                                                );
                                            })
                                        }
                                    />
                                    {!isReadOnly && (
                                        <IconButton onClick={() => setOpenQuickTag(true)} sx={{ bgcolor: "#F4F6F8", borderRadius: "8px", width: 40, height: 40, mt: 0.5 }}>
                                            <PlusIcon size={20} />
                                        </IconButton>
                                    )}
                                </Stack>
                            </Stack>
                        </CollapsibleCard>

                    </Stack>
                </form>

                <QuickCreateDialog open={openQuickBrand} onClose={() => setOpenQuickBrand(false)} type="brand" onSave={handleSaveBrand} />
                <QuickCreateDialog open={openQuickCategory} onClose={() => setOpenQuickCategory(false)} type="category" onSave={handleSaveCategory} />
                <QuickCreateDialog open={editingTag !== null || openQuickTag} onClose={() => { setOpenQuickTag(false); setEditingTag(null); }} type="tag" onSave={handleSaveTag} editingData={editingTag} />
            </ThemeProvider>
        </>
    );
};
