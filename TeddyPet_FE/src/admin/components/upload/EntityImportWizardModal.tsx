import { useEffect, useRef, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    IconButton,
    LinearProgress,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';

export type EntityPreviewRow = {
    rowNumber: number;
    name: string;
    action: 'CREATE_NEW' | 'UPDATE_EXISTING' | 'ERROR';
    message: string;
};

interface EntityImportWizardModalProps {
    open: boolean;
    onClose: () => void;
    onImport: (file: File) => void;
    previewMutation: any;
    isPending?: boolean;
    isSuccess?: boolean;
    entityName: string; // e.g. 'Thương hiệu', 'Danh mục'
}

export const EntityImportWizardModal = ({
    open,
    onClose,
    onImport,
    previewMutation,
    isPending = false,
    isSuccess = false,
    entityName,
}: EntityImportWizardModalProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState<'select' | 'review'>('select');
    const [preview, setPreview] = useState<EntityPreviewRow[]>([]);

    useEffect(() => {
        if (isSuccess && open) {
            handleClose();
        }
    }, [isSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleRemoveFile = () => {
        setFile(null);
        setPreview([]);
        setStep('select');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleClose = () => {
        if (isPending) return;
        handleRemoveFile();
        onClose();
    };

    const runPreview = async () => {
        if (!file) return;
        try {
            const res: any = await previewMutation.mutateAsync(file);
            const data = res?.data ?? res;
            setPreview(data);
            setStep('review');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || `Không thể kiểm tra file ${entityName.toLowerCase()} import.`);
        }
    };

    const handleImport = async () => {
        if (!file || isPending) return;

        if (step === 'select') {
            await runPreview();
            return;
        }

        // Check if there are critical errors
        const hasErrors = preview.some((r) => r.action === 'ERROR');
        if (hasErrors) {
            toast.error('File chứa dòng báo lỗi. Vui lòng sửa file trước khi import.');
            return;
        }

        onImport(file);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const hasErrors = preview.some((r) => r.action === 'ERROR');

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth={step === 'review' ? 'md' : 'sm'}
            fullWidth
            PaperProps={{ sx: { borderRadius: '16px', padding: '8px' } }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#212B36', fontSize: '1.125rem' }}>
                        Nhập File Excel {entityName}
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
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />

                {step === 'select' && (
                    <Box
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            const droppedFile = e.dataTransfer.files[0];
                            if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')))
                                setFile(droppedFile);
                        }}
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
                            },
                        }}
                    >
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                            <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                        </Box>
                        <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600, mb: 1, color: '#212B36', fontSize: '0.9375rem' }}
                        >
                            Bấm để tải lên hoặc kéo thả vào đây
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#637381',
                                display: 'flex',
                                justifyContent: 'space-between',
                                mt: 4,
                                fontSize: '0.8125rem',
                            }}
                        >
                            <span>Chỉ hỗ trợ file .xlsx, .xls</span>
                            <span>Tối đa 20MB</span>
                        </Typography>
                    </Box>
                )}

                {file && (
                    <Box sx={{ mt: 3, p: 2, border: '1px solid #919eab52', borderRadius: '12px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <InsertDriveFileIcon sx={{ color: 'primary.main', mr: 2, fontSize: 32 }} />
                            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                                <Typography
                                    variant="subtitle2"
                                    noWrap
                                    sx={{ fontWeight: 600, color: '#212B36', fontSize: '0.875rem' }}
                                >
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
                        {(isPending || previewMutation.isPending) && (
                            <LinearProgress sx={{ height: 6, borderRadius: 3, mt: 1 }} />
                        )}
                    </Box>
                )}

                {step === 'review' && preview.length > 0 && (
                    <Stack spacing={2} sx={{ mt: 3 }}>
                        <Box sx={{ p: 2, border: '1px solid #919eab33', borderRadius: 2, bgcolor: '#f4f6f8' }}>
                            <Typography sx={{ fontWeight: 700, color: '#212B36', fontSize: '0.9375rem', mb: 1.5 }}>
                                Preview Kết Quả Import
                            </Typography>
                            <Box sx={{ maxHeight: 400, overflow: 'auto', borderRadius: 1, border: '1px solid #919eab29' }}>
                                <Table size="small" sx={{ bgcolor: '#fff' }} stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Dòng</TableCell>
                                            <TableCell>Tên trên file</TableCell>
                                            <TableCell>Hành động</TableCell>
                                            <TableCell>Ghi chú</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {preview.map((row) => (
                                            <TableRow key={row.rowNumber} sx={{ bgcolor: row.action === 'ERROR' ? '#ffeeed' : 'inherit' }}>
                                                <TableCell>{row.rowNumber}</TableCell>
                                                <TableCell>{row.name}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        label={
                                                            row.action === 'CREATE_NEW'
                                                                ? 'Tạo mới'
                                                                : row.action === 'UPDATE_EXISTING'
                                                                ? 'Cập nhật'
                                                                : 'Lỗi'
                                                        }
                                                        color={
                                                            row.action === 'CREATE_NEW'
                                                                ? 'success'
                                                                : row.action === 'UPDATE_EXISTING'
                                                                ? 'info'
                                                                : 'error'
                                                        }
                                                        variant="filled"
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ color: row.action === 'ERROR' ? 'error.main' : 'text.secondary' }}>
                                                    {row.message}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        </Box>
                    </Stack>
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
                    color={hasErrors ? "error" : "primary"}
                    disabled={!file || isPending || previewMutation.isPending || (step === 'review' && hasErrors)}
                    sx={{ textTransform: 'none', px: 4, fontSize: '0.875rem' }}
                >
                    {isPending
                        ? 'Đang nhập...'
                        : step === 'select'
                          ? previewMutation.isPending
                              ? 'Đang kiểm tra...'
                              : 'Tiếp tục'
                          : 'Xác nhận Import'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
