import { useParams } from 'react-router-dom';
import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import { Breadcrumb } from '../../../components/ui/Breadcrumb';
import { Title } from '../../../components/ui/Title';
import { useStaffProfileById, useUpdateStaffProfile, useProvisionAccount } from '../hooks/useStaffProfile';
import { useForm, Controller } from 'react-hook-form';
import { prefixAdmin } from '../../../constants/routes';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import { useStaffPositions } from '../position/hooks/useStaffPosition';
import type { IStaffProfileUpdateRequest, GenderEnum, EmploymentTypeEnum } from '../../../api/staffProfile.api';
import type { IAccountProvisionRequest } from '../../../api/staffProfile.api';

const GENDER_OPTIONS: { value: GenderEnum; label: string }[] = [
    { value: 'MALE', label: 'Nam' },
    { value: 'FEMALE', label: 'Nữ' },
    { value: 'OTHER', label: 'Khác' },
];

const EMPLOYMENT_TYPE_OPTIONS: { value: EmploymentTypeEnum; label: string }[] = [
    { value: 'PART_TIME', label: 'Bán thời gian' },
    { value: 'FULL_TIME', label: 'Toàn thời gian' },
];

type FormValues = IStaffProfileUpdateRequest;

export const StaffProfileEditPage = () => {
    const { id } = useParams<{ id: string }>();
    const { data: res } = useStaffProfileById(id);
    const profile = (res as any)?.data;
    const [showAccountForm, setShowAccountForm] = useState(false);
    const [accountForm, setAccountForm] = useState<Pick<IAccountProvisionRequest, 'username' | 'password'>>({ username: '', password: '' });

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
        if (profile) {
            const gender = profile.gender != null && profile.gender !== '' ? profile.gender : undefined;
            reset({
                fullName: profile.fullName ?? '',
                email: profile.email ?? '',
                phoneNumber: profile.phoneNumber ?? '',
                citizenId: profile.citizenId ?? '',
                dateOfBirth: profile.dateOfBirth ?? '',
                gender: gender ?? '',
                avatarUrl: profile.avatarUrl ?? '',
                altImage: profile.altImage ?? '',
                address: profile.address ?? '',
                bankAccountNo: profile.bankAccountNo ?? '',
                bankName: profile.bankName ?? '',
                positionId: profile.positionId ?? undefined,
                employmentType: profile.employmentType ?? undefined,
            });
        }
    }, [profile, reset]);

    const { data: positions = [] } = useStaffPositions();
    const { mutate: update, isPending } = useUpdateStaffProfile();
    const { mutate: provision, isPending: isProvisioning } = useProvisionAccount();

    const onSubmit = (data: FormValues) => {
        if (!id) return;
        update(
            {
                staffId: Number(id),
                data: {
                    fullName: data.fullName?.trim(),
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
            },
            {
                onSuccess: (r: any) => {
                    if (r?.success) toast.success(r.message ?? 'Cập nhật thành công');
                    else toast.error(r?.message ?? 'Có lỗi');
                },
            }
        );
    };

    const onProvisionAccount = () => {
        if (!id) return;
        provision(
            {
                staffId: Number(id),
                data: {
                    username: accountForm.username?.trim() || undefined,
                    password: (accountForm.password != null && accountForm.password !== '') ? accountForm.password : undefined,
                    roleName: 'STAFF',
                },
            },
            {
                onSuccess: (r: any) => {
                    if (r?.success) {
                        toast.success(r.message ?? 'Cấp tài khoản thành công');
                        setShowAccountForm(false);
                    } else toast.error(r?.message ?? 'Có lỗi');
                },
                onError: (err: any) => {
                    const msg = err?.response?.data?.message ?? err?.message ?? 'Cấp tài khoản thất bại.';
                    toast.error(msg);
                },
            }
        );
    };

    if (!id) return null;

    return (
        <>
            <Box sx={{ px: '40px', py: '32px', mb: '24px' }}>
                <Title title="Sửa hồ sơ nhân viên" />
                <Breadcrumb
                    items={[
                        { label: 'Trang chủ', to: '/' },
                        { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                        { label: 'Sửa hồ sơ' },
                    ]}
                />
            </Box>
            <Box sx={{ maxWidth: 640, px: '40px' }}>
                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                    <Stack spacing={2}>
                        <Controller
                            name="fullName"
                            control={control}
                            rules={{ required: 'Nhập họ tên' }}
                            render={({ field, fieldState }) => (
                                <TextField {...field} label="Họ tên" required fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
                            )}
                        />
                        <Controller name="email" control={control} render={({ field }) => <TextField {...field} label="Email" type="email" fullWidth />} />
                        <Controller name="phoneNumber" control={control} render={({ field }) => <TextField {...field} label="Số điện thoại" fullWidth />} />
                        <Controller name="citizenId" control={control} render={({ field }) => <TextField {...field} label="CCCD/CMND" fullWidth />} />
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
                                {isPending ? 'Đang lưu...' : 'Lưu'}
                            </Button>
                            <Button type="button" variant="outlined" onClick={() => (window.location.href = `/${prefixAdmin}/staff/profile/list`)}>
                                Hủy
                            </Button>
                        </Box>
                    </Stack>
                </Box>

                {profile && !profile.userId && (
                    <Box sx={{ mt: 4, p: 2, border: '1px solid #919eab33', borderRadius: 2 }}>
                        <Title title="Cấp tài khoản" />
                        {!showAccountForm ? (
                            <Button variant="outlined" onClick={() => setShowAccountForm(true)}>
                                Cấp tài khoản cho nhân viên này
                            </Button>
                        ) : (
                            <Stack spacing={2} sx={{ mt: 2, maxWidth: 400 }}>
                                <Box sx={{ py: 1, px: 1.5, bgcolor: 'action.hover', borderRadius: 1, typography: 'body2', color: 'text.secondary' }}>
                                    Nếu người này <strong>đã có tài khoản</strong> (email đã đăng ký trên hệ thống), để trống Tên đăng nhập và Mật khẩu — hệ thống sẽ chỉ gán vai trò nhân viên cho tài khoản đó.
                                </Box>
                                <TextField
                                    label="Tên đăng nhập"
                                    placeholder="Để trống nếu email đã có tài khoản"
                                    value={accountForm.username}
                                    onChange={(e) => setAccountForm((p) => ({ ...p, username: e.target.value }))}
                                    fullWidth
                                />
                                <TextField
                                    label="Mật khẩu"
                                    type="password"
                                    placeholder="Để trống nếu email đã có tài khoản"
                                    value={accountForm.password}
                                    onChange={(e) => setAccountForm((p) => ({ ...p, password: e.target.value }))}
                                    fullWidth
                                />
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Button variant="contained" onClick={onProvisionAccount} disabled={isProvisioning}>
                                        {isProvisioning ? 'Đang cấp...' : 'Cấp tài khoản'}
                                    </Button>
                                    <Button variant="outlined" onClick={() => setShowAccountForm(false)}>
                                        Hủy
                                    </Button>
                                </Box>
                            </Stack>
                        )}
                    </Box>
                )}
            </Box>
        </>
    );
};
