import { Box, ButtonBase, FormHelperText, Stack, Typography, CircularProgress } from "@mui/material";
import { UploadFileIcon, UploadIcon } from "../../assets/icons";
import { useDropzone } from "react-dropzone";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { uploadImagesToCloudinary } from "../../api/uploadCloudinary.api";
import { toast } from "react-toastify";
import { ImageLightbox } from "../ui/ImageLightbox";

interface CustomFile extends File {
    preview: string;
}

interface UploadSingleFileProps {
    value?: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    error?: string;
    /** Nhãn hiển thị phía trên (mặc định: "Hình ảnh") */
    title?: string;
    /** Chế độ nhỏ gọn: nút/ô nhỏ thay vì vùng kéo thả lớn */
    compact?: boolean;
    /** Folder trên Cloudinary */
    folder?: string;
}

export const UploadSingleFile = memo(
    ({ value, onChange, disabled, error, title = "Hình ảnh", compact = false, folder = 'teddypet' }: UploadSingleFileProps) => {
        const [localFile, setLocalFile] = useState<CustomFile | null>(null);
        const [isUploading, setIsUploading] = useState(false);

        const fileRef = useRef<CustomFile | null>(null);

        useEffect(() => {
            fileRef.current = localFile;
        }, [localFile]);

        const handleUpload = async (file: File) => {
            try {
                setIsUploading(true);
                const [url] = await uploadImagesToCloudinary([file], folder);
                onChange(url);
                setLocalFile(null);
                toast.success("Tải ảnh lên thành công!");
            } catch (err: any) {
                toast.error(err.message || "Tải ảnh lên thất bại!");
                setLocalFile(null);
            } finally {
                setIsUploading(false);
            }
        };

        const onDrop = useCallback((acceptedFiles: File[]) => {
            if (!acceptedFiles.length) return;

            const file = acceptedFiles[0] as CustomFile;
            file.preview = URL.createObjectURL(file);

            setLocalFile(file);
            // Automatic upload right after dropping
            handleUpload(file);
        }, [folder, onChange]);

        const { getRootProps, getInputProps, isDragActive } = useDropzone({
            accept: { "image/*": [] },
            multiple: false,
            onDrop,
            disabled: disabled || isUploading,
        });

        const handleRemove = useCallback(() => {
            if (localFile?.preview) {
                URL.revokeObjectURL(localFile.preview);
            }
            setLocalFile(null);
            onChange("");
        }, [localFile, onChange]);

        useEffect(() => {
            return () => {
                if (fileRef.current?.preview) {
                    URL.revokeObjectURL(fileRef.current.preview);
                }
            };
        }, []);

        useEffect(() => {
            if (!value) {
                setLocalFile(null);
            }
        }, [value]);

        const [lightboxOpen, setLightboxOpen] = useState(false);

        const renderThumb = () => {
            const src = localFile?.preview || value;
            if (!src) return null;

            const isUploaded = Boolean(value && !localFile);

            return (
                <li className="inline-flex">
                    <span 
                        className="inline-flex relative items-center justify-center rounded-[10px] w-[80px] h-[80px] border border-[#919eab29] cursor-pointer"
                        onClick={() => setLightboxOpen(true)}
                    >
                        <Box
                            component="img"
                            src={src}
                            sx={{ 
                                width: 1, 
                                height: 1, 
                                objectFit: "cover", 
                                borderRadius: "10px",
                                opacity: isUploading ? 0.4 : 1 
                            }}
                        />

                        {isUploading && (
                            <Box sx={{ position: 'absolute', display: 'flex' }}>
                                <CircularProgress size={24} sx={{ color: '#1C252E' }} />
                            </Box>
                        )}

                        {!isUploading && (
                            <ButtonBase
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove();
                                }}
                                sx={{
                                    position: "absolute",
                                    top: 4,
                                    right: 4,
                                    color: "#fff",
                                    bgcolor: "#141a217a",
                                    borderRadius: "50%",
                                    padding: "4px",
                                    "&:hover": { bgcolor: "#FF5630" },
                                }}
                            >
                                <svg width="0.75rem" height="0.75rem" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="m12 13.414l5.657 5.657a1 1 0 0 0 1.414-1.414L13.414 12l5.657-5.657a1 1 0 0 0-1.414-1.414L12 10.586L6.343 4.929A1 1 0 0 0 4.93 6.343L10.586 12l-5.657 5.657a1 1 0 1 0 1.414 1.414z" />
                                </svg>
                            </ButtonBase>
                        )}

                        {isUploaded && !isUploading && (
                            <Box sx={{
                                position: 'absolute', bottom: 2, right: 2,
                                bgcolor: '#00A76F', borderRadius: '50%',
                                width: 14, height: 14, border: '2px solid #fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <svg width="8" height="8" viewBox="0 0 24 24">
                                    <path fill="#fff" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                </svg>
                            </Box>
                        )}
                    </span>
                </li>
            );
        };

        const dropzoneContent = compact ? (
            <div
                {...getRootProps()}
                className={`w-[72px] h-[72px] border-2 border-dashed border-[#919eab52] bg-[#919eab0d] flex items-center justify-center cursor-pointer rounded-[8px] hover:border-[#00A76F] hover:bg-[#00a76f0d] transition-colors ${isDragActive ? "border-[#00A76F] bg-[#00a76f14]" : ""} ${(disabled || isUploading) ? "opacity-50 cursor-not-allowed" : ""}`}
            >
                <input {...getInputProps()} />
                <UploadIcon sx={{ fontSize: 28, color: "#637381" }} />
            </div>
        ) : (
            <div
                {...getRootProps()}
                className={`min-h-[280px] border border-[#919eab33] bg-[#919eab14] flex items-center justify-center cursor-pointer relative outline-none overflow-hidden p-[24px] rounded-[8px] hover:opacity-[0.72] transition-opacity duration-300 ease-linear ${isDragActive && "opacity-[0.72]"} ${(disabled || isUploading) ? "opacity-50 cursor-not-allowed" : ""}`}
            >
                <input {...getInputProps()} />
                <div className="w-full flex items-center justify-center flex-col">
                    <UploadFileIcon />
                    <div className="flex flex-col gap-[8px] text-center">
                        <div className="text-[1.125rem] font-[600]">Kéo thả hoặc chọn tệp</div>
                        <div className="text-[0.875rem] text-[#637381]">
                            Kéo tệp vào đây, hoặc <span className="underline text-[#00A76F]">chọn tệp</span>
                        </div>
                    </div>
                </div>
            </div>
        );

        return (
            <Stack>
                <Typography variant="h6" sx={{ fontSize: "0.875rem", fontWeight: 600, mb: "12px" }}>
                    {title}
                </Typography>

                {compact ? (
                    <Stack direction="row" alignItems="flex-start" spacing={2} flexWrap="wrap" sx={{ gap: 2 }}>
                        {dropzoneContent}
                        {(localFile || value) && (
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                <ul className="flex gap-[12px] flex-wrap list-none p-0 m-0">{renderThumb()}</ul>
                                {isUploading && (
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                        Đang tải lên...
                                    </Typography>
                                )}
                            </Stack>
                        )}
                    </Stack>
                ) : (
                    <>
                        {dropzoneContent}
                        {(localFile || value) && (
                            <Box sx={{ my: 3 }}>
                                <ul className="flex gap-[12px] flex-wrap list-none p-0 m-0">{renderThumb()}</ul>
                                {isUploading && (
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mt: 1, display: 'block' }}>
                                        Hệ thống đang tải ảnh lên Cloudinary, vui lòng chờ...
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </>
                )}

                {error && (
                    <FormHelperText error>{error}</FormHelperText>
                )}

                {(() => {
                    const currentImage = localFile?.preview || value;
                    return (
                        <ImageLightbox 
                            open={lightboxOpen}
                            onClose={() => setLightboxOpen(false)}
                            images={currentImage ? [currentImage] : []}
                        />
                    );
                })()}
            </Stack>
        );
    }
);
