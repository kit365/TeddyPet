import { ProductList } from "./sections/ProductList";
import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import { useTranslation } from "react-i18next";
import { ExportImport } from "../../components/ui/ExportImport";
import { useExportProducts, useImportProducts, useDownloadProductsTemplate } from "./hooks/useProduct";
import { ImportExcelModal } from "./components/ImportExcelModal";
import { useState } from "react";

export const ProductListPage = () => {
    const { t } = useTranslation();
    const [openImportModal, setOpenImportModal] = useState(false);

    const exportMutation = useExportProducts();
    const importMutation = useImportProducts();
    const downloadTemplateMutation = useDownloadProductsTemplate();

    return (
        <div className="flex flex-col gap-[16px]">
            <ListHeader
                title={t("admin.product.title.list")}
                breadcrumbItems={[
                    { label: t("admin.dashboard"), to: "/" },
                    { label: t("admin.product.title.list") }
                ]}
                addButtonLabel={t("admin.product.title.create")}
                addButtonPath={`/${prefixAdmin}/product/create`}
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

            <ProductList />

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