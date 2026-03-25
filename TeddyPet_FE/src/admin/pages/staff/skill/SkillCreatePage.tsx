import { Box, Button, Stack, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../../../components/ui/Breadcrumb';
import { Title } from '../../../components/ui/Title';
import { useCreateSkill } from '../hooks/useSkill';
import { useForm, Controller } from 'react-hook-form';
import { prefixAdmin } from '../../../constants/routes';
import { toast } from 'react-toastify';

interface SkillFormValues {
    code: string;
    name: string;
    description: string;
}

export const SkillCreatePage = () => {
    const navigate = useNavigate();
    const { control, handleSubmit } = useForm<SkillFormValues>({
        defaultValues: { code: '', name: '', description: '' },
    });
    const { mutate: create, isPending } = useCreateSkill();

    const onSubmit = (data: SkillFormValues) => {
        create(
            { code: data.code.trim(), name: data.name.trim(), description: data.description?.trim() || undefined },
            {
                onSuccess: (res: any) => {
                    if (res?.success) {
                        toast.success(res.message ?? 'Tạo kỹ năng thành công');
                        navigate(`/${prefixAdmin}/staff/skill/list`);
                    } else toast.error(res?.message ?? 'Có lỗi');
                },
                onError: (err: any) => {
                    const msg = err?.response?.data?.message ?? err?.message ?? 'Có lỗi xảy ra';
                    toast.error(msg);
                },
            }
        );
    };

    return (
        <>
            <Box sx={{ px: '40px', py: '32px', mb: '24px' }}>
                <Title title="Thêm kỹ năng" />
                <Breadcrumb
                    items={[
                        { label: 'Trang chủ', to: '/' },
                        { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                        { label: 'Danh mục kỹ năng', to: `/${prefixAdmin}/staff/skill/list` },
                        { label: 'Thêm kỹ năng' },
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
                            rules={{ required: 'Nhập mã kỹ năng' }}
                            render={({ field, fieldState }) => (
                                <TextField
                                    {...field}
                                    label="Mã kỹ năng"
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
                            rules={{ required: 'Nhập tên kỹ năng' }}
                            render={({ field, fieldState }) => (
                                <TextField
                                    {...field}
                                    label="Tên kỹ năng"
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
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 1 }}>
                            <Button
                                type="button"
                                variant="outlined"
                                onClick={() => navigate(`/${prefixAdmin}/staff/skill/list`)}
                            >
                                Hủy
                            </Button>
                            <Button type="submit" variant="contained" disabled={isPending}>
                                {isPending ? 'Đang tạo...' : 'Tạo kỹ năng'}
                            </Button>
                        </Box>
                    </Stack>
                </Box>
            </Box>
        </>
    );
};
