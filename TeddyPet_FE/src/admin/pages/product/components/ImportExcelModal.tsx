import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, IconButton, LinearProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';

interface ImportExcelModalProps {
    open: boolean;
    onClose: () => void;
    onImport: (file: File) => void;
    isPending?: boolean;
    isSuccess?: boolean;
}

export const ImportExcelModal = ({ open, onClose, onImport, isPending = false, isSuccess = false }: ImportExcelModalProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Khi mutation thành công, tự đóng modal SAU khi toast đã fire
    useEffect(() => {
        if (isSuccess && open) {
            handleClose();
        }
    }, [isSuccess]);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
            setFile(droppedFile);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleImport = async () => {
        if (!file || isPending) return;
        onImport(file);
    };

    const handleClose = () => {
        if (isPending) return;
        handleRemoveFile();
        onClose();
    };


    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: '16px', padding: '8px' }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#212B36', fontSize: '1.125rem' }}>
                        Nhập File Excel
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#637381', mt: 0.5, fontSize: '0.875rem' }}>
                        Kéo thả file từ máy tính của bạn
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} disabled={isPending} sx={{ color: '#637381' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pb: 1 }}>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".xlsx, .xls"
                    onChange={handleFileSelect}
                />

                <Box
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !isPending && fileInputRef.current?.click()}
                    sx={{
                        border: '2px dashed',
                        borderColor: isDragging ? 'primary.main' : '#919eab52',
                        borderRadius: '12px',
                        padding: '40px 20px',
                        textAlign: 'center',
                        bgcolor: isDragging ? 'rgba(0, 167, 111, 0.08)' : '#f4f6f8',
                        cursor: isPending ? 'default' : 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                            bgcolor: isPending ? '#f4f6f8' : 'rgba(0, 167, 111, 0.08)',
                            borderColor: isPending ? '#919eab52' : 'primary.main',
                        }
                    }}
                >
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#212B36', fontSize: '0.9375rem' }}>
                        Bấm để tải lên hoặc kéo thả vào đây
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#637381', display: 'flex', justifyContent: 'space-between', mt: 4, fontSize: '0.8125rem' }}>
                        <span>Chỉ hỗ trợ file .xlsx, .xls</span>
                        <span>Tối đa 20MB</span>
                    </Typography>
                </Box>

                {file && (
                    <Box sx={{ mt: 3, p: 2, border: '1px solid #919eab52', borderRadius: '12px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <InsertDriveFileIcon sx={{ color: 'primary.main', mr: 2, fontSize: 32 }} />
                            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                                <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, color: '#212B36', fontSize: '0.875rem' }}>
                                    {file.name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#637381', fontSize: '0.75rem' }}>
                                    {formatFileSize(file.size)}
                                </Typography>
                            </Box>
                            <IconButton onClick={handleRemoveFile} disabled={isPending} size="small" sx={{ color: 'error.main' }}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        {isPending && (
                            <LinearProgress sx={{ height: 6, borderRadius: 3, mt: 1 }} />
                        )}
                    </Box>
                )}

            </DialogContent>

            <DialogActions sx={{ p: '16px 24px' }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    disabled={isPending}
                    sx={{ color: '#1C252E', borderColor: '#919eab52', textTransform: 'none', px: 3, fontSize: '0.875rem' }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleImport}
                    variant="contained"
                    color="primary"
                    disabled={!file || isPending}
                    sx={{ textTransform: 'none', px: 4, fontSize: '0.875rem' }}
                >
                    {isPending ? 'Đang nhập...' : 'Nhập Dữ Liệu'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
