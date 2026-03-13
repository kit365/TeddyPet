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
    const [accountForm, setAccountForm] = useState<IAccountProvisionRequest>({ username: '', password: '', roleName: 'STAFF' });

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
            backupEmail: '',
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
                backupEmail: profile.backupEmail ?? '',
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
                    gender: (data.gender && (data.gender as string) !== '') ? data.gender : undefined,
                    avatarUrl: data.avatarUrl?.trim() || undefined,
                    altImage: data.altImage?.trim() || undefined,
                    address: data.address?.trim() || undefined,
                    bankAccountNo: data.bankAccountNo?.trim() || undefined,
                    bankName: data.bankName?.trim() || undefined,
                    positionId: data.positionId ?? undefined,
                    employmentType: data.employmentType ?? undefined,
                    backupEmail: data.backupEmail?.trim() || undefined,
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
                    password: accountForm.password?.trim() || undefined,
                    roleName: accountForm.roleName,
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
                            <Button type="button" variant="outlined" onClick={() => (window.location.href = `/${prefixAdmin}/staff/profile/list`)}>
                                Hủy
                            </Button>
                            <Button type="submit" variant="contained" disabled={isPending}>
                                {isPending ? 'Đang lưu...' : 'Lưu'}
                            </Button>
                        </Box>
                    </Stack>
                </Box>

                {profile && !profile.userId && (
                    <Box sx={{ mt: 4, p: 3, border: '1px solid #e5e7eb', borderRadius: 3, bgcolor: '#f8fafc' }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#1e293b' }}>
                            Cấp tài khoản & Phân quyền
                        </Typography>
                        {!showAccountForm ? (
                            <Box sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Nhân viên này chưa có tài khoản đăng nhập hệ thống.
                                </Typography>
                                <Button variant="contained" onClick={() => setShowAccountForm(true)}>
                                    Cấp tài khoản mới
                                </Button>
                            </Box>
                        ) : (
                            <Stack spacing={2.5} sx={{ mt: 2, maxWidth: 500 }}>
                                <Box sx={{ py: 1.5, px: 2, bgcolor: '#eff6ff', border: '1px solid #dbeafe', borderRadius: 2, typography: 'body2', color: '#1e40af' }}>
                                    <strong>Hướng dẫn:</strong><br/>
                                    • Nếu email <strong>{profile.email}</strong> đã có tài khoản khách hàng, hãy để trống Tên đăng nhập và Mật khẩu. Hệ thống sẽ tự động liên kết và nâng cấp lên tài khoản nhân viên.<br/>
                                    • Nếu chưa có, hãy nhập Tên đăng nhập. Mật khẩu có thể để trống để hệ thống tự tạo ngẫu nhiên.
                                </Box>

                                {isSuperAdmin && (
                                    <TextField
                                        select
                                        label="Vai trò cấp quyền (Role)"
                                        value={accountForm.roleName}
                                        onChange={(e) => setAccountForm(p => ({ ...p, roleName: e.target.value }))}
                                        fullWidth
                                    >
                                        <MenuItem value="STAFF">Staff (Nhân viên)</MenuItem>
                                        <MenuItem value="ADMIN">Admin (Quản trị viên)</MenuItem>
                                    </TextField>
                                )}

                                <TextField
                                    label="Tên đăng nhập"
                                    placeholder="Ví dụ: kietnt"
                                    value={accountForm.username}
                                    onChange={(e) => setAccountForm((p) => ({ ...p, username: e.target.value }))}
                                    fullWidth
                                />
                                <TextField
                                    label="Mật khẩu"
                                    type="password"
                                    placeholder="Để trống để tự tạo ngẫu nhiên"
                                    value={accountForm.password}
                                    onChange={(e) => setAccountForm((p) => ({ ...p, password: e.target.value }))}
                                    fullWidth
                                />
                                <Box sx={{ display: 'flex', gap: 2, pt: 1 }}>
                                    <Button variant="contained" onClick={onProvisionAccount} disabled={isProvisioning}>
                                        {isProvisioning ? 'Đang xử lý...' : 'Xác nhận cấp tài khoản'}
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
