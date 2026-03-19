import React, { useState } from 'react';
import { Box, Button, Menu, MenuItem, Typography, Popover, Stack, Divider } from '@mui/material';
import { Icon } from '@iconify/react';
import dayjs, { Dayjs } from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

export type DateRangeValue = {
    label: string;
    startDate: Dayjs | null;
    endDate: Dayjs | null;
};

interface Props {
    value: DateRangeValue;
    onChange: (value: DateRangeValue) => void;
}

const PRESETS = [
    { label: '7 ngày qua', getValue: () => ({ start: dayjs().subtract(7, 'day'), end: dayjs() }) },
    { label: '30 ngày qua', getValue: () => ({ start: dayjs().subtract(30, 'day'), end: dayjs() }) },
    { label: 'Tháng này', getValue: () => ({ start: dayjs().startOf('month'), end: dayjs() }) },
    { label: 'Tháng trước', getValue: () => ({ start: dayjs().subtract(1, 'month').startOf('month'), end: dayjs().subtract(1, 'month').endOf('month') }) },
    { label: 'Năm nay', getValue: () => ({ start: dayjs().startOf('year'), end: dayjs() }) },
];

export const DashboardDateFilter: React.FC<Props> = ({ value, onChange }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [customAnchorEl, setCustomAnchorEl] = useState<null | HTMLElement>(null);
    
    // Internal state for custom picker
    const [tempStart, setTempStart] = useState<Dayjs | null>(value.startDate || dayjs());
    const [tempEnd, setTempEnd] = useState<Dayjs | null>(value.endDate || dayjs());

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handlePresetSelect = (preset: typeof PRESETS[0]) => {
        const { start, end } = preset.getValue();
        onChange({
            label: preset.label,
            startDate: start,
            endDate: end
        });
        handleClose();
    };

    const handleOpenCustom = () => {
        // Set custom anchor to the main button (anchorEl) before closing the menu
        setCustomAnchorEl(anchorEl);
        handleClose();
    };

    const handleApplyCustom = () => {
        if (tempStart && tempEnd) {
            onChange({
                label: `${tempStart.format('DD/MM/YYYY')} - ${tempEnd.format('DD/MM/YYYY')}`,
                startDate: tempStart,
                endDate: tempEnd
            });
        }
        setCustomAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const customOpen = Boolean(customAnchorEl);

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Thời gian báo cáo:
                </Typography>
                
                <Button
                    variant="outlined"
                    onClick={handleClick}
                    endIcon={<Icon icon={open || customOpen ? "eva:chevron-up-fill" : "eva:chevron-down-fill"} width={20} />}
                    sx={{
                        borderRadius: '12px',
                        borderColor: open || customOpen ? '#00A76F' : 'rgba(145, 158, 171, 0.2)',
                        color: open || customOpen ? '#00A76F' : 'text.primary',
                        fontWeight: 700,
                        px: 2,
                        height: 44,
                        textTransform: 'none',
                        bgcolor: open || customOpen ? 'rgba(0, 167, 111, 0.08)' : 'background.paper',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        '&:hover': {
                            borderColor: '#00A76F',
                            bgcolor: 'rgba(0, 167, 111, 0.08)'
                        }
                    }}
                >
                    {value.label}
                </Button>

                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                >
                    {PRESETS.map((preset) => (
                        <MenuItem
                            key={preset.label}
                            onClick={() => handlePresetSelect(preset)}
                            selected={value.label === preset.label}
                            sx={{
                                borderRadius: '8px',
                                typography: 'body2',
                                fontWeight: value.label === preset.label ? 700 : 400,
                                mb: 0.5
                            }}
                        >
                            {preset.label}
                        </MenuItem>
                    ))}
                    <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                    <MenuItem
                        onClick={handleOpenCustom}
                        sx={{
                            borderRadius: '8px',
                            typography: 'body2',
                            color: '#00A76F',
                            fontWeight: 700,
                            '&:hover': {
                                bgcolor: 'rgba(0, 167, 111, 0.08)'
                            }
                        }}
                    >
                        <Icon icon="eva:calendar-fill" style={{ marginRight: 8 }} />
                        Tùy chỉnh...
                    </MenuItem>
                </Menu>

                <Popover
                    open={Boolean(customAnchorEl)}
                    anchorEl={customAnchorEl}
                    onClose={() => setCustomAnchorEl(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>Khoảng thời gian tùy chỉnh</Typography>
                    <Stack spacing={2.5}>
                        <DatePicker
                            label="Từ ngày"
                            value={tempStart}
                            onChange={(newValue) => setTempStart(newValue)}
                            slotProps={{ textField: { fullWidth: true, size: 'medium' } }}
                        />
                        <DatePicker
                            label="Đến ngày"
                            value={tempEnd}
                            onChange={(newValue) => setTempEnd(newValue)}
                            slotProps={{ textField: { fullWidth: true, size: 'medium' } }}
                        />
                        <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
                            <Button 
                                fullWidth 
                                variant="outlined" 
                                color="inherit"
                                onClick={() => setCustomAnchorEl(null)}
                                sx={{ borderRadius: '10px' }}
                            >
                                Hủy
                            </Button>
                            <Button 
                                fullWidth 
                                variant="contained" 
                                onClick={handleApplyCustom}
                                sx={{ 
                                    borderRadius: '10px', 
                                    bgcolor: '#00A76F',
                                    '&:hover': { bgcolor: '#008b5f' },
                                    boxShadow: '0 8px 16px rgba(0, 167, 111, 0.24)',
                                    fontWeight: 700
                                }}
                            >
                                Áp dụng
                            </Button>
                        </Box>
                    </Stack>
                </Popover>
            </Box>
        </LocalizationProvider>
    );
};
