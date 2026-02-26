import { useParams } from 'react-router-dom';
import { Box, Button, Stack, TextField } from '@mui/material';
import { Breadcrumb } from '../../../components/ui/Breadcrumb';
import { Title } from '../../../components/ui/Title';
import { useStaffPositionById, useUpdateStaffPosition } from './hooks/useStaffPosition';
import { useForm, Controller } from 'react-hook-form';
import { prefixAdmin } from '../../../constants/routes';
import { toast } from 'react-toastify';
import { useEffect } from 'react';

interface PositionFormValues {
    code: string;
    name: string;
    description: string;
}

export const StaffPositionEditPage = () => {
    const { id } = useParams<{ id: string }>();
    const { data: res } = useStaffPositionById(id);
    const positionData = (res as { data?: { code?: string; name?: string; description?: string } })?.data;

    const { control, handleSubmit, reset } = useForm<PositionFormValues>({
        defaultValues: { code: '', name: '', description: '' },
    });

    useEffect(() => {
        if (positionData) {
            reset({
                code: positionData.code ?? '',
                name: positionData.name ?? '',
                description: positionData.description ?? '',
            });
        }
    }, [positionData, reset]);

    const { mutate: update, isPending } = useUpdateStaffPosition();

    const onSubmit = (data: PositionFormValues) => {
        if (!id) return;
        update(
            {
                id: Number(id),
                data: {
                    code: data.code.trim(),
                    name: data.name.trim(),
                    description: data.description?.trim() || undefined,
                },
            },
            {
                onSuccess: (r: any) => {
                    if (r?.success) toast.success(r.message ?? 'Cập nhật thành công');
                    else toast.error(r?.message ?? 'Có lỗi');
                },
                onError: (err: any) => {
                    const msg = err?.response?.data?.message ?? err?.message ?? 'Cập nhật thất bại.';
                    toast.error(msg);
                },
            }
        );
    };

    if (!id) return null;

    return (
        <>
            <Box sx={{ px: '40px', py: '32px', mb: '24px' }}>
                <Title title="Sửa chức vụ" />
                <Breadcrumb
                    items={[
                        { label: 'Trang chủ', to: '/' },
                        { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                        { label: 'Danh mục chức vụ', to: `/${prefixAdmin}/staff/position/list` },
                        { label: 'Sửa chức vụ' },
                    ]}
                />
            </Box>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 640, px: '40px' }}>
                <Stack spacing={2}>
                    <Controller
                        name="code"
                        control={control}
                        rules={{ required: 'Nhập mã chức vụ' }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                label="Mã chức vụ"
                                required
                                fullWidth
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                            />
                        )}
                    />
                    <Controller
                        name="name"
                        control={control}
                        rules={{ required: 'Nhập tên chức vụ' }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                label="Tên chức vụ"
                                required
                                fullWidth
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                            />
                        )}
                    />
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => <TextField {...field} label="Mô tả" fullWidth multiline rows={3} />}
                    />
                    <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
                        <Button type="submit" variant="contained" disabled={isPending}>
                            {isPending ? 'Đang lưu...' : 'Lưu'}
                        </Button>
                        <Button
                            type="button"
                            variant="outlined"
                            onClick={() => (window.location.href = `/${prefixAdmin}/staff/position/list`)}
                        >
                            Hủy
                        </Button>
                    </Box>
                </Stack>
            </Box>
        </>
    );
};
