import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../../../components/ui/Breadcrumb';
import { Title } from '../../../components/ui/Title';
import { useCreateContract } from '../hooks/useContract';
import { useStaffProfiles } from '../hooks/useStaffProfile';
import { useForm, Controller } from 'react-hook-form';
import { prefixAdmin } from '../../../constants/routes';
import { toast } from 'react-toastify';
import { useEffect } from 'react';
import type { ContractType } from '../../../api/contract.api';

interface FormValues {
    staffId: number | '';
    contractType: ContractType;
    salaryAmount: number | '';
    startDate: string;
    endDate: string;
    status: string;
}

const CONTRACT_TYPE_OPTIONS: { value: ContractType; label: string }[] = [
    { value: 'FULL_TIME', label: 'Full-time (Toàn thời gian)' },
    { value: 'PART_TIME', label: 'Part-time (Bán thời gian)' },
];

export const ContractCreatePage = () => {
    const navigate = useNavigate();
    const { data: profiles = [] } = useStaffProfiles();
    const { control, handleSubmit, watch, setValue } = useForm<FormValues>({
        defaultValues: {
            staffId: '',
            contractType: 'FULL_TIME',
            salaryAmount: '',
            startDate: '',
            endDate: '',
            status: 'ACTIVE',
        },
    });
    const contractType = watch('contractType');
    const staffId = watch('staffId');

    const { mutate: create, isPending } = useCreateContract();

    // Optional: khi chọn nhân viên xong, set mặc định Loại hợp đồng theo employmentType của nhân viên
    useEffect(() => {
        if (staffId !== '' && typeof staffId === 'number') {
            const profile = profiles.find((p) => p.staffId === staffId);
            if (profile?.employmentType) {
                setValue('contractType', profile.employmentType);
            }
        }
    }, [staffId, profiles, setValue]);

    const salaryLabel =
        contractType === 'FULL_TIME'
            ? 'Lương cơ bản (VNĐ/tháng)'
            : 'Lương theo giờ (VNĐ/giờ)';

    const onSubmit = (data: FormValues) => {
        if (data.staffId === '' || data.salaryAmount === '') {
            toast.error('Chọn nhân viên và nhập lương');
            return;
        }
        const amount = Number(data.salaryAmount);
        if (amount <= 0) {
            toast.error('Lương phải lớn hơn 0');
            return;
        }
        create(
            {
                staffId: Number(data.staffId),
                contractType: data.contractType,
                baseSalary: amount,
                startDate: data.startDate,
                endDate: data.endDate || undefined,
                status: data.status || 'ACTIVE',
            },
            {
                onSuccess: (res: any) => {
                    if (res?.success) {
                        toast.success(res.message ?? 'Tạo hợp đồng thành công');
                        navigate(`/${prefixAdmin}/staff/contract/list`);
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
                        rules={{ required: 'Chọn nhân viên' }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                select
                                label="Nhân viên"
                                required
                                fullWidth
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                value={field.value === '' ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                            >
                                <MenuItem value="">— Chọn —</MenuItem>
                                {profiles.map((p) => (
                                    <MenuItem key={p.staffId} value={p.staffId}>
                                        {p.fullName}
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}
                    />
                    <Controller
                        name="contractType"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                select
                                label="Loại hợp đồng"
                                fullWidth
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value as ContractType)}
                            >
                                {CONTRACT_TYPE_OPTIONS.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}
                    />
                    <Controller
                        name="salaryAmount"
                        control={control}
                        rules={{
                            required: contractType === 'FULL_TIME' ? 'Nhập lương cơ bản' : 'Nhập lương theo giờ',
                            min: { value: 0.01, message: 'Lương phải lớn hơn 0' },
                        }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                type="number"
                                label={salaryLabel}
                                required
                                fullWidth
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                inputProps={{ min: 0.01, step: 'any' }}
                                value={field.value === '' ? '' : field.value}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    field.onChange(v === '' ? '' : Number(v));
                                }}
                            />
                        )}
                    />
                    <Controller
                        name="startDate"
                        control={control}
                        rules={{ required: 'Chọn ngày bắt đầu' }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                type="date"
                                label="Ngày bắt đầu"
                                required
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                            />
                        )}
                    />
                    <Controller
                        name="endDate"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                type="date"
                                label="Ngày kết thúc"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />
                        )}
                    />
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
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 1 }}>
                            <Button
                                type="button"
                                variant="outlined"
                                onClick={() => navigate(`/${prefixAdmin}/staff/contract/list`)}
                            >
                                Hủy
                            </Button>
                            <Button type="submit" variant="contained" disabled={isPending}>
                                {isPending ? 'Đang tạo...' : 'Tạo hợp đồng'}
                            </Button>
                        </Box>
                    </Stack>
                </Box>
            </Box>
        </>
    );
};
