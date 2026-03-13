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
                    if (r?.success) toast.success(r.message ?? 'Cập nhật thành công');
                    else toast.error(r?.message ?? 'Có lỗi');
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
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 1 }}>
                            <Button
                                type="button"
                                variant="outlined"
                                onClick={() => navigate(`/${prefixAdmin}/staff/skill/list`)}
                            >
                                Hủy
                            </Button>
                            <Button type="submit" variant="contained" disabled={isPending}>
                                {isPending ? 'Đang lưu...' : 'Lưu'}
                            </Button>
                        </Box>
                    </Stack>
                </Box>
            </Box>
        </>
    );
};
