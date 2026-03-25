import React from 'react';
import { Printer, X } from 'lucide-react';

interface ContractData {
    employeeName: string;
    employeeId: string;
    contractType: string;
    baseSalary: number | string;
    startDate: string;
    endDate: string;
    status: string;
}

interface ContractDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    contractData: ContractData | null;
}

const formatCurrencyVND = (value: number | string | undefined | null): string => {
    if (value === undefined || value === null) return 'N/A';
    const num = typeof value === 'number' ? value : Number.parseFloat(value);
    if (Number.isNaN(num)) return String(value);
    try {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(num);
    } catch {
        return `${num} VND`;
    }
};

const formatDateVi = (value: string | undefined | null): string => {
    if (!value) return 'N/A';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat('vi-VN').format(d);
};

const getStatusBadgeClasses = (statusRaw: string | undefined | null): { container: string; dot: string } => {
    const status = (statusRaw ?? '').toLowerCase();

    if (!status) {
        return {
            container:
                'inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600',
            dot: 'h-2 w-2 rounded-full bg-gray-400',
        };
    }

    if (status.includes('hoạt động') || status.includes('active') || status.includes('effective')) {
        return {
            container:
                'inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700',
            dot: 'h-2 w-2 rounded-full bg-emerald-500',
        };
    }

    if (status.includes('hết hạn') || status.includes('expired')) {
        return {
            container:
                'inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600',
            dot: 'h-2 w-2 rounded-full bg-gray-400',
        };
    }

    if (status.includes('chờ') || status.includes('pending')) {
        return {
            container:
                'inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700',
            dot: 'h-2 w-2 rounded-full bg-amber-500',
        };
    }

    return {
        container:
            'inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700',
        dot: 'h-2 w-2 rounded-full bg-sky-500',
    };
};

const printContract = () => {
    const printContent = document.getElementById('contract-print-area');
    if (!printContent) {
        window.print();
        return;
    }

    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=768');
    if (!printWindow) {
        window.print();
        return;
    }

    printWindow.document.open();
    printWindow.document.write(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charSet="UTF-8" />
  <title>In hợp đồng</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #111827;
    }
    .a4 {
      width: 210mm;
      min-height: 297mm;
      padding: 28mm 20mm;
      margin: 0 auto;
    }
    @page {
      size: A4;
      margin: 15mm;
    }
  </style>
</head>
<body>
  <div class="a4">
    ${printContent.innerHTML}
  </div>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
};

