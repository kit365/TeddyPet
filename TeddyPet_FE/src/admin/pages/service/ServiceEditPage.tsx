import { Box, Stack, TextField, ThemeProvider, useTheme, Button, CircularProgress, MenuItem, IconButton, Select, InputLabel, FormControl, Checkbox, ListItemText, Typography, Switch, Chip, Card } from '@mui/material';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Title } from '../../components/ui/Title';
import { useState, useEffect, useRef } from 'react';
import { CollapsibleCard } from '../../components/ui/CollapsibleCard';
import { useServiceDetail, useUpdateService } from './hooks/useService';
import { useServiceCategories } from './hooks/useServiceCategory';
import { usePetTypes } from './hooks/useEnums';
import { useServicePricings } from './hooks/useService';
import { useCreateServicePricing, useUpdateServicePricing, useDeleteServicePricing } from './hooks/useServicePricing';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { serviceUpsertSchema, type ServiceUpsertFormValues } from '../../schemas/service.schema';
import { SwitchButton } from '../../components/ui/SwitchButton';
import { getServiceTheme } from './configs/theme';
import { getPetTypeLabel } from './configs/constants';
import { prefixAdmin } from '../../constants/routes';
import { FormUploadSingleFile } from '../../components/upload/FormUploadSingleFile';
import { FormUploadMultiFile } from '../../components/upload/FormUploadMultiFile';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ServicePricingFormModal } from './components/ServicePricingFormModal';
import type { IServicePricing } from './configs/types';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { createDeletePricingHandler, createOnPricingSubmit } from './serviceEditHelpers';
import dayjs from 'dayjs';
import { TimeSlotsSection } from './components/TimeSlotsSection';
import { useRoomTypes } from '../room/hooks/useRoomType';
import { updateRoomTypeServiceId } from '../../api/room.api';

