import { Box, Stack, TextField, ThemeProvider, useTheme, Button, CircularProgress } from '@mui/material';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Title } from '../../components/ui/Title';
import { useState, useEffect } from 'react';
import { CollapsibleCard } from '../../components/ui/CollapsibleCard';
import { useAmenityCategoryDetail, useUpdateAmenityCategory } from './hooks/useAmenityCategory';
import { useForm, Controller } from 'react-hook-form';
import { SwitchButton } from '../../components/ui/SwitchButton';
import { getServiceTheme } from '../service/configs/theme';
import { prefixAdmin } from '../../constants/routes';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';

interface FormValues {
    categoryName: string;
    description: string;
    displayOrder: number | '';
    icon: string;
    isActive: boolean;
}

export const AmenityCategoryEditPage = () => {
    const { id } = useParams();
    const [expanded, setExpanded] = useState(true);
    const theme = useTheme();
    const localTheme = getServiceTheme(theme);

    const { data: detailRes, isLoading } = useAmenityCategoryDetail(id);
    const { mutate: update, isPending } = useUpdateAmenityCategory();

    const { control, handleSubmit, reset } = useForm<FormValues>({
        defaultValues: { categoryName: '', description: '', displayOrder: '', icon: '', isActive: true },
    });

    useEffect(() => {
        if (detailRes?.data) {
            const d = detailRes.data;
            reset({
                categoryName: d.categoryName ?? '',
                description: d.description ?? '',
                displayOrder: d.displayOrder ?? '',
                icon: d.icon ?? '',
                isActive: d.isActive ?? true,
            });
        }
    }, [detailRes, reset]);

    const onSubmit = (data: FormValues) => {
        if (!id) return;
        update(
            {
                id: Number(id),
                data: {
                    categoryName: data.categoryName.trim(),
                    description: data.description?.trim() || null,
                    displayOrder: data.displayOrder === '' ? 0 : Number(data.displayOrder),
                    icon: data.icon?.trim() || null,
                    isActive: data.isActive,
                },
            },
            {
                onSuccess: (res) => {
                    if (res?.success) toast.success(res.message ?? 'Cập nhật thành công');
                    else toast.error((res as { message?: string })?.message);
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
                    <Title title="Sửa danh mục tiện nghi" />
                    <Breadcrumb
                        items={[
                            { label: 'Trang chủ', to: '/' },
                            { label: 'Tiện nghi', to: `/${prefixAdmin}/amenity/list` },
                            { label: 'Danh mục tiện nghi', to: `/${prefixAdmin}/amenity-category/list` },
                            { label: 'Sửa' },
                        ]}
                    />
                </div>
            </div>
            <ThemeProvider theme={localTheme}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Stack sx={{ margin: '0px 120px', gap: '32px', maxWidth: 720 }}>
                        <CollapsibleCard title="Thông tin danh mục" expanded={expanded} onToggle={() => setExpanded((p) => !p)}>
                            <Stack p="24px" gap="24px">
                                <Controller
                                    name="categoryName"
                                    control={control}
                                    rules={{ required: 'Tên danh mục là bắt buộc' }}
                                    render={({ field, fieldState }) => (
                                        <TextField {...field} label="Tên danh mục" error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth size="small" />
                                    )}
                                />
                                <Controller
                                    name="description"
                                    control={control}
                                    render={({ field }) => <TextField {...field} label="Mô tả" multiline rows={2} fullWidth size="small" />}
                                />
                                <Controller
                                    name="displayOrder"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            type="number"
                                            label="Thứ tự hiển thị"
                                            fullWidth
                                            size="small"
                                            value={field.value === '' ? '' : field.value}
                                            onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                                        />
                                    )}
                                />
                                <Controller name="icon" control={control} render={({ field }) => <TextField {...field} label="Icon" fullWidth size="small" />} />
                                <SwitchButton control={control} name="isActive" label="Hoạt động" />
                            </Stack>
                        </CollapsibleCard>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                type="submit"
                                disabled={isPending}
                                variant="contained"
                                sx={{ bgcolor: '#1C252E', '&:hover': { bgcolor: '#454F5B' }, textTransform: 'none', fontWeight: 600 }}
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