export const ContractDetailModal: React.FC<ContractDetailModalProps> = ({ isOpen, onClose, contractData }) => {
    if (!isOpen) return null;

    const handleOverlayClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const statusClasses = getStatusBadgeClasses(contractData?.status);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={handleOverlayClick}
        >
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-2xl">
                {/* Action bar (sticky) */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
                    <div>
                        <div className={statusClasses.container}>
                            <span className={statusClasses.dot} />
                            <span>{contractData?.status ?? 'Không xác định'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={printContract}
                            disabled={!contractData}
                            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Printer className="h-4 w-4" />
                            <span>In hợp đồng</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm transition-colors hover:bg-rose-100"
                        >
                            <X className="h-4 w-4" />
                            <span>Đóng</span>
                        </button>
                    </div>
                </div>

                {/* Document body */}
                <div id="contract-print-area" className="px-10 py-10 text-gray-900">
                    {/* Header */}
                    <div className="text-center">
                        <p className="text-lg font-bold tracking-wide">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                        <p className="text-base font-bold underline underline-offset-4">Độc lập - Tự do - Hạnh phúc</p>
                    </div>

                    {/* Title */}
                    <div className="mt-8 mb-8 text-center">
                        <h1 className="text-2xl font-extrabold tracking-wide">HỢP ĐỒNG LAO ĐỘNG</h1>
                    </div>

                    {!contractData ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            Không tìm thấy dữ liệu hợp đồng. Vui lòng kiểm tra lại.
                        </div>
                    ) : (
                        <>
                            {/* Thông tin mở đầu */}
                            <p className="mb-4 leading-relaxed">
                                Hôm nay, ngày {formatDateVi(contractData.startDate)}, chúng tôi gồm:
                            </p>

                            {/* Bên A */}
                            <div className="mb-4 leading-relaxed">
                                <p className="mb-2 font-semibold">Bên A (Người sử dụng lao động):</p>
                                <p className="mb-1">Tên đơn vị: Cửa hàng TeddyPet</p>
                                <p className="mb-1">Địa chỉ: 123 Đường Thú Cưng, Quận 1, TP. Hồ Chí Minh</p>
                                <p className="mb-1">Điện thoại: 0123 456 789</p>
                                <p className="mb-1">Đại diện: Nguyễn Văn A - Giám đốc</p>
                            </div>

                            {/* Bên B */}
                            <div className="mb-4 leading-relaxed">
                                <p className="mb-2 font-semibold">Bên B (Người lao động):</p>
                                <p className="mb-1">Họ và tên: {contractData.employeeName}</p>
                                <p className="mb-1">Mã nhân viên: {contractData.employeeId}</p>
                            </div>

                            {/* Điều 1 */}
                            <div className="mb-4 leading-relaxed">
                                <p className="mb-2 font-semibold">Điều 1: Thời hạn hợp đồng</p>
                                <p className="mb-1">
                                    Loại hợp đồng lao động: <span className="font-medium">{contractData.contractType}</span>.
                                </p>
                                <p className="mb-1">
                                    Thời gian làm việc từ ngày{' '}
                                    <span className="font-medium">{formatDateVi(contractData.startDate)}</span> đến ngày{' '}
                                    <span className="font-medium">{formatDateVi(contractData.endDate)}</span>.
                                </p>
                            </div>

                            {/* Điều 2 */}
                            <div className="mb-4 leading-relaxed">
                                <p className="mb-2 font-semibold">Điều 2: Lương và Phụ cấp</p>
                                <p className="mb-1">
                                    Mức lương cơ bản hàng tháng của Bên B là:{' '}
                                    <span className="font-medium">{formatCurrencyVND(contractData.baseSalary)}</span>.
                                </p>
                                <p className="mb-1">
                                    Các khoản phụ cấp, thưởng và chế độ đãi ngộ khác (nếu có) sẽ được áp dụng theo quy
                                    định nội bộ của Cửa hàng TeddyPet và các chính sách hiện hành.
                                </p>
                            </div>

                            {/* Điều 3 (mô tả chung, không động dữ liệu) */}
                            <div className="mb-4 leading-relaxed">
                                <p className="mb-2 font-semibold">Điều 3: Quyền và nghĩa vụ của các bên</p>
                                <p className="mb-1">
                                    Hai bên cam kết thực hiện đầy đủ quyền và nghĩa vụ theo quy định của Bộ luật Lao động,
                                    nội quy lao động của Cửa hàng TeddyPet và các điều khoản đã thỏa thuận trong hợp đồng
                                    này.
                                </p>
                            </div>

                            {/* Kết */}
                            <div className="mb-4 leading-relaxed">
                                <p className="mb-1">
                                    Hợp đồng này được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản
                                    để thực hiện.
                                </p>
                                <p className="mb-1">
                                    Hợp đồng có hiệu lực kể từ ngày{' '}
                                    <span className="font-medium">{formatDateVi(contractData.startDate)}</span> trừ khi
                                    có thỏa thuận khác bằng văn bản.
                                </p>
                            </div>

                            {/* Chữ ký */}
                            <div className="mt-16 mb-8 grid grid-cols-2 gap-8 text-center">
                                <div>
                                    <p className="font-semibold uppercase">ĐẠI DIỆN BÊN A</p>
                                    <p className="text-sm italic">(Ký, ghi rõ họ tên)</p>
                                    <div className="mt-8 h-32" />
                                </div>
                                <div>
                                    <p className="font-semibold uppercase">NGƯỜI LAO ĐỘNG</p>
                                    <p className="text-sm italic">(Ký, ghi rõ họ tên)</p>
                                    <div className="mt-8 h-32" />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContractDetailModal;

