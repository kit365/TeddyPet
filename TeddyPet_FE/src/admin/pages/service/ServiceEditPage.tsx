import { Box, Stack, TextField, ThemeProvider, useTheme, Button, CircularProgress, MenuItem, IconButton, Select, InputLabel, FormControl, Checkbox, ListItemText } from '@mui/material';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Title } from '../../components/ui/Title';
import { useState, useEffect } from 'react';
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
import { prefixAdmin } from '../../constants/routes';
import { FormUploadSingleFile } from '../../components/upload/FormUploadSingleFile';
import { FormUploadMultiFile } from '../../components/upload/FormUploadMultiFile';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
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

export const ServiceEditPage = () => {
    const { id } = useParams();
    const serviceId = id ? Number(id) : 0;
    const [expanded1, setExpanded1] = useState(true);
    const [expanded2, setExpanded2] = useState(true);
    const [expandedPricing, setExpandedPricing] = useState(true);
    const [pricingModalOpen, setPricingModalOpen] = useState(false);
    const [editingPricing, setEditingPricing] = useState<IServicePricing | null>(null);

    const theme = useTheme();
    const localTheme = getServiceTheme(theme);
    const { data: detailRes, isLoading } = useServiceDetail(id);
    const { data: categories = [] } = useServiceCategories();
    const { data: petTypes = [] } = usePetTypes();
    const { data: pricings = [] } = useServicePricings(serviceId);
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
            isCritical: false,
            requiresVaccination: false,
        },
    });

    const isAddon = useWatch({ control, name: 'isAddon' });

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
                priceUnit: d.priceUnit ?? '',
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
                isCritical: d.isCritical ?? undefined,
                addonType: d.addonType ?? '',
                metaTitle: d.metaTitle ?? '',
                metaDescription: d.metaDescription ?? '',
                isActive: d.isActive ?? true,
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
            priceUnit: data.priceUnit || null,
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
            isCritical: data.isCritical ?? null,
            addonType: data.isAddon ? (data.addonType || null) : null,
            metaTitle: data.metaTitle || null,
            metaDescription: data.metaDescription || null,
            isActive: data.isActive,
        };
        update(payload, {
            onSuccess: (res: any) => {
                if (res?.success) toast.success(res.message ?? 'Cập nhật thành công');
                else toast.error(res?.message ?? 'Có lỗi');
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
                                        name="priceUnit"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="Đơn vị giá" fullWidth />}
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
                                                    value={field.value ?? []}
                                                    label="Loại thú cưng phù hợp"
                                                    renderValue={(selected) => (selected as string[]).join(', ')}
                                                    onChange={(e) => field.onChange(e.target.value as string[])}
                                                >
                                                    {petTypes.map((pt) => (
                                                        <MenuItem key={pt} value={pt}>
                                                            <Checkbox checked={(field.value ?? []).includes(pt)} />
                                                            <ListItemText primary={pt} />
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
                                <FormUploadSingleFile name="imageURL" control={control} />
                                <FormUploadMultiFile name="galleryImages" control={control} title="Gallery images" />
                            </Stack>
                        </CollapsibleCard>
                        <CollapsibleCard title="Cài đặt thêm" expanded={expanded2} onToggle={() => setExpanded2((p) => !p)}>
                            <Stack p="24px" gap="24px">
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px 16px' }}>
                                    <Controller name="bufferTime" control={control} render={({ field }) => <TextField {...field} type="number" label="Thời gian đệm (phút)" fullWidth onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value) || undefined)} />} />
                                    <Controller name="advanceBookingHours" control={control} render={({ field }) => <TextField {...field} type="number" label="Đặt trước tối thiểu (giờ)" fullWidth onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value) || undefined)} />} />
                                    <Controller name="cancellationDeadlineHours" control={control} render={({ field }) => <TextField {...field} type="number" label="Hạn hủy (giờ)" fullWidth onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value) || undefined)} />} />
                                    <Controller name="maxPetsPerSession" control={control} render={({ field }) => <TextField {...field} type="number" label="Số thú tối đa/lịch" fullWidth onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value) || undefined)} />} />
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
                                    <SwitchButton control={control} name="isCritical" label="Quan trọng" />
                                    <SwitchButton control={control} name="requiresVaccination" label="Yêu cầu tiêm vaccine" />
                                </Box>
                            </Stack>
                        </CollapsibleCard>
                        <CollapsibleCard title="Quy tắc giá" subheader="Giá dịch vụ theo quy tắc (service_pricing)" expanded={expandedPricing} onToggle={() => setExpandedPricing((p) => !p)}>
                            <Stack p="24px" gap="24px">
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '1.4rem', color: '#637381' }}>Thêm, sửa hoặc xóa quy tắc giá cho dịch vụ này.</span>
                                    <Button
                                        startIcon={<AddIcon />}
                                        variant="outlined"
                                        size="small"
                                        onClick={() => {
                                            setEditingPricing(null);
                                            setPricingModalOpen(true);
                                        }}
                                    >
                                        Thêm quy tắc giá
                                    </Button>
                                </Box>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Tên quy tắc</TableCell>
                                            <TableCell align="right">Giá (VNĐ)</TableCell>
                                            <TableCell align="right">Cân nặng (kg)</TableCell>
                                            <TableCell>Loại thú phù hợp</TableCell>
                                            <TableCell>Hiệu lực (từ / đến)</TableCell>
                                            <TableCell align="right">Ưu tiên</TableCell>
                                            <TableCell>Trạng thái</TableCell>
                                            <TableCell align="right"></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {pricings.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} sx={{ color: '#637381', py: 3 }}>
                                                    Chưa có quy tắc giá. Nhấn &quot;Thêm quy tắc giá&quot; để thêm.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            pricings.map((p) => (
                                                <TableRow key={p.pricingId}>
                                                    <TableCell>{p.pricingName}</TableCell>
                                                    <TableCell align="right">{Number(p.price).toLocaleString('vi-VN')}</TableCell>
                                                    <TableCell align="right">
                                                        {p.minWeight != null || p.maxWeight != null
                                                            ? `${p.minWeight ?? '—'} - ${p.maxWeight ?? '—'}`
                                                            : '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {p.suitablePetTypes
                                                            ? p.suitablePetTypes.split(',').map((s) => s.trim()).filter(Boolean).join(', ')
                                                            : '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {p.effectiveFrom || p.effectiveTo
                                                            ? `${p.effectiveFrom ? dayjs(p.effectiveFrom).format('DD/MM/YYYY') : '—'} → ${
                                                                  p.effectiveTo ? dayjs(p.effectiveTo).format('DD/MM/YYYY') : '—'
                                                              }`
                                                            : '—'}
                                                    </TableCell>
                                                    <TableCell align="right">{p.priority}</TableCell>
                                                    <TableCell>{p.isActive ? 'Hoạt động' : 'Tạm dừng'}</TableCell>
                                                    <TableCell align="right">
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
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Button
                                type="submit"
                                disabled={isPending}
                                sx={{
                                    background: '#1C252E',
                                    minHeight: '4.8rem',
                                    fontWeight: 700,
                                    fontSize: '1.4rem',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    '&:hover': { background: '#454F5B' },
                                }}
                                variant="contained"
                            >
                                {isPending ? 'Đang lưu...' : 'Cập nhật dịch vụ'}
                            </Button>
                        </Box>
                    </Stack>
                </form>
            </ThemeProvider>
            <ServicePricingFormModal
                open={pricingModalOpen}
                onClose={() => { setPricingModalOpen(false); setEditingPricing(null); }}
                serviceId={serviceId}
                editingRule={editingPricing}
                onSubmit={onPricingSubmit}
                isPending={isPricingCreating || isPricingUpdating}
            />
        </>
    );
};
