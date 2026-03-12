import { Box, Stack, TextField, ThemeProvider, useTheme, Button, MenuItem, Select, InputLabel, FormControl, Checkbox, ListItemText, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Title } from '../../components/ui/Title';
import { useState, useEffect } from 'react';
import { CollapsibleCard } from '../../components/ui/CollapsibleCard';
import { useCreateService } from './hooks/useService';
import { useUpdateService } from './hooks/useService';
import { useServiceCategories } from './hooks/useServiceCategory';
import { usePetTypes } from './hooks/useEnums';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { serviceUpsertSchema, type ServiceUpsertFormValues } from '../../schemas/service.schema';
import { servicePricingUpsertSchema, type ServicePricingUpsertFormValues } from '../../schemas/service-pricing.schema';
import { SwitchButton } from '../../components/ui/SwitchButton';
import { getServiceTheme } from './configs/theme';
import { prefixAdmin } from '../../constants/routes';
import { FormUploadSingleFile } from '../../components/upload/FormUploadSingleFile';
import { FormUploadMultiFile } from '../../components/upload/FormUploadMultiFile';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { createOrUpdateServicePricing } from '../../api/service-pricing.api';
import { TimeSlotsSection } from './components/TimeSlotsSection';
import { useQuery } from '@tanstack/react-query';
import { getTimeSlotsByService } from '../../api/time-slot.api';
import { getPetTypeLabel } from './configs/constants';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useRoomTypes } from '../room/hooks/useRoomType';
import { updateRoomTypeServiceId } from '../../api/room.api';

