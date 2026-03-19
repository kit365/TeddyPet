import { BrandList } from "./sections/BrandList";
import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import { ExportImport } from "../../components/ui/ExportImport";
import { useExportBrandsExcel, useImportBrandsExcel, useDownloadBrandsTemplate, usePreviewBrandImportExcel } from "./hooks/useBrand";
import { EntityImportWizardModal } from "../../components/upload/EntityImportWizardModal";
import { useState } from "react";

export const BrandListPage = () => {
    const [openImportModal, setOpenImportModal] = useState(false);

    const exportMutation = useExportBrandsExcel();
    const importMutation = useImportBrandsExcel();
    const downloadTemplateMutation = useDownloadBrandsTemplate();
    const previewMutation = usePreviewBrandImportExcel();

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

            <EntityImportWizardModal
                open={openImportModal}
                onClose={() => setOpenImportModal(false)}
                onImport={(file) => importMutation.mutate(file)}
                previewMutation={previewMutation}
                isPending={importMutation.isPending}
                isSuccess={importMutation.isSuccess}
                entityName="Thương hiệu"
            />
        </div>
    );
};
