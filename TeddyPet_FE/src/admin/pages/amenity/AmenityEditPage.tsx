import { Box, Stack, TextField, ThemeProvider, useTheme, Button, CircularProgress, MenuItem } from '@mui/material';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Title } from '../../components/ui/Title';
import { useState, useEffect } from 'react';
import { CollapsibleCard } from '../../components/ui/CollapsibleCard';
import { useAmenityDetail, useUpdateAmenity } from './hooks/useAmenity';
import { useAmenityCategoriesAdmin } from './hooks/useAmenityCategory';
import { useForm, Controller } from 'react-hook-form';
import { SwitchButton } from '../../components/ui/SwitchButton';
import { FormUploadSingleFile } from '../../components/upload/FormUploadSingleFile';
import { getServiceTheme } from '../service/configs/theme';
import { prefixAdmin } from '../../constants/routes';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';

interface FormValues {
    categoryId: number | '';
    description: string;
    icon: string;
    image: string;
    displayOrder: number | '';
    isActive: boolean;
}

export const AmenityEditPage = () => {
    const { id } = useParams();
    const [expanded, setExpanded] = useState(true);
    const theme = useTheme();
    const localTheme = getServiceTheme(theme);
    const { data: categories = [] } = useAmenityCategoriesAdmin();

    const { data: detailRes, isLoading } = useAmenityDetail(id);
    const { mutate: update, isPending } = useUpdateAmenity();

    const { control, handleSubmit, reset } = useForm<FormValues>({
        defaultValues: { categoryId: '', description: '', icon: '', image: '', displayOrder: '', isActive: true },
    });

    useEffect(() => {
        if (detailRes?.data) {
            const d = detailRes.data;
            reset({
                categoryId: d.categoryId ?? '',
                description: d.description ?? '',
                icon: d.icon ?? '',
                image: d.image ?? '',
                displayOrder: d.displayOrder ?? '',
                isActive: d.isActive ?? true,
            });
        }
    }, [detailRes, reset]);

    const onSubmit = (data: FormValues) => {
        if (!id || data.categoryId === '') return;
        update(
            {
                id: Number(id),
                data: {
                    categoryId: Number(data.categoryId),
                    description: data.description?.trim() || null,
                    icon: data.icon?.trim() || null,
                    image: data.image?.trim() || null,
                    displayOrder: data.displayOrder === '' ? 0 : Number(data.displayOrder),
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
                    <Title title="Sửa tiện nghi" />
                    <Breadcrumb
                        items={[
                            { label: 'Trang chủ', to: '/' },
                            { label: 'Tiện nghi', to: `/${prefixAdmin}/amenity/list` },
                            { label: 'Sửa' },
                        ]}
                    />
                </div>
            </div>
            <ThemeProvider theme={localTheme}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Stack sx={{ margin: '0 auto', maxWidth: 720, gap: '32px', px: 2 }}>
                        <CollapsibleCard title="Thông tin tiện nghi" expanded={expanded} onToggle={() => setExpanded((p) => !p)}>
                            <Stack p="24px" gap="24px">
                                <Controller
                                    name="categoryId"
                                    control={control}
                                    rules={{ required: 'Danh mục là bắt buộc' }}
                                    render={({ field, fieldState }) => (
                                        <TextField
                                            {...field}
                                            select
                                            label="Danh mục"
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                            fullWidth
                                            size="small"
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                                        >
                                            <MenuItem value="">— Chọn danh mục —</MenuItem>
                                            {categories.map((c) => (
                                                <MenuItem key={c.id} value={c.id}>
                                                    {c.categoryName}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    )}
                                />
                                <Controller
                                    name="description"
                                    control={control}
                                    render={({ field }) => <TextField {...field} label="Mô tả / Tên tiện nghi" fullWidth size="small" />}
                                />
                                <FormUploadSingleFile name="icon" control={control} compact title="Icon" />
                                <FormUploadSingleFile name="image" control={control} compact title="Ảnh" />
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
