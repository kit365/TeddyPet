import { Printer, Download, ArrowLeft } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useContractById } from '../hooks/useContract';
import { useStaffProfileById } from '../hooks/useStaffProfile';
import type { IContract } from '../../../api/contract.api';
import { prefixAdmin } from '../../../constants/routes';
import { Breadcrumb } from '../../../components/ui/Breadcrumb';

const formatCurrencyVND = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '—';
    try {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(value);
    } catch {
        return `${value.toLocaleString('vi-VN')} VND`;
    }
};

const formatDateVi = (value: string | undefined | null): string => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat('vi-VN').format(d);
};

const getContractTypeLabel = (type: IContract['contractType']): string => {
    if (type === 'FULL_TIME') return 'Toàn thời gian (Full-time)';
    if (type === 'PART_TIME') return 'Bán thời gian (Part-time)';
    return 'Không xác định';
};

const getStatusDisplay = (statusRaw: string | undefined | null) => {
    const status = (statusRaw ?? '').toUpperCase();
    if (status === 'ACTIVE') {
        return {
            label: 'Đang hiệu lực',
            badgeClass:
                'inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700',
            dotClass: 'h-1.5 w-1.5 rounded-full bg-emerald-500',
        };
    }
    if (status === 'PENDING') {
        return {
            label: 'Chờ hiệu lực',
            badgeClass:
                'inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700',
            dotClass: 'h-1.5 w-1.5 rounded-full bg-amber-500',
        };
    }
    if (status === 'EXPIRED') {
        return {
            label: 'Đã hết hạn',
            badgeClass:
                'inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-700',
            dotClass: 'h-1.5 w-1.5 rounded-full bg-gray-400',
        };
    }
    return {
        label: statusRaw ?? 'Không xác định',
        badgeClass:
            'inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700',
        dotClass: 'h-1.5 w-1.5 rounded-full bg-slate-500',
    };
};

const buildContractCode = (contract: IContract | undefined | null): string => {
    if (!contract) return '—';
    const year = contract.startDate?.slice(0, 4) || '----';
    const seq = String(contract.contractId).padStart(3, '0');
    return `#HD-${year}-${seq}`;
};

