import { Box, Stack, TextField, ThemeProvider, useTheme, Button } from '@mui/material';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Title } from '../../components/ui/Title';
import { useState } from 'react';
import { CollapsibleCard } from '../../components/ui/CollapsibleCard';
import { useCreateAmenityCategory } from './hooks/useAmenityCategory';
import { useForm, Controller } from 'react-hook-form';
import { SwitchButton } from '../../components/ui/SwitchButton';
import { getServiceTheme } from '../service/configs/theme';
import { prefixAdmin } from '../../constants/routes';
import { toast } from 'react-toastify';

interface FormValues {
    categoryName: string;
    description: string;
    displayOrder: number | '';
    icon: string;
    isActive: boolean;
}

export const AmenityCategoryCreatePage = () => {
    const [expanded, setExpanded] = useState(true);
    const theme = useTheme();
    const localTheme = getServiceTheme(theme);

    const { control, handleSubmit } = useForm<FormValues>({
        defaultValues: {
            categoryName: '',
            description: '',
            displayOrder: '',
            icon: '',
            isActive: true,
        },
    });

    const { mutate: create, isPending } = useCreateAmenityCategory();

    const onSubmit = (data: FormValues) => {
        create(
            {
                categoryName: data.categoryName.trim(),
                description: data.description?.trim() || null,
                displayOrder: data.displayOrder === '' ? 0 : Number(data.displayOrder),
                icon: data.icon?.trim() || null,
                isActive: data.isActive,
            },
            {
                onSuccess: (res) => {
                    if (res?.success) {
                        toast.success(res.message ?? 'Tạo danh mục thành công');
                        window.location.href = `/${prefixAdmin}/amenity-category/list`;
                    } else toast.error((res as { message?: string })?.message);
                },
            }
        );
    };

    return (
        <>
            <div className="mb-[40px] gap-[16px] flex items-start justify-end">
                <div className="mr-auto">
                    <Title title="Thêm danh mục tiện nghi" />
                    <Breadcrumb
                        items={[
                            { label: 'Trang chủ', to: '/' },
                            { label: 'Tiện nghi', to: `/${prefixAdmin}/amenity/list` },
                            { label: 'Danh mục tiện nghi', to: `/${prefixAdmin}/amenity-category/list` },
                            { label: 'Thêm' },
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
                                        <TextField
                                            {...field}
                                            label="Tên danh mục"
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                            fullWidth
                                            size="small"
                                        />
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
                                <Controller name="icon" control={control} render={({ field }) => <TextField {...field} label="Icon (tên hoặc class)" fullWidth size="small" />} />
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
                                {isPending ? 'Đang lưu...' : 'Tạo danh mục'}
                            </Button>
                        </Box>
                    </Stack>
                </form>
            </ThemeProvider>
        </>
    );
};
