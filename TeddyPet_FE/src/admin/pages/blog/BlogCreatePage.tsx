import { Box, Stack, TextField, ThemeProvider, useTheme, Button, MenuItem, Select, FormControl, InputLabel, FormHelperText, createTheme } from "@mui/material"
import { useTranslation } from "react-i18next";
import { Breadcrumb } from "../../components/ui/Breadcrumb"
import { Title } from "../../components/ui/Title"
import { useState } from "react"
import { Tiptap } from "../../components/layouts/titap/Tiptap"
import { CollapsibleCard } from "../../components/ui/CollapsibleCard"
import { useCreateBlog } from "./hooks/useBlog"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { createBlogSchema, CreateBlogFormValues } from "../../schemas/blog.schema"
import { FormUploadSingleFile } from "../../components/upload/FormUploadSingleFile"
import { toast } from "react-toastify"
import { prefixAdmin } from "../../constants/routes"

import { useNestedBlogCategories } from "../blog-category/hooks/useBlogCategory";
import { CategoryTreeSelectGeneric } from "../../components/ui/CategoryTreeSelectGeneric";
import { Autocomplete } from "@mui/material";
import { useBlogTags } from "./hooks/useBlog";

export const BlogCreatePage = () => {
    const { t } = useTranslation();
    const [expandedDetail, setExpandedDetail] = useState(true);
    const [expandedExtra, setExpandedExtra] = useState(true);
    const toggle = (setter: React.Dispatch<React.SetStateAction<boolean>>) =>
        () => setter(prev => !prev);

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
                        fontSize: '0.875rem',
                        padding: '6px',
                        marginBottom: '4px',
                        borderRadius: '6px',
                    },
                },
            },
        }
    });

    const { data: blogCategories = [] } = useNestedBlogCategories();
    const { data: availableTags = [] } = useBlogTags();
    const { mutate: create, isPending } = useCreateBlog();

    const {
        control,
        handleSubmit,
        reset,
    } = useForm<CreateBlogFormValues>({
        resolver: zodResolver(createBlogSchema) as any,
        defaultValues: {
            title: "",
            excerpt: "",
            content: "",
            featuredImage: "",
            categoryId: 0,
            tagIds: [],
            status: "DRAFT",
            metaTitle: "",
            metaDescription: "",
            displayOrder: 0,
        },
    });

    const onSubmit = (data: CreateBlogFormValues) => {
        // Map string IDs to what API expects (array of strings)
        // Data.tagIds is already string[] per schema
        const payload = {
            ...data,
            categoryId: Number(data.categoryId),
            displayOrder: Number(data.displayOrder),
        };

        create(payload, {
            onSuccess: (response) => {
                if (response.success) {
                    toast.success(response.message || "Tạo bài viết thành công");
                    reset();
                } else {
                    toast.error(response.message);
                }
            },
            onError: () => {
                toast.error("Tạo bài viết thất bại");
            }
        });
    };

    return (
        <>
            <div className="mb-[40px] gap-[16px] flex items-start justify-end">
                <div className="mr-auto">
                    <Title title={t("admin.blog.title.create")} />
                    <Breadcrumb
                        items={[
                            { label: t("admin.dashboard"), to: "/" },
                            { label: t("admin.blog.title.list"), to: `/${prefixAdmin}/blog/list` },
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
                            subheader={t("admin.common.description")}
                            expanded={expandedDetail}
                            onToggle={toggle(setExpandedDetail)}
                        >
                            <Stack p="24px" gap="24px">
                                <Controller
                                    name="title"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <TextField
                                            {...field}
                                            label={t("admin.blog.fields.title")}
                                            fullWidth
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                        />
                                    )}
                                />
                                <Controller
                                    name="excerpt"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <TextField
                                            {...field}
                                            label={t("admin.blog.fields.excerpt")}
                                            multiline
                                            rows={4}
                                            fullWidth
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                            sx={{}}
                                        />
                                    )}
                                />
                                <Controller
                                    name="content"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <Box>
                                            <Tiptap
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                            />
                                            {fieldState.error && <FormHelperText error>{fieldState.error.message}</FormHelperText>}
                                        </Box>
                                    )}
                                />
                                <FormUploadSingleFile
                                    name="featuredImage"
                                    control={control}
                                />
                            </Stack>
                        </CollapsibleCard>
                        <CollapsibleCard
                            title={t("admin.common.attributes")}
                            subheader={t("admin.common.description")}
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
                                    <Controller
                                        name="status"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControl fullWidth>
                                                <InputLabel id="status-select-label">{t("admin.common.status")}</InputLabel>
                                                <Select
                                                    {...field}
                                                    labelId="status-select-label"
                                                    label={t("admin.common.status")}
                                                >
                                                    <MenuItem value="DRAFT">{t("admin.blog.status.draft")}</MenuItem>
                                                    <MenuItem value="PUBLISHED">{t("admin.blog.status.published")}</MenuItem>
                                                    <MenuItem value="ARCHIVED">{t("admin.blog.status.archived")}</MenuItem>
                                                </Select>
                                            </FormControl>
                                        )}
                                    />
                                    <Controller
                                        name="displayOrder"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                {...field}
                                                label={t("admin.common.position")}
                                                type="number"
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="tagIds"
                                        control={control}
                                        render={({ field }) => (
                                            <Autocomplete
                                                multiple
                                                options={availableTags}
                                                getOptionLabel={(option) => option.name}
                                                value={availableTags.filter((tag: any) => field.value?.includes(String(tag.id || tag.tagId))) || []}
                                                onChange={(_, newValue) => {
                                                    field.onChange(newValue.map((tag: any) => String(tag.id || tag.tagId)));
                                                }}
                                                filterSelectedOptions
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label={t("admin.blog.fields.tags")}
                                                        placeholder={t("admin.blog.fields.tags_placeholder")}
                                                    />
                                                )}
                                                sx={{
                                                    '& .MuiAutocomplete-clearIndicator': {
                                                        color: "#637381",
                                                        fontSize: "1.5rem",
                                                        '& .MuiSvgIcon-root': {
                                                            fontSize: '1.125rem',
                                                        },
                                                    },
                                                    '& .MuiFormLabel-root': {
                                                        color: "#919EAB",
                                                        fontWeight: "400",
                                                        '&.Mui-focused, &.MuiFormLabel-filled': {
                                                            color: field.value && field.value.length > 0 || expandedExtra ? "#FF5630" : "#1C252E",
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
                                                        fontSize: "0.8125rem",
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
                                                        fontSize: "0.9375rem",
                                                        marginRight: "4px",
                                                        marginLeft: "-4px"
                                                    },

                                                    "& .MuiChip-deleteIcon:hover": {
                                                        color: "rgb(0, 108, 156)",
                                                        opacity: "0.8"
                                                    },
                                                }}
                                            />
                                        )}
                                    />
                                    <CategoryTreeSelectGeneric
                                        control={control}
                                        categories={blogCategories}
                                        name="categoryId"
                                        label={t("admin.blog.fields.category")}
                                        placeholder={t("admin.blog.fields.select_category")}
                                    />
                                </Box>

                                <Controller
                                    name="metaTitle"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} label={t("admin.blog.fields.meta_title")} fullWidth />
                                    )}
                                />
                                <Controller
                                    name="metaDescription"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t("admin.blog.fields.meta_desc")}
                                            multiline
                                            rows={4}
                                            fullWidth
                                            sx={{}}
                                        />
                                    )}
                                />
                            </Stack>
                        </CollapsibleCard>
                        <Box gap="24px" sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
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
                                {isPending ? t('admin.common.processing') : t('admin.blog.title.create')}
                            </Button>
                        </Box>
                    </Stack>
                </form>
            </ThemeProvider>

        </>
    )
}