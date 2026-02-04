import { useParams } from "react-router-dom";
import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import { useTranslation } from "react-i18next";
import { Card, Typography, Stack } from "@mui/material";

export const OrderDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const { t } = useTranslation();

    return (
        <>
            <ListHeader
                title={`Chi tiết đơn hàng #${id?.substring(0, 8)}`}
                breadcrumbItems={[
                    { label: t("admin.dashboard"), to: "/" },
                    { label: "Đơn hàng", to: `/${prefixAdmin}/order/list` },
                    { label: "Chi tiết" }
                ]}
            />

            <Card sx={{ p: 4, borderRadius: '16px' }}>
                <Typography variant="h5" gutterBottom>Đang phát triển...</Typography>
                <Stack spacing={2}>
                    <Typography>ID đơn hàng: {id}</Typography>
                    <Typography color="text.secondary">
                        Trang chi tiết đơn hàng đang được xây dựng. Bạn có thể xem danh sách đơn hàng ở trang trước.
                    </Typography>
                </Stack>
            </Card>
        </>
    )
}
