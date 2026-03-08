import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import { Breadcrumb } from '../../../components/ui/Breadcrumb';
import { Title } from '../../../components/ui/Title';
import { useCreateStaffOnboarding } from '../hooks/useStaffProfile';
import { useForm, Controller } from 'react-hook-form';
import { prefixAdmin } from '../../../constants/routes';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useStaffPositions } from '../position/hooks/useStaffPosition';
import type { IStaffOnboardingRequest, GenderEnum, EmploymentTypeEnum } from '../../../api/staffProfile.api';

type FormValues = IStaffOnboardingRequest & {};

const GENDER_OPTIONS: { value: GenderEnum; label: string }[] = [
    { value: 'MALE', label: 'Nam' },
    { value: 'FEMALE', label: 'Nữ' },
    { value: 'OTHER', label: 'Khác' },
];

const EMPLOYMENT_TYPE_OPTIONS: { value: EmploymentTypeEnum; label: string }[] = [
    { value: 'PART_TIME', label: 'Bán thời gian' },
    { value: 'FULL_TIME', label: 'Toàn thời gian' },
];

export const StaffProfileOnboardingPage = () => {
    const [searchParams] = useSearchParams();
    const prefilledEmail = searchParams.get('email') ?? '';
    const prefilledFullName = searchParams.get('fullName') ?? '';
    const prefilledPhone = searchParams.get('phoneNumber') ?? '';

    const { control, handleSubmit, reset } = useForm<FormValues>({
        defaultValues: {
            fullName: '',
            email: '',
            phoneNumber: '',
            citizenId: '',
            dateOfBirth: '',
            gender: undefined,
            avatarUrl: '',
            altImage: '',
            address: '',
            bankAccountNo: '',
            bankName: '',
            positionId: undefined as number | undefined,
            employmentType: undefined as EmploymentTypeEnum | undefined,
        },
    });

    useEffect(() => {
        if (prefilledEmail || prefilledFullName || prefilledPhone) {
            reset((prev) => ({
                ...prev,
                fullName: prefilledFullName || prev.fullName,
                email: prefilledEmail || prev.email,
                phoneNumber: prefilledPhone || prev.phoneNumber,
            }));
        }
    }, [prefilledEmail, prefilledFullName, prefilledPhone, reset]);
    const { data: positions = [] } = useStaffPositions();
    const { mutate: create, isPending } = useCreateStaffOnboarding();

    const onSubmit = (data: FormValues) => {
        create(
            {
                fullName: data.fullName.trim(),
                email: data.email?.trim() || undefined,
                phoneNumber: data.phoneNumber?.trim() || undefined,
                citizenId: data.citizenId?.trim() || undefined,
                dateOfBirth: data.dateOfBirth || undefined,
                gender: data.gender && data.gender !== '' ? data.gender : undefined,
                avatarUrl: data.avatarUrl?.trim() || undefined,
                altImage: data.altImage?.trim() || undefined,
                address: data.address?.trim() || undefined,
                bankAccountNo: data.bankAccountNo?.trim() || undefined,
                bankName: data.bankName?.trim() || undefined,
                positionId: data.positionId ?? undefined,
                employmentType: data.employmentType ?? undefined,
            },
            {
                onSuccess: (res: any) => {
                    if (res?.success) {
                        toast.success(res.message ?? 'Tạo hồ sơ thành công');
                        const staffId = res?.data?.staffId;
                        if (staffId) window.location.href = `/${prefixAdmin}/staff/profile/edit/${staffId}`;
                        else window.location.href = `/${prefixAdmin}/staff/profile/list`;
                    } else toast.error(res?.message ?? 'Có lỗi');
                },
                onError: (err: any) => {
                    let msg = err?.response?.data?.message ?? err?.message ?? 'Có lỗi khi tạo hồ sơ.';
                    if (typeof msg === 'string' && msg.startsWith('Runtime error:')) {
                        const quoted = msg.match(/"([^"]+)"/);
                        msg = quoted ? quoted[1] : msg.replace(/^Runtime error:[^\n]+/, '').trim() || 'Có lỗi khi tạo hồ sơ.';
                    }
                    toast.error(msg);
                },
            }
        );
    };

    return (
        <>
            <Box sx={{ px: '40px', py: '32px', mb: '24px' }}>
                <Title title="Thêm hồ sơ nhân viên (Onboarding)" />
                <Breadcrumb
                    items={[
                        { label: 'Trang chủ', to: '/' },
                        { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                        { label: 'Thêm hồ sơ' },
                    ]}
                />
            </Box>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 640, px: '40px' }}>
                <Stack spacing={2}>
                    <Controller
                        name="fullName"
                        control={control}
                        rules={{ required: 'Nhập họ tên' }}
                        render={({ field, fieldState }) => (
                            <TextField {...field} label="Họ tên" required fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
                        )}
                    />
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => <TextField {...field} label="Email" type="email" fullWidth />}
                    />
                    <Controller
                        name="phoneNumber"
                        control={control}
                        render={({ field }) => <TextField {...field} label="Số điện thoại" fullWidth />}
                    />
                    <Controller
                        name="citizenId"
                        control={control}
                        render={({ field }) => <TextField {...field} label="CCCD/CMND" fullWidth />}
                    />
                    <Controller
                        name="dateOfBirth"
                        control={control}
                        render={({ field }) => (
                            <TextField {...field} label="Ngày sinh" type="date" fullWidth InputLabelProps={{ shrink: true }} />
                        )}
                    />
                    <Controller
                        name="gender"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                select
                                label="Giới tính"
                                fullWidth
                                value={field.value ?? ''}
                                onChange={(e) => field.onChange(e.target.value || undefined)}
                            >
                                <MenuItem value="">
                                    <em>— Chọn giới tính —</em>
                                </MenuItem>
                                {GENDER_OPTIONS.map((o) => (
                                    <MenuItem key={o.value} value={o.value}>
                                        {o.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}
                    />
                    <Controller name="address" control={control} render={({ field }) => <TextField {...field} label="Địa chỉ" fullWidth multiline />} />
                    <Controller name="bankAccountNo" control={control} render={({ field }) => <TextField {...field} label="Số tài khoản NH" fullWidth />} />
                    <Controller name="bankName" control={control} render={({ field }) => <TextField {...field} label="Ngân hàng" fullWidth />} />
                    <Controller
                        name="positionId"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                select
                                label="Chức vụ"
                                fullWidth
                                value={field.value ?? ''}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            >
                                <MenuItem value="">
                                    <em>— Chọn chức vụ —</em>
                                </MenuItem>
                                {positions.map((p) => (
                                    <MenuItem key={p.id} value={p.id}>
                                        {p.name} ({p.code})
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}
                    />
                    <Controller
                        name="employmentType"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                select
                                label="Loại hình"
                                fullWidth
                                value={field.value ?? ''}
                                onChange={(e) => field.onChange(e.target.value || undefined)}
                            >
                                <MenuItem value="">
                                    <em>— Chọn loại hình —</em>
                                </MenuItem>
                                {EMPLOYMENT_TYPE_OPTIONS.map((o) => (
                                    <MenuItem key={o.value} value={o.value}>
                                        {o.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}
                    />
                    <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
                        <Button type="submit" variant="contained" disabled={isPending}>
                            {isPending ? 'Đang tạo...' : 'Tạo hồ sơ'}
                        </Button>
                        <Button type="button" variant="outlined" onClick={() => (window.location.href = `/${prefixAdmin}/staff/profile/list`)}>
                            Hủy
                        </Button>
                    </Box>
                </Stack>
            </Box>
        </>
    );
};
