import { SxProps, Theme } from '@mui/material/styles';
import { COLORS } from './constants';

export const dataGridStyles: SxProps<Theme> = {
    color: COLORS.primary,
    border: 'none',
    '& .MuiDataGrid-main': {
        border: 'none',
    },

    // HEADER
    '& .MuiDataGrid-columnHeaders': {
        borderRadius: "0",
        position: 'sticky',
        top: 0,
        zIndex: 3,
        background: COLORS.backgroundLight,
        borderBottom: `1px solid ${COLORS.border}`,
        '& .MuiDataGrid-columnHeader': {
            color: COLORS.secondary,
            fontSize: "1.3rem",
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            '&:focus': {
                outline: 'none',
            },
            '&:focus-within': {
                outline: 'none',
            },
        },
    },

    // Footer
    '& .MuiDataGrid-footerContainer': {
        borderTop: `1px dashed ${COLORS.border}`,
        minHeight: "48px",
        fontSize: "1.4rem",
        color: "inherit",
        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            fontSize: "1.3rem",
            fontWeight: 600,
            color: COLORS.secondary
        }
    },

    // ROW
    '& .MuiDataGrid-row': {
        '&:hover': {
            backgroundColor: 'rgba(145, 158, 171, 0.08)',
        },
        '&.Mui-selected': {
            backgroundColor: 'rgba(0, 167, 111, 0.08)',
            '&:hover': {
                backgroundColor: 'rgba(0, 167, 111, 0.16)',
            }
        }
    },

    // CELL
    '& .MuiDataGrid-cell': {
        color: 'inherit',
        fontSize: "1.4rem",
        display: 'flex',
        alignItems: 'center',
        padding: '16px',
        borderBottom: `1px solid ${COLORS.border}`,
        '&:focus': {
            outline: 'none',
        },
        '&:focus-within': {
            outline: 'none',
        },
    },

    '& .MuiDataGrid-withBorderColor': {
        borderColor: COLORS.border
    },

    '& .MuiDataGrid-virtualScrollerContent': {
        minHeight: '200px !important'
    },

    borderWidth: 0,
};

// DataGrid Card
export const dataGridCardStyles = {
    background: COLORS.background,
    color: COLORS.primary,
    borderRadius: '16px',
    height: '600px',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: COLORS.shadow,
    overflow: 'hidden'
};

export const dataGridContainerStyles = {
    width: '100%',
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden' as const,
};
