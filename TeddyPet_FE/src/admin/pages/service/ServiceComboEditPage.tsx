import { Box, Stack, TextField, ThemeProvider, useTheme, Button, CircularProgress, MenuItem, IconButton } from '@mui/material';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Title } from '../../components/ui/Title';
import { useState, useEffect } from 'react';
import { CollapsibleCard } from '../../components/ui/CollapsibleCard';
import { useServiceComboDetail, useUpdateServiceCombo } from './hooks/useServiceCombo';
import { useServices } from './hooks/useService';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { serviceComboUpsertSchema, type ServiceComboUpsertFormValues } from '../../schemas/service-combo.schema';
import { SwitchButton } from '../../components/ui/SwitchButton';
import { getServiceTheme } from './configs/theme';
import { prefixAdmin } from '../../constants/routes';
import { FormUploadSingleFile } from '../../components/upload/FormUploadSingleFile';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

export const ServiceComboEditPage = () => {
    const { id } = useParams();
    const [expanded1, setExpanded1] = useState(true);
    const [expanded2, setExpanded2] = useState(true);
    const theme = useTheme();
    const localTheme = getServiceTheme(theme);
    const { data: detailRes, isLoading } = useServiceComboDetail(id);
    const { data: services = [] } = useServices();
    const { mutate: update, isPending } = useUpdateServiceCombo();

    const { control, handleSubmit, reset } = useForm<ServiceComboUpsertFormValues>({
        resolver: zodResolver(serviceComboUpsertSchema),
        defaultValues: {
            code: '',
            comboName: '',
            slug: '',
            isActive: true,
            serviceItems: [{ serviceId: 0, quantity: 1 }],
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'serviceItems' });

    useEffect(() => {
        if (detailRes?.data) {
            const d = detailRes.data;
            const items = (d.serviceItems ?? []).length ? d.serviceItems!.map((i) => ({ serviceId: i.serviceId, quantity: i.quantity })) : [{ serviceId: services[0]?.serviceId ?? 0, quantity: 1 }];
            reset({
                code: d.code ?? '',
                comboName: d.comboName ?? '',
                slug: d.slug ?? '',
                description: d.description ?? '',
                comboPrice: d.comboPrice ?? undefined,
                originalPrice: d.originalPrice ?? undefined,
                validFrom: d.validFrom ? d.validFrom.slice(0, 16) : '',
                validTo: d.validTo ? d.validTo.slice(0, 16) : '',
                imgURL: d.imgURL ?? '',
                discountPercentage: d.discountPercentage ?? undefined,
                minPetWeight: d.minPetWeight ?? undefined,
                maxPetWeight: d.maxPetWeight ?? undefined,
                suitablePetTypes: d.suitablePetTypes ?? '',
                displayOrder: d.displayOrder ?? undefined,
                tags: d.tags ?? '',
                isPopular: d.isPopular ?? undefined,
                isActive: d.isActive ?? true,
                serviceItems: items,
            });
        }
    }, [detailRes, reset, services]);

    const onSubmit = (data: ServiceComboUpsertFormValues) => {
        const payload = {
            comboId: Number(id),
            code: data.code,
            comboName: data.comboName,
            slug: data.slug || null,
            description: data.description || null,
            comboPrice: data.comboPrice ?? null,
            originalPrice: null,
            validFrom: data.validFrom ? new Date(data.validFrom).toISOString() : null,
            validTo: data.validTo ? new Date(data.validTo).toISOString() : null,
            imgURL: data.imgURL || null,
            discountPercentage: data.discountPercentage ?? null,
            minPetWeight: data.minPetWeight ?? null,
            maxPetWeight: data.maxPetWeight ?? null,
            suitablePetTypes: data.suitablePetTypes || null,
            displayOrder: data.displayOrder ?? null,
            tags: data.tags || null,
            isPopular: data.isPopular ?? null,
            isActive: data.isActive,
            serviceItems: data.serviceItems.map((item) => ({ serviceId: item.serviceId, quantity: item.quantity })),
        };
        update(payload, {
            onSuccess: (res: any) => {
                if (res?.success) toast.success(res.message ?? 'Cập nhật gói dịch vụ thành công');
                else toast.error(res?.message ?? 'Có lỗi');
            },
        });
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
            <div className="mb-[40px] flex items-start justify-end">
                <div className="mr-auto">
                    <Title title="Sửa gói dịch vụ" />
                    <Breadcrumb
                        items={[
                            { label: 'Trang chủ', to: '/' },
                            { label: 'Quản lý dịch vụ', to: `/${prefixAdmin}/service/list` },
                            { label: 'Sửa gói dịch vụ' },
                        ]}
                    />
                </div>
            </div>
            <ThemeProvider theme={localTheme}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Stack sx={{ margin: '0px 120px', gap: '40px' }}>
                        <CollapsibleCard title="Thông tin gói" expanded={expanded1} onToggle={() => setExpanded1((p) => !p)}>
                            <Stack p="24px" gap="24px">
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px 16px' }}>
                                    <Controller
                                        name="code"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField {...field} label="Mã gói" error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
                                        )}
                                    />
                                    <Controller
                                        name="comboName"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField {...field} label="Tên gói" error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
                                        )}
                                    />
                                    <Controller
                                        name="slug"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField {...field} label="Slug" fullWidth helperText="Để trống sẽ tự tạo từ tên gói." />
                                        )}
                                    />
                                    <Controller
                                        name="comboPrice"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                label="Giá gói (VNĐ)"
                                                fullWidth
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="originalPrice"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                label="Giá gốc (VNĐ)"
                                                fullWidth
                                                disabled
                                                value={field.value ?? ''}
                                                helperText="Tự động tính từ tổng giá thấp nhất (service_pricing) của các dịch vụ trong gói."
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="validFrom"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="Hiệu lực từ" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} />}
                                    />
                                    <Controller
                                        name="validTo"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="Hiệu lực đến" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} />}
                                    />
                                    <Controller name="discountPercentage" control={control} render={({ field }) => <TextField {...field} type="number" label="% giảm giá" fullWidth onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)} />} />
                                    <Controller name="displayOrder" control={control} render={({ field }) => <TextField {...field} type="number" label="Thứ tự hiển thị" fullWidth onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)} />} />
                                </Box>
                                <Controller name="description" control={control} render={({ field }) => <TextField {...field} label="Mô tả" multiline rows={3} fullWidth />} />
                                <FormUploadSingleFile name="imgURL" control={control} />
                            </Stack>
                        </CollapsibleCard>
                        <CollapsibleCard title="Dịch vụ trong gói" subheader="Chọn dịch vụ và số lượng" expanded={expanded2} onToggle={() => setExpanded2((p) => !p)}>
                            <Stack p="24px" gap="24px">
                                {fields.map((item, index) => (
                                    <Box key={item.id} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                        <Controller
                                            name={`serviceItems.${index}.serviceId`}
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    select
                                                    label="Dịch vụ"
                                                    fullWidth
                                                    sx={{ flex: 2 }}
                                                    value={field.value ?? ''}
                                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                                >
                                                    {services.map((s) => (
                                                        <MenuItem key={s.serviceId} value={s.serviceId}>
                                                            {s.serviceName} ({s.code})
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            )}
                                        />
                                        <Controller
                                            name={`serviceItems.${index}.quantity`}
                                            control={control}
                                            render={({ field, fieldState }) => (
                                                <TextField
                                                    {...field}
                                                    type="number"
                                                    label="Số lượng"
                                                    sx={{ width: 120 }}
                                                    error={!!fieldState.error}
                                                    helperText={fieldState.error?.message}
                                                    onChange={(e) => field.onChange(e.target.valueAsNumber ?? 1)}
                                                />
                                            )}
                                        />
                                        <IconButton color="error" onClick={() => remove(index)} disabled={fields.length <= 1} sx={{ mt: 1 }}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                ))}
                                <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={() => append({ serviceId: services[0]?.serviceId ?? 0, quantity: 1 })}>
                                    Thêm dịch vụ vào gói
                                </Button>
                            </Stack>
                        </CollapsibleCard>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <SwitchButton control={control} name="isActive" />
                            <Button
                                type="submit"
                                disabled={isPending}
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
                                {isPending ? 'Đang lưu...' : 'Cập nhật gói dịch vụ'}
                            </Button>
                        </Box>
                    </Stack>
                </form>
            </ThemeProvider>
        </>
    );
};
