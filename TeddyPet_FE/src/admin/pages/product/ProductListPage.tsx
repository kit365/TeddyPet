import { ListHeader } from "../../components/ui/ListHeader";
import { ProductList } from "./sections/ProductList";
import { prefixAdmin } from "../../constants/routes";
import { useTranslation } from "react-i18next";

export const ProductListPage = () => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-[32px]">
            <ListHeader
                title={t("admin.product.title.list")}
                breadcrumbItems={[
                    { label: t("admin.dashboard"), to: "/" },
                    { label: t("admin.product.title.list"), to: `/${prefixAdmin}/product/list` },
                    { label: t("admin.common.list") }
                ]}
                addButtonLabel={t("admin.product.title.create")}
                addButtonPath={`/${prefixAdmin}/product/create`}
            />
            <ProductList />
        </div>
    )
}