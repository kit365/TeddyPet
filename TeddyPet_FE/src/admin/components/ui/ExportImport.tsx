import { Menu, MenuItem, Button, CircularProgress } from "@mui/material";
import { useRef, useState } from "react";
import ImportExportIcon from '@mui/icons-material/ImportExport';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DescriptionIcon from '@mui/icons-material/Description';

interface ExportImportProps {
    onExport?: () => void;
    onImport?: () => void;
    onDownloadTemplate?: () => void;
    isExporting?: boolean;
    isDownloadingTemplate?: boolean;
}

export const ExportImport = ({
    onExport,
    onImport,
    onDownloadTemplate,
    isExporting = false,
    isDownloadingTemplate = false,
}: ExportImportProps) => {
    const [open, setOpen] = useState(false);
    const anchorRef = useRef<HTMLButtonElement>(null);

    return (
        <>
            <Button
                ref={anchorRef}
                onClick={() => setOpen(true)}
                startIcon={<ImportExportIcon sx={{ fontSize: '1.125rem !important' }} />}
                endIcon={<KeyboardArrowDownIcon sx={{ fontSize: '1rem !important' }} />}
                sx={{
                    backgroundColor: '#fff',
                    color: '#1C252E',
                    border: '1px solid #919eab33',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    px: 2,
                    minHeight: '40px',
                    borderRadius: '10px',
                    textTransform: 'none',
                    boxShadow: 'none',
                    whiteSpace: 'nowrap',
                    '&:hover': {
                        backgroundColor: '#F4F6F8',
                        borderColor: '#919eab52',
                        boxShadow: 'none',
                    },
                }}
            >
                Nhập / Xuất
            </Button>

            <Menu
                anchorEl={anchorRef.current}
                open={open}
                onClose={() => setOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                    paper: {
                        sx: {
                            minWidth: 200,
                            borderRadius: '12px',
                            mt: 1,
                            boxShadow: '0 12px 24px -4px rgba(145, 158, 171, 0.12), 0 0 2px 0 rgba(145, 158, 171, 0.2)',
                        }
                    }
                }}
            >
                {onExport && (
                    <MenuItem
                        onClick={() => { onExport(); setOpen(false); }}
                        disabled={isExporting}
                        sx={{ gap: '12px', py: 1.5, fontSize: '0.8125rem', fontWeight: 600 }}
                    >
                        {isExporting ? <CircularProgress size={20} /> : <FileDownloadIcon sx={{ fontSize: '1.25rem', color: '#637381' }} />}
                        Xuất Excel
                    </MenuItem>
                )}
                {onImport && (
                    <MenuItem
                        onClick={() => { onImport(); setOpen(false); }}
                        sx={{ gap: '12px', py: 1.5, fontSize: '0.8125rem', fontWeight: 600 }}
                    >
                        <FileUploadIcon sx={{ fontSize: '1.25rem', color: '#637381' }} />
                        Nhập Excel
                    </MenuItem>
                )}
                {onDownloadTemplate && (
                    <MenuItem
                        onClick={() => { onDownloadTemplate(); setOpen(false); }}
                        disabled={isDownloadingTemplate}
                        sx={{ gap: '12px', py: 1.5, fontSize: '0.8125rem', fontWeight: 600 }}
                    >
                        {isDownloadingTemplate ? <CircularProgress size={20} /> : <DescriptionIcon sx={{ fontSize: '1.25rem', color: '#637381' }} />}
                        Tải Template
                    </MenuItem>
                )}
            </Menu>
        </>
    );
};
