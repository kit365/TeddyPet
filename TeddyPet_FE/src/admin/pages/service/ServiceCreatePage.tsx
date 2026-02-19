import { Box, Stack, TextField, ThemeProvider, useTheme, Button, MenuItem, Select, InputLabel, FormControl, Checkbox, ListItemText, IconButton } from '@mui/material';
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
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
export const ServiceCreatePage = () => {
    const navigate = useNavigate();
    const [expanded1, setExpanded1] = useState(true);
    const [expanded2, setExpanded2] = useState(true);
    const [expandedPricing, setExpandedPricing] = useState(true);
    const [step, setStep] = useState<1 | 2>(1);
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

    const theme = useTheme();
    const localTheme = getServiceTheme(theme);
    const { data: categories = [] } = useServiceCategories();
    const { data: petTypes = [] } = usePetTypes();
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
            isCritical: false,
            requiresVaccination: false,
        },
    });

    const isAddon = useWatch({ control, name: 'isAddon' });
    const addonType = useWatch({ control, name: 'addonType' });

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

    const buildServicePayload = (data: ServiceUpsertFormValues, existingId: number | null) => ({
        ...(existingId ? { serviceId: existingId } : {}),
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
    });

    // Step 1 -> Step 2: only validate and move forward, do NOT create service yet.
    const onNext = () => {
        setStep(2);
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
                    <Title title={step === 1 ? 'Thêm dịch vụ' : 'Thêm quy tắc giá'} />
                    <Breadcrumb
                        items={[
                            { label: 'Trang chủ', to: '/' },
                            { label: 'Quản lý dịch vụ', to: `/${prefixAdmin}/service/list` },
                            { label: 'Thêm dịch vụ', to: step === 2 ? `/${prefixAdmin}/service/create` : undefined },
                            ...(step === 2 ? [{ label: 'Quy tắc giá' }] : []),
                        ]}
                    />
                </div>
            </div>
            <ThemeProvider theme={localTheme}>
                {step === 1 ? (
                    <form onSubmit={handleSubmit(onNext)}>
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
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    field.onChange(v === '' ? undefined : Number(v));
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
                                                <TextField
                                                    {...field}
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

                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                                <Button
                                    type="submit"
                                    disabled={isPending || isUpdating}
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
                                    {isPending || isUpdating ? 'Đang kiểm tra...' : 'Tiếp tục'}
                                </Button>
                            </Box>
                        </Stack>
                    </form>
                ) : (
                    <Stack sx={{ margin: '0px 120px', gap: '24px' }}>
                        <CollapsibleCard
                            title="Quy tắc giá"
                            subheader={pricingDrafts.length > 0 ? 'Đang cập nhật quy tắc...' : 'Giá dịch vụ theo quy tắc (service_pricing)'}
                            expanded={expandedPricing}
                            onToggle={() => setExpandedPricing((p) => !p)}
                        >
                            <Stack p="24px" gap="24px">
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
                                            >
                                                Hủy chỉnh sửa
                                            </Button>
                                        )}
                                        <Button
                                            type="submit"
                                            variant="contained"
                                        >
                                            {editingDraftId ? 'Cập nhật quy tắc giá' : 'Thêm quy tắc giá'}
                                        </Button>
                                    </Box>
                                </Box>

                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
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
                                                <TableCell colSpan={5} sx={{ color: '#637381', py: 3 }}>
                                                    Chưa có quy tắc giá. Điền form bên trên và nhấn &quot;Thêm quy tắc giá&quot; để thêm.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            pricingDrafts.map((p) => (
                                                <TableRow key={p.id}>
                                                    <TableCell>{p.pricingName}</TableCell>
                                                    <TableCell align="right">{Number(p.price).toLocaleString('vi-VN')}</TableCell>
                                                    <TableCell align="right">{p.priority}</TableCell>
                                                    <TableCell>{p.isActive ? 'Hoạt động' : 'Tạm dừng'}</TableCell>
                                                    <TableCell align="right">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setEditingDraftId(p.id)}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => {
                                                                if (!window.confirm('Xóa quy tắc giá này?')) return;
                                                                setPricingDrafts((prev) => prev.filter((x) => x.id !== p.id));
                                                                if (editingDraftId === p.id) {
                                                                    setEditingDraftId(null);
                                                                    resetPricingToBlank();
                                                                }
                                                            }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>

                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => setStep(1)}
                                    >
                                        Quay lại
                                    </Button>
                                    <Button
                                        variant="contained"
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
                                        onClick={async () => {
                                            if (pricingDrafts.length === 0) {
                                                toast.warning('Vui lòng thêm ít nhất một quy tắc giá trước khi hoàn tất.');
                                                return;
                                            }

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
                            </Stack>
                        </CollapsibleCard>
                    </Stack>
                )}
            </ThemeProvider>
        </>
    );
};
