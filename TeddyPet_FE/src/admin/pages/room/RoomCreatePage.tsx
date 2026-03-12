import { Box, Stack, TextField, ThemeProvider, useTheme, Button, MenuItem } from '@mui/material';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Title } from '../../components/ui/Title';
import { useState } from 'react';
import { CollapsibleCard } from '../../components/ui/CollapsibleCard';
import { useCreateRoom } from './hooks/useRoom';
import { useRoomTypes } from './hooks/useRoomType';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { roomUpsertSchema, type RoomUpsertFormValues } from '../../schemas/room.schema';
import { SwitchButton } from '../../components/ui/SwitchButton';
import { AmenityMultiSelect, parseAmenityIds } from '../../components/ui/AmenityMultiSelect';
import { FormUploadSingleFile } from '../../components/upload/FormUploadSingleFile';
import { getServiceTheme } from '../service/configs/theme';
import { prefixAdmin } from '../../constants/routes';
import { toast } from 'react-toastify';

export const RoomCreatePage = () => {
    const [expandedBasic, setExpandedBasic] = useState(true);
    const [expandedAmenitiesNotes, setExpandedAmenitiesNotes] = useState(true);
    const theme = useTheme();
    const localTheme = getServiceTheme(theme);

    const { data: roomTypes = [] } = useRoomTypes();

    const { control, handleSubmit } = useForm<RoomUpsertFormValues>({
        resolver: zodResolver(roomUpsertSchema),
        defaultValues: {
            roomTypeId: undefined as unknown as number,
            roomName: '',
            additionalAmenities: '',
            removedAmenities: '',
            images: '',
            capacity: undefined,
            notes: '',
            area: undefined,
            status: 'AVAILABLE',
            isActive: true,
        },
    });

    const additionalAmenitiesValue = useWatch({ control, name: 'additionalAmenities', defaultValue: '' });
    const removedAmenitiesValue = useWatch({ control, name: 'removedAmenities', defaultValue: '' });

    const { mutate: create, isPending } = useCreateRoom();

    const onSubmit = (data: RoomUpsertFormValues) => {
        create(
            {
                roomTypeId: data.roomTypeId,
                roomNumber: data.roomNumber.trim(),
                roomName: data.roomName?.trim() || null,
                additionalAmenities: data.additionalAmenities?.trim() || null,
                removedAmenities: data.removedAmenities?.trim() || null,
                images: data.images?.trim() || null,
                capacity: data.capacity ?? null,
                notes: data.notes?.trim() || null,
                area: data.area ?? null,
                status: data.status ?? 'AVAILABLE',
                isActive: data.isActive ?? true,
            },
            {
                onSuccess: (res) => {
                    if (res?.success) {
                        toast.success(res.message ?? 'Tạo phòng thành công');
                        const id = (res as any)?.data?.roomId;
                        if (id) window.location.href = `/${prefixAdmin}/room/edit/${id}`;
                    } else toast.error((res as any)?.message);
                },
            }
        );
    };

    return (
        <>
            <div className="mb-[40px] gap-[16px] flex items-start justify-end">
                <div className="mr-auto">
                    <Title title="Thêm phòng" />
                    <Breadcrumb
                        items={[
                            { label: 'Trang chủ', to: '/' },
                            { label: 'Quản lý phòng', to: `/${prefixAdmin}/room-type/list` },
                            { label: 'Danh sách phòng', to: `/${prefixAdmin}/room/list` },
                            { label: 'Thêm' },
                        ]}
                    />
                </div>
            </div>
            <ThemeProvider theme={localTheme}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Stack sx={{ margin: '0px 120px', gap: '32px', maxWidth: 960 }}>
                        <CollapsibleCard title="Thông tin phòng" expanded={expandedBasic} onToggle={() => setExpandedBasic((p) => !p)}>
                            <Stack p="24px" gap="24px">
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: '24px 20px' }}>
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
                                                size="small"
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
                                        name="roomName"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="Tên phòng" fullWidth size="small" />}
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
                                                size="small"
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                            />
                                        )}
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                    <SwitchButton control={control} name="isActive" label="Hoạt động" />
                                </Box>
                            </Stack>
                        </CollapsibleCard>
                        <CollapsibleCard title="Tiện nghi, ảnh & ghi chú" expanded={expandedAmenitiesNotes} onToggle={() => setExpandedAmenitiesNotes((p) => !p)}>
                            <Stack p="24px" gap="24px">
                                <Controller
                                    name="additionalAmenities"
                                    control={control}
                                    render={({ field }) => (
                                        <AmenityMultiSelect
                                            label="Tiện nghi bổ sung"
                                            placeholder="Chọn tiện nghi chỉ riêng phòng này có (không trùng với tiện nghi đã bỏ)"
                                            value={field.value ?? ''}
                                            onChange={field.onChange}
                                            excludeIds={parseAmenityIds(removedAmenitiesValue)}
                                        />
                                    )}
                                />
                                <Controller
                                    name="removedAmenities"
                                    control={control}
                                    render={({ field }) => (
                                        <AmenityMultiSelect
                                            label="Tiện nghi đã bỏ (so với chuẩn loại phòng)"
                                            placeholder="Chọn tiện nghi phòng này không có (không trùng với tiện nghi bổ sung)"
                                            value={field.value ?? ''}
                                            onChange={field.onChange}
                                            excludeIds={parseAmenityIds(additionalAmenitiesValue)}
                                        />
                                    )}
                                />
                                <FormUploadSingleFile name="images" control={control} compact />
                                <Controller name="notes" control={control} render={({ field }) => <TextField {...field} label="Ghi chú" multiline rows={2} fullWidth size="small" placeholder="Ghi chú chung" />} />
                            </Stack>
                        </CollapsibleCard>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                type="submit"
                                disabled={isPending}
                                variant="contained"
                                sx={{
                                    background: '#1C252E',
                                    minHeight: '3rem',
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    padding: '8px 24px',
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    '&:hover': { background: '#454F5B' },
                                }}
                            >
                                {isPending ? 'Đang lưu...' : 'Tạo phòng'}
                            </Button>
                        </Box>
                    </Stack>
                </form>
            </ThemeProvider>
        </>
    );
};
