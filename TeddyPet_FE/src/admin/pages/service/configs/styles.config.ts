import { COLORS } from './constants';
import { SxProps, Theme } from '@mui/material';

export const dataGridCardStyles = {
    background: COLORS.background,
    color: COLORS.primary,
    borderRadius: '16px',
    height: '640px',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: COLORS.shadow,
};

export const dataGridContainerStyles = {
    width: '100%',
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden' as const,
};

export const dataGridStyles: SxProps<Theme> = {
    color: COLORS.primary,
    '& .MuiDataGrid-columnHeaders': {
        borderRadius: '0',
        position: 'sticky',
        top: 70,
        zIndex: 3,
        background: COLORS.backgroundLight,
        '& .MuiDataGrid-columnHeader': {
            color: COLORS.secondary,
            fontSize: '0.875rem',
            border: 'none',
            borderBottom: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.backgroundLight,
        },
        '& .MuiDataGrid-columnHeader--withRightBorder': {
            borderRight: `1px solid ${COLORS.border}`,
        },
    },
    '& .MuiDataGrid-footerContainer': {
        borderTop: '1px dashed',
        minHeight: 'auto',
        fontSize: '0.9375rem',
        color: 'inherit',
        display: 'flex',
        alignItems: 'center',
        '& .MuiTablePagination-root': {
            alignItems: 'center',
        },
        '& .MuiTablePagination-selectLabel': {
            fontSize: '0.9375rem',
            color: 'inherit',
            lineHeight: 1.5,
            marginBottom: 0,
        },
        '& .MuiSelect-select': {
            fontSize: '0.9375rem',
            lineHeight: 1.5,
            paddingTop: 0,
            paddingBottom: 0,
            display: 'flex',
            alignItems: 'center',
        },
        '& .MuiTablePagination-displayedRows': {
            fontSize: '0.9375rem',
            color: 'inherit',
            lineHeight: 1.5,
        },
    },
    '& .MuiDataGrid-cell': {
        color: 'inherit',
        fontSize: '0.875rem',
        display: 'flex',
        alignItems: 'center',
        borderRightStyle: 'dashed',
    },
    '& .MuiDataGrid-withBorderColor': {
        borderColor: COLORS.border,
    },
    '& .MuiDataGrid-toolbarContainer': {
        color: 'inherit',
        position: 'sticky',
        top: 0,
        zIndex: 4,
        background: COLORS.background,
    },
    '& .MuiCheckbox-root': {
        '&.Mui-checked .MuiSvgIcon-root': { color: COLORS.success },
        '& .MuiSvgIcon-root': { color: COLORS.secondary },
    },
    '& .MuiDataGrid-actionsCell .MuiIconButton-root': { color: '#637381' },
    '& .MuiDataGrid-actionsCell .MuiSvgIcon-root': { fontSize: '1.25rem' },
    '&.MuiDataGrid-root': {
        '--DataGrid-t-color-interactive-focus': COLORS.success,
        '--DataGrid-t-color-border-base': COLORS.border,
        overflow: 'auto',
    },
    borderWidth: '0',
};
