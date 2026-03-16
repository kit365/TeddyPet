import { Autocomplete, Box, Button, Card, CardHeader, Divider, MenuItem, Stack, TextField, ThemeProvider, Typography, useTheme } from '@mui/material';
import { Breadcrumb } from '../../../components/ui/Breadcrumb';
import { Title } from '../../../components/ui/Title';
import { useCreateStaffOnboarding } from '../hooks/useStaffProfile';
import { useForm, Controller } from 'react-hook-form';
import { prefixAdmin } from '../../../constants/routes';
import { toast } from 'react-toastify';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { useStaffPositions } from '../position/hooks/useStaffPosition';
import type { IStaffOnboardingRequest, GenderEnum, EmploymentTypeEnum } from '../../../api/staffProfile.api';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../../stores/useAuthStore';
import { getProductCategoryTheme } from '../../product-category/configs/theme';
import { FormUploadSingleFile } from '../../../components/upload/FormUploadSingleFile';
import { useBanks } from '../../../hooks/useBanks';
import type { VietQRBank } from '../../../../api/vietqr.api';

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
            secondaryPositionId: undefined as number | undefined,
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
    const outerTheme = useTheme();
    const localTheme = getProductCategoryTheme(outerTheme);
    const { data: positions = [] } = useStaffPositions();
    const { data: banks = [] } = useBanks();
    const { mutate: create, isPending } = useCreateStaffOnboarding();
    
    // Get user from global auth store (more reliable than re-querying in every component)
    const userRole = useAuthStore((state) => state.user?.role);
    
    // Debug log to confirm what the frontend is actually getting
    useEffect(() => {
        console.log("Current User Role:", userRole);
    }, [userRole]);

    // Handle both 'SUPER_ADMIN' and 'SUPERADMIN' just in case of BE inconsistency
    const isSuperAdmin = useMemo(() => {
        const r = userRole?.toUpperCase();
        return r === 'SUPER_ADMIN' || r === 'SUPERADMIN';
    }, [userRole]);

    const isAdmin = useMemo(() => {
        const r = userRole?.toUpperCase();
        return r === 'ADMIN';
    }, [userRole]);

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
                secondaryPositionId: data.secondaryPositionId ?? undefined,
                employmentType: data.employmentType ?? undefined,
                assignedRole: data.assignedRole || 'STAFF',
                backupEmail: data.backupEmail?.trim() || undefined,
            },
            {
                onSuccess: (res: any) => {
                    if (res?.success) {
                        toast.success(res.message ?? 'Tạo hồ sơ thành công');
                        queryClient.invalidateQueries({ queryKey: ['staff-profiles'] });
                        queryClient.invalidateQueries({ queryKey: ['google-whitelist'] });
                        // Navigate back to the list page
                        navigate(`/${prefixAdmin}/staff/profile/list`);
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
            <div className="mb-[40px] gap-[16px] flex items-start justify-end">
                <div className="mr-auto">
                    <Title title="Thêm hồ sơ nhân viên (Onboarding)" />
                    <Breadcrumb
                        items={[
                            { label: 'Trang chủ', to: '/' },
                            { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                            { label: 'Thêm hồ sơ' },
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
                                            name="secondaryPositionId"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    select
                                                    label="Chức vụ phụ"
                                                    value={field.value ?? ''}
                                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                                >
                                                    <MenuItem value="">
                                                        <em>— Không có —</em>
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
                        </Box>

                        {/* ============ CỘT PHẢI (35%) — Cấu hình ============ */}
                        <Box sx={{
                            flex: '1 1 35%',
                            display: 'flex',
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

                            {/* — PHÂN QUYỀN (Role selector) — */}
                            {(isSuperAdmin || isAdmin) && (
                                <SectionCard title="Phân quyền" subheader="Cấu hình quyền truy cập hệ thống">
                                    <Box p="24px">
                                        <Controller
                                            name="assignedRole"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    select
                                                    label="Quyền hệ thống"
                                                    value={field.value ?? 'STAFF'}
                                                    fullWidth
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: '10px',
                                                            bgcolor: '#F8FAFC'
                                                        }
                                                    }}
                                                >
                                                    <MenuItem value="STAFF">Staff (Nhân viên)</MenuItem>
                                                    {(isSuperAdmin || isAdmin) && <MenuItem value="ADMIN">Admin (Quản trị viên)</MenuItem>}
                                                    <MenuItem value="USER">User (Khách hàng)</MenuItem>
                                                </TextField>
                                            )}
                                        />
                                        <Typography variant="caption" sx={{ mt: 1.5, display: 'block', color: '#919EAB', fontStyle: 'italic' }}>
                                            {isAdmin
                                                ? '* Bạn có quyền tạo tài khoản Staff hoặc User.'
                                                : '* Super Admin có quyền chỉ định vai trò Admin cho tài khoản mới.'}
                                        </Typography>
                                    </Box>
                                </SectionCard>
                            )}

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

                    {/* ============ STICKY FOOTER — Nút Hủy / Tạo hồ sơ ============ */}
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
                            {isPending ? 'Đang tạo...' : 'Tạo hồ sơ'}
                        </Button>
                    </Box>
                </form>
            </ThemeProvider>
        </>
    );
};
