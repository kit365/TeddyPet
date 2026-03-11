import {
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    Button,
    IconButton,
    Box,
    CircularProgress,
    Typography,
    Tooltip,
    List,
    ListItem
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Menu, MenuItem, Stack, Chip } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon, ArrowDropDown as ArrowDropDownIcon, FileDownload as FileDownloadIcon, FileUpload as FileUploadIcon, SimCardDownload as SimCardDownloadIcon, Description as DescriptionIcon } from "@mui/icons-material";
import { useProductTags, useCreateProductTag, useUpdateProductTag, useDeleteProductTag, useDownloadTagsTemplate, useExportTagsExcel, useImportTagsExcel } from "../hooks/useProduct";
import { toast } from "react-toastify";
import { ImportExcelModal } from "./ImportExcelModal";

interface ProductTagDialogProps {
    open: boolean;
    onClose: () => void;
}

export const ProductTagDialog = ({ open, onClose }: ProductTagDialogProps) => {
    const { t } = useTranslation();
    const [tagName, setTagName] = useState("");
    const [tagDesc, setTagDesc] = useState("");
    const [tagColor, setTagColor] = useState("#00B8D9");
    const [editingTagId, setEditingTagId] = useState<number | string | null>(null);

    // Hooks
    const { data: tags = [], isLoading } = useProductTags();
    const { mutate: createTag, isPending: isCreating } = useCreateProductTag();
    const { mutate: updateTag, isPending: isUpdating } = useUpdateProductTag();
    const { mutate: deleteTag } = useDeleteProductTag();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const importMutation = useImportTagsExcel();
    const exportMutation = useExportTagsExcel();
    const templateMutation = useDownloadTagsTemplate();

    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleSave = () => {
        if (!tagName.trim()) return;

        const data = {
            name: tagName,
            description: tagDesc,
            color: tagColor
        };

        if (editingTagId) {
            updateTag({ id: editingTagId, data }, {
                onSuccess: (res) => {
                    if (res.success) {
                        toast.success("Cập nhật tag thành công");
                        resetForm();
                    } else {
                        toast.error(res.message || "Lỗi khi cập nhật");
                    }
                }
            });
        } else {
            createTag(data, {
                onSuccess: (res) => {
                    if (res.success) {
                        toast.success("Tạo tag thành công");
                        resetForm();
                    } else {
                        toast.error(res.message || "Lỗi khi tạo");
                    }
                }
            });
        }
    };

    const resetForm = () => {
        setTagName("");
        setTagDesc("");
        setTagColor("#00B8D9");
        setEditingTagId(null);
    };

    const handleEdit = (tag: any) => {
        setEditingTagId(tag.tagId || tag.id);
        setTagName(tag.name || "");
        setTagDesc(tag.description || "");
        setTagColor(tag.color || "#00B8D9");
    };

    const handleDelete = (id: number | string) => {
        if (confirm(t("admin.product.tags.delete_confirm"))) {
            deleteTag(id, {
                onSuccess: (res) => {
                    if (res.success) {
                        toast.success(t("admin.product.tags.delete_success"));
                    } else {
                        toast.error(res.message || t("admin.product.tags.delete_error"));
                    }
                }
            });
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: "20px",
                    padding: "24px",
                    boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.12)",
                    background: "#FFFFFF",
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '2rem',
                fontWeight: 700,
                color: '#1C252E',
                padding: "0 0 20px 0",
            }}>
                {t("admin.product.tags.title") || "Quản lý tags sản phẩm"}
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={handleMenuClick}
                        endIcon={<ArrowDropDownIcon />}
                        startIcon={
                            (importMutation.isPending || exportMutation.isPending || templateMutation.isPending) ?
                                <CircularProgress size={16} /> : <DescriptionIcon />
                        }
                        sx={{
                            fontSize: '1.3rem',
                            textTransform: 'none',
                            color: '#637381',
                            borderColor: '#919EAB33',
                            borderRadius: '10px',
                            fontWeight: 600,
                            height: '36px',
                            '&:hover': {
                                borderColor: '#1C252E',
                                backgroundColor: 'transparent'
                            }
                        }}
                    >
                        Excel
                    </Button>
                    <Menu
                        anchorEl={anchorEl}
                        open={openMenu}
                        onClose={handleMenuClose}
                    >
                        <MenuItem onClick={() => { handleMenuClose(); importMutation.reset(); setIsImportModalOpen(true); }} sx={{ fontSize: '1.4rem', gap: 1 }}>
                            <FileUploadIcon fontSize="small" /> Nhập Excel
                        </MenuItem>
                        <MenuItem onClick={() => { handleMenuClose(); exportMutation.mutate(); }} sx={{ fontSize: '1.4rem', gap: 1 }}>
                            <FileDownloadIcon fontSize="small" /> Xuất Excel
                        </MenuItem>
                        <MenuItem onClick={() => { handleMenuClose(); templateMutation.mutate(); }} sx={{ fontSize: '1.4rem', gap: 1 }}>
                            <SimCardDownloadIcon fontSize="small" /> Tải Template
                        </MenuItem>
                    </Menu>
                    <Tooltip title={t("admin.common.close")}>
                        <IconButton onClick={onClose} size="small" sx={{ color: '#637381' }}>
                            <CloseIcon sx={{ fontSize: '2rem' }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '500px', p: 0 }}>

                {/* Input Area */}
                <Box sx={{ p: 2, borderBottom: '1px dashed #919EAB48', mb: 1 }}>
                    <Stack gap={2.5}>
                        <TextField
                            fullWidth
                            label="Tên tag"
                            variant="outlined"
                            size="small"
                            value={tagName}
                            onChange={(e) => setTagName(e.target.value.replace(/\s+/g, '_'))}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave();
                            }}
                            InputProps={{
                                sx: { borderRadius: '10px', fontSize: '1.4rem', height: '48px' }
                            }}
                            InputLabelProps={{
                                sx: { fontSize: '1.4rem' }
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Mô tả / Dịch tiếng Việt"
                            multiline
                            rows={2}
                            size="small"
                            value={tagDesc}
                            onChange={(e) => setTagDesc(e.target.value)}
                            InputProps={{
                                sx: { borderRadius: '10px', fontSize: '1.4rem', p: 1.5 }
                            }}
                            InputLabelProps={{
                                sx: { fontSize: '1.4rem' }
                            }}
                        />
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                                <Typography sx={{ fontSize: '1.4rem', color: '#637381', fontWeight: 500 }}>
                                    Màu sắc:
                                </Typography>
                                <Box sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '8px',
                                    backgroundColor: tagColor,
                                    border: '2px solid #fff',
                                    boxShadow: '0 0 0 1px #919EAB33',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <input
                                        type="color"
                                        value={tagColor}
                                        onChange={(e) => setTagColor(e.target.value)}
                                        style={{
                                            position: 'absolute',
                                            top: -5,
                                            left: -5,
                                            width: '200%',
                                            height: '200%',
                                            cursor: 'pointer',
                                            border: 'none',
                                            opacity: 0
                                        }}
                                    />
                                </Box>
                                <Typography sx={{ fontSize: '1.4rem', fontWeight: 600, color: '#212B36', fontFamily: 'monospace' }}>
                                    {tagColor.toUpperCase()}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                {editingTagId && (
                                    <Button
                                        onClick={resetForm}
                                        sx={{
                                            borderRadius: '10px',
                                            textTransform: 'none',
                                            fontSize: '1.4rem',
                                            fontWeight: 600,
                                            color: '#637381',
                                            height: '40px'
                                        }}
                                    >
                                        Hủy
                                    </Button>
                                )}
                                <Button
                                    variant="contained"
                                    onClick={handleSave}
                                    disabled={!tagName.trim() || isCreating || isUpdating}
                                    sx={{
                                        borderRadius: '10px',
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        fontSize: '1.4rem',
                                        px: 3,
                                        height: '40px',
                                        background: '#1C252E',
                                        boxShadow: 'none',
                                        '&:hover': {
                                            background: '#454F5B',
                                        }
                                    }}
                                >
                                    {isCreating || isUpdating ? (
                                        <CircularProgress size={24} color="inherit" />
                                    ) : (
                                        editingTagId ? "Cập nhật" : "Thêm mới"
                                    )}
                                </Button>
                            </Box>
                        </Box>
                    </Stack>
                </Box>

                {/* List Tags */}
                <Box sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
                    {isLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : tags.length === 0 ? (
                        <Typography sx={{ textAlign: 'center', color: '#919EAB', py: 4, fontSize: '1.4rem' }}>
                            {t("admin.product.tags.no_tags")}
                        </Typography>
                    ) : (
                        <List>
                            {tags.map((tag: any) => (
                                <ListItem
                                    key={tag.id || tag.tagId}
                                    secondaryAction={
                                        <Stack direction="row" spacing={0.5}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(tag)}
                                                sx={{ color: '#637381' }}
                                            >
                                                <EditIcon sx={{ fontSize: '1.8rem' }} />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(tag.id || tag.tagId)}
                                                sx={{ color: '#FF5630' }}
                                            >
                                                <DeleteIcon sx={{ fontSize: '1.8rem' }} />
                                            </IconButton>
                                        </Stack>
                                    }
                                    sx={{
                                        borderRadius: '12px',
                                        mb: 1,
                                        px: 1.5,
                                        py: 1,
                                        '&:hover': {
                                            backgroundColor: '#F9FAFB'
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, mr: 2 }}>
                                        <Chip
                                            label={tag.name}
                                            sx={{
                                                backgroundColor: `${tag.color}15`,
                                                color: tag.color,
                                                borderColor: `${tag.color}40`,
                                                fontWeight: 700,
                                                fontSize: '1.3rem',
                                                height: '28px'
                                            }}
                                            variant="outlined"
                                        />
                                        <Typography sx={{ fontSize: '1.3rem', color: '#637381', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {tag.description && tag.description}
                                        </Typography>
                                    </Box>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>

            </DialogContent>
            <ImportExcelModal
                open={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={(file) => importMutation.mutate(file)}
                isPending={importMutation.isPending}
                isSuccess={importMutation.isSuccess}
            />
        </Dialog>
    );
};
