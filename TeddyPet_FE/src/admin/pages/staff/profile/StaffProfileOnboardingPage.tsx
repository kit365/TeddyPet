import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import { Breadcrumb } from '../../../components/ui/Breadcrumb';
import { Title } from '../../../components/ui/Title';
import { useCreateStaffOnboarding } from '../hooks/useStaffProfile';
import { useForm, Controller } from 'react-hook-form';
import { prefixAdmin } from '../../../constants/routes';
import { toast } from 'react-toastify';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useStaffPositions } from '../position/hooks/useStaffPosition';
import type { IStaffOnboardingRequest, GenderEnum, EmploymentTypeEnum } from '../../../api/staffProfile.api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../../../../api/auth.api';
import { MeResponse } from '../../../../types/auth.type';

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
            assignedRole: 'STAFF',
            backupEmail: '',
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

    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: positions = [] } = useStaffPositions();
    const { mutate: create, isPending } = useCreateStaffOnboarding();
    const { data: meRes } = useQuery<MeResponse>({ queryKey: ["me-admin"], queryFn: () => getMe() });
    const isSuperAdmin = meRes?.data?.role === 'SUPER_ADMIN';

    const onSubmit = (data: FormValues) => {
        create(
            {
                fullName: data.fullName.trim(),
                email: data.email?.trim() || undefined,
                phoneNumber: data.phoneNumber?.trim() || undefined,
                citizenId: data.citizenId?.trim() || undefined,
                dateOfBirth: data.dateOfBirth || undefined,
                gender: (data.gender && (data.gender as string) !== '') ? data.gender : undefined,
                avatarUrl: data.avatarUrl?.trim() || undefined,
                altImage: data.altImage?.trim() || undefined,
                address: data.address?.trim() || undefined,
                bankAccountNo: data.bankAccountNo?.trim() || undefined,
                bankName: data.bankName?.trim() || undefined,
                positionId: data.positionId ?? undefined,
                employmentType: data.employmentType ?? undefined,
                assignedRole: data.assignedRole || 'STAFF',
                backupEmail: data.backupEmail?.trim() || undefined,
            },
            {
                onSuccess: (res: any) => {
                    if (res?.success) {
                        toast.success(res.message ?? 'Tạo hồ sơ thành công');
                        
                        // Invalidate both profiles and whitelist
                        queryClient.invalidateQueries({ queryKey: ['staff-profiles'] });
                        queryClient.invalidateQueries({ queryKey: ['google-whitelist'] });

                        const staffId = res?.data?.staffId;
                        if (staffId) {
                            navigate(`/${prefixAdmin}/staff/profile/edit/${staffId}`);
                        } else {
                            navigate(`/${prefixAdmin}/staff/profile/list`);
                        }
                    } else {
                        toast.error(res?.message ?? 'Có lỗi');
                    }
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
                        rules={{ required: 'Nhập email nhân viên' }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                label="Email"
                                type="email"
                                required
                                fullWidth
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                            />
                        )}
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
                        rules={{ required: 'Chọn chức vụ' }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                select
                                label="Chức vụ"
                                required
                                fullWidth
                                value={field.value ?? ''}
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
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
                        rules={{ required: 'Chọn loại hình công việc' }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                select
                                label="Loại hình"
                                required
                                fullWidth
                                value={field.value ?? ''}
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
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
                    
                    {isSuperAdmin && (
                        <Controller
                            name="assignedRole"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Quyền hệ thống (Role)"
                                    fullWidth
                                    value={field.value ?? 'STAFF'}
                                >
                                    <MenuItem value="STAFF">Staff (Nhân viên)</MenuItem>
                                    <MenuItem value="ADMIN">Admin (Quản trị viên)</MenuItem>
                                </TextField>
                            )}
                        />
                    )}
                    
                    <Controller
                        name="backupEmail"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Email dự phòng (Backup Email)"
                                type="email"
                                fullWidth
                                placeholder="Dùng để khôi phục tài khoản nếu email chính gặp sự cố"
                                helperText="Tùy chọn. Khuyến khích sử dụng email cá nhân khác."
                            />
                        )}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 1 }}>
                        <Button
                            type="button"
                            variant="outlined"
                            onClick={() => navigate(`/${prefixAdmin}/staff/profile/list`)}
                        >
                            Hủy
                        </Button>
                        <Button type="submit" variant="contained" disabled={isPending}>
                            {isPending ? 'Đang tạo...' : 'Tạo hồ sơ'}
                        </Button>
                    </Box>
                </Stack>
                </Box>
            </Box>
        </>
    );
};
