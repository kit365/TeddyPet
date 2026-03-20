import { Autocomplete, Box, createTheme, FormControl, InputLabel, MenuItem, OutlinedInput, Select, SelectChangeEvent, Stack, TextField, ThemeProvider, useTheme, Button, InputAdornment, IconButton, Tooltip, Chip, CircularProgress, Card, CardHeader, Divider } from "@mui/material"
import { RotateCw as RefreshCwIcon, Plus as PlusIcon, Edit2 as EditIcon } from "lucide-react";
import { autoGenerateSEO, generateBarcode, generateSKU } from "./utils/product-helper";
import { useTranslation } from "react-i18next";
import { useProductTags, useProductAgeRanges, useCountries, useBrands, useProductDetail, useUpdateProduct, useCreateProduct, usePetTypes, useProductStatuses, useProductTypes, useCreateProductTag, useUpdateProductTag, useSalesUnits } from "./hooks/useProduct";
import { useCreateBrand } from "../brand/hooks/useBrand";
import { useCreateProductCategory } from "../product-category/hooks/useProductCategory";
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Tiptap } from "../../components/layouts/titap/Tiptap"
import { UploadFiles } from "../../components/ui/UploadFiles"

import { prefixAdmin } from "../../constants/routes";
import { ListHeader } from "../../components/ui/ListHeader";
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
    "DRAFT": "Bản nháp",
    "ACTIVE": "Đang hoạt động",
    "HIDDEN": "Tạm ẩn"
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

