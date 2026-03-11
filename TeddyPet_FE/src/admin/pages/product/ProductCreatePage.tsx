import { Autocomplete, Box, createTheme, FormControl, InputLabel, MenuItem, OutlinedInput, Select, SelectChangeEvent, Stack, TextField, ThemeProvider, useTheme, Button, Accordion, AccordionSummary, AccordionDetails, Typography, InputAdornment, IconButton, Tooltip, Chip } from "@mui/material"
import { ChevronDown as ExpandMoreIcon, RotateCw as RefreshCwIcon, Plus as PlusIcon, Edit2 as EditIcon, Trash2 as TrashIcon } from "lucide-react";
import { autoGenerateSEO, generateBarcode, generateSKU } from "./utils/product-helper";
import { useTranslation } from "react-i18next";
import { useProductTags, useProductAgeRanges, useCountries, useBrands, useCreateProduct, usePetTypes, useSalesUnits, useProductStatuses, useProductTypes, useCreateProductTag, useUpdateProductTag, useDeleteProductTag } from "./hooks/useProduct";
import { useCreateBrand } from "../brand/hooks/useBrand";
import { useCreateProductCategory } from "../product-category/hooks/useProductCategory";
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
import { ProductVariant as Variant } from "../../../types/products.type";
import { CustomFile } from "../../../types/common.type";
import { QuickCreateDialog } from "./components/QuickCreateDialog";

const PET_TYPE_LABELS: Record<string, string> = {
    "DOG": "Chó",
    "CAT": "Mèo",
    "OTHER": "Khác"
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
    "SIMPLE": "Sản phẩm đơn (Simple)",
    "VARIABLE": "Sản phẩm biến thể (Variable)"
};

const PRODUCT_STATUS_LABELS: Record<string, string> = {
    "DRAFT": "Nháp (Draft)",
    "ACTIVE": "Hoạt động (Active)",
    "HIDDEN": "Ẩn (Hidden)"
};

