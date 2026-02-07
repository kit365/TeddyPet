import React from 'react';
import { WarningCircle, CheckCircle, Xmark } from 'iconoir-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'success' | 'danger';
    isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Xác nhận",
    cancelText = "Hủy bỏ",
    type = 'warning',
    isLoading = false
}) => {
    if (!isOpen) return null;

    const colors = {
        warning: 'text-amber-500 bg-amber-50',
        success: 'text-emerald-500 bg-emerald-50',
        danger: 'text-red-500 bg-red-50'
    };

    const btnColors = {
        warning: 'bg-client-primary hover:bg-client-secondary',
        success: 'bg-emerald-600 hover:bg-emerald-700',
        danger: 'bg-red-600 hover:bg-red-700'
    };

    const icons = {
        warning: <WarningCircle className="w-12 h-12" />,
        success: <CheckCircle className="w-12 h-12" />,
        danger: <WarningCircle className="w-12 h-12" />
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 animate-fadeInOut">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-client-secondary/40 backdrop-blur-md transition-opacity"
                onClick={!isLoading ? onClose : undefined}
            />

            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-[450px] rounded-[40px] shadow-2xl overflow-hidden animate-slideUp">
                <div className="p-10 text-center">
                    <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 ${colors[type]}`}>
                        {icons[type]}
                    </div>

                    <h3 className="text-[2.6rem] font-black text-client-secondary mb-4 uppercase tracking-tighter">
                        {title}
                    </h3>
                    <p className="text-[1.6rem] text-gray-500 font-medium leading-relaxed mb-10">
                        {message}
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`h-[65px] w-full rounded-[24px] text-white font-black text-[1.6rem] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 ${btnColors[type]} disabled:opacity-50 disabled:scale-100`}
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                confirmText
                            )}
                        </button>

                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="h-[60px] w-full bg-gray-50 text-gray-400 font-bold text-[1.5rem] rounded-[24px] hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="absolute top-6 right-6 p-2 text-gray-300 hover:text-gray-600 transition-colors"
                >
                    <Xmark className="w-8 h-8" />
                </button>
            </div>

            <style>{`
                @keyframes fadeInOut {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-fadeInOut {
                    animation: fadeInOut 0.3s ease-out forwards;
                }
                .animate-slideUp {
                    animation: slideUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
            `}</style>
        </div>
    );
};
