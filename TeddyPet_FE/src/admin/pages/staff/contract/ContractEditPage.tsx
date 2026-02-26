import { useParams } from 'react-router-dom';
import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import { Breadcrumb } from '../../../components/ui/Breadcrumb';
import { Title } from '../../../components/ui/Title';
import { useContractById, useUpdateContract } from '../hooks/useContract';
import { useStaffProfiles } from '../hooks/useStaffProfile';
import { useForm, Controller } from 'react-hook-form';
import { prefixAdmin } from '../../../constants/routes';
import { toast } from 'react-toastify';
import { useEffect } from 'react';

interface FormValues {
    staffId: number;
    baseSalary: number;
    startDate: string;
    endDate: string;
    status: string;
}

export const ContractEditPage = () => {
    const { id } = useParams<{ id: string }>();
    const { data: res } = useContractById(id ? Number(id) : null);
    const contract = (res as any)?.data;
    const { data: profiles = [] } = useStaffProfiles();

    const { control, handleSubmit, reset } = useForm<FormValues>({
        defaultValues: { staffId: 0, baseSalary: 0, startDate: '', endDate: '', status: 'ACTIVE' },
    });

    useEffect(() => {
        if (contract) {
            reset({
                staffId: contract.staffId,
                baseSalary: contract.baseSalary,
                startDate: contract.startDate?.slice(0, 10) ?? '',
                endDate: contract.endDate?.slice(0, 10) ?? '',
                status: contract.status ?? 'ACTIVE',
            });
        }
    }, [contract, reset]);

    const { mutate: update, isPending } = useUpdateContract();

    const onSubmit = (data: FormValues) => {
        if (!id) return;
        update(
            {
                contractId: Number(id),
                data: {
                    staffId: data.staffId,
                    baseSalary: data.baseSalary,
                    startDate: data.startDate,
                    endDate: data.endDate || undefined,
                    status: data.status,
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
                <Title title="Sửa hợp đồng" />
                <Breadcrumb
                    items={[
                        { label: 'Trang chủ', to: '/' },
                        { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                        { label: 'Hợp đồng', to: `/${prefixAdmin}/staff/contract/list` },
                        { label: 'Sửa hợp đồng' },
                    ]}
                />
            </Box>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 480, px: '40px' }}>
                <Stack spacing={2}>
                    <Controller
                        name="staffId"
                        control={control}
                        render={({ field }) => (
                            <TextField {...field} select label="Nhân viên" fullWidth disabled>
                                {profiles.map((p) => (
                                    <MenuItem key={p.staffId} value={p.staffId}>{p.fullName}</MenuItem>
                                ))}
                            </TextField>
                        )}
                    />
                    <Controller
                        name="baseSalary"
                        control={control}
                        rules={{ required: true, min: 0 }}
                        render={({ field, fieldState }) => (
                            <TextField {...field} type="number" label="Lương cơ bản" fullWidth error={!!fieldState.error} onChange={(e) => field.onChange(Number(e.target.value))} />
                        )}
                    />
                    <Controller name="startDate" control={control} render={({ field }) => <TextField {...field} type="date" label="Ngày bắt đầu" fullWidth InputLabelProps={{ shrink: true }} />} />
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
                        <Button type="submit" variant="contained" disabled={isPending}>Lưu</Button>
                        <Button type="button" variant="outlined" onClick={() => (window.location.href = `/${prefixAdmin}/staff/contract/list`)}>Hủy</Button>
                    </Box>
                </Stack>
            </Box>
        </>
    );
};
