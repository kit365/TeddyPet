import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { memo, useState } from 'react';

// Types
export interface Option {
    value: string;
    label: string;
    level?: number;
    parentId?: string;
}

interface SelectMultiProps {
    label: string;
    options: Option[];
    value?: string[];
    onChange?: (value: string[]) => void;
    searchable?: boolean;
    fullWidth?: boolean;
}

// Global premium styles
const LABEL_STYLE = {
    fontSize: "0.875rem",
    color: "rgb(99, 115, 129)",
    // Adjusted to ensure the label sits perfectly in the middle of a 40px container
    transform: 'translate(14px, 10px) scale(1)', 
    "&.MuiInputLabel-shrink": {
        color: "#1C252E",
        fontWeight: 700,
        transform: 'translate(14px, -8px) scale(0.75)', // Correct notch positioning
    },
};

const SELECT_SX = {
    fontSize: "0.875rem",
    borderRadius: "10px",
    bgcolor: 'white',
    height: '40px',
    "& .MuiSelect-select": {
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        py: 0,
        pl: 1.5,
    },
    "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(145, 158, 171, 0.2)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(145, 158, 171, 0.4)",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: "#1C252E",
        borderWidth: "1px",
    },
};

const MENU_PROPS = {
    disableScrollLock: true,
    PaperProps: {
        sx: {
            borderRadius: '12px',
            mt: 0.8,
            boxShadow: '0 12px 24px -4px rgba(145, 158, 171, 0.16), 0 0 2px 0 rgba(145, 158, 171, 0.2)',
            backdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            border: '1px solid rgba(145, 158, 171, 0.12)',
            maxHeight: 450,
        },
    },
};

export const SelectMulti = memo(({ label, options, value: valueProp, onChange, searchable, fullWidth }: SelectMultiProps) => {
    const [internalValues, setInternalValues] = useState<string[]>([]);
    const values = valueProp !== undefined ? valueProp : internalValues;

    const handleChange = (newValues: string[]) => {
        let finalValues = [...newValues];
        const selectedSet = new Set(newValues);
        const added = newValues.filter(val => !values.includes(val));
        
        added.forEach(val => {
            const option = options.find(o => o.value === val);
            if (option?.parentId) {
                let currentParentId: string | undefined = option.parentId;
                while (currentParentId) {
                    if (!selectedSet.has(currentParentId)) {
                        selectedSet.add(currentParentId);
                        finalValues.push(currentParentId);
                    }
                    const parentOpt = options.find(o => o.value === currentParentId);
                    currentParentId = parentOpt?.parentId;
                }
            }
        });

        if (onChange) {
            onChange(finalValues);
        } else {
            setInternalValues(finalValues);
        }
    };

    if (searchable) {
        return (
            <Autocomplete
                multiple
                size="small"
                options={options}
                value={options.filter(opt => values.includes(opt.value))}
                onChange={(_, newValue) => handleChange(newValue.map(v => v.value))}
                getOptionLabel={(option) => option.label}
                disableCloseOnSelect
                renderInput={(params) => (
                    <TextField 
                        {...params} 
                        label={label} 
                        placeholder={values.length === 0 ? `Chọn ${label.toLowerCase()}...` : ''}
                        sx={{
                            minWidth: 220,
                            '& .MuiInputLabel-root': LABEL_STYLE,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '10px',
                                fontSize: '0.875rem',
                                bgcolor: 'white',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                py: 0,
                                '& input': {
                                    height: '100%',
                                    py: 0,
                                },
                                '& fieldset': { borderColor: 'rgba(145, 158, 171, 0.2)' },
                                '&:hover fieldset': { borderColor: 'rgba(145, 158, 171, 0.4)' },
                                '&.Mui-focused fieldset': { borderColor: '#1C252E' }
                            }
                        }}
                    />
                )}
                renderOption={(props, option, { selected }) => (
                    <li {...props} style={{ fontSize: '0.875rem' }}>
                        <Checkbox
                            size="small"
                            checked={selected}
                            sx={{ mr: 1 }}
                        />
                        {option.label}
                    </li>
                )}
                renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                        <Chip
                            {...getTagProps({ index })}
                            key={option.value}
                            label={option.label}
                            size="small"
                            sx={{ borderRadius: '6px', fontWeight: 600, height: 24, fontSize: '0.75rem' }}
                        />
                    ))
                }
                sx={{ width: fullWidth ? '100%' : 'auto', minWidth: 220 }}
            />
        );
    }

    return (
        <FormControl size="small" sx={{ minWidth: 180, width: fullWidth ? '100%' : 'auto' }}>
            <InputLabel sx={LABEL_STYLE}>{label}</InputLabel>
            <Select
                multiple
                value={values}
                label={label}
                onChange={(e) => {
                    const val = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                    handleChange(val as string[]);
                }}
                renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, fontSize: '0.875rem' }}>
                        {options
                            .filter(opt => selected.includes(opt.value))
                            .slice(0, 1) // Only show 1 to keep it clean
                            .map(opt => opt.label)
                            .join(', ')}
                        {selected.length > 1 && ` +${selected.length - 1}`}
                    </Box>
                )}
                sx={SELECT_SX}
                MenuProps={MENU_PROPS}
            >
                {options.map((option) => (
                    <MenuItem 
                        key={option.value} 
                        value={option.value} 
                        sx={{
                            pl: (option.level || 0) * 2 + 1.5,
                            fontSize: '0.875rem',
                            py: 1,
                        }}
                    >
                        <Checkbox
                            size="small"
                            checked={values.includes(option.value)}
                            sx={{ mr: 1 }}
                        />
                        {option.label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
});