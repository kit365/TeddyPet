import { z } from 'zod';

export const serviceComboItemSchema = z.object({
    serviceId: z.number({ required_error: 'Chọn dịch vụ' }),
    quantity: z.coerce.number().min(1, 'Số lượng phải lớn hơn hoặc bằng 1'),
});

export const serviceComboUpsertSchema = z.object({
    comboId: z.number().optional().nullable(),
    code: z.string().min(1, 'Mã gói dịch vụ là bắt buộc').max(50),
    comboName: z.string().min(1, 'Tên gói dịch vụ là bắt buộc').max(255),
    slug: z.string().max(255).optional(),
    description: z.string().optional(),
    comboPrice: z.coerce.number().min(0).optional().nullable(),
    originalPrice: z.coerce.number().min(0).optional().nullable(),
    validFrom: z.string().optional(),
    validTo: z.string().optional(),
    imgURL: z.string().max(255).optional(),
    discountPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
    minPetWeight: z.coerce.number().optional().nullable(),
    maxPetWeight: z.coerce.number().optional().nullable(),
    suitablePetTypes: z.string().optional(),
    displayOrder: z.coerce.number().optional(),
    tags: z.string().optional(),
    isPopular: z.boolean().optional(),
    isActive: z.boolean().default(true),
    serviceItems: z.array(serviceComboItemSchema).min(1, 'Gói dịch vụ phải có ít nhất một dịch vụ'),
});

export type ServiceComboItemFormValues = z.infer<typeof serviceComboItemSchema>;
export type ServiceComboUpsertFormValues = z.infer<typeof serviceComboUpsertSchema>;