export const ContractDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const contractId = id ? Number(id) : NaN;

    const { data: contractRes, isLoading } = useContractById(
        Number.isNaN(contractId) ? null : contractId
    );
    const contract: IContract | undefined = contractRes?.data;

    const { data: staffProfileRes } = useStaffProfileById(contract?.staffId ?? null);
    const staffProfile = staffProfileRes?.data;

    const statusDisplay = getStatusDisplay(contract?.status);
    const contractCode = useMemo(() => buildContractCode(contract), [contract]);
    const [avatarError, setAvatarError] = useState(false);
    useEffect(() => setAvatarError(false), [contract?.staffId, staffProfile?.staffId]);
    const showAvatar = (staffProfile?.avatarUrl || staffProfile?.altImage) && !avatarError;

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        // Tạm thời dùng luôn print -> Save as PDF; có thể thay bằng export PDF backend sau
        window.print();
    };

    if (isLoading) {
        return (
            <div className="w-full min-h-screen bg-gray-50/60 py-10 px-4 sm:px-8 lg:px-12">
                <div className="w-full max-w-7xl mx-auto">
                    <p className="text-sm text-gray-500">Đang tải dữ liệu hợp đồng...</p>
                </div>
            </div>
        );
    }

    if (!contract) {
        return (
            <div className="w-full min-h-screen bg-gray-50/60 py-10 px-4 sm:px-8 lg:px-12">
                <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-base font-semibold text-gray-900">
                                Chi tiết hợp đồng lao động
                            </h1>
                            <p className="mt-3 text-sm font-medium text-gray-500">
                                Không tìm thấy hợp đồng. Vui lòng kiểm tra lại đường dẫn.
                            </p>
                        </div>
                        <button
                            type="button"
                            title="Quay lại danh sách"
                            onClick={() => navigate(`/${prefixAdmin}/staff/contract/list`)}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Hợp đồng không tồn tại hoặc đã bị xóa.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/60 pt-5 pb-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
            <div className="w-full flex flex-col gap-5">
                {/* Page header - giống Chi tiết nhân sự: nút back, tiêu đề, breadcrumb */}
                <header className="flex flex-col gap-2 contract-detail-no-print">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                title="Quay lại danh sách"
                                onClick={() => navigate(`/${prefixAdmin}/staff/contract/list`)}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#0F172A] shadow-[0_2px_6px_rgba(0,0,0,0.06)] transition-colors hover:bg-[#F8FAFC]"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                            </button>
                            <div>
                                <h1 className="text-[2rem] font-bold text-[#1C252E] tracking-tight">
                                    Chi tiết hợp đồng lao động
                                </h1>
                                <Breadcrumb
                                    items={[
                                        { label: 'Trang chủ', to: '/' },
                                        { label: 'Hợp đồng', to: `/${prefixAdmin}/staff/contract/list` },
                                        { label: contractCode },
                                    ]}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="inline-flex items-center gap-1.5 h-7 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
                            >
                                <Printer className="h-3 w-3" />
                                <span>In hợp đồng</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleDownload}
                                className="inline-flex items-center gap-1.5 h-7 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm transition-all hover:bg-blue-700"
                            >
                                <Download className="h-3 w-3" />
                                <span>Tải xuống</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Employee summary card - gọn, tên nổi bật */}
                <section className="flex items-center gap-4 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-sm font-semibold text-gray-500">
                        {showAvatar ? (
                            <img
                                src={staffProfile?.avatarUrl || staffProfile?.altImage || ''}
                                alt={staffProfile?.fullName ?? 'Avatar'}
                                className="h-full w-full object-cover"
                                onError={() => setAvatarError(true)}
                            />
                        ) : (
                            <span className="flex h-full w-full items-center justify-center">
                                {staffProfile?.fullName?.charAt(0) ?? 'NV'}
                            </span>
                        )}
                    </div>
                    <div className="min-w-0 flex flex-1 flex-col gap-0.5">
                        <p className="text-base font-semibold leading-tight text-gray-900">
                            {staffProfile?.fullName ?? `Nhân viên #${contract.staffId}`}
                        </p>
                        <p className="text-sm text-gray-600">
                            {staffProfile?.positionName ?? 'Nhân viên cửa hàng'}
                        </p>
                        <p className="text-sm font-medium text-gray-500">
                            ID nhân viên: {contract.staffId}
                        </p>
                    </div>
                    <div className="ml-auto">
                        <span className={statusDisplay.badgeClass}>
                            <span className={statusDisplay.dotClass} />
                            <span>{statusDisplay.label}</span>
                        </span>
                    </div>
                </section>

                {/* General information - gọn, nhãn rõ */}
                <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm md:p-5">
                    <div className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                        <h2 className="text-base font-semibold text-gray-800">Thông tin chung</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-y-5 gap-x-6 md:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <span className="mb-1 block text-sm font-semibold uppercase tracking-wider text-gray-600">
                                Mã hợp đồng
                            </span>
                            <p className="text-sm font-semibold text-gray-900">{contractCode}</p>
                        </div>
                        <div>
                            <span className="mb-1 block text-sm font-semibold uppercase tracking-wider text-gray-600">
                                Loại hợp đồng
                            </span>
                            <p className="text-sm font-semibold text-gray-900">
                                {getContractTypeLabel(contract.contractType)}
                            </p>
                        </div>
                        <div>
                            <span className="mb-1 block text-sm font-semibold uppercase tracking-wider text-gray-600">
                                Trạng thái
                            </span>
                            <p className="text-sm font-semibold text-gray-900">
                                {statusDisplay.label}
                            </p>
                        </div>
                        <div>
                            <span className="mb-1 block text-sm font-semibold uppercase tracking-wider text-gray-600">
                                Ngày bắt đầu
                            </span>
                            <p className="text-sm font-semibold text-gray-900">
                                {formatDateVi(contract.startDate)}
                            </p>
                        </div>
                        <div>
                            <span className="mb-1 block text-sm font-semibold uppercase tracking-wider text-gray-600">
                                Ngày kết thúc
                            </span>
                            <p className="text-sm font-semibold text-gray-900">
                                {formatDateVi(contract.endDate ?? undefined)}
                            </p>
                        </div>
                        <div>
                            <span className="mb-1 block text-sm font-semibold uppercase tracking-wider text-gray-600">
                                Ngày tạo bản ghi
                            </span>
                            <p className="text-sm font-semibold text-gray-900">
                                {formatDateVi(contract.startDate)}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Salary & benefits */}
                <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm md:p-5">
                    <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <h2 className="text-base font-semibold text-gray-800">Lương & phụ cấp</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-y-5 gap-x-6 md:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <span className="mb-1 block text-sm font-semibold uppercase tracking-wider text-gray-600">
                                Lương cơ bản
                            </span>
                            <p className="text-base font-bold text-blue-700">
                                {formatCurrencyVND(contract.baseSalary)}{' '}
                                <span className="font-semibold text-gray-600 text-sm">
                                    / {contract.contractType === 'FULL_TIME' ? '1 tháng' : '1 tiếng'}
                                </span>
                            </p>
                        </div>
                        <div>
                            <span className="mb-1 block text-sm font-semibold uppercase tracking-wider text-gray-600">
                                Hình thức trả lương
                            </span>
                            <p className="text-sm font-semibold text-gray-900">
                                Chuyển khoản hàng tháng
                            </p>
                        </div>
                        <div>
                            <span className="mb-1 block text-sm font-semibold uppercase tracking-wider text-gray-600">
                                Chu kỳ trả lương
                            </span>
                            <p className="text-sm font-semibold text-gray-900">
                                Ngày 05 hàng tháng
                            </p>
                        </div>
                        <div>
                            <span className="mb-1 block text-sm font-semibold uppercase tracking-wider text-gray-600">
                                Phụ cấp & thưởng
                            </span>
                            <p className="text-sm font-semibold text-gray-900">
                                Theo chính sách nội bộ TeddyPet
                            </p>
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                            <span className="mb-1 block text-sm font-semibold uppercase tracking-wider text-gray-600">
                                Ghi chú thêm
                            </span>
                            <p className="text-base text-gray-900 leading-snug">
                                Nhân viên được hưởng đầy đủ các chế độ bảo hiểm, nghỉ phép và phúc lợi theo quy định
                                của pháp luật và quy chế của cửa hàng TeddyPet.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Terms summary */}
                <section className="mb-8 rounded-md border border-gray-200 bg-white p-4 pb-6 shadow-sm md:p-5">
                    <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <h2 className="text-base font-semibold text-gray-800">Tóm tắt điều khoản chính</h2>
                    </div>
                    <div className="space-y-3 text-base leading-relaxed text-gray-800">
                        <p>
                            Hợp đồng này quy định trách nhiệm và quyền lợi của người lao động và người sử dụng lao
                            động, căn cứ theo Bộ luật Lao động hiện hành và các quy định nội bộ của cửa hàng TeddyPet.
                        </p>
                        <p>
                            Người lao động cam kết tuân thủ nội quy lao động, quy trình phục vụ khách hàng, quy định
                            về an toàn và chăm sóc thú cưng trong suốt thời gian làm việc.
                        </p>
                        <p>
                            Mọi thay đổi, điều chỉnh liên quan đến lương, vị trí công việc hoặc thời hạn hợp đồng sẽ
                            được lập thành phụ lục hợp đồng và có chữ ký xác nhận của cả hai bên.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ContractDetailPage;