const SectionCard = ({ title, subheader, children }: { title: string; subheader?: string; children: React.ReactNode }) => (
    <Card sx={{
        backgroundImage: 'none !important',
        backdropFilter: 'none !important',
        backgroundColor: '#fff !important',
        boxShadow: '0 0 2px 0 #919eab33, 0 12px 24px -4px #919eab1f',
        borderRadius: '16px',
        color: '#1C252E',
    }}>
        <CardHeader
            title={title}
            subheader={subheader}
            slotProps={{
                title: { sx: { fontWeight: 600, fontSize: '1.125rem' } },
                subheader: { sx: { color: '#637381', fontSize: '0.875rem', mt: 0.5 } },
            }}
            sx={{ padding: '24px 24px 0', mb: '24px' }}
        />
        <Divider sx={{ borderColor: '#919eab33' }} />
        {children}
    </Card>
);

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

    const [expandedVariants, setExpandedVariants] = useState(true);
    const toggle = (setter: React.Dispatch<React.SetStateAction<boolean>>) =>
        () => setter(prev => !prev);

    const outerTheme = useTheme();

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
    const [name, setName] = useState<string>("");
    const [material, setMaterial] = useState<string>("");
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

    const [editingTag, setEditingTag] = useState<any>(null);

    const isInitializedRef = useRef<string | null>(null);
    const draftAppliedRef = useRef(false);
    const draftSaveTimerRef = useRef<number | null>(null);

    const getDraftKey = useCallback(() => {
        if (mode === "edit" && id) return `teddypet:admin:productDraft:edit:${id}`;
        return "teddypet:admin:productDraft:create";
    }, [mode, id]);

    const clearDraft = useCallback(() => {
        try {
            localStorage.removeItem(getDraftKey());
        } catch {
            // ignore
        }
    }, [getDraftKey]);

    const buildDraftPayload = useCallback(() => {
        // Do not persist raw File objects (cannot restore after reload).
        const serializableFiles = (files || [])
            .map((f: any) => {
                if (typeof f === "string") return f;
                const preview = f?.preview;
                if (typeof preview === "string" && (preview.startsWith("http://") || preview.startsWith("https://"))) {
                    return { id: f?.id || f?.imageId, name: f?.name, preview };
                }
                return null;
            })
            .filter(Boolean);

        return {
            v: 1,
            mode,
            id: id || null,
            updatedAt: Date.now(),
            data: {
                name,
                barcode,
                status,
                productType,
                petTypes,
                origin,
                brandId,
                selectedCategoryIds,
                selectedTags,
                selectedAgeIds,
                description,
                material,
                metaTitle,
                metaDescription,
                files: serializableFiles,
                simplePrice,
                simpleSalePrice,
                simpleStock,
                simpleSku,
                simpleWeight,
                simpleUnit,
                variants
            }
        };
    }, [
        files,
        mode,
        id,
        name,
        barcode,
        status,
        productType,
        petTypes,
        origin,
        brandId,
        selectedCategoryIds,
        selectedTags,
        selectedAgeIds,
        description,
        material,
        metaTitle,
        metaDescription,
        simplePrice,
        simpleSalePrice,
        simpleStock,
        simpleSku,
        simpleWeight,
        simpleUnit,
        variants
    ]);

    const applyDraftPayload = useCallback((draft: any) => {
        const d = draft?.data;
        if (!d) return;
        if (typeof d.name === "string") setName(d.name);
        if (typeof d.barcode === "string") setBarcode(d.barcode);
        if (typeof d.status === "string") setStatus(d.status);
        if (typeof d.productType === "string") setProductType(d.productType);
        if (Array.isArray(d.petTypes)) setPetTypes(d.petTypes);
        if (typeof d.origin === "string") setOrigin(d.origin);
        if (d.brandId !== undefined) setBrandId(d.brandId);
        if (Array.isArray(d.selectedCategoryIds)) setSelectedCategoryIds(d.selectedCategoryIds);
        if (Array.isArray(d.selectedTags)) setSelectedTags(d.selectedTags);
        if (Array.isArray(d.selectedAgeIds)) setSelectedAgeIds(d.selectedAgeIds);
        if (typeof d.description === "string") setDescription(d.description);
        if (typeof d.material === "string") setMaterial(d.material);
        if (typeof d.metaTitle === "string") setMetaTitle(d.metaTitle);
        if (typeof d.metaDescription === "string") setMetaDescription(d.metaDescription);

        if (Array.isArray(d.files)) {
            const restored = d.files.map((f: any) => {
                if (typeof f === "string") return f;
                if (f?.preview) return { id: f?.id, name: f?.name || "image", preview: f.preview, size: 0, type: "image/jpeg" };
                return null;
            }).filter(Boolean);
            setFiles(restored as any);
        }

        if (typeof d.simplePrice === "number") setSimplePrice(d.simplePrice);
        if (typeof d.simpleSalePrice === "number") setSimpleSalePrice(d.simpleSalePrice);
        if (typeof d.simpleStock === "number") setSimpleStock(d.simpleStock);
        if (typeof d.simpleSku === "string") setSimpleSku(d.simpleSku);
        if (typeof d.simpleWeight === "number") setSimpleWeight(d.simpleWeight);
        if (typeof d.simpleUnit === "string") setSimpleUnit(d.simpleUnit);

        if (Array.isArray(d.variants)) setVariants(d.variants);
    }, []);

    const resetFormStates = useCallback(() => {
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
        setName("");
        setMaterial("");
    }, []);

    // Restore draft once after init for create/edit (so user can jump out to create attributes, then come back)
    // Draft TTL: 15 minutes
    const DRAFT_TTL_MS = 15 * 60 * 1000;

    useEffect(() => {
        if (isReadOnly) return;
        if (draftAppliedRef.current) return;
        if (mode !== "create" && mode !== "edit") return;
        // For edit mode, wait until product data is ready; for create mode, restore immediately.
        if (mode === "edit" && isProductLoading) return;

        try {
            const raw = localStorage.getItem(getDraftKey());
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (!parsed?.data) return;
            // Ensure draft matches current context
            if (mode === "edit" && parsed?.id && parsed.id !== id) return;

            // Auto-expire: if draft is older than 15 minutes, discard it
            const age = Date.now() - (parsed?.updatedAt ?? 0);
            if (age > DRAFT_TTL_MS) {
                localStorage.removeItem(getDraftKey());
                return;
            }

            applyDraftPayload(parsed);
            draftAppliedRef.current = true;
            toast.info("Đã khôi phục bản nháp sản phẩm (draft) từ lần trước.");
        } catch {
            // ignore
        }
    }, [applyDraftPayload, getDraftKey, id, isReadOnly, mode, isProductLoading]);

    // Auto-save draft (debounced)
    useEffect(() => {
        if (isReadOnly) return;
        if (mode !== "create" && mode !== "edit") return;

        if (draftSaveTimerRef.current) {
            window.clearTimeout(draftSaveTimerRef.current);
        }

        draftSaveTimerRef.current = window.setTimeout(() => {
            try {
                const payload = buildDraftPayload();
                localStorage.setItem(getDraftKey(), JSON.stringify(payload));
            } catch {
                // ignore
            }
        }, 600);

        return () => {
            if (draftSaveTimerRef.current) {
                window.clearTimeout(draftSaveTimerRef.current);
                draftSaveTimerRef.current = null;
            }
        };
    }, [buildDraftPayload, getDraftKey, isReadOnly, mode]);

    const populateForm = useCallback((p: any) => {
        if (!p) return;
        const resolvedType: "SIMPLE" | "VARIABLE" =
            (p.productType === "VARIABLE" || p.productType === "SIMPLE")
                ? p.productType
                : (p?.variants?.some((v: any) => (v?.attributes?.length || 0) > 0) ? "VARIABLE" : "SIMPLE");
        setProductType(resolvedType);
        setStatus(p.status || "DRAFT");
        setBarcode(p.barcode || "");

        // Fix Origin mismatch
        let originValue = p.origin || "";
        if (originValue && countries.length > 0) {
            const isCode = countries.some((c: any) => c.code === originValue);
            if (!isCode) {
                const foundCountry = countries.find((c: any) => c?.name?.toLowerCase() === originValue.toLowerCase());
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
        setName(p.name || "");
        setMaterial(p.material || "");
        setMetaTitle(p.metaTitle || "");
        setMetaDescription(p.metaDescription || "");

        const productImages = p.images?.map((img: any) => ({
            id: img.id || img.imageId,
            name: img.alt || img.altText || "image",
            preview: img.imageUrl,
            size: 0,
            type: "image/jpeg"
        })) || [];
        setFiles(productImages);

        if (resolvedType === "SIMPLE" && p?.variants && p.variants.length > 0) {
            const defaultVariant = p.variants[0];
            setSimplePrice(defaultVariant?.price || 0);
            setSimpleSalePrice(defaultVariant?.salePrice || 0);
            setSimpleStock(defaultVariant?.stockQuantity || 0);
            setSimpleSku(defaultVariant?.sku || "");
            setSimpleWeight(defaultVariant?.weight || 0);
            setSimpleUnit(defaultVariant?.unit || "PIECE");
        } else if (resolvedType === "VARIABLE" && p?.variants) {
            const mappedVariants: Variant[] = p.variants.map((v: any) => ({
                id: String(v?.variantId || v?.id || `v-${Math.random()}`),
                variantId: v?.variantId || v?.id,
                attributes: v?.attributes?.map((a: any) => ({
                    name: a?.attributeName,
                    value: a?.value,
                    id: a?.valueId || a?.id
                })) || [],
                sku: v?.sku || "",
                originalPrice: v?.price || 0,
                price: v?.salePrice || v?.price || 0,
                stock: v?.stockQuantity || 0,
                status: v?.status || "ACTIVE",
                featuredImage: v?.featuredImageUrl,
                featuredImageId: v?.featuredImageId,
                active: v?.isActive !== false,
                weight: v?.weight || 0,
                unit: v?.unit || "PIECE"
            }));
            setVariants(mappedVariants);
        }
    }, [countries]);

    // Initialize/Reset form based on mode and product data
    // Use isInitializedRef and stricter dependencies to prevent infinite re-render loop
    useEffect(() => {
        if (!isProductLoading) {
            if (mode === 'create' && isInitializedRef.current !== 'create') {
                isInitializedRef.current = 'create';
                resetFormStates();
            } else if ((mode === 'edit' || mode === 'view') && product && isInitializedRef.current !== `${mode}-${id}`) {
                isInitializedRef.current = `${mode}-${id}`;
                populateForm(product);
            }
        }
    }, [product, mode, id, isProductLoading, populateForm, resetFormStates]);

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

    const formatTagName = (name: string): string => {
        return name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[đĐ]/g, (char) => (char === "đ" ? "d" : "D"))
            .replace(/[^a-zA-Z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-+|-+$/g, "");
    };

    const handleSaveTag = async (data: any) => {
        try {
            const formattedData = {
                ...data,
                name: data.name ? formatTagName(data.name) : data.name
            };

            if (editingTag) {
                const res = await updateTagMutation.mutateAsync({
                    id: editingTag.id || editingTag.tagId,
                    data: formattedData
                });
                if (res?.success === false) return toast.error(res?.message || "Lỗi cập nhật tag");

                toast.success("Đã cập nhật tag");
                setEditingTag(null);
                setSelectedTags(prev => prev.map(t => (t.id || t.tagId) === (res?.data?.id || res?.data?.tagId || res?.id || res?.tagId) ? (res?.data || res) : t));
            } else {
                const res = await createTagMutation.mutateAsync(formattedData);
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
            const unuploadedFiles = files.filter(f => f instanceof File);
            if (unuploadedFiles.length > 0) {
                toast.error(`Có ${unuploadedFiles.length} ảnh chưa được tải lên server (Cloudinary). Vui lòng nhấn nút "Tải lên" trước khi lưu sản phẩm.`);
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
            const attr = allAttributes.find((a: any) => a?.name === name);
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
                variantId: mode === 'edit' && product?.productType === "SIMPLE" && product?.variants?.[0] ? product.variants[0]?.variantId : null,
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
                    const detail = getAttributeDetail(a?.name || "", a?.value || "");
                    if (detail?.attributeId) {
                        usedAttributeIds.add(Number(detail.attributeId));
                    }
                });
            });
            attributeIdsPayload = Array.from(usedAttributeIds);

            variantsPayload = variants.map((v) => {
                const attributeValueIds = v.attributes.map((a: any) => {
                    if (!a.id) {
                        const detail = getAttributeDetail(a?.name || "", a?.value || "");
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
                altText: f?.name || ""
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
                        clearDraft();
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
                onSuccess: (response: any) => {
                    if (response?.success === false) {
                        toast.error(response?.message || "Tạo sản phẩm thất bại");
                    } else {
                        clearDraft();
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
            MuiFormLabel: {
                styleOverrides: {
                    root: {
                        color: "#919EAB",
                        fontSize: "0.875rem",
                        '&.Mui-focused': {
                            color: "#1C252E",
                            fontWeight: "600",
                        }
                    }
                }
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        color: "#1C252E",
                        borderRadius: "12px",
                        fontSize: "0.875rem",
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: "#919eab33",
                            transition: 'border-color 0.2s',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: "#1C252E",
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: "#1C252E",
                            borderWidth: "2px",
                        },
                    },
                    input: {
                        padding: "16.5px 14px",
                    }
                }
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: "10px",
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "0.875rem",
                    }
                }
            }
        }
    });

    const pageTitle = mode === 'create' ? t('admin.product.title.create') : mode === 'edit' ? t('admin.product.title.edit') : product?.name || t('admin.common.details');

    return (
        <>
            <Box sx={{ mb: '40px' }}>
                <ListHeader
                    title={pageTitle}
                    breadcrumbItems={[
                        { label: t('admin.dashboard'), to: "/" },
                        { label: t('admin.product.title.list'), to: `/${prefixAdmin}/product/list` },
                        { label: mode === 'create' ? t('admin.common.create') : mode === 'edit' ? t('admin.common.edit') : t('admin.common.details') }
                    ]}
                    action={mode === 'view' && (
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
                />
            </Box>

            <ThemeProvider theme={localTheme}>
                <form
                    id="product-form"
                    onSubmit={handleSubmit}
                    key={mode === 'create' ? 'create' : (product?.id || 'loading')}
                >
                    <Box sx={{
                        margin: { xs: "0px 20px", lg: "0px 80px" },
                        pb: '100px', /* room for sticky footer */
                        display: 'flex',
                        flexDirection: { xs: 'column', lg: 'row' },
                        gap: '24px',
                        alignItems: 'flex-start',
                    }}>
                        {/* ———————————————— LEFT COLUMN (65%) ———————————————— */}
                        <Box sx={{ flex: '1 1 65%', display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
                            {/* 1. GENERAL DETAILS */}
                            <SectionCard
                                title={t('admin.common.details')}
                                subheader="Thông tin chi tiết"
                            >
                                <Stack p="24px" gap="24px">
                                    <TextField
                                        label={t('admin.product.fields.name')}
                                        name="name"
                                        fullWidth
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        InputProps={{ readOnly: isReadOnly }}
                                    />
                                    <Box>
                                        {!isReadOnly ? (
                                            <Tiptap value={description} onChange={setDescription} />
                                        ) : (
                                            <Box
                                                sx={{ p: 2, border: '1px solid #eee', borderRadius: '12px', minHeight: '100px' }}
                                                dangerouslySetInnerHTML={{ __html: description || "<i>Chưa có mô tả</i>" }}
                                            />
                                        )}
                                    </Box>
                                    <Box>
                                        <UploadFiles
                                            files={files}
                                            onFilesChange={setFiles}
                                            folder="products"
                                            disabled={isReadOnly}
                                        />
                                    </Box>
                                </Stack>
                            </SectionCard>

                            {/* 2. PRICING & INVENTORY (SIMPLE) OR VARIANTS (VARIABLE) */}
                            {productType === "SIMPLE" ? (
                                <SectionCard
                                    title="Giá & Kho hàng"
                                    subheader="Thiết lập giá và số lượng tồn kho"
                                >
                                    <Stack p="24px" spacing={3}>
                                        <Stack direction="row" spacing={2}>
                                            <TextField
                                                label="Giá bán gốc (VNĐ)"
                                                name="simplePrice"
                                                required
                                                fullWidth
                                                value={simplePrice === 0 ? "" : simplePrice.toLocaleString("vi-VN")}
                                                onChange={(e) => setSimplePrice(Number(e.target.value.replace(/\D/g, "")))}
                                                InputProps={{
                                                    readOnly: isReadOnly,
                                                    onWheel: (e) => (e.target as HTMLElement).blur()
                                                }}
                                            />
                                            <TextField
                                                label="Giá khuyến mãi (VNĐ)"
                                                name="simpleSalePrice"
                                                fullWidth
                                                value={simpleSalePrice === 0 ? "" : simpleSalePrice.toLocaleString("vi-VN")}
                                                onChange={(e) => setSimpleSalePrice(Number(e.target.value.replace(/\D/g, "")))}
                                                InputProps={{
                                                    readOnly: isReadOnly,
                                                    onWheel: (e) => (e.target as HTMLElement).blur()
                                                }}
                                                helperText={!isReadOnly && "Nhập 0 nếu không có giảm giá"}
                                            />
                                        </Stack>
                                        <Stack direction="row" spacing={2}>
                                            <TextField
                                                label="Số lượng tồn kho"
                                                name="simpleStock"
                                                required
                                                fullWidth
                                                value={simpleStock === 0 ? "" : simpleStock.toLocaleString("vi-VN")}
                                                onChange={(e) => setSimpleStock(Number(e.target.value.replace(/\D/g, "")))}
                                                InputProps={{
                                                    readOnly: isReadOnly,
                                                    onWheel: (e) => (e.target as HTMLElement).blur()
                                                }}
                                            />
                                            <TextField
                                                label="Mã SKU"
                                                name="simpleSku"
                                                fullWidth
                                                value={simpleSku}
                                                onChange={(e) => setSimpleSku(e.target.value)}
                                                InputProps={{ readOnly: isReadOnly }}
                                            />
                                        </Stack>
                                        <Stack direction="row" spacing={2}>
                                            <TextField
                                                label="Trọng lượng (gram)"
                                                fullWidth
                                                value={simpleWeight === 0 ? "" : simpleWeight.toLocaleString("vi-VN")}
                                                onChange={(e) => setSimpleWeight(Number(e.target.value.replace(/\D/g, "")))}
                                                InputProps={{
                                                    readOnly: isReadOnly,
                                                    onWheel: (e) => (e.target as HTMLElement).blur(),
                                                    endAdornment: <InputAdornment position="end">g</InputAdornment>
                                                }}
                                            />
                                            <FormControl fullWidth>
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
                                    </Stack>
                                </SectionCard>
                            ) : (
                                <>
                                    {!isReadOnly && (
                                        <Box sx={{ mb: 2 }}>
                                            <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                                                <Box>
                                                    <Box sx={{ fontWeight: 800, color: "#1C252E", fontSize: "0.875rem" }}>
                                                        Thiếu thuộc tính?
                                                    </Box>
                                                    <Box sx={{ color: "#637381", fontSize: "0.75rem", fontWeight: 600 }}>
                                                        Bạn có thể mở trang tạo thuộc tính/giá trị trong tab mới. Sản phẩm đang làm dở sẽ được lưu draft tự động.
                                                    </Box>
                                                </Box>
                                                <Stack direction="row" spacing={1}>
                                                    <Button
                                                        variant="outlined"
                                                        onClick={() => window.open(`/${prefixAdmin}/product-attribute/create`, "_blank")}
                                                        sx={{
                                                            borderRadius: "10px",
                                                            textTransform: "none",
                                                            fontWeight: 800,
                                                            px: 2.0
                                                        }}
                                                    >
                                                        Thêm thuộc tính
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        onClick={() => window.open(`/${prefixAdmin}/product-attribute/list`, "_blank")}
                                                        sx={{
                                                            bgcolor: "#1C252E",
                                                            borderRadius: "10px",
                                                            textTransform: "none",
                                                            fontWeight: 800,
                                                            px: 2.0,
                                                            "&:hover": { bgcolor: "#454F5B" }
                                                        }}
                                                    >
                                                        Danh sách thuộc tính
                                                    </Button>
                                                </Stack>
                                            </Stack>
                                        </Box>
                                    )}
                                    <ProductVariants
                                        expanded={expandedVariants}
                                        onToggle={toggle(setExpandedVariants)}
                                        variants={variants}
                                        onVariantsChange={setVariants}
                                        availableImages={files}
                                        readOnly={isReadOnly}
                                    />
                                </>
                            )}
                        </Box>

                        {/* ———————————————— RIGHT COLUMN (35%) ———————————————— */}
                        <Box sx={{ flex: '1 1 35%', display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
                            {/* — TRẠNG THÁI — */}
                            <SectionCard title="Trạng thái & Loại" subheader="Cấu hình cơ bản">
                                <Stack p="24px" spacing={3}>
                                    <FormControl fullWidth>
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

                                    <Stack direction="row" gap={2} alignItems="center">
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
                                                            <IconButton onClick={() => setBarcode(generateBarcode())} color="primary" size="small">
                                                                <RefreshCwIcon size={16} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </InputAdornment>
                                                ),
                                                sx: { bgcolor: '#F8FAFC' }
                                            }}
                                        />
                                        {barcode && (
                                            <Box sx={{ border: '1px solid #919eab33', p: 0.5, borderRadius: 1.5, bgcolor: 'white', display: 'flex' }}>
                                                <Barcode value={barcode} width={0.8} height={30} fontSize={10} />
                                            </Box>
                                        )}
                                    </Stack>
                                </Stack>
                            </SectionCard>

                            {/* — TỔ CHỨC — */}
                            <SectionCard title="Phân loại" subheader="Danh mục, Tags, Độ tuổi">
                                <Stack p="24px" spacing={3}>
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
                                            getOptionLabel={(option) => typeof option === 'string' ? option : (option?.name || "")}
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
                                                            label={option?.name || ""}
                                                            size="small"
                                                            sx={{ bgcolor: `${option?.color || '#00B8D9'}22`, color: option?.color || '#00B8D9', fontWeight: 700 }}
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
                                                <MenuItem key={age?.id || age?.ageRangeId} value={age?.id || age?.ageRangeId}>
                                                    {age?.name ? (AGE_RANGE_LABELS[age.name] || age.name) : ""}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Stack>
                            </SectionCard>

                            {/* — THÔNG SỐ — */}
                            <SectionCard title="Thông số kỹ thuật" subheader="Thương hiệu, Xuất xứ, Vật liệu">
                                <Stack p="24px" spacing={3}>
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
                                                    <MenuItem key={brand?.id || brand?.brandId} value={brand?.id || brand?.brandId}>
                                                        {brand?.name || ""}
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

                                    <FormControl fullWidth>
                                        <InputLabel>Xuất xứ</InputLabel>
                                        <Select
                                            value={origin}
                                            label="Xuất xứ"
                                            onChange={handleChangeOrigin}
                                            disabled={isReadOnly}
                                            MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                                        >
                                            {countries.map((country: any) => (
                                                <MenuItem key={country?.code} value={country?.code}>
                                                    {country?.name || country?.code}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <TextField
                                        label="Nguyên vật liệu"
                                        name="material"
                                        fullWidth
                                        value={material}
                                        onChange={(e) => setMaterial(e.target.value)}
                                        InputProps={{ readOnly: isReadOnly }}
                                    />
                                </Stack>
                            </SectionCard>
                        </Box>
                    </Box>

                    {/* ———————————————— STICKY FOOTER ———————————————— */}
                    {mode !== 'view' && (
                        <Box sx={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            zIndex: 1000,
                            backdropFilter: 'blur(8px)',
                            background: 'rgba(255,255,255,0.85)',
                            borderTop: '1px solid #919eab33',
                            py: '16px',
                            px: { xs: '20px', lg: '120px' },
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px',
                        }}>
                            <Button
                                type="button"
                                variant="outlined"
                                onClick={() => { clearDraft(); navigate(mode === 'edit' ? `/${prefixAdmin}/product/detail/${id}` : `/${prefixAdmin}/product/list`); }}
                                sx={{
                                    minHeight: '2.75rem',
                                    minWidth: '6rem',
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    padding: '6px 22px',
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    borderColor: '#919eab52',
                                    color: '#637381',
                                    '&:hover': {
                                        borderColor: '#1C252E',
                                        color: '#1C252E',
                                        background: 'rgba(145, 158, 171, 0.08)',
                                    },
                                }}
                            >
                                {t('admin.common.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                sx={{
                                    background: '#1C252E',
                                    minHeight: '2.75rem',
                                    minWidth: '10rem',
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    padding: '6px 28px',
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    boxShadow: 'none',
                                    '&:hover': {
                                        background: '#454F5B',
                                        boxShadow: '0 8px 16px 0 rgba(145 158 171 / 16%)',
                                    },
                                }}
                            >
                                {mode === 'create' ? t('admin.common.create') : "Lưu thay đổi"}
                            </Button>
                        </Box>
                    )}
                </form>

                <QuickCreateDialog
                    open={openQuickBrand}
                    onClose={() => setOpenQuickBrand(false)}
                    title="Thương hiệu mới"
                    fields={[
                        { key: 'name', label: 'Tên thương hiệu', required: true },
                        { key: 'description', label: 'Mô tả', type: 'multiline' }
                    ]}
                    onSave={handleSaveBrand}
                />
                <QuickCreateDialog
                    open={openQuickCategory}
                    onClose={() => setOpenQuickCategory(false)}
                    title="Danh mục mới"
                    fields={[
                        { key: 'name', label: 'Tên danh mục', required: true },
                        { key: 'description', label: 'Mô tả', type: 'multiline' }
                    ]}
                    onSave={handleSaveCategory}
                />
                <QuickCreateDialog
                    open={editingTag !== null || openQuickTag}
                    onClose={() => { setOpenQuickTag(false); setEditingTag(null); }}
                    title={editingTag ? "Chỉnh sửa Tag" : "Tag mới"}
                    fields={[
                        { key: 'name', label: 'Tên tag', required: true },
                        { key: 'color', label: 'Màu sắc', type: 'color' }
                    ]}
                    onSave={handleSaveTag}
                    initialData={editingTag}
                />
            </ThemeProvider>
        </>
    );
};
