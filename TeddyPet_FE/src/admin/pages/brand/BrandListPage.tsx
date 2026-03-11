import { BrandList } from "./sections/BrandList";
import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import { ExportImport } from "../../components/ui/ExportImport";
import { useExportBrandsExcel, useImportBrandsExcel, useDownloadBrandsTemplate } from "./hooks/useBrand";
import { ImportExcelModal } from "../product/components/ImportExcelModal";
import { useState } from "react";

export const BrandListPage = () => {
    const [openImportModal, setOpenImportModal] = useState(false);

    const exportMutation = useExportBrandsExcel();
    const importMutation = useImportBrandsExcel();
    const downloadTemplateMutation = useDownloadBrandsTemplate();

    return (
        <div className="flex flex-col gap-[16px]">
            <ListHeader
                title="Thương hiệu"
                breadcrumbItems={[
                    { label: "Dashboard", to: "/" },
                    { label: "Sản phẩm", to: `/${prefixAdmin}/product/list` },
                    { label: "Thương hiệu" }
                ]}
                addButtonLabel="Thêm thương hiệu"
                addButtonPath={`/${prefixAdmin}/brand/create`}
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

            <BrandList />

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
