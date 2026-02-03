import { Box, Stack, TextField, ThemeProvider, useTheme, Button, CircularProgress } from "@mui/material";
import { Breadcrumb } from "../../components/ui/Breadcrumb";
import { Title } from "../../components/ui/Title";
import { Tiptap } from "../../components/layouts/titap/Tiptap";
import { useState, useEffect } from "react";
import { CollapsibleCard } from "../../components/ui/CollapsibleCard";
import { useBlogCategoryDetail, useNestedBlogCategories, useUpdateBlogCategory } from "./hooks/useBlogCategory";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { createCategorySchema, CreateCategoryFormValues } from "../../schemas/blog-category.schema";
import { SwitchButton } from "../../components/ui/SwitchButton";
import { getBlogCategoryTheme } from "./configs/theme";
import { prefixAdmin } from "../../constants/routes";
import { FormUploadSingleFile } from "../../components/upload/FormUploadSingleFile";
import { toast } from "react-toastify";
import { CategoryParentSelect } from "../../components/ui/CategoryTreeSelect";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const BlogCategoryEditPage = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const [expandedDetail, setExpandedDetail] = useState(true);

    const toggle = (setter: React.Dispatch<React.SetStateAction<boolean>>) =>
        () => setter(prev => !prev);

    const outerTheme = useTheme();
    const localTheme = getBlogCategoryTheme(outerTheme);

    const { data: detailRes, isLoading: isLoadingDetail } = useBlogCategoryDetail(id);
    const { data: nestedCategories = [] } = useNestedBlogCategories();

    const { mutate: update, isPending: isUpdating } = useUpdateBlogCategory();

    const {
        control,
        handleSubmit,
        reset,
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

    // 3. Đổ dữ liệu vào Form khi có dữ liệu từ Detail API
    useEffect(() => {
        if (detailRes?.success && detailRes?.data) {
            const detail = detailRes.data;
            reset({
                name: detail.name || "",
                description: detail.description || "",
                // Convert sang string để Select Component nhận diện đúng
                parentId: detail.parentId ? String(detail.parentId) : "",
                isActive: detail.isActive,
                imageUrl: detail.imageUrl || "",
            });
        }
    }, [detailRes, reset]);

    const onSubmit = (data: CreateCategoryFormValues) => {
        // Gom dữ liệu form + categoryId để gửi lên (Backend dùng chung POST để Edit)
        const payload = {
            ...data,
            categoryId: Number(id), // Gửi kèm ID để backend biết đây là lệnh Edit
            parentId: data.parentId === "" ? null : Number(data.parentId)
        };

        update(payload, {
            onSuccess: (response) => {
                if (response.success) {
                    toast.success(response.message || t("admin.validation.update_success"));
                } else {
                    toast.error(response.message);
                }
            },
            onError: () => {
                toast.error(t("admin.validation.update_failed"));
            }
        });
    };

    // Hiển thị loading khi đang tải dữ liệu ban đầu
    if (isLoadingDetail) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress color="inherit" />
            </Box>
        );
    }

    return (
        <>
            <div className="mb-[40px] gap-[16px] flex items-start justify-end">
                <div className="mr-auto">
                    <Title title={t("admin.blog_category.title.edit")} />
                    <Breadcrumb
                        items={[
                            { label: t("admin.dashboard"), to: "/" },
                            { label: t("admin.blog_category.title.list"), to: `/${prefixAdmin}/blog-category/list` },
                            { label: t("admin.common.edit") }
                        ]}
                    />
                </div>
            </div>

            <ThemeProvider theme={localTheme}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Stack sx={{ margin: "0px 120px", gap: "40px" }}>
                        <CollapsibleCard
                            title={t("admin.common.details")}
                            subheader={t("admin.blog_category.fields.description_placeholder")}
                            expanded={expandedDetail}
                            onToggle={toggle(setExpandedDetail)}
                        >
                            <Stack p="24px" gap="24px">
                                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px 16px" }}>
                                    <Controller
                                        name="name"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                {...field}
                                                label={t("admin.blog_category.fields.name")}
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
                                                fullWidth
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
                                disabled={isUpdating}
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
                                {isUpdating ? t("admin.common.processing") : t("admin.blog_category.title.edit")}
                            </Button>
                        </Box>
                    </Stack>
                </form>
            </ThemeProvider>
        </>
    );
};