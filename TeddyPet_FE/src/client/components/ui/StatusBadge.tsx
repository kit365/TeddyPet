import React from 'react';
import { getOrderStatus } from '../../constants/status.constant';

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
    const { label, color, bgColor } = getOrderStatus(status);

    return (
        <span
            className={`px-[12px] py-[6px] rounded-[8px] text-[0.8125rem] font-[700] uppercase inline-block ${className}`}
            style={{
                color: color,
                backgroundColor: bgColor,
            }}
        >
            {label}
        </span>
    );
};