export const ServiceEditPage = () => {
    const { id } = useParams();
    const serviceId = id ? Number(id) : 0;
    const [expanded1, setExpanded1] = useState(true);
    const [expanded2, setExpanded2] = useState(true);
    const [expandedPricing, setExpandedPricing] = useState(true);
    const [pricingModalOpen, setPricingModalOpen] = useState(false);
    const [editingPricing, setEditingPricing] = useState<IServicePricing | null>(null);
    const [selectedRoomTypeIds, setSelectedRoomTypeIds] = useState<number[]>([]);
    const selectedRoomTypeIdsRef = useRef<number[]>([]);

    const theme = useTheme();
    const localTheme = getServiceTheme(theme);
    const { data: detailRes, isLoading } = useServiceDetail(id);
    const { data: categories = [] } = useServiceCategories();
    const { data: petTypes = [] } = usePetTypes();
    const { data: pricings = [] } = useServicePricings(serviceId);
    const { data: roomTypes = [] } = useRoomTypes();
    const { data: roomTypesForService = [] } = useRoomTypes(detailRes?.data?.isRequiredRoom ? serviceId : null);
    const queryClient = useQueryClient();
    const { mutate: update, isPending } = useUpdateService();
    const { mutate: createPricing, isPending: isPricingCreating } = useCreateServicePricing();
    const { mutate: updatePricing, isPending: isPricingUpdating } = useUpdateServicePricing();
    const { mutate: deletePricing } = useDeleteServicePricing();

    const { control, handleSubmit, reset } = useForm<ServiceUpsertFormValues>({
        resolver: zodResolver(serviceUpsertSchema) as any,
        defaultValues: {
            serviceCategoryId: 0,
            code: '',
            serviceName: '',
            duration: 60,
            isActive: true,
            isPopular: false,
            isAddon: false,
            isAdditionalCharge: false,
            isCritical: false,
            requiresVaccination: false,
        },
    });

    const isAddon = useWatch({ control, name: 'isAddon' });
    const isAdditionalCharge = useWatch({ control, name: 'isAdditionalCharge' });
    const isRequiredRoom = useWatch({ control, name: 'isRequiredRoom' });

    useEffect(() => {
        selectedRoomTypeIdsRef.current = selectedRoomTypeIds;
    }, [selectedRoomTypeIds]);

    useEffect(() => {
        if (detailRes?.data && roomTypes.length > 0) {
            const linked = roomTypes.filter((rt) => rt.serviceId === serviceId).map((rt) => rt.roomTypeId);
            setSelectedRoomTypeIds(linked);
        }
    }, [detailRes?.data, serviceId, roomTypes.length]);

    useEffect(() => {
        if (detailRes?.data) {
            const d = detailRes.data;
            reset({
                serviceId: d.serviceId,
                serviceCategoryId: d.serviceCategoryId,
                code: d.code ?? '',
                serviceName: d.serviceName ?? '',
                suitablePetTypes: d.suitablePetTypes ?? [],
                slug: d.slug ?? '',
                shortDescription: d.shortDescription ?? '',
                description: d.description ?? '',
                duration: d.duration ?? 60,
                bufferTime: d.bufferTime ?? undefined,
                maxPetsPerSession: d.maxPetsPerSession ?? undefined,
                advanceBookingHours: d.advanceBookingHours ?? undefined,
                cancellationDeadlineHours: d.cancellationDeadlineHours ?? undefined,
                imageURL: d.imageURL ?? '',
                galleryImages: d.galleryImages ?? [],
                requiredStaffCount: d.requiredStaffCount ?? undefined,
                requiredCertifications: d.requiredCertifications ?? '',
                requiresVaccination: d.requiresVaccination ?? undefined,
                displayOrder: d.displayOrder ?? undefined,
                isPopular: d.isPopular ?? undefined,
                isAddon: d.isAddon ?? undefined,
                isAdditionalCharge: d.isAdditionalCharge ?? undefined,
                isCritical: d.isCritical ?? undefined,
                addonType: d.addonType ?? '',
                metaTitle: d.metaTitle ?? '',
                metaDescription: d.metaDescription ?? '',
                isActive: d.isActive ?? true,
                isRequiredRoom: d.isRequiredRoom ?? false,
            });
        }
    }, [detailRes, reset]);

    const onSubmit = (data: ServiceUpsertFormValues) => {
        const payload = {
            serviceId: serviceId,
            serviceCategoryId: data.serviceCategoryId,
            code: data.code,
            serviceName: data.serviceName,
            suitablePetTypes: data.suitablePetTypes && data.suitablePetTypes.length > 0 ? data.suitablePetTypes : null,
            slug: data.slug || null,
            shortDescription: data.shortDescription || null,
            description: data.description || null,
            duration: data.duration,
            bufferTime: data.bufferTime ?? null,
            maxPetsPerSession: data.maxPetsPerSession ?? null,
            advanceBookingHours: data.advanceBookingHours ?? null,
            cancellationDeadlineHours: data.cancellationDeadlineHours ?? null,
            imageURL: data.imageURL || null,
            galleryImages: data.galleryImages && data.galleryImages.length > 0 ? data.galleryImages : null,
            requiredStaffCount: data.requiredStaffCount ?? null,
            requiredCertifications: data.requiredCertifications || null,
            requiresVaccination: data.requiresVaccination ?? null,
            displayOrder: data.displayOrder ?? null,
            isPopular: data.isPopular ?? null,
            isAddon: data.isAddon ?? null,
            isAdditionalCharge: data.isAdditionalCharge ?? null,
            isCritical: data.isCritical ?? null,
            addonType: data.isAddon ? (data.addonType || null) : null,
            metaTitle: data.metaTitle || null,
            metaDescription: data.metaDescription || null,
            isActive: data.isActive,
            isRequiredRoom: data.isRequiredRoom ?? false,
        };
        update(payload, {
            onSuccess: async (res: any) => {
                if (res?.success) {
                    const ids = selectedRoomTypeIdsRef.current;
                    if (payload.isRequiredRoom && roomTypes.length > 0) {
                        try {
                            for (const rt of roomTypes) {
                                const shouldLink = ids.includes(rt.roomTypeId);
                                const currentlyLinked = rt.serviceId === serviceId;
                                if (shouldLink && !currentlyLinked) {
                                    await updateRoomTypeServiceId(rt.roomTypeId, serviceId);
                                } else if (!shouldLink && currentlyLinked) {
                                    await updateRoomTypeServiceId(rt.roomTypeId, null);
                                }
                            }
                        } catch {
                            toast.error('Cập nhật dịch vụ thành công nhưng gắn loại phòng có lỗi.');
                        }
                    } else if (!payload.isRequiredRoom) {
                        for (const rt of roomTypes) {
                            if (rt.serviceId === serviceId) {
                                await updateRoomTypeServiceId(rt.roomTypeId, null);
                            }
                        }
                    }
                    toast.success(res.message ?? 'Cập nhật thành công');
                    queryClient.invalidateQueries({ queryKey: ['room-types'] });
                } else toast.error(res?.message ?? 'Có lỗi');
            },
        });
    };

    const onPricingSubmit = createOnPricingSubmit(
        serviceId,
        editingPricing,
        updatePricing,
        createPricing,
        setPricingModalOpen,
        setEditingPricing
    );

    const handleDeletePricing = createDeletePricingHandler(deletePricing);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <div className="mb-[40px] flex items-start justify-end">
                <div className="mr-auto">
                    <Title title="Sửa dịch vụ" />
                    <Breadcrumb
                        items={[
                            { label: 'Trang chủ', to: '/' },
                            { label: 'Quản lý dịch vụ', to: `/${prefixAdmin}/service/list` },
                            { label: 'Sửa dịch vụ' },
                        ]}
                    />
                </div>
            </div>
            <ThemeProvider theme={localTheme}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Stack sx={{ margin: '0px 120px', gap: '40px' }}>
                        <CollapsibleCard title="Thông tin cơ bản" expanded={expanded1} onToggle={() => setExpanded1((p) => !p)}>
                            <Stack p="24px" gap="24px">
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px 16px' }}>
                                    <Controller
                                        name="serviceCategoryId"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                {...field}
                                                select
                                                label="Danh mục dịch vụ"
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
                                                fullWidth
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(Number(e.target.value))}
                                            >
                                                {categories.map((c) => (
                                                    <MenuItem key={c.categoryId} value={c.categoryId}>
                                                        {c.categoryName}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        )}
                                    />
                                    <Controller
                                        name="code"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField {...field} label="Mã dịch vụ" error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
                                        )}
                                    />
                                    <Controller
                                        name="serviceName"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField {...field} label="Tên dịch vụ" error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
                                        )}
                                    />
                                    <Controller name="slug" control={control} render={({ field }) => <TextField {...field} label="Slug" fullWidth />} />
                                    <Controller
                                        name="duration"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                label="Thời lượng (phút)"
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
                                                fullWidth
                                                onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value) || 0)}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="suitablePetTypes"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControl fullWidth>
                                                <InputLabel id="suitable-pet-types-label">Loại thú cưng phù hợp</InputLabel>
                                                <Select
                                                    labelId="suitable-pet-types-label"
                                                    multiple
                                                    value={Array.isArray(field.value) ? field.value : []}
                                                    label="Loại thú cưng phù hợp"
                                                    renderValue={(selected) => (Array.isArray(selected) ? selected : []).map(getPetTypeLabel).join(', ')}
                                                    onChange={(e) => field.onChange(e.target.value as string[])}
                                                    sx={{ '& .MuiSelect-select': { fontSize: '1.0625rem' } }}
                                                    MenuProps={{
                                                        PaperProps: { sx: { '& .MuiMenuItem-root .MuiListItemText-primary': { fontSize: '1.0625rem' } } },
                                                    }}
                                                >
                                                    {petTypes.map((pt) => (
                                                        <MenuItem key={pt} value={pt}>
                                                            <Checkbox checked={(Array.isArray(field.value) ? field.value : []).includes(pt)} />
                                                            <ListItemText primary={getPetTypeLabel(pt)} primaryTypographyProps={{ fontSize: '1.0625rem' }} />
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        )}
                                    />
                                </Box>
                                <Controller
                                    name="shortDescription"
                                    control={control}
                                    render={({ field }) => <TextField {...field} label="Mô tả ngắn" multiline rows={2} fullWidth />}
                                />
                                <Controller name="description" control={control} render={({ field }) => <TextField {...field} label="Mô tả chi tiết" multiline rows={4} fullWidth />} />
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                    <FormUploadSingleFile name="imageURL" control={control} compact />
                                    <FormUploadMultiFile name="galleryImages" control={control} title="Gallery" compact />
                                </Box>

                                <Box sx={{ mt: 3 }}>
                                    <SwitchButton control={control} name="isRequiredRoom" label="Yêu cầu phòng (dịch vụ gắn loại phòng)" />
                                </Box>
                                {isRequiredRoom && (
                                    <Box sx={{ mt: 3, p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
                                        <Typography sx={{ fontSize: '1.4rem', fontWeight: 600, mb: 1 }}>Loại phòng gắn với dịch vụ này</Typography>
                                        <Typography sx={{ fontSize: '1.2rem', color: 'text.secondary', mb: 3 }}>
                                            Chọn các loại phòng sẽ được sử dụng cho dịch vụ này. Một loại phòng chỉ có thể gắn với một dịch vụ.
                                        </Typography>

                                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2 }}>
                                            {roomTypes.map((rt) => {
                                                const isSelected = selectedRoomTypeIds.includes(rt.roomTypeId);
                                                const currentService = rt.serviceName;
                                                const isOtherService = !!(currentService && rt.serviceId && rt.serviceId !== serviceId);
                                                const isDisabled = isOtherService && !isSelected;

                                                return (
                                                    <Card
                                                        key={rt.roomTypeId}
                                                        variant="outlined"
                                                        sx={{
                                                            p: 2,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            borderRadius: 2,
                                                            transition: 'all 0.2s',
                                                            borderColor: isSelected ? 'primary.main' : 'divider',
                                                            bgcolor: isSelected ? 'primary.lighter' : isDisabled ? 'action.disabledBackground' : 'background.paper',
                                                            opacity: isDisabled ? 0.55 : 1,
                                                            cursor: isDisabled ? 'not-allowed' : 'default',
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                            <Typography sx={{ fontSize: '1.3rem', fontWeight: 600, color: isSelected ? 'primary.main' : isDisabled ? 'text.disabled' : 'text.primary' }}>
                                                                {rt.typeName}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Typography sx={{ fontSize: '1.1rem', color: 'text.secondary' }}>Dịch vụ:</Typography>
                                                                {currentService ? (
                                                                    <Chip
                                                                        label={currentService}
                                                                        size="small"
                                                                        color={rt.serviceId === serviceId ? "primary" : "default"}
                                                                        sx={{ height: 20, fontSize: '1rem' }}
                                                                    />
                                                                ) : (
                                                                    <Typography sx={{ fontSize: '1.1rem', color: 'text.secondary', fontStyle: 'italic' }}>Chưa gắn</Typography>
                                                                )}
                                                            </Box>
                                                            {isDisabled && (
                                                                <Typography sx={{ fontSize: '0.95rem', color: 'warning.main', mt: 0.5 }}>
                                                                    Đã thuộc dịch vụ khác — không thể chọn
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        <Switch
                                                            checked={isSelected}
                                                            disabled={isDisabled}
                                                            onChange={(_, checked) => {
                                                                setSelectedRoomTypeIds((prev) =>
                                                                    checked ? [...prev, rt.roomTypeId] : prev.filter((id) => id !== rt.roomTypeId)
                                                                );
                                                            }}
                                                            color="primary"
                                                        />
                                                    </Card>
                                                );
                                            })}
                                        </Box>
                                        {roomTypes.length === 0 && (
                                            <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary', fontSize: '1.3rem', bgcolor: 'background.paper', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                                                Chưa có loại phòng nào trong hệ thống. <br />
                                                <Typography component="span" sx={{ fontSize: '1.1rem', mt: 1, display: 'block' }}>Vui lòng tạo tại Quản lý phòng → Danh sách loại phòng.</Typography>
                                            </Box>
                                        )}

                                    </Box>
                                )}
                            </Stack>
                        </CollapsibleCard>
                        <CollapsibleCard title="Cài đặt thêm" expanded={expanded2} onToggle={() => setExpanded2((p) => !p)}>
                            <Stack p="24px" gap="24px">
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px 16px' }}>
                                    <Controller name="bufferTime" control={control} render={({ field }) => <TextField {...field} type="number" label="Thời gian đệm (phút)" fullWidth onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value) || undefined)} />} />
                                    <Controller name="advanceBookingHours" control={control} render={({ field }) => <TextField {...field} type="number" label="Đặt trước tối thiểu (giờ)" fullWidth onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value) || undefined)} />} />
                                    <Controller name="cancellationDeadlineHours" control={control} render={({ field }) => <TextField {...field} type="number" label="Hạn hủy (giờ)" fullWidth onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value) || undefined)} />} />
                                        <Controller name="maxPetsPerSession" control={control} render={({ field }) => <TextField {...field} type="number" label="Số thú cưng tham gia cho mỗi phiên" fullWidth onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value) || undefined)} />} />
                                    <Controller name="requiredStaffCount" control={control} render={({ field }) => <TextField {...field} type="number" label="Số nhân viên yêu cầu" fullWidth onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value) || undefined)} />} />
                                    <Controller name="displayOrder" control={control} render={({ field }) => <TextField {...field} type="number" label="Thứ tự hiển thị" fullWidth onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value) || undefined)} />} />
                                    <Controller
                                        name="addonType"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="Addon type" fullWidth disabled={!isAddon} />}
                                    />
                                </Box>

                                <Controller
                                    name="requiredCertifications"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} label="Chứng chỉ yêu cầu (mỗi dòng 1 chứng chỉ)" multiline rows={3} fullWidth />
                                    )}
                                />

                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px 16px' }}>
                                    <Controller name="metaTitle" control={control} render={({ field }) => <TextField {...field} label="Meta title" fullWidth />} />
                                    <Controller name="metaDescription" control={control} render={({ field }) => <TextField {...field} label="Meta description" multiline rows={2} fullWidth />} />
                                </Box>

                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                    <SwitchButton control={control} name="isActive" label="Hoạt động" />
                                    <SwitchButton control={control} name="isPopular" label="Nổi bật" />
                                    <SwitchButton control={control} name="isAddon" label="Dịch vụ add-on" />
                                    <SwitchButton control={control} name="isAdditionalCharge" label="Additional charge (nhân viên thêm)" />
                                    <SwitchButton control={control} name="isCritical" label="Quan trọng" />
                                    <SwitchButton control={control} name="requiresVaccination" label="Yêu cầu tiêm vaccine" />
                                </Box>
                            </Stack>
                        </CollapsibleCard>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <Button
                                type="submit"
                                disabled={isPending}
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
                                variant="contained"
                            >
                                {isPending ? 'Đang lưu...' : 'Cập nhật dịch vụ'}
                            </Button>
                        </Box>
                        <CollapsibleCard title="Quy tắc giá" subheader="Giá dịch vụ theo quy tắc (service_pricing)" expanded={expandedPricing} onToggle={() => setExpandedPricing((p) => !p)}>
                            <Stack p="24px" gap="24px">
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '1.4rem', color: '#637381' }}>Thêm, sửa hoặc xóa quy tắc giá cho dịch vụ này.</span>
                                    <Button
                                        startIcon={<AddIcon />}
                                        variant="outlined"
                                        size="medium"
                                        onClick={() => {
                                            setEditingPricing(null);
                                            setPricingModalOpen(true);
                                        }}
                                        sx={{ fontSize: '1.125rem' }}
                                    >
                                        Thêm quy tắc giá
                                    </Button>
                                </Box>
                                <Table
                                    size="medium"
                                    sx={{
                                        '& .MuiTableCell-root': {
                                            fontSize: '1.35rem',
                                            paddingTop: '10px',
                                            paddingBottom: '10px',
                                        },
                                        '& .MuiTableHead-root .MuiTableCell-root': {
                                            fontSize: '1.5rem',
                                            fontWeight: 700,
                                        },
                                    }}
                                >
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Tên quy tắc</TableCell>
                                            <TableCell align="left">Giá (VNĐ)</TableCell>
                                            <TableCell align="left">Cân nặng (kg)</TableCell>
                                            {detailRes?.data?.isRequiredRoom && <TableCell>Loại phòng</TableCell>}
                                            <TableCell>Loại thú phù hợp</TableCell>
                                            <TableCell>Hiệu lực (từ / đến)</TableCell>
                                            <TableCell align="left">Ưu tiên</TableCell>
                                            <TableCell>Trạng thái</TableCell>
                                            <TableCell align="left"></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {pricings.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={detailRes?.data?.isRequiredRoom ? 9 : 8} sx={{ color: '#637381', py: 3, fontSize: '1.35rem' }}>
                                                    Chưa có quy tắc giá. Nhấn &quot;Thêm quy tắc giá&quot; để thêm.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            [...pricings].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0)).map((p) => (
                                                <TableRow key={p.pricingId}>
                                                    <TableCell>{p.pricingName}</TableCell>
                                                    <TableCell align="left">{Number(p.price).toLocaleString('vi-VN')}</TableCell>
                                                    <TableCell align="left">
                                                        {p.minWeight != null || p.maxWeight != null
                                                            ? `${p.minWeight ?? '—'} - ${p.maxWeight ?? '—'}`
                                                            : '—'}
                                                    </TableCell>
                                                    {detailRes?.data?.isRequiredRoom && (
                                                        <TableCell>{p.roomTypeName ?? '—'}</TableCell>
                                                    )}
                                                    <TableCell>
                                                        {p.suitablePetTypes
                                                            ? p.suitablePetTypes
                                                                .split(',')
                                                                .map((s) => s.trim())
                                                                .filter(Boolean)
                                                                .map(getPetTypeLabel)
                                                                .join(', ')
                                                            : '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {p.effectiveFrom || p.effectiveTo
                                                            ? `${p.effectiveFrom ? dayjs(p.effectiveFrom).format('DD/MM/YYYY') : '—'} → ${p.effectiveTo ? dayjs(p.effectiveTo).format('DD/MM/YYYY') : '—'
                                                            }`
                                                            : '—'}
                                                    </TableCell>
                                                    <TableCell align="left">{p.priority}</TableCell>
                                                    <TableCell>{p.isActive ? 'Hoạt động' : 'Tạm dừng'}</TableCell>
                                                    <TableCell align="left">
                                                        <IconButton size="small" onClick={() => { setEditingPricing(p); setPricingModalOpen(true); }}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton size="small" color="error" onClick={() => handleDeletePricing(p.pricingId)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </Stack>
                        </CollapsibleCard>
                        {!isAddon && !isAdditionalCharge && <TimeSlotsSection serviceId={serviceId} expanded={true} />}

                    </Stack>
                </form>
            </ThemeProvider>
            <ServicePricingFormModal
                open={pricingModalOpen}
                onClose={() => { setPricingModalOpen(false); setEditingPricing(null); }}
                serviceId={serviceId}
                isRequiredRoom={detailRes?.data?.isRequiredRoom ?? false}
                roomTypes={roomTypesForService}
                editingRule={editingPricing}
                onSubmit={onPricingSubmit}
                isPending={isPricingCreating || isPricingUpdating}
            />
        </>
    );
};
