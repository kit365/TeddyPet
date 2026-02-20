import { Controller, Control } from 'react-hook-form';
import { UploadMultiFile } from './UploadMultiFile';

interface FormUploadMultiFileProps {
    name: string;
    control: Control<any>;
    disabled?: boolean;
    title?: string;
}

export const FormUploadMultiFile = ({ name, control, disabled, title }: FormUploadMultiFileProps) => {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field, fieldState }) => (
                <UploadMultiFile
                    value={field.value}
                    onChange={field.onChange}
                    disabled={disabled}
                    error={fieldState.error?.message}
                    title={title}
                />
            )}
        />
    );
};

