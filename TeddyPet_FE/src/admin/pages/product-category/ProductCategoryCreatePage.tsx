import { Box, Stack, TextField, ThemeProvider, useTheme, Button, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText, OutlinedInput, FormHelperText } from "@mui/material"
import { Breadcrumb } from "../../components/ui/Breadcrumb"
import { Title } from "../../components/ui/Title"
import { Tiptap } from "../../components/layouts/titap/Tiptap"
import { useState } from "react";
import { CollapsibleCard } from "../../components/ui/CollapsibleCard";
import { useCreateProductCategory, useNestedProductCategories } from "./hooks/useProductCategory";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { createCategorySchema, CreateCategoryFormValues } from "../../schemas/product-category.schema";
import { prefixAdmin } from "../../constants/routes";
import { FormUploadSingleFile } from "../../components/upload/FormUploadSingleFile";
import { toast } from "react-toastify";
import { CategoryParentSelect } from "../../components/ui/CategoryTreeSelect";
import { useTranslation } from "react-i18next";
import { SwitchButton } from "../../components/ui/SwitchButton";
import { getProductCategoryTheme } from "./configs/theme";

export const ProductCategoryCreatePage = () => {
    const { t } = useTranslation();
    const [expandedDetail, setExpandedDetail] = useState(true);
    const toggle = (setter: React.Dispatch<React.SetStateAction<boolean>>) =>
        () => setter(prev => !prev);

    const outerTheme = useTheme();
    const localTheme = getProductCategoryTheme(outerTheme);

    const {
        control,
        handleSubmit,
        reset
    } = useForm<CreateCategoryFormValues>({
        resolver: zodResolver(createCategorySchema),
        defaultValues: {
            name: "",
            description: "",
            parentId: "",
            isActive: true,
            imageUrl: "",
            categoryType: "OTHER",
            suitablePetTypes: ["DOG", "CAT"],
        },
    });

    // Lấy danh mục dạng cây
    const {
        data: nestedCategories = [],
    } = useNestedProductCategories();

    // Tạo
    const { mutate: create, isPending } = useCreateProductCategory();

    const onSubmit = (data: CreateCategoryFormValues) => {
        const payload = {
            ...data,
            parentId: data.parentId === "" ? null : Number(data.parentId),
        };

        create(payload as any, {
            onSuccess: (response) => {
                if (response.success) {
                    toast.success(response.message);
                    reset({
                        name: "",
                        description: "",
                        parentId: "",
                        isActive: true,
                        imageUrl: "",
                        categoryType: "OTHER",
                        suitablePetTypes: ["DOG", "CAT"],
                    });
                } else {
                    toast.error(response.message);
                }

            },
            onError: () => {
                toast.error(t("admin.validation.create_failed"));
            }
        });
    };

    return (
        <>
            <div className="mb-[40px] gap-[16px] flex items-start justify-end">
                <div className="mr-auto">
                    <Title title={t("admin.product_category.title.create")} />
                    <Breadcrumb
                        items={[
                            { label: t("admin.dashboard"), to: "/" },
                            { label: t("admin.product_category.title.list"), to: `/${prefixAdmin}/product-category/list` },
                            { label: t("admin.common.create") }
                        ]}
                    />
                </div>
            </div>
            <ThemeProvider theme={localTheme}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Stack sx={{
                        margin: "0px 120px",
                        gap: "40px"
                    }}>
                        <CollapsibleCard
                            title={t("admin.common.details")}
                            subheader={t("admin.product_category.fields.description_placeholder")}
                            expanded={expandedDetail}
                            onToggle={toggle(setExpandedDetail)}
                        >
                            <Stack p="24px" gap="24px">
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(2, 1fr)",
                                        gap: "24px 16px",
                                    }}
                                >
                                    <Controller
                                        name="name"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                {...field}
                                                label={t("admin.product_category.fields.name")}
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
                                            />
                                        )}
                                    />
                                    <CategoryParentSelect
                                        control={control}
                                        categories={nestedCategories}
                                    />

                                    <Controller
                                        name="categoryType"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <FormControl fullWidth error={!!fieldState.error} size="medium">
                                                <InputLabel id="category-type-label">Loại danh mục</InputLabel>
                                                <Select
                                                    {...field}
                                                    labelId="category-type-label"
                                                    label="Loại danh mục"
                                                >
                                                    <MenuItem value="FOOD">Thức ăn</MenuItem>
                                                    <MenuItem value="ACCESSORY">Phụ kiện</MenuItem>
                                                    <MenuItem value="TOY">Đồ chơi</MenuItem>
                                                    <MenuItem value="HYGIENE">Vệ sinh</MenuItem>
                                                    <MenuItem value="GROOMING">Chăm sóc lông (Grooming)</MenuItem>
                                                    <MenuItem value="BEDDING">Chỗ nằm / Chuồng</MenuItem>
                                                    <MenuItem value="OTHER">Khác</MenuItem>
                                                </Select>
                                                <FormHelperText>{fieldState.error?.message}</FormHelperText>
                                            </FormControl>
                                        )}
                                    />
                                    
                                    <Controller
                                        name="suitablePetTypes"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <FormControl fullWidth error={!!fieldState.error} size="medium">
                                                <InputLabel id="suitable-pet-types-label">Thú cưng phù hợp</InputLabel>
                                                <Select
                                                    {...field}
                                                    labelId="suitable-pet-types-label"
                                                    multiple
                                                    input={<OutlinedInput label="Thú cưng phù hợp" />}
                                                    renderValue={(selected) => {
                                                        const map: Record<string, string> = { DOG: "Chó", CAT: "Mèo", OTHER: "Khác" };
                                                        return (selected as string[]).map(v => map[v] || v).join(', ');
                                                    }}
                                                >
                                                    <MenuItem value="DOG">
                                                        <Checkbox checked={field.value.indexOf("DOG") > -1} />
                                                        <ListItemText primary="Chó" />
                                                    </MenuItem>
                                                    <MenuItem value="CAT">
                                                        <Checkbox checked={field.value.indexOf("CAT") > -1} />
                                                        <ListItemText primary="Mèo" />
                                                    </MenuItem>
                                                    <MenuItem value="OTHER">
                                                        <Checkbox checked={field.value.indexOf("OTHER") > -1} />
                                                        <ListItemText primary="Khác" />
                                                    </MenuItem>
                                                </Select>
                                                <FormHelperText>{fieldState.error?.message}</FormHelperText>
                                            </FormControl>
                                        )}
                                    />

                                </Box>
                                <Controller
                                    name="description"
                                    control={control}
                                    render={({ field }) => (
                                        <Tiptap
                                            value={field.value ?? ""}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                                <FormUploadSingleFile
                                    name="imageUrl"
                                    control={control}
                                />
                            </Stack>
                        </CollapsibleCard>
                        <Box gap="24px" sx={{ display: "flex", alignItems: "center" }}>
                            <SwitchButton control={control} name="isActive" />
                            <Button
                                type="submit"
                                disabled={isPending}
                                sx={{
                                    background: '#1C252E',
                                    minHeight: "4.8rem",
                                    minWidth: "6.4rem",
                                    fontWeight: 700,
                                    fontSize: "1.4rem",
                                    padding: "8px 16px",
                                    borderRadius: "8px",
                                    textTransform: "none",
                                    boxShadow: "none",
                                    "&:hover": {
                                        background: "#454F5B",
                                        boxShadow: "0 8px 16px 0 rgba(145 158 171 / 16%)"
                                    }
                                }}
                                variant="contained"
                            >
                                {isPending ? t("admin.common.loading") : t("admin.product_category.title.create")}
                            </Button>
                        </Box>
                    </Stack>
                </form>
            </ThemeProvider>

        </>
    )
}