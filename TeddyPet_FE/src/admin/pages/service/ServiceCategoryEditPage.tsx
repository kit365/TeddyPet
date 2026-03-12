import { Box, Stack, TextField, ThemeProvider, useTheme, Button, CircularProgress } from '@mui/material';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Title } from '../../components/ui/Title';
import { useState, useEffect } from 'react';
import { CollapsibleCard } from '../../components/ui/CollapsibleCard';
import { useServiceCategoryDetail, useUpdateServiceCategory } from './hooks/useServiceCategory';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { serviceCategoryUpsertSchema, type ServiceCategoryUpsertFormValues } from '../../schemas/service-category.schema';
import { SwitchButton } from '../../components/ui/SwitchButton';
import { getServiceTheme } from './configs/theme';
import { prefixAdmin } from '../../constants/routes';
import { FormUploadSingleFile } from '../../components/upload/FormUploadSingleFile';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';

export const ServiceCategoryEditPage = () => {
    const { id } = useParams();
    const [expanded, setExpanded] = useState(true);
    const theme = useTheme();
    const localTheme = getServiceTheme(theme);

    const { data: detailRes, isLoading } = useServiceCategoryDetail(id);
    const { mutate: update, isPending } = useUpdateServiceCategory();

    const { control, handleSubmit, reset } = useForm<ServiceCategoryUpsertFormValues>({
        resolver: zodResolver(serviceCategoryUpsertSchema),
        defaultValues: { name: '', description: '', isActive: true, imageUrl: '', colorCode: '' },
    });

    useEffect(() => {
        if (detailRes?.data) {
            const d = detailRes.data;
            reset({
                name: d.categoryName ?? '',
                description: d.description ?? '',
                serviceType: d.serviceType ?? '',
                pricingModel: d.pricingModel ?? '',
                metaTitle: d.metaTitle ?? '',
                metaDescription: d.metaDescription ?? '',
                icon: d.icon ?? '',
                imageUrl: d.imageUrl ?? '',
                colorCode: d.colorCode ?? '',
                parentId: d.parentId ?? null,
                displayOrder: d.displayOrder ?? undefined,
                isActive: d.isActive ?? true,
            });
        }
    }, [detailRes, reset]);

    const onSubmit = (data: ServiceCategoryUpsertFormValues) => {
        update(
            {
                categoryId: Number(id),
                name: data.name,
                description: data.description,
                serviceType: data.serviceType,
                pricingModel: data.pricingModel,
                metaTitle: data.metaTitle,
                metaDescription: data.metaDescription,
                icon: data.icon,
                imageUrl: data.imageUrl,
                colorCode: data.colorCode || undefined,
                parentId: data.parentId ?? undefined,
                displayOrder: data.displayOrder,
                isActive: data.isActive,
            },
            {
                onSuccess: (res) => {
                    if (res?.success) toast.success(res.message ?? 'Cập nhật thành công');
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
                    <Title title="Sửa danh mục dịch vụ" />
                    <Breadcrumb
                        items={[
                            { label: 'Trang chủ', to: '/' },
                            { label: 'Quản lý dịch vụ', to: `/${prefixAdmin}/service/list` },
                            { label: 'Danh mục dịch vụ', to: `/${prefixAdmin}/service-category/list` },
                            { label: 'Sửa' },
                        ]}
                    />
                </div>
            </div>
            <ThemeProvider theme={localTheme}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Stack sx={{ margin: '0px 120px', gap: '40px' }}>
                        <CollapsibleCard title="Chi tiết" subheader="Thông tin danh mục" expanded={expanded} onToggle={() => setExpanded((p) => !p)}>
                            <Stack p="24px" gap="24px">
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px 16px' }}>
                                    <Controller
                                        name="name"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField {...field} label="Tên danh mục" error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
                                        )}
                                    />
                                    <Controller
                                        name="serviceType"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="Loại dịch vụ" fullWidth />}
                                    />
                                    <Controller
                                        name="pricingModel"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="Mô hình giá" fullWidth />}
                                    />
                                    <Controller
                                        name="colorCode"
                                        control={control}
                                        render={({ field }) => (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                                <input
                                                    type="color"
                                                    value={field.value && /^#[0-9A-Fa-f]{6}$/.test(field.value) ? field.value : '#4A90D9'}
                                                    onChange={(e) => field.onChange(e.target.value)}
                                                    style={{
                                                        width: 40,
                                                        height: 40,
                                                        border: '1px solid #ccc',
                                                        borderRadius: 4,
                                                        cursor: 'pointer',
                                                        padding: 0,
                                                    }}
                                                />
                                                <TextField
                                                    {...field}
                                                    label="Mã màu"
                                                    placeholder="#RRGGBB"
                                                    fullWidth
                                                    size="small"
                                                />
                                            </Box>
                                        )}
                                    />
                                </Box>
                                <Controller
                                    name="description"
                                    control={control}
                                    render={({ field }) => <TextField {...field} label="Mô tả" multiline rows={3} fullWidth />}
                                />
                                <FormUploadSingleFile name="imageUrl" control={control} />
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
                                {isPending ? 'Đang lưu...' : 'Cập nhật'}
                            </Button>
                        </Box>
                    </Stack>
                </form>
            </ThemeProvider>
        </>
    );
};
