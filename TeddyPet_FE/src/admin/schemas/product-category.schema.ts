import { z } from "zod";

export const createCategorySchema = z.object({
    name: z
        .string()
        .min(1, "Tên danh mục không được để trống")
        .max(100),

    description: z.string().optional(),

    parentId: z.string().optional(),

    isActive: z.boolean(),

    imageUrl: z.string().min(1, "Vui lòng chọn hình ảnh"),
});

export type CreateCategoryFormValues = z.infer<typeof createCategorySchema>;
