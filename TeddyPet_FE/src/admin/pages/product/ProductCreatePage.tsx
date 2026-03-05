import { Autocomplete, Box, createTheme, FormControl, InputLabel, MenuItem, OutlinedInput, Select, SelectChangeEvent, Stack, TextField, ThemeProvider, useTheme, Button } from "@mui/material"
import { useTranslation } from "react-i18next";
import { useProductTags, useProductAgeRanges, useCountries, useBrands, useCreateProduct, usePetTypes, useSalesUnits, useProductStatuses, useProductTypes } from "./hooks/useProduct";
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

const PET_TYPE_LABELS: Record<string, string> = {
    "DOG": "Chó",
    "CAT": "Mèo",
    "OTHER": "Khác"
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

    const createProductMutation = useCreateProduct();

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
    const [simpleSku, setSimpleSku] = useState<string>("");

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

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

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
            variantsPayload = [{
                name: "Default",
                price: Number(simplePrice),
                salePrice: (Number(simpleSalePrice) > 0 && Number(simpleSalePrice) < Number(simplePrice)) ? Number(simpleSalePrice) : null,
                stockQuantity: Number(simpleStock),
                sku: simpleSku || undefined,
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
                    unit: v.unit || "PIECE",
                    weight: Number(v.weight) || 0,
                    featuredImageUrl: v.featuredImage,
                    status: v.status || "ACTIVE",
                    attributeValueIds: attributeValueIds
                };
            });
        }

        // Refined Payload based on User JSON
        const finalPayload = {
            name: payload.name,
            barcode: payload.barcode || "BARCODE-" + Date.now(),
            description: payload.description,
            metaTitle: payload.metaTitle,
            metaDescription: payload.metaDescription,
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
            variants: variantsPayload
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
                                <TextField label={t('admin.product.fields.name')} name="name" fullWidth required />
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
                                        label="SKU (Mã kho)"
                                        name="sku" // Optional override
                                        fullWidth
                                        value={simpleSku}
                                        onChange={(e) => setSimpleSku(e.target.value)}
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
                                    <TextField label={t('admin.product.fields.sku')} name="barcode" placeholder="Mã vạch (Barcode)" />
                                    <FormControl>
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
                                    onChange={(_event, newValue) => {
                                        // This page seems to be using local state for now, not react-hook-form managed fully?
                                        // Keeping consistent with existing code style in this file
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

                            </Stack>
                        </CollapsibleCard>

                        {/* SEO Section */}
                        <CollapsibleCard
                            title="Tối ưu SEO"
                            subheader="Thiết lập các thẻ Meta giúp sản phẩm dễ dàng xuất hiện trên Google"
                            expanded={true}
                            onToggle={() => { }}
                        >
                            <Stack p="24px" gap="24px">
                                <TextField
                                    label="Thẻ tiêu đề (Meta Title)"
                                    placeholder="Nên dưới 70 ký tự"
                                    fullWidth
                                    value={metaTitle}
                                    onChange={(e) => setMetaTitle(e.target.value)}
                                    helperText={`${metaTitle.length}/70 ký tự`}
                                />
                                <TextField
                                    label="Thẻ mô tả (Meta Description)"
                                    placeholder="Nên dưới 160 ký tự"
                                    multiline
                                    rows={3}
                                    fullWidth
                                    value={metaDescription}
                                    onChange={(e) => setMetaDescription(e.target.value)}
                                    helperText={`${metaDescription.length}/160 ký tự`}
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

        </>
    )
}