import { Box, Button, ButtonBase, FormHelperText, Stack, Typography } from '@mui/material';
import { UploadFileIcon, UploadIcon } from '../../assets/icons';
import { useDropzone } from 'react-dropzone';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { uploadImagesToCloudinary } from '../../api/uploadCloudinary.api';
import { toast } from 'react-toastify';

interface CustomFile extends File {
    preview: string;
}

interface UploadMultiFileProps {
    value?: string[];
    onChange: (value: string[]) => void;
    disabled?: boolean;
    error?: string;
    title?: string;
    compact?: boolean;
}

export const UploadMultiFile = memo(
    ({ value = [], onChange, disabled, error, title = 'Hình ảnh', compact = false }: UploadMultiFileProps) => {
        const [localFiles, setLocalFiles] = useState<CustomFile[]>([]);
        const [isUploading, setIsUploading] = useState(false);

        const fileRef = useRef<CustomFile[] | null>(null);

        useEffect(() => {
            fileRef.current = localFiles;
        }, [localFiles]);

        const onDrop = useCallback((acceptedFiles: File[]) => {
            if (!acceptedFiles.length) return;

            const files = acceptedFiles.map((f) => {
                const file = f as CustomFile;
                file.preview = URL.createObjectURL(file);
                return file;
            });

            setLocalFiles((prev) => [...prev, ...files]);
        }, []);

        const { getRootProps, getInputProps, isDragActive } = useDropzone({
            accept: { 'image/*': [] },
            multiple: true,
            onDrop,
            disabled,
        });

        const handleRemoveLocal = useCallback(
            (index: number) => {
                setLocalFiles((prev) => {
                    const clone = [...prev];
                    const removed = clone.splice(index, 1)[0];
                    if (removed?.preview) URL.revokeObjectURL(removed.preview);
                    return clone;
                });
            },
            []
        );

        const handleRemoveUploaded = useCallback(
            (index: number) => {
                const clone = [...value];
                clone.splice(index, 1);
                onChange(clone);
            },
            [value, onChange]
        );

        const handleUpload = async () => {
            if (!localFiles.length) return;
            try {
                setIsUploading(true);
                const urls = await uploadImagesToCloudinary(localFiles);
                onChange([...value, ...urls]);
                setLocalFiles((prev) => {
                    prev.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
                    return [];
                });
                toast.success('Tải ảnh lên thành công!');
            } catch {
                toast.error('Tải ảnh lên thất bại!');
            } finally {
                setIsUploading(false);
            }
        };

        useEffect(() => {
            return () => {
                fileRef.current?.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
            };
        }, []);

        const renderThumbs = () => {
            const uploaded = value.map((url) => ({ type: 'uploaded' as const, url }));
            const locals = localFiles.map((f) => ({ type: 'local' as const, file: f }));

            const items = [
                ...uploaded.map((item, idx) => (
                    <li key={`uploaded-${idx}`} className="inline-flex">
                        <span className="inline-flex relative items-center justify-center rounded-[10px] w-[80px] h-[80px] border border-[#919eab29]">
                            <Box
                                component="img"
                                src={item.url}
                                sx={{ width: 1, height: 1, objectFit: 'cover', borderRadius: '10px' }}
                            />
                            <ButtonBase
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveUploaded(idx);
                                }}
                                sx={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    color: '#fff',
                                    bgcolor: '#141a217a',
                                    borderRadius: '50%',
                                    padding: '4px',
                                    '&:hover': { bgcolor: '#FF5630' },
                                }}
                            >
                                <svg width="1.2rem" height="1.2rem" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="m12 13.414l5.657 5.657a1 1 0 0 0 1.414-1.414L13.414 12l5.657-5.657a1 1 0 0 0-1.414-1.414L12 10.586L6.343 4.929A1 1 0 0 0 4.93 6.343L10.586 12l-5.657 5.657a1 1 0 1 0 1.414 1.414z"
                                    />
                                </svg>
                            </ButtonBase>
                        </span>
                    </li>
                )),
                ...locals.map((item, idx) => (
                    <li key={`local-${idx}`} className="inline-flex">
                        <span className="inline-flex relative items-center justify-center rounded-[10px] w-[80px] h-[80px] border border-[#919eab29]">
                            <Box
                                component="img"
                                src={item.file.preview}
                                sx={{ width: 1, height: 1, objectFit: 'cover', borderRadius: '10px' }}
                            />
                            <ButtonBase
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveLocal(idx);
                                }}
                                sx={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    color: '#fff',
                                    bgcolor: '#141a217a',
                                    borderRadius: '50%',
                                    padding: '4px',
                                    '&:hover': { bgcolor: '#FF5630' },
                                }}
                            >
                                <svg width="1.2rem" height="1.2rem" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="m12 13.414l5.657 5.657a1 1 0 0 0 1.414-1.414L13.414 12l5.657-5.657a1 1 0 0 0-1.414-1.414L12 10.586L6.343 4.929A1 1 0 0 0 4.93 6.343L10.586 12l-5.657 5.657a1 1 0 1 0 1.414 1.414z"
                                    />
                                </svg>
                            </ButtonBase>
                        </span>
                    </li>
                )),
            ];

            if (!items.length) return null;
            return <ul className="flex gap-[12px] flex-wrap">{items}</ul>;
        };

        const hasPendingLocal = localFiles.length > 0;
        const getErrorMessage = () => {
            if (hasPendingLocal && !value.length) return "Bạn chưa nhấn 'Tải lên' để hoàn tất chọn ảnh";
            return error;
        };

        const dropzoneContent = compact ? (
            <div
                {...getRootProps()}
                className={`w-[72px] h-[72px] border-2 border-dashed border-[#919eab52] bg-[#919eab0d] flex items-center justify-center cursor-pointer rounded-[8px] hover:border-[#00A76F] hover:bg-[#00a76f0d] transition-colors ${isDragActive ? 'border-[#00A76F] bg-[#00a76f14]' : ''}`}
            >
                <input {...getInputProps()} />
                <UploadIcon sx={{ fontSize: 28, color: '#637381' }} />
            </div>
        ) : (
            <div
                {...getRootProps()}
                className={`min-h-[220px] border border-[#919eab33] bg-[#919eab14] flex items-center justify-center cursor-pointer relative outline-none overflow-hidden p-[24px] rounded-[8px] hover:opacity-[0.72] transition-opacity duration-300 ease-linear ${isDragActive && 'opacity-[0.72]'}`}
            >
                <input {...getInputProps()} />
                <div className="w-full flex items-center justify-center flex-col">
                    <UploadFileIcon />
                    <div className="flex flex-col gap-[8px] text-center">
                        <div className="text-[1.8rem] font-[600]">Kéo thả hoặc chọn tệp</div>
                        <div className="text-[1.4rem] text-[#637381]">
                            Kéo tệp vào đây, hoặc <span className="underline text-[#00A76F]">chọn tệp</span>
                        </div>
                    </div>
                </div>
            </div>
        );

        return (
            <Stack>
                <Typography variant="h6" sx={{ fontSize: '1.4rem', fontWeight: 600, mb: '12px' }}>
                    {title}
                </Typography>

                {compact ? (
                    <Stack direction="row" alignItems="flex-start" spacing={2} flexWrap="wrap" sx={{ gap: 2 }}>
                        {dropzoneContent}
                        {(localFiles.length > 0 || value.length > 0) && (
                            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                                {renderThumbs()}
                                {localFiles.length > 0 && (
                                    <Stack direction="row" spacing={1}>
                                        <Button
                                            size="small"
                                            onClick={() => {
                                                localFiles.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
                                                setLocalFiles([]);
                                            }}
                                            sx={{ p: '0px 8px', minHeight: '30px', fontSize: '1.2rem', fontWeight: 700, textTransform: 'none', border: '1px solid #919eab52', borderRadius: '8px', color: '#1C252E', '&:hover': { bgcolor: '#919eab14' } }}
                                        >
                                            Xóa
                                        </Button>
                                        <Button
                                            size="small"
                                            onClick={handleUpload}
                                            startIcon={<UploadIcon />}
                                            disabled={isUploading}
                                            sx={{ p: '4px 8px', minHeight: '30px', fontSize: '1.2rem', fontWeight: 700, textTransform: 'none', color: '#fff', bgcolor: '#1C252E', '&:hover': { bgcolor: '#454F5B' } }}
                                        >
                                            {isUploading ? 'Đang tải...' : 'Tải lên'}
                                        </Button>
                                    </Stack>
                                )}
                            </Stack>
                        )}
                    </Stack>
                ) : (
                    <>
                        {dropzoneContent}
                        {(localFiles.length > 0 || value.length > 0) && (
                            <>
                                <Box sx={{ my: 3 }}>{renderThumbs()}</Box>
                                {localFiles.length > 0 && (
                                    <Box sx={{ gap: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            size="small"
                                            onClick={() => {
                                                localFiles.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
                                                setLocalFiles([]);
                                            }}
                                            sx={{ p: '0px 8px', minHeight: '30px', minWidth: '64px', fontSize: '1.2rem', fontWeight: 700, textTransform: 'none', border: '1px solid #919eab52', borderRadius: '8px', color: '#1C252E', '&:hover': { bgcolor: '#919eab14', borderColor: 'currentColor' } }}
                                        >
                                            Xóa ảnh chọn
                                        </Button>
                                        <Button
                                            size="small"
                                            onClick={handleUpload}
                                            startIcon={<UploadIcon />}
                                            sx={{ p: '4px 8px', minHeight: '30px', minWidth: '64px', fontSize: '1.2rem', fontWeight: 700, textTransform: 'none', border: '1px solid #919eab52', borderRadius: '8px', color: '#fff', bgcolor: '#1C252E', '&:hover': { bgcolor: '#454F5B', boxShadow: '0 8px 16px 0 rgba(145 158 171 / 16%)' } }}
                                        >
                                            {isUploading ? 'Đang tải...' : 'Tải lên tất cả'}
                                        </Button>
                                    </Box>
                                )}
                            </>
                        )}
                    </>
                )}

                {(error || hasPendingLocal) && (
                    <FormHelperText error>
                        {getErrorMessage()}
                    </FormHelperText>
                )}
            </Stack>
        );
    }
);

