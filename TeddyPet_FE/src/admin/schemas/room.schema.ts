import { z } from 'zod';

const ROOM_STATUSES = ['AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE', 'BLOCKED', 'OUT_OF_SERVICE'] as const;

export const roomUpsertSchema = z.object({
    roomId: z.number().optional().nullable(),
    roomTypeId: z.preprocess(
        (val) => {
            if (val === '' || val === null || val === undefined) return undefined;
            const n = Number(val);
            return Number.isNaN(n) ? undefined : n;
        },
        z.number({ required_error: 'Vui lòng chọn loại phòng' }).min(1, 'Vui lòng chọn loại phòng'),
    ),
    roomNumber: z.string().max(50).optional(),
    roomName: z.string().max(255).optional(),
    block: z.string().max(100).optional(),
    floor: z.string().max(50).optional(),
    additionalAmenities: z.string().optional().nullable(),
    removedAmenities: z.string().optional().nullable(),
    images: z.string().optional().nullable(),
    capacity: z.coerce.number().optional().nullable(),
    notes: z.string().optional().nullable(),
    area: z.coerce.number().optional().nullable(),
    status: z.enum(ROOM_STATUSES).optional().default('AVAILABLE'),
    isActive: z.boolean().default(true),
});

export type RoomUpsertFormValues = z.infer<typeof roomUpsertSchema>;
