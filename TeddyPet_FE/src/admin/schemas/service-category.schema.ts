import { z } from 'zod';

export const serviceCategoryUpsertSchema = z.object({
    categoryId: z.number().optional().nullable(),
    name: z.string().min(1, 'Tên danh mục không được để trống').max(255),
    description: z.string().max(500).optional(),
    serviceType: z.string().max(100).optional(),
    pricingModel: z.string().max(100).optional(),
    metaTitle: z.string().max(255).optional(),
    metaDescription: z.string().max(500).optional(),
    icon: z.string().max(255).optional(),
    imageUrl: z.string().max(255).optional(),
    colorCode: z.string().max(20).optional(),
    parentId: z.number().optional().nullable(),
    displayOrder: z.number().optional(),
    isActive: z.boolean().default(true),
});

export type ServiceCategoryUpsertFormValues = z.infer<typeof serviceCategoryUpsertSchema>;
