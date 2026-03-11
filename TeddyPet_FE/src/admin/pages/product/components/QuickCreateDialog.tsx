import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    CircularProgress,
    Stack,
    Typography
} from '@mui/material';

export interface QuickCreateField {
    key: string;
    label: string;
    placeholder?: string;
    type?: 'text' | 'number' | 'multiline' | 'color';
    required?: boolean;
}

interface QuickCreateDialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    fields: QuickCreateField[];
    onSave: (data: any) => Promise<any>;
    initialData?: any;
    saveLabel?: string;
}

export const QuickCreateDialog: React.FC<QuickCreateDialogProps> = ({
    open,
    onClose,
    title,
    fields,
    onSave,
    initialData = {},
    saveLabel = 'Tạo mới'
}) => {
    const [formData, setFormData] = useState<any>(initialData);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            setFormData(initialData);
            setErrors({});
        }
    }, [open, initialData]);

    const handleFieldChange = (key: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
        if (errors[key]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[key];
                return newErrors;
            });
        }
    };

    const handleSave = async () => {
        const newErrors: Record<string, string> = {};
        fields.forEach(field => {
            if (field.required && !formData[field.key]?.trim()) {
                newErrors[field.key] = `Vui lòng nhập ${field.label.toLowerCase()}`;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (err: any) {
            setErrors({ submit: err.message || 'Có lỗi xảy ra' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: "20px",
                    padding: "24px",
                    boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.12)",
                    background: "#FFFFFF",
                }
            }}
        >
            <DialogTitle sx={{ 
                fontSize: '2rem', 
                fontWeight: 700, 
                px: 0, 
                pb: 3,
                color: '#1C252E',
            }}>
                {title}
            </DialogTitle>
            <DialogContent sx={{ px: 0, py: 0 }}>
                <Stack spacing={3}>
                    {errors.submit && (
                        <Typography color="error" sx={{ fontSize: '1.4rem', textAlign: 'center', p: 1.5, bgcolor: 'rgba(255, 86, 48, 0.08)', borderRadius: '12px' }}>
                            {errors.submit}
                        </Typography>
                    )}
                    {fields.map((field) => (
                        <Box key={field.key}>
                            {field.type === 'color' ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                    <Box sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: '8px',
                                        backgroundColor: formData[field.key] || '#000000',
                                        border: '2px solid #fff',
                                        boxShadow: '0 0 0 1px #919EAB33',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <input
                                            type="color"
                                            value={formData[field.key] || '#000000'}
                                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                            style={{
                                                position: 'absolute',
                                                top: -5,
                                                left: -5,
                                                width: '200%',
                                                height: '200%',
                                                cursor: 'pointer',
                                                border: 'none',
                                                opacity: 0
                                            }}
                                        />
                                    </Box>
                                    <TextField
                                        fullWidth
                                        label={field.label}
                                        value={formData[field.key] || ''}
                                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                        error={!!errors[field.key]}
                                        helperText={errors[field.key]}
                                        disabled={loading}
                                        InputProps={{
                                            sx: { borderRadius: '10px', fontSize: '1.4rem', height: '48px', fontFamily: 'monospace', fontWeight: 600 }
                                        }}
                                        InputLabelProps={{ sx: { fontSize: '1.4rem' } }}
                                    />
                                </Box>
                            ) : (
                                <TextField
                                    fullWidth
                                    label={field.label}
                                    placeholder={field.placeholder}
                                    value={formData[field.key] || ''}
                                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                    error={!!errors[field.key]}
                                    helperText={errors[field.key]}
                                    disabled={loading}
                                    multiline={field.type === 'multiline'}
                                    rows={field.type === 'multiline' ? 4 : 1}
                                    InputProps={{
                                        sx: { 
                                            borderRadius: '10px', 
                                            fontSize: '1.4rem',
                                            padding: field.type === 'multiline' ? '12px 14px' : '0 14px',
                                            height: field.type === 'multiline' ? 'auto' : '48px'
                                        }
                                    }}
                                    InputLabelProps={{
                                        sx: { fontSize: '1.4rem' }
                                    }}
                                    FormHelperTextProps={{
                                        sx: { fontSize: '1.3rem' }
                                    }}
                                />
                            )}
                        </Box>
                    ))}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 0, pt: 3, pb: 0 }}>
                <Button 
                    onClick={onClose} 
                    disabled={loading} 
                    sx={{ 
                        fontSize: '1.4rem',
                        fontWeight: 600,
                        px: 3,
                        height: '40px',
                        borderRadius: '10px',
                        textTransform: 'none',
                        color: '#637381',
                        '&:hover': { backgroundColor: 'rgba(145, 158, 171, 0.08)' }
                    }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={loading}
                    sx={{
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        px: 4,
                        height: '40px',
                        borderRadius: '10px',
                        textTransform: 'none',
                        bgcolor: '#1C252E',
                        boxShadow: 'none',
                        '&:hover': { 
                            bgcolor: '#454F5B',
                        },
                        '&.Mui-disabled': {
                            bgcolor: '#919EAB33',
                            color: '#919EAB80'
                        }
                    }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : saveLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
