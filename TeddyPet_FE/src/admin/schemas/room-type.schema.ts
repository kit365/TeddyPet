import { z } from 'zod';

export const roomTypeUpsertSchema = z.object({
    roomTypeId: z.number().optional().nullable(),
    serviceId: z.preprocess(
        (val) => {
            if (val === '' || val === null || val === undefined) return null;
            const n = Number(val);
            return Number.isNaN(n) ? null : n;
        },
        z.number().nullable().optional(),
    ),
    typeName: z.string().min(1, 'Tên loại phòng là bắt buộc').max(255),
    displayTypeName: z.string().max(255).optional(),
    slug: z.string().max(255).optional(),
    description: z.string().optional(),
    shortDescription: z.string().max(500).optional(),
    imageUrl: z.string().max(255).optional(),
    galleryImages: z.array(z.string()).optional().nullable(),
    minArea: z.coerce.number().optional().nullable(),
    maxArea: z.coerce.number().optional().nullable(),
    maxPets: z.coerce.number().optional().nullable(),
    minPetWeight: z.coerce.number().optional().nullable(),
    maxPetWeight: z.coerce.number().optional().nullable(),
    suitablePetSizes: z.string().max(500).optional().nullable(),
    suitablePetTypes: z.array(z.string()).optional().nullable(),
    basePricePerNight: z.coerce.number().optional().nullable(),
    standardAmenities: z.string().optional().nullable(),
    features: z.string().optional().nullable(),
    displayOrder: z.coerce.number().optional().nullable(),
    cancellationPolicy: z.string().optional().nullable(),
    requiresVaccination: z.boolean().optional().default(true),
    requiresHealthCheck: z.boolean().optional().default(false),
    totalRooms: z.coerce.number().optional().nullable(),
    metaTitle: z.string().max(150).optional().nullable(),
    metaDescription: z.string().max(255).optional().nullable(),
    keywords: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
});

export type RoomTypeUpsertFormValues = z.infer<typeof roomTypeUpsertSchema>;
