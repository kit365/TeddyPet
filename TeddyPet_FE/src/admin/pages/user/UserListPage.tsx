import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import { UserList } from "./sections/UserList";
import { ExportImport } from "../../components/ui/ExportImport";
import { EntityImportWizardModal } from "../../components/upload/EntityImportWizardModal";
import {
    useExportUsersExcel,
    useImportUsersExcel,
    useDownloadUsersTemplate,
    usePreviewUsersImportExcel,
} from "./hooks/useUser";
import { useState } from "react";

export const UserListPage = () => {
    const [openImportModal, setOpenImportModal] = useState(false);

    const exportMutation = useExportUsersExcel();
    const importMutation = useImportUsersExcel();
    const downloadTemplateMutation = useDownloadUsersTemplate();
    const previewMutation = usePreviewUsersImportExcel();

    return (
        <div className="flex flex-col gap-[16px]">
            <ListHeader
                title="Người dùng"
                breadcrumbItems={[
                    { label: "Dashboard", to: "/" },
                    { label: "Người dùng", to: `/${prefixAdmin}/user/list` },
                    { label: "Danh sách" }
                ]}
                addButtonLabel="Tạo tài khoản"
                addButtonPath={`/${prefixAdmin}/user/create`}
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
            <UserList />

            <EntityImportWizardModal
                open={openImportModal}
                onClose={() => setOpenImportModal(false)}
                onImport={(file) => importMutation.mutate(file)}
                previewMutation={previewMutation}
                isPending={importMutation.isPending}
                isSuccess={importMutation.isSuccess}
                entityName="Người dùng"
            />
        </div>
    );
};
