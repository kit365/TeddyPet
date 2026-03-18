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
    Chip,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Radio,
    RadioGroup,
    FormControlLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import { useConfirmCreateMissingForProductsImport, usePreviewProductsImport } from '../hooks/useProduct';
import type { DuplicateResolution } from '../../../api/product.api';
import { toast } from 'react-toastify';

export type DuplicateRowPreview = {
    rowNumber: number;
    excelProductName: string;
    excelBarcode: string;
    matchSource: string;
    matchedProductId: number;
    matchedProductName: string;
};

interface ProductImportWizardModalProps {
    open: boolean;
    onClose: () => void;
    onImport: (file: File, duplicateResolutions?: DuplicateResolution[]) => void;
    isPending?: boolean;
    isSuccess?: boolean;
}

export const ProductImportWizardModal = ({
    open,
    onClose,
    onImport,
    isPending = false,
    isSuccess = false,
}: ProductImportWizardModalProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState<'select' | 'review'>('select');
    const [preview, setPreview] = useState<any | null>(null);
    const [dupDecisions, setDupDecisions] = useState<Record<number, 'CREATE_NEW' | 'OVERWRITE'>>({});

    const previewMutation = usePreviewProductsImport();
    const confirmCreateMutation = useConfirmCreateMissingForProductsImport();

    const DRAFT_KEY = 'teddypet:admin:productImportWizard:draft';

    const duplicateRows: DuplicateRowPreview[] = preview?.duplicateRows ?? [];

    useEffect(() => {
        if (isSuccess && open) {
            handleClose();
        }
    }, [isSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!preview?.duplicateRows?.length) {
            setDupDecisions({});
            return;
        }
        const next: Record<number, 'CREATE_NEW' | 'OVERWRITE'> = {};
        (preview.duplicateRows as DuplicateRowPreview[]).forEach((d) => {
            next[d.rowNumber] = 'CREATE_NEW';
        });
        setDupDecisions(next);
    }, [preview]);

    const handleRemoveFile = () => {
        setFile(null);
        setPreview(null);
        setDupDecisions({});
        setStep('select');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const clearDraft = () => {
        try {
            localStorage.removeItem(DRAFT_KEY);
        } catch {
            /* ignore */
        }
    };

    const handleClose = () => {
        if (isPending) return;
        clearDraft();
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
            try {
                localStorage.setItem(DRAFT_KEY, JSON.stringify({ updatedAt: Date.now(), preview: data }));
            } catch {
                /* ignore */
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Không thể preview file import.');
        }
    };

    const buildDuplicateResolutions = (): DuplicateResolution[] | undefined => {
        if (!duplicateRows.length) return undefined;
        return duplicateRows.map((d) => ({
            rowNumber: d.rowNumber,
            decision: dupDecisions[d.rowNumber] ?? 'CREATE_NEW',
        }));
    };

    const handleImport = async () => {
        if (!file || isPending) return;

        if (step === 'select') {
            await runPreview();
            return;
        }

        const missingBrands = preview?.missingBrands || [];
        const missingCategories = preview?.missingCategories || [];
        const missingTags = preview?.missingTags || [];
        const hasMissing = missingBrands.length + missingCategories.length + missingTags.length > 0;

        if (hasMissing && !confirmCreateMutation.isSuccess) {
            try {
                await confirmCreateMutation.mutateAsync(preview);
                toast.success('Đã tạo Brand/Danh mục/Tags mới. Đang tiến hành import sản phẩm...');
            } catch (e: any) {
                toast.error(e?.response?.data?.message || 'Không thể tạo dữ liệu mới.');
                return;
            }
        }

        onImport(file, buildDuplicateResolutions());
    };

    const setAllDup = (decision: 'CREATE_NEW' | 'OVERWRITE') => {
        const next: Record<number, 'CREATE_NEW' | 'OVERWRITE'> = { ...dupDecisions };
        duplicateRows.forEach((d) => {
            next[d.rowNumber] = decision;
        });
        setDupDecisions(next);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const hasDup = duplicateRows.length > 0;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth={hasDup && step === 'review' ? 'md' : 'sm'}
            fullWidth
            PaperProps={{ sx: { borderRadius: '16px', padding: '8px' } }}
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
                        {(isPending || previewMutation.isPending || confirmCreateMutation.isPending) && (
                            <LinearProgress sx={{ height: 6, borderRadius: 3, mt: 1 }} />
                        )}
                    </Box>
                )}

                {step === 'review' && (
                    <Stack spacing={2} sx={{ mt: 3 }}>
                        {hasDup && (
                            <Box sx={{ p: 2, border: '1px solid #ff980040', borderRadius: 2, bgcolor: '#fff8e1' }}>
                                <Typography sx={{ fontWeight: 700, color: '#b45309', fontSize: '0.875rem', mb: 0.5 }}>
                                    Nguy cơ ghi đè nhầm: tên trong file khác sản phẩm hệ thống (PRODUCT_ID / barcode / slug)
                                </Typography>
                                <Typography sx={{ color: '#637381', fontSize: '0.8125rem', mb: 1.5 }}>
                                    File export thường còn <strong>PRODUCT_ID</strong> cũ — sửa tên mà không xóa ID sẽ từng bị
                                    đè lên SP khác. Giờ mặc định <strong>Tạo mới</strong>; chỉ <strong>Ghi đè</strong> khi
                                    bạn chắc đúng SP (kể cả đổi tên có chủ đích).
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                                    <Button size="small" variant="outlined" onClick={() => setAllDup('CREATE_NEW')}>
                                        Tất cả: Tạo mới
                                    </Button>
                                    <Button size="small" variant="outlined" color="warning" onClick={() => setAllDup('OVERWRITE')}>
                                        Tất cả: Ghi đè
                                    </Button>
                                </Stack>
                                <Table size="small" sx={{ bgcolor: '#fff', borderRadius: 1 }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Dòng</TableCell>
                                            <TableCell>Tên trên file</TableCell>
                                            <TableCell>Trùng theo</TableCell>
                                            <TableCell>SP hiện có (#id)</TableCell>
                                            <TableCell align="right">Xử lý</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {duplicateRows.map((d) => (
                                            <TableRow key={d.rowNumber}>
                                                <TableCell>{d.rowNumber}</TableCell>
                                                <TableCell sx={{ maxWidth: 160 }}>{d.excelProductName}</TableCell>
                                                <TableCell>
                                                    {d.matchSource === 'PRODUCT_ID'
                                                        ? 'Cột PRODUCT_ID'
                                                        : d.matchSource === 'BARCODE'
                                                          ? 'Barcode'
                                                          : 'Slug (tên)'}
                                                </TableCell>
                                                <TableCell sx={{ maxWidth: 180 }}>
                                                    #{d.matchedProductId} — {d.matchedProductName}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <RadioGroup
                                                        row
                                                        value={dupDecisions[d.rowNumber] ?? 'CREATE_NEW'}
                                                        onChange={(_, v) =>
                                                            setDupDecisions((prev) => ({
                                                                ...prev,
                                                                [d.rowNumber]: v as 'CREATE_NEW' | 'OVERWRITE',
                                                            }))
                                                        }
                                                    >
                                                        <FormControlLabel
                                                            value="CREATE_NEW"
                                                            control={<Radio size="small" />}
                                                            label="Tạo mới"
                                                        />
                                                        <FormControlLabel
                                                            value="OVERWRITE"
                                                            control={<Radio size="small" color="warning" />}
                                                            label="Ghi đè"
                                                        />
                                                    </RadioGroup>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        )}

                        <Box sx={{ p: 2, border: '1px solid #919eab33', borderRadius: 2, bgcolor: '#fff' }}>
                            <Typography sx={{ fontWeight: 700, color: '#1C252E', fontSize: '0.875rem', mb: 1 }}>
                                Brand / Danh mục / Tags mới
                            </Typography>
                            <Typography sx={{ color: '#637381', fontSize: '0.8125rem', mb: 2 }}>
                                Nếu hệ thống chưa có trong file import, có thể tạo trước khi import.
                            </Typography>

                            <Stack spacing={1.5}>
                                <Box>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', mb: 0.75 }}>Brands mới</Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        {(preview?.missingBrands || []).length === 0 ? (
                                            <Typography sx={{ color: '#919EAB', fontSize: '0.75rem' }}>Không có</Typography>
                                        ) : (
                                            (preview?.missingBrands || []).map((b: string) => (
                                                <Chip key={b} label={b} size="small" />
                                            ))
                                        )}
                                    </Stack>
                                </Box>
                                <Box>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', mb: 0.75 }}>
                                        Danh mục mới
                                    </Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        {(preview?.missingCategories || []).length === 0 ? (
                                            <Typography sx={{ color: '#919EAB', fontSize: '0.75rem' }}>Không có</Typography>
                                        ) : (
                                            (preview?.missingCategories || []).map((c: string) => (
                                                <Chip key={c} label={c} size="small" />
                                            ))
                                        )}
                                    </Stack>
                                </Box>
                                <Box>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', mb: 0.75 }}>Tags mới</Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        {(preview?.missingTags || []).length === 0 ? (
                                            <Typography sx={{ color: '#919EAB', fontSize: '0.75rem' }}>Không có</Typography>
                                        ) : (
                                            (preview?.missingTags || []).map((t: string) => (
                                                <Chip key={t} label={t} size="small" />
                                            ))
                                        )}
                                    </Stack>
                                </Box>
                            </Stack>
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
                    color="primary"
                    disabled={!file || isPending || previewMutation.isPending || confirmCreateMutation.isPending}
                    sx={{ textTransform: 'none', px: 4, fontSize: '0.875rem' }}
                >
                    {isPending
                        ? 'Đang nhập...'
                        : step === 'select'
                          ? previewMutation.isPending
                              ? 'Đang phân tích...'
                              : 'Tiếp tục'
                          : confirmCreateMutation.isPending
                            ? 'Đang tạo...'
                            : 'Tạo & Import'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
