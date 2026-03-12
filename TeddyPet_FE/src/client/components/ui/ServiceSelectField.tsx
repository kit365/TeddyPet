import type { ReactNode } from "react";

const DEFAULT_DISCLAIMER =
    "Giá cuối cùng sẽ được xác định sau khi cân đo thực tế tại shop. Nếu có chênh lệch, chúng tôi sẽ thông báo trước khi thực hiện.";

export type ServiceSelectFieldProps = {
    /** Nhãn trên (vd: "Chọn dịch vụ *", "Chọn dịch vụ thêm") */
    label: string;
    /** Text hiển thị trong nút dropdown */
    displayValue: string;
    /** Có bị vô hiệu hóa không (vd: chưa chọn cân nặng/loại thú cưng) */
    disabled?: boolean;
    /** Text hiển thị khi disabled (vd: "Vui lòng chọn loại thú cưng và cân nặng trước") */
    disabledPlaceholder?: string;
    /** Dropdown đang mở hay không */
    isOpen: boolean;
    /** Bấm vào nút để mở/đóng */
    onToggle: () => void;
    /** Nội dung dropdown (danh sách dịch vụ theo danh mục) */
    dropdownContent: ReactNode;
    /** Disclaimer tùy chỉnh; mặc định dùng text chuẩn */
    disclaimer?: string;
    /** Phần tử bên phải (vd: nút xóa cho dịch vụ thêm) */
    actionRight?: ReactNode;
};

/**
 * Ô chọn dịch vụ dùng chung: label + disclaimer + nút dropdown + panel dropdown.
 * Dùng cho cả "Chọn dịch vụ" (dịch vụ chính) và "Chọn dịch vụ thêm" để tránh lặp code.
 */
export function ServiceSelectField({
    label,
    displayValue,
    disabled = false,
    disabledPlaceholder,
    isOpen,
    onToggle,
    dropdownContent,
    disclaimer = DEFAULT_DISCLAIMER,
    actionRight,
}: ServiceSelectFieldProps) {
    const buttonLabel = disabled && disabledPlaceholder ? disabledPlaceholder : displayValue;

    return (
        <div className={actionRight ? "flex items-start gap-2" : ""}>
            <div className={actionRight ? "flex-1 min-w-0 relative" : "relative"}>
                <div className="flex flex-wrap items-start justify-between gap-x-[12px] gap-y-[6px] mb-[6px]">
                    <label className="text-[0.875rem] font-[600] text-[#181818]">{label}</label>
                    <span className="text-[0.7812rem] font-[500] text-[#888] leading-[1.45] sm:text-right sm:max-w-[520px]">
                        {disclaimer}
                    </span>
                </div>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                        if (disabled) return;
                        onToggle();
                    }}
                    className={`w-full flex items-center justify-between py-[12px] px-[16px] rounded-[10px] border text-left text-[0.9375rem] transition-colors ${
                        disabled
                            ? "border-[#ddd] bg-[#f5f5f5] text-[#999] cursor-not-allowed"
                            : "border-[#ddd] bg-white text-[#181818] hover:border-[#ffbaa0] cursor-pointer"
                    }`}
                >
                    <span className="truncate">{buttonLabel}</span>
                    <span className="ml-3 text-[#999] text-[0.8125rem] shrink-0">{isOpen ? "▲" : "▼"}</span>
                </button>

                {isOpen && dropdownContent && (
                    <div className="absolute left-0 right-0 mt-[6px] z-30 bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_12px_30px_rgba(15,23,42,0.18)] max-h-[360px] overflow-y-auto">
                        {dropdownContent}
                    </div>
                )}
            </div>
            {actionRight}
        </div>
    );
}