export const ServiceCreatePage = () => {
    const navigate = useNavigate();
    const [expanded1, setExpanded1] = useState(true);
    const [expanded2, setExpanded2] = useState(true);
    const [expandedPricing, setExpandedPricing] = useState(true);
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [createdServiceId, setCreatedServiceId] = useState<number | null>(null);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [pricingDrafts, setPricingDrafts] = useState<
        {
            id: string;
            pricingName: string;
            price: number;
            suitablePetTypes?: string[];
            weekendMultiplier?: number | null;
            peakSeasonMultiplier?: number | null;
            holidayMultiplier?: number | null;
            minWeight?: number | null;
            maxWeight?: number | null;
            effectiveFrom?: string;
            effectiveTo?: string;
            priority: number;
            isActive: boolean;
        }[]
    >([]);
    const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
    const [lastAddedDraftId, setLastAddedDraftId] = useState<string | null>(null);
    const [openCreateNowDialog, setOpenCreateNowDialog] = useState(false);
    const [selectedRoomTypeIds, setSelectedRoomTypeIds] = useState<number[]>([]);

    const theme = useTheme();
    const localTheme = getServiceTheme(theme);
    const { data: categories = [] } = useServiceCategories();
    const { data: petTypes = [] } = usePetTypes();
    const { data: roomTypes = [] } = useRoomTypes();
    const { data: timeSlots = [] } = useQuery({
        queryKey: ['time-slots', createdServiceId],
        queryFn: () => getTimeSlotsByService(createdServiceId!),
        select: (res: { data?: unknown[] }) => res?.data ?? [],
        enabled: !!createdServiceId && createdServiceId > 0 && step === 3,
    });
    const { mutate: create, isPending } = useCreateService();
    const { mutate: update, isPending: isUpdating } = useUpdateService();

    const { control, handleSubmit, setValue, getValues } = useForm<ServiceUpsertFormValues>({
        resolver: zodResolver(serviceUpsertSchema),
        defaultValues: {
            serviceCategoryId: undefined as unknown as number,
            code: '',
            serviceName: '',
            duration: 60,
            isActive: true,
            isPopular: false,
            isAddon: false,
            isAdditionalCharge: false,
            isCritical: false,
            isRequiredRoom: false,
            requiresVaccination: false,
            bufferTime: 15,
            advanceBookingHours: 24,
            cancellationDeadlineHours: 12,
            maxPetsPerSession: 1,
            requiredStaffCount: 1,
        },
    });

    const isAddon = useWatch({ control, name: 'isAddon' });
    const isAdditionalCharge = useWatch({ control, name: 'isAdditionalCharge' });
    const addonType = useWatch({ control, name: 'addonType' });
    const isRequiredRoom = useWatch({ control, name: 'isRequiredRoom' });

    const slugify = (input: string) => {
        return (input ?? '')
            .toString()
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .replace(/-+/g, '-');
    };

    const generateServiceCode = (data: ServiceUpsertFormValues): string => {
        const cat = categories.find((c) => c.categoryId === data.serviceCategoryId);
        const prefix = (cat?.slug || 'svc').toUpperCase().replace(/-/g, '_').slice(0, 15);
        const namePart = slugify(data.serviceName || 'dich-vu')
            .toUpperCase()
            .replace(/-/g, '_')
            .slice(0, 20);
        const suffix = Date.now().toString(36).toUpperCase().slice(-6);
        return `${prefix}-${namePart}-${suffix}`;
    };

    const buildServicePayload = (data: ServiceUpsertFormValues, existingId: number | null) => ({
        ...(existingId ? { serviceId: existingId } : {}),
        serviceCategoryId: data.serviceCategoryId,
        code: (data.code || '').trim() || generateServiceCode(data),
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
        isCritical: data.isCritical ?? null,
        addonType: data.isAddon ? (data.addonType || null) : null,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        isActive: data.isActive,
        isRequiredRoom: data.isRequiredRoom ?? false,
    });

    // Step 1 -> Step 2: chỉ chuyển màn hình, không gọi API.
    const onNextFromStep1 = () => {
        setStep(2);
    };

    const handleCreateNow = () => {
        setOpenCreateNowDialog(true);
    };

    const handleConfirmCreateNow = async () => {
        try {
            let serviceId: number;
            const formValues = getValues();

            if (createdServiceId) {
                serviceId = createdServiceId;
                await new Promise<void>((resolve, reject) => {
                    update(
                        { ...buildServicePayload(formValues, createdServiceId), isActive: false } as any,
                        {
                            onSuccess: (res: any) => {
                                if (res?.success) resolve();
                                else reject(new Error(res?.message));
                            },
                            onError: reject,
                        }
                    );
                });
            } else {
                const payload = { ...buildServicePayload(formValues, null), isActive: false };
                serviceId = await new Promise<number>((resolve, reject) => {
                    create(payload as any, {
                        onSuccess: (res: any) => {
                            if (res?.success) {
                                const id = res?.data?.serviceId ?? res?.data?.service_id;
                                if (id) {
                                    setCreatedServiceId(Number(id));
                                    resolve(Number(id));
                                } else reject(new Error('Không nhận được serviceId'));
                            } else reject(new Error(res?.message));
                        },
                        onError: reject,
                    });
                });
            }

            if (pricingDrafts.length > 0) {
                await Promise.all(
                    pricingDrafts.map((p) => {
                        const suitablePetTypes = p.suitablePetTypes && p.suitablePetTypes.length > 0 ? p.suitablePetTypes.join(',') : undefined;
                        return createOrUpdateServicePricing({
                            serviceId,
                            pricingName: p.pricingName,
                            price: p.price,
                            suitablePetTypes,
                            weekendMultiplier: p.weekendMultiplier ?? null,
                            peakSeasonMultiplier: p.peakSeasonMultiplier ?? null,
                            holidayMultiplier: p.holidayMultiplier ?? null,
                            minWeight: p.minWeight ?? null,
                            maxWeight: p.maxWeight ?? null,
                            effectiveFrom: p.effectiveFrom || undefined,
                            effectiveTo: p.effectiveTo || undefined,
                            priority: p.priority,
                            isActive: p.isActive,
                        } as Record<string, unknown>);
                    })
                );
            }

            if (formValues.isRequiredRoom && selectedRoomTypeIds.length > 0) {
                await Promise.all(selectedRoomTypeIds.map((rtId) => updateRoomTypeServiceId(rtId, serviceId)));
            }

            setOpenCreateNowDialog(false);
            toast.success('Đã tạo dịch vụ (trạng thái tạm dừng)');
            navigate(`/${prefixAdmin}/service/edit/${serviceId}`);
        } catch {
            toast.error('Có lỗi khi tạo dịch vụ');
        }
    };

    // Ensure service record exists before we persist pricing or finish the wizard.
    const ensureServiceCreated = async (): Promise<number> => {
        if (createdServiceId) {
            return createdServiceId;
        }
        const formValues = getValues();
        const payload = buildServicePayload(formValues, null);

        return await new Promise<number>((resolve, reject) => {
            create(payload as any, {
                onSuccess: (res: any) => {
                    if (res?.success) {
                        const id = res?.data?.serviceId ?? res?.data?.service_id;
                        if (id) {
                            const numericId = Number(id);
                            setCreatedServiceId(numericId);
                            toast.success(res.message ?? 'Đã lưu thông tin dịch vụ');
                            resolve(numericId);
                        } else {
                            toast.error('Không nhận được serviceId sau khi lưu');
                            reject(new Error('Missing serviceId after save'));
                        }
                    } else {
                        toast.error(res?.message ?? 'Có lỗi khi lưu dịch vụ');
                        reject(new Error(res?.message ?? 'Service save failed'));
                    }
                },
                onError: (err: unknown) => {
                    toast.error('Có lỗi khi lưu dịch vụ');
                    reject(err instanceof Error ? err : new Error('Service save error'));
                },
            });
        });
    };

    const {
        control: pricingControl,
        handleSubmit: handlePricingSubmit,
        reset: resetPricing,
    } = useForm<ServicePricingUpsertFormValues>({
        resolver: zodResolver(servicePricingUpsertSchema),
        defaultValues: {
            serviceId: createdServiceId ?? 0,
            pricingName: '',
            price: 0,
            suitablePetTypes: [],
            weekendMultiplier: null,
            peakSeasonMultiplier: null,
            holidayMultiplier: null,
            minWeight: null,
            maxWeight: null,
            effectiveFrom: '',
            effectiveTo: '',
            priority: 0,
            isActive: true,
        },
    });

    const resetPricingToBlank = () =>
        resetPricing({
            serviceId: createdServiceId ?? 0,
            pricingId: undefined,
            pricingName: '',
            price: 0,
            suitablePetTypes: [],
            weekendMultiplier: null,
            peakSeasonMultiplier: null,
            holidayMultiplier: null,
            minWeight: null,
            maxWeight: null,
            effectiveFrom: '',
            effectiveTo: '',
            priority: 0,
            isActive: true,
        });

    const handlePricingFormSubmit = (data: ServicePricingUpsertFormValues) => {
        // Prevent duplicate rules in the local list: same pricingName + priority.
        const normalizedName = (data.pricingName ?? '').trim();
        const priorityValue = data.priority ?? 0;

        const duplicate = pricingDrafts.find(
            (p) =>
                p.pricingName.trim().toLowerCase() === normalizedName.toLowerCase() &&
                p.priority === priorityValue &&
                p.id !== editingDraftId
        );

        if (duplicate) {
            toast.warning('Quy tắc giá với tên và thứ tự ưu tiên này đã tồn tại. Vui lòng chỉnh sửa quy tắc cũ hoặc đổi thông tin.');
            return;
        }

        const draft = {
            id: editingDraftId ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            pricingName: normalizedName,
            price: data.price,
            suitablePetTypes: data.suitablePetTypes ?? [],
            weekendMultiplier: data.weekendMultiplier ?? null,
            peakSeasonMultiplier: data.peakSeasonMultiplier ?? null,
            holidayMultiplier: data.holidayMultiplier ?? null,
            minWeight: data.minWeight ?? null,
            maxWeight: data.maxWeight ?? null,
            effectiveFrom: data.effectiveFrom || undefined,
            effectiveTo: data.effectiveTo || undefined,
            priority: data.priority,
            isActive: data.isActive ?? true,
        };

        setPricingDrafts((prev) => {
            if (editingDraftId) {
                return prev.map((p) => (p.id === editingDraftId ? draft : p));
            }
            return [...prev, draft];
        });

        if (!editingDraftId) {
            setLastAddedDraftId(draft.id);
            setTimeout(() => setLastAddedDraftId(null), 3000);
        }
        setEditingDraftId(null);
        resetPricingToBlank();
    };

    // When entering step 2 or choosing a rule to edit, sync the inline form values.
    useEffect(() => {
        if (step !== 2) return;
        if (editingDraftId) {
            const draft = pricingDrafts.find((p) => p.id === editingDraftId);
            if (draft) {
                resetPricing({
                    serviceId: createdServiceId ?? 0,
                    pricingId: undefined,
                    pricingName: draft.pricingName,
                    price: draft.price,
                    suitablePetTypes: draft.suitablePetTypes ?? [],
                    weekendMultiplier: draft.weekendMultiplier ?? null,
                    peakSeasonMultiplier: draft.peakSeasonMultiplier ?? null,
                    holidayMultiplier: draft.holidayMultiplier ?? null,
                    minWeight: draft.minWeight ?? null,
                    maxWeight: draft.maxWeight ?? null,
                    effectiveFrom: draft.effectiveFrom ?? '',
                    effectiveTo: draft.effectiveTo ?? '',
                    priority: draft.priority,
                    isActive: draft.isActive,
                });
                return;
            }
        }
        resetPricingToBlank();
    }, [step, editingDraftId, pricingDrafts, createdServiceId, resetPricing]);

    return (
        <>
            <div className="mb-[40px] flex items-start justify-end">
                <div className="mr-auto">
                    <Title
                        title={
                            step === 1
                                ? 'Thêm dịch vụ'
                                : step === 2
                                    ? 'Thêm quy tắc giá'
                                    : 'Thêm khung giờ'
                        }
                        sx={{ fontSize: '1.625rem' }}
                    />
                    <Breadcrumb
                        items={[
                            { label: 'Trang chủ', to: '/' },
                            { label: 'Quản lý dịch vụ', to: `/${prefixAdmin}/service/list` },
                            { label: 'Thêm dịch vụ', to: step > 1 ? `/${prefixAdmin}/service/create` : undefined },
                            ...(step === 2 ? [{ label: 'Quy tắc giá' }] : []),
                            ...(step === 3 ? [{ label: 'Khung giờ' }] : []),
                        ]}
                    />
                </div>
            </div>
            <ThemeProvider theme={localTheme}>
                {step === 1 ? (
                    <form
                        onSubmit={handleSubmit(onNextFromStep1, (errors) => {
                            const firstKey = Object.keys(errors)[0];
                            if (firstKey) {
                                setExpanded1(true);
                                setTimeout(() => {
                                    document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 100);
                            }
                        })}
                    >
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
                                                    id="field-serviceCategoryId"
                                                    select
                                                    label="Danh mục dịch vụ"
                                                    error={!!fieldState.error}
                                                    helperText={fieldState.error?.message}
                                                    fullWidth
                                                    value={field.value ?? ''}
                                                    onChange={(e) => {
                                                        const v = e.target.value;
                                                        if (v === '') {
                                                            field.onChange(undefined);
                                                        } else {
                                                            const n = Number(v);
                                                            field.onChange(Number.isNaN(n) ? undefined : n);
                                                        }
                                                    }}
                                                >
                                                    <MenuItem value="">-- Chọn danh mục --</MenuItem>
                                                    {categories.map((c) => (
                                                        <MenuItem key={c.categoryId} value={c.categoryId}>
                                                            {c.categoryName}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            )}
                                        />
                                        <Controller
                                            name="serviceName"
                                            control={control}
                                            render={({ field, fieldState }) => (
                                                <TextField
                                                    {...field}
                                                    id="field-serviceName"
                                                    label="Tên dịch vụ"
                                                    error={!!fieldState.error}
                                                    helperText={fieldState.error?.message}
                                                    fullWidth
                                                    onChange={(e) => {
                                                        const nextName = e.target.value;
                                                        field.onChange(nextName);

                                                        if (!slugManuallyEdited) {
                                                            const base = slugify(nextName);
                                                            const suffix = isAddon && (addonType ?? '').trim() ? `-${slugify(addonType ?? '')}` : '';
                                                            const nextSlug = `${base}${suffix}`.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
                                                            setValue('slug', nextSlug, { shouldDirty: true });
                                                        }
                                                    }}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="slug"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="Slug"
                                                    fullWidth
                                                    helperText="Tự động tạo từ Tên dịch vụ (và Addon type nếu bật). Bạn vẫn có thể chỉnh sửa."
                                                    onChange={(e) => {
                                                        setSlugManuallyEdited(true);
                                                        field.onChange(e.target.value);
                                                    }}
                                                />
                                            )}
                                        />
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
                                                    onChange={(e) => field.onChange(e.target.valueAsNumber ?? 0)}
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
                                                        sx={{ '& .MuiSelect-select': { fontSize: '0.6641rem' } }}
                                                        MenuProps={{
                                                            PaperProps: { sx: { '& .MuiMenuItem-root .MuiListItemText-primary': { fontSize: '0.6641rem' } } },
                                                        }}
                                                    >
                                                        {petTypes.map((pt) => (
                                                            <MenuItem key={pt} value={pt}>
                                                                <Checkbox checked={(Array.isArray(field.value) ? field.value : []).includes(pt)} />
                                                                <ListItemText primary={getPetTypeLabel(pt)} primaryTypographyProps={{ fontSize: '0.6641rem' }} />
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
                                        <Box sx={{ mt: 2 }}>
                                            <Box sx={{ fontSize: '0.875rem', fontWeight: 600, mb: 2 }}>Loại phòng gắn với dịch vụ này (sau khi tạo sẽ gắn)</Box>
                                            <Table size="small" sx={{ '& .MuiTableCell-root': { fontSize: '0.8125rem' } }}>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Tên loại phòng</TableCell>
                                                        <TableCell>Dịch vụ hiện tại</TableCell>
                                                        <TableCell padding="checkbox">Gắn vào dịch vụ này</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {roomTypes.map((rt) => (
                                                        <TableRow key={rt.roomTypeId}>
                                                            <TableCell>{rt.typeName}</TableCell>
                                                            <TableCell>{rt.serviceName ?? '—'}</TableCell>
                                                            <TableCell padding="checkbox">
                                                                <Checkbox
                                                                    checked={selectedRoomTypeIds.includes(rt.roomTypeId)}
                                                                    onChange={(_, checked) => {
                                                                        setSelectedRoomTypeIds((prev) =>
                                                                            checked ? [...prev, rt.roomTypeId] : prev.filter((id) => id !== rt.roomTypeId)
                                                                        );
                                                                    }}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                            {roomTypes.length === 0 && (
                                                <Box sx={{ py: 2, color: 'text.secondary', fontSize: '0.8125rem' }}>Chưa có loại phòng. Tạo tại Quản lý phòng → Danh sách loại phòng.</Box>
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
                                        <Controller name="maxPetsPerSession" control={control} render={({ field }) => <TextField {...field} type="number" label="Số thú cưng tham gia cho mỗi phiên" fullWidth onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value) || undefined)} />} />
                                        <Controller name="requiredStaffCount" control={control} render={({ field }) => <TextField {...field} type="number" label="Số nhân viên yêu cầu" fullWidth onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value) || undefined)} />} />
                                        <Controller name="displayOrder" control={control} render={({ field }) => <TextField {...field} type="number" label="Thứ tự hiển thị" fullWidth onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value) || undefined)} />} />
                                        <Controller
                                            name="addonType"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="Addon type"
                                                    fullWidth
                                                    disabled={!isAddon}
                                                    onChange={(e) => {
                                                        field.onChange(e.target.value);
                                                        if (!slugManuallyEdited) {
                                                            const name = getValues('serviceName') ?? '';
                                                            const base = slugify(name);
                                                            const suffix = isAddon && (e.target.value ?? '').trim() ? `-${slugify(e.target.value)}` : '';
                                                            const nextSlug = `${base}${suffix}`.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
                                                            setValue('slug', nextSlug, { shouldDirty: true });
                                                        }
                                                    }}
                                                />
                                            )}
                                        />
                                    </Box>

                                    <Controller
                                        name="requiredCertifications"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField {...field} label="Chứng chỉ yêu cầu (mỗi dòng 1 chứng chỉ)" multiline rows={3} fullWidth />
                                        )}
                                    />

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

                            <CollapsibleCard title="Quy định hoàn tiền" expanded={expanded2} onToggle={() => setExpanded2((p) => !p)}>
                                <Stack p="24px" gap="24px">
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px 16px' }}>
                                        <Controller name="cancellationDeadlineHours" control={control} render={({ field }) => <TextField {...field} type="number" label="Hạn hủy trước (giờ)" fullWidth InputProps={{ endAdornment: <span style={{ color: '#888', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>giờ</span> }} onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value) || undefined)} />} />
                                        <Controller name="beforeDeadlineRefundPct" control={control} render={({ field }) => <TextField {...field} type="number" label="% hoàn trước hạn hủy" fullWidth InputProps={{ endAdornment: <span style={{ color: '#888', fontSize: '0.75rem' }}>%</span> }} onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value))} />} />
                                        <Controller name="afterDeadlineRefundPct" control={control} render={({ field }) => <TextField {...field} type="number" label="% hoàn sau hạn hủy" fullWidth InputProps={{ endAdornment: <span style={{ color: '#888', fontSize: '0.75rem' }}>%</span> }} onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value))} />} />
                                        <Controller name="noShowRefundPct" control={control} render={({ field }) => <TextField {...field} type="number" label="% hoàn khi No-show" fullWidth InputProps={{ endAdornment: <span style={{ color: '#888', fontSize: '0.75rem' }}>%</span> }} onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value))} />} />
                                        <Controller name="noShowPenalty" control={control} render={({ field }) => <TextField {...field} type="number" label="Phí phạt No-show" fullWidth InputProps={{ endAdornment: <span style={{ color: '#888', fontSize: '0.75rem' }}>VNĐ</span> }} onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value))} />} />
                                        <Controller name="rescheduleDeadlineHours" control={control} render={({ field }) => <TextField {...field} type="number" label="Đổi lịch trước (giờ)" fullWidth InputProps={{ endAdornment: <span style={{ color: '#888', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>giờ</span> }} onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value))} />} />
                                        <Controller name="rescheduleLimit" control={control} render={({ field }) => <TextField {...field} type="number" label="Số lần đổi lịch tối đa" fullWidth InputProps={{ endAdornment: <span style={{ color: '#888', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>lần</span> }} onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value))} />} />
                                        <Controller name="forceMajeureRefundPct" control={control} render={({ field }) => <TextField {...field} type="number" label="% hoàn bất khả kháng" fullWidth InputProps={{ endAdornment: <span style={{ color: '#888', fontSize: '0.75rem' }}>%</span> }} onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value))} />} />
                                    </Box>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                        <SwitchButton control={control} name="allowReschedule" label="Cho phép đổi lịch" />
                                        <SwitchButton control={control} name="allowForceMajeure" label="Cho phép bất khả kháng" />
                                    </Box>
                                </Stack>
                            </CollapsibleCard>

                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                                <Box sx={{ flex: 1 }} />
                                <Button
                                    type="button"
                                    variant="outlined"
                                    disabled={isPending || isUpdating}
                                    onClick={handleCreateNow}
                                    sx={{
                                        minHeight: '3rem',
                                        fontWeight: 700,
                                        fontSize: '0.875rem',
                                        padding: '8px 24px',
                                        borderRadius: '8px',
                                        textTransform: 'none',
                                        borderColor: '#637381',
                                        color: '#637381',
                                        '&:hover': { borderColor: '#454F5B', color: '#454F5B', bgcolor: 'rgba(99,115,129,0.08)' },
                                    }}
                                >
                                    Tạo dịch vụ ngay
                                </Button>
                                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        type="submit"
                                        disabled={isPending || isUpdating}
                                        sx={{
                                            background: '#1C252E',
                                            minHeight: '3rem',
                                            fontWeight: 700,
                                            fontSize: '0.875rem',
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            textTransform: 'none',
                                            '&:hover': { background: '#454F5B' },
                                        }}
                                        variant="contained"
                                    >
                                        {isPending || isUpdating ? 'Đang kiểm tra...' : 'Tiếp tục'}
                                    </Button>
                                </Box>
                            </Box>
                        </Stack>
                    </form>
                ) : step === 2 ? (
                    <Stack sx={{ margin: '0px 120px', gap: '40px' }}>
                        <CollapsibleCard
                            title="Quy tắc giá"
                            subheader={pricingDrafts.length > 0 ? 'Đang cập nhật quy tắc...' : 'Giá dịch vụ theo quy tắc (service_pricing)'}
                            expanded={expandedPricing}
                            onToggle={() => setExpandedPricing((p) => !p)}
                        >
                            <Stack p="24px" gap="24px" sx={{ '& .MuiInputBase-input, & .MuiInputLabel-root, & .MuiFormHelperText-root': { fontSize: '0.9375rem' }, '& .MuiTableCell-root': { fontSize: '0.9375rem' } }}>
                                <Box
                                    component="form"
                                    onSubmit={handlePricingSubmit(handlePricingFormSubmit)}
                                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                                >
                                    <Controller
                                        name="pricingName"
                                        control={pricingControl}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                {...field}
                                                label="Tên quy tắc"
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
                                                fullWidth
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="price"
                                        control={pricingControl}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                label="Giá (VNĐ)"
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
                                                fullWidth
                                                onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value) || 0)}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="suitablePetTypes"
                                        control={pricingControl}
                                        render={({ field }) => (
                                            <FormControl fullWidth>
                                                <InputLabel id="pricing-suitable-pet-types-label">Loại thú cưng phù hợp</InputLabel>
                                                <Select
                                                    labelId="pricing-suitable-pet-types-label"
                                                    multiple
                                                    value={Array.isArray(field.value) ? field.value : []}
                                                    label="Loại thú cưng phù hợp"
                                                    renderValue={(selected) => (Array.isArray(selected) ? selected : []).map(getPetTypeLabel).join(', ')}
                                                    onChange={(e) => field.onChange(e.target.value as string[])}
                                                    sx={{ '& .MuiSelect-select': { fontSize: '0.6641rem' } }}
                                                    MenuProps={{
                                                        PaperProps: { sx: { '& .MuiMenuItem-root .MuiListItemText-primary': { fontSize: '0.6641rem' } } },
                                                    }}
                                                >
                                                    {petTypes.map((pt) => (
                                                        <MenuItem key={pt} value={pt}>
                                                            <Checkbox checked={(Array.isArray(field.value) ? field.value : []).includes(pt)} />
                                                            <ListItemText primary={getPetTypeLabel(pt)} primaryTypographyProps={{ fontSize: '0.6641rem' }} />
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        )}
                                    />

                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                                        <Controller
                                            name="minWeight"
                                            control={pricingControl}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    type="number"
                                                    inputProps={{ step: '0.01' }}
                                                    label="Cân nặng tối thiểu (kg)"
                                                    fullWidth
                                                    onChange={(e) => {
                                                        const v = (e.target as HTMLInputElement).value;
                                                        field.onChange(v === '' ? null : Number(v));
                                                    }}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="maxWeight"
                                            control={pricingControl}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    type="number"
                                                    inputProps={{ step: '0.01' }}
                                                    label="Cân nặng tối đa (kg)"
                                                    fullWidth
                                                    onChange={(e) => {
                                                        const v = (e.target as HTMLInputElement).value;
                                                        field.onChange(v === '' ? null : Number(v));
                                                    }}
                                                />
                                            )}
                                        />
                                    </Box>

                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                                        <Controller
                                            name="weekendMultiplier"
                                            control={pricingControl}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    type="number"
                                                    inputProps={{ step: '0.01' }}
                                                    label="Hệ số cuối tuần"
                                                    fullWidth
                                                    onChange={(e) => {
                                                        const v = (e.target as HTMLInputElement).value;
                                                        field.onChange(v === '' ? null : Number(v));
                                                    }}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="peakSeasonMultiplier"
                                            control={pricingControl}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    type="number"
                                                    inputProps={{ step: '0.01' }}
                                                    label="Hệ số mùa cao điểm"
                                                    fullWidth
                                                    onChange={(e) => {
                                                        const v = (e.target as HTMLInputElement).value;
                                                        field.onChange(v === '' ? null : Number(v));
                                                    }}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="holidayMultiplier"
                                            control={pricingControl}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    type="number"
                                                    inputProps={{ step: '0.01' }}
                                                    label="Hệ số ngày lễ"
                                                    fullWidth
                                                    onChange={(e) => {
                                                        const v = (e.target as HTMLInputElement).value;
                                                        field.onChange(v === '' ? null : Number(v));
                                                    }}
                                                />
                                            )}
                                        />
                                    </Box>

                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                                        <Controller
                                            name="effectiveFrom"
                                            control={pricingControl}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    type="datetime-local"
                                                    label="Hiệu lực từ"
                                                    fullWidth
                                                    InputLabelProps={{ shrink: true }}
                                                    helperText="Để trống nếu áp dụng ngay."
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="effectiveTo"
                                            control={pricingControl}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    type="datetime-local"
                                                    label="Hiệu lực đến"
                                                    fullWidth
                                                    InputLabelProps={{ shrink: true }}
                                                    helperText="Để trống nếu không có ngày kết thúc."
                                                />
                                            )}
                                        />
                                    </Box>

                                    <Controller
                                        name="priority"
                                        control={pricingControl}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                label="Thứ tự ưu tiên"
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
                                                fullWidth
                                                onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value) || 0)}
                                            />
                                        )}
                                    />
                                    <SwitchButton control={pricingControl as any} name="isActive" label="Trạng thái (đang áp dụng)" />

                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
                                        {editingDraftId && (
                                            <Button
                                                variant="outlined"
                                                onClick={() => {
                                                    setEditingDraftId(null);
                                                    resetPricingToBlank();
                                                }}
                                                sx={{ fontSize: '0.9375rem' }}
                                            >
                                                Hủy chỉnh sửa
                                            </Button>
                                        )}
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            sx={{ fontSize: '0.9375rem' }}
                                        >
                                            {editingDraftId ? 'Cập nhật quy tắc giá' : 'Thêm quy tắc giá'}
                                        </Button>
                                    </Box>
                                </Box>

                                <Table size="medium" sx={{ '& .MuiTableCell-root': { fontSize: '0.9375rem', py: 2 } }}>
                                    <TableHead>
                                        <TableRow sx={{ '& .MuiTableCell-root': { fontWeight: 700, fontSize: '1rem', py: 2 } }}>
                                            <TableCell>Tên quy tắc</TableCell>
                                            <TableCell align="right">Giá (VNĐ)</TableCell>
                                            <TableCell align="right">Ưu tiên</TableCell>
                                            <TableCell>Trạng thái</TableCell>
                                            <TableCell align="right"></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {pricingDrafts.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} sx={{ color: '#637381', py: 4, fontSize: '0.9375rem' }}>
                                                    Chưa có quy tắc giá. Điền form bên trên và nhấn &quot;Thêm quy tắc giá&quot; để thêm.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            pricingDrafts.map((p) => (
                                                <TableRow
                                                    key={p.id}
                                                    sx={{
                                                        ...(lastAddedDraftId === p.id && {
                                                            bgcolor: 'rgba(34, 197, 94, 0.15)',
                                                            borderLeft: '4px solid #22c55e',
                                                            fontWeight: 600,
                                                        }),
                                                    }}
                                                >
                                                    <TableCell sx={{ fontSize: '0.9375rem', fontWeight: lastAddedDraftId === p.id ? 600 : 400 }}>{p.pricingName}</TableCell>
                                                    <TableCell align="right" sx={{ fontSize: '0.9375rem' }}>{Number(p.price).toLocaleString('vi-VN')}</TableCell>
                                                    <TableCell align="right" sx={{ fontSize: '0.9375rem' }}>{p.priority}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.9375rem' }}>{p.isActive ? 'Hoạt động' : 'Tạm dừng'}</TableCell>
                                                    <TableCell align="right">
                                                        <IconButton
                                                            size="medium"
                                                            onClick={() => setEditingDraftId(p.id)}
                                                            sx={{ fontSize: '1.125rem' }}
                                                        >
                                                            <EditIcon fontSize="medium" />
                                                        </IconButton>
                                                        <IconButton
                                                            size="medium"
                                                            color="error"
                                                            sx={{ fontSize: '1.125rem' }}
                                                            onClick={() => {
                                                                if (!window.confirm('Xóa quy tắc giá này?')) return;
                                                                setPricingDrafts((prev) => prev.filter((x) => x.id !== p.id));
                                                                if (editingDraftId === p.id) {
                                                                    setEditingDraftId(null);
                                                                    resetPricingToBlank();
                                                                }
                                                                if (lastAddedDraftId === p.id) setLastAddedDraftId(null);
                                                            }}
                                                        >
                                                            <DeleteIcon fontSize="medium" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </Stack>
                        </CollapsibleCard>

                        <CollapsibleCard title="SEO & Metadata" expanded={true} onToggle={() => undefined}>
                            <Stack p="24px" gap="24px">
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px 16px' }}>
                                    <Controller name="metaTitle" control={control} render={({ field }) => <TextField {...field} label="Meta title" fullWidth />} />
                                    <Controller
                                        name="metaDescription"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="Meta description" multiline rows={2} fullWidth />}
                                    />
                                </Box>
                            </Stack>
                        </CollapsibleCard>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={() => setStep(1)}
                                sx={{ minHeight: '3rem', fontSize: '0.875rem', py: 1.5, textTransform: 'none' }}
                            >
                                Quay lại
                            </Button>
                            <Button
                                type="button"
                                variant="outlined"
                                disabled={isPending || isUpdating}
                                onClick={handleCreateNow}
                                sx={{
                                    minHeight: '3rem',
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    padding: '8px 24px',
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    borderColor: '#637381',
                                    color: '#637381',
                                    '&:hover': { borderColor: '#454F5B', color: '#454F5B', bgcolor: 'rgba(99,115,129,0.08)' },
                                }}
                            >
                                Tạo dịch vụ ngay
                            </Button>
                            {!isAddon && !isAdditionalCharge && (
                                <Button
                                    variant="contained"
                                    disabled={isPending || isUpdating}
                                    sx={{
                                        background: '#1C252E',
                                        minHeight: '3rem',
                                        fontWeight: 700,
                                        fontSize: '0.875rem',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        textTransform: 'none',
                                        '&:hover': { background: '#454F5B' },
                                    }}
                                    onClick={() => setStep(3)}
                                >
                                    Tiếp tục
                                </Button>
                            )}
                        </Box>
                    </Stack>
                ) : (
                    <Stack sx={{ margin: '0px 120px', gap: '40px' }}>
                        {!isAddon && !isAdditionalCharge ? (
                            <>
                                <TimeSlotsSection
                                    serviceId={createdServiceId}
                                    expanded={true}
                                    onEnsureService={createdServiceId ? undefined : ensureServiceCreated}
                                />
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => setStep(2)}
                                        sx={{ minHeight: '3rem', fontSize: '0.875rem', py: 1.5, textTransform: 'none' }}
                                    >
                                        Quay lại
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        disabled={isPending || isUpdating}
                                        onClick={handleCreateNow}
                                        sx={{
                                            minHeight: '3rem',
                                            fontWeight: 700,
                                            fontSize: '0.875rem',
                                            padding: '8px 24px',
                                            borderRadius: '8px',
                                            textTransform: 'none',
                                            borderColor: '#637381',
                                            color: '#637381',
                                            '&:hover': { borderColor: '#454F5B', color: '#454F5B', bgcolor: 'rgba(99,115,129,0.08)' },
                                        }}
                                    >
                                        Tạo dịch vụ ngay
                                    </Button>
                                    <Button
                                        variant="contained"
                                        disabled={isPending || isUpdating}
                                        sx={{
                                            background: '#1C252E',
                                            minHeight: '3rem',
                                            fontWeight: 700,
                                            fontSize: '0.875rem',
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            textTransform: 'none',
                                            '&:hover': { background: '#454F5B' },
                                        }}
                                        onClick={async () => {
                                            try {
                                                const serviceId = await ensureServiceCreated();

                                                await Promise.all(
                                                    pricingDrafts.map((p) => {
                                                        const suitablePetTypes =
                                                            p.suitablePetTypes && p.suitablePetTypes.length > 0
                                                                ? p.suitablePetTypes.join(',')
                                                                : undefined;
                                                        const payload = {
                                                            serviceId,
                                                            pricingName: p.pricingName,
                                                            price: p.price,
                                                            suitablePetTypes,
                                                            weekendMultiplier: p.weekendMultiplier ?? null,
                                                            peakSeasonMultiplier: p.peakSeasonMultiplier ?? null,
                                                            holidayMultiplier: p.holidayMultiplier ?? null,
                                                            minWeight: p.minWeight ?? null,
                                                            maxWeight: p.maxWeight ?? null,
                                                            effectiveFrom: p.effectiveFrom || undefined,
                                                            effectiveTo: p.effectiveTo || undefined,
                                                            priority: p.priority,
                                                            isActive: p.isActive,
                                                        } as Record<string, unknown>;
                                                        return createOrUpdateServicePricing(payload);
                                                    })
                                                );

                                                if (getValues('isRequiredRoom') && selectedRoomTypeIds.length > 0) {
                                                    await Promise.all(selectedRoomTypeIds.map((rtId) => updateRoomTypeServiceId(rtId, serviceId)));
                                                }

                                                toast.success('Tạo dịch vụ và quy tắc giá thành công');
                                                navigate(`/${prefixAdmin}/service/edit/${serviceId}`);
                                            } catch (err) {
                                                toast.error('Không thể tạo dịch vụ hoặc quy tắc giá. Vui lòng kiểm tra lại dữ liệu.');
                                            }
                                        }}
                                    >
                                        Hoàn tất
                                    </Button>
                                </Box>
                            </>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Box sx={{ fontSize: '0.875rem', color: '#637381' }}>
                                    Dịch vụ add-on hoặc Additional charge không cần cấu hình khung giờ (time slots). Thời gian sẽ
                                    được xử lý cùng với dịch vụ chính.
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => setStep(2)}
                                        sx={{ minHeight: '3rem', fontSize: '0.875rem', py: 1.5, textTransform: 'none' }}
                                    >
                                        Quay lại
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        disabled={isPending || isUpdating}
                                        onClick={handleCreateNow}
                                        sx={{
                                            minHeight: '3rem',
                                            fontWeight: 700,
                                            fontSize: '0.875rem',
                                            padding: '8px 24px',
                                            borderRadius: '8px',
                                            textTransform: 'none',
                                            borderColor: '#637381',
                                            color: '#637381',
                                            '&:hover': { borderColor: '#454F5B', color: '#454F5B', bgcolor: 'rgba(99,115,129,0.08)' },
                                        }}
                                    >
                                        Tạo dịch vụ ngay
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </Stack>
                )}
                <Dialog open={openCreateNowDialog} onClose={() => setOpenCreateNowDialog(false)} maxWidth="xs" fullWidth>
                    <DialogTitle>Xác nhận</DialogTitle>
                    <DialogContent>
                        {(() => {
                            const missing: string[] = [];
                            if (pricingDrafts.length === 0) missing.push('quy tắc giá');
                            if (!isAddon && !isAdditionalCharge) {
                                if (step === 1 || step === 2 || (step === 3 && timeSlots.length === 0)) missing.push('khung giờ');
                            }
                            if (missing.length > 0) {
                                return (
                                    <>
                                        Dịch vụ đang thiếu: <strong>{missing.join(', ')}</strong>.
                                        <br />
                                        <br />
                                        Bạn có muốn thêm dịch vụ ngay? Bạn có thể bổ sung các thông tin còn thiếu tại trang sửa dịch vụ sau.
                                    </>
                                );
                            }
                            return 'Bạn có muốn thêm dịch vụ ngay?';
                        })()}
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setOpenCreateNowDialog(false)} color="inherit">
                            Không
                        </Button>
                        <Button
                            onClick={handleConfirmCreateNow}
                            variant="contained"
                            disabled={isPending}
                            sx={{ background: '#1C252E', '&:hover': { background: '#454F5B' } }}
                        >
                            {isPending ? 'Đang tạo...' : 'Có'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </ThemeProvider>
        </>
    );
};
