import { z } from "zod";

export const createBrandSchema = z.object({
    name: z
        .string()
        .min(1, "Tên thương hiệu không được để trống")
        .max(100),

    description: z.string().optional(),

    websiteUrl: z.string().url("URL không hợp lệ").optional().or(z.literal("")),

    logoUrl: z.string().optional(),

    isActive: z.boolean().optional(),
});

export type CreateBrandFormValues = z.infer<typeof createBrandSchema>;