export const ProductCreatePage = () => {
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
    const [petTypes, setPetTypes] = useState<string[]>(["DOG"]);

    // SEO States
    const [metaTitle, setMetaTitle] = useState("");
    const [metaDescription, setMetaDescription] = useState("");

    // Weight & Unit (for Simple Product)
    const [simpleWeight, setSimpleWeight] = useState<number>(0);
    const [simpleUnit, setSimpleUnit] = useState<string>("PIECE");

    const { data: petTypeOptions = [] } = usePetTypes();
    const { data: salesUnitOptions = [] } = useSalesUnits();
    const { data: productStatusOptions = [] } = useProductStatuses();
    const { data: productTypeOptions = [] } = useProductTypes();

    const [barcode, setBarcode] = useState("");

    const [openQuickBrand, setOpenQuickBrand] = useState(false);
    const [openQuickCategory, setOpenQuickCategory] = useState(false);
    const [openQuickTag, setOpenQuickTag] = useState(false);

    const createProductMutation = useCreateProduct();
    const createBrandMutation = useCreateBrand();
    const createCategoryMutation = useCreateProductCategory();
    const createTagMutation = useCreateProductTag();
    const updateTagMutation = useUpdateProductTag();
    const deleteTagMutation = useDeleteProductTag();

    const [editingTag, setEditingTag] = useState<any>(null);

    useEffect(() => {
        // No longer pre-populating with test images.
        setFiles([]);
    }, []);

    // Function to reset all form states
    const resetForm = () => {
        setSelectedTags([]);
        setSelectedCategoryIds([]);
        setSelectedAgeIds([]);
        setFiles([]);
        setOrigin("");
        setBrandId('');
        setVariants([]);
        setStatus("draft");
        setPetTypes(["DOG"]);
        setMetaTitle("");
        setMetaDescription("");
        setSimpleWeight(0);
        setSimpleUnit("PIECE");
        setBarcode("");

        const form = document.querySelector('form');
        if (form) {
            form.reset();
        }

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };


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
            MuiAutocomplete: {
                styleOverrides: {
                    listbox: {
                        padding: 0,
                    },
                    option: {
                        fontSize: '1.4rem',
                        padding: '6px',
                        marginBottom: '4px',
                        borderRadius: '6px',

                    },
                },
            },
        }
    });

    const [productType, setProductType] = useState<"SIMPLE" | "VARIABLE">("SIMPLE");
    const [status, setStatus] = useState<string>("DRAFT");

    // Simple Product State
    const [simplePrice, setSimplePrice] = useState<number>(0);
    const [simpleSalePrice, setSimpleSalePrice] = useState<number>(0);
    const [simpleStock, setSimpleStock] = useState<number>(0);

    const handleChangeStatus = (event: SelectChangeEvent) => {
        setStatus(event.target.value as string);
    };

    const handleChangeAge = (event: SelectChangeEvent<number[]>) => {
        const value = event.target.value;
        setSelectedAgeIds(typeof value === 'string' ? value.split(',').map(Number) : value);
    };

    const handleChangePetTypes = (event: SelectChangeEvent<string[]>) => {
        const value = event.target.value;
        setPetTypes(typeof value === 'string' ? value.split(',') : value);
    };

    const handleSaveBrand = async (data: any) => {
        const res = await createBrandMutation.mutateAsync(data);
        if (res.success) {
            toast.success("Đã thêm thương hiệu mới");
            setBrandId(res.data.id || res.data.brandId);
        }
    };

    const handleSaveCategory = async (data: any) => {
        const res = await createCategoryMutation.mutateAsync(data);
        if (res.success) {
            toast.success("Đã thêm danh mục mới");
            setSelectedCategoryIds(prev => [...prev, res.data.id || res.data.categoryId]);
        }
    };

    const handleSaveTag = async (data: any) => {
        if (editingTag) {
            const res = await updateTagMutation.mutateAsync({ 
                id: editingTag.id || editingTag.tagId, 
                data
            });
            if (res.success) {
                toast.success("Đã cập nhật tag");
                setEditingTag(null);
                setSelectedTags(prev => prev.map(t => (t.id || t.tagId) === (res.data.id || res.data.tagId) ? res.data : t));
            }
        } else {
            const res = await createTagMutation.mutateAsync(data);
            if (res.success) {
                toast.success("Đã thêm tag mới");
                setSelectedTags(prev => [...prev, res.data]);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;

        // Basic validation for DRAFT
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

        const payload = {
            name: formData.get('name') as string,
            barcode: formData.get('barcode') as string,
            description: description,
            metaTitle: metaTitle,
            metaDescription: metaDescription,
            content: "Nội dung chi tiết",
            origin: origin,
            material: formData.get('material') as string,
            petTypes: petTypes,
            brandId: Number(brandId),
            status: status, // uses the status state containing DRAFT, ACTIVE, HIDDEN
            categoryIds: selectedCategoryIds,
            tagIds: selectedTags.map((tag: any) => tag.id || tag.tagId || tag.productTagId).filter(Boolean),
            ageRangeIds: selectedAgeIds,
            attributeIds: [],
            images: files.map((f, index) => ({
                imageUrl: typeof f === 'string' ? f : (f.preview || ""),
                displayOrder: index,
                altText: ""
            })),
            variants: [] as any[]
        };

        const getAttributeDetail = (name: string, value: string) => {
            const attr = allAttributes.find((a: any) => a.name === name);
            const val = attr.values?.find((v: any) => v.value === value);
            return {
                attributeId: attr.attributeId || attr.id,
                valueId: val.valueId || val.id || val.attributeValueId
            };
        };

        let variantsPayload: any[] = [];
        let attributeIdsPayload: number[] = [];

        if (productType === "SIMPLE") {
            // Create Single Default Variant
            const finalSku = generateSKU(payload.name);
            variantsPayload = [{
                name: "Default",
                price: Number(simplePrice),
                salePrice: (Number(simpleSalePrice) > 0 && Number(simpleSalePrice) < Number(simplePrice)) ? Number(simpleSalePrice) : null,
                stockQuantity: Number(simpleStock),
                sku: finalSku,
                weight: Number(simpleWeight),
                unit: simpleUnit,
                status: status,
                attributeValueIds: []
            }];
            attributeIdsPayload = [];
        } else {
            // Determine used attribute IDs
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
                    price: Number(v.originalPrice),
                    salePrice: (Number(v.price) > 0 && Number(v.price) < Number(v.originalPrice)) ? Number(v.price) : null,
                    stockQuantity: Number(v.stock),
                    sku: v.sku || generateSKU(payload.name, v.attributes),
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
            const autoSEO = autoGenerateSEO(payload.name, description);
            if (!finalMetaTitle) finalMetaTitle = autoSEO.title;
            if (!finalMetaDescription) finalMetaDescription = autoSEO.description;
        }

        // Refined Payload based on User JSON
        const finalPayload = {
            name: payload.name,
            barcode: payload.barcode || "BARCODE-" + Date.now(),
            description: payload.description,
            metaTitle: finalMetaTitle,
            metaDescription: finalMetaDescription,
            origin: payload.origin,
            material: payload.material,
            petTypes: payload.petTypes,
            brandId: Number(payload.brandId),
            status: payload.status,
            productType: productType,
            categoryIds: payload.categoryIds,
            tagIds: payload.tagIds,
            ageRangeIds: payload.ageRangeIds,
            attributeIds: attributeIdsPayload,
            images: payload.images,
            variants: variantsPayload,
            position: 0 // Default position
        };

        createProductMutation.mutate(finalPayload, {
            onSuccess: (response) => {
                if (response.success) {
                    toast.success(response.message || "Tạo sản phẩm thành công!");
                    resetForm();
                } else {
                    toast.error(response.message);
                }
            },
            onError: (error: any) => {
                toast.error(error.message || "Có lỗi xảy ra khi tạo sản phẩm");
            }
        });
    };

    return (
        <>
            <div className="mb-[40px] gap-[16px] flex items-start justify-end">
                <div className="mr-auto">
                    <Title title={t('admin.product.title.create')} />
                    <Breadcrumb
                        items={[
                            { label: t('admin.dashboard'), to: "/" },
                            { label: t('admin.product.title.list'), to: `/${prefixAdmin}/product/list` },
                            { label: t('admin.common.create') }
                        ]}
                    />
                </div>
            </div>
            <ThemeProvider theme={localTheme}>
                <form onSubmit={handleSubmit}>
                    <Stack sx={{
                        margin: "0px 120px",
                        gap: "40px"
                    }}>
                        {/* Product Type Selection */}
                        <CollapsibleCard title="Loại sản phẩm" expanded={true} onToggle={() => { }}>
                            <Stack p="24px">
                                <FormControl fullWidth>
                                    <InputLabel id="product-type-label">Loại sản phẩm</InputLabel>
                                    <Select
                                        labelId="product-type-label"
                                        value={productType}
                                        label="Loại sản phẩm"
                                        onChange={(e) => setProductType(e.target.value as any)}
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

                        <CollapsibleCard
                            title={t('admin.common.details')}
                            subheader={t('admin.common.description')}
                            expanded={expandedDetail}
                            onToggle={toggle(setExpandedDetail)}
                        >
                            <Stack p="24px" gap="24px">
                                <Stack direction="row" gap={2}>
                                    <TextField label={t('admin.product.fields.name')} name="name" fullWidth required sx={{ flex: 2 }} />
                                    <TextField
                                        label="Mã vạch (Barcode)"
                                        name="barcode"
                                        placeholder="Mã vạch (Barcode)"
                                        sx={{ flex: 1 }}
                                        value={barcode}
                                        onChange={(e) => setBarcode(e.target.value)}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <Tooltip title="Tạo mã vạch ngẫu nhiên">
                                                        <IconButton
                                                            onClick={() => setBarcode(generateBarcode())}
                                                            edge="end"
                                                            color="primary"
                                                        >
                                                            <RefreshCwIcon size={20} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                    <FormControl sx={{ flex: 1 }}>
                                        <InputLabel id="status-select-label">Trạng thái</InputLabel>
                                        <Select
                                            labelId="status-select-label"
                                            value={status}
                                            label="Trạng thái"
                                            onChange={handleChangeStatus}
                                        >
                                            {productStatusOptions.map((s) => (
                                                <MenuItem key={s} value={s}>
                                                    {PRODUCT_STATUS_LABELS[s] || s}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Stack>
                                <Stack direction="row" gap={2}>
                                    <Stack direction="row" gap={1} sx={{ flex: 1 }}>
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
                                        <Tooltip title="Thêm thương hiệu mới">
                                            <IconButton 
                                                onClick={() => setOpenQuickBrand(true)}
                                                sx={{ bgcolor: "#F4F6F8", borderRadius: "8px", width: 48, height: 48 }}
                                            >
                                                <PlusIcon size={20} />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>

                                    <FormControl fullWidth sx={{ flex: 1 }}>
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

                                <Stack direction="row" gap={2}>
                                    <FormControl fullWidth>
                                        <InputLabel id="pet-type-label">Dành cho giống (Species)</InputLabel>
                                        <Select
                                            labelId="pet-type-label"
                                            multiple
                                            value={petTypes}
                                            onChange={handleChangePetTypes}
                                            input={<OutlinedInput label="Dành cho giống (Species)" />}
                                            renderValue={(selected) => selected.map(val => PET_TYPE_LABELS[val] || val).join(', ')}
                                        >
                                            {petTypeOptions.map((type) => (
                                                <MenuItem key={type} value={type}>
                                                    {PET_TYPE_LABELS[type] || type}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <TextField label="Nguyên vật liệu" name="material" fullWidth />
                                </Stack>

                                <Tiptap value={description} onChange={setDescription} />
                                <UploadFiles
                                    files={files}
                                    onFilesChange={(newFiles) => setFiles(newFiles)}
                                    folder="products"
                                />
                            </Stack>
                        </CollapsibleCard>

                        {/* Conditional Rendering: Simple vs Variable */}
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
                                        helperText={simpleSalePrice === 0 ? "Nhập 0 nếu không có khuyến mãi" : ""}
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
                                        label="Trọng lượng (gram)"
                                        type="number"
                                        fullWidth
                                        value={simpleWeight}
                                        onChange={(e) => setSimpleWeight(Number(e.target.value))}
                                        sx={{ flex: 1, minWidth: '200px' }}
                                    />
                                    <FormControl sx={{ flex: 1, minWidth: '200px' }}>
                                        <InputLabel id="unit-label">Đơn vị</InputLabel>
                                        <Select
                                            labelId="unit-label"
                                            value={simpleUnit}
                                            label="Đơn vị"
                                            onChange={(e) => setSimpleUnit(e.target.value)}
                                        >
                                            {salesUnitOptions.map((option) => (
                                                <MenuItem key={option.code} value={option.code}>
                                                    {option.label}
                                                </MenuItem>
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
                                    <FormControl fullWidth sx={{ gridColumn: "span 2" }}>
                                        <InputLabel id="age-select-label">Độ tuổi</InputLabel>
                                        <Select
                                            labelId="age-select-label"
                                            multiple
                                            value={selectedAgeIds}
                                            onChange={handleChangeAge}
                                            input={<OutlinedInput label="Độ tuổi" />}
                                            renderValue={(selected) => {
                                                if (selected.length === 0) return "";
                                                const names = selected.map(id => {
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
                                                        {AGE_RANGE_LABELS[age.name] || age.name || age.label}
                                                    </MenuItem>
                                                );
                                            })}
                                        </Select>
                                    </FormControl>
                                </Box>
                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                    <Box sx={{ flex: 1 }}>
                                        <CategoryMultiTreeSelect
                                            categories={productCategories}
                                            selectedIds={selectedCategoryIds}
                                            onChange={(ids) => setSelectedCategoryIds(ids)}
                                        />
                                    </Box>
                                    <Tooltip title="Thêm danh mục mới">
                                        <IconButton 
                                            onClick={() => setOpenQuickCategory(true)}
                                            sx={{ bgcolor: "#F4F6F8", borderRadius: "8px", width: 40, height: 40, mt: 0.5 }}
                                        >
                                            <PlusIcon size={20} />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                    <Box sx={{ flex: 1 }}>
                                        <Autocomplete
                                            multiple
                                            options={tagOptions}
                                            getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                                            value={selectedTags}
                                            onChange={(_event, newValue) => {
                                                setSelectedTags(newValue);
                                            }}
                                            filterSelectedOptions
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label={t('admin.product.fields.tags')}
                                                    placeholder={t('admin.product.fields.tags_placeholder')}
                                                />
                                            )}
                                            renderTags={(value, getTagProps) =>
                                                value.map((option, index) => {
                                                    const { key, ...chipProps } = getTagProps({ index });
                                                    return (
                                                        <Box key={key || option.id || option.tagId} sx={{ p: 0.5 }}>
                                                            <Chip
                                                                {...chipProps}
                                                                label={option.name}
                                                                sx={{
                                                                    bgcolor: `${option.color || '#00B8D9'}22`,
                                                                    color: option.color || '#00B8D9',
                                                                    fontSize: "1.30rem",
                                                                    height: "24px",
                                                                    borderRadius: "8px",
                                                                    fontWeight: "700",
                                                                    border: `1px solid ${option.color || '#00B8D9'}44`,
                                                                    '& .MuiChip-deleteIcon': { 
                                                                        fontSize: 16, 
                                                                        color: 'inherit',
                                                                        '&:hover': { color: option.color }
                                                                    }
                                                                }}
                                                            />
                                                        </Box>
                                                    );
                                                })
                                            }
                                            renderOption={(props, option) => (
                                                <li {...props} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px' }}>
                                                    <Typography sx={{ fontSize: '1.4rem' }}>{option.name}</Typography>
                                                    <Stack direction="row" spacing={1}>
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingTag(option);
                                                            }}
                                                        >
                                                            <EditIcon size={14} />
                                                        </IconButton>
                                                        <IconButton 
                                                            size="small" 
                                                            color="error"
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (window.confirm(`Bạn có chắc muốn xóa tag "${option.name}"?`)) {
                                                                    await deleteTagMutation.mutateAsync(option.id || option.tagId);
                                                                    toast.success("Đã xóa tag");
                                                                }
                                                            }}
                                                        >
                                                            <TrashIcon size={14} />
                                                        </IconButton>
                                                    </Stack>
                                                </li>
                                            )}
                                            sx={{
                                                '& .MuiAutocomplete-clearIndicator': {
                                                    color: "#637381",
                                                    fontSize: "2.4rem",
                                                    '& .MuiSvgIcon-root': {
                                                        fontSize: '1.8rem',
                                                    },
                                                },
                                                '& .MuiFormLabel-root': {
                                                    color: "#919EAB",
                                                    fontWeight: "400",
                                                    '&.Mui-focused, &.MuiFormLabel-filled': {
                                                        color: selectedTags.length > 0 || expandedDetail ? "#FF5630" : "#1C252E",
                                                        fontWeight: "600",
                                                    },
                                                },

                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: "#919eab33 !important",
                                                    borderWidth: "1px !important",
                                                    transition: 'border-color 0.2s',
                                                },

                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: "#FF5630 !important",
                                                    borderWidth: "2px !important",
                                                },


                                                "& .MuiChip-root": {
                                                    backgroundColor: "rgba(0, 184, 217, 0.16)",
                                                    color: "#006C9C",
                                                    fontSize: "1.3rem",
                                                    height: "24px",
                                                    borderRadius: "8px",
                                                },

                                                '& .MuiChip-label': {
                                                    paddingLeft: "8px",
                                                    paddingRight: "8px",
                                                    fontWeight: "600"
                                                },

                                                "& .MuiChip-deleteIcon": {
                                                    color: "rgb(0, 108, 156)",
                                                    opacity: "0.48",
                                                    fontSize: "1.5rem",
                                                    marginRight: "4px",
                                                    marginLeft: "-4px"
                                                },

                                                "& .MuiChip-deleteIcon:hover": {
                                                    color: "rgb(0, 108, 156)",
                                                    opacity: "0.8"
                                                },
                                            }}
                                        />
                                    </Box>
                                    <Tooltip title="Thêm tag mới">
                                        <IconButton 
                                            onClick={() => {
                                                setEditingTag(null);
                                                setOpenQuickCategory(false); // Close others
                                                setOpenQuickBrand(false);
                                                // Using the same dialog logic but for tags
                                                setOpenQuickCategory(false); 
                                                // I should add a state for openQuickTag
                                                setOpenQuickTag(true);
                                            }}
                                            sx={{ bgcolor: "#F4F6F8", borderRadius: "8px", width: 48, height: 48 }}
                                        >
                                            <PlusIcon size={20} />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>

                            </Stack>
                        </CollapsibleCard>

                        {/* SEO Section */}
                        <Accordion sx={{ 
                            boxShadow: "0 0 2px 0 #919eab33, 0 12px 24px -4px #919eab1f",
                            borderRadius: "16px !important",
                            overflow: "hidden",
                            "&:before": { display: "none" }
                        }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon size={24} />}>
                                <Stack>
                                    <Typography sx={{ fontSize: "1.6rem", fontWeight: 600 }}>Cài đặt SEO nâng cao</Typography>
                                    <Typography sx={{ fontSize: "1.3rem", color: "text.secondary" }}>Hệ thống tự động lo SEO nếu bạn để trống</Typography>
                                </Stack>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: "24px", pt: 0 }}>
                                <Stack gap="24px">
                                    <TextField
                                        label="Thẻ tiêu đề (Meta Title)"
                                        placeholder="Để trống để lấy Tên sản phẩm làm mặc định"
                                        fullWidth
                                        value={metaTitle}
                                        onChange={(e) => setMetaTitle(e.target.value)}
                                        helperText={`${metaTitle.length}/70 ký tự`}
                                    />
                                    <TextField
                                        label="Thẻ mô tả (Meta Description)"
                                        placeholder="Để trống để tự động cắt từ Mô tả sản phẩm"
                                        multiline
                                        rows={3}
                                        fullWidth
                                        value={metaDescription}
                                        onChange={(e) => setMetaDescription(e.target.value)}
                                        helperText={`${metaDescription.length}/160 ký tự`}
                                    />
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

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
                                    "&:hover": {
                                        background: "#454F5B",
                                    }
                                }}
                            >
                                {t('admin.product.title.create')}
                            </Button>
                        </Box>
                    </Stack>
                </form >
            </ThemeProvider >

            <QuickCreateDialog
                open={openQuickBrand}
                onClose={() => setOpenQuickBrand(false)}
                title="Thêm thương hiệu mới"
                fields={[
                    { key: 'name', label: 'Tên thương hiệu', required: true },
                    { key: 'description', label: 'Mô tả', type: 'multiline' },
                    { key: 'websiteUrl', label: 'Website URL' }
                ]}
                onSave={handleSaveBrand}
            />

            <QuickCreateDialog
                open={openQuickCategory}
                onClose={() => setOpenQuickCategory(false)}
                title="Thêm danh mục mới"
                fields={[
                    { key: 'name', label: 'Tên danh mục', required: true },
                    { key: 'description', label: 'Mô tả', type: 'multiline' }
                ]}
                onSave={handleSaveCategory}
            />

            <QuickCreateDialog
                open={openQuickTag || !!editingTag}
                onClose={() => {
                    setOpenQuickTag(false);
                    setEditingTag(null);
                }}
                title={editingTag ? "Chỉnh sửa tag" : "Thêm tag mới"}
                fields={[
                    { key: 'name', label: 'Tên tag', required: true },
                    { key: 'description', label: 'Mô tả (Dịch tiếng Việt)', type: 'multiline' },
                    { key: 'color', label: 'Màu sắc (Hex)', type: 'color', placeholder: '#000000' }
                ]}
                initialData={editingTag ? {
                    name: editingTag.name,
                    description: editingTag.description,
                    color: editingTag.color
                } : { color: '#00B8D9' }}
                onSave={handleSaveTag}
                saveLabel={editingTag ? "Cập nhật" : "Tạo mới"}
            />
        </>
    )
}