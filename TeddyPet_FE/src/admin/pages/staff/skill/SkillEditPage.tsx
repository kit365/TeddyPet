import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Stack, TextField } from '@mui/material';
import { Breadcrumb } from '../../../components/ui/Breadcrumb';
import { Title } from '../../../components/ui/Title';
import { useSkillById, useUpdateSkill } from '../hooks/useSkill';
import { useForm, Controller } from 'react-hook-form';
import { prefixAdmin } from '../../../constants/routes';
import { toast } from 'react-toastify';
import { useEffect } from 'react';

interface SkillFormValues {
    code: string;
    name: string;
    description: string;
}

export const SkillEditPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: res } = useSkillById(id);
    const skillData = (res as { data?: { code?: string; name?: string; description?: string } })?.data;

    const { control, handleSubmit, reset } = useForm<SkillFormValues>({
        defaultValues: { code: '', name: '', description: '' },
    });

    useEffect(() => {
        if (skillData) {
            reset({
                code: skillData.code ?? '',
                name: skillData.name ?? '',
                description: skillData.description ?? '',
            });
        }
    }, [skillData, reset]);

    const { mutate: update, isPending } = useUpdateSkill();

    const onSubmit = (data: SkillFormValues) => {
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
                    const success = r?.success ?? r?.data !== undefined;
                    const msg = r?.message ?? (typeof r?.data?.message === 'string' ? r.data.message : null);
                    if (success) toast.success(msg ?? 'Cập nhật kỹ năng thành công.');
                    else toast.error(msg ?? 'Có lỗi khi cập nhật.');
                },
                onError: (err: any) => {
                    const msg = err?.response?.data?.message ?? err?.message ?? 'Cập nhật kỹ năng thất bại.';
                    toast.error(msg);
                },
            }
        );
    };

    if (!id) return null;

    return (
        <>
            <Box sx={{ px: '40px', py: '32px', mb: '24px' }}>
                <Title title="Sửa kỹ năng" />
                <Breadcrumb
                    items={[
                        { label: 'Trang chủ', to: '/' },
                        { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                        { label: 'Danh mục kỹ năng', to: `/${prefixAdmin}/staff/skill/list` },
                        { label: 'Sửa kỹ năng' },
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
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, pt: 1 }}>
                            <Button
                                type="button"
                                onClick={() => navigate(`/${prefixAdmin}/staff/skill/list`)}
                                sx={{
                                    minWidth: 96,
                                    px: 2.5,
                                    borderRadius: 999,
                                    borderColor: '#E2E8F0',
                                    bgcolor: '#FFFFFF',
                                    color: '#64748B',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    '&:hover': {
                                        bgcolor: '#F8FAFC',
                                        borderColor: '#E2E8F0',
                                    },
                                }}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPending}
                                sx={{
                                    minWidth: 120,
                                    px: 3,
                                    borderRadius: 999,
                                    bgcolor: '#020617',
                                    color: '#FFFFFF',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    boxShadow: '0 6px 18px rgba(15,23,42,0.25)',
                                    '&:hover': {
                                        bgcolor: '#020617',
                                        boxShadow: '0 10px 28px rgba(15,23,42,0.35)',
                                    },
                                    '&.Mui-disabled': {
                                        bgcolor: '#020617',
                                        opacity: 0.5,
                                        color: '#FFFFFF',
                                    },
                                }}
                            >
                                {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </Button>
                        </Box>
                    </Stack>
                </Box>
            </Box>
        </>
    );
};
