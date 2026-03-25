import { Box, Button, Stack, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../../../components/ui/Breadcrumb';
import { Title } from '../../../components/ui/Title';
import { useCreateStaffPosition } from './hooks/useStaffPosition';
import { useForm, Controller } from 'react-hook-form';
import { prefixAdmin } from '../../../constants/routes';
import { toast } from 'react-toastify';

interface PositionFormValues {
    code: string;
    name: string;
    description: string;
}

export const StaffPositionCreatePage = () => {
    const navigate = useNavigate();
    const { control, handleSubmit } = useForm<PositionFormValues>({
        defaultValues: { code: '', name: '', description: '' },
    });
    const { mutate: create, isPending } = useCreateStaffPosition();

    const onSubmit = (data: PositionFormValues) => {
        create(
            { code: data.code.trim(), name: data.name.trim(), description: data.description?.trim() || undefined },
            {
                onSuccess: (res: any) => {
                    if (res?.success) {
                        toast.success(res.message ?? 'Tạo chức vụ thành công');
                        navigate(`/${prefixAdmin}/staff/position/list`);
                    } else toast.error(res?.message ?? 'Có lỗi');
                },
                onError: (err: any) => {
                    const msg = err?.response?.data?.message ?? err?.message ?? 'Tạo chức vụ thất bại.';
                    toast.error(msg);
                },
            }
        );
    };

    return (
        <>
            <Box sx={{ px: '40px', py: '32px', mb: '24px' }}>
                <Title title="Thêm chức vụ" />
                <Breadcrumb
                    items={[
                        { label: 'Trang chủ', to: '/' },
                        { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                        { label: 'Danh mục chức vụ', to: `/${prefixAdmin}/staff/position/list` },
                        { label: 'Thêm chức vụ' },
                    ]}
                />
            </Box>
            <Box sx={{ px: '40px', pb: '40px', display: 'flex', justifyContent: 'center' }}>
                <Box
                    component="form"
                    onSubmit={handleSubmit(onSubmit)}
                    sx={{
                        width: '100%',
                        maxWidth: 960,
                        borderRadius: 3,
                        bgcolor: '#ffffff',
                        boxShadow: '0 12px 30px rgba(15,23,42,0.06)',
                        border: '1px solid rgba(229,231,235,1)',
                        p: 4,
                    }}
                >
                    <Stack spacing={2.5}>
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
                            rules={{ maxLength: { value: 500, message: 'Mô tả không được vượt quá 500 ký tự' } }}
                            render={({ field, fieldState }) => (
                                <TextField
                                    {...field}
                                    label="Mô tả"
                                    fullWidth
                                    multiline
                                    rows={3}
                                    error={!!fieldState.error}
                                    helperText={
                                        fieldState.error?.message ??
                                        (field.value?.length != null && field.value.length > 0 ? `${field.value.length}/500` : '')
                                    }
                                    inputProps={{ maxLength: 500 }}
                                />
                            )}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 1 }}>
                            <Button
                                type="button"
                                variant="outlined"
                                onClick={() => navigate(`/${prefixAdmin}/staff/position/list`)}
                            >
                                Hủy
                            </Button>
                            <Button type="submit" variant="contained" disabled={isPending}>
                                {isPending ? 'Đang tạo...' : 'Tạo chức vụ'}
                            </Button>
                        </Box>
                    </Stack>
                </Box>
            </Box>
        </>
    );
};
