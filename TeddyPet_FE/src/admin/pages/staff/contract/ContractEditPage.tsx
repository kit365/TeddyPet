import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import { Breadcrumb } from '../../../components/ui/Breadcrumb';
import { Title } from '../../../components/ui/Title';
import { useContractById, useUpdateContract } from '../hooks/useContract';
import { useStaffProfiles } from '../hooks/useStaffProfile';
import { useForm, Controller } from 'react-hook-form';
import { prefixAdmin } from '../../../constants/routes';
import { toast } from 'react-toastify';
import { useEffect } from 'react';
import type { ContractType } from '../../../api/contract.api';

const CONTRACT_TYPE_OPTIONS: { value: ContractType; label: string }[] = [
    { value: 'FULL_TIME', label: 'Full-time (Toàn thời gian)' },
    { value: 'PART_TIME', label: 'Part-time (Bán thời gian)' },
];

interface FormValues {
    staffId: number;
    contractType: ContractType;
    baseSalary: number;
    startDate: string;
    endDate: string;
    status: string;
}

export const ContractEditPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: res } = useContractById(id ? Number(id) : null);
    const contract = (res as any)?.data;
    const { data: profiles = [] } = useStaffProfiles();

    const { control, handleSubmit, reset, watch } = useForm<FormValues>({
        defaultValues: {
            staffId: 0,
            contractType: 'FULL_TIME',
            baseSalary: 0,
            startDate: '',
            endDate: '',
            status: 'ACTIVE',
        },
    });
    const contractType = watch('contractType');

    useEffect(() => {
        if (contract) {
            reset({
                staffId: contract.staffId,
                contractType: contract.contractType ?? 'FULL_TIME',
                baseSalary: contract.baseSalary ?? 0,
                startDate: contract.startDate?.slice(0, 10) ?? '',
                endDate: contract.endDate?.slice(0, 10) ?? '',
                status: contract.status ?? 'ACTIVE',
            });
        }
    }, [contract, reset]);

    const salaryLabel =
        contractType === 'FULL_TIME'
            ? 'Lương cơ bản (VNĐ/tháng)'
            : 'Lương theo giờ (VNĐ/giờ)';

    const { mutate: update, isPending } = useUpdateContract();

    const onSubmit = (data: FormValues) => {
        if (!id) return;
        if (data.baseSalary <= 0) {
            toast.error('Lương phải lớn hơn 0');
            return;
        }
        update(
            {
                contractId: Number(id),
                data: {
                    staffId: data.staffId,
                    contractType: data.contractType,
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
                onError: (err: any) => {
                    const msg = err?.response?.data?.message ?? err?.message ?? 'Có lỗi xảy ra';
                    toast.error(msg);
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
                        name="contractType"
                        control={control}
                        render={({ field }) => (
                            <TextField {...field} select label="Loại hợp đồng" fullWidth onChange={(e) => field.onChange(e.target.value as ContractType)}>
                                {CONTRACT_TYPE_OPTIONS.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                ))}
                            </TextField>
                        )}
                    />
                    <Controller
                        name="baseSalary"
                        control={control}
                        rules={{ required: true, min: { value: 0.01, message: 'Lương phải lớn hơn 0' } }}
                        render={({ field, fieldState }) => (
                            <TextField {...field} type="number" label={salaryLabel} fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} inputProps={{ min: 0.01, step: 'any' }} onChange={(e) => field.onChange(Number(e.target.value))} />
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
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, pt: 1 }}>
                        <Button
                            type="button"
                            onClick={() => navigate(`/${prefixAdmin}/staff/contract/list`)}
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
