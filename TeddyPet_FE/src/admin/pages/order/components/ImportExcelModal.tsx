import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, IconButton, LinearProgress, Stack, Link } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { downloadOrderTemplate } from '../../../api/order.api';

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

    const handleImport = () => {
        if (!file || isPending) return;
        onImport(file);
    };

    const handleClose = () => {
        if (isPending) return;
        handleRemoveFile();
        onClose();
    };

    const handleDownloadTemplate = async () => {
        try {
            await downloadOrderTemplate();
        } catch (error) {
            console.error("Lỗi khi tải template:", error);
        }
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
                sx: { borderRadius: '24px', p: 1 }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#1C252E', fontSize: '2.2rem' }}>
                        Nhập đơn hàng từ Excel
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#637381', mt: 0.5, fontSize: '1.4rem' }}>
                        Tải lên danh sách đơn hàng offline hoặc dữ liệu cũ
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} disabled={isPending} sx={{ bgcolor: '#F4F6F8' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pb: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3, p: 2, bgcolor: '#FFF9E6', borderRadius: '12px', border: '1px solid #FFE16A' }}>
                    <FileDownloadIcon sx={{ color: '#B76E00' }} />
                    <Typography sx={{ color: '#7A4100', fontSize: '1.3rem', fontWeight: 600 }}>
                        Chưa có file mẫu?
                        <Link
                            component="button"
                            onClick={handleDownloadTemplate}
                            sx={{ ml: 1, color: '#B76E00', fontWeight: 800, textDecoration: 'underline', cursor: 'pointer' }}
                        >
                            Tải template tại đây
                        </Link>
                    </Typography>
                </Stack>

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
                        borderColor: isDragging ? '#00A76F' : 'rgba(145, 158, 171, 0.2)',
                        borderRadius: '16px',
                        padding: '60px 20px',
                        textAlign: 'center',
                        bgcolor: isDragging ? 'rgba(0, 167, 111, 0.05)' : '#F4F6F8',
                        cursor: isPending ? 'default' : 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                            bgcolor: isPending ? '#F4F6F8' : 'rgba(0, 167, 111, 0.08)',
                            borderColor: isPending ? 'rgba(145, 158, 171, 0.2)' : '#00A76F',
                        }
                    }}
                >
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                        <CloudUploadIcon sx={{ fontSize: 64, color: '#00A76F' }} />
                    </Box>
                    <Typography sx={{ fontWeight: 800, mb: 1, color: '#1C252E', fontSize: '1.8rem' }}>
                        Bấm để chọn file hoặc kéo thả
                    </Typography>
                    <Typography sx={{ color: '#637381', fontSize: '1.4rem' }}>
                        Hỗ trợ định dạng .xlsx, .xls (Tối đa 20MB)
                    </Typography>
                </Box>

                {file && (
                    <Box sx={{ mt: 3, p: 2.5, border: '1px solid rgba(145, 158, 171, 0.2)', borderRadius: '16px', bgcolor: 'white' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ p: 1, bgcolor: 'rgba(0, 167, 111, 0.1)', borderRadius: '10px', mr: 2, display: 'flex' }}>
                                <InsertDriveFileIcon sx={{ color: '#00A76F', fontSize: 24 }} />
                            </Box>
                            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                                <Typography noWrap sx={{ fontWeight: 700, color: '#1C252E', fontSize: '1.5rem' }}>
                                    {file.name}
                                </Typography>
                                <Typography sx={{ color: '#637381', fontSize: '1.2rem', fontWeight: 600 }}>
                                    {formatFileSize(file.size)}
                                </Typography>
                            </Box>
                            <IconButton onClick={handleRemoveFile} disabled={isPending} size="small" sx={{ color: '#FF5630', bgcolor: 'rgba(255, 86, 48, 0.1)' }}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        {isPending && (
                            <Box sx={{ mt: 2 }}>
                                <LinearProgress sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(0, 167, 111, 0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#00A76F' } }} />
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3, gap: 1.5 }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    disabled={isPending}
                    sx={{
                        borderRadius: '12px',
                        color: '#637381',
                        borderColor: '#E5E8EB',
                        textTransform: 'none',
                        px: 4,
                        py: 1,
                        fontSize: '1.4rem',
                        fontWeight: 700
                    }}
                >
                    Hủy bỏ
                </Button>
                <Button
                    onClick={handleImport}
                    variant="contained"
                    disabled={!file || isPending}
                    sx={{
                        borderRadius: '12px',
                        textTransform: 'none',
                        px: 4,
                        py: 1,
                        fontSize: '1.4rem',
                        fontWeight: 800,
                        bgcolor: '#1C252E',
                        boxShadow: '0 8px 16px rgba(28, 37, 46, 0.24)',
                        '&:hover': { bgcolor: '#454F5B' }
                    }}
                >
                    {isPending ? 'Đang xử lý...' : 'Xác nhận nhập'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
