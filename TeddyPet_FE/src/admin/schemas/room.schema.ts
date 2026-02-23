import { z } from 'zod';

const ROOM_STATUSES = ['AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE', 'OUT_OF_SERVICE'] as const;

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
    roomNumber: z.string().min(1, 'Mã phòng là bắt buộc').max(50),
    roomName: z.string().max(255).optional(),
    building: z.string().max(100).optional(),
    floor: z.string().max(50).optional(),
    locationNote: z.string().max(500).optional().nullable(),
    customPricePerNight: z.coerce.number().optional().nullable(),
    priceNote: z.string().max(500).optional().nullable(),
    additionalAmenities: z.string().optional().nullable(),
    removedAmenities: z.string().optional().nullable(),
    images: z.string().optional().nullable(),
    capacity: z.coerce.number().optional().nullable(),
    expectedCheckoutDate: z.string().optional().nullable(),
    currentCheckInDate: z.string().optional().nullable(),
    lastCleanedAt: z.string().optional().nullable(),
    lastMaintenanceAt: z.string().optional().nullable(),
    maintenanceNotes: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    internalNotes: z.string().optional().nullable(),
    area: z.coerce.number().optional().nullable(),
    status: z.enum(ROOM_STATUSES).optional().default('AVAILABLE'),
    isAvailableForBooking: z.boolean().default(true),
    isBlocked: z.boolean().optional().default(false),
    blockReason: z.string().optional().nullable(),
    blockedFrom: z.string().optional().nullable(),
    blockedTo: z.string().optional().nullable(),
    blockedBy: z.string().max(255).optional().nullable(),
    isActive: z.boolean().default(true),
});

export type RoomUpsertFormValues = z.infer<typeof roomUpsertSchema>;
