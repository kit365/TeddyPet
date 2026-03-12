import { Box, Stack, TextField, ThemeProvider, useTheme, Button } from "@mui/material"
import { Breadcrumb } from "../../components/ui/Breadcrumb"
import { Title } from "../../components/ui/Title"
import { Tiptap } from "../../components/layouts/titap/Tiptap"
import { useState } from "react";
import { CollapsibleCard } from "../../components/ui/CollapsibleCard";
import { useCreateBlogCategory, useNestedBlogCategories } from "./hooks/useBlogCategory";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { createCategorySchema, CreateCategoryFormValues } from "../../schemas/blog-category.schema";
import { SwitchButton } from "../../components/ui/SwitchButton";
import { getBlogCategoryTheme } from "./configs/theme";
import { prefixAdmin } from "../../constants/routes";
import { FormUploadSingleFile } from "../../components/upload/FormUploadSingleFile";
import { toast } from "react-toastify";
import { CategoryParentSelect } from "../../components/ui/CategoryTreeSelect";
import { useTranslation } from "react-i18next";

export const BlogCategoryCreatePage = () => {
    const { t } = useTranslation();
    const [expandedDetail, setExpandedDetail] = useState(true);
    const toggle = (setter: React.Dispatch<React.SetStateAction<boolean>>) =>
        () => setter(prev => !prev);

    const outerTheme = useTheme();
    const localTheme = getBlogCategoryTheme(outerTheme);

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
        },
    });

    // Lấy danh mục dạng cây
    const {
        data: nestedCategories = [],
    } = useNestedBlogCategories();

    // Tạo
    const { mutate: create, isPending } = useCreateBlogCategory();

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
                    <Title title={t("admin.blog_category.title.create")} />
                    <Breadcrumb
                        items={[
                            { label: t("admin.dashboard"), to: "/" },
                            { label: t("admin.blog_category.title.list"), to: `/${prefixAdmin}/blog-category/list` },
                            { label: t("admin.common.add") }
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
                            subheader={t("admin.blog_category.fields.description_placeholder")}
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
                                                label={t("admin.blog_category.fields.name")}
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
                                            />
                                        )}
                                    />
                                    <CategoryParentSelect
                                        control={control}
                                        categories={nestedCategories}
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
                                    minHeight: "3rem",
                                    minWidth: "4rem",
                                    fontWeight: 700,
                                    fontSize: "0.875rem",
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
                                {isPending ? t("admin.common.loading") : t("admin.blog_category.title.create")}
                            </Button>
                        </Box>
                    </Stack>
                </form>
            </ThemeProvider>

        </>
    )
}
