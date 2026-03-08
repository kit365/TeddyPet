import { ListHeader } from "../../components/ui/ListHeader";
import { OrderList } from "./sections/OrderList";
import { prefixAdmin } from "../../constants/routes";
import { useTranslation } from "react-i18next";
import { Button } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { exportOrdersToExcel } from "../../api/order.api";
import { toast } from "react-toastify";
import { useState } from "react";

export const OrderListPage = () => {
    const { t } = useTranslation();
    const [exporting, setExporting] = useState(false);

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
                    <Button
                        variant="contained"
                        startIcon={<FileDownloadIcon />}
                        onClick={handleExport}
                        disabled={exporting}
                        sx={{
                            bgcolor: "#1C252E",
                            borderRadius: "10px",
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "1.3rem",
                            px: 3,
                            py: 1.2,
                            boxShadow: "0 8px 16px rgba(28, 37, 46, 0.24)",
                            "&:hover": { bgcolor: "#454F5B" }
                        }}
                    >
                        {exporting ? "Đang xuất..." : "Xuất Excel"}
                    </Button>
                }
            />
            <div className="mt-[32px]">
                <OrderList />
            </div>
        </div>
    )
}
