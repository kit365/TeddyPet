import { Box, Stack, TextField, ThemeProvider, useTheme, Button, CircularProgress, FormControl, InputLabel, Select, MenuItem, FormHelperText, Card, CardHeader, Divider, Chip, Autocomplete, Typography } from "@mui/material";
import { Breadcrumb } from "../../components/ui/Breadcrumb";
import { Title } from "../../components/ui/Title";
import { Tiptap } from "../../components/layouts/titap/Tiptap";
import { useEffect, useRef } from "react";
import { useBlogDetail, useUpdateBlog, useBlogTags, useCreateBlogTag } from "./hooks/useBlog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { createBlogSchema, CreateBlogFormValues } from "../../schemas/blog.schema";
import { prefixAdmin } from "../../constants/routes";
import { FormUploadSingleFile } from "../../components/upload/FormUploadSingleFile";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import { useNestedBlogCategories } from "../blog-category/hooks/useBlogCategory";
import { getBlogCategoryTheme } from "../blog-category/configs/theme";
import { CategoryTreeSelectGeneric } from "../../components/ui/CategoryTreeSelectGeneric";
import { useTranslation } from "react-i18next";

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

export const BlogEditPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();

    const outerTheme = useTheme();
    const localTheme = getBlogCategoryTheme(outerTheme);

    const { data: detailRes, isLoading: isLoadingDetail } = useBlogDetail(id);
    const { data: blogCategories = [] } = useNestedBlogCategories();
    const { data: tagOptions = [] } = useBlogTags();
    const { mutate: update, isPending: isUpdating } = useUpdateBlog();
    const { mutateAsync: createTag } = useCreateBlogTag();

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        watch,
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

    const isInitializedRef = useRef(false);

    useEffect(() => {
        if (detailRes?.success && detailRes?.data && !isInitializedRef.current) {
            const detail = detailRes.data;
            reset({
                title: detail.title || "",
                excerpt: detail.excerpt || "",
                content: detail.content || "",
                featuredImage: detail.featuredImage || "",
                categoryId: detail.category?.categoryId || 0,
                tagIds: detail.tags?.map((t: any) => String(t.tagId)) || [],
                status: detail.status || "DRAFT",
                metaTitle: detail.metaTitle || "",
                metaDescription: detail.metaDescription || "",
                displayOrder: detail.displayOrder || 0,
            });
            isInitializedRef.current = true;
        }
    }, [detailRes, reset]);

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

    const handleCreateTag = async (tagName: string) => {
        const formatted = formatTagName(tagName);
        try {
            const res = await createTag({ name: formatted });
            if (res.success) {
                const newTagId = String(res.data.tagId);
                const currentTags = watch("tagIds") || [];
                setValue("tagIds", [...currentTags, newTagId]);
                toast.success(`Đã tạo tag: ${formatted}`);
            } else {
                toast.error(res.message || "Không thể tạo tag");
            }
        } catch (error) {
            toast.error("Lỗi khi tạo tag");
        }
    };

    const onSubmit = (data: CreateBlogFormValues) => {
        const payload = {
            ...data,
            tagIds: data.tagIds,
            categoryId: Number(data.categoryId),
            displayOrder: Number(data.displayOrder),
        };

        update({ id: Number(id), data: payload }, {
            onSuccess: (response) => {
                if (response.success) {
                    toast.success(response.message || "Cập nhật bài viết thành công");
                } else {
                    toast.error(response.message);
                }
            },
            onError: () => {
                toast.error("Có lỗi xảy ra trong quá trình cập nhật");
            }
        });
    };

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
                    <Title title="Chỉnh sửa bài viết" />
                    <Breadcrumb
                        items={[
                            { label: "Dashboard", to: "/" },
                            { label: "Bài viết", to: `/${prefixAdmin}/blog/list` },
                            { label: "Chỉnh sửa" }
                        ]}
                    />
                </div>
            </div>

            <ThemeProvider theme={localTheme}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Box sx={{
                        margin: { xs: "0px 20px", lg: "0px 120px" },
                        display: 'flex',
                        flexDirection: { xs: 'column', lg: 'row' },
                        gap: '24px',
                        alignItems: 'flex-start',
                    }}>
                        {/* ———————————————— LEFT COLUMN (65%) ———————————————— */}
                        <Box sx={{ flex: '1 1 65%', display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
                            <SectionCard title="Chi tiết" subheader="Thông tin chi tiết bài viết">
                                <Stack p="24px" gap="24px">
                                    <Controller
                                        name="title"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                {...field}
                                                label="Tiêu đề bài viết"
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
                                                label="Mô tả ngắn"
                                                multiline
                                                rows={3}
                                                fullWidth
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
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
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ mb: 1, color: '#637381' }}>Hình ảnh đại diện</Typography>
                                        <FormUploadSingleFile
                                            name="featuredImage"
                                            control={control}
                                        />
                                    </Box>
                                </Stack>
                            </SectionCard>

                            <SectionCard title="SEO Settings" subheader="Cấu hình tìm kiếm">
                                <Stack p="24px" gap="24px">
                                    <Controller
                                        name="metaTitle"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField {...field} label="Tiêu đề SEO" fullWidth />
                                        )}
                                    />
                                    <Controller
                                        name="metaDescription"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Mô tả SEO"
                                                multiline
                                                rows={3}
                                                fullWidth
                                            />
                                        )}
                                    />
                                </Stack>
                            </SectionCard>
                        </Box>

                        {/* ———————————————— RIGHT COLUMN (35%) ———————————————— */}
                        <Box sx={{ flex: '1 1 35%', display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
                            <SectionCard title="Trạng thái" subheader="Cấu hình hiển thị">
                                <Stack p="24px" gap="24px">
                                    <Controller
                                        name="status"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControl fullWidth>
                                                <InputLabel id="status-select-label">Trạng thái</InputLabel>
                                                <Select
                                                    {...field}
                                                    labelId="status-select-label"
                                                    label="Trạng thái"
                                                >
                                                    <MenuItem value="DRAFT">Bản nháp</MenuItem>
                                                    <MenuItem value="PUBLISHED">Xuất bản</MenuItem>
                                                    <MenuItem value="ARCHIVED">Đã lưu trữ</MenuItem>
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
                                                label="Vị trí hiển thị"
                                                type="number"
                                                fullWidth
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
                                            />
                                        )}
                                    />
                                </Stack>
                            </SectionCard>

                            <SectionCard title="Phân loại" subheader="Danh mục & Tags">
                                <Stack p="24px" gap="24px">
                                    <CategoryTreeSelectGeneric
                                        control={control}
                                        categories={blogCategories}
                                        name="categoryId"
                                        label="Danh mục bài viết"
                                        placeholder="Chọn danh mục"
                                    />

                                    <Controller
                                        name="tagIds"
                                        control={control}
                                        render={({ field: { value, onChange } }) => (
                                            <Autocomplete
                                                multiple
                                                options={tagOptions}
                                                getOptionLabel={(option: any) => option.name || ""}
                                                value={tagOptions.filter((opt: any) => value?.includes(String(opt.tagId)))}
                                                onChange={(_, newValue) => {
                                                    onChange(newValue.map((v: any) => String(v.tagId)));
                                                }}
                                                renderTags={(tagValue, getTagProps) =>
                                                    tagValue.map((option, index) => (
                                                        <Chip
                                                            label={option.name}
                                                            {...getTagProps({ index })}
                                                            size="small"
                                                            sx={{ borderRadius: '8px', bgcolor: 'rgba(145, 158, 171, 0.16)' }}
                                                        />
                                                    ))
                                                }
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label="Tags"
                                                        placeholder="Chọn hoặc gõ để tạo mới"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                const val = (e.target as HTMLInputElement).value;
                                                                if (val && !tagOptions.some((t: any) => t.name.toLowerCase() === val.toLowerCase())) {
                                                                    e.preventDefault();
                                                                    handleCreateTag(val);
                                                                }
                                                            }
                                                        }}
                                                    />
                                                )}
                                            />
                                        )}
                                    />
                                </Stack>
                            </SectionCard>
                        </Box>
                    </Box>

                    <div className="h-[120px]" />

                    {/* ———————————————— STICKY FOOTER ———————————————— */}
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
                            onClick={() => navigate(`/${prefixAdmin}/blog/list`)}
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
                            Thoát
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isUpdating}
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
                            {isUpdating ? 'Đang cập nhật...' : 'Cập nhật bài viết'}
                        </Button>
                    </Box>
                </form>
            </ThemeProvider>
        </>
    );
};
