import { useParams, useNavigate } from 'react-router-dom';
import { Autocomplete, Box, Button, Card, CardHeader, Divider, MenuItem, Stack, TextField, ThemeProvider, Typography, useTheme } from '@mui/material';
import { Breadcrumb } from '../../../components/ui/Breadcrumb';
import { Title } from '../../../components/ui/Title';
import { useStaffProfileById, useUpdateStaffProfile, useProvisionAccount, useUpdateStaffRole } from '../hooks/useStaffProfile';
import { useForm, Controller } from 'react-hook-form';
import { prefixAdmin } from '../../../constants/routes';
import { toast } from 'react-toastify';
import { useEffect, useMemo, useState } from 'react';
import { useStaffPositions } from '../position/hooks/useStaffPosition';
import type { IStaffProfileUpdateRequest, GenderEnum, EmploymentTypeEnum } from '../../../api/staffProfile.api';
import type { IAccountProvisionRequest } from '../../../api/staffProfile.api';
import { useAuthStore } from '../../../../stores/useAuthStore';
import { getProductCategoryTheme } from '../../product-category/configs/theme';
import { FormUploadSingleFile } from '../../../components/upload/FormUploadSingleFile';
import { useBanks } from '../../../hooks/useBanks';
import type { VietQRBank } from '../../../../api/vietqr.api';

const GENDER_OPTIONS: { value: GenderEnum; label: string }[] = [
    { value: 'MALE', label: 'Nam' },
    { value: 'FEMALE', label: 'Nữ' },
    { value: 'OTHER', label: 'Khác' },
];

const EMPLOYMENT_TYPE_OPTIONS: { value: EmploymentTypeEnum; label: string }[] = [
    { value: 'PART_TIME', label: 'Bán thời gian' },
    { value: 'FULL_TIME', label: 'Toàn thời gian' },
];

/** Reusable static section card (NO accordion) */
const SectionCard = ({ title, subheader, children }: { title: string; subheader?: string; children: React.ReactNode }) => (
    <Card sx={{
        backgroundImage: 'none !important',
        backdropFilter: 'none !important',
        backgroundColor: '#fff !important',
        boxShadow: '0 0 2px 0 #919eab33, 0 12px 24px -4px #919eab1f',
        borderRadius: '16px',
        color: '#1C252E',
    }}>
        <CardHeader
            title={title}
            subheader={subheader}
            slotProps={{
                title: { sx: { fontWeight: 600, fontSize: '1.125rem' } },
                subheader: { sx: { color: '#637381', fontSize: '0.875rem', mt: 0.5 } },
            }}
            sx={{ padding: '24px 24px 0', mb: '24px' }}
        />
        <Divider sx={{ borderColor: '#919eab33' }} />
        {children}
    </Card>
);

type FormValues = IStaffProfileUpdateRequest;

