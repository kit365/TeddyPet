import { createTheme, Theme } from '@mui/material';

export const getServiceTheme = (outerTheme: Theme) =>
    createTheme(outerTheme, {
        components: {
            MuiCard: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none !important',
                        backgroundColor: '#fff !important',
                        boxShadow: '0 0 2px 0 #919eab33, 0 12px 24px -4px #919eab1f',
                        borderRadius: '16px',
                        color: '#1C252E',
                    },
                },
            },
            MuiFormLabel: {
                styleOverrides: {
                    root: {
                        color: '#919EAB',
                        fontSize: '0.9375rem',
                        '&.Mui-focused': { color: '#1C252E', fontWeight: '600', fontSize: '0.9375rem' },
                    },
                },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        color: '#1C252E',
                        borderRadius: '8px',
                        fontSize: '0.9375rem',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#919eab33' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1C252E' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1C252E', borderWidth: '2px' },
                    },
                    input: { padding: '16px 14px' },
                },
            },
        },
    });
