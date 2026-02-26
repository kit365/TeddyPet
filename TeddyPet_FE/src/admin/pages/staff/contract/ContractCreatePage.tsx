import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import { Breadcrumb } from '../../../components/ui/Breadcrumb';
import { Title } from '../../../components/ui/Title';
import { useCreateContract } from '../hooks/useContract';
import { useStaffProfiles } from '../hooks/useStaffProfile';
import { useForm, Controller } from 'react-hook-form';
import { prefixAdmin } from '../../../constants/routes';
import { toast } from 'react-toastify';

interface FormValues {
    staffId: number | '';
    baseSalary: number | '';
    startDate: string;
    endDate: string;
    status: string;
}

export const ContractCreatePage = () => {
    const { data: profiles = [] } = useStaffProfiles();
    const { control, handleSubmit } = useForm<FormValues>({
        defaultValues: { staffId: '', baseSalary: '', startDate: '', endDate: '', status: 'ACTIVE' },
    });
    const { mutate: create, isPending } = useCreateContract();

    const onSubmit = (data: FormValues) => {
        if (data.staffId === '' || data.baseSalary === '') {
            toast.error('Chọn nhân viên và nhập lương cơ bản');
            return;
        }
        create(
            {
                staffId: Number(data.staffId),
                baseSalary: Number(data.baseSalary),
                startDate: data.startDate,
                endDate: data.endDate || undefined,
                status: data.status || 'ACTIVE',
            },
            {
                onSuccess: (res: any) => {
                    if (res?.success) {
                        toast.success(res.message ?? 'Tạo hợp đồng thành công');
                        window.location.href = `/${prefixAdmin}/staff/contract/list`;
                    } else toast.error(res?.message ?? 'Có lỗi');
                },
            }
        );
    };

    return (
        <>
            <Box sx={{ px: '40px', py: '32px', mb: '24px' }}>
                <Title title="Thêm hợp đồng" />
                <Breadcrumb
                    items={[
                        { label: 'Trang chủ', to: '/' },
                        { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                        { label: 'Hợp đồng', to: `/${prefixAdmin}/staff/contract/list` },
                        { label: 'Thêm hợp đồng' },
                    ]}
                />
            </Box>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 480, px: '40px' }}>
                <Stack spacing={2}>
                    <Controller
                        name="staffId"
                        control={control}
                        rules={{ required: 'Chọn nhân viên' }}
                        render={({ field, fieldState }) => (
                            <TextField {...field} select label="Nhân viên" required fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} value={field.value || ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}>
                                <MenuItem value="">— Chọn —</MenuItem>
                                {profiles.map((p) => (
                                    <MenuItem key={p.staffId} value={p.staffId}>{p.fullName}</MenuItem>
                                ))}
                            </TextField>
                        )}
                    />
                    <Controller
                        name="baseSalary"
                        control={control}
                        rules={{ required: 'Nhập lương cơ bản', min: { value: 0, message: 'Lương >= 0' } }}
                        render={({ field, fieldState }) => (
                            <TextField {...field} type="number" label="Lương cơ bản" required fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
                        )}
                    />
                    <Controller
                        name="startDate"
                        control={control}
                        rules={{ required: 'Chọn ngày bắt đầu' }}
                        render={({ field, fieldState }) => (
                            <TextField {...field} type="date" label="Ngày bắt đầu" required fullWidth InputLabelProps={{ shrink: true }} error={!!fieldState.error} helperText={fieldState.error?.message} />
                        )}
                    />
                    <Controller name="endDate" control={control} render={({ field }) => <TextField {...field} type="date" label="Ngày kết thúc" fullWidth InputLabelProps={{ shrink: true }} />} />
                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <TextField {...field} select label="Trạng thái" fullWidth>
                                <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                                <MenuItem value="EXPIRED">EXPIRED</MenuItem>
                            </TextField>
                        )}
                    />
                    <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
                        <Button type="submit" variant="contained" disabled={isPending}>{isPending ? 'Đang tạo...' : 'Tạo hợp đồng'}</Button>
                        <Button type="button" variant="outlined" onClick={() => (window.location.href = `/${prefixAdmin}/staff/contract/list`)}>Hủy</Button>
                    </Box>
                </Stack>
            </Box>
        </>
    );
};
