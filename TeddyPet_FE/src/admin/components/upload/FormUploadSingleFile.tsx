import { Controller, Control } from "react-hook-form";
import { UploadSingleFile } from "./UploadSingleFile";

interface FormUploadSingleFileProps {
    name: string;
    control: Control<any>;
    disabled?: boolean;
    compact?: boolean;
    /** Nhãn hiển thị phía trên (mặc định: "Hình ảnh") */
    title?: string;
}

export const FormUploadSingleFile = ({
    name,
    control,
    disabled,
    compact = false,
    title = 'Hình ảnh',
}: FormUploadSingleFileProps) => {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field, fieldState }) => (
                <UploadSingleFile
                    value={field.value}
                    onChange={field.onChange}
                    disabled={disabled}
                    error={fieldState.error?.message}
                    compact={compact}
                    title={title}
                />
            )}
        />
    );
};
