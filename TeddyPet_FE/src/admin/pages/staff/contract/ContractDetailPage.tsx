import { Printer, Download, ArrowLeft } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useContractById } from '../hooks/useContract';
import { useStaffProfileById } from '../hooks/useStaffProfile';
import type { IContract } from '../../../api/contract.api';
import { prefixAdmin } from '../../../constants/routes';

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
                'inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700',
            dotClass: 'h-2 w-2 rounded-full bg-emerald-500',
        };
    }
    if (status === 'PENDING') {
        return {
            label: 'Chờ hiệu lực',
            badgeClass:
                'inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700',
            dotClass: 'h-2 w-2 rounded-full bg-amber-500',
        };
    }
    if (status === 'EXPIRED') {
        return {
            label: 'Đã hết hạn',
            badgeClass:
                'inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-bold text-gray-700',
            dotClass: 'h-2 w-2 rounded-full bg-gray-400',
        };
    }
    return {
        label: statusRaw ?? 'Không xác định',
        badgeClass:
            'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-bold text-slate-700',
        dotClass: 'h-2 w-2 rounded-full bg-slate-500',
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
                    <p className="text-base text-gray-500">Đang tải dữ liệu hợp đồng...</p>
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
                            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
                                Chi tiết hợp đồng lao động
                            </h1>
                            <p className="mt-3 text-base font-medium text-gray-500">
                                Không tìm thấy hợp đồng. Vui lòng kiểm tra lại đường dẫn.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate(`/${prefixAdmin}/staff/contract/list`)}
                            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Quay lại danh sách</span>
                        </button>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-base text-amber-800">
                        Hợp đồng không tồn tại hoặc đã bị xóa.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/60 pt-10 pb-24 px-6 sm:px-10 lg:px-16">
            <div className="w-full flex flex-col gap-10">
                {/* Page header */}
                <header className="mb-2 flex flex-col gap-4">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                        <div className="flex items-start gap-3">
                            <button
                                type="button"
                                onClick={() => navigate(`/${prefixAdmin}/staff/contract/list`)}
                                className="mt-1 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span>Quay lại danh sách</span>
                            </button>
                            <div>
                                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
                                    Chi tiết hợp đồng lao động
                                </h1>
                                <p className="mt-3 flex items-center gap-2 text-lg font-medium text-gray-500">
                                    <span>Mã HĐ:</span>
                                    <span className="rounded-full bg-gray-100 px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-gray-800">
                                        {contractCode}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
                            >
                                <Printer className="h-4 w-4" />
                                <span>In hợp đồng</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleDownload}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700"
                            >
                                <Download className="h-4 w-4" />
                                <span>Tải xuống</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Employee summary card */}
                <section className="flex items-center gap-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-xl font-semibold text-gray-500">
                        {staffProfile?.fullName?.charAt(0) ?? 'NV'}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <p className="text-3xl font-extrabold text-gray-900">
                            {staffProfile?.fullName ?? `Nhân viên #${contract.staffId}`}
                        </p>
                        <p className="text-lg text-gray-600">
                            {staffProfile?.positionName ?? 'Nhân viên cửa hàng'}
                        </p>
                        <p className="text-base font-medium text-gray-400">
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

                {/* General information */}
                <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm md:p-12">
                    <div className="mb-10 flex items-center gap-2 border-b border-gray-100 pb-5">
                        <h2 className="text-2xl font-bold text-gray-800">Thông tin chung</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-y-10 gap-x-12 md:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-gray-400">
                                Mã hợp đồng
                            </span>
                            <p className="text-lg font-semibold text-gray-900">{contractCode}</p>
                        </div>
                        <div>
                            <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-gray-400">
                                Loại hợp đồng
                            </span>
                            <p className="text-lg font-semibold text-gray-900">
                                {getContractTypeLabel(contract.contractType)}
                            </p>
                        </div>
                        <div>
                            <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-gray-400">
                                Trạng thái
                            </span>
                            <p className="text-lg font-semibold text-gray-900">
                                {statusDisplay.label}
                            </p>
                        </div>
                        <div>
                            <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-gray-400">
                                Ngày bắt đầu
                            </span>
                            <p className="text-lg font-semibold text-gray-900">
                                {formatDateVi(contract.startDate)}
                            </p>
                        </div>
                        <div>
                            <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-gray-400">
                                Ngày kết thúc
                            </span>
                            <p className="text-lg font-semibold text-gray-900">
                                {formatDateVi(contract.endDate ?? undefined)}
                            </p>
                        </div>
                        <div>
                            <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-gray-400">
                                Ngày tạo bản ghi
                            </span>
                            <p className="text-lg font-semibold text-gray-900">
                                {formatDateVi(contract.startDate)}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Salary & benefits */}
                <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm md:p-12">
                    <div className="mb-10 flex items-center gap-2 border-b border-gray-100 pb-5">
                        <h2 className="text-2xl font-bold text-gray-800">Lương & phụ cấp</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-y-10 gap-x-12 md:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-gray-400">
                                Lương cơ bản
                            </span>
                            <p className="text-3xl font-extrabold text-blue-700">
                                {formatCurrencyVND(contract.baseSalary)}
                            </p>
                        </div>
                        <div>
                            <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-gray-400">
                                Hình thức trả lương
                            </span>
                            <p className="text-lg font-semibold text-gray-900">
                                Chuyển khoản hàng tháng
                            </p>
                        </div>
                        <div>
                            <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-gray-400">
                                Chu kỳ trả lương
                            </span>
                            <p className="text-lg font-semibold text-gray-900">
                                Ngày 05 hàng tháng
                            </p>
                        </div>
                        <div>
                            <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-gray-400">
                                Phụ cấp & thưởng
                            </span>
                            <p className="text-lg font-semibold text-gray-900">
                                Theo chính sách nội bộ TeddyPet
                            </p>
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                            <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-gray-400">
                                Ghi chú thêm
                            </span>
                            <p className="text-lg font-semibold text-gray-900">
                                Nhân viên được hưởng đầy đủ các chế độ bảo hiểm, nghỉ phép và phúc lợi theo quy định
                                của pháp luật và quy chế của cửa hàng TeddyPet.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Terms summary */}
                <section className="mb-20 rounded-2xl border border-gray-200 bg-white p-8 pb-12 shadow-sm md:p-12 md:pb-16">
                    <div className="mb-10 flex items-center gap-2 border-b border-gray-100 pb-5">
                        <h2 className="text-2xl font-bold text-gray-800">Tóm tắt điều khoản chính</h2>
                    </div>
                    <div className="space-y-6 text-lg leading-relaxed text-gray-700">
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

