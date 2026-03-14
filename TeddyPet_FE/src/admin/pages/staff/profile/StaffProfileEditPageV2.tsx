import { useParams, useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../../../components/ui/Breadcrumb';
import { useStaffProfileById, useUpdateStaffProfile, useProvisionAccount } from '../hooks/useStaffProfile';
import { useForm, Controller } from 'react-hook-form';
import { prefixAdmin } from '../../../constants/routes';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import { useStaffPositions } from '../position/hooks/useStaffPosition';
import type { IStaffProfileUpdateRequest, GenderEnum, EmploymentTypeEnum } from '../../../api/staffProfile.api';
import type { IAccountProvisionRequest } from '../../../api/staffProfile.api';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../../../api/auth.api';
import type { MeResponse } from '../../../../types/auth.type';
import { ChevronLeft, Loader } from 'lucide-react';

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

export const StaffProfileEditPageV2 = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: res } = useStaffProfileById(id);
    const profile = (res as any)?.data;
    const [showAccountForm, setShowAccountForm] = useState(false);
    const [accountForm, setAccountForm] = useState<IAccountProvisionRequest>({
        username: '',
        password: '',
        roleName: 'STAFF',
    });

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

    const { data: meRes } = useQuery<MeResponse>({ queryKey: ['me-admin'], queryFn: () => getMe() });
    const isSuperAdmin = meRes?.data?.role === 'SUPER_ADMIN';

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
                    gender: data.gender && (data.gender as string) !== '' ? data.gender : undefined,
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
        <div className="min-h-screen bg-slate-50">
            {/* HEADER */}
            <div className="px-10 py-8 mb-6 bg-white border-b border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                    <button
                        onClick={() => navigate(`/${prefixAdmin}/staff/profile/list`)}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Quay lại"
                    >
                        <ChevronLeft size={20} className="text-slate-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900">Sửa hồ sơ nhân viên</h1>
                </div>
                <Breadcrumb
                    items={[
                        { label: 'Trang chủ', to: '/' },
                        { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                        { label: 'Sửa hồ sơ' },
                    ]}
                />
            </div>

            {/* MAIN CONTENT */}
            <div className="px-10 pb-10">
                <div className="mx-auto max-w-4xl">
                    {/* FORM SECTION */}
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8"
                    >
                        <h2 className="text-lg font-bold text-slate-900 mb-6">Thông tin cá nhân</h2>

                        <div className="space-y-5">
                            {/* Row 1: Họ tên - single field */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Họ tên <span className="text-red-500">*</span>
                                </label>
                                <Controller
                                    name="fullName"
                                    control={control}
                                    rules={{ required: 'Nhập họ tên' }}
                                    render={({ field, fieldState }) => (
                                        <div>
                                            <input
                                                {...field}
                                                type="text"
                                                placeholder="Ví dụ: Nguyễn Tấn Kiệt"
                                                value={field.value || ''}
                                                className={`w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all duration-200 placeholder:text-slate-400 placeholder:font-normal focus:ring-4 focus:ring-indigo-500/10 ${
                                                    fieldState.error
                                                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                                                        : 'border-slate-200 focus:border-indigo-500 bg-white'
                                                }`}
                                            />
                                            {fieldState.error && (
                                                <p className="text-xs text-red-600 mt-1.5 font-medium">{fieldState.error.message}</p>
                                            )}
                                        </div>
                                    )}
                                />
                            </div>

                            {/* Row 2: Email & Phone Number */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Email chính
                                    </label>
                                    <Controller
                                        name="email"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                {...field}
                                                type="email"
                                                placeholder="kiet@example.com"
                                                value={field.value || ''}
                                                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none transition-all duration-200 placeholder:text-slate-400 placeholder:font-normal focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white"
                                            />
                                        )}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Số điện thoại
                                    </label>
                                    <Controller
                                        name="phoneNumber"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                {...field}
                                                type="tel"
                                                placeholder="0912345678"
                                                value={field.value || ''}
                                                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none transition-all duration-200 placeholder:text-slate-400 placeholder:font-normal focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white"
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Row 3: CCCD & Ngày sinh */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        CCCD/CMND
                                    </label>
                                    <Controller
                                        name="citizenId"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                {...field}
                                                type="text"
                                                placeholder="0123456789"
                                                value={field.value || ''}
                                                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none transition-all duration-200 placeholder:text-slate-400 placeholder:font-normal focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white"
                                            />
                                        )}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Ngày sinh
                                    </label>
                                    <Controller
                                        name="dateOfBirth"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                {...field}
                                                type="date"
                                                value={field.value || ''}
                                                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none transition-all duration-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white"
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Row 4: Giới tính & Loại hình */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Giới tính
                                    </label>
                                    <Controller
                                        name="gender"
                                        control={control}
                                        render={({ field }) => (
                                            <select
                                                {...field}
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value || undefined)}
                                                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none transition-all duration-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white cursor-pointer"
                                            >
                                                <option value="">— Chọn giới tính —</option>
                                                {GENDER_OPTIONS.map((o) => (
                                                    <option key={o.value} value={o.value}>
                                                        {o.label}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Loại hình
                                    </label>
                                    <Controller
                                        name="employmentType"
                                        control={control}
                                        render={({ field }) => (
                                            <select
                                                {...field}
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value || undefined)}
                                                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none transition-all duration-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white cursor-pointer"
                                            >
                                                <option value="">— Chọn loại hình —</option>
                                                {EMPLOYMENT_TYPE_OPTIONS.map((o) => (
                                                    <option key={o.value} value={o.value}>
                                                        {o.label}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Row 5: Chức vụ - full width */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Chức vụ
                                </label>
                                <Controller
                                    name="positionId"
                                    control={control}
                                    render={({ field }) => (
                                        <select
                                            {...field}
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none transition-all duration-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white cursor-pointer"
                                        >
                                            <option value="">— Chọn chức vụ —</option>
                                            {positions.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} ({p.code})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                />
                            </div>

                            {/* Row 6: Địa chỉ */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Địa chỉ
                                </label>
                                <Controller
                                    name="address"
                                    control={control}
                                    render={({ field }) => (
                                        <textarea
                                            {...field}
                                            placeholder="Số nhà, tên đường, phường, quận, thành phố"
                                            rows={2}
                                            value={field.value || ''}
                                            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none transition-all duration-200 placeholder:text-slate-400 placeholder:font-normal focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white resize-none"
                                        />
                                    )}
                                />
                            </div>

                            {/* Row 7: Bank Account & Bank Name */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Số tài khoản NH
                                    </label>
                                    <Controller
                                        name="bankAccountNo"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                {...field}
                                                type="text"
                                                placeholder="0123456789"
                                                value={field.value || ''}
                                                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none transition-all duration-200 placeholder:text-slate-400 placeholder:font-normal focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white"
                                            />
                                        )}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Ngân hàng
                                    </label>
                                    <Controller
                                        name="bankName"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                {...field}
                                                type="text"
                                                placeholder="VCB, TCB, MB, ..."
                                                value={field.value || ''}
                                                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none transition-all duration-200 placeholder:text-slate-400 placeholder:font-normal focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white"
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Row 8: Backup Email */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Email dự phòng (Backup Email)
                                </label>
                                <Controller
                                    name="backupEmail"
                                    control={control}
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            type="email"
                                            placeholder="email.khac@gmail.com"
                                            value={field.value || ''}
                                            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none transition-all duration-200 placeholder:text-slate-400 placeholder:font-normal focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white"
                                        />
                                    )}
                                />
                                <p className="text-xs text-slate-500 mt-1.5 font-normal">
                                    Tùy chọn. Khuyến khích sử dụng email cá nhân khác để khôi phục tài khoản.
                                </p>
                            </div>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex justify-end gap-3 pt-8 mt-8 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={() => navigate(`/${prefixAdmin}/staff/profile/list`)}
                                className="px-6 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                            >
                                {isPending && <Loader size={16} className="animate-spin" />}
                                {isPending ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </div>
                    </form>

                    {/* ACCOUNT PROVISION SECTION */}
                    {profile && !profile.userId && (
                        <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                            <h2 className="text-lg font-bold text-slate-900 mb-6">Cấp tài khoản & Phân quyền</h2>

                            {!showAccountForm ? (
                                <div className="text-center py-6">
                                    <p className="text-sm text-slate-600 mb-4">
                                        Nhân viên này chưa có tài khoản đăng nhập hệ thống.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setShowAccountForm(true)}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
                                    >
                                        Cấp tài khoản mới
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {/* INFO BOX */}
                                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50">
                                        <p className="text-xs font-bold text-blue-900 mb-2">HƯỚNG DẪN:</p>
                                        <ul className="text-xs text-blue-800 space-y-1 font-normal">
                                            <li>
                                                • Nếu email <strong>{profile.email}</strong> đã có tài khoản khách hàng, hãy để trống
                                                Tên đăng nhập và Mật khẩu. Hệ thống sẽ tự động liên kết.
                                            </li>
                                            <li>
                                                • Nếu chưa có, hãy nhập Tên đăng nhập. Mật khẩu có thể để trống để hệ thống tự
                                                tạo ngẫu nhiên.
                                            </li>
                                        </ul>
                                    </div>

                                    {/* ROLE SELECT (Super Admin only) */}
                                    {isSuperAdmin && (
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Vai trò cấp quyền (Role)
                                            </label>
                                            <select
                                                value={accountForm.roleName}
                                                onChange={(e) => setAccountForm((p) => ({ ...p, roleName: e.target.value }))}
                                                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none transition-all duration-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white cursor-pointer"
                                            >
                                                <option value="STAFF">Staff (Nhân viên)</option>
                                                <option value="ADMIN">Admin (Quản trị viên)</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* USERNAME */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Tên đăng nhập
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ví dụ: kietnt"
                                            value={accountForm.username || ''}
                                            onChange={(e) => setAccountForm((p) => ({ ...p, username: e.target.value }))}
                                            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none transition-all duration-200 placeholder:text-slate-400 placeholder:font-normal focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white"
                                        />
                                    </div>

                                    {/* PASSWORD */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Mật khẩu
                                        </label>
                                        <input
                                            type="password"
                                            placeholder="Để trống để tự tạo ngẫu nhiên"
                                            value={accountForm.password || ''}
                                            onChange={(e) => setAccountForm((p) => ({ ...p, password: e.target.value }))}
                                            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none transition-all duration-200 placeholder:text-slate-400 placeholder:font-normal focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white"
                                        />
                                    </div>

                                    {/* ACTION BUTTONS */}
                                    <div className="flex gap-3 pt-4 mt-6 border-t border-slate-200">
                                        <button
                                            type="button"
                                            onClick={onProvisionAccount}
                                            disabled={isProvisioning}
                                            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                                        >
                                            {isProvisioning && <Loader size={16} className="animate-spin" />}
                                            {isProvisioning ? 'Đang xử lý...' : 'Xác nhận cấp tài khoản'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowAccountForm(false)}
                                            className="px-6 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
