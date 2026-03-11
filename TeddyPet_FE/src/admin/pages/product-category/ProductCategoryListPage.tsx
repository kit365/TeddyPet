import { ProductCategoryList } from "./sections/ProductCategoryList";
import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import { ExportImport } from "../../components/ui/ExportImport";
import { useExportCategoriesExcel, useImportCategoriesExcel, useDownloadCategoriesTemplate } from "./hooks/useProductCategory";
import { ImportExcelModal } from "../product/components/ImportExcelModal";
import { useState } from "react";

export const ProductCategoryListPage = () => {
    const [openImportModal, setOpenImportModal] = useState(false);

    const exportMutation = useExportCategoriesExcel();
    const importMutation = useImportCategoriesExcel();
    const downloadTemplateMutation = useDownloadCategoriesTemplate();

    return (
        <div className="flex flex-col gap-[16px]">
            <ListHeader
                title="Danh mục sản phẩm"
                breadcrumbItems={[
                    { label: "Dashboard", to: "/" },
                    { label: "Sản phẩm", to: `/${prefixAdmin}/product/list` },
                    { label: "Danh mục sản phẩm" }
                ]}
                addButtonLabel="Thêm danh mục"
                addButtonPath={`/${prefixAdmin}/product-category/create`}
                action={
                    <ExportImport
                        onExport={() => exportMutation.mutate()}
                        onImport={() => setOpenImportModal(true)}
                        onDownloadTemplate={() => downloadTemplateMutation.mutate()}
                        isExporting={exportMutation.isPending}
                        isDownloadingTemplate={downloadTemplateMutation.isPending}
                    />
                }
            />

            <ProductCategoryList />

            <ImportExcelModal
                open={openImportModal}
                onClose={() => setOpenImportModal(false)}
                onImport={(file) => importMutation.mutate(file)}
                isPending={importMutation.isPending}
                isSuccess={importMutation.isSuccess}
            />
        </div>
    );
};