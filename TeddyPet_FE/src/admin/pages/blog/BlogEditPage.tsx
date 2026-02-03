import { Box, Stack, TextField, ThemeProvider, useTheme, Button, CircularProgress, FormControl, InputLabel, Select, MenuItem, FormHelperText } from "@mui/material";
import { Breadcrumb } from "../../components/ui/Breadcrumb";
import { Title } from "../../components/ui/Title";
import { Tiptap } from "../../components/layouts/titap/Tiptap";
import { useState, useEffect } from "react";
import { CollapsibleCard } from "../../components/ui/CollapsibleCard";
import { useBlogDetail, useUpdateBlog } from "./hooks/useBlog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { createBlogSchema, CreateBlogFormValues } from "../../schemas/blog.schema";
import { prefixAdmin } from "../../constants/routes";
import { FormUploadSingleFile } from "../../components/upload/FormUploadSingleFile";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";
import { useNestedBlogCategories } from "../blog-category/hooks/useBlogCategory";
import { getBlogCategoryTheme } from "../blog-category/configs/theme";
import { CategoryTreeSelectGeneric } from "../../components/ui/CategoryTreeSelectGeneric";

export const BlogEditPage = () => {
    const { id } = useParams();
    const [expandedDetail, setExpandedDetail] = useState(true);
    const [expandedExtra, setExpandedExtra] = useState(true);

    const toggle = (setter: React.Dispatch<React.SetStateAction<boolean>>) =>
        () => setter(prev => !prev);

    const outerTheme = useTheme();
    const localTheme = getBlogCategoryTheme(outerTheme);

    const { data: detailRes, isLoading: isLoadingDetail } = useBlogDetail(id);
    const { data: blogCategories = [] } = useNestedBlogCategories();
    const { mutate: update, isPending: isUpdating } = useUpdateBlog();

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
            tagIds: ["1"],

            status: "DRAFT",
            metaTitle: "",
            metaDescription: "",
            displayOrder: 0,
        },
    });

    useEffect(() => {
        if (detailRes?.success && detailRes?.data) {
            const detail = detailRes.data;
            reset({
                title: detail.title || "",
                excerpt: detail.excerpt || "",
                content: detail.content || "",
                featuredImage: detail.featuredImage || "",
                categoryId: detail.category?.categoryId || 0,
                tagIds: detail.tags?.map((t: any) => String(t.tagId)) || ["1"],
                // parentId: detail.parentId || 0,
                status: detail.status || "DRAFT",
                metaTitle: detail.metaTitle || "",
                metaDescription: detail.metaDescription || "",
                displayOrder: detail.displayOrder || 0,
            });
        }
    }, [detailRes, reset]);

    const onSubmit = (data: CreateBlogFormValues) => {
        const payload = {
            ...data,
            tagIds: ["1"], // Fix cứng tạm theo yêu cầu
            categoryId: Number(data.categoryId),
            displayOrder: Number(data.displayOrder),
            // parentId: Number(data.parentId),
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
                    <Stack sx={{ margin: "0px 120px", gap: "40px" }}>
                        <CollapsibleCard
                            title="Chi tiết"
                            subheader="Cập nhật tiêu đề, mô tả và nội dung bài viết"
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
                                            rows={4}
                                            fullWidth
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                            sx={{
                                                '& .MuiOutlinedInput-input': {
                                                    padding: 0,
                                                },
                                            }}
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
                            title="Thuộc tính"
                            subheader="Các thông tin bổ sung và thuộc tính mở rộng"
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
                                                label="Vị trí"
                                                type="number"
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
                                            />
                                        )}
                                    />
                                    <CategoryTreeSelectGeneric
                                        control={control}
                                        categories={blogCategories}
                                        name="categoryId"
                                        label="Danh mục bài viết"
                                        placeholder="Chọn danh mục"
                                    />
                                </Box>

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
                                            rows={4}
                                            fullWidth
                                            sx={{
                                                '& .MuiOutlinedInput-input': {
                                                    padding: 0,
                                                },
                                            }}
                                        />
                                    )}
                                />
                            </Stack>
                        </CollapsibleCard>

                        <Box gap="24px" sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
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
                                {isUpdating ? 'Đang cập nhật...' : 'Cập nhật bài viết'}
                            </Button>
                        </Box>
                    </Stack>
                </form>
            </ThemeProvider>
        </>
    );
};
