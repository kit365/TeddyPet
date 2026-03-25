import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import { ProductAttributeList } from "./sections/ProductAttributeList";
import { ExportImport } from "../../components/ui/ExportImport";
import { ImportExcelModal } from "../product/components/ImportExcelModal";
import { useState } from "react";
import { useDownloadProductAttributesTemplate, useExportProductAttributesExcel, useImportProductAttributesExcel } from "./hooks/useProductAttribute";

export const ProductAttributeListPage = () => {
    const [openImportModal, setOpenImportModal] = useState(false);
    const exportMutation = useExportProductAttributesExcel();
    const importMutation = useImportProductAttributesExcel();
    const templateMutation = useDownloadProductAttributesTemplate();

    return (
        <div className="flex flex-col gap-[16px]">
            <ListHeader
                title="Thuộc tính sản phẩm"
                breadcrumbItems={[
                    { label: "Dashboard", to: "/" },
                    { label: "Sản phẩm", to: `/${prefixAdmin}/product/list` },
                    { label: "Thuộc tính sản phẩm" }
                ]}
                addButtonLabel="Thêm thuộc tính"
                addButtonPath={`/${prefixAdmin}/product-attribute/create`}
                action={
                    <ExportImport
                        onExport={() => exportMutation.mutate()}
                        onImport={() => setOpenImportModal(true)}
                        onDownloadTemplate={() => templateMutation.mutate()}
                        isExporting={exportMutation.isPending}
                        isDownloadingTemplate={templateMutation.isPending}
                    />
                }
            />

            <ProductAttributeList />

            <ImportExcelModal
                open={openImportModal}
                onClose={() => setOpenImportModal(false)}
                onImport={(file) => importMutation.mutate(file)}
                isPending={importMutation.isPending}
                isSuccess={importMutation.isSuccess}
            />
        </div>
    )
}
