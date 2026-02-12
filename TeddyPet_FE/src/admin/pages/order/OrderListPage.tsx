import { ListHeader } from "../../components/ui/ListHeader";
import { OrderList } from "./sections/OrderList";
import { prefixAdmin } from "../../constants/routes";
import { useTranslation } from "react-i18next";

export const OrderListPage = () => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-[32px]">
            <ListHeader
                title="Quản lý đơn hàng"
                breadcrumbItems={[
                    { label: t("admin.dashboard"), to: "/" },
                    { label: "Đơn hàng", to: `/${prefixAdmin}/order/list` },
                    { label: t("admin.common.list") }
                ]}
            />
            <OrderList />
        </div>
    )
}
