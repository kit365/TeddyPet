import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';


interface SearchProps {
    maxWidth?: string | number;
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
}

export const Search = ({ maxWidth = 260, placeholder, value, onChange }: SearchProps) => {
    const { t } = useTranslation();
    const displayPlaceholder = placeholder || t("admin.common.search");

    return (
        <Box sx={{ width: '100%', maxWidth: maxWidth }}>
            <TextField
                fullWidth
                variant="outlined"
                placeholder={displayPlaceholder}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <Icon icon="eva:search-fill" width="20" height="20" color="#637381" />
                            </InputAdornment>
                        ),
                    },
                }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        fontSize: "0.9375rem",
                        paddingLeft: "14px",
                        paddingRight: "14px",
                        height: '44px',
                        backgroundColor: 'white',
                        border: '1px solid rgba(145, 158, 171, 0.2)',
                        transition: 'all 0.2s ease',
                        '& fieldset': { border: 'none' },
                        '&:hover': {
                            backgroundColor: '#F9FAFB',
                            borderColor: 'rgba(145, 158, 171, 0.44)',
                        },
                        '&.Mui-focused': {
                            backgroundColor: 'white',
                            boxShadow: '0 0 0 3px rgba(28, 37, 46, 0.05)',
                            borderColor: '#1C252E',
                        },
                    },
                }}
            />
        </Box>
    )
}