export const StaffProfileEditPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: res } = useStaffProfileById(id);
    const profile = (res as any)?.data;
    const [showAccountForm, setShowAccountForm] = useState(false);
    const [accountForm, setAccountForm] = useState<IAccountProvisionRequest>({ username: '', password: '', roleName: 'STAFF' });

    const outerTheme = useTheme();
    const localTheme = getProductCategoryTheme(outerTheme);

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
    const { data: banks = [] } = useBanks();
    const { mutate: update, isPending } = useUpdateStaffProfile();
    const { mutate: provision, isPending: isProvisioning } = useProvisionAccount();
    const { mutate: changeRole, isPending: isChangingRole } = useUpdateStaffRole();

    const userRole = useAuthStore((state) => state.user?.role);
    const isSuperAdmin = useMemo(() => {
        const r = userRole?.toUpperCase();
        return r === 'SUPER_ADMIN' || r === 'SUPERADMIN';
    }, [userRole]);

    const isAdmin = useMemo(() => {
        const r = userRole?.toUpperCase();
        return r === 'ADMIN';
    }, [userRole]);

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

    const handleChangeRole = (newRole: string) => {
        if (!id) return;
        changeRole(
            {
                staffId: Number(id),
                roleName: newRole,
            },
            {
                onSuccess: (r: any) => {
                    if (r?.success) toast.success('Cập nhật quyền thành công');
                    else toast.error(r?.message ?? 'Có lỗi');
                },
            }
        );
    };

    if (!id) return null;

    return (
        <>
            <div className="mb-[40px] gap-[16px] flex items-start justify-end">
                <div className="mr-auto">
                    <Title title="Sửa hồ sơ nhân viên" />
                    <Breadcrumb
                        items={[
                            { label: 'Trang chủ', to: '/' },
                            { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                            { label: 'Sửa hồ sơ' },
                        ]}
                    />
                </div>
            </div>

            <ThemeProvider theme={localTheme}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* ==================== 2-COLUMN LAYOUT ==================== */}
                    <Box sx={{
                        margin: '0px 80px',
                        pb: '100px', /* room for sticky footer */
                        display: 'flex',
                        flexDirection: { xs: 'column', lg: 'row' },
                        gap: '24px',
                        alignItems: 'flex-start',
                    }}>

                        {/* ============ CỘT TRÁI (65%) — Form nhập liệu ============ */}
                        <Box sx={{ flex: '1 1 65%', display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>

                            {/* — THÔNG TIN CÁ NHÂN — */}
                            <SectionCard title="Thông tin cá nhân" subheader="Họ tên, ngày sinh, giới tính, CCCD">
                                <Stack p="24px" gap="24px">
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px 16px' }}>
                                        <Controller
                                            name="fullName"
                                            control={control}
                                            rules={{ required: 'Nhập họ tên' }}
                                            render={({ field, fieldState }) => (
                                                <TextField
                                                    {...field}
                                                    label="Họ tên *"
                                                    error={!!fieldState.error}
                                                    helperText={fieldState.error?.message}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="citizenId"
                                            control={control}
                                            render={({ field }) => <TextField {...field} label="CCCD/CMND" />}
                                        />
                                        <Controller
                                            name="dateOfBirth"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="Ngày sinh"
                                                    type="date"
                                                    InputLabelProps={{ shrink: true }}
                                                />
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
                                    </Box>
                                </Stack>
                            </SectionCard>

                            {/* — THÔNG TIN LIÊN HỆ — */}
                            <SectionCard title="Thông tin liên hệ" subheader="Email, số điện thoại, địa chỉ">
                                <Stack p="24px" gap="24px">
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px 16px' }}>
                                        <Controller
                                            name="email"
                                            control={control}
                                            rules={{ required: 'Nhập email nhân viên' }}
                                            render={({ field, fieldState }) => (
                                                <TextField
                                                    {...field}
                                                    label="Email *"
                                                    type="email"
                                                    error={!!fieldState.error}
                                                    helperText={fieldState.error?.message}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="phoneNumber"
                                            control={control}
                                            render={({ field }) => <TextField {...field} label="Số điện thoại" />}
                                        />
                                    </Box>
                                    <Controller
                                        name="address"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="Địa chỉ" fullWidth multiline minRows={2} />}
                                    />
                                    <Controller
                                        name="backupEmail"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Email dự phòng"
                                                type="email"
                                                fullWidth
                                                placeholder="Dùng để khôi phục tài khoản nếu email chính gặp sự cố"
                                                helperText="Tùy chọn. Khuyến khích sử dụng email cá nhân khác."
                                            />
                                        )}
                                    />
                                </Stack>
                            </SectionCard>

                            {/* — THÔNG TIN CÔNG VIỆC — */}
                            <SectionCard title="Thông tin công việc" subheader="Chức vụ, loại hình nhân sự">
                                <Stack p="24px" gap="24px">
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px 16px' }}>
                                        <Controller
                                            name="positionId"
                                            control={control}
                                            rules={{ required: 'Chọn chức vụ' }}
                                            render={({ field, fieldState }) => (
                                                <TextField
                                                    {...field}
                                                    select
                                                    label="Chức vụ *"
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
                                                    label="Loại hình *"
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
                                    </Box>
                                </Stack>
                            </SectionCard>

                            {/* — TÀI KHOẢN & PHÂN QUYỀN — */}
                            {profile && (
                                <SectionCard 
                                    title="Tài khoản & Phân quyền" 
                                    subheader={!profile.userId ? "Nhân viên này chưa có tài khoản đăng nhập" : "Quản lý quyền truy cập hệ thống"}
                                >
                                    <Box p="24px">
                                        {!profile.userId ? (
                                            /* Existing Provisioning Form */
                                            !showAccountForm ? (
                                                <Box sx={{ p: 2, border: '1px dashed #919eab52', borderRadius: '12px', textAlign: 'center' }}>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                        Để nhân viên này có thể đăng nhập vào hệ thống, vui lòng cấp tài khoản mới.
                                                    </Typography>
                                                    <Button 
                                                        variant="contained" 
                                                        onClick={() => setShowAccountForm(true)}
                                                        sx={{ background: '#1C252E', textTransform: 'none', borderRadius: '8px' }}
                                                    >
                                                        Cấp tài khoản mới
                                                    </Button>
                                                </Box>
                                            ) : (
                                                <Stack spacing={2.5}>
                                                    <Box sx={{ p: 2, bgcolor: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '12px', typography: 'body2', color: '#1e40af' }}>
                                                        <strong>Hướng dẫn:</strong><br/>
                                                        • Nếu email <strong>{profile.email}</strong> đã có tài khoản khách hàng, hãy để trống Tên đăng nhập và Mật khẩu. Hệ thống sẽ tự động liên kết.<br/>
                                                        • Nếu chưa có, hãy nhập Tên đăng nhập. Mật khẩu để trống để tự tạo ngẫu nhiên.
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
                                                        <Button 
                                                            variant="contained" 
                                                            onClick={onProvisionAccount} 
                                                            disabled={isProvisioning}
                                                            sx={{ background: '#1C252E', textTransform: 'none', borderRadius: '8px' }}
                                                        >
                                                            {isProvisioning ? 'Đang xử lý...' : 'Xác nhận cấp tài khoản'}
                                                        </Button>
                                                        <Button 
                                                            variant="outlined" 
                                                            onClick={() => setShowAccountForm(false)}
                                                            sx={{ textTransform: 'none', borderRadius: '8px', color: '#637381', borderColor: '#919eab52' }}
                                                        >
                                                            Hủy
                                                        </Button>
                                                    </Box>
                                                </Stack>
                                            )
                                        ) : (
                                            /* Role Update Form for Existing Users */
                                            <Stack spacing={2.5}>
                                                <Box sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Box>
                                                             <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#637381', textTransform: 'uppercase', mb: 0.5 }}>
                                                                 Tài khoản hệ thống
                                                             </Typography>
                                                             <Typography sx={{ fontWeight: 700, color: '#1C252E', fontSize: '1rem' }}>
                                                                 @{profile.username || profile.email}
                                                             </Typography>
                                                        </Box>
                                                        <Box sx={{ textAlign: 'right' }}>
                                                            <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#637381', textTransform: 'uppercase', mb: 0.5 }}>
                                                                Vai trò hiện tại
                                                            </Typography>
                                                            <Box sx={{ 
                                                                px: 1.5, py: 0.5, bgcolor: '#1C252E', color: 'white', borderRadius: '6px',
                                                                fontSize: '11px', fontWeight: 700, display: 'inline-block'
                                                            }}>
                                                                {profile.roleName || 'STAFF'}
                                                            </Box>
                                                        </Box>
                                                    </Stack>
                                                </Box>

                                                {(isSuperAdmin || (isAdmin && profile.roleName === 'STAFF')) && (
                                                    <Box sx={{ pt: 1, borderTop: '1px dashed #E2E8F0', mt: 1 }}>
                                                        <Typography sx={{ fontSize: '13px', fontWeight: 700, mb: 1.5, color: '#637381' }}>
                                                            {isSuperAdmin ? 'Cập nhật vai trò hệ thống' : 'Quản lý trạng thái nhân sự'}
                                                        </Typography>
                                                        <Stack direction="row" spacing={2}>
                                                            <TextField
                                                                select
                                                                fullWidth
                                                                size="small"
                                                                value={profile.roleName || 'STAFF'}
                                                                onChange={(e) => handleChangeRole(e.target.value)}
                                                                disabled={isChangingRole}
                                                                sx={{
                                                                    '& .MuiOutlinedInput-root': {
                                                                        borderRadius: '10px',
                                                                        bgcolor: '#F8FAFC'
                                                                    }
                                                                }}
                                                            >
                                                                {isSuperAdmin ? (
                                                                    [
                                                                        <MenuItem key="STAFF" value="STAFF">Staff (Nhân viên)</MenuItem>,
                                                                        <MenuItem key="ADMIN" value="ADMIN">Admin (Quản trị viên)</MenuItem>,
                                                                        <MenuItem key="USER" value="USER">User (Chuyển thành Khách hàng)</MenuItem>
                                                                    ]
                                                                ) : (
                                                                    [
                                                                        <MenuItem key="STAFF" value="STAFF">Staff (Nhân viên)</MenuItem>,
                                                                        <MenuItem key="USER" value="USER">User (Chuyển thành Khách hàng)</MenuItem>
                                                                    ]
                                                                )}
                                                            </TextField>
                                                        </Stack>
                                                        <Typography variant="caption" sx={{ mt: 1.5, display: 'block', color: '#919EAB', fontStyle: 'italic', lineHeight: 1.4 }}>
                                                            {isAdmin && profile.roleName === 'STAFF' 
                                                                ? '* Admin chỉ có quyền thu hồi quyền nhân viên (chuyển về User). Để cấp lại quyền Staff, nhân viên cần được mời lại.'
                                                                : '* Vai trò sẽ được cập nhật ngay lập tức. Hãy cẩn trọng khi thay đổi quyền truy cập.'}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Stack>
                                        )}
                                    </Box>
                                </SectionCard>
                            )}
                        </Box>

                        {/* ============ CỘT PHẢI (35%) — Cấu hình ============ */}
                        <Box sx={{
                            display: 'flex',
                            flex: '1 1 35%',
                            flexDirection: 'column',
                            gap: '24px',
                            minWidth: 0,
                        }}>

                            {/* — ẢNH ĐẠI DIỆN — */}
                            <SectionCard title="Ảnh đại diện" subheader="Tùy chọn · Đề xuất 512×512">
                                <Box p="24px">
                                    <FormUploadSingleFile
                                        name="avatarUrl"
                                        control={control}
                                        title=""
                                        compact
                                        folder="staffs"
                                    />
                                </Box>
                            </SectionCard>

                            {/* — NGÂN HÀNG — */}
                            <SectionCard title="Thông tin ngân hàng" subheader="Tài khoản để chi trả lương">
                                <Stack p="24px" gap="20px">
                                    <Controller
                                        name="bankName"
                                        control={control}
                                        render={({ field }) => (
                                            <Autocomplete
                                                {...field}
                                                options={banks || []}
                                                getOptionLabel={(option: VietQRBank) => `${option.shortName} - ${option.name}`}
                                                isOptionEqualToValue={(option, value) => option.shortName === value.shortName}
                                                value={banks?.find((b) => b.shortName === field.value || b.name === field.value) || null}
                                                onChange={(_, newValue) => {
                                                    field.onChange(newValue ? newValue.shortName : '');
                                                }}
                                                renderInput={(params) => <TextField {...params} label="Ngân hàng" fullWidth />}
                                                renderOption={(props, option) => {
                                                    const { key, ...optionProps } = props as any;
                                                    return (
                                                        <Box key={key} component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 }, py: 1 }} {...optionProps}>
                                                            <img
                                                                loading="lazy"
                                                                width="45"
                                                                src={option.logo}
                                                                alt={option.shortName}
                                                                style={{ borderRadius: '4px', border: '1px solid #f0f0f0' }}
                                                            />
                                                            <Box>
                                                                <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#1C252E' }}>
                                                                    {option.shortName}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: '#637381', display: 'block', lineHeight: 1.2 }}>
                                                                    {option.name}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: '#919EAB', fontSize: '10px' }}>
                                                                    BIN: {option.bin}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    );
                                                }}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="bankAccountNo"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="Số tài khoản" fullWidth />}
                                    />
                                </Stack>
                            </SectionCard>
                        </Box>
                    </Box>

                    {/* ============ STICKY FOOTER — Nút Hủy / Lưu ============ */}
                    <Box sx={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 50,
                        backdropFilter: 'blur(8px)',
                        background: 'rgba(255,255,255,0.85)',
                        borderTop: '1px solid #919eab33',
                        py: '16px',
                        px: '120px',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '12px',
                    }}>
                        <Button
                            type="button"
                            variant="outlined"
                            onClick={() => navigate(`/${prefixAdmin}/staff/profile/list`)}
                            sx={{
                                minHeight: '2.75rem',
                                minWidth: '6rem',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                                padding: '6px 22px',
                                borderRadius: '8px',
                                textTransform: 'none',
                                borderColor: '#919eab52',
                                color: '#637381',
                                '&:hover': {
                                    borderColor: '#1C252E',
                                    color: '#1C252E',
                                    background: 'rgba(145, 158, 171, 0.08)',
                                },
                            }}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            variant="contained"
                            sx={{
                                background: '#1C252E',
                                minHeight: '2.75rem',
                                minWidth: '10rem',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                                padding: '6px 28px',
                                borderRadius: '8px',
                                textTransform: 'none',
                                boxShadow: 'none',
                                '&:hover': {
                                    background: '#454F5B',
                                    boxShadow: '0 8px 16px 0 rgba(145 158 171 / 16%)',
                                },
                            }}
                        >
                            {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </Button>
                    </Box>
                </form>
            </ThemeProvider>
        </>
    );
};
