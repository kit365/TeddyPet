import { z } from 'zod';

export const servicePricingUpsertSchema = z.object({
    pricingId: z.number().optional().nullable(),
    serviceId: z.number({ required_error: 'ID dịch vụ là bắt buộc' }),
    pricingName: z.string().min(1, 'Tên quy tắc giá là bắt buộc').max(255),
    price: z.coerce.number().min(0, 'Giá phải lớn hơn hoặc bằng 0'),
    suitablePetTypes: z.array(z.string()).optional().default([]),
    weekendMultiplier: z.coerce.number().optional().nullable(),
    peakSeasonMultiplier: z.coerce.number().optional().nullable(),
    holidayMultiplier: z.coerce.number().optional().nullable(),
    minWeight: z.coerce.number().optional().nullable(),
    maxWeight: z.coerce.number().optional().nullable(),
    effectiveFrom: z.string().optional(),
    effectiveTo: z.string().optional(),
    priority: z.coerce.number({ required_error: 'Thứ tự ưu tiên là bắt buộc' }),
    isActive: z.boolean().default(true),
});

export type ServicePricingUpsertFormValues = z.infer<typeof servicePricingUpsertSchema>;
