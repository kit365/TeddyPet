import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import { useTranslation } from "react-i18next";
import { Box, Typography } from "@mui/material";

export const BookingListPage = () => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-[32px]">
            <ListHeader
                title="Quản lý đặt lịch"
                breadcrumbItems={[
                    { label: t("admin.dashboard"), to: "/" },
                    { label: "Đặt lịch", to: `/${prefixAdmin}/booking/list` },
                    { label: t("admin.common.list") },
                ]}
            />
            <Box sx={{ p: 3 }}>
                <Typography>Danh sách đặt lịch — nội dung sẽ được bổ sung.</Typography>
            </Box>
        </div>
    );
};
