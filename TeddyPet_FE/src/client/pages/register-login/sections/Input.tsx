import { forwardRef } from "react";

interface InputProps {
    name: string;
    placeholder: string;
    type?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (props, ref) => {
        const { name, placeholder, type = "text", error, ...rest } = props;

        return (
            <div className="mb-[10px] font-[300] text-client-text">
                <input
                    ref={ref}
                    name={name}
                    placeholder={placeholder}
                    type={type}
                    className="w-full mb-[5px] bg-white text-client-text outline-none border border-[#d7d7d7] px-[32px] py-[16px] rounded-[40px] focus:border focus:border-client-primary transition-default"
                    {...rest}
                />
                <div className="min-h-[22px] ml-[32px]">
                    {error && <span className="text-client-secondary text-[0.875rem]">{error}</span>}
                </div>
            </div>
        )
    }
);