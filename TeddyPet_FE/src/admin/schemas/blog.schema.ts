import { z } from "zod";

export const createBlogSchema = z.object({
    title: z
        .string()
        .min(1, "Tiêu đề bài viết không được để trống")
        .max(200, "Tiêu đề không được quá 200 ký tự"),

    excerpt: z.string().optional(),

    content: z.string().min(1, "Nội dung bài viết không được để trống"),

    featuredImage: z.string().min(1, "Vui lòng chọn ảnh bìa"),

    categoryId: z.coerce.number().min(1, "Vui lòng chọn danh mục bài viết"),

    tagIds: z.array(z.string()).optional().default([]), // Fix cứng tạm

    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),

    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"), // Uppercase as per requirement

    displayOrder: z.coerce.number().optional().default(0), // Vị trí
});

export type CreateBlogFormValues = z.infer<typeof createBlogSchema>;
