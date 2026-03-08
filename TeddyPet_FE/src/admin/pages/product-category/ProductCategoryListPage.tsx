import { useState } from "react";
import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import { ProductCategoryList } from "./sections/ProductCategoryList";
import { Button, Menu, MenuItem, CircularProgress } from "@mui/material";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DescriptionIcon from '@mui/icons-material/Description';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import SimCardDownloadIcon from '@mui/icons-material/SimCardDownload';
import { useDownloadCategoriesTemplate, useExportCategoriesExcel, useImportCategoriesExcel } from "./hooks/useProductCategory";
import { ImportExcelModal } from "../product/components/ImportExcelModal";

export const ProductCategoryListPage = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const importMutation = useImportCategoriesExcel();
    const exportMutation = useExportCategoriesExcel();
    const templateMutation = useDownloadCategoriesTemplate();

    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleOpenImportModal = () => {
        (document.activeElement as HTMLElement)?.blur();
        handleMenuClose();
        importMutation.reset();
        setIsImportModalOpen(true);
    };

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
                title="Danh mục sản phẩm"
                breadcrumbItems={[
                    { label: "Dashboard", to: "/" },
                    { label: "Danh mục sản phẩm", to: `/${prefixAdmin}/product-category/list` },
                    { label: "Danh sách" }
                ]}
                addButtonLabel="Thêm danh mục"
                addButtonPath={`/${prefixAdmin}/product-category/create`}
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
                                color: '#1C252E',
                                borderColor: 'rgba(145, 158, 171, 0.32)',
                                fontWeight: 600,
                                height: '36px',
                                '&:hover': {
                                    borderColor: '#1C252E',
                                    backgroundColor: 'rgba(28, 37, 46, 0.08)'
                                },
                            }}
                        >
                            Excel
                        </Button>
                        <Menu
                            anchorEl={anchorEl}
                            open={openMenu}
                            onClose={handleMenuClose}
                            PaperProps={{
                                sx: { width: '200px', mt: 1, boxShadow: '0px 2px 8px rgba(0,0,0,0.1)' }
                            }}
                        >
                            <MenuItem onClick={handleOpenImportModal} sx={{ fontSize: '1.4rem', gap: 1 }}>
                                <FileUploadIcon fontSize="small" /> Nhập Excel
                            </MenuItem>
                            <MenuItem onClick={handleExport} sx={{ fontSize: '1.4rem', gap: 1 }}>
                                <FileDownloadIcon fontSize="small" /> Xuất Excel
                            </MenuItem>
                            <MenuItem onClick={handleDownloadTemplate} sx={{ fontSize: '1.4rem', gap: 1 }}>
                                <SimCardDownloadIcon fontSize="small" /> Tải Template
                            </MenuItem>
                        </Menu>
                    </>
                }
            />

            <ProductCategoryList />

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