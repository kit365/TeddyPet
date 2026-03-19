import { ListHeader } from "../../components/ui/ListHeader";
import { OrderList } from "./sections/OrderList";
import { prefixAdmin } from "../../constants/routes";
import { useTranslation } from "react-i18next";
import { Button, Stack } from "@mui/material";
import { exportOrdersToExcel, importOrdersFromExcel, downloadOrderTemplate } from "../../api/order.api";
import { toast } from "react-toastify";
import { useState } from "react";
import { ImportExcelModal } from "./components/ImportExcelModal";
import AddIcon from "@mui/icons-material/Add";
import { Link } from "react-router-dom";
import { ExportImport } from "../../components/ui/ExportImport";

export const OrderListPage = () => {
    const { t } = useTranslation();
    const [exporting, setExporting] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importSuccess, setImportSuccess] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            await exportOrdersToExcel();
            toast.success("Xuất file đơn hàng thành công!");
        } catch (error) {
            toast.error("Không thể xuất file đơn hàng");
        } finally {
            setExporting(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            await downloadOrderTemplate();
            toast.success("Tải template đơn hàng thành công!");
        } catch (error) {
            toast.error("Không thể tải template đơn hàng");
        }
    };

    const handleImport = async (file: File) => {
        setImporting(true);
        setImportSuccess(false);
        try {
            const response = await importOrdersFromExcel(file);
            if (response.success) {
                toast.success(response.message || "Nhập file đơn hàng thành công!");
                setImportSuccess(true);
                // Force reload order list
                window.location.reload();
            } else {
                toast.error(response.message || "Nhập file thất bại");
            }
        } catch (error: any) {
            toast.error(error.message || "Lỗi hệ thống khi nhập file");
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="flex flex-col">
            <ListHeader
                title="Quản lý đơn hàng"
                breadcrumbItems={[
                    { label: t("admin.dashboard"), to: "/" },
                    { label: "Đơn hàng", to: `/${prefixAdmin}/order/list` },
                    { label: t("admin.common.list") }
                ]}
                action={
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="contained"
                            component={Link}
                            to={`/${prefixAdmin}/order/manual`}
                            startIcon={<AddIcon />}
                            sx={{
                                bgcolor: "#00A76F",
                                borderRadius: "10px",
                                textTransform: "none",
                                fontWeight: 700,
                                fontSize: "0.8125rem",
                                px: 3,
                                py: 1.2,
                                color: "#fff",
                                boxShadow: "0 8px 16px rgba(0, 167, 111, 0.24)",
                                "&:hover": { bgcolor: "#007867" }
                            }}
                        >
                            Tạo đơn mới
                        </Button>
                        <ExportImport
                            onExport={handleExport}
                            onImport={() => setIsImportModalOpen(true)}
                            onDownloadTemplate={handleDownloadTemplate}
                            isExporting={exporting}
                        />
                    </Stack>
                }
            />
            <div className="mt-[32px]">
                <OrderList />
            </div>

            <ImportExcelModal
                open={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImport}
                isPending={importing}
                isSuccess={importSuccess}
            />
        </div>
    )
}
