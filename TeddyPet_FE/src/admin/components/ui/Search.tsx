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
                        borderRadius: '8px',
                        fontSize: "1rem",
                        paddingLeft: "14px",
                        paddingRight: "14px",
                    },
                }}
            />
        </Box>
    )
}