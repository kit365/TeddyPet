import { z } from 'zod';

export const serviceUpsertSchema = z.object({
    serviceId: z.number().optional().nullable(),
    serviceCategoryId: z.any()
        .refine((val) => {
            const n = Number(val);
            return !isNaN(n) && n > 0;
        }, { message: 'Vui lòng chọn danh mục dịch vụ' })
        .transform((val) => Number(val)),
    code: z.string().max(50).optional(),
    serviceName: z.string().min(1, 'Tên dịch vụ là bắt buộc').max(255),
    suitablePetTypes: z.array(z.string()).optional(),
    slug: z.string().optional(),
    shortDescription: z.string().max(500).optional(),
    description: z.string().optional(),
    duration: z.coerce.number().min(1, 'Thời lượng phải lớn hơn 0'),
    bufferTime: z.coerce.number().optional(),
    maxPetsPerSession: z.coerce.number().optional(),
    advanceBookingHours: z.coerce.number().optional(),
    cancellationDeadlineHours: z.coerce.number().optional(),
    imageURL: z.string().max(255).optional(),
    galleryImages: z.array(z.string()).optional(),
    requiredStaffCount: z.coerce.number().optional(),
    requiredCertifications: z.string().optional(),
    requiresVaccination: z.boolean().optional(),
    displayOrder: z.coerce.number().optional(),
    isPopular: z.boolean().optional(),
    isAddon: z.boolean().optional(),
    isAdditionalCharge: z.boolean().optional(),
    isCritical: z.boolean().optional(),
    addonType: z.string().max(50).optional(),
    metaTitle: z.string().max(255).optional(),
    metaDescription: z.string().max(500).optional(),
    isActive: z.boolean().default(true),
    isRequiredRoom: z.boolean().optional().default(false),
    // Refund Policy
    beforeDeadlineRefundPct: z.coerce.number().min(0).max(100).optional(),
    afterDeadlineRefundPct: z.coerce.number().min(0).max(100).optional(),
    noShowRefundPct: z.coerce.number().min(0).max(100).optional(),
    noShowPenalty: z.coerce.number().min(0).optional(),
    allowReschedule: z.boolean().optional().default(true),
    rescheduleDeadlineHours: z.coerce.number().min(0).optional(),
    rescheduleLimit: z.coerce.number().min(0).optional(),
    allowForceMajeure: z.boolean().optional().default(true),
    forceMajeureRefundPct: z.coerce.number().min(0).max(100).optional(),
});

export type ServiceUpsertFormValues = z.infer<typeof serviceUpsertSchema>;
