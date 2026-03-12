import {
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Box,
    CircularProgress,
    Typography,
    Stack,
    Tooltip
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Delete as DeleteIcon, Edit as EditIcon, Close as CloseIcon, ArrowDropDown as ArrowDropDownIcon, Description as DescriptionIcon, FileUpload as FileUploadIcon, FileDownload as FileDownloadIcon, SimCardDownload as SimCardDownloadIcon } from "@mui/icons-material";
import { useDeleteProductAgeRange, useProductAgeRanges, useDownloadAgeRangesTemplate, useExportAgeRangesExcel, useImportAgeRangesExcel } from "../hooks/useProduct";
import { toast } from "react-toastify";
import { AgeRangeFormDialog } from "./AgeRangeFormDialog";
import { Menu, MenuItem } from "@mui/material";
import { ImportExcelModal } from "./ImportExcelModal";

interface AgeRangeListDialogProps {
    open: boolean;
    onClose: () => void;
}

export const AgeRangeListDialog = ({ open, onClose }: AgeRangeListDialogProps) => {
    const { t } = useTranslation();
    const [formOpen, setFormOpen] = useState(false);
    const [editId, setEditId] = useState<string | number | null>(null);

    const { data: ageRanges = [], isLoading } = useProductAgeRanges();
    const { mutate: deleteAgeRange } = useDeleteProductAgeRange();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const importMutation = useImportAgeRangesExcel();
    const exportMutation = useExportAgeRangesExcel();
    const templateMutation = useDownloadAgeRangesTemplate();

    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleCreate = () => {
        setEditId(null);
        setFormOpen(true);
    };

    const handleEdit = (id: string | number) => {
        setEditId(id);
        setFormOpen(true);
    };

    const handleDelete = (id: string | number) => {
        if (confirm(t("admin.common.confirm_delete"))) {
            deleteAgeRange(id, {
                onSuccess: (res) => {
                    if (res.success) {
                        toast.success(t("admin.product.age_range.delete_success"));
                    } else {
                        toast.error(res.message || t("admin.common.error"));
                    }
                }
            });
        }
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="sm"
                fullWidth
                slotProps={{
                    paper: {
                        sx: { borderRadius: "16px", padding: "16px", minHeight: "400px" }
                    }
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    padding: "8px 8px 16px 8px"
                }}>
                    {t("admin.product.age_range.title")}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
                                fontSize: '0.75rem',
                                textTransform: 'none',
                                color: '#1C252E',
                                borderColor: 'rgba(145, 158, 171, 0.32)',
                                fontWeight: 600,
                                height: '32px',
                            }}
                        >
                            Excel
                        </Button>
                        <Menu
                            anchorEl={anchorEl}
                            open={openMenu}
                            onClose={handleMenuClose}
                        >
                            <MenuItem onClick={() => { handleMenuClose(); importMutation.reset(); setIsImportModalOpen(true); }} sx={{ fontSize: '0.875rem', gap: 1 }}>
                                <FileUploadIcon fontSize="small" /> Nhập Excel
                            </MenuItem>
                            <MenuItem onClick={() => { handleMenuClose(); exportMutation.mutate(); }} sx={{ fontSize: '0.875rem', gap: 1 }}>
                                <FileDownloadIcon fontSize="small" /> Xuất Excel
                            </MenuItem>
                            <MenuItem onClick={() => { handleMenuClose(); templateMutation.mutate(); }} sx={{ fontSize: '0.875rem', gap: 1 }}>
                                <SimCardDownloadIcon fontSize="small" /> Tải Template
                            </MenuItem>
                        </Menu>
                        <Tooltip title={t("admin.common.close")}>
                            <IconButton onClick={onClose} size="small" sx={{ '&:hover': { backgroundColor: '#f4f6f8' } }}>
                                <CloseIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            onClick={handleCreate}
                            sx={{
                                background: '#1C252E',
                                minHeight: "2.25rem",
                                fontWeight: 700,
                                fontSize: "0.875rem",
                                padding: "6px 16px",
                                borderRadius: "8px",
                                textTransform: "none",
                                boxShadow: "none",
                                "&:hover": {
                                    background: "#454F5B",
                                    boxShadow: "0 8px 16px 0 rgba(145 158 171 / 16%)"
                                }
                            }}
                        >
                            {t("admin.common.add") || "Thêm"}
                        </Button>
                    </Box>

                    <Box sx={{ flex: 1, overflowY: 'auto' }}>
                        {isLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : ageRanges.length === 0 ? (
                            <Typography sx={{ textAlign: 'center', color: '#919EAB', py: 4, fontSize: '0.875rem' }}>
                                {t("admin.product.age_range.no_data")}
                            </Typography>
                        ) : (
                            <List>
                                {ageRanges.map((item: any) => (
                                    <ListItem
                                        key={item.ageRangeId}
                                        sx={{
                                            borderBottom: '1px solid #919eab29',
                                            borderRadius: '8px',
                                            '&:hover': { backgroundColor: '#919eab29' }
                                        }}
                                        secondaryAction={
                                            <Stack direction="row" spacing={0.5}>
                                                <Tooltip title={t("admin.common.edit")}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleEdit(item.ageRangeId)}
                                                        sx={{
                                                            '&:hover': { backgroundColor: 'rgba(99, 115, 129, 0.08)' }
                                                        }}
                                                    >
                                                        <EditIcon sx={{ fontSize: '1.125rem', color: '#637381' }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={t("admin.common.delete")}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDelete(item.ageRangeId)}
                                                        sx={{
                                                            '&:hover': { backgroundColor: 'rgba(255, 86, 48, 0.08)' }
                                                        }}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: '1.125rem', color: '#FF5630' }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        }
                                    >
                                        <ListItemText
                                            primary={item.name}
                                            secondary={item.description}
                                            primaryTypographyProps={{ fontSize: '0.9375rem', fontWeight: 600, color: '#212B36' }}
                                            secondaryTypographyProps={{ fontSize: '0.8125rem' }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>

            {formOpen && (
                <AgeRangeFormDialog
                    open={formOpen}
                    onClose={() => setFormOpen(false)}
                    editId={editId}
                />
            )}
            <ImportExcelModal
                open={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={(file) => importMutation.mutate(file)}
                isPending={importMutation.isPending}
                isSuccess={importMutation.isSuccess}
            />
        </>
    );
};
