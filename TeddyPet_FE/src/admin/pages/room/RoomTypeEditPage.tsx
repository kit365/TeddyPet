import { Box, Stack, TextField, ThemeProvider, useTheme, Button, MenuItem, CircularProgress } from '@mui/material';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Title } from '../../components/ui/Title';
import { useState, useEffect } from 'react';
import { CollapsibleCard } from '../../components/ui/CollapsibleCard';
import { useRoomTypeDetail, useUpdateRoomType } from './hooks/useRoomType';
import { useQuery } from '@tanstack/react-query';
import { getServices } from '../../api/service.api';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { roomTypeUpsertSchema, type RoomTypeUpsertFormValues } from '../../schemas/room-type.schema';
import { SwitchButton } from '../../components/ui/SwitchButton';
import { getServiceTheme } from '../service/configs/theme';
import { prefixAdmin } from '../../constants/routes';
import { FormUploadSingleFile } from '../../components/upload/FormUploadSingleFile';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';

const parseCommaList = (s: string | undefined | null): string[] | null => {
    if (s == null || String(s).trim() === '') return null;
    return String(s)
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
};

export const RoomTypeEditPage = () => {
    const { id } = useParams();
    const [expanded, setExpanded] = useState(true);
    const [expandedExtra, setExpandedExtra] = useState(true);
    const [expandedSeo, setExpandedSeo] = useState(false);
    const theme = useTheme();
    const localTheme = getServiceTheme(theme);

    const { data: detailRes, isLoading } = useRoomTypeDetail(id);
    const { data: servicesRequiredRoom = [] } = useQuery({
        queryKey: ['services', 'isRequiredRoom'],
        queryFn: () => getServices({ isRequiredRoom: true }),
        select: (res) => res.data ?? [],
    });

    const { control, handleSubmit, reset } = useForm<RoomTypeUpsertFormValues>({
        resolver: zodResolver(roomTypeUpsertSchema),
        defaultValues: {
            roomTypeId: undefined,
            typeName: '',
            displayTypeName: '',
            slug: '',
            description: '',
            shortDescription: '',
            imageUrl: '',
            galleryImages: null,
            minArea: undefined,
            maxArea: undefined,
            maxPets: undefined,
            minPetWeight: undefined,
            maxPetWeight: undefined,
            suitablePetSizes: '',
            suitablePetTypes: null,
            basePricePerNight: undefined,
            standardAmenities: '',
            features: '',
            displayOrder: 0,
            cancellationPolicy: '',
            requiresVaccination: true,
            requiresHealthCheck: false,
            totalRooms: undefined,
            metaTitle: '',
            metaDescription: '',
            keywords: '',
            serviceId: null,
            isActive: true,
        },
    });

    useEffect(() => {
        if (detailRes?.data) {
            const d = detailRes.data;
            reset({
                roomTypeId: d.roomTypeId,
                typeName: d.typeName ?? '',
                displayTypeName: d.displayTypeName ?? '',
                slug: d.slug ?? '',
                description: d.description ?? '',
                shortDescription: d.shortDescription ?? '',
                imageUrl: d.imageUrl ?? '',
                galleryImages: d.galleryImages ?? null,
                minArea: d.minArea ?? undefined,
                maxArea: d.maxArea ?? undefined,
                maxPets: d.maxPets ?? undefined,
                minPetWeight: d.minPetWeight ?? undefined,
                maxPetWeight: d.maxPetWeight ?? undefined,
                suitablePetSizes: d.suitablePetSizes ?? '',
                suitablePetTypes: d.suitablePetTypes ?? null,
                basePricePerNight: d.basePricePerNight ?? undefined,
                standardAmenities: d.standardAmenities ?? '',
                features: d.features ?? '',
                displayOrder: d.displayOrder ?? undefined,
                cancellationPolicy: d.cancellationPolicy ?? '',
                requiresVaccination: d.requiresVaccination ?? true,
                requiresHealthCheck: d.requiresHealthCheck ?? false,
                totalRooms: d.totalRooms ?? undefined,
                metaTitle: d.metaTitle ?? '',
                metaDescription: d.metaDescription ?? '',
                keywords: d.keywords ?? '',
                serviceId: d.serviceId ?? null,
                isActive: d.isActive ?? true,
            });
        }
    }, [detailRes, reset]);

    const { mutate: update, isPending } = useUpdateRoomType();

    const onSubmit = (data: RoomTypeUpsertFormValues) => {
        update(
            {
                roomTypeId: Number(id),
                typeName: data.typeName,
                displayTypeName: data.displayTypeName || null,
                slug: data.slug || null,
                description: data.description || null,
                shortDescription: data.shortDescription || null,
                imageUrl: data.imageUrl || null,
                galleryImages: data.galleryImages?.length ? data.galleryImages : null,
                minArea: data.minArea ?? null,
                maxArea: data.maxArea ?? null,
                maxPets: data.maxPets ?? null,
                minPetWeight: data.minPetWeight ?? null,
                maxPetWeight: data.maxPetWeight ?? null,
                suitablePetSizes: data.suitablePetSizes || null,
                suitablePetTypes: data.suitablePetTypes?.length ? data.suitablePetTypes : null,
                basePricePerNight: data.basePricePerNight ?? null,
                standardAmenities: data.standardAmenities || null,
                features: data.features || null,
                displayOrder: data.displayOrder ?? null,
                cancellationPolicy: data.cancellationPolicy || null,
                requiresVaccination: data.requiresVaccination ?? true,
                requiresHealthCheck: data.requiresHealthCheck ?? false,
                totalRooms: data.totalRooms ?? null,
                metaTitle: data.metaTitle || null,
                metaDescription: data.metaDescription || null,
                keywords: data.keywords || null,
                serviceId: data.serviceId ?? null,
                isActive: data.isActive ?? true,
            },
            {
                onSuccess: (res) => {
                    if (res?.success) toast.success(res.message ?? 'Cập nhật loại phòng thành công');
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
                    <Title title="Sửa loại phòng" />
                    <Breadcrumb
                        items={[
                            { label: 'Trang chủ', to: '/' },
                            { label: 'Quản lý phòng', to: `/${prefixAdmin}/room-type/list` },
                            { label: 'Danh sách loại phòng', to: `/${prefixAdmin}/room-type/list` },
                            { label: 'Sửa' },
                        ]}
                    />
                </div>
            </div>
            <ThemeProvider theme={localTheme}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Stack sx={{ margin: '0px 120px', gap: '40px' }}>
                        <CollapsibleCard title="Thông tin loại phòng" expanded={expanded} onToggle={() => setExpanded((p) => !p)}>
                            <Stack p="24px" gap="24px">
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px 16px' }}>
                                    <Controller
                                        name="serviceId"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                select
                                                label="Dịch vụ (chỉ dịch vụ yêu cầu phòng)"
                                                fullWidth
                                                value={field.value ?? ''}
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    field.onChange(v === '' ? null : Number(v));
                                                }}
                                            >
                                                <MenuItem value="">— Không chọn —</MenuItem>
                                                {servicesRequiredRoom.map((s) => (
                                                    <MenuItem key={s.serviceId} value={s.serviceId}>
                                                        {s.serviceName}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        )}
                                    />
                                    <Controller
                                        name="typeName"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                {...field}
                                                label="Tên loại phòng"
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
                                                fullWidth
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="displayTypeName"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="Tên hiển thị" fullWidth />}
                                    />
                                    <Controller name="slug" control={control} render={({ field }) => <TextField {...field} label="Slug" fullWidth />} />
                                    <Controller
                                        name="basePricePerNight"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                label="Giá đêm (VNĐ)"
                                                fullWidth
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="displayOrder"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                label="Thứ tự"
                                                fullWidth
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="totalRooms"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                label="Tổng số phòng"
                                                fullWidth
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="maxPets"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                label="Số thú cưng tối đa"
                                                fullWidth
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                            />
                                        )}
                                    />
                                </Box>
                                <Controller
                                    name="shortDescription"
                                    control={control}
                                    render={({ field }) => <TextField {...field} label="Mô tả ngắn" multiline rows={2} fullWidth />}
                                />
                                <Controller name="description" control={control} render={({ field }) => <TextField {...field} label="Mô tả" multiline rows={4} fullWidth />} />
                                <FormUploadSingleFile name="imageUrl" control={control} compact />
                                <Controller
                                    name="galleryImages"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            label="Ảnh gallery (URL, cách nhau bằng dấu phẩy)"
                                            fullWidth
                                            value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                                            onChange={(e) => {
                                                const arr = parseCommaList(e.target.value);
                                                field.onChange(arr && arr.length > 0 ? arr : null);
                                            }}
                                        />
                                    )}
                                />
                                <SwitchButton control={control} name="isActive" label="Hoạt động" />
                            </Stack>
                        </CollapsibleCard>
                        <CollapsibleCard title="Diện tích, cân nặng thú cưng & tiện nghi" expanded={expandedExtra} onToggle={() => setExpandedExtra((p) => !p)}>
                            <Stack p="24px" gap="24px">
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px 16px' }}>
                                    <Controller
                                        name="minArea"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                label="Diện tích tối thiểu (m²)"
                                                fullWidth
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="maxArea"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                label="Diện tích tối đa (m²)"
                                                fullWidth
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="minPetWeight"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                label="Cân nặng thú cưng tối thiểu (kg)"
                                                fullWidth
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="maxPetWeight"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                label="Cân nặng thú cưng tối đa (kg)"
                                                fullWidth
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="suitablePetSizes"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="Kích thước thú cưng phù hợp" fullWidth placeholder="VD: S, M, L" />}
                                    />
                                    <Controller
                                        name="suitablePetTypes"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                label="Loại thú cưng phù hợp (cách nhau bằng dấu phẩy)"
                                                fullWidth
                                                value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                                                onChange={(e) => {
                                                    const arr = parseCommaList(e.target.value);
                                                    field.onChange(arr && arr.length > 0 ? arr : null);
                                                }}
                                                placeholder="VD: dog, cat"
                                            />
                                        )}
                                    />
                                </Box>
                                <Controller
                                    name="standardAmenities"
                                    control={control}
                                    render={({ field }) => <TextField {...field} label="Tiện nghi chuẩn" multiline rows={3} fullWidth placeholder="Mỗi mục một dòng hoặc cách nhau bằng dấu phẩy" />}
                                />
                                <Controller
                                    name="features"
                                    control={control}
                                    render={({ field }) => <TextField {...field} label="Tính năng / Điểm nổi bật" multiline rows={3} fullWidth />}
                                />
                                <Controller
                                    name="cancellationPolicy"
                                    control={control}
                                    render={({ field }) => <TextField {...field} label="Chính sách hủy phòng" multiline rows={4} fullWidth />}
                                />
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                    <SwitchButton control={control} name="requiresVaccination" label="Yêu cầu tiêm vaccine" />
                                    <SwitchButton control={control} name="requiresHealthCheck" label="Yêu cầu kiểm tra sức khỏe" />
                                </Box>
                            </Stack>
                        </CollapsibleCard>
                        <CollapsibleCard title="SEO (meta title, description, keywords)" expanded={expandedSeo} onToggle={() => setExpandedSeo((p) => !p)}>
                            <Stack p="24px" gap="24px">
                                <Controller name="metaTitle" control={control} render={({ field }) => <TextField {...field} label="Meta title" fullWidth inputProps={{ maxLength: 150 }} />} />
                                <Controller name="metaDescription" control={control} render={({ field }) => <TextField {...field} label="Meta description" fullWidth multiline rows={2} inputProps={{ maxLength: 255 }} />} />
                                <Controller name="keywords" control={control} render={({ field }) => <TextField {...field} label="Keywords" fullWidth multiline rows={2} />} />
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
                                {isPending ? 'Đang lưu...' : 'Cập nhật loại phòng'}
                            </Button>
                        </Box>
                    </Stack>
                </form>
            </ThemeProvider>
        </>
    );
};
