import { Autocomplete, Box, createTheme, FormControl, InputLabel, MenuItem, OutlinedInput, Select, SelectChangeEvent, Stack, TextField, ThemeProvider, useTheme, Button } from "@mui/material"
import { useTranslation } from "react-i18next";
import { useProductTags, useProductAgeRanges, useCountries, useBrands, useCreateProduct } from "./hooks/useProduct";
import { Breadcrumb } from "../../components/ui/Breadcrumb"
import { Title } from "../../components/ui/Title"
import { useState } from "react"
import { Tiptap } from "../../components/layouts/titap/Tiptap"
import { UploadFiles } from "../../components/ui/UploadFiles"
import { CollapsibleCard } from "../../components/ui/CollapsibleCard"
import { prefixAdmin } from "../../constants/routes";
import { CategoryMultiTreeSelect } from "../../components/ui/CategoryMultiTreeSelect";
import { useNestedProductCategories } from "../product-category/hooks/useProductCategory";
import { ProductVariants } from "./components/ProductVariants";
import { useProductAttributes } from "../product-attribute/hooks/useProductAttribute";
import { toast } from "react-toastify";



interface CustomFile extends File {
    preview: string;
}

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
    const [variants, setVariants] = useState<any[]>([]);

    // Attributes (for lookup)
    const { data: allAttributes = [] } = useProductAttributes();

    const createProductMutation = useCreateProduct();

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

        const form = document.querySelector('form');
        if (form) {
            form.reset();
        }

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const payload = {
            name: formData.get('name') as string,
            barcode: formData.get('sku') as string,
            description: "Mô tả sản phẩm",
            content: "Nội dung chi tiết",
            origin: origin,
            material: formData.get('material') as string,
            petTypes: ["DOG"],
            brandId: Number(brandId),
            status: "IN_STOCK",
            categoryIds: selectedCategoryIds,
            tagIds: selectedTags.map((tag: any) => tag.id),
            ageRangeIds: selectedAgeIds,
            attributeIds: [],
            images: files.map(f => ({ imageUrl: f.preview })),

            variants: variants.map(v => ({
                price: Number(v.price),
                salePrice: Number(v.price), // Default to price
                stockQuantity: Number(v.stock),
                unit: "PIECE",
                attributeValueIds: []
            }))
        };
        const getAttributeDetail = (name: string, value: string) => {
            const attr = allAttributes.find((a: any) => a.name === name);
            const val = attr.values?.find((v: any) => v.value === value);
            return {
                attributeId: attr.attributeId || attr.id,
                valueId: val.valueId || val.id || val.attributeValueId
            };
        };

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

        // Refined Payload based on User JSON
        const finalPayload = {
            name: payload.name,
            barcode: payload.barcode || "BARCODE-" + Date.now(),
            description: payload.description,
            origin: payload.origin,
            material: payload.material,
            petTypes: ["DOG"],
            brandId: Number(payload.brandId),
            status: "IN_STOCK",
            categoryIds: payload.categoryIds,
            // Try multiple property names for ID
            tagIds: selectedTags.map((tag: any) => tag.id || tag.tagId || tag.productTagId).filter(Boolean),
            ageRangeIds: payload.ageRangeIds,
            // Use locally derived attributeIds
            attributeIds: Array.from(usedAttributeIds),
            images: files.map(f => ({ imageUrl: typeof f === 'string' ? f : (f.preview || "") })),
            variants: variants.map((v) => {
                // Use lookup to get IDs
                const attributeValueIds = v.attributes.map((a: any) => {
                    if (!a.id) {
                        const detail = getAttributeDetail(a.name, a.value);
                        return detail?.valueId;
                    }
                    return a.id;
                }).filter((id: any) => !!id);

                console.log(`   🎯 Final attributeValueIds:`, attributeValueIds);

                return {
                    price: Number(v.originalPrice),  // Giá gốc (giá cũ)
                    salePrice: Number(v.price),      // Giá khuyến mãi (giá mới)
                    stockQuantity: Number(v.stock),
                    unit: "PIECE",
                    attributeValueIds: attributeValueIds  // Dùng valueId động từ API
                };
            })
        };

        console.log('Final Payload:', finalPayload);

        createProductMutation.mutate(finalPayload, {
            onSuccess: (response) => {
                if (response.success) {
                    toast.success(response.message || "Tạo sản phẩm thành công!");
                    resetForm();
                } else {
                    toast.error(response.message);
                }
            },
            onError: () => {
                toast.error("Có lỗi xảy ra khi tạo sản phẩm");
            }
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

    const [status, setStatus] = useState<string>("draft");

    const handleChangeStatus = (event: SelectChangeEvent) => {
        setStatus(event.target.value as string);
    };

    const handleChangeAge = (event: SelectChangeEvent<number[]>) => {
        const value = event.target.value;
        setSelectedAgeIds(typeof value === 'string' ? value.split(',').map(Number) : value);
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
                        <CollapsibleCard
                            title={t('admin.common.details')}
                            subheader={t('admin.common.description')}
                            expanded={expandedDetail}
                            onToggle={toggle(setExpandedDetail)}
                        >
                            <Stack p="24px" gap="24px">
                                <TextField label={t('admin.product.fields.name')} name="name" fullWidth />

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
                                        MenuProps={{
                                            PaperProps: {
                                                style: {
                                                    maxHeight: 300,
                                                },
                                            },
                                        }}
                                    >
                                        {countries.map((country: any) => (
                                            <MenuItem key={country.code} value={country.code} sx={{ fontSize: '1.4rem' }}>
                                                {country.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField label="Nguyên vật liệu" name="material" multiline rows={4} fullWidth />
                                <Tiptap />
                                <UploadFiles
                                    files={files}
                                    onFilesChange={(newFiles) => setFiles(newFiles)}
                                />
                            </Stack>
                        </CollapsibleCard>

                        <ProductVariants
                            expanded={expandedVariants}
                            onToggle={toggle(setExpandedVariants)}
                            variants={variants}
                            onVariantsChange={setVariants}
                        />

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
                                    <TextField label={t('admin.product.fields.sku')} name="sku" />
                                    <FormControl>
                                        <InputLabel
                                            id="status-select-label"
                                            sx={{
                                                color: "#637381",
                                                fontWeight: "600"
                                            }}
                                        >
                                            {t('admin.common.status')}
                                        </InputLabel>
                                        <Select
                                            labelId="status-select-label"
                                            value={status}
                                            input={<OutlinedInput label={t('admin.common.status')} />}
                                            onChange={handleChangeStatus}
                                        >
                                            <MenuItem value="draft">{t('admin.product.status.draft')}</MenuItem>
                                            <MenuItem value="active">{t('admin.product.status.active')}</MenuItem>
                                            <MenuItem value="inactive">{t('admin.product.status.inactive')}</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <TextField label={t('admin.common.position')} name="position" />
                                    <FormControl>
                                        <InputLabel
                                            id="age-select-label"
                                        >
                                            Độ tuổi
                                        </InputLabel>
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
                </form>
            </ThemeProvider>

        </>
    )
}