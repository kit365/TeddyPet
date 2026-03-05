import { ListHeader } from "../../components/ui/ListHeader";
import { ProductList } from "./sections/ProductList";
import { prefixAdmin } from "../../constants/routes";
import { useTranslation } from "react-i18next";
import { Button, CircularProgress, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useState } from "react";
import { useImportProducts, useExportProducts, useDownloadProductsTemplate } from "./hooks/useProduct";
import { ImportExcelModal } from "./components/ImportExcelModal";

export const ProductListPage = () => {
    const { t } = useTranslation();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const importMutation = useImportProducts();
    const exportMutation = useExportProducts();
    const templateMutation = useDownloadProductsTemplate();

    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleOpenImportModal = () => {
        // Blur trước khi mở dialog để tránh warning aria-hidden
        (document.activeElement as HTMLElement)?.blur();
        handleMenuClose();
        importMutation.reset(); // Reset để isSuccess không còn true từ lần trước
        setIsImportModalOpen(true);
    };

    // Hook tự xử lý toast + invalidate cache
    const handleImportFile = (file: File) => {
        importMutation.mutate(file);
    };


    const handleExport = () => {
        handleMenuClose();
        exportMutation.mutate();
    };

    const handleDownloadTemplate = () => {
        handleMenuClose();
        templateMutation.mutate();
    };

    return (
        <div className="flex flex-col gap-[32px]">
            <ListHeader
                title={t("admin.product.title.list")}
                breadcrumbItems={[
                    { label: t("admin.dashboard"), to: "/" },
                    { label: t("admin.product.title.list"), to: `/${prefixAdmin}/product/list` },
                    { label: t("admin.common.list") }
                ]}
                addButtonLabel={t("admin.product.title.create")}
                addButtonPath={`/${prefixAdmin}/product/create`}
                action={
                    <>
                        <Button
                            variant="outlined"
                            onClick={handleMenuClick}
                            endIcon={<ArrowDropDownIcon />}
                            startIcon={
                                (importMutation.isPending || exportMutation.isPending || templateMutation.isPending) ?
                                    <CircularProgress size={20} /> : <DescriptionIcon />
                            }
                            sx={{
                                fontSize: '1.4rem',
                                textTransform: 'none',
                                borderRadius: '8px',
                                fontWeight: 600,
                                color: '#1C252E',
                                borderColor: '#919eab52',
                                bgcolor: 'white',
                                '&:hover': {
                                    bgcolor: '#f4f6f8',
                                    borderColor: '#919eab52',
                                }
                            }}
                        >
                            Nhập / Xuất Excel
                        </Button>
                        <Menu
                            anchorEl={anchorEl}
                            open={openMenu}
                            onClose={handleMenuClose}
                            PaperProps={{
                                sx: {
                                    mt: 1,
                                    boxShadow: '0px 4px 20px rgba(145, 158, 171, 0.16)',
                                    borderRadius: '8px',
                                    minWidth: 180,
                                }
                            }}
                        >
                            <MenuItem onClick={handleOpenImportModal} sx={{ py: 1.5 }}>
                                <ListItemIcon>
                                    <FileUploadIcon fontSize="medium" color="primary" />
                                </ListItemIcon>
                                <ListItemText primaryTypographyProps={{ fontSize: '1.4rem', fontWeight: 500 }}>
                                    Nhập Dữ Liệu
                                </ListItemText>
                            </MenuItem>

                            <MenuItem onClick={handleExport} disabled={exportMutation.isPending} sx={{ py: 1.5, '&.Mui-disabled': { opacity: 1 }, '&.Mui-disabled .MuiListItemIcon-root': { color: 'action.disabled' }, '&.Mui-disabled .MuiTypography-root': { color: 'text.disabled' } }}>
                                <ListItemIcon>
                                    {exportMutation.isPending ? <CircularProgress size={24} /> : <FileDownloadIcon fontSize="medium" color="info" />}
                                </ListItemIcon>
                                <ListItemText primaryTypographyProps={{ fontSize: '1.4rem', fontWeight: 500 }}>
                                    Xuất Dữ Liệu
                                </ListItemText>
                            </MenuItem>

                            <MenuItem onClick={handleDownloadTemplate} disabled={templateMutation.isPending} sx={{ py: 1.5, '&.Mui-disabled': { opacity: 1 }, '&.Mui-disabled .MuiListItemIcon-root': { color: 'action.disabled' }, '&.Mui-disabled .MuiTypography-root': { color: 'text.disabled' } }}>
                                <ListItemIcon>
                                    {templateMutation.isPending ? <CircularProgress size={24} /> : <DescriptionIcon fontSize="medium" color="action" />}
                                </ListItemIcon>
                                <ListItemText primaryTypographyProps={{ fontSize: '1.4rem', fontWeight: 500 }}>
                                    Tải Template
                                </ListItemText>
                            </MenuItem>
                        </Menu>
                    </>
                }
            />
            <ProductList />
            <ImportExcelModal
                open={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImportFile}
                isPending={importMutation.isPending}
                isSuccess={importMutation.isSuccess}
            />
        </div>
    )
}