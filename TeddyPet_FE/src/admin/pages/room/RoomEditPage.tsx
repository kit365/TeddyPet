import { Box, Stack, TextField, ThemeProvider, useTheme, Button, MenuItem, CircularProgress } from '@mui/material';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Title } from '../../components/ui/Title';
import { useState, useEffect } from 'react';
import { CollapsibleCard } from '../../components/ui/CollapsibleCard';
import { useRoomDetail, useUpdateRoom } from './hooks/useRoom';
import { useRoomTypes } from './hooks/useRoomType';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { roomUpsertSchema, type RoomUpsertFormValues } from '../../schemas/room.schema';
import { SwitchButton } from '../../components/ui/SwitchButton';
import { getServiceTheme } from '../service/configs/theme';
import { prefixAdmin } from '../../constants/routes';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';

const ROOM_STATUS_OPTIONS = [
    { value: 'AVAILABLE', label: 'Trống' },
    { value: 'OCCUPIED', label: 'Đang dùng' },
    { value: 'CLEANING', label: 'Đang dọn' },
    { value: 'MAINTENANCE', label: 'Bảo trì' },
    { value: 'OUT_OF_SERVICE', label: 'Ngừng phục vụ' },
];

export const RoomEditPage = () => {
    const { id } = useParams();
    const [expanded, setExpanded] = useState(true);
    const [expandedExtra, setExpandedExtra] = useState(true);
    const [expandedBlock, setExpandedBlock] = useState(false);
    const theme = useTheme();
    const localTheme = getServiceTheme(theme);

    const { data: detailRes, isLoading } = useRoomDetail(id);
    const { data: roomTypes = [] } = useRoomTypes();

    const { control, handleSubmit, reset } = useForm<RoomUpsertFormValues>({
        resolver: zodResolver(roomUpsertSchema),
        defaultValues: {
            roomTypeId: undefined as unknown as number,
            roomNumber: '',
            roomName: '',
            building: '',
            floor: '',
            locationNote: '',
            customPricePerNight: undefined,
            priceNote: '',
            additionalAmenities: '',
            removedAmenities: '',
            images: '',
            capacity: undefined,
            expectedCheckoutDate: '',
            currentCheckInDate: '',
            lastCleanedAt: '',
            lastMaintenanceAt: '',
            maintenanceNotes: '',
            notes: '',
            internalNotes: '',
            area: undefined,
            status: 'AVAILABLE',
            isAvailableForBooking: true,
            isBlocked: false,
            blockReason: '',
            blockedFrom: '',
            blockedTo: '',
            blockedBy: '',
            isActive: true,
        },
    });

    useEffect(() => {
        if (detailRes?.data) {
            const d = detailRes.data;
            reset({
                roomTypeId: d.roomTypeId,
                roomNumber: d.roomNumber ?? '',
                roomName: d.roomName ?? '',
                building: d.building ?? '',
                floor: d.floor ?? '',
                locationNote: d.locationNote ?? '',
                customPricePerNight: d.customPricePerNight ?? undefined,
                priceNote: d.priceNote ?? '',
                additionalAmenities: d.additionalAmenities ?? '',
                removedAmenities: d.removedAmenities ?? '',
                images: d.images ?? '',
                capacity: d.capacity ?? undefined,
                expectedCheckoutDate: d.expectedCheckoutDate ?? '',
                currentCheckInDate: d.currentCheckInDate ?? '',
                lastCleanedAt: d.lastCleanedAt ?? '',
                lastMaintenanceAt: d.lastMaintenanceAt ?? '',
                maintenanceNotes: d.maintenanceNotes ?? '',
                notes: d.notes ?? '',
                internalNotes: d.internalNotes ?? '',
                area: d.area ?? undefined,
                status: (d.status as RoomUpsertFormValues['status']) ?? 'AVAILABLE',
                isAvailableForBooking: d.isAvailableForBooking ?? true,
                isBlocked: d.isBlocked ?? false,
                blockReason: d.blockReason ?? '',
                blockedFrom: d.blockedFrom ?? '',
                blockedTo: d.blockedTo ?? '',
                blockedBy: d.blockedBy ?? '',
                isActive: d.isActive ?? true,
            });
        }
    }, [detailRes, reset]);

    const { mutate: update, isPending } = useUpdateRoom();

    const onSubmit = (data: RoomUpsertFormValues) => {
        update(
            {
                roomId: Number(id),
                roomTypeId: data.roomTypeId,
                roomNumber: data.roomNumber.trim(),
                roomName: data.roomName?.trim() || null,
                building: data.building?.trim() || null,
                floor: data.floor?.trim() || null,
                locationNote: data.locationNote?.trim() || null,
                customPricePerNight: data.customPricePerNight ?? null,
                priceNote: data.priceNote?.trim() || null,
                additionalAmenities: data.additionalAmenities?.trim() || null,
                removedAmenities: data.removedAmenities?.trim() || null,
                images: data.images?.trim() || null,
                capacity: data.capacity ?? null,
                expectedCheckoutDate: data.expectedCheckoutDate || null,
                currentCheckInDate: data.currentCheckInDate || null,
                lastCleanedAt: data.lastCleanedAt || null,
                lastMaintenanceAt: data.lastMaintenanceAt || null,
                maintenanceNotes: data.maintenanceNotes?.trim() || null,
                notes: data.notes?.trim() || null,
                internalNotes: data.internalNotes?.trim() || null,
                area: data.area ?? null,
                status: data.status ?? 'AVAILABLE',
                isAvailableForBooking: data.isAvailableForBooking ?? true,
                isBlocked: data.isBlocked ?? false,
                blockReason: data.blockReason?.trim() || null,
                blockedFrom: data.blockedFrom || null,
                blockedTo: data.blockedTo || null,
                blockedBy: data.blockedBy?.trim() || null,
                isActive: data.isActive ?? true,
            },
            {
                onSuccess: (res) => {
                    if (res?.success) toast.success(res.message ?? 'Cập nhật phòng thành công');
                    else toast.error((res as any)?.message);
                },
            }
        );
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <div className="mb-[40px] gap-[16px] flex items-start justify-end">
                <div className="mr-auto">
                    <Title title="Sửa phòng" />
                    <Breadcrumb
                        items={[
                            { label: 'Trang chủ', to: '/' },
                            { label: 'Quản lý phòng', to: `/${prefixAdmin}/room-type/list` },
                            { label: 'Danh sách phòng', to: `/${prefixAdmin}/room/list` },
                            { label: 'Sửa' },
                        ]}
                    />
                </div>
            </div>
            <ThemeProvider theme={localTheme}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Stack sx={{ margin: '0px 120px', gap: '40px' }}>
                        <CollapsibleCard title="Thông tin phòng" expanded={expanded} onToggle={() => setExpanded((p) => !p)}>
                            <Stack p="24px" gap="24px">
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px 16px' }}>
                                    <Controller
                                        name="roomTypeId"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                {...field}
                                                select
                                                label="Loại phòng"
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
                                                fullWidth
                                                value={field.value ?? ''}
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    field.onChange(v === '' ? undefined : Number(v));
                                                }}
                                            >
                                                <MenuItem value="">— Chọn loại phòng —</MenuItem>
                                                {roomTypes.map((rt) => (
                                                    <MenuItem key={rt.roomTypeId} value={rt.roomTypeId}>
                                                        {rt.typeName}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        )}
                                    />
                                    <Controller
                                        name="roomNumber"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                {...field}
                                                label="Mã phòng"
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
                                                fullWidth
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="roomName"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="Tên phòng" fullWidth />}
                                    />
                                    <Controller
                                        name="building"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="Tòa nhà" fullWidth />}
                                    />
                                    <Controller
                                        name="floor"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="Tầng" fullWidth />}
                                    />
                                    <Controller
                                        name="status"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField {...field} select label="Trạng thái" fullWidth>
                                                {ROOM_STATUS_OPTIONS.map((opt) => (
                                                    <MenuItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        )}
                                    />
                                    <Controller
                                        name="locationNote"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="Ghi chú vị trí" fullWidth />}
                                    />
                                    <Controller
                                        name="area"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                label="Diện tích (m²)"
                                                fullWidth
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="capacity"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                label="Sức chứa"
                                                fullWidth
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                            />
                                        )}
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                    <SwitchButton control={control} name="isAvailableForBooking" label="Có thể đặt" />
                                    <SwitchButton control={control} name="isActive" label="Hoạt động" />
                                </Box>
                            </Stack>
                        </CollapsibleCard>
                        <CollapsibleCard title="Giá, tiện nghi & lịch" expanded={expandedExtra} onToggle={() => setExpandedExtra((p) => !p)}>
                            <Stack p="24px" gap="24px">
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px 16px' }}>
                                    <Controller
                                        name="customPricePerNight"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                label="Giá đêm tùy chỉnh (VNĐ)"
                                                fullWidth
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                            />
                                        )}
                                    />
                                    <Controller name="priceNote" control={control} render={({ field }) => <TextField {...field} label="Ghi chú giá" fullWidth />} />
                                    <Controller
                                        name="expectedCheckoutDate"
                                        control={control}
                                        render={({ field }) => <TextField {...field} type="date" label="Ngày trả phòng dự kiến" fullWidth InputLabelProps={{ shrink: true }} />}
                                    />
                                    <Controller
                                        name="currentCheckInDate"
                                        control={control}
                                        render={({ field }) => <TextField {...field} type="date" label="Ngày nhận phòng hiện tại" fullWidth InputLabelProps={{ shrink: true }} />}
                                    />
                                    <Controller
                                        name="lastCleanedAt"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                type="datetime-local"
                                                label="Lần dọn dẹp gần nhất"
                                                fullWidth
                                                InputLabelProps={{ shrink: true }}
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value || null)}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="lastMaintenanceAt"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                type="datetime-local"
                                                label="Lần bảo trì gần nhất"
                                                fullWidth
                                                InputLabelProps={{ shrink: true }}
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value || null)}
                                            />
                                        )}
                                    />
                                </Box>
                                <Controller
                                    name="additionalAmenities"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} label="Tiện nghi bổ sung (JSON hoặc text)" multiline rows={2} fullWidth placeholder='VD: {"extra": ["mini_fridge", "pet_camera"]}' />
                                    )}
                                />
                                <Controller name="removedAmenities" control={control} render={({ field }) => <TextField {...field} label="Tiện nghi đã bỏ" multiline rows={2} fullWidth />} />
                                <Controller name="images" control={control} render={({ field }) => <TextField {...field} label="Ảnh phòng (URL hoặc JSON)" multiline rows={2} fullWidth />} />
                            </Stack>
                        </CollapsibleCard>
                        <CollapsibleCard title="Khóa phòng & ghi chú" expanded={expandedBlock} onToggle={() => setExpandedBlock((p) => !p)}>
                            <Stack p="24px" gap="24px">
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                    <SwitchButton control={control} name="isBlocked" label="Đang khóa phòng" />
                                </Box>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px 16px' }}>
                                    <Controller name="blockReason" control={control} render={({ field }) => <TextField {...field} label="Lý do khóa" fullWidth multiline rows={2} />} />
                                    <Controller
                                        name="blockedBy"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="Khóa bởi" fullWidth />}
                                    />
                                    <Controller
                                        name="blockedFrom"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField {...field} type="datetime-local" label="Khóa từ" fullWidth InputLabelProps={{ shrink: true }} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || null)} />
                                        )}
                                    />
                                    <Controller
                                        name="blockedTo"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField {...field} type="datetime-local" label="Khóa đến" fullWidth InputLabelProps={{ shrink: true }} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || null)} />
                                        )}
                                    />
                                </Box>
                                <Controller name="maintenanceNotes" control={control} render={({ field }) => <TextField {...field} label="Ghi chú bảo trì" multiline rows={2} fullWidth />} />
                                <Controller name="notes" control={control} render={({ field }) => <TextField {...field} label="Ghi chú" multiline rows={2} fullWidth />} />
                                <Controller name="internalNotes" control={control} render={({ field }) => <TextField {...field} label="Ghi chú nội bộ" multiline rows={2} fullWidth />} />
                            </Stack>
                        </CollapsibleCard>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                type="submit"
                                disabled={isPending}
                                variant="contained"
                                sx={{
                                    background: '#1C252E',
                                    minHeight: '4.8rem',
                                    fontWeight: 700,
                                    fontSize: '1.4rem',
                                    padding: '8px 24px',
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    '&:hover': { background: '#454F5B' },
                                }}
                            >
                                {isPending ? 'Đang lưu...' : 'Cập nhật phòng'}
                            </Button>
                        </Box>
                    </Stack>
                </form>
            </ThemeProvider>
        </>
    );
};
