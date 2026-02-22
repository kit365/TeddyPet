import { z } from 'zod';

export const serviceUpsertSchema = z.object({
    serviceId: z.number().optional().nullable(),
    serviceCategoryId: z.preprocess(
        (val) => {
            if (val === '' || val === null || val === undefined) return undefined;
            const n = Number(val);
            return Number.isNaN(n) ? undefined : n;
        },
        z.number({ required_error: 'Vui lòng chọn danh mục dịch vụ', invalid_type_error: 'Vui lòng chọn danh mục dịch vụ' }).min(1, 'Vui lòng chọn danh mục dịch vụ'),
    ),
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
    isCritical: z.boolean().optional(),
    addonType: z.string().max(50).optional(),
    metaTitle: z.string().max(255).optional(),
    metaDescription: z.string().max(500).optional(),
    isActive: z.boolean().default(true),
});

export type ServiceUpsertFormValues = z.infer<typeof serviceUpsertSchema>;
