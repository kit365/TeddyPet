import React from 'react';
import {
    Box,
    Drawer,
    Typography,
    IconButton,
    Divider,
    Badge,
    Stack,
    ListItemButton,
    ListItemText,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Refresh from '@mui/icons-material/Refresh';
import Close from '@mui/icons-material/Close';
import Check from '@mui/icons-material/Check';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

interface Event {
    id: string;
    title: string;
    start: string;
    color: string;
    textColor?: string;
    backgroundColor?: string;
}

interface CalendarFiltersDrawerProps {
    open: boolean;
    onClose: () => void;
    events: Event[];
}

const COLORS = [
    '#00a76f',
    '#8e33ff',
    '#00b8d9',
    '#003768',
    '#22c55e',
    '#ffab00',
    '#ff5630',
    '#7a0916',
];

export const CalendarFiltersDrawer: React.FC<CalendarFiltersDrawerProps> = ({
    open,
    onClose,
    events,
}) => {
    const [selectedColors, setSelectedColors] = React.useState<string[]>([]);
    const [startDate, setStartDate] = React.useState<Dayjs | null>(null);
    const [endDate, setEndDate] = React.useState<Dayjs | null>(null);

    const handleToggleColor = (color: string) => {
        const index = selectedColors.indexOf(color);
        if (index === -1) {
            setSelectedColors([...selectedColors, color]);
        } else {
            setSelectedColors(selectedColors.filter((c) => c !== color));
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
            <Drawer
                anchor="right"
                open={open}
                onClose={onClose}
                slotProps={{
                    backdrop: {
                        sx: {
                            backgroundColor: 'transparent',
                        },
                    },
                }}
                PaperProps={{
                    sx: {
                        p: "0px",
                        borderRadius: "0",
                        width: 320,
                        bgcolor: 'background.paper',
                        boxShadow: '-24px 12px 32px -4px rgba(145, 158, 171, 0.16)',
                    },
                }}
            >
                {/* Header */}
                <Box sx={{ py: "16px", pl: "20px", pr: "8px", display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
                        Bộ lọc
                    </Typography>
                    <Box>
                        <IconButton size="medium">
                            <Badge variant="dot" sx={{ '& .MuiBadge-badge': { bgcolor: '#FF5630' } }}>
                                <Refresh sx={{ fontSize: 20, color: '#637381' }} />
                            </Badge>
                        </IconButton>
                        <IconButton size="medium" onClick={onClose}>
                            <Close sx={{ fontSize: 20, color: '#637381' }} />
                        </IconButton>
                    </Box>
                </Box>

                <Divider sx={{ borderStyle: 'dashed', borderColor: 'rgba(145, 158, 171, 0.2)' }} />

                {/* Content */}
                <Box sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': {
                        width: '6px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        bgcolor: 'rgba(145, 158, 171, 0.2)',
                        borderRadius: '10px',
                    },
                    '&::-webkit-scrollbar-track': {
                        bgcolor: 'transparent',
                    },
                }}>
                    {/* Colors Section */}
                    <Box sx={{ p: '24px 20px 0px' }}>
                        <Typography variant="subtitle2" sx={{ mb: '8px', fontWeight: 600, fontSize: '0.8125rem', color: '#1C252E' }}>
                            Màu sắc
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                            {COLORS.map((color) => {
                                const isSelected = selectedColors.includes(color);
                                return (
                                    <Box
                                        key={color}
                                        onClick={() => handleToggleColor(color)}
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                bgcolor: 'rgba(145, 158, 171, 0.08)',
                                            },
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: '50%',
                                                bgcolor: color,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {isSelected && <Check sx={{ fontSize: 14, color: '#fff' }} />}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>

                    {/* Range Section */}
                    <Box sx={{ p: '24px 20px' }}>
                        <Typography variant="subtitle2" sx={{ mb: '12px', fontWeight: 600, fontSize: '0.8125rem', color: '#1C252E' }}>
                            Phạm vi
                        </Typography>
                        <Stack
                            spacing={3}
                            sx={{
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#919eab33 !important',
                                },
                                '& .Mui-focused:not(.Mui-error) .MuiPickersOutlinedInput-notchedOutline': {
                                    borderColor: '#1C252E !important',
                                    borderWidth: '2px !important',
                                }
                            }}
                        >
                            <DatePicker
                                label="Ngày bắt đầu"
                                value={startDate}
                                onChange={(newValue) => setStartDate(newValue)}
                                format="DD/MM/YYYY"
                                dayOfWeekFormatter={(day) => {
                                    const map = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                                    return map[dayjs(day).day()];
                                }}
                                slots={{
                                    openPickerIcon: (props) => <CalendarMonth {...props} sx={{ fontSize: 24, color: '#637381' }} />,
                                    switchViewIcon: (props) => (
                                        <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 15.5a1 1 0 0 1-.71-.29l-4-4a1 1 0 1 1 1.42-1.42L12 13.1l3.3-3.18a1 1 0 1 1 1.38 1.44l-4 3.86a1 1 0 0 1-.68.28" fill="currentColor" />
                                        </svg>
                                    ),
                                }}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        InputLabelProps: {
                                            shrink: true,
                                            sx: { color: '#637381', fontSize: '1rem', fontWeight: 600 }
                                        },
                                        sx: {
                                            '& .MuiPickersOutlinedInput-root': {
                                                fontSize: '0.9375rem',
                                                borderRadius: '8px',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderWidth: '1px',
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderWidth: '2px !important',
                                                    borderColor: '#1C252E !important',
                                                },
                                            },
                                            '& .MuiInputBase-input': {
                                                fontSize: '0.9375rem',
                                                padding: '12px 14px',
                                            },
                                        }
                                    },
                                    popper: {
                                        sx: {
                                            '& .MuiPaper-root': {
                                                borderRadius: '16px',
                                                boxShadow: '0 8px 16px 0 rgba(145, 158, 171, 0.16)',
                                                border: '1px solid rgba(145, 158, 171, 0.12)',
                                                mt: 0,
                                                padding: 0,
                                                bgcolor: '#fff',
                                                backgroundImage: 'none',
                                            },
                                            '& .MuiPickersLayout-root': {
                                                padding: 0,
                                            },
                                            '& .MuiPickersLayout-contentWrapper': {
                                                padding: 0,
                                            },
                                            '& .MuiPickersLayout-actionBar': {
                                                padding: 0,
                                            },
                                            '& .MuiPickersLayout-header': {
                                                padding: 0,
                                            },
                                            '& .MuiPickersDay-root': {
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                '&:hover': {
                                                    bgcolor: '#00a76f14 !important',
                                                }
                                            },
                                            '& .MuiPickersDay-root.Mui-selected': {
                                                bgcolor: '#00A76F !important',
                                                color: '#fff !important',
                                                fontWeight: 500,
                                            },
                                            '& .MuiPickersDay-root.MuiPickersDay-today': {
                                                bgcolor: startDate ? 'transparent !important' : '#00a76f14 !important',
                                            },
                                            '& .MuiDayCalendar-weekDayLabel': {
                                                color: '#637381',
                                                fontSize: '0.75rem',
                                            },
                                            '& .MuiPickersCalendarHeader-label': {
                                                fontSize: '1rem',
                                                fontWeight: 500,
                                            },
                                            '& .MuiPickersCalendarHeader-switchViewIcon': {
                                                fontSize: '24px',
                                                color: '#637381',
                                            },
                                            '& .MuiPickersArrowSwitcher-button .MuiSvgIcon-root': {
                                                fontSize: '24px',
                                            },
                                            '& .MuiYearCalendar-root .MuiYearCalendar-button': {
                                                fontSize: '1rem !important',
                                                fontWeight: '600 !important',
                                            },
                                            '& .MuiYearCalendar-root .MuiYearCalendar-button.Mui-selected': {
                                                bgcolor: '#00A76F !important',
                                                color: '#fff !important',
                                                fontWeight: 500,
                                            },
                                        }
                                    },
                                }}
                            />
                            <DatePicker
                                label="Ngày kết thúc"
                                value={endDate}
                                onChange={(newValue) => setEndDate(newValue)}
                                format="DD/MM/YYYY"
                                dayOfWeekFormatter={(day) => {
                                    const map = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                                    return map[dayjs(day).day()];
                                }}
                                slots={{
                                    openPickerIcon: (props) => <CalendarMonth {...props} sx={{ fontSize: 24, color: '#637381' }} />,
                                    switchViewIcon: (props) => (
                                        <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 15.5a1 1 0 0 1-.71-.29l-4-4a1 1 0 1 1 1.42-1.42L12 13.1l3.3-3.18a1 1 0 1 1 1.38 1.44l-4 3.86a1 1 0 0 1-.68.28" fill="currentColor" />
                                        </svg>
                                    ),
                                }}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        InputLabelProps: {
                                            shrink: true,
                                            sx: { color: '#637381', fontSize: '1rem', fontWeight: 600 }
                                        },
                                        sx: {
                                            '& .MuiPickersOutlinedInput-root': {
                                                fontSize: '0.9375rem',
                                                borderRadius: '8px',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderWidth: '1px',
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderWidth: '2px !important',
                                                    borderColor: '#1C252E !important',
                                                },
                                            },
                                            '& .MuiInputBase-input': {
                                                fontSize: '0.9375rem',
                                                padding: '12px 14px',
                                            },
                                        }
                                    },
                                    popper: {
                                        sx: {
                                            '& .MuiPaper-root': {
                                                borderRadius: '16px',
                                                boxShadow: '0 8px 16px 0 rgba(145, 158, 171, 0.16)',
                                                border: '1px solid rgba(145, 158, 171, 0.12)',
                                                mt: 0,
                                                padding: 0,
                                                bgcolor: '#fff',
                                                backgroundImage: 'none',
                                            },
                                            '& .MuiPickersLayout-root': {
                                                padding: 0,
                                            },
                                            '& .MuiPickersLayout-contentWrapper': {
                                                padding: 0,
                                            },
                                            '& .MuiPickersLayout-actionBar': {
                                                padding: 0,
                                            },
                                            '& .MuiPickersLayout-header': {
                                                padding: 0,
                                            },
                                            '& .MuiPickersDay-root': {
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                '&:hover': {
                                                    bgcolor: '#00a76f14 !important',
                                                }
                                            },
                                            '& .MuiPickersDay-root.Mui-selected': {
                                                bgcolor: '#00A76F !important',
                                                color: '#fff !important',
                                                fontWeight: 500,
                                            },
                                            '& .MuiPickersDay-root.MuiPickersDay-today': {
                                                borderColor: endDate ? 'transparent !important' : '#1C252E !important',
                                                bgcolor: endDate ? 'transparent !important' : '#00a76f14 !important',
                                            },
                                            '& .MuiDayCalendar-weekDayLabel': {
                                                color: '#637381',
                                                fontSize: '0.75rem',
                                            },
                                            '& .MuiPickersCalendarHeader-label': {
                                                fontSize: '1rem',
                                                fontWeight: 500,
                                            },
                                            '& .MuiPickersCalendarHeader-switchViewIcon': {
                                                fontSize: '24px',
                                                color: '#637381',
                                            },
                                            '& .MuiPickersArrowSwitcher-button .MuiSvgIcon-root': {
                                                fontSize: '24px',
                                            },
                                            '& .MuiYearCalendar-root .MuiYearCalendar-button': {
                                                fontSize: '1rem !important',
                                                fontWeight: '600 !important',
                                            },
                                            '& .MuiYearCalendar-root .MuiYearCalendar-button.Mui-selected': {
                                                bgcolor: '#00A76F !important',
                                                color: '#fff !important',
                                                fontWeight: 500,
                                            },
                                        }
                                    },
                                }}
                            />
                        </Stack>
                    </Box>

                    {/* Events Section */}
                    <Box sx={{ pt: '24px' }}>
                        <Typography variant="subtitle2" sx={{ px: '20px', mb: '8px', fontWeight: 600, fontSize: '0.8125rem', color: '#1C252E' }}>
                            Sự kiện ({events.length})
                        </Typography>
                        <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none' }}>
                            {events.map((event) => (
                                <li key={event.id}>
                                    <ListItemButton
                                        sx={{
                                            p: '12px 16px',
                                            borderRadius: 0,
                                            position: 'relative',
                                            margin: "0",
                                            borderBottom: '1px dashed rgba(145, 158, 171, 0.2)',
                                            '&:hover': {
                                                bgcolor: 'rgba(145, 158, 171, 0.08)',
                                            }
                                        }}
                                    >
                                        {/* Triangle Flag */}
                                        <Box
                                            sx={{
                                                top: '16px',
                                                left: 0,
                                                width: 0,
                                                height: 0,
                                                position: 'absolute',
                                                borderRight: '10px solid transparent',
                                                borderTop: `10px solid ${event.color}`,
                                            }}
                                        />
                                        <ListItemText
                                            disableTypography
                                            sx={{ margin: "0" }}
                                            primary={
                                                <Typography variant="caption" sx={{ color: '#919EAB', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
                                                    {dayjs(event.start).format('DD MMM YYYY HH:mm')}
                                                    {event.start.includes('T') && ` - ${dayjs(event.start).add(1, 'hour').format('DD MMM YYYY HH:mm')}`}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="subtitle2" sx={{ color: '#1C252E', fontWeight: 600, fontSize: '0.875rem' }}>
                                                    {event.title}
                                                </Typography>
                                            }
                                        />
                                    </ListItemButton>
                                </li>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </Drawer>
        </LocalizationProvider>
    );
};